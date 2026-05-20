"""Schémas Pydantic pour le domaine Workflows."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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


class WorkflowInstanceCreateRequest(BaseModel):
    workflow_definition_id: UUID
    requester_employee_id: UUID | None = None
    requester_user_id: UUID | None = None
    owner_user_id: UUID | None = None
    priority: Priority = "NORMAL"
    due_on: datetime | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class WorkflowInstanceActionRequest(BaseModel):
    action: Literal["APPROVE", "REJECT", "ESCALATE", "CANCEL", "ADVANCE"]
    note: str | None = None


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
