"""Seed de démonstration — module Recrutement.

Peuple les données du module Recrutement pour le développement local :

  1. Campagnes de recrutement (~5) — page « Campagnes ».
  2. Candidatures (~12) rattachées aux campagnes — page « Candidatures »
     (alimente aussi « Portail candidat » et « Commissions »).

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_recruitment

Pré-requis : `scripts.seed_initial`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.organization import Organization
from app.models.recruitment import RecruitmentApplication, RecruitmentCampaign
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Campagnes : (code, intitulé, poste visé, postes ouverts, statut, début, fin)
# ---------------------------------------------------------------------------
DemoCampaign = tuple[str, str, str, int, str, date | None, date | None]

DEMO_CAMPAIGNS: tuple[DemoCampaign, ...] = (
    ("CAMP-2026-01", "Recrutement Cadres Administratifs 2026", "Attaché d'administration",
     5, "ACTIVE", date(2026, 1, 15), date(2026, 6, 30)),
    ("CAMP-2026-02", "Recrutement Informaticiens", "Développeur / Administrateur systèmes",
     3, "ACTIVE", date(2026, 2, 1), date(2026, 5, 31)),
    ("CAMP-2026-03", "Recrutement Comptables", "Agent comptable",
     2, "PAUSED", date(2026, 3, 1), date(2026, 7, 15)),
    ("CAMP-2025-09", "Recrutement Juristes 2025", "Conseiller juridique",
     2, "CLOSED", date(2025, 9, 1), date(2025, 12, 31)),
    ("CAMP-2026-04", "Campagne Stagiaires 2026", "Stagiaire",
     8, "DRAFT", None, None),
)

# ---------------------------------------------------------------------------
# Candidatures : (réf, nom, email, tél, poste souhaité, canal, statut,
#                 reçue le, années d'exp., index campagne, score compétences,
#                 score formation)
# ---------------------------------------------------------------------------
DemoApplication = tuple[
    str, str, str, str, str, str, str, date, int, int, float, float
]

DEMO_APPLICATIONS: tuple[DemoApplication, ...] = (
    ("CAND-2026-001", "Sory Kaba", "s.kaba@mail.gn", "+224 621 00 00 01",
     "Attaché d'administration", "Site web", "HIRED", date(2026, 1, 20), 6, 0, 86.0, 78.0),
    ("CAND-2026-002", "Aïcha Diallo", "a.diallo.c@mail.gn", "+224 621 00 00 02",
     "Attaché d'administration", "Cooptation", "INTERVIEW", date(2026, 1, 25), 4, 0, 74.5, 82.0),
    ("CAND-2026-003", "Mamadou Baldé", "m.balde.c@mail.gn", "+224 621 00 00 03",
     "Attaché d'administration", "Site web", "PRESELECTED", date(2026, 2, 2), 3, 0, 69.0, 71.0),
    ("CAND-2026-004", "Fatou Camara", "f.camara.c@mail.gn", "+224 621 00 00 04",
     "Attaché d'administration", "LinkedIn", "REJECTED", date(2026, 2, 5), 1, 0, 41.0, 55.0),
    ("CAND-2026-005", "Ibrahima Sylla", "i.sylla.c@mail.gn", "+224 621 00 00 05",
     "Développeur d'applications", "Site web", "OFFERED", date(2026, 2, 10), 5, 1, 91.0, 80.0),
    ("CAND-2026-006", "Mariama Bah", "m.bah.c@mail.gn", "+224 621 00 00 06",
     "Administrateur systèmes", "Cooptation", "INTERVIEW", date(2026, 2, 12), 7, 1, 88.0, 76.0),
    ("CAND-2026-007", "Ousmane Touré", "o.toure.c@mail.gn", "+224 621 00 00 07",
     "Développeur d'applications", "Forum emploi", "NEW", date(2026, 2, 18), 2, 1, 0.0, 0.0),
    ("CAND-2026-008", "Kadiatou Condé", "k.conde.c@mail.gn", "+224 621 00 00 08",
     "Agent comptable", "Site web", "PRESELECTED", date(2026, 3, 4), 4, 2, 72.0, 68.0),
    ("CAND-2026-009", "Alpha Barry", "a.barry.c@mail.gn", "+224 621 00 00 09",
     "Agent comptable", "LinkedIn", "NEW", date(2026, 3, 9), 3, 2, 0.0, 0.0),
    ("CAND-2025-010", "Néné Soumah", "n.soumah.c@mail.gn", "+224 621 00 00 10",
     "Conseiller juridique", "Site web", "HIRED", date(2025, 9, 15), 8, 3, 84.0, 90.0),
    ("CAND-2025-011", "Thierno Diané", "t.diane.c@mail.gn", "+224 621 00 00 11",
     "Conseiller juridique", "Cooptation", "REJECTED", date(2025, 10, 2), 2, 3, 48.0, 60.0),
    ("CAND-2026-012", "Hawa Bangoura", "h.bangoura.c@mail.gn", "+224 621 00 00 12",
     "Stagiaire", "Forum emploi", "NEW", date(2026, 4, 1), 0, 4, 0.0, 0.0),
    ("CAND-2026-013", "Boubacar Diallo", "b.diallo.c@mail.gn", "+224 621 00 00 13",
     "Attaché d'administration", "Site web", "HIRED", date(2026, 1, 22), 5, 0, 82.0, 79.0),
    ("CAND-2026-014", "Aminata Soumah", "a.soumah.c@mail.gn", "+224 621 00 00 14",
     "Administrateur systèmes", "Cooptation", "HIRED", date(2026, 2, 14), 6, 1, 89.0, 81.0),
    ("CAND-2026-015", "Mohamed Camara", "m.camara.c@mail.gn", "+224 621 00 00 15",
     "Agent comptable", "Forum emploi", "HIRED", date(2026, 3, 6), 4, 2, 77.0, 74.0),
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
) -> tuple[list[UUID], int]:
    campaign_ids: list[UUID] = []
    created = 0
    for code, title, need_position, openings, status, start, end in DEMO_CAMPAIGNS:
        campaign = (
            await session.execute(
                select(RecruitmentCampaign).where(
                    RecruitmentCampaign.organization_id == organization_id,
                    RecruitmentCampaign.code == code,
                )
            )
        ).scalar_one_or_none()
        if campaign is None:
            campaign = RecruitmentCampaign(
                organization_id=organization_id,
                code=code,
                title=title,
                need_position=need_position,
                openings=openings,
                status=status,
                start_date=start,
                end_date=end,
            )
            session.add(campaign)
            await session.flush([campaign])
            created += 1
        campaign_ids.append(campaign.campaign_id)
    return campaign_ids, created


def _demo_score(reference: str, salt: str, low: int, high: int) -> int:
    """Score de démonstration déterministe (reproductible) dans [low, high]."""
    digest = sum(ord(char) for char in f"{reference}:{salt}")
    return low + digest % (high - low + 1)


async def _ensure_applications(
    session: AsyncSession, *, organization_id: UUID, campaign_ids: list[UUID]
) -> int:
    created = 0
    for app in DEMO_APPLICATIONS:
        (
            reference,
            full_name,
            email,
            phone,
            desired_position,
            source_channel,
            status,
            received_on,
            experience_years,
            campaign_index,
            skills_score,
            education_score,
        ) = app
        existing = (
            await session.execute(
                select(RecruitmentApplication.application_id).where(
                    RecruitmentApplication.organization_id == organization_id,
                    RecruitmentApplication.reference == reference,
                )
            )
        ).first()
        if existing is not None:
            continue
        # Scores entretien/test : l'entretien n'existe qu'à partir du statut
        # INTERVIEW ; le test technique dès la présélection (pas pour un NEW).
        interviewed = status in ("INTERVIEW", "OFFERED", "HIRED")
        session.add(
            RecruitmentApplication(
                organization_id=organization_id,
                campaign_id=campaign_ids[campaign_index] if campaign_index < len(campaign_ids) else None,
                reference=reference,
                candidate_full_name=full_name,
                candidate_email=email,
                candidate_phone=phone,
                desired_position=desired_position,
                source_channel=source_channel,
                application_status=status,
                received_on=received_on,
                experience_years=experience_years,
                skills_match_score=skills_score or None,
                education_score=education_score or None,
                interview_avg_score=(
                    _demo_score(reference, "interview", 60, 92) if interviewed else None
                ),
                test_score=(
                    _demo_score(reference, "test", 55, 95) if status != "NEW" else None
                ),
            )
        )
        created += 1
    return created


async def main() -> None:
    async with session_scope() as session:
        org = await _get_organization(session)
        campaign_ids, campaigns_created = await _ensure_campaigns(
            session, organization_id=org.organization_id
        )
        applications_created = await _ensure_applications(
            session, organization_id=org.organization_id, campaign_ids=campaign_ids
        )

    print(  # noqa: T201
        "Seed de démonstration du module Recrutement terminé :\n"
        f"  - Campagnes    : {campaigns_created} créée(s) / {len(DEMO_CAMPAIGNS)} au total\n"
        f"  - Candidatures : {applications_created} créée(s) / {len(DEMO_APPLICATIONS)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
