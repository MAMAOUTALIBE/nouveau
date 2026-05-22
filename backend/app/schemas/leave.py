"""Schémas Pydantic pour le domaine Congés."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

LeaveRequestStatus = Literal["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "CANCELLED"]


# ---------------------------------------------------------------------------
# Leave types
# ---------------------------------------------------------------------------
class LeaveTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_type_id: UUID
    code: str
    label: str
    is_paid: bool


class LeaveTypeCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Z][A-Z0-9_]*$")
    label: str = Field(..., min_length=2, max_length=128)
    is_paid: bool = True


# ---------------------------------------------------------------------------
# Leave balances
# ---------------------------------------------------------------------------
class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_balance_id: UUID
    employee_id: UUID
    agent_name: str | None = None
    leave_type_id: UUID
    leave_type_code: str | None = None
    leave_type: str | None = None
    fiscal_year: int
    allocated_days: Decimal
    consumed_days: Decimal
    remaining_days: Decimal
    updated_at: datetime


class LeaveBalanceUpsertRequest(BaseModel):
    employee_id: UUID
    leave_type_id: UUID
    fiscal_year: int = Field(..., ge=2000, le=2100)
    allocated_days: Decimal = Field(..., ge=0)
    consumed_days: Decimal = Field(default=Decimal("0"), ge=0)


# ---------------------------------------------------------------------------
# Leave requests
# ---------------------------------------------------------------------------
class LeaveRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_request_id: UUID
    organization_id: UUID
    reference: str
    employee_id: UUID
    agent_name: str | None = None
    leave_type_id: UUID
    leave_type_code: str | None = None
    leave_type: str | None = None
    request_status: LeaveRequestStatus
    status: str | None = None
    start_date: date
    end_date: date
    duration_days: int
    reason: str | None = None
    submitted_at: datetime
    decided_at: datetime | None = None
    decided_by_user_id: UUID | None = None
    decision_comment: str | None = None
    workflow_instance_id: UUID | None = None
    created_at: datetime
    updated_at: datetime


class LeaveRequestCreateRequest(BaseModel):
    employee_id: UUID
    leave_type_id: UUID
    start_date: date
    end_date: date
    reason: str | None = None

    @model_validator(mode="after")
    def _check_dates(self) -> LeaveRequestCreateRequest:
        if self.end_date < self.start_date:
            raise ValueError("end_date doit être >= start_date")
        return self


class LeaveDecisionRequest(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]
    comment: str | None = None


class LeaveCancelRequest(BaseModel):
    reason: str | None = None


# ---------------------------------------------------------------------------
# Calendar (FullCalendar event format)
# ---------------------------------------------------------------------------
class LeaveCalendarEvent(BaseModel):
    """Format compatible FullCalendar (id, title, start, end, color)."""

    id: UUID
    title: str
    start: date
    end: date
    employee_id: UUID
    employee_name: str | None = None
    leave_type_code: str | None = None
    request_status: LeaveRequestStatus
    color: str | None = None


# ---------------------------------------------------------------------------
# Coverage check (preview impact d'une demande)
# ---------------------------------------------------------------------------
class LeaveCoverageImpact(BaseModel):
    has_conflicts: bool
    overlap_count: int
    direction_min_presence_ratio: float | None = None
    direction_current_presence_ratio: float | None = None
    direction_predicted_presence_ratio: float | None = None
    warnings: list[str] = Field(default_factory=list)
