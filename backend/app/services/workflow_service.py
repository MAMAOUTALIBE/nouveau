"""Service métier — Workflows.

V0/V1 : moteur maison simple (steps séquentielles, transitions APPROVE /
REJECT / ADVANCE / ESCALATE / CANCEL). Le moteur BPMN réel arrive en
vague 6 (PY-060 → PY-062, recommandation : SpiffWorkflow Python pur).
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.workflow import (
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowInstanceEvent,
    WorkflowStep,
)
from app.schemas.workflow import (
    WorkflowDefinitionCreateRequest,
    WorkflowDefinitionDetail,
    WorkflowDefinitionResponse,
    WorkflowInstanceActionRequest,
    WorkflowInstanceCreateRequest,
    WorkflowInstanceEventResponse,
    WorkflowInstanceResponse,
    WorkflowStepResponse,
)


# ============================================================================
# Definitions
# ============================================================================
async def list_definitions(
    session: AsyncSession, *, organization_id: UUID
) -> list[WorkflowDefinitionResponse]:
    stmt = (
        select(WorkflowDefinition)
        .where(
            WorkflowDefinition.organization_id == organization_id,
            WorkflowDefinition.status == "ACTIVE",
        )
        .order_by(WorkflowDefinition.code, WorkflowDefinition.version_no.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [WorkflowDefinitionResponse.model_validate(r) for r in rows]


async def get_definition(
    session: AsyncSession, *, workflow_definition_id: UUID
) -> WorkflowDefinitionDetail:
    stmt = select(WorkflowDefinition).where(
        WorkflowDefinition.workflow_definition_id == workflow_definition_id
    )
    definition = (await session.execute(stmt)).scalar_one_or_none()
    if definition is None:
        raise NotFoundError("Définition de workflow introuvable.", code="WORKFLOW_DEF_NOT_FOUND")
    steps = (
        (
            await session.execute(
                select(WorkflowStep)
                .where(WorkflowStep.workflow_definition_id == workflow_definition_id)
                .order_by(WorkflowStep.step_order)
            )
        )
        .scalars()
        .all()
    )
    return WorkflowDefinitionDetail(
        workflow_definition_id=definition.workflow_definition_id,
        organization_id=definition.organization_id,
        code=definition.code,
        name=definition.name,
        module_name=definition.module_name,
        status=definition.status,
        sla_target_hours=definition.sla_target_hours,
        auto_escalation=definition.auto_escalation,
        version_no=definition.version_no,
        created_at=definition.created_at,
        updated_at=definition.updated_at,
        steps=[WorkflowStepResponse.model_validate(s) for s in steps],
    )


async def create_definition(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: WorkflowDefinitionCreateRequest,
    audit: AuditWriter,
) -> WorkflowDefinitionDetail:
    # Si un workflow avec ce code existe déjà : on incrémente version_no
    existing = (
        await session.execute(
            select(WorkflowDefinition)
            .where(
                WorkflowDefinition.organization_id == organization_id,
                WorkflowDefinition.code == body.code,
            )
            .order_by(WorkflowDefinition.version_no.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    next_version = (existing.version_no + 1) if existing is not None else 1

    definition = WorkflowDefinition(
        organization_id=organization_id,
        code=body.code,
        name=body.name,
        module_name=body.module_name,
        status="ACTIVE",
        sla_target_hours=body.sla_target_hours,
        auto_escalation=body.auto_escalation,
        version_no=next_version,
    )
    session.add(definition)
    await session.flush([definition])

    for step_body in body.steps:
        session.add(
            WorkflowStep(
                workflow_definition_id=definition.workflow_definition_id,
                step_order=step_body.step_order,
                code=step_body.code,
                label=step_body.label,
                approver_role_code=step_body.approver_role_code,
                sla_hours=step_body.sla_hours,
            )
        )
    await session.flush()

    await audit.record(
        action="WORKFLOW_DEFINITION_CREATED",
        target_type="workflow_definition",
        target_id=str(definition.workflow_definition_id),
        after={
            "code": body.code,
            "version_no": next_version,
            "module_name": body.module_name,
            "steps": len(body.steps),
        },
    )
    return await get_definition(session, workflow_definition_id=definition.workflow_definition_id)


# ============================================================================
# Instances
# ============================================================================
async def list_instances(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    instance_status: str | None = None,
    workflow_definition_id: UUID | None = None,
) -> tuple[list[WorkflowInstanceResponse], int]:
    base = select(WorkflowInstance).where(WorkflowInstance.organization_id == organization_id)
    if instance_status:
        base = base.where(WorkflowInstance.instance_status == instance_status)
    if workflow_definition_id:
        base = base.where(WorkflowInstance.workflow_definition_id == workflow_definition_id)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()
    page_stmt = (
        base.order_by(WorkflowInstance.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()
    items = [
        WorkflowInstanceResponse(
            workflow_instance_id=i.workflow_instance_id,
            organization_id=i.organization_id,
            reference=i.reference,
            workflow_definition_id=i.workflow_definition_id,
            requester_employee_id=i.requester_employee_id,
            requester_user_id=i.requester_user_id,
            owner_user_id=i.owner_user_id,
            current_step_order=i.current_step_order,
            instance_status=i.instance_status,
            priority=i.priority,
            due_on=i.due_on,
            started_at=i.started_at,
            completed_at=i.completed_at,
            steps_total=i.steps_total,
            steps_completed=i.steps_completed,
            escalation_level=i.escalation_level,
            metadata=i.instance_metadata,
            created_at=i.created_at,
            updated_at=i.updated_at,
        )
        for i in rows
    ]
    return items, int(total)


async def _next_instance_reference(session: AsyncSession, organization_id: UUID) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"WF-{year}-"
    count_stmt = (
        select(func.count())
        .select_from(WorkflowInstance)
        .where(
            WorkflowInstance.organization_id == organization_id,
            WorkflowInstance.reference.startswith(prefix),
        )
    )
    count = (await session.execute(count_stmt)).scalar_one()
    return f"{prefix}{int(count) + 1:06d}"


async def create_instance(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: WorkflowInstanceCreateRequest,
    audit: AuditWriter,
) -> WorkflowInstanceResponse:
    # Résoudre nb d'étapes
    definition = (
        await session.execute(
            select(WorkflowDefinition).where(
                WorkflowDefinition.workflow_definition_id == body.workflow_definition_id
            )
        )
    ).scalar_one_or_none()
    if definition is None:
        raise NotFoundError("Définition introuvable.", code="WORKFLOW_DEF_NOT_FOUND")

    steps_total = (
        await session.execute(
            select(func.count())
            .select_from(WorkflowStep)
            .where(WorkflowStep.workflow_definition_id == definition.workflow_definition_id)
        )
    ).scalar_one()

    reference = await _next_instance_reference(session, organization_id)

    instance = WorkflowInstance(
        organization_id=organization_id,
        reference=reference,
        workflow_definition_id=definition.workflow_definition_id,
        requester_employee_id=body.requester_employee_id,
        requester_user_id=body.requester_user_id,
        owner_user_id=body.owner_user_id,
        current_step_order=1 if steps_total else None,
        instance_status="PENDING",
        priority=body.priority,
        due_on=body.due_on,
        started_at=datetime.now(tz=UTC),
        steps_total=int(steps_total),
        steps_completed=0,
        escalation_level=0,
        instance_metadata=body.metadata,
    )
    session.add(instance)
    await session.flush([instance])

    session.add(
        WorkflowInstanceEvent(
            workflow_instance_id=instance.workflow_instance_id,
            event_type="STARTED",
            actor_user_id=body.requester_user_id,
            note="Instance créée",
        )
    )

    await audit.record(
        action="WORKFLOW_INSTANCE_CREATED",
        target_type="workflow_instance",
        target_id=str(instance.workflow_instance_id),
        after={
            "reference": reference,
            "workflow_definition_id": str(definition.workflow_definition_id),
            "priority": body.priority,
        },
    )
    return WorkflowInstanceResponse(
        workflow_instance_id=instance.workflow_instance_id,
        organization_id=instance.organization_id,
        reference=instance.reference,
        workflow_definition_id=instance.workflow_definition_id,
        requester_employee_id=instance.requester_employee_id,
        requester_user_id=instance.requester_user_id,
        owner_user_id=instance.owner_user_id,
        current_step_order=instance.current_step_order,
        instance_status=instance.instance_status,
        priority=instance.priority,
        due_on=instance.due_on,
        started_at=instance.started_at,
        completed_at=instance.completed_at,
        steps_total=instance.steps_total,
        steps_completed=instance.steps_completed,
        escalation_level=instance.escalation_level,
        metadata=instance.instance_metadata,
        created_at=instance.created_at,
        updated_at=instance.updated_at,
    )


async def perform_action(
    session: AsyncSession,
    *,
    workflow_instance_id: UUID,
    body: WorkflowInstanceActionRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> WorkflowInstanceResponse:
    instance = (
        await session.execute(
            select(WorkflowInstance).where(
                WorkflowInstance.workflow_instance_id == workflow_instance_id
            )
        )
    ).scalar_one_or_none()
    if instance is None:
        raise NotFoundError("Instance introuvable.", code="WORKFLOW_INSTANCE_NOT_FOUND")

    if instance.instance_status in ("APPROVED", "REJECTED", "CANCELLED"):
        raise ConflictError(
            f"Action impossible : instance déjà {instance.instance_status}.",
            code="WORKFLOW_INSTANCE_CLOSED",
        )

    before_status = instance.instance_status
    payload: dict[str, Any] = {}

    if body.action == "APPROVE":
        # Avance d'une étape ; si dernière → APPROVED
        if instance.current_step_order is None:
            raise ValidationError("Aucune étape courante à approuver.", code="NO_CURRENT_STEP")
        instance.steps_completed = instance.steps_completed + 1
        if instance.steps_completed >= instance.steps_total:
            instance.instance_status = "APPROVED"
            instance.completed_at = datetime.now(tz=UTC)
            instance.current_step_order = None
        else:
            instance.current_step_order = instance.current_step_order + 1
            instance.instance_status = "IN_PROGRESS"
    elif body.action == "REJECT":
        instance.instance_status = "REJECTED"
        instance.completed_at = datetime.now(tz=UTC)
    elif body.action == "ESCALATE":
        instance.instance_status = "ESCALATED"
        instance.escalation_level = instance.escalation_level + 1
    elif body.action == "CANCEL":
        instance.instance_status = "CANCELLED"
        instance.completed_at = datetime.now(tz=UTC)
    elif body.action == "ADVANCE":
        if instance.current_step_order is None:
            raise ValidationError("Aucune étape courante à avancer.", code="NO_CURRENT_STEP")
        instance.current_step_order = instance.current_step_order + 1
        instance.instance_status = "IN_PROGRESS"

    session.add(
        WorkflowInstanceEvent(
            workflow_instance_id=instance.workflow_instance_id,
            event_type=body.action,
            actor_user_id=actor_user_id,
            note=body.note,
            payload=payload,
        )
    )

    await audit.record(
        action=f"WORKFLOW_INSTANCE_{body.action}",
        target_type="workflow_instance",
        target_id=str(instance.workflow_instance_id),
        before={"instance_status": before_status},
        after={
            "instance_status": instance.instance_status,
            "current_step_order": instance.current_step_order,
            "steps_completed": instance.steps_completed,
        },
    )

    return WorkflowInstanceResponse(
        workflow_instance_id=instance.workflow_instance_id,
        organization_id=instance.organization_id,
        reference=instance.reference,
        workflow_definition_id=instance.workflow_definition_id,
        requester_employee_id=instance.requester_employee_id,
        requester_user_id=instance.requester_user_id,
        owner_user_id=instance.owner_user_id,
        current_step_order=instance.current_step_order,
        instance_status=instance.instance_status,
        priority=instance.priority,
        due_on=instance.due_on,
        started_at=instance.started_at,
        completed_at=instance.completed_at,
        steps_total=instance.steps_total,
        steps_completed=instance.steps_completed,
        escalation_level=instance.escalation_level,
        metadata=instance.instance_metadata,
        created_at=instance.created_at,
        updated_at=instance.updated_at,
    )


async def list_instance_events(
    session: AsyncSession, *, workflow_instance_id: UUID
) -> list[WorkflowInstanceEventResponse]:
    stmt = (
        select(WorkflowInstanceEvent)
        .where(WorkflowInstanceEvent.workflow_instance_id == workflow_instance_id)
        .order_by(WorkflowInstanceEvent.occurred_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [WorkflowInstanceEventResponse.model_validate(e) for e in rows]
