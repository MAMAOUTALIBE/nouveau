"""Schémas Pydantic pour Dashboard + Reports + Modernization."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class DashboardCount(BaseModel):
    label: str
    value: int
    tone: str | None = None  # "info" | "warning" | "danger" | "success"


class DashboardSummary(BaseModel):
    organization_id: UUID
    generated_at: datetime
    employees_total: int
    employees_active: int
    employees_on_leave: int
    positions_vacant: int
    leave_requests_pending: int
    leave_requests_approved_period: int
    discipline_cases_open: int
    training_sessions_planned: int
    training_sessions_in_progress: int
    documents_total: int
    documents_pending_validation: int
    workflows_in_progress: int
    recent_audit_events: int
    departures_next_12m: int
    counts: list[DashboardCount] = Field(default_factory=list)


class PendingDecisionItem(BaseModel):
    """Une décision en attente pour le manager / hr_manager courant."""

    kind: str  # "LEAVE_REQUEST" | "WORKFLOW_INSTANCE" | "TRAINING_REQUEST" | "DISCIPLINE_CASE"
    reference: str
    target_id: UUID
    submitted_at: datetime
    title: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ReportFilter(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    direction_id: UUID | None = None


class ModernizationItem(BaseModel):
    code: str
    label: str
    status: str  # "DONE" | "IN_PROGRESS" | "PLANNED"
    progress_pct: float
    notes: str | None = None


class ModernizationSummary(BaseModel):
    organization_id: UUID
    items: list[ModernizationItem]
    total_done: int
    total_in_progress: int
    total_planned: int
    overall_progress_pct: float
