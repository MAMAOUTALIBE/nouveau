"""Seed de démonstration — Demandes de documents administratifs.

Peuple la table `hr.document_requests` pour le développement local :
~10 demandes de documents (attestations, certificats...) rattachées aux agents
de démonstration. Alimente le Portail manager (panneau « Demandes de documents
en attente ») ainsi que le Portail agent.

Idempotent : ré-exécutable sans créer de doublon (clé = organisation + référence).

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_document_requests

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`,
et la migration `0006_document_requests` appliquée (`alembic upgrade head`).
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.document import DocumentRequest
from app.models.employee import Employee
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Demandes : (réf, index agent, type de document, statut, motif, date souhaitée)
# Statuts possibles : PENDING / APPROVED / REJECTED / CANCELLED.
# Les PENDING apparaissent dans le panneau « à traiter » du Portail manager.
# ---------------------------------------------------------------------------
DEMO_REQUESTS: tuple[tuple[str, int, str, str, str, date], ...] = (
    ("DDOC-2026-001", 0, "Attestation de travail", "PENDING",
     "Constitution d'un dossier bancaire", date(2026, 6, 5)),
    ("DDOC-2026-002", 1, "Attestation de salaire", "PENDING",
     "Demande de prêt immobilier", date(2026, 6, 10)),
    ("DDOC-2026-003", 2, "Certificat de travail", "APPROVED",
     "Dossier de mutation administrative", date(2026, 5, 28)),
    ("DDOC-2026-004", 3, "Ordre de mission", "PENDING",
     "Mission de supervision à l'intérieur du pays", date(2026, 6, 15)),
    ("DDOC-2026-005", 4, "Attestation de prise de service", "APPROVED",
     "Régularisation du dossier administratif", date(2026, 5, 25)),
    ("DDOC-2026-006", 5, "Bulletin de paie", "PENDING",
     "Justificatif pour une bourse d'études", date(2026, 6, 20)),
    ("DDOC-2026-007", 6, "Attestation de congé", "REJECTED",
     "Période de congé non encore validée", date(2026, 7, 1)),
    ("DDOC-2026-008", 7, "Certificat administratif", "PENDING",
     "Inscription à un concours de la fonction publique", date(2026, 6, 30)),
    ("DDOC-2026-009", 8, "Attestation de présence", "CANCELLED",
     "Demande annulée par l'agent", date(2026, 6, 8)),
    ("DDOC-2026-010", 9, "Attestation de cessation de paiement", "PENDING",
     "Dossier de départ à la retraite", date(2026, 7, 10)),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employees: list[Employee],
) -> int:
    created = 0
    for ref, emp_index, doc_type, status, purpose, needed_by in DEMO_REQUESTS:
        if emp_index >= len(employees):
            continue
        existing = (
            await session.execute(
                select(DocumentRequest.document_request_id).where(
                    DocumentRequest.organization_id == organization_id,
                    DocumentRequest.reference == ref,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            DocumentRequest(
                organization_id=organization_id,
                reference=ref,
                requested_by_employee_id=employees[emp_index].employee_id,
                document_type_label=doc_type,
                purpose=purpose,
                needed_by=needed_by,
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

        requests_created = await _ensure_requests(
            session,
            organization_id=org.organization_id,
            employees=employees,
        )

    print(  # noqa: T201
        "Seed de démonstration des demandes de documents terminé :\n"
        f"  - Demandes : {requests_created} créée(s) / {len(DEMO_REQUESTS)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
