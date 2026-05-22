"""Seed de démonstration — module Discipline.

Peuple la page « Dossiers disciplinaires » avec ~10 dossiers réalistes.

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_discipline

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.discipline import DisciplineCase
from app.models.employee import Employee
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Dossiers : (réf, index agent, intitulé, gravité, statut, résumé,
#             date incident, sanction proposée, sanction appliquée)
# ---------------------------------------------------------------------------
DemoCase = tuple[str, int, str, str, str, str, date, str | None, str | None]

DEMO_CASES: tuple[DemoCase, ...] = (
    ("DISC-2026-001", 2, "Absences répétées non justifiées", "Modere", "SANCTION_APPLIED",
     "Trois absences non justifiées constatées en un mois.", date(2026, 2, 10),
     "Avertissement écrit", "Avertissement écrit"),
    ("DISC-2026-002", 5, "Retards récurrents", "Faible", "OPEN",
     "Retards fréquents signalés par le supérieur hiérarchique.", date(2026, 3, 5),
     None, None),
    ("DISC-2026-003", 8, "Manquement au devoir de réserve", "Eleve", "UNDER_INVESTIGATION",
     "Propos déplacés tenus sur les réseaux sociaux.", date(2026, 1, 20), None, None),
    ("DISC-2026-004", 11, "Insubordination", "Eleve", "SANCTION_PROPOSED",
     "Refus d'exécuter une instruction hiérarchique.", date(2026, 2, 28),
     "Blâme", None),
    ("DISC-2026-005", 14, "Négligence professionnelle", "Modere", "CLOSED",
     "Erreur de traitement sur un dossier sensible.", date(2025, 11, 15),
     "Avertissement écrit", "Avertissement écrit"),
    ("DISC-2026-006", 17, "Conflit avec un collègue", "Faible", "DISMISSED",
     "Altercation verbale, dossier classé après médiation.", date(2026, 1, 8),
     None, None),
    ("DISC-2026-007", 3, "Utilisation abusive du matériel", "Modere", "OPEN",
     "Usage du véhicule de service à des fins personnelles.", date(2026, 3, 22),
     None, None),
    ("DISC-2026-008", 6, "Faute grave — détournement présumé", "Critique", "UNDER_INVESTIGATION",
     "Soupçon de détournement de fonds, enquête en cours.", date(2026, 2, 1), None, None),
    ("DISC-2026-009", 9, "Abandon de poste", "Critique", "SANCTION_PROPOSED",
     "Absence prolongée sans justification ni prise de contact.", date(2026, 1, 2),
     "Révocation", None),
    ("DISC-2026-010", 12, "Non-respect des consignes de sécurité", "Modere", "SANCTION_APPLIED",
     "Non-port des équipements de protection individuelle.", date(2026, 3, 12),
     "Avertissement écrit", "Avertissement écrit"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_cases(
    session: AsyncSession, *, organization_id: UUID, employees: list[Employee]
) -> int:
    created = 0
    for case in DEMO_CASES:
        (
            reference,
            emp_index,
            title,
            severity,
            case_status,
            summary,
            incident_date,
            proposed_sanction,
            applied_sanction,
        ) = case
        if emp_index >= len(employees):
            continue
        existing = (
            await session.execute(
                select(DisciplineCase.discipline_case_id).where(
                    DisciplineCase.organization_id == organization_id,
                    DisciplineCase.reference == reference,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            DisciplineCase(
                organization_id=organization_id,
                reference=reference,
                employee_id=employees[emp_index].employee_id,
                title=title,
                severity=severity,
                case_status=case_status,
                summary=summary,
                incident_date=incident_date,
                proposed_sanction=proposed_sanction,
                applied_sanction=applied_sanction,
            )
        )
        created += 1
    return created


async def main() -> None:
    async with session_scope() as session:
        org = await _get_organization(session)
        employees = list(
            (
                await session.execute(
                    select(Employee)
                    .where(Employee.organization_id == org.organization_id)
                    .order_by(Employee.matricule)
                )
            )
            .scalars()
            .all()
        )
        if not employees:
            raise SystemExit("Aucun agent. Lancez d'abord scripts.seed_demo_employees.")

        created = await _ensure_cases(
            session, organization_id=org.organization_id, employees=employees
        )

    skipped = len(DEMO_CASES) - created
    print(  # noqa: T201
        "Seed de démonstration du module Discipline terminé :\n"
        f"  - Dossiers disciplinaires : {created} créé(s), {skipped} déjà présent(s)\n"
        f"  - {len(DEMO_CASES)} dossiers au total dans le jeu de démo"
    )


if __name__ == "__main__":
    asyncio.run(main())
