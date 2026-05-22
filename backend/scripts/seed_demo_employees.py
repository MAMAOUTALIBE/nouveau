"""Seed de démonstration — agents (`hr.employees`).

Peuple la liste des agents avec un jeu de données réaliste pour le
développement local. Idempotent : ré-exécutable sans créer de doublon
(chaque agent est identifié par `(organization_id, matricule)`).

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_employees

Pré-requis : `scripts.seed_initial` doit avoir été lancé au préalable
(il crée l'organisation PRIMATURE et la direction démo DGCAB).
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.organization import Direction, Organization
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Jeu de démonstration : 24 agents de la fonction publique guinéenne.
# Champs : matricule, prénom, nom, type de contrat, statut, date d'embauche,
#          date de naissance, fin de contrat (si CDD), email, téléphone.
# ---------------------------------------------------------------------------
DemoAgent = tuple[str, str, str, str, str, date, date, date | None, str, str]

DEMO_AGENTS: tuple[DemoAgent, ...] = (
    ("PRIM-0001", "Aminata", "Diallo", "Titulaire", "ACTIVE",
     date(2009, 3, 2), date(1982, 6, 14), None,
     "a.diallo@primature.gov.gn", "+224 620 11 22 01"),
    ("PRIM-0002", "Mamadou", "Camara", "Titulaire", "ACTIVE",
     date(2006, 9, 18), date(1976, 1, 9), None,
     "m.camara@primature.gov.gn", "+224 620 11 22 02"),
    ("PRIM-0003", "Fatoumata", "Bah", "Contractuel", "ACTIVE",
     date(2021, 1, 11), date(1990, 11, 25), date(2026, 9, 30),
     "f.bah@primature.gov.gn", "+224 620 11 22 03"),
    ("PRIM-0004", "Ibrahima", "Sow", "Titulaire", "ACTIVE",
     date(2012, 6, 4), date(1985, 4, 30), None,
     "i.sow@primature.gov.gn", "+224 620 11 22 04"),
    ("PRIM-0005", "Mariama", "Condé", "Titulaire", "ON_LEAVE",
     date(2010, 10, 21), date(1988, 8, 2), None,
     "m.conde@primature.gov.gn", "+224 620 11 22 05"),
    ("PRIM-0006", "Ousmane", "Soumah", "Contractuel", "ACTIVE",
     date(2022, 2, 14), date(1993, 12, 17), date(2026, 12, 31),
     "o.soumah@primature.gov.gn", "+224 620 11 22 06"),
    ("PRIM-0007", "Hadja", "Barry", "Titulaire", "ACTIVE",
     date(2004, 7, 1), date(1968, 2, 15), None,
     "h.barry@primature.gov.gn", "+224 620 11 22 07"),
    ("PRIM-0008", "Sékou", "Touré", "Titulaire", "ACTIVE",
     date(2008, 5, 12), date(1979, 9, 28), None,
     "s.toure@primature.gov.gn", "+224 620 11 22 08"),
    ("PRIM-0009", "Kadiatou", "Baldé", "Contractuel", "ACTIVE",
     date(2023, 3, 6), date(1996, 5, 3), date(2026, 6, 30),
     "k.balde@primature.gov.gn", "+224 620 11 22 09"),
    ("PRIM-0010", "Alpha", "Kourouma", "Titulaire", "ACTIVE",
     date(2007, 11, 19), date(1974, 7, 21), None,
     "a.kourouma@primature.gov.gn", "+224 620 11 22 10"),
    ("PRIM-0011", "Aïssatou", "Sylla", "Titulaire", "ACTIVE",
     date(2013, 4, 8), date(1987, 3, 11), None,
     "a.sylla@primature.gov.gn", "+224 620 11 22 11"),
    ("PRIM-0012", "Mohamed", "Keïta", "Stagiaire", "ACTIVE",
     date(2025, 1, 13), date(2000, 10, 6), date(2026, 1, 12),
     "m.keita@primature.gov.gn", "+224 620 11 22 12"),
    ("PRIM-0013", "Djénabou", "Bangoura", "Titulaire", "ACTIVE",
     date(2011, 8, 23), date(1983, 12, 1), None,
     "d.bangoura@primature.gov.gn", "+224 620 11 22 13"),
    ("PRIM-0014", "Lansana", "Fofana", "Contractuel", "ACTIVE",
     date(2020, 9, 2), date(1991, 6, 19), date(2026, 9, 1),
     "l.fofana@primature.gov.gn", "+224 620 11 22 14"),
    ("PRIM-0015", "Néné", "Diakité", "Titulaire", "ACTIVE",
     date(2005, 2, 28), date(1970, 4, 5), None,
     "n.diakite@primature.gov.gn", "+224 620 11 22 15"),
    ("PRIM-0016", "Thierno", "Baldé", "Titulaire", "ACTIVE",
     date(2014, 12, 1), date(1989, 1, 22), None,
     "t.balde@primature.gov.gn", "+224 620 11 22 16"),
    ("PRIM-0017", "Saran", "Cissé", "Contractuel", "ON_LEAVE",
     date(2021, 6, 7), date(1994, 9, 14), date(2027, 6, 6),
     "s.cisse@primature.gov.gn", "+224 620 11 22 17"),
    ("PRIM-0018", "Boubacar", "Camara", "Titulaire", "ACTIVE",
     date(2009, 10, 5), date(1981, 11, 30), None,
     "b.camara@primature.gov.gn", "+224 620 11 22 18"),
    ("PRIM-0019", "Mabinty", "Doumbouya", "Titulaire", "ACTIVE",
     date(2016, 3, 14), date(1992, 2, 8), None,
     "m.doumbouya@primature.gov.gn", "+224 620 11 22 19"),
    ("PRIM-0020", "Elhadj", "Barry", "Titulaire", "ACTIVE",
     date(2003, 1, 20), date(1965, 8, 17), None,
     "e.barry@primature.gov.gn", "+224 620 11 22 20"),
    ("PRIM-0021", "Fanta", "Traoré", "Contractuel", "ACTIVE",
     date(2024, 2, 1), date(1997, 12, 24), date(2026, 8, 31),
     "f.traore@primature.gov.gn", "+224 620 11 22 21"),
    ("PRIM-0022", "Mamadou", "Diané", "Titulaire", "ACTIVE",
     date(2010, 7, 9), date(1984, 5, 16), None,
     "m.diane@primature.gov.gn", "+224 620 11 22 22"),
    ("PRIM-0023", "Hawa", "Bangoura", "Stagiaire", "ACTIVE",
     date(2025, 9, 1), date(2001, 3, 27), date(2026, 8, 31),
     "h.bangoura@primature.gov.gn", "+224 620 11 22 23"),
    ("PRIM-0024", "Abdoulaye", "Camara", "Titulaire", "INACTIVE",
     date(2002, 4, 15), date(1963, 10, 2), None,
     "a.camara@primature.gov.gn", "+224 620 11 22 24"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit(
            "Organisation PRIMATURE introuvable. Lancez d'abord : "
            "uv run python -m scripts.seed_initial"
        )
    return org


async def _get_demo_direction(session: AsyncSession, *, organization_id: UUID) -> Direction | None:
    return (
        await session.execute(
            select(Direction).where(
                Direction.organization_id == organization_id,
                Direction.code == "DGCAB",
            )
        )
    ).scalar_one_or_none()


async def _ensure_employee(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_id: UUID | None,
    agent: DemoAgent,
) -> bool:
    """Crée l'agent s'il n'existe pas. Retourne True si une création a eu lieu."""
    (
        matricule,
        first_name,
        last_name,
        contract_type,
        employment_status,
        hire_date,
        birth_date,
        contract_end_date,
        email,
        phone,
    ) = agent

    existing = (
        await session.execute(
            select(Employee).where(
                Employee.organization_id == organization_id,
                Employee.matricule == matricule,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return False

    session.add(
        Employee(
            organization_id=organization_id,
            direction_id=direction_id,
            matricule=matricule,
            first_name=first_name,
            last_name=last_name,
            full_name=f"{first_name} {last_name}",
            email=email,
            phone=phone,
            employment_status=employment_status,
            contract_type=contract_type,
            hire_date=hire_date,
            birth_date=birth_date,
            contract_end_date=contract_end_date,
        )
    )
    return True


async def main() -> None:
    created = 0
    async with session_scope() as session:
        org = await _get_organization(session)
        direction = await _get_demo_direction(session, organization_id=org.organization_id)
        direction_id = direction.direction_id if direction is not None else None

        for agent in DEMO_AGENTS:
            if await _ensure_employee(
                session,
                organization_id=org.organization_id,
                direction_id=direction_id,
                agent=agent,
            ):
                created += 1

    skipped = len(DEMO_AGENTS) - created
    print(  # noqa: T201
        "Seed agents de démonstration terminé :\n"
        f"  - {created} agent(s) créé(s)\n"
        f"  - {skipped} agent(s) déjà présent(s) (ignorés)\n"
        f"  - {len(DEMO_AGENTS)} agents au total dans le jeu de démo"
    )


if __name__ == "__main__":
    asyncio.run(main())
