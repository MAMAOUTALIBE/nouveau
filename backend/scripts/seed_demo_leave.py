"""Seed de démonstration — module Absences.

Peuple les données du module Absences pour le développement local :

  1. Demandes de congé (~12) — page « Demandes » (et « Calendrier »).
  2. Soldes de congé (ANNUAL + SICK) pour chaque agent — page « Soldes ».

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_leave

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from decimal import Decimal
from uuid import UUID

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.organization import Organization
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

FISCAL_YEAR = 2026

# ---------------------------------------------------------------------------
# Demandes : (index agent, code type, début, fin, statut, motif)
# ---------------------------------------------------------------------------
DemoRequest = tuple[int, str, date, date, str, str]

DEMO_REQUESTS: tuple[DemoRequest, ...] = (
    (0, "ANNUAL", date(2026, 6, 1), date(2026, 6, 15), "APPROVED", "Congé annuel"),
    (1, "SICK", date(2026, 4, 10), date(2026, 4, 14), "APPROVED", "Arrêt maladie"),
    (2, "ANNUAL", date(2026, 7, 1), date(2026, 7, 20), "PENDING", "Vacances d'été"),
    (3, "MATERNITY", date(2026, 3, 2), date(2026, 6, 29), "APPROVED", "Congé maternité"),
    (4, "TRAINING", date(2026, 5, 4), date(2026, 5, 8), "IN_REVIEW", "Formation certifiante"),
    (5, "ANNUAL", date(2026, 8, 3), date(2026, 8, 14), "PENDING", "Congé annuel"),
    (6, "BEREAVEMENT", date(2026, 2, 16), date(2026, 2, 18), "APPROVED", "Congé décès / deuil"),
    (7, "SICK", date(2026, 5, 12), date(2026, 5, 13), "APPROVED", "Maladie courte durée"),
    (8, "PATERNITY", date(2026, 4, 20), date(2026, 4, 22), "APPROVED", "Congé paternité"),
    (9, "ANNUAL", date(2026, 9, 1), date(2026, 9, 30), "REJECTED", "Refusé — sous-effectif"),
    (10, "MARRIAGE", date(2026, 6, 22), date(2026, 6, 26), "APPROVED", "Congé mariage"),
    (11, "UNPAID", date(2026, 7, 13), date(2026, 7, 31), "CANCELLED", "Congé sans solde annulé"),
)

# Soldes : (code type, jours alloués) — créés pour chaque agent.
DEMO_BALANCE_TYPES: tuple[tuple[str, int], ...] = (
    ("ANNUAL", 30),
    ("SICK", 15),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _leave_type_map(session: AsyncSession, *, organization_id: UUID) -> dict[str, UUID]:
    rows = (
        await session.execute(
            select(LeaveType.code, LeaveType.leave_type_id).where(
                LeaveType.organization_id == organization_id
            )
        )
    ).all()
    return {code: leave_type_id for code, leave_type_id in rows}


async def _ensure_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employees: list[Employee],
    leave_types: dict[str, UUID],
) -> int:
    created = 0
    for index, (emp_index, type_code, start, end, status, reason) in enumerate(DEMO_REQUESTS, 1):
        if emp_index >= len(employees) or type_code not in leave_types:
            continue
        reference = f"CONGE-{FISCAL_YEAR}-{index:04d}"
        existing = (
            await session.execute(
                select(LeaveRequest.leave_request_id).where(
                    LeaveRequest.organization_id == organization_id,
                    LeaveRequest.reference == reference,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            LeaveRequest(
                organization_id=organization_id,
                reference=reference,
                employee_id=employees[emp_index].employee_id,
                leave_type_id=leave_types[type_code],
                request_status=status,
                start_date=start,
                end_date=end,
                reason=reason,
            )
        )
        created += 1
    return created


async def _ensure_balances(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employees: list[Employee],
    leave_types: dict[str, UUID],
) -> int:
    created = 0
    for index, employee in enumerate(employees):
        for type_code, allocated in DEMO_BALANCE_TYPES:
            leave_type_id = leave_types.get(type_code)
            if leave_type_id is None:
                continue
            existing = (
                await session.execute(
                    select(LeaveBalance.leave_balance_id).where(
                        LeaveBalance.employee_id == employee.employee_id,
                        LeaveBalance.leave_type_id == leave_type_id,
                        LeaveBalance.fiscal_year == FISCAL_YEAR,
                    )
                )
            ).first()
            if existing is not None:
                continue
            consumed = (index % 6) * 3 if type_code == "ANNUAL" else (index % 4) * 2
            session.add(
                LeaveBalance(
                    organization_id=organization_id,
                    employee_id=employee.employee_id,
                    leave_type_id=leave_type_id,
                    fiscal_year=FISCAL_YEAR,
                    allocated_days=Decimal(allocated),
                    consumed_days=Decimal(consumed),
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

        leave_types = await _leave_type_map(session, organization_id=org.organization_id)
        if not leave_types:
            raise SystemExit("Aucun type de congé. Lancez d'abord scripts.seed_initial.")

        requests_created = await _ensure_requests(
            session,
            organization_id=org.organization_id,
            employees=employees,
            leave_types=leave_types,
        )
        balances_created = await _ensure_balances(
            session,
            organization_id=org.organization_id,
            employees=employees,
            leave_types=leave_types,
        )

    print(  # noqa: T201
        "Seed de démonstration du module Absences terminé :\n"
        f"  - Demandes de congé : {requests_created} créée(s) / {len(DEMO_REQUESTS)} au total\n"
        f"  - Soldes de congé   : {balances_created} créé(s)"
    )


if __name__ == "__main__":
    asyncio.run(main())
