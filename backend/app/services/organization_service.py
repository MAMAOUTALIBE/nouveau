"""Service métier — Organization (directions, units, positions, org chart)."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.models.employee import Employee
from app.models.organization import Direction, Unit
from app.models.position import Position
from app.schemas.organization import (
    BudgetedPositionResponse,
    DirectionCreateRequest,
    DirectionResponse,
    OrgChartDirectionNode,
    OrgChartUnitNode,
    PositionCreateRequest,
    PositionResponse,
    PositionUpdateStatusRequest,
    UnitCreateRequest,
    UnitResponse,
    VacantPositionResponse,
)


# ============================================================================
# Directions
# ============================================================================
async def list_directions(
    session: AsyncSession, *, organization_id: UUID
) -> list[DirectionResponse]:
    rows = (
        (
            await session.execute(
                select(Direction)
                .where(Direction.organization_id == organization_id)
                .order_by(Direction.code)
            )
        )
        .scalars()
        .all()
    )
    return [DirectionResponse.model_validate(d) for d in rows]


async def create_direction(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: DirectionCreateRequest,
    audit: AuditWriter,
) -> DirectionResponse:
    existing = (
        await session.execute(
            select(Direction).where(
                Direction.organization_id == organization_id,
                Direction.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Direction '{body.code}' déjà existante.",
            code="DIRECTION_CODE_TAKEN",
        )
    d = Direction(
        organization_id=organization_id,
        code=body.code,
        name=body.name,
        manager_name=body.manager_name,
    )
    session.add(d)
    await session.flush([d])
    await audit.record(
        action="DIRECTION_CREATED",
        target_type="direction",
        target_id=str(d.direction_id),
        after={"code": body.code, "name": body.name},
    )
    return DirectionResponse.model_validate(d)


# ============================================================================
# Units
# ============================================================================
async def list_units(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_id: UUID | None = None,
) -> list[UnitResponse]:
    base = select(Unit).where(Unit.organization_id == organization_id)
    if direction_id:
        base = base.where(Unit.direction_id == direction_id)
    rows = (await session.execute(base.order_by(Unit.code))).scalars().all()

    # Effectif rattaché à chaque unité (agents avec un unit_id renseigné).
    count_rows = (
        await session.execute(
            select(Employee.unit_id, func.count())
            .where(
                Employee.organization_id == organization_id,
                Employee.unit_id.is_not(None),
            )
            .group_by(Employee.unit_id)
        )
    ).all()
    counts = {row[0]: int(row[1]) for row in count_rows}

    units: list[UnitResponse] = []
    for u in rows:
        response = UnitResponse.model_validate(u)
        response.employee_count = counts.get(u.unit_id, 0)
        units.append(response)
    return units


async def create_unit(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: UnitCreateRequest,
    audit: AuditWriter,
) -> UnitResponse:
    existing = (
        await session.execute(
            select(Unit).where(Unit.organization_id == organization_id, Unit.code == body.code)
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f"Unité '{body.code}' déjà existante.", code="UNIT_CODE_TAKEN")
    u = Unit(
        organization_id=organization_id,
        direction_id=body.direction_id,
        parent_unit_id=body.parent_unit_id,
        code=body.code,
        name=body.name,
        manager_name=body.manager_name,
    )
    session.add(u)
    await session.flush([u])
    await audit.record(
        action="UNIT_CREATED",
        target_type="unit",
        target_id=str(u.unit_id),
        after={
            "code": body.code,
            "name": body.name,
            "direction_id": str(body.direction_id),
        },
    )
    return UnitResponse.model_validate(u)


# ============================================================================
# Positions
# ============================================================================
async def list_positions(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_id: UUID | None = None,
    unit_id: UUID | None = None,
    position_status: str | None = None,
) -> list[PositionResponse]:
    base = select(Position).where(Position.organization_id == organization_id)
    if direction_id:
        base = base.where(Position.direction_id == direction_id)
    if unit_id:
        base = base.where(Position.unit_id == unit_id)
    if position_status:
        base = base.where(Position.position_status == position_status)
    rows = (await session.execute(base.order_by(Position.code))).scalars().all()
    return [PositionResponse.model_validate(p) for p in rows]


# ============================================================================
# Postes budgétaires / vacants (vues liste du module Organisation)
# ============================================================================
_GRADE_PRIORITY: dict[str, str] = {"A": "Haute", "B": "Normale", "C": "Basse"}


def _position_structure_name(unit: Unit | None, direction: Direction | None) -> str:
    if unit is not None:
        return unit.name
    if direction is not None:
        return direction.name
    return "Primature"


async def list_budgeted_positions(
    session: AsyncSession,
    *,
    organization_id: UUID,
) -> list[BudgetedPositionResponse]:
    """Liste tous les postes budgétisés, avec leur titulaire éventuel."""
    stmt = (
        select(Position, Unit, Direction)
        .outerjoin(Unit, Unit.unit_id == Position.unit_id)
        .outerjoin(Direction, Direction.direction_id == Position.direction_id)
        .where(Position.organization_id == organization_id)
        .order_by(Position.code)
    )
    rows = (await session.execute(stmt)).all()

    holders: dict[UUID, str] = {}
    employee_rows = (
        await session.execute(
            select(Employee.position_id, Employee.full_name).where(
                Employee.organization_id == organization_id,
                Employee.position_id.is_not(None),
            )
        )
    ).all()
    for position_id, full_name in employee_rows:
        holders.setdefault(position_id, full_name)

    return [
        BudgetedPositionResponse(
            code=position.code,
            structure_name=_position_structure_name(unit, direction),
            title=position.title,
            grade=position.grade or "—",
            status="Occupé" if holders.get(position.position_id) else "Ouvert",
            holder_name=holders.get(position.position_id),
        )
        for position, unit, direction in rows
    ]


async def list_vacant_positions(
    session: AsyncSession,
    *,
    organization_id: UUID,
) -> list[VacantPositionResponse]:
    """Liste les postes vacants (statut OPEN)."""
    stmt = (
        select(Position, Unit, Direction)
        .outerjoin(Unit, Unit.unit_id == Position.unit_id)
        .outerjoin(Direction, Direction.direction_id == Position.direction_id)
        .where(
            Position.organization_id == organization_id,
            Position.position_status == "OPEN",
        )
        .order_by(Position.code)
    )
    rows = (await session.execute(stmt)).all()

    return [
        VacantPositionResponse(
            code=position.code,
            structure_name=_position_structure_name(unit, direction),
            title=position.title,
            grade=position.grade or "—",
            opened_on=position.created_at.date(),
            priority=_GRADE_PRIORITY.get((position.grade or "")[:1].upper(), "Normale"),
        )
        for position, unit, direction in rows
    ]


async def create_position(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: PositionCreateRequest,
    audit: AuditWriter,
) -> PositionResponse:
    existing = (
        await session.execute(
            select(Position).where(
                Position.organization_id == organization_id,
                Position.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f"Poste '{body.code}' déjà existant.", code="POSITION_CODE_TAKEN")
    p = Position(
        organization_id=organization_id,
        direction_id=body.direction_id,
        unit_id=body.unit_id,
        code=body.code,
        title=body.title,
        grade=body.grade,
        position_status=body.position_status,
        budgeted_headcount=body.budgeted_headcount,
    )
    session.add(p)
    await session.flush([p])
    await audit.record(
        action="POSITION_CREATED",
        target_type="position",
        target_id=str(p.position_id),
        after={
            "code": body.code,
            "title": body.title,
            "budgeted_headcount": body.budgeted_headcount,
        },
    )
    return PositionResponse.model_validate(p)


async def update_position_status(
    session: AsyncSession,
    *,
    position_id: UUID,
    body: PositionUpdateStatusRequest,
    audit: AuditWriter,
) -> PositionResponse:
    p = (
        await session.execute(select(Position).where(Position.position_id == position_id))
    ).scalar_one_or_none()
    if p is None:
        raise NotFoundError("Poste introuvable.", code="POSITION_NOT_FOUND")
    before = {"position_status": p.position_status}
    p.position_status = body.position_status
    await audit.record(
        action="POSITION_STATUS_CHANGED",
        target_type="position",
        target_id=str(position_id),
        before=before,
        after={"position_status": body.position_status},
    )
    return PositionResponse.model_validate(p)


# ============================================================================
# Org chart hiérarchique
# ============================================================================
async def build_org_chart(
    session: AsyncSession, *, organization_id: UUID
) -> list[OrgChartDirectionNode]:
    """Renvoie l'arbre directions → units → sub-units, avec headcount."""
    # 1. Toutes directions
    directions = (
        (
            await session.execute(
                select(Direction)
                .where(
                    Direction.organization_id == organization_id,
                    Direction.is_active.is_(True),
                )
                .order_by(Direction.code)
            )
        )
        .scalars()
        .all()
    )

    # 2. Toutes units
    units = (
        (
            await session.execute(
                select(Unit)
                .where(
                    Unit.organization_id == organization_id,
                    Unit.is_active.is_(True),
                )
                .order_by(Unit.code)
            )
        )
        .scalars()
        .all()
    )

    # 3. Headcount par direction et par unit
    direction_counts: dict[UUID, int] = {}
    for d_row in (
        await session.execute(
            select(Employee.direction_id, func.count())
            .where(
                Employee.organization_id == organization_id,
                Employee.employment_status == "ACTIVE",
                Employee.direction_id.is_not(None),
            )
            .group_by(Employee.direction_id)
        )
    ).all():
        if d_row[0] is not None:
            direction_counts[d_row[0]] = int(d_row[1])

    unit_counts: dict[UUID, int] = {}
    for u_row in (
        await session.execute(
            select(Employee.unit_id, func.count())
            .where(
                Employee.organization_id == organization_id,
                Employee.employment_status == "ACTIVE",
                Employee.unit_id.is_not(None),
            )
            .group_by(Employee.unit_id)
        )
    ).all():
        if u_row[0] is not None:
            unit_counts[u_row[0]] = int(u_row[1])

    # 4. Construire l'arbre (units : on construit le tree par parent_unit_id)
    units_by_parent: dict[UUID | None, list[Unit]] = {}
    for u in units:
        units_by_parent.setdefault(u.parent_unit_id, []).append(u)

    def _unit_tree(parent_id: UUID | None, direction_id: UUID) -> list[OrgChartUnitNode]:
        children = units_by_parent.get(parent_id, [])
        return [
            OrgChartUnitNode(
                unit_id=u.unit_id,
                code=u.code,
                name=u.name,
                manager_name=u.manager_name,
                children=_unit_tree(u.unit_id, direction_id),
                employee_count=int(unit_counts.get(u.unit_id, 0)),
            )
            for u in children
            if u.direction_id == direction_id
        ]

    return [
        OrgChartDirectionNode(
            direction_id=d.direction_id,
            code=d.code,
            name=d.name,
            manager_name=d.manager_name,
            units=_unit_tree(None, d.direction_id),
            employee_count=int(direction_counts.get(d.direction_id, 0)),
        )
        for d in directions
    ]
