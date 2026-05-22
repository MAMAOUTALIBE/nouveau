"""Seed de démonstration — module Formation.

Peuple les données du module Formation pour le développement local :

  1. Catalogue de formations (~6) — page « Catalogue ».
  2. Sessions de formation (~6) rattachées au catalogue — page « Sessions ».
  3. Demandes de formation (~10) — page « Demandes ».

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_training

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.training import TrainingCatalog, TrainingRequest, TrainingSession
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Catalogue : (code, intitulé, catégorie, durée en heures)
# ---------------------------------------------------------------------------
DEMO_CATALOG: tuple[tuple[str, str, str, int], ...] = (
    ("FORM-MGMT", "Management d'équipe", "Management", 21),
    ("FORM-BUREAU", "Bureautique avancée", "Bureautique", 14),
    ("FORM-COMPTA", "Comptabilité publique", "Finances", 35),
    ("FORM-DROIT", "Droit administratif", "Juridique", 28),
    ("FORM-INFO", "Cybersécurité et bonnes pratiques", "Informatique", 14),
    ("FORM-LANG", "Anglais professionnel", "Langues", 40),
)

# Sessions : (réf, intitulé, index catalogue, formateur, lieu, statut, début, fin, capacité)
DEMO_SESSIONS: tuple[tuple[str, str, int, str, str, str, date, date, int], ...] = (
    ("SESS-2026-01", "Management d'équipe — Session 1", 0, "Cabinet Excellence RH",
     "Conakry — Centre de formation", "PLANNED", date(2026, 6, 8), date(2026, 6, 10), 20),
    ("SESS-2026-02", "Bureautique avancée — Session 1", 1, "Institut Numérique",
     "Conakry — Salle informatique", "IN_PROGRESS", date(2026, 5, 18), date(2026, 5, 19), 15),
    ("SESS-2026-03", "Comptabilité publique — Session 1", 2, "École Nationale d'Administration",
     "Conakry — Amphi A", "PLANNED", date(2026, 9, 1), date(2026, 9, 5), 25),
    ("SESS-2025-09", "Droit administratif — Session 2025", 3, "Faculté de Droit",
     "Conakry — Amphi B", "COMPLETED", date(2025, 11, 3), date(2025, 11, 7), 30),
    ("SESS-2026-04", "Cybersécurité — Session 1", 4, "Agence Nationale Cybersécurité",
     "En ligne", "PLANNED", date(2026, 7, 6), date(2026, 7, 7), 40),
    ("SESS-2026-05", "Anglais professionnel — Session 1", 5, "British Council",
     "Conakry — Centre culturel", "CANCELLED", date(2026, 4, 1), date(2026, 6, 30), 12),
)

# Demandes : (réf, index agent, index catalogue, statut, motivation)
DEMO_REQUESTS: tuple[tuple[str, int, int, str, str], ...] = (
    ("DFORM-2026-001", 0, 0, "APPROVED", "Préparation à une fonction d'encadrement"),
    ("DFORM-2026-002", 1, 1, "PENDING", "Mise à niveau bureautique"),
    ("DFORM-2026-003", 2, 2, "APPROVED", "Évolution vers un poste comptable"),
    ("DFORM-2026-004", 3, 4, "PENDING", "Sensibilisation à la cybersécurité"),
    ("DFORM-2026-005", 4, 3, "REJECTED", "Budget formation épuisé pour l'exercice"),
    ("DFORM-2026-006", 5, 5, "PENDING", "Communication avec les partenaires internationaux"),
    ("DFORM-2026-007", 6, 0, "APPROVED", "Développement des compétences managériales"),
    ("DFORM-2026-008", 7, 2, "PENDING", "Renforcement en comptabilité publique"),
    ("DFORM-2026-009", 8, 1, "CANCELLED", "Demande annulée par l'agent"),
    ("DFORM-2026-010", 9, 4, "APPROVED", "Conformité aux règles de sécurité informatique"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_catalog(
    session: AsyncSession, *, organization_id: UUID
) -> tuple[list[UUID], int]:
    catalog_ids: list[UUID] = []
    created = 0
    for code, title, category, duration in DEMO_CATALOG:
        entry = (
            await session.execute(
                select(TrainingCatalog).where(
                    TrainingCatalog.organization_id == organization_id,
                    TrainingCatalog.code == code,
                )
            )
        ).scalar_one_or_none()
        if entry is None:
            entry = TrainingCatalog(
                organization_id=organization_id,
                code=code,
                title=title,
                category=category,
                duration_hours=duration,
            )
            session.add(entry)
            await session.flush([entry])
            created += 1
        catalog_ids.append(entry.training_catalog_id)
    return catalog_ids, created


async def _ensure_sessions(
    session: AsyncSession, *, organization_id: UUID, catalog_ids: list[UUID]
) -> int:
    created = 0
    for ref, title, cat_index, instructor, location, status, start, end, capacity in DEMO_SESSIONS:
        existing = (
            await session.execute(
                select(TrainingSession.training_session_id).where(
                    TrainingSession.organization_id == organization_id,
                    TrainingSession.reference == ref,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            TrainingSession(
                organization_id=organization_id,
                training_catalog_id=catalog_ids[cat_index] if cat_index < len(catalog_ids) else None,
                reference=ref,
                title=title,
                instructor=instructor,
                location=location,
                session_status=status,
                start_date=start,
                end_date=end,
                capacity=capacity,
            )
        )
        created += 1
    return created


async def _ensure_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employees: list[Employee],
    catalog_ids: list[UUID],
) -> int:
    created = 0
    for ref, emp_index, cat_index, status, motivation in DEMO_REQUESTS:
        if emp_index >= len(employees):
            continue
        existing = (
            await session.execute(
                select(TrainingRequest.training_request_id).where(
                    TrainingRequest.organization_id == organization_id,
                    TrainingRequest.reference == ref,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            TrainingRequest(
                organization_id=organization_id,
                reference=ref,
                requested_by_employee_id=employees[emp_index].employee_id,
                training_catalog_id=catalog_ids[cat_index] if cat_index < len(catalog_ids) else None,
                motivation=motivation,
                request_status=status,
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

        catalog_ids, catalog_created = await _ensure_catalog(
            session, organization_id=org.organization_id
        )
        sessions_created = await _ensure_sessions(
            session, organization_id=org.organization_id, catalog_ids=catalog_ids
        )
        requests_created = await _ensure_requests(
            session,
            organization_id=org.organization_id,
            employees=employees,
            catalog_ids=catalog_ids,
        )

    print(  # noqa: T201
        "Seed de démonstration du module Formation terminé :\n"
        f"  - Catalogue : {catalog_created} créé(s) / {len(DEMO_CATALOG)} au total\n"
        f"  - Sessions  : {sessions_created} créée(s) / {len(DEMO_SESSIONS)} au total\n"
        f"  - Demandes  : {requests_created} créée(s) / {len(DEMO_REQUESTS)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
