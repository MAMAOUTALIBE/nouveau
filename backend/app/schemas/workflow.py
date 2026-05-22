"""Schémas Pydantic pour le domaine Workflows."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

InstanceStatus = Literal["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED", "ESCALATED"]
Priority = Literal["LOW", "NORMAL", "HIGH", "CRITICAL"]


# ---------------------------------------------------------------------------
# Definitions + steps
# ---------------------------------------------------------------------------
class WorkflowStepResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workflow_step_id: UUID
    step_order: int
    code: str
    label: str
    approver_role_code: str | None
    sla_hours: int | None


class WorkflowDefinitionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workflow_definition_id: UUID
    organization_id: UUID
    code: str
    name: str
    module_name: str
    status: Literal["ACTIVE", "INACTIVE", "ARCHIVED"]
    sla_target_hours: int | None
    auto_escalation: bool
    version_no: int
    # Libellés enrichis attendus par le frontend (page Définitions).
    steps: int | None = None
    used_for: str | None = None
    created_at: datetime
    updated_at: datetime


class WorkflowDefinitionDetail(WorkflowDefinitionResponse):
    steps: list[WorkflowStepResponse] = Field(default_factory=list)


class WorkflowStepCreateRequest(BaseModel):
    step_order: int = Field(..., ge=1)
    code: str = Field(..., min_length=2, max_length=64)
    label: str = Field(..., min_length=2, max_length=128)
    approver_role_code: str | None = None
    sla_hours: int | None = Field(default=None, ge=1)


class WorkflowDefinitionCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64)
    name: str = Field(..., min_length=2, max_length=255)
    module_name: str = Field(..., min_length=2, max_length=64)
    sla_target_hours: int | None = Field(default=None, ge=1)
    auto_escalation: bool = False
    steps: list[WorkflowStepCreateRequest] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Instances
# ---------------------------------------------------------------------------
class WorkflowInstanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workflow_instance_id: UUID
    organization_id: UUID
    reference: str
    workflow_definition_id: UUID
    requester_employee_id: UUID | None
    requester_user_id: UUID | None
    owner_user_id: UUID | None
    current_step_order: int | None
    instance_status: InstanceStatus
    priority: Priority
    due_on: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    steps_total: int
    steps_completed: int
    escalation_level: int
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime
    # Libellés enrichis attendus par le frontend (page Instances).
    id: str | None = None
    definition: str | None = None
    requester: str | None = None
    current_step: str | None = None
    status: str | None = None


class WorkflowInstanceCreateRequest(BaseModel):
    workflow_definition_id: UUID
    requester_employee_id: UUID | None = None
    requester_user_id: UUID | None = None
    owner_user_id: UUID | None = None
    priority: Priority = "NORMAL"
    due_on: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


_FRENCH_ACTION_ALIASES: dict[str, str] = {
    "APPROUVER": "APPROVE",
    "APPROUVE": "APPROVE",
    "VALIDER": "APPROVE",
    "REJETER": "REJECT",
    "REJETE": "REJECT",
    "ESCALADER": "ESCALATE",
    "ESCALADE": "ESCALATE",
    "ANNULER": "CANCEL",
    "AVANCER": "ADVANCE",
}


class WorkflowInstanceActionRequest(BaseModel):
    action: Literal["APPROVE", "REJECT", "ESCALATE", "CANCEL", "ADVANCE"]
    note: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _accept_french_actions(cls, data: Any) -> Any:
        """Tolère le vocabulaire frontend (APPROUVER / REJETER / ESCALADER)."""
        if isinstance(data, dict):
            data = dict(data)
            raw = str(data.get("action") or "").strip().upper()
            if raw in _FRENCH_ACTION_ALIASES:
                data["action"] = _FRENCH_ACTION_ALIASES[raw]
        return data


class WorkflowInstanceEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    workflow_instance_event_id: UUID
    workflow_instance_id: UUID
    event_type: str
    actor_user_id: UUID | None
    actor_label: str | None
    note: str | None
    payload: dict[str, Any]
    occurred_at: datetime
