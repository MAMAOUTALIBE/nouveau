"""Service métier — Carrière (mouvements) + GPEC.

GPEC = Gestion Prévisionnelle des Emplois et Compétences.

**Logique d'écart V1 (déterministe)** :
- Pour chaque (poste, compétence requise), on compte parmi les employés
  affectés à ce poste combien atteignent ou dépassent le niveau attendu,
  et combien sont en dessous.
- Un "écart critique" = exigence avec `is_critical=True` ET au moins un
  employé en dessous du niveau attendu.

Le snapshot est persisté pour traçabilité (audit + historique des écarts
au cours du temps).
"""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.models.employee import Employee, EmployeeMovement
from app.models.gpec import (
    CompetencyGapsSnapshot,
    CompetencyReferential,
    PositionCompetencyRequirement,
)
from app.models.organization import Direction, Organization, Unit
from app.models.personnel_360 import EmployeeCompetency
from app.models.position import Position
from app.schemas.career import (
    CompetencyCreateRequest,
    CompetencyGapDetail,
    CompetencyGapsComputeRequest,
    CompetencyGapsSnapshotResponse,
    CompetencyResponse,
    DepartureDecision,
    DepartureHorizon,
    DepartureItem,
    DeparturesResponse,
    DeparturesSummary,
    DepartureType,
    MovementCreateRequest,
    MovementDecisionRequest,
    MovementResponse,
    PositionRequirementResponse,
    PositionRequirementUpsertRequest,
)

# Ordre hiérarchique des niveaux (pour comparer expected vs actual)
LEVEL_ORDER = ("Debutant", "Intermediaire", "Avance", "Expert")


def _level_rank(level: str) -> int:
    try:
        return LEVEL_ORDER.index(level)
    except ValueError:
        return -1


# ============================================================================
# Mouvements de carrière
# ============================================================================
_MOVEMENT_TYPE_LABELS: dict[str, str] = {
    "TRANSFER": "Mutation",
    "PROMOTION": "Promotion",
    "SECONDMENT": "Détachement",
    "RECLASSIFICATION": "Avancement",
    "EXIT": "Départ",
}
_MOVEMENT_STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Brouillon",
    "APPROVED": "Approuvé",
    "REJECTED": "Rejeté",
    "EXECUTED": "Exécuté",
    "CANCELLED": "Annulé",
}


async def _structure_label(
    session: AsyncSession, unit_id: UUID | None, direction_id: UUID | None
) -> str | None:
    """Résout le libellé d'une structure : unité prioritaire, sinon direction."""
    if unit_id is not None:
        unit = await session.get(Unit, unit_id)
        if unit is not None:
            return unit.name
    if direction_id is not None:
        direction = await session.get(Direction, direction_id)
        if direction is not None:
            return direction.name
    return None


async def _build_movement_response(
    session: AsyncSession,
    movement: EmployeeMovement,
    *,
    employee: Employee | None = None,
) -> MovementResponse:
    """Construit la réponse enrichie d'un mouvement (libellés résolus)."""
    if employee is None:
        employee = await session.get(Employee, movement.employee_id)
    from_label = await _structure_label(
        session, movement.from_unit_id, movement.from_direction_id
    )
    to_label = await _structure_label(session, movement.to_unit_id, movement.to_direction_id)
    return MovementResponse(
        movement_id=movement.movement_id,
        reference=f"MVT-{str(movement.movement_id)[:8].upper()}",
        agent_name=employee.full_name if employee is not None else "—",
        movement_type=_MOVEMENT_TYPE_LABELS.get(movement.movement_type, movement.movement_type),
        from_label=from_label,
        to_label=to_label or "—",
        effective_date=movement.effective_date,
        status=_MOVEMENT_STATUS_LABELS.get(
            movement.movement_status, movement.movement_status
        ),
    )


async def list_movements(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee_id: UUID | None = None,
    movement_status: str | None = None,
) -> list[MovementResponse]:
    base = select(EmployeeMovement).where(EmployeeMovement.organization_id == organization_id)
    if employee_id:
        base = base.where(EmployeeMovement.employee_id == employee_id)
    if movement_status:
        base = base.where(EmployeeMovement.movement_status == movement_status)
    rows = (
        (await session.execute(base.order_by(EmployeeMovement.effective_date.desc())))
        .scalars()
        .all()
    )
    return [await _build_movement_response(session, movement) for movement in rows]


async def create_movement(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: MovementCreateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> MovementResponse:
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == body.employee_id))
    ).scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employé introuvable.", code="EMPLOYEE_NOT_FOUND")

    movement = EmployeeMovement(
        organization_id=organization_id,
        employee_id=body.employee_id,
        movement_type=body.movement_type,
        movement_status="DRAFT",
        from_direction_id=employee.direction_id,
        from_unit_id=employee.unit_id,
        from_position_id=employee.position_id,
        to_direction_id=body.to_direction_id,
        to_unit_id=body.to_unit_id,
        to_position_id=body.to_position_id,
        effective_date=body.effective_date,
        reason=body.reason,
        created_by_user_id=actor_user_id,
    )
    session.add(movement)
    await session.flush([movement])
    await audit.record(
        action="CAREER_MOVEMENT_CREATED",
        target_type="employee_movement",
        target_id=str(movement.movement_id),
        after={
            "employee_id": str(body.employee_id),
            "movement_type": body.movement_type,
            "effective_date": body.effective_date.isoformat(),
        },
    )
    return await _build_movement_response(session, movement, employee=employee)


async def decide_movement(
    session: AsyncSession,
    *,
    movement_id: UUID,
    body: MovementDecisionRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> MovementResponse:
    movement = (
        await session.execute(
            select(EmployeeMovement).where(EmployeeMovement.movement_id == movement_id)
        )
    ).scalar_one_or_none()
    if movement is None:
        raise NotFoundError("Mouvement introuvable.", code="MOVEMENT_NOT_FOUND")
    if movement.movement_status in ("EXECUTED", "REJECTED", "CANCELLED"):
        raise ConflictError(
            f"Mouvement déjà {movement.movement_status}.",
            code="MOVEMENT_CLOSED",
        )

    valid = {
        "DRAFT": {"APPROVED", "REJECTED", "CANCELLED"},
        "APPROVED": {"EXECUTED", "CANCELLED"},
    }
    if body.decision not in valid.get(movement.movement_status, set()):
        raise ConflictError(
            f"Transition invalide : {movement.movement_status} → {body.decision}",
            code="INVALID_MOVEMENT_TRANSITION",
        )

    before = {"movement_status": movement.movement_status}
    movement.movement_status = body.decision
    if body.decision == "APPROVED":
        movement.approved_by_user_id = actor_user_id
        movement.approved_at = datetime.now(tz=UTC)

    # Si EXECUTED, on applique la mutation au dossier de l'employé
    if body.decision == "EXECUTED":
        employee = (
            await session.execute(
                select(Employee).where(Employee.employee_id == movement.employee_id)
            )
        ).scalar_one()
        if movement.to_direction_id is not None:
            employee.direction_id = movement.to_direction_id
        if movement.to_unit_id is not None:
            employee.unit_id = movement.to_unit_id
        if movement.to_position_id is not None:
            employee.position_id = movement.to_position_id

    await audit.record(
        action=f"CAREER_MOVEMENT_{body.decision}",
        target_type="employee_movement",
        target_id=str(movement_id),
        before=before,
        after={"movement_status": body.decision, "comment": body.comment},
    )
    return await _build_movement_response(session, movement)


# ============================================================================
# GPEC — référentiel compétences
# ============================================================================
async def list_competencies(
    session: AsyncSession, *, organization_id: UUID
) -> list[CompetencyResponse]:
    rows = (
        (
            await session.execute(
                select(CompetencyReferential)
                .where(CompetencyReferential.organization_id == organization_id)
                .order_by(CompetencyReferential.code)
            )
        )
        .scalars()
        .all()
    )
    return [CompetencyResponse.model_validate(c) for c in rows]


async def create_competency(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: CompetencyCreateRequest,
    audit: AuditWriter,
) -> CompetencyResponse:
    existing = (
        await session.execute(
            select(CompetencyReferential).where(
                CompetencyReferential.organization_id == organization_id,
                CompetencyReferential.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Compétence '{body.code}' déjà référencée.",
            code="COMPETENCY_CODE_TAKEN",
        )
    c = CompetencyReferential(
        organization_id=organization_id,
        code=body.code,
        label=body.label,
        category=body.category,
        description=body.description,
    )
    session.add(c)
    await session.flush([c])
    await audit.record(
        action="GPEC_COMPETENCY_CREATED",
        target_type="competency_referential",
        target_id=str(c.competency_referential_id),
        after={"code": body.code, "label": body.label},
    )
    return CompetencyResponse.model_validate(c)


# ============================================================================
# GPEC — exigences par poste
# ============================================================================
async def list_position_requirements(
    session: AsyncSession, *, position_id: UUID
) -> list[PositionRequirementResponse]:
    stmt = (
        select(
            PositionCompetencyRequirement,
            CompetencyReferential.code,
            CompetencyReferential.label,
        )
        .join(
            CompetencyReferential,
            CompetencyReferential.competency_referential_id
            == PositionCompetencyRequirement.competency_referential_id,
        )
        .where(PositionCompetencyRequirement.position_id == position_id)
        .order_by(CompetencyReferential.code)
    )
    rows = (await session.execute(stmt)).all()
    return [
        PositionRequirementResponse(
            position_competency_requirement_id=r[0].position_competency_requirement_id,
            position_id=r[0].position_id,
            competency_referential_id=r[0].competency_referential_id,
            competency_code=r[1],
            competency_label=r[2],
            expected_level=r[0].expected_level,
            is_critical=r[0].is_critical,
        )
        for r in rows
    ]


async def upsert_position_requirement(
    session: AsyncSession,
    *,
    organization_id: UUID,
    position_id: UUID,
    body: PositionRequirementUpsertRequest,
    audit: AuditWriter,
) -> PositionRequirementResponse:
    existing = (
        await session.execute(
            select(PositionCompetencyRequirement).where(
                PositionCompetencyRequirement.position_id == position_id,
                PositionCompetencyRequirement.competency_referential_id
                == body.competency_referential_id,
            )
        )
    ).scalar_one_or_none()

    if existing is None:
        existing = PositionCompetencyRequirement(
            organization_id=organization_id,
            position_id=position_id,
            competency_referential_id=body.competency_referential_id,
            expected_level=body.expected_level,
            is_critical=body.is_critical,
        )
        session.add(existing)
    else:
        existing.expected_level = body.expected_level
        existing.is_critical = body.is_critical

    await session.flush([existing])

    competency = (
        await session.execute(
            select(CompetencyReferential).where(
                CompetencyReferential.competency_referential_id == body.competency_referential_id
            )
        )
    ).scalar_one_or_none()

    await audit.record(
        action="GPEC_POSITION_REQUIREMENT_UPSERTED",
        target_type="position_competency_requirement",
        target_id=str(existing.position_competency_requirement_id),
        after={
            "position_id": str(position_id),
            "competency_referential_id": str(body.competency_referential_id),
            "expected_level": body.expected_level,
            "is_critical": body.is_critical,
        },
    )
    return PositionRequirementResponse(
        position_competency_requirement_id=existing.position_competency_requirement_id,
        position_id=existing.position_id,
        competency_referential_id=existing.competency_referential_id,
        competency_code=competency.code if competency else None,
        competency_label=competency.label if competency else None,
        expected_level=existing.expected_level,
        is_critical=existing.is_critical,
    )


# ============================================================================
# GPEC — calcul d'écarts + snapshot
# ============================================================================
async def compute_gaps_snapshot(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: CompetencyGapsComputeRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> CompetencyGapsSnapshotResponse:
    """Calcule un snapshot d'écarts compétences pour le périmètre demandé."""
    # 1. Récupérer les exigences applicables et les positions
    req_stmt = (
        select(
            PositionCompetencyRequirement,
            CompetencyReferential.code,
            CompetencyReferential.label,
        )
        .join(
            CompetencyReferential,
            CompetencyReferential.competency_referential_id
            == PositionCompetencyRequirement.competency_referential_id,
        )
        .where(PositionCompetencyRequirement.organization_id == organization_id)
    )

    requirements = (await session.execute(req_stmt)).all()

    # 2. Pour chaque (position, compétence), parcourir les employés affectés
    gaps: list[CompetencyGapDetail] = []
    employees_assessed_set: set[UUID] = set()
    critical_gaps_count = 0

    for req, comp_code, comp_label in requirements:
        # Filtrer les employés par scope
        employees_query = select(Employee).where(
            Employee.organization_id == organization_id,
            Employee.position_id == req.position_id,
            Employee.employment_status == "ACTIVE",
        )
        if body.scope_type == "DIRECTION" and body.scope_id is not None:
            employees_query = employees_query.where(Employee.direction_id == body.scope_id)
        elif body.scope_type == "UNIT" and body.scope_id is not None:
            employees_query = employees_query.where(Employee.unit_id == body.scope_id)
        elif body.scope_type == "POSITION" and body.scope_id is not None:
            employees_query = employees_query.where(Employee.position_id == body.scope_id)
        employees = (await session.execute(employees_query)).scalars().all()
        if not employees:
            continue

        meeting = 0
        below = 0
        for emp in employees:
            employees_assessed_set.add(emp.employee_id)
            employee_competencies = (
                (
                    await session.execute(
                        select(EmployeeCompetency).where(
                            EmployeeCompetency.employee_id == emp.employee_id,
                            EmployeeCompetency.label == comp_label,
                        )
                    )
                )
                .scalars()
                .all()
            )
            actual_rank = max(
                (_level_rank(c.competency_level) for c in employee_competencies),
                default=-1,
            )
            expected_rank = _level_rank(req.expected_level)
            if actual_rank >= expected_rank:
                meeting += 1
            else:
                below += 1
        gap = CompetencyGapDetail(
            position_id=req.position_id,
            competency_code=comp_code,
            competency_label=comp_label,
            expected_level=req.expected_level,
            is_critical=req.is_critical,
            employees_meeting_count=meeting,
            employees_below_count=below,
            employees_total=meeting + below,
        )
        gaps.append(gap)
        if req.is_critical and below > 0:
            critical_gaps_count += 1

    # 3. Persistance du snapshot
    payload: dict[str, Any] = {
        "scope_type": body.scope_type,
        "scope_id": str(body.scope_id) if body.scope_id else None,
        "gaps": [g.model_dump(mode="json") for g in gaps],
    }

    snapshot = CompetencyGapsSnapshot(
        organization_id=organization_id,
        scope_type=body.scope_type,
        scope_id=body.scope_id,
        employees_assessed=len(employees_assessed_set),
        critical_gaps_count=critical_gaps_count,
        payload=payload,
        generated_by_user_id=actor_user_id,
    )
    session.add(snapshot)
    await session.flush([snapshot])

    await audit.record(
        action="GPEC_GAPS_SNAPSHOT_CREATED",
        target_type="competency_gaps_snapshot",
        target_id=str(snapshot.competency_gaps_snapshot_id),
        after={
            "scope_type": body.scope_type,
            "employees_assessed": len(employees_assessed_set),
            "critical_gaps_count": critical_gaps_count,
        },
    )
    return CompetencyGapsSnapshotResponse.model_validate(snapshot)


async def list_gaps_snapshots(
    session: AsyncSession,
    *,
    organization_id: UUID,
    scope_type: str | None = None,
    limit: int = 50,
) -> list[CompetencyGapsSnapshotResponse]:
    base = select(CompetencyGapsSnapshot).where(
        CompetencyGapsSnapshot.organization_id == organization_id
    )
    if scope_type:
        base = base.where(CompetencyGapsSnapshot.scope_type == scope_type)
    rows = (
        (
            await session.execute(
                base.order_by(CompetencyGapsSnapshot.generated_at.desc()).limit(limit)
            )
        )
        .scalars()
        .all()
    )
    return [CompetencyGapsSnapshotResponse.model_validate(s) for s in rows]


async def get_total_movements(session: AsyncSession, *, organization_id: UUID) -> int:
    """Helper pour le dashboard."""
    return int(
        (
            await session.execute(
                select(func.count())
                .select_from(EmployeeMovement)
                .where(EmployeeMovement.organization_id == organization_id)
            )
        ).scalar_one()
    )


# ============================================================================
# Anticipation des départs — retraites + fins de contrat
# ============================================================================
# Fenêtre d'anticipation : on remonte les départs prévus dans les 24 mois,
# ainsi que ceux déjà dépassés mais non traités (agent toujours en activité).
_DEPARTURE_HORIZON_DAYS = 730
_DEFAULT_RETIREMENT_AGE = 60


def _add_years(value: date, years: int) -> date:
    """Ajoute `years` années à une date en gérant le 29 février."""
    try:
        return value.replace(year=value.year + years)
    except ValueError:
        return value.replace(year=value.year + years, month=2, day=28)


def _classify_horizon(days_until: int) -> DepartureHorizon:
    """Classe un départ par urgence d'anticipation."""
    if days_until < 0:
        return "DEPASSE"
    if days_until <= 90:
        return "URGENT"
    if days_until <= 180:
        return "A_ANTICIPER"
    if days_until <= 365:
        return "A_PLANIFIER"
    return "VISIBLE"


def _normalize_decision(value: object) -> DepartureDecision:
    """Lit la décision RH stockée dans `employee_metadata` (valeur libre tolérée)."""
    text = str(value or "").strip().upper()
    if text == "A_RENOUVELER":
        return "A_RENOUVELER"
    if text == "A_LIBERER":
        return "A_LIBERER"
    if text == "RECRUTEMENT_LANCE":
        return "RECRUTEMENT_LANCE"
    return "A_DECIDER"


async def _get_retirement_age(session: AsyncSession, organization_id: UUID) -> int:
    value = (
        await session.execute(
            select(Organization.retirement_age).where(
                Organization.organization_id == organization_id
            )
        )
    ).scalar_one_or_none()
    return int(value) if value is not None else _DEFAULT_RETIREMENT_AGE


async def _build_departure_items(
    session: AsyncSession, *, organization_id: UUID, retirement_age: int
) -> list[DepartureItem]:
    """Calcule, pour chaque agent en activité, son prochain départ prévu."""
    today = date.today()

    employees = (
        (
            await session.execute(
                select(Employee).where(
                    Employee.organization_id == organization_id,
                    Employee.employment_status.in_(["ACTIVE", "ON_LEAVE"]),
                )
            )
        )
        .scalars()
        .all()
    )

    directions = {
        d.direction_id: d.name
        for d in (
            await session.execute(
                select(Direction).where(Direction.organization_id == organization_id)
            )
        )
        .scalars()
        .all()
    }
    units = {
        u.unit_id: u.name
        for u in (
            await session.execute(select(Unit).where(Unit.organization_id == organization_id))
        )
        .scalars()
        .all()
    }
    positions = {
        p.position_id: p.title
        for p in (
            await session.execute(
                select(Position).where(Position.organization_id == organization_id)
            )
        )
        .scalars()
        .all()
    }

    items: list[DepartureItem] = []
    for emp in employees:
        events: list[tuple[DepartureType, date, int | None]] = []
        if emp.birth_date is not None:
            events.append(("RETRAITE", _add_years(emp.birth_date, retirement_age), retirement_age))
        if emp.contract_end_date is not None:
            events.append(("FIN_CONTRAT", emp.contract_end_date, None))
        if not events:
            continue

        # On retient l'échéance la plus proche.
        events.sort(key=lambda event: event[1])
        departure_type, departure_date, age_at_departure = events[0]
        days_until = (departure_date - today).days
        if days_until > _DEPARTURE_HORIZON_DAYS:
            continue

        items.append(
            DepartureItem(
                employee_id=emp.employee_id,
                matricule=emp.matricule,
                full_name=emp.full_name,
                direction_id=emp.direction_id,
                direction_name=directions.get(emp.direction_id) if emp.direction_id else None,
                unit_name=units.get(emp.unit_id) if emp.unit_id else None,
                position_title=positions.get(emp.position_id) if emp.position_id else None,
                contract_type=emp.contract_type,
                departure_type=departure_type,
                departure_date=departure_date,
                days_until=days_until,
                age_at_departure=age_at_departure,
                horizon=_classify_horizon(days_until),
                decision=_normalize_decision(emp.employee_metadata.get("departure_decision")),
            )
        )

    items.sort(key=lambda item: item.days_until)
    return items


def _summarize_departures(items: list[DepartureItem], retirement_age: int) -> DeparturesSummary:
    return DeparturesSummary(
        retirement_age=retirement_age,
        generated_at=datetime.now(tz=UTC),
        total_upcoming=len(items),
        overdue=sum(1 for it in items if it.days_until < 0),
        urgent=sum(1 for it in items if 0 <= it.days_until <= 90),
        next_6_months=sum(1 for it in items if it.days_until <= 180),
        next_12_months=sum(1 for it in items if it.days_until <= 365),
        retirements_12m=sum(
            1 for it in items if it.departure_type == "RETRAITE" and it.days_until <= 365
        ),
        contracts_12m=sum(
            1 for it in items if it.departure_type == "FIN_CONTRAT" and it.days_until <= 365
        ),
    )


async def get_departures(session: AsyncSession, *, organization_id: UUID) -> DeparturesResponse:
    """Liste consolidée des départs à anticiper + agrégats."""
    retirement_age = await _get_retirement_age(session, organization_id)
    items = await _build_departure_items(
        session, organization_id=organization_id, retirement_age=retirement_age
    )
    return DeparturesResponse(summary=_summarize_departures(items, retirement_age), items=items)


async def count_upcoming_departures(
    session: AsyncSession, *, organization_id: UUID, within_days: int = 365
) -> int:
    """Nombre de départs prévus dans `within_days` jours — utilisé par le dashboard."""
    retirement_age = await _get_retirement_age(session, organization_id)
    items = await _build_departure_items(
        session, organization_id=organization_id, retirement_age=retirement_age
    )
    return sum(1 for it in items if it.days_until <= within_days)


async def set_retirement_age(
    session: AsyncSession,
    *,
    organization_id: UUID,
    retirement_age: int,
    audit: AuditWriter,
) -> DeparturesResponse:
    """Met à jour l'âge légal de départ de l'organisation puis recalcule les départs."""
    org = (
        await session.execute(
            select(Organization).where(Organization.organization_id == organization_id)
        )
    ).scalar_one_or_none()
    if org is None:
        raise NotFoundError("Organisation introuvable.", code="ORGANIZATION_NOT_FOUND")

    before = org.retirement_age
    org.retirement_age = retirement_age
    await audit.record(
        action="RETIREMENT_AGE_UPDATED",
        target_type="organization",
        target_id=str(organization_id),
        before={"retirement_age": before},
        after={"retirement_age": retirement_age},
    )
    await session.flush()
    return await get_departures(session, organization_id=organization_id)


async def set_departure_decision(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee_id: UUID,
    decision: DepartureDecision,
    audit: AuditWriter,
) -> DeparturesResponse:
    """Enregistre la décision RH (renouveler / libérer / recrutement lancé)."""
    emp = (
        await session.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.employee_id == employee_id,
            )
        )
    ).scalar_one_or_none()
    if emp is None:
        raise NotFoundError("Agent introuvable.", code="EMPLOYEE_NOT_FOUND")

    before = emp.employee_metadata.get("departure_decision")
    emp.employee_metadata = {**emp.employee_metadata, "departure_decision": decision}
    await audit.record(
        action="DEPARTURE_DECISION_UPDATED",
        target_type="employee",
        target_id=str(employee_id),
        before={"departure_decision": before},
        after={"departure_decision": decision},
    )
    await session.flush()
    return await get_departures(session, organization_id=organization_id)
