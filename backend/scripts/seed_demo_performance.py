"""Seed de démonstration — module Évaluation (performance).

Peuple les données du module Évaluation pour le développement local :

  1. Campagnes d'évaluation (~4) — page « Campagnes ».
  2. Évaluations classiques (~12) sur la campagne annuelle ouverte — page
     « Résultats ».

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_performance

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from decimal import Decimal
from uuid import UUID

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.performance import PerformanceCampaign, PerformanceEvaluation
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Campagnes : (code, intitulé, type, statut, début, fin)
# ---------------------------------------------------------------------------
DEMO_CAMPAIGNS: tuple[tuple[str, str, str, str, date, date], ...] = (
    ("EVAL-2026-T1", "Évaluation annuelle 2026", "CLASSIC", "OPEN",
     date(2026, 1, 1), date(2026, 12, 31)),
    ("EVAL-2025", "Évaluation annuelle 2025", "CLASSIC", "CLOSED",
     date(2025, 1, 1), date(2025, 12, 31)),
    ("EVAL-360-2026", "Campagne 360° des cadres 2026", "SURVEY_360", "OPEN",
     date(2026, 3, 1), date(2026, 6, 30)),
    ("EVAL-2026-S2", "Évaluation mi-parcours 2026", "CLASSIC", "DRAFT",
     date(2026, 7, 1), date(2026, 9, 30)),
)

# Évaluations : (index agent, auto-éval, note manager, note finale|None, statut)
DEMO_EVALUATIONS: tuple[tuple[int, int, int, int | None, str], ...] = (
    (0, 78, 82, 80, "VALIDATED"),
    (1, 71, 69, None, "SUBMITTED"),
    (2, 85, 88, None, "DRAFT"),
    (3, 90, 92, 91, "VALIDATED"),
    (4, 66, 70, None, "SUBMITTED"),
    (5, 74, 76, None, "DRAFT"),
    (6, 88, 85, 86, "VALIDATED"),
    (7, 60, 64, None, "SUBMITTED"),
    (8, 82, 80, 81, "VALIDATED"),
    (9, 70, 73, None, "DRAFT"),
    (10, 79, 83, 81, "VALIDATED"),
    (11, 68, 66, None, "SUBMITTED"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_campaigns(
    session: AsyncSession, *, organization_id: UUID
) -> tuple[UUID, int]:
    """Crée les campagnes ; retourne l'ID de la campagne classique ouverte."""
    classic_open_id: UUID | None = None
    created = 0
    for code, title, kind, status, start, end in DEMO_CAMPAIGNS:
        campaign = (
            await session.execute(
                select(PerformanceCampaign).where(
                    PerformanceCampaign.organization_id == organization_id,
                    PerformanceCampaign.code == code,
                )
            )
        ).scalar_one_or_none()
        if campaign is None:
            campaign = PerformanceCampaign(
                organization_id=organization_id,
                code=code,
                title=title,
                campaign_kind=kind,
                campaign_status=status,
                period_start=start,
                period_end=end,
            )
            session.add(campaign)
            await session.flush([campaign])
            created += 1
        if code == "EVAL-2026-T1":
            classic_open_id = campaign.performance_campaign_id
    if classic_open_id is None:
        raise SystemExit("Campagne EVAL-2026-T1 introuvable.")
    return classic_open_id, created


async def _ensure_evaluations(
    session: AsyncSession,
    *,
    organization_id: UUID,
    campaign_id: UUID,
    employees: list[Employee],
) -> int:
    created = 0
    for emp_index, self_score, manager_score, final_score, status in DEMO_EVALUATIONS:
        if emp_index >= len(employees):
            continue
        employee_id = employees[emp_index].employee_id
        existing = (
            await session.execute(
                select(PerformanceEvaluation.performance_evaluation_id).where(
                    PerformanceEvaluation.performance_campaign_id == campaign_id,
                    PerformanceEvaluation.employee_id == employee_id,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            PerformanceEvaluation(
                organization_id=organization_id,
                performance_campaign_id=campaign_id,
                employee_id=employee_id,
                self_score=Decimal(self_score),
                manager_score=Decimal(manager_score),
                final_score=Decimal(final_score) if final_score is not None else None,
                evaluation_status=status,
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

        campaign_id, campaigns_created = await _ensure_campaigns(
            session, organization_id=org.organization_id
        )
        evaluations_created = await _ensure_evaluations(
            session,
            organization_id=org.organization_id,
            campaign_id=campaign_id,
            employees=employees,
        )

    print(  # noqa: T201
        "Seed de démonstration du module Évaluation terminé :\n"
        f"  - Campagnes   : {campaigns_created} créée(s) / {len(DEMO_CAMPAIGNS)} au total\n"
        f"  - Évaluations : {evaluations_created} créée(s) / {len(DEMO_EVALUATIONS)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
