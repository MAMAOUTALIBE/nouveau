"""Service métier — Personnel (agents, affectations).

Le scoring turnover est délégué à `app.services.turnover_service`
(modèle explicable rules-v1).
"""

from __future__ import annotations

from datetime import date
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.core.security.rbac import AuthenticatedUser
from app.models.document import Document, DocumentType
from app.models.employee import Employee, EmployeeAssignment
from app.models.organization import Direction, Organization, Unit
from app.schemas.personnel import (
    AgentCreateRequest,
    AgentListItem,
    AgentResponse,
    AgentUpdateRequest,
    AssignmentCreateRequest,
    AssignmentResponse,
    DossierResponse,
)


def add_years(value: date, years: int) -> date:
    """Ajoute `years` années à une date en gérant le 29 février."""
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        return value.replace(year=value.year + years, month=2, day=28)


def _agent_to_dto(emp: Employee) -> AgentResponse:
    return AgentResponse(
        employee_id=emp.employee_id,
        matricule=emp.matricule,
        full_name=emp.full_name,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=str(emp.email) if emp.email else None,
        phone=emp.phone,
        direction_id=emp.direction_id,
        unit_id=emp.unit_id,
        position_id=emp.position_id,
        manager_employee_id=emp.manager_employee_id,
        employment_status=emp.employment_status,
        contract_type=emp.contract_type,
        hire_date=emp.hire_date,
        exit_date=emp.exit_date,
        birth_date=emp.birth_date,
        contract_end_date=emp.contract_end_date,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
        metadata=emp.employee_metadata,
    )


def _agent_to_list_item(emp: Employee, retirement_age: int | None = None) -> AgentListItem:
    retirement_date: date | None = None
    if retirement_age is not None and emp.birth_date is not None:
        retirement_date = add_years(emp.birth_date, retirement_age)
    return AgentListItem(
        employee_id=emp.employee_id,
        matricule=emp.matricule,
        full_name=emp.full_name,
        first_name=emp.first_name,
        last_name=emp.last_name,
        email=str(emp.email) if emp.email else None,
        phone=emp.phone,
        direction_id=emp.direction_id,
        unit_id=emp.unit_id,
        position_id=emp.position_id,
        manager_employee_id=emp.manager_employee_id,
        employment_status=emp.employment_status,
        contract_type=emp.contract_type,
        hire_date=emp.hire_date,
        exit_date=emp.exit_date,
        birth_date=emp.birth_date,
        contract_end_date=emp.contract_end_date,
        retirement_date=retirement_date,
        created_at=emp.created_at,
        updated_at=emp.updated_at,
    )


def _scope_employee_query(query, user: AuthenticatedUser):  # type: ignore[no-untyped-def]
    """Restreint la liste d'agents au scope RBAC de l'utilisateur."""
    if user.has_scope("GLOBAL"):
        return query
    if user.has_scope("DIRECTION") and user.direction_id is not None:
        return query.where(Employee.direction_id == user.direction_id)
    if user.has_scope("UNIT") and user.unit_id is not None:
        return query.where(Employee.unit_id == user.unit_id)
    # SELF — sans liaison user→employee on ne renvoie rien
    return query.where(Employee.employee_id.is_(None))


# ============================================================================
# Agents (CRUD)
# ============================================================================
async def list_agents(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user: AuthenticatedUser,
    page: int = 1,
    page_size: int = 50,
    status: str | None = None,
    direction_id: UUID | None = None,
    unit_id: UUID | None = None,
    search: str | None = None,
) -> tuple[list[AgentListItem], int]:
    base = select(Employee).where(Employee.organization_id == organization_id)

    if status:
        base = base.where(Employee.employment_status == status)
    if direction_id:
        base = base.where(Employee.direction_id == direction_id)
    if unit_id:
        base = base.where(Employee.unit_id == unit_id)
    if search:
        like = f"%{search}%"
        base = base.where(Employee.full_name.ilike(like) | Employee.matricule.ilike(like))

    base = _scope_employee_query(base, user)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    page_stmt = base.order_by(Employee.full_name).offset((page - 1) * page_size).limit(page_size)
    rows = (await session.execute(page_stmt)).scalars().all()

    retirement_age = (
        await session.execute(
            select(Organization.retirement_age).where(
                Organization.organization_id == organization_id
            )
        )
    ).scalar_one_or_none()

    return [_agent_to_list_item(e, retirement_age) for e in rows], int(total)


async def _load_agent(session: AsyncSession, employee_id: UUID) -> Employee:
    stmt = select(Employee).where(Employee.employee_id == employee_id)
    emp = (await session.execute(stmt)).scalar_one_or_none()
    if emp is None:
        raise NotFoundError("Agent introuvable.", code="AGENT_NOT_FOUND")
    return emp


async def get_agent(
    session: AsyncSession, *, employee_id: UUID, user: AuthenticatedUser
) -> AgentResponse:
    emp = await _load_agent(session, employee_id)
    # Scope check
    if not (
        user.has_scope("GLOBAL")
        or (user.has_scope("DIRECTION") and user.direction_id == emp.direction_id)
        or (user.has_scope("UNIT") and user.unit_id == emp.unit_id)
    ):
        raise NotFoundError("Agent introuvable.", code="AGENT_NOT_FOUND")
    return _agent_to_dto(emp)


async def create_agent(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: AgentCreateRequest,
    audit: AuditWriter,
) -> AgentResponse:
    # Unicité du matricule
    existing = (
        await session.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.matricule == body.matricule,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Matricule '{body.matricule}' déjà utilisé.",
            code="MATRICULE_TAKEN",
        )

    emp = Employee(
        organization_id=organization_id,
        matricule=body.matricule,
        full_name=body.full_name,
        first_name=body.first_name,
        last_name=body.last_name,
        national_id=body.national_id,
        email=body.email,
        phone=body.phone,
        direction_id=body.direction_id,
        unit_id=body.unit_id,
        position_id=body.position_id,
        manager_employee_id=body.manager_employee_id,
        employment_status=body.employment_status,
        contract_type=body.contract_type,
        hire_date=body.hire_date,
        birth_date=body.birth_date,
        contract_end_date=body.contract_end_date,
        employee_metadata=body.metadata,
    )
    session.add(emp)
    await session.flush([emp])

    await audit.record(
        action="AGENT_CREATED",
        target_type="employee",
        target_id=str(emp.employee_id),
        after={
            "matricule": body.matricule,
            "full_name": body.full_name,
            "direction_id": str(body.direction_id) if body.direction_id else None,
            "employment_status": body.employment_status,
        },
    )
    return _agent_to_dto(emp)


async def update_agent(
    session: AsyncSession,
    *,
    employee_id: UUID,
    body: AgentUpdateRequest,
    audit: AuditWriter,
) -> AgentResponse:
    emp = await _load_agent(session, employee_id)
    before = {
        "full_name": emp.full_name,
        "employment_status": emp.employment_status,
        "direction_id": str(emp.direction_id) if emp.direction_id else None,
        "unit_id": str(emp.unit_id) if emp.unit_id else None,
        "position_id": str(emp.position_id) if emp.position_id else None,
    }

    for field in (
        "full_name",
        "first_name",
        "last_name",
        "email",
        "phone",
        "direction_id",
        "unit_id",
        "position_id",
        "manager_employee_id",
        "employment_status",
        "contract_type",
        "hire_date",
        "exit_date",
        "birth_date",
        "contract_end_date",
    ):
        value = getattr(body, field)
        if value is not None:
            setattr(emp, field, value)
    if body.metadata is not None:
        emp.employee_metadata = body.metadata

    await audit.record(
        action="AGENT_UPDATED",
        target_type="employee",
        target_id=str(emp.employee_id),
        before=before,
        after={
            "full_name": emp.full_name,
            "employment_status": emp.employment_status,
            "direction_id": str(emp.direction_id) if emp.direction_id else None,
            "unit_id": str(emp.unit_id) if emp.unit_id else None,
            "position_id": str(emp.position_id) if emp.position_id else None,
        },
    )
    await session.flush()
    # `updated_at` (onupdate SQL) est expiré après le flush : on recharge
    # explicitement en contexte async avant de sérialiser la réponse.
    await session.refresh(emp)
    return _agent_to_dto(emp)


# ============================================================================
# Affectations
# ============================================================================
_ASSIGNMENT_STATUS_LABELS: dict[str, str] = {
    "PLANNED": "Planifiée",
    "ACTIVE": "Active",
    "ENDED": "Terminée",
    "CANCELLED": "Annulée",
}


def _assignment_to_response(
    assignment: EmployeeAssignment,
    employee: Employee | None,
    direction: Direction | None,
    unit: Unit | None,
) -> AssignmentResponse:
    """Construit la réponse enrichie d'une affectation (libellés résolus)."""
    direction_name = direction.name if direction is not None else "Primature"
    unit_name = unit.name if unit is not None else direction_name
    return AssignmentResponse(
        assignment_id=assignment.assignment_id,
        reference=f"AFF-{str(assignment.assignment_id)[:8].upper()}",
        agent_id=assignment.employee_id,
        agent_name=employee.full_name if employee is not None else "—",
        from_unit=direction_name,
        to_unit=unit_name,
        effective_date=assignment.effective_start,
        effective_end=assignment.effective_end,
        status=_ASSIGNMENT_STATUS_LABELS.get(
            assignment.assignment_status, assignment.assignment_status
        ),
    )


async def list_assignments(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee_id: UUID | None = None,
) -> list[AssignmentResponse]:
    stmt = (
        select(EmployeeAssignment, Employee, Direction, Unit)
        .join(Employee, Employee.employee_id == EmployeeAssignment.employee_id)
        .outerjoin(Direction, Direction.direction_id == EmployeeAssignment.direction_id)
        .outerjoin(Unit, Unit.unit_id == EmployeeAssignment.unit_id)
        .where(EmployeeAssignment.organization_id == organization_id)
    )
    if employee_id:
        stmt = stmt.where(EmployeeAssignment.employee_id == employee_id)
    stmt = stmt.order_by(EmployeeAssignment.effective_start.desc())

    rows = (await session.execute(stmt)).all()
    return [
        _assignment_to_response(assignment, employee, direction, unit)
        for assignment, employee, direction, unit in rows
    ]


async def create_assignment(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: AssignmentCreateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> AssignmentResponse:
    assignment = EmployeeAssignment(
        organization_id=organization_id,
        employee_id=body.employee_id,
        direction_id=body.direction_id,
        unit_id=body.unit_id,
        position_id=body.position_id,
        assignment_status=body.assignment_status,
        effective_start=body.effective_start,
        effective_end=body.effective_end,
        created_by_user_id=actor_user_id,
    )
    session.add(assignment)
    await session.flush([assignment])

    await audit.record(
        action="AGENT_ASSIGNMENT_CREATED",
        target_type="assignment",
        target_id=str(assignment.assignment_id),
        after={
            "employee_id": str(body.employee_id),
            "direction_id": str(body.direction_id) if body.direction_id else None,
            "unit_id": str(body.unit_id) if body.unit_id else None,
            "position_id": str(body.position_id) if body.position_id else None,
            "effective_start": body.effective_start.isoformat(),
        },
    )

    employee = await session.get(Employee, assignment.employee_id)
    direction = (
        await session.get(Direction, assignment.direction_id)
        if assignment.direction_id is not None
        else None
    )
    unit = (
        await session.get(Unit, assignment.unit_id) if assignment.unit_id is not None else None
    )
    return _assignment_to_response(assignment, employee, direction, unit)


# ============================================================================
# Dossiers administratifs (documents rattachés aux agents)
# ============================================================================
_DOCUMENT_STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Brouillon",
    "IN_VALIDATION": "En validation",
    "VALIDATED": "Validé",
    "PUBLISHED": "Publié",
    "ARCHIVED": "Archivé",
}


async def list_dossiers(
    session: AsyncSession,
    *,
    organization_id: UUID,
) -> list[DossierResponse]:
    """Liste les dossiers administratifs — documents rattachés aux agents."""
    stmt = (
        select(Document, Employee, DocumentType)
        .outerjoin(Employee, Employee.employee_id == Document.employee_id)
        .outerjoin(DocumentType, DocumentType.document_type_id == Document.document_type_id)
        .where(Document.organization_id == organization_id)
        .order_by(Document.updated_at.desc())
    )
    rows = (await session.execute(stmt)).all()
    return [
        DossierResponse(
            reference=document.reference,
            agent_id=document.employee_id,
            agent_name=(
                employee.full_name if employee is not None else (document.owner_label or "—")
            ),
            type=document_type.label if document_type is not None else document.document_type,
            status=_DOCUMENT_STATUS_LABELS.get(
                document.document_status, document.document_status
            ),
            updated_at=document.updated_at,
        )
        for document, employee, document_type in rows
    ]
