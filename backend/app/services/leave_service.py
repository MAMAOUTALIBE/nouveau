"""Service métier — domaine Congés.

Implémente les règles RBAC scopées :
- agent  : voit/gère uniquement ses propres demandes (scope SELF).
- manager: voit/valide les demandes de son périmètre (DIRECTION/UNIT).
- hr_manager / super_admin : voit tout, peut valider niveau 2.

V0/V1 : auto-approbation conditionnelle non câblée (PY-035 vague 3).
La décision ici reste manuelle ; les hooks d'auto-approbation viendront
plus tard via `LeaveAutoApprovalService` qui appellera `decide()`.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import (
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
)
from app.core.security.rbac import AuthenticatedUser
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.schemas.leave import (
    LeaveBalanceResponse,
    LeaveBalanceUpsertRequest,
    LeaveCalendarEvent,
    LeaveDecisionRequest,
    LeaveRequestCreateRequest,
    LeaveRequestResponse,
    LeaveTypeResponse,
)


# ============================================================================
# Helpers
# ============================================================================
def _duration_days(start: object, end: object) -> int:
    """Nombre de jours calendaires inclusifs (start..end)."""
    from datetime import date as date_t

    if not isinstance(start, date_t) or not isinstance(end, date_t):
        return 0
    return (end - start).days + 1


def _leave_request_to_dto(
    request: LeaveRequest, *, leave_type_code: str | None = None
) -> LeaveRequestResponse:
    return LeaveRequestResponse(
        leave_request_id=request.leave_request_id,
        organization_id=request.organization_id,
        reference=request.reference,
        employee_id=request.employee_id,
        leave_type_id=request.leave_type_id,
        leave_type_code=leave_type_code,
        request_status=request.request_status,
        start_date=request.start_date,
        end_date=request.end_date,
        duration_days=_duration_days(request.start_date, request.end_date),
        reason=request.reason,
        submitted_at=request.submitted_at,
        decided_at=request.decided_at,
        decided_by_user_id=request.decided_by_user_id,
        decision_comment=request.decision_comment,
        workflow_instance_id=request.workflow_instance_id,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )


def _employee_in_user_scope(user: AuthenticatedUser, employee: Employee) -> bool:
    """Détermine si l'employé est dans le périmètre RBAC de l'utilisateur."""
    if user.has_scope("GLOBAL"):
        return True
    if user.has_scope("DIRECTION") and user.direction_id == employee.direction_id:
        return True
    return user.has_scope("UNIT") and user.unit_id == employee.unit_id


def _scope_query(query, user: AuthenticatedUser):  # type: ignore[no-untyped-def]
    """Restreint la requête au périmètre de l'utilisateur.

    - GLOBAL → aucune restriction.
    - DIRECTION → filtre sur la direction de l'utilisateur (via employees).
    - UNIT → filtre sur l'unité.
    - SELF → filtre sur les demandes appartenant à un employé du même
            organization (scope par défaut côté agent ; le matching
            précis user→employee sera renforcé en vague 3 via
            user.employee_id).

    L'agent qui n'a pas son propre `employee_id` lié ne voit rien (V1).
    """
    if user.has_scope("GLOBAL"):
        return query

    if user.has_scope("DIRECTION") and user.direction_id is not None:
        return query.join(Employee, Employee.employee_id == LeaveRequest.employee_id).where(
            Employee.direction_id == user.direction_id
        )

    if user.has_scope("UNIT") and user.unit_id is not None:
        return query.join(Employee, Employee.employee_id == LeaveRequest.employee_id).where(
            Employee.unit_id == user.unit_id
        )

    # SELF — sans liaison user↔employee en V1, on ne renvoie rien
    return query.where(LeaveRequest.employee_id.is_(None))


# ============================================================================
# Leave types
# ============================================================================
async def list_leave_types(
    session: AsyncSession, *, organization_id: UUID
) -> list[LeaveTypeResponse]:
    stmt = (
        select(LeaveType)
        .where(LeaveType.organization_id == organization_id)
        .order_by(LeaveType.code)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [LeaveTypeResponse.model_validate(r) for r in rows]


# ============================================================================
# Leave balances
# ============================================================================
async def list_balances(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee_id: UUID | None = None,
    fiscal_year: int | None = None,
    user: AuthenticatedUser,
) -> list[LeaveBalanceResponse]:
    base = (
        select(LeaveBalance, LeaveType.code)
        .join(LeaveType, LeaveType.leave_type_id == LeaveBalance.leave_type_id)
        .where(LeaveBalance.organization_id == organization_id)
    )

    if employee_id is not None:
        base = base.where(LeaveBalance.employee_id == employee_id)
    if fiscal_year is not None:
        base = base.where(LeaveBalance.fiscal_year == fiscal_year)

    # Scope (manager filtre sur sa direction)
    if not user.has_scope("GLOBAL"):
        if user.has_scope("DIRECTION") and user.direction_id is not None:
            base = base.join(Employee, Employee.employee_id == LeaveBalance.employee_id).where(
                Employee.direction_id == user.direction_id
            )
        elif user.has_scope("UNIT") and user.unit_id is not None:
            base = base.join(Employee, Employee.employee_id == LeaveBalance.employee_id).where(
                Employee.unit_id == user.unit_id
            )
        else:
            base = base.where(LeaveBalance.employee_id.is_(None))

    rows = (await session.execute(base)).all()
    out: list[LeaveBalanceResponse] = []
    for balance, code in rows:
        out.append(
            LeaveBalanceResponse(
                leave_balance_id=balance.leave_balance_id,
                employee_id=balance.employee_id,
                leave_type_id=balance.leave_type_id,
                leave_type_code=code,
                fiscal_year=balance.fiscal_year,
                allocated_days=balance.allocated_days,
                consumed_days=balance.consumed_days,
                remaining_days=balance.remaining_days,
                updated_at=balance.updated_at,
            )
        )
    return out


async def upsert_balance(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: LeaveBalanceUpsertRequest,
    audit: AuditWriter,
) -> LeaveBalanceResponse:
    stmt = select(LeaveBalance).where(
        LeaveBalance.employee_id == body.employee_id,
        LeaveBalance.leave_type_id == body.leave_type_id,
        LeaveBalance.fiscal_year == body.fiscal_year,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()

    is_create = existing is None
    if existing is None:
        existing = LeaveBalance(
            organization_id=organization_id,
            employee_id=body.employee_id,
            leave_type_id=body.leave_type_id,
            fiscal_year=body.fiscal_year,
            allocated_days=body.allocated_days,
            consumed_days=body.consumed_days,
        )
        session.add(existing)
    else:
        existing.allocated_days = body.allocated_days
        existing.consumed_days = body.consumed_days

    await session.flush([existing])

    await audit.record(
        action="LEAVE_BALANCE_CREATED" if is_create else "LEAVE_BALANCE_UPDATED",
        target_type="leave_balance",
        target_id=str(existing.leave_balance_id),
        after={
            "employee_id": str(body.employee_id),
            "leave_type_id": str(body.leave_type_id),
            "fiscal_year": body.fiscal_year,
            "allocated_days": str(body.allocated_days),
            "consumed_days": str(body.consumed_days),
        },
    )

    type_code = (
        await session.execute(
            select(LeaveType.code).where(LeaveType.leave_type_id == body.leave_type_id)
        )
    ).scalar_one_or_none()

    return LeaveBalanceResponse(
        leave_balance_id=existing.leave_balance_id,
        employee_id=existing.employee_id,
        leave_type_id=existing.leave_type_id,
        leave_type_code=type_code,
        fiscal_year=existing.fiscal_year,
        allocated_days=existing.allocated_days,
        consumed_days=existing.consumed_days,
        remaining_days=existing.remaining_days,
        updated_at=existing.updated_at,
    )


# ============================================================================
# Leave requests
# ============================================================================
async def list_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user: AuthenticatedUser,
    page: int = 1,
    page_size: int = 50,
    status: str | None = None,
    employee_id: UUID | None = None,
    leave_type_id: UUID | None = None,
) -> tuple[list[LeaveRequestResponse], int]:
    base = (
        select(LeaveRequest, LeaveType.code)
        .join(LeaveType, LeaveType.leave_type_id == LeaveRequest.leave_type_id)
        .where(LeaveRequest.organization_id == organization_id)
    )

    if status:
        base = base.where(LeaveRequest.request_status == status)
    if employee_id:
        base = base.where(LeaveRequest.employee_id == employee_id)
    if leave_type_id:
        base = base.where(LeaveRequest.leave_type_id == leave_type_id)

    base = _scope_query(base, user)

    # Total — sur la même base scopée
    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    # Page
    page_stmt = (
        base.order_by(LeaveRequest.start_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).all()
    items = [_leave_request_to_dto(req, leave_type_code=code) for req, code in rows]
    return items, int(total)


async def _next_reference(session: AsyncSession, organization_id: UUID) -> str:
    """Génère une référence séquentielle CONGE-YYYY-NNNN."""
    from datetime import date as date_t

    year = date_t.today().year
    prefix = f"CONGE-{year}-"
    stmt = (
        select(func.count())
        .select_from(LeaveRequest)
        .where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.reference.startswith(prefix),
        )
    )
    count = (await session.execute(stmt)).scalar_one()
    return f"{prefix}{int(count) + 1:04d}"


async def create_request(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: LeaveRequestCreateRequest,
    audit: AuditWriter,
) -> LeaveRequestResponse:
    # Vérifie que l'employé existe
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == body.employee_id))
    ).scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employé introuvable.", code="EMPLOYEE_NOT_FOUND")

    # Vérifie le leave_type
    leave_type = (
        await session.execute(
            select(LeaveType).where(LeaveType.leave_type_id == body.leave_type_id)
        )
    ).scalar_one_or_none()
    if leave_type is None:
        raise NotFoundError("Type de congé inconnu.", code="LEAVE_TYPE_NOT_FOUND")

    reference = await _next_reference(session, organization_id)

    request = LeaveRequest(
        organization_id=organization_id,
        reference=reference,
        employee_id=body.employee_id,
        leave_type_id=body.leave_type_id,
        request_status="PENDING",
        start_date=body.start_date,
        end_date=body.end_date,
        reason=body.reason,
    )
    session.add(request)
    await session.flush([request])

    await audit.record(
        action="LEAVE_REQUEST_CREATED",
        target_type="leave_request",
        target_id=str(request.leave_request_id),
        after={
            "reference": reference,
            "employee_id": str(body.employee_id),
            "leave_type_id": str(body.leave_type_id),
            "start_date": body.start_date.isoformat(),
            "end_date": body.end_date.isoformat(),
            "duration_days": _duration_days(body.start_date, body.end_date),
        },
    )

    return _leave_request_to_dto(request, leave_type_code=leave_type.code)


async def _load_request(
    session: AsyncSession, leave_request_id: UUID
) -> tuple[LeaveRequest, str | None]:
    stmt = (
        select(LeaveRequest, LeaveType.code)
        .join(LeaveType, LeaveType.leave_type_id == LeaveRequest.leave_type_id)
        .where(LeaveRequest.leave_request_id == leave_request_id)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        raise NotFoundError("Demande introuvable.", code="LEAVE_REQUEST_NOT_FOUND")
    return row[0], row[1]


async def get_request(
    session: AsyncSession,
    *,
    leave_request_id: UUID,
    user: AuthenticatedUser,
) -> LeaveRequestResponse:
    request, code = await _load_request(session, leave_request_id)
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == request.employee_id))
    ).scalar_one()
    if not _employee_in_user_scope(user, employee):
        raise ForbiddenError("Demande hors de votre périmètre.", code="OUT_OF_SCOPE")
    return _leave_request_to_dto(request, leave_type_code=code)


async def decide_request(
    session: AsyncSession,
    *,
    leave_request_id: UUID,
    decision: LeaveDecisionRequest,
    decided_by: AuthenticatedUser,
    audit: AuditWriter,
) -> LeaveRequestResponse:
    request, code = await _load_request(session, leave_request_id)
    if request.request_status not in ("PENDING", "IN_REVIEW"):
        raise ConflictError(
            f"Décision impossible : statut courant '{request.request_status}'.",
            code="LEAVE_NOT_PENDING",
        )
    # Le manager ne peut décider que de son périmètre
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == request.employee_id))
    ).scalar_one()
    if not _employee_in_user_scope(decided_by, employee):
        raise ForbiddenError("Décision hors de votre périmètre.", code="OUT_OF_SCOPE")

    before = {
        "request_status": request.request_status,
        "decision_comment": request.decision_comment,
    }
    request.request_status = decision.decision
    request.decided_at = datetime.now(tz=UTC)
    request.decided_by_user_id = decided_by.user_id
    request.decision_comment = decision.comment

    await audit.record(
        action=(
            "LEAVE_REQUEST_APPROVED"
            if decision.decision == "APPROVED"
            else "LEAVE_REQUEST_REJECTED"
        ),
        target_type="leave_request",
        target_id=str(request.leave_request_id),
        before=before,
        after={
            "request_status": request.request_status,
            "decision_comment": request.decision_comment,
        },
    )
    return _leave_request_to_dto(request, leave_type_code=code)


async def cancel_request(
    session: AsyncSession,
    *,
    leave_request_id: UUID,
    user: AuthenticatedUser,
    reason: str | None,
    audit: AuditWriter,
) -> LeaveRequestResponse:
    request, code = await _load_request(session, leave_request_id)
    if request.request_status in ("CANCELLED", "REJECTED"):
        raise ConflictError(f"Demande déjà {request.request_status}.", code="LEAVE_ALREADY_CLOSED")

    # Un agent peut annuler sa propre demande ; un manager ou hr_manager
    # peut annuler une demande de son périmètre.
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == request.employee_id))
    ).scalar_one()
    if not _employee_in_user_scope(user, employee):
        raise ForbiddenError("Annulation hors de votre périmètre.", code="OUT_OF_SCOPE")

    before = {"request_status": request.request_status}
    request.request_status = "CANCELLED"
    request.decision_comment = reason

    await audit.record(
        action="LEAVE_REQUEST_CANCELLED",
        target_type="leave_request",
        target_id=str(request.leave_request_id),
        before=before,
        after={"request_status": "CANCELLED", "reason": reason},
    )
    return _leave_request_to_dto(request, leave_type_code=code)


# ============================================================================
# Calendar
# ============================================================================
_STATUS_COLORS: dict[str, str] = {
    "APPROVED": "#2ecc71",
    "PENDING": "#f1c40f",
    "IN_REVIEW": "#e67e22",
    "REJECTED": "#e74c3c",
    "CANCELLED": "#95a5a6",
}


async def list_calendar_events(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user: AuthenticatedUser,
    from_date: object,
    to_date: object,
) -> list[LeaveCalendarEvent]:
    """Renvoie les demandes APPROVED ou PENDING dans la fenêtre, format calendrier."""
    from datetime import date as date_t

    if not (isinstance(from_date, date_t) and isinstance(to_date, date_t)):
        raise ValidationError("from / to doivent être des dates.")

    base = (
        select(LeaveRequest, LeaveType.code, Employee.full_name)
        .join(LeaveType, LeaveType.leave_type_id == LeaveRequest.leave_type_id)
        .join(Employee, Employee.employee_id == LeaveRequest.employee_id)
        .where(
            LeaveRequest.organization_id == organization_id,
            LeaveRequest.start_date <= to_date,
            LeaveRequest.end_date >= from_date,
            LeaveRequest.request_status.in_(["APPROVED", "PENDING", "IN_REVIEW"]),
        )
    )
    base = _scope_query(base, user)

    rows = (await session.execute(base)).all()
    events: list[LeaveCalendarEvent] = []
    for req, code, name in rows:
        events.append(
            LeaveCalendarEvent(
                id=req.leave_request_id,
                title=f"{name} — {code}",
                start=req.start_date,
                end=req.end_date,
                employee_id=req.employee_id,
                employee_name=name,
                leave_type_code=code,
                request_status=req.request_status,
                color=_STATUS_COLORS.get(req.request_status),
            )
        )
    return events
