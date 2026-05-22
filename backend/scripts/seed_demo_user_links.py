"""Seed de démonstration — liaison comptes ↔ employés.

Renseigne `hr.users.employee_id` (colonne ajoutée par la migration 0003)
pour les comptes de démonstration. Indispensable au scope SELF et aux
portails (employé / manager) : un compte peut alors résoudre « son » agent.

Idempotent : ne modifie que les comptes dont le lien est absent.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_user_links

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Liaison : username du compte → matricule de l'employé.
DEMO_USER_LINKS: tuple[tuple[str, str], ...] = (
    ("admin", "PRIM-0001"),
    ("hr", "PRIM-0002"),
    ("manager", "PRIM-0003"),
    ("agent", "PRIM-0004"),
)


async def _employee_id_by_matricule(session: AsyncSession, matricule: str) -> object | None:
    return (
        await session.execute(
            select(Employee.employee_id).where(Employee.matricule == matricule)
        )
    ).scalar_one_or_none()


async def main() -> None:
    linked = 0
    skipped = 0
    async with session_scope() as session:
        for username, matricule in DEMO_USER_LINKS:
            user = (
                await session.execute(select(User).where(User.username == username))
            ).scalar_one_or_none()
            if user is None:
                continue
            if user.employee_id is not None:
                skipped += 1
                continue
            employee_id = await _employee_id_by_matricule(session, matricule)
            if employee_id is None:
                continue
            user.employee_id = employee_id
            linked += 1

    print(  # noqa: T201
        "Seed des liaisons compte ↔ employé terminé :\n"
        f"  - {linked} compte(s) lié(s) à un employé\n"
        f"  - {skipped} compte(s) déjà lié(s) (ignorés)"
    )


if __name__ == "__main__":
    asyncio.run(main())
