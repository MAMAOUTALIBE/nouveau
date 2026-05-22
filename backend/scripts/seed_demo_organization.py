"""Seed de démonstration — module Organisation.

Peuple les données du module Organisation pour le développement local :

  1. Directions supplémentaires (~3) — enrichit l'organigramme.
  2. Unités supplémentaires (~6) rattachées à ces directions.
  3. Postes vacants (~6) — postes au statut OPEN pour la page « Postes vacants ».

Les « Postes budgétaires » réutilisent l'ensemble des postes existants
(les 10 postes occupés créés par `seed_demo_personnel` + ces 6 vacants).

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_organization

Pré-requis : `scripts.seed_initial`.
"""

from __future__ import annotations

import asyncio
from uuid import UUID

from app.core.db import session_scope
from app.models.organization import Direction, Organization, Unit
from app.models.position import Position
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Directions supplémentaires : (code, intitulé, responsable)
# ---------------------------------------------------------------------------
DEMO_DIRECTIONS: tuple[tuple[str, str, str], ...] = (
    ("DRH", "Direction des Ressources Humaines", "Mariama Condé"),
    ("DAF", "Direction des Affaires Financières", "Boubacar Camara"),
    ("DSI", "Direction des Systèmes d'Information", "Thierno Baldé"),
)

# Unités : (code, intitulé, code de la direction parente)
DEMO_UNITS: tuple[tuple[str, str, str], ...] = (
    ("U-DRH-CARR", "Service Carrières", "DRH"),
    ("U-DRH-PAIE", "Service Paie", "DRH"),
    ("U-DAF-BUDG", "Service Budget", "DAF"),
    ("U-DAF-CPT", "Service Comptabilité", "DAF"),
    ("U-DSI-DEV", "Service Études et Développement", "DSI"),
    ("U-DSI-EXPL", "Service Exploitation", "DSI"),
)

# Postes vacants : (code, intitulé, grade, code direction, code unité)
DEMO_VACANT_POSITIONS: tuple[tuple[str, str, str, str, str], ...] = (
    ("P-VAC-001", "Chef du service carrières", "A2", "DRH", "U-DRH-CARR"),
    ("P-VAC-002", "Gestionnaire de paie", "B1", "DRH", "U-DRH-PAIE"),
    ("P-VAC-003", "Analyste budgétaire", "A2", "DAF", "U-DAF-BUDG"),
    ("P-VAC-004", "Comptable principal", "B2", "DAF", "U-DAF-CPT"),
    ("P-VAC-005", "Développeur d'applications", "B1", "DSI", "U-DSI-DEV"),
    ("P-VAC-006", "Technicien d'exploitation", "C1", "DSI", "U-DSI-EXPL"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_directions(
    session: AsyncSession, *, organization_id: UUID
) -> tuple[dict[str, UUID], int]:
    direction_ids: dict[str, UUID] = {}
    created = 0
    for code, name, manager_name in DEMO_DIRECTIONS:
        direction = (
            await session.execute(
                select(Direction).where(
                    Direction.organization_id == organization_id, Direction.code == code
                )
            )
        ).scalar_one_or_none()
        if direction is None:
            direction = Direction(
                organization_id=organization_id,
                code=code,
                name=name,
                manager_name=manager_name,
            )
            session.add(direction)
            await session.flush([direction])
            created += 1
        direction_ids[code] = direction.direction_id
    return direction_ids, created


async def _ensure_units(
    session: AsyncSession, *, organization_id: UUID, direction_ids: dict[str, UUID]
) -> tuple[dict[str, UUID], int]:
    unit_ids: dict[str, UUID] = {}
    created = 0
    for code, name, direction_code in DEMO_UNITS:
        unit = (
            await session.execute(
                select(Unit).where(Unit.organization_id == organization_id, Unit.code == code)
            )
        ).scalar_one_or_none()
        if unit is None:
            unit = Unit(
                organization_id=organization_id,
                direction_id=direction_ids[direction_code],
                code=code,
                name=name,
            )
            session.add(unit)
            await session.flush([unit])
            created += 1
        unit_ids[code] = unit.unit_id
    return unit_ids, created


async def _ensure_vacant_positions(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_ids: dict[str, UUID],
    unit_ids: dict[str, UUID],
) -> int:
    created = 0
    for code, title, grade, direction_code, unit_code in DEMO_VACANT_POSITIONS:
        existing = (
            await session.execute(
                select(Position.position_id).where(
                    Position.organization_id == organization_id, Position.code == code
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            Position(
                organization_id=organization_id,
                direction_id=direction_ids[direction_code],
                unit_id=unit_ids[unit_code],
                code=code,
                title=title,
                grade=grade,
                position_status="OPEN",
                budgeted_headcount=1,
            )
        )
        created += 1
    return created


async def main() -> None:
    async with session_scope() as session:
        org = await _get_organization(session)
        direction_ids, directions_created = await _ensure_directions(
            session, organization_id=org.organization_id
        )
        unit_ids, units_created = await _ensure_units(
            session, organization_id=org.organization_id, direction_ids=direction_ids
        )
        positions_created = await _ensure_vacant_positions(
            session,
            organization_id=org.organization_id,
            direction_ids=direction_ids,
            unit_ids=unit_ids,
        )

    print(  # noqa: T201
        "Seed de démonstration du module Organisation terminé :\n"
        f"  - Directions    : {directions_created} créée(s) / {len(DEMO_DIRECTIONS)} au total\n"
        f"  - Unités        : {units_created} créée(s) / {len(DEMO_UNITS)} au total\n"
        f"  - Postes vacants: {positions_created} créé(s) / {len(DEMO_VACANT_POSITIONS)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
