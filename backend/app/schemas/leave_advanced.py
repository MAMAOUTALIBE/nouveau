"""Schémas pour les règles avancées de congés (PY-035 auto-approval + PY-036 coverage)."""

from __future__ import annotations

from datetime import date
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Coverage rules (continuité de service)
# ---------------------------------------------------------------------------
class CoverageRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_service_coverage_rule_id: UUID
    scope_type: Literal["DIRECTION", "UNIT"]
    scope_id: UUID
    min_presence_ratio: float | None
    min_headcount: int | None
    is_active: bool
    note: str | None


class CoverageRuleUpsertRequest(BaseModel):
    scope_type: Literal["DIRECTION", "UNIT"]
    scope_id: UUID
    min_presence_ratio: float | None = Field(default=None, ge=0, le=1)
    min_headcount: int | None = Field(default=None, ge=1)
    note: str | None = None


# ---------------------------------------------------------------------------
# Auto-approval rules
# ---------------------------------------------------------------------------
class AutoApprovalRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    leave_auto_approval_rule_id: UUID
    leave_type_id: UUID
    is_active: bool
    max_duration_days: int
    require_quota_ok: bool
    require_service_coverage: bool
    blackout_periods: list[dict[str, Any]] = Field(default_factory=list)


class AutoApprovalRuleUpsertRequest(BaseModel):
    leave_type_id: UUID
    is_active: bool = True
    max_duration_days: int = Field(default=2, ge=1, le=365)
    require_quota_ok: bool = True
    require_service_coverage: bool = True
    blackout_periods: list[dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Coverage check (preview impact d'une demande)
# ---------------------------------------------------------------------------
class CoverageCheckRequest(BaseModel):
    employee_id: UUID
    start_date: date
    end_date: date


class CoverageCheckResult(BaseModel):
    has_conflicts: bool
    overlap_count: int
    direction_active_employees: int
    direction_absent_during_period: int
    direction_predicted_presence_ratio: float
    direction_min_presence_ratio: float | None
    direction_min_headcount: int | None
    blocking_rule: str | None = None
    warnings: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Auto-approval evaluation
# ---------------------------------------------------------------------------
class AutoApprovalEvaluation(BaseModel):
    """Résultat d'une évaluation : APPROVE auto, REJECT auto, ou ROUTE_HUMAN."""

    decision: Literal["APPROVE", "REJECT", "ROUTE_HUMAN"]
    reason_code: str
    reason_label: str
    inputs: dict[str, Any] = Field(default_factory=dict)
