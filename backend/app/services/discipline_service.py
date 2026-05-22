"""Service métier — Discipline.

Workflow d'un dossier disciplinaire :
    OPEN → UNDER_INVESTIGATION → SANCTION_PROPOSED → SANCTION_APPLIED → CLOSED
                                                                    ↘ DISMISSED

Chaque transition produit un `DisciplineEvent` immuable + un audit log.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.models.discipline import DisciplineCase, DisciplineEvent
from app.models.employee import Employee
from app.models.organization import Direction
from app.schemas.discipline import (
    DisciplineCaseCreateRequest,
    DisciplineCaseResponse,
    DisciplineCaseTransitionRequest,
    DisciplineEventResponse,
)

VALID_TRANSITIONS: dict[str, set[str]] = {
    "OPEN": {"UNDER_INVESTIGATION", "DISMISSED", "CLOSED"},
    "UNDER_INVESTIGATION": {"SANCTION_PROPOSED", "DISMISSED", "CLOSED"},
    "SANCTION_PROPOSED": {"SANCTION_APPLIED", "DISMISSED", "CLOSED"},
    "SANCTION_APPLIED": {"CLOSED"},
    "CLOSED": set(),
    "DISMISSED": set(),
}


_DISCIPLINE_STATUS_LABELS: dict[str, str] = {
    "OPEN": "Ouvert",
    "UNDER_INVESTIGATION": "En investigation",
    "SANCTION_PROPOSED": "Sanction proposée",
    "SANCTION_APPLIED": "Sanction appliquée",
    "CLOSED": "Clôturé",
    "DISMISSED": "Classé sans suite",
}


async def list_cases(
    session: AsyncSession,
    *,
    organization_id: UUID,
    case_status: str | None = None,
    employee_id: UUID | None = None,
    severity: str | None = None,
) -> list[DisciplineCaseResponse]:
    base = (
        select(DisciplineCase, Employee.full_name, Direction.name)
        .join(Employee, Employee.employee_id == DisciplineCase.employee_id)
        .outerjoin(Direction, Direction.direction_id == Employee.direction_id)
        .where(DisciplineCase.organization_id == organization_id)
    )
    if case_status:
        base = base.where(DisciplineCase.case_status == case_status)
    if employee_id:
        base = base.where(DisciplineCase.employee_id == employee_id)
    if severity:
        base = base.where(DisciplineCase.severity == severity)
    rows = (await session.execute(base.order_by(DisciplineCase.created_at.desc()))).all()

    items: list[DisciplineCaseResponse] = []
    for case, agent_name, direction_name in rows:
        dto = DisciplineCaseResponse.model_validate(case)
        dto.agent_name = agent_name
        dto.direction = direction_name
        dto.infraction = case.title
        dto.opened_on = case.created_at.date()
        dto.status = _DISCIPLINE_STATUS_LABELS.get(case.case_status, case.case_status)
        items.append(dto)
    return items


async def _next_reference(session: AsyncSession, organization_id: UUID) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"DISC-{year}-"
    count = (
        await session.execute(
            select(func.count())
            .select_from(DisciplineCase)
            .where(
                DisciplineCase.organization_id == organization_id,
                DisciplineCase.reference.startswith(prefix),
            )
        )
    ).scalar_one()
    return f"{prefix}{int(count) + 1:05d}"


async def create_case(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: DisciplineCaseCreateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> DisciplineCaseResponse:
    reference = await _next_reference(session, organization_id)
    case = DisciplineCase(
        organization_id=organization_id,
        reference=reference,
        employee_id=body.employee_id,
        case_status="OPEN",
        severity=body.severity,
        title=body.title,
        summary=body.summary,
        incident_date=body.incident_date,
        opened_by_user_id=actor_user_id,
    )
    session.add(case)
    await session.flush([case])

    session.add(
        DisciplineEvent(
            discipline_case_id=case.discipline_case_id,
            event_type="OPENED",
            actor_user_id=actor_user_id,
        )
    )

    await audit.record(
        action="DISCIPLINE_CASE_CREATED",
        target_type="discipline_case",
        target_id=str(case.discipline_case_id),
        after={
            "reference": reference,
            "employee_id": str(body.employee_id),
            "severity": body.severity,
        },
    )
    return DisciplineCaseResponse.model_validate(case)


async def transition_case(
    session: AsyncSession,
    *,
    discipline_case_id: UUID,
    body: DisciplineCaseTransitionRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> DisciplineCaseResponse:
    case = (
        await session.execute(
            select(DisciplineCase).where(DisciplineCase.discipline_case_id == discipline_case_id)
        )
    ).scalar_one_or_none()
    if case is None:
        raise NotFoundError("Dossier introuvable.", code="DISCIPLINE_CASE_NOT_FOUND")

    if body.target_status not in VALID_TRANSITIONS.get(case.case_status, set()):
        raise ConflictError(
            f"Transition invalide : {case.case_status} → {body.target_status}",
            code="INVALID_DISCIPLINE_TRANSITION",
        )

    before = {
        "case_status": case.case_status,
        "proposed_sanction": case.proposed_sanction,
        "applied_sanction": case.applied_sanction,
    }
    case.case_status = body.target_status
    if body.proposed_sanction is not None:
        case.proposed_sanction = body.proposed_sanction
    if body.applied_sanction is not None:
        case.applied_sanction = body.applied_sanction
    if body.target_status in ("CLOSED", "DISMISSED"):
        case.closed_at = datetime.now(tz=UTC)

    session.add(
        DisciplineEvent(
            discipline_case_id=case.discipline_case_id,
            event_type=f"TRANSITION_{body.target_status}",
            actor_user_id=actor_user_id,
            note=body.note,
        )
    )

    await audit.record(
        action=f"DISCIPLINE_CASE_{body.target_status}",
        target_type="discipline_case",
        target_id=str(discipline_case_id),
        before=before,
        after={
            "case_status": case.case_status,
            "proposed_sanction": case.proposed_sanction,
            "applied_sanction": case.applied_sanction,
        },
    )
    return DisciplineCaseResponse.model_validate(case)


async def list_events(
    session: AsyncSession, *, discipline_case_id: UUID
) -> list[DisciplineEventResponse]:
    rows = (
        (
            await session.execute(
                select(DisciplineEvent)
                .where(DisciplineEvent.discipline_case_id == discipline_case_id)
                .order_by(DisciplineEvent.occurred_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [DisciplineEventResponse.model_validate(e) for e in rows]
