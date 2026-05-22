"""Seed de démonstration — module Workflows.

Peuple les données du module Workflows pour le développement local :

  1. Définitions de workflow (~4) avec leurs étapes — page « Définitions ».
  2. Instances de workflow (~10) — page « Instances ».

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_workflow

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from uuid import UUID

from app.core.db import session_scope
from app.models.employee import Employee
from app.models.organization import Organization
from app.models.workflow import WorkflowDefinition, WorkflowInstance, WorkflowStep
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Définitions : (code, nom, module, SLA heures, étapes[(ordre, code, libellé, rôle, SLA)])
# ---------------------------------------------------------------------------
DEMO_DEFINITIONS: tuple[tuple[str, str, str, int, tuple[tuple[int, str, str, str, int], ...]], ...] = (
    ("WF-CONGE", "Validation des demandes de congé", "leave", 48, (
        (1, "L1", "Validation hiérarchique", "manager", 24),
        (2, "L2", "Validation RH", "hr_manager", 24),
    )),
    ("WF-RECRUT", "Processus de recrutement", "recruitment", 120, (
        (1, "PRESEL", "Présélection des candidatures", "hr_manager", 48),
        (2, "ENTRETIEN", "Entretien de recrutement", "manager", 48),
        (3, "DECISION", "Décision finale", "super_admin", 24),
    )),
    ("WF-FORMATION", "Validation des demandes de formation", "training", 72, (
        (1, "MGR", "Validation hiérarchique", "manager", 48),
        (2, "RH", "Validation RH et budget", "hr_manager", 24),
    )),
    ("WF-MOUVEMENT", "Validation des mouvements de carrière", "careers", 96, (
        (1, "DRH", "Avis de la DRH", "hr_manager", 48),
        (2, "CAB", "Décision du Cabinet", "super_admin", 48),
    )),
)

# Instances : (réf, index définition, index agent, statut, priorité, étape courante, étapes faites)
DEMO_INSTANCES: tuple[tuple[str, int, int, str, str, int, int], ...] = (
    ("WFI-2026-001", 0, 0, "IN_PROGRESS", "NORMAL", 1, 0),
    ("WFI-2026-002", 0, 1, "APPROVED", "NORMAL", 2, 2),
    ("WFI-2026-003", 1, 2, "IN_PROGRESS", "HIGH", 2, 1),
    ("WFI-2026-004", 2, 3, "PENDING", "NORMAL", 1, 0),
    ("WFI-2026-005", 3, 4, "ESCALATED", "CRITICAL", 1, 0),
    ("WFI-2026-006", 0, 5, "REJECTED", "LOW", 1, 0),
    ("WFI-2026-007", 1, 6, "APPROVED", "NORMAL", 3, 3),
    ("WFI-2026-008", 2, 7, "IN_PROGRESS", "HIGH", 2, 1),
    ("WFI-2026-009", 3, 8, "PENDING", "NORMAL", 1, 0),
    ("WFI-2026-010", 0, 9, "CANCELLED", "NORMAL", 1, 0),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _ensure_definitions(
    session: AsyncSession, *, organization_id: UUID
) -> tuple[list[UUID], list[int], int, int]:
    """Crée les définitions + leurs étapes. Retourne (ids, nb_étapes, défs créées, étapes créées)."""
    definition_ids: list[UUID] = []
    step_totals: list[int] = []
    defs_created = 0
    steps_created = 0
    for code, name, module_name, sla, steps in DEMO_DEFINITIONS:
        definition = (
            await session.execute(
                select(WorkflowDefinition).where(
                    WorkflowDefinition.organization_id == organization_id,
                    WorkflowDefinition.code == code,
                )
            )
        ).scalar_one_or_none()
        if definition is None:
            definition = WorkflowDefinition(
                organization_id=organization_id,
                code=code,
                name=name,
                module_name=module_name,
                sla_target_hours=sla,
                auto_escalation=True,
            )
            session.add(definition)
            await session.flush([definition])
            defs_created += 1
            for order, step_code, label, role, step_sla in steps:
                session.add(
                    WorkflowStep(
                        workflow_definition_id=definition.workflow_definition_id,
                        step_order=order,
                        code=step_code,
                        label=label,
                        approver_role_code=role,
                        sla_hours=step_sla,
                    )
                )
                steps_created += 1
        definition_ids.append(definition.workflow_definition_id)
        step_totals.append(len(steps))
    return definition_ids, step_totals, defs_created, steps_created


async def _ensure_instances(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employees: list[Employee],
    definition_ids: list[UUID],
    step_totals: list[int],
) -> int:
    created = 0
    for ref, def_index, emp_index, status, priority, current_step, steps_done in DEMO_INSTANCES:
        if def_index >= len(definition_ids) or emp_index >= len(employees):
            continue
        existing = (
            await session.execute(
                select(WorkflowInstance.workflow_instance_id).where(
                    WorkflowInstance.organization_id == organization_id,
                    WorkflowInstance.reference == ref,
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            WorkflowInstance(
                organization_id=organization_id,
                reference=ref,
                workflow_definition_id=definition_ids[def_index],
                requester_employee_id=employees[emp_index].employee_id,
                instance_status=status,
                priority=priority,
                current_step_order=current_step,
                steps_total=step_totals[def_index],
                steps_completed=steps_done,
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

        definition_ids, step_totals, defs_created, steps_created = await _ensure_definitions(
            session, organization_id=org.organization_id
        )
        instances_created = await _ensure_instances(
            session,
            organization_id=org.organization_id,
            employees=employees,
            definition_ids=definition_ids,
            step_totals=step_totals,
        )

    print(  # noqa: T201
        "Seed de démonstration du module Workflows terminé :\n"
        f"  - Définitions : {defs_created} créée(s) / {len(DEMO_DEFINITIONS)} au total\n"
        f"  - Étapes      : {steps_created} créée(s)\n"
        f"  - Instances   : {instances_created} créée(s) / {len(DEMO_INSTANCES)} au total"
    )


if __name__ == "__main__":
    asyncio.run(main())
