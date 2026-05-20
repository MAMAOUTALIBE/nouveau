"""Endpoints BPMN — démarrage et avancement d'instances via SpiffWorkflow.

Distinct des endpoints `/workflows/*` (moteur séquentiel maison).
Activé en backoffice quand `BPMN_PROVIDER=spiff` et que `SpiffWorkflow`
est installé. Les instances sont persistées dans `WorkflowInstance` avec
l'état Spiff sérialisé dans `metadata.spiff_state`.
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.adapters.workflow import (
    BpmnEngineError,
    BpmnInstanceState,
    get_workflow_adapter,
)
from app.core.audit import AuditWriter, get_audit_writer
from app.core.errors import ValidationError
from app.core.security.rbac import AuthenticatedUser, require_permissions

router = APIRouter(prefix="/bpmn", tags=["bpmn"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class BpmnUserTaskOut(BaseModel):
    task_id: str
    task_name: str
    assignee_role: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class BpmnInstanceStateOut(BaseModel):
    workflow_instance_id: UUID
    workflow_code: str
    is_completed: bool
    end_event_id: str | None
    pending_tasks: list[BpmnUserTaskOut] = Field(default_factory=list)
    variables: dict[str, Any] = Field(default_factory=dict)


class BpmnStartRequest(BaseModel):
    workflow_code: str = Field(..., min_length=2, max_length=64)
    variables: dict[str, Any] = Field(default_factory=dict)


class BpmnCompleteTaskRequest(BaseModel):
    task_id: str = Field(..., min_length=1)
    variables: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _state_to_dto(state: BpmnInstanceState, *, workflow_instance_id: UUID) -> BpmnInstanceStateOut:
    return BpmnInstanceStateOut(
        workflow_instance_id=workflow_instance_id,
        workflow_code=state.workflow_code,
        is_completed=state.is_completed,
        end_event_id=state.end_event_id,
        pending_tasks=[
            BpmnUserTaskOut(
                task_id=t.task_id,
                task_name=t.task_name,
                assignee_role=t.assignee_role,
                metadata=t.metadata,
            )
            for t in state.pending_tasks
        ],
        variables=state.variables,
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/workflows", response_model=list[str])
async def list_bpmn_workflows(
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:view", "workflows:manage", "*"])),
    ],
) -> list[str]:
    """Liste les codes BPMN disponibles dans le dossier `bpmn/`."""
    adapter = get_workflow_adapter()
    return adapter.list_workflow_codes()


@router.post(
    "/instances/dry-run",
    response_model=BpmnInstanceStateOut,
)
async def start_bpmn_dry_run(
    body: BpmnStartRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:manage", "*"])),
    ],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> BpmnInstanceStateOut:
    """Exécute un BPMN en mode dry-run : pas de persistance DB.

    Utile pour tester un workflow .bpmn (modélisé avec bpmn.io) en
    soumettant des variables différentes — voir comment il se déroule.
    L'audit reste enregistré pour traçabilité.
    """
    adapter = get_workflow_adapter()
    try:
        state = adapter.start(workflow_code=body.workflow_code, variables=body.variables)
    except BpmnEngineError as exc:
        raise ValidationError(str(exc), code="BPMN_START_FAILED") from exc

    await audit.record(
        action="BPMN_DRY_RUN_STARTED",
        target_type="bpmn_workflow",
        target_id=body.workflow_code,
        after={
            "engine": adapter.provider_name,
            "is_completed": state.is_completed,
            "pending_tasks": [t.task_id for t in state.pending_tasks],
            "end_event_id": state.end_event_id,
        },
    )
    return _state_to_dto(state, workflow_instance_id=UUID(int=0))


@router.post(
    "/instances/dry-run/complete-task",
    response_model=BpmnInstanceStateOut,
)
async def complete_bpmn_task_dry_run(
    body: BpmnCompleteTaskRequest,
    workflow_code: str,
    instance_serialized: str,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:manage", "*"])),
    ],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> BpmnInstanceStateOut:
    """Complète une user task d'une instance BPMN dry-run.

    Le client passe l'`instance_serialized` reçu de l'appel précédent
    pour reprendre l'exécution sans persistance.
    """
    adapter = get_workflow_adapter()
    try:
        state = adapter.complete_user_task(
            instance_serialized=instance_serialized,
            workflow_code=workflow_code,
            task_id=body.task_id,
            variables=body.variables,
        )
    except BpmnEngineError as exc:
        raise ValidationError(str(exc), code="BPMN_COMPLETE_FAILED") from exc

    await audit.record(
        action="BPMN_DRY_RUN_TASK_COMPLETED",
        target_type="bpmn_workflow",
        target_id=workflow_code,
        after={
            "task_id": body.task_id,
            "is_completed": state.is_completed,
            "end_event_id": state.end_event_id,
        },
    )
    return _state_to_dto(state, workflow_instance_id=UUID(int=0))
