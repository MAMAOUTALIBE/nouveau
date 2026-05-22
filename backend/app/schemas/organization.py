"""Schémas Pydantic pour le domaine Organization (directions / units / positions)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

PositionStatus = Literal["OPEN", "FILLED", "FROZEN", "CLOSED"]


# ---------------------------------------------------------------------------
# Directions
# ---------------------------------------------------------------------------
class DirectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    direction_id: UUID
    organization_id: UUID
    code: str
    name: str
    manager_name: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DirectionCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64)
    name: str = Field(..., min_length=2, max_length=255)
    manager_name: str | None = None


# ---------------------------------------------------------------------------
# Units
# ---------------------------------------------------------------------------
class UnitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    unit_id: UUID
    organization_id: UUID
    direction_id: UUID
    parent_unit_id: UUID | None
    code: str
    name: str
    manager_name: str | None
    is_active: bool
    employee_count: int = 0
    created_at: datetime
    updated_at: datetime


class UnitCreateRequest(BaseModel):
    direction_id: UUID
    parent_unit_id: UUID | None = None
    code: str = Field(..., min_length=2, max_length=64)
    name: str = Field(..., min_length=2, max_length=255)
    manager_name: str | None = None


# ---------------------------------------------------------------------------
# Positions
# ---------------------------------------------------------------------------
class PositionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    position_id: UUID
    direction_id: UUID | None
    unit_id: UUID | None
    code: str
    title: str
    grade: str | None
    position_status: PositionStatus
    budgeted_headcount: int


class PositionCreateRequest(BaseModel):
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    code: str = Field(..., min_length=2, max_length=64)
    title: str = Field(..., min_length=2, max_length=255)
    grade: str | None = None
    position_status: PositionStatus = "OPEN"
    budgeted_headcount: int = Field(default=1, ge=1, le=10000)


class PositionUpdateStatusRequest(BaseModel):
    position_status: PositionStatus


# ---------------------------------------------------------------------------
# Org chart simplifié
# ---------------------------------------------------------------------------
class OrgChartUnitNode(BaseModel):
    unit_id: UUID
    code: str
    name: str
    manager_name: str | None
    children: list[OrgChartUnitNode] = Field(default_factory=list)
    employee_count: int = 0


class OrgChartDirectionNode(BaseModel):
    direction_id: UUID
    code: str
    name: str
    manager_name: str | None
    units: list[OrgChartUnitNode] = Field(default_factory=list)
    employee_count: int = 0


OrgChartUnitNode.model_rebuild()


# ---------------------------------------------------------------------------
# Postes budgétaires / vacants (vues liste du module Organisation)
# ---------------------------------------------------------------------------
class BudgetedPositionResponse(BaseModel):
    """Poste budgétisé — vue liste de Organisation › Postes budgétaires."""

    code: str
    structure_name: str
    title: str
    grade: str
    status: str
    holder_name: str | None = None


class VacantPositionResponse(BaseModel):
    """Poste vacant — vue liste de Organisation › Postes vacants."""

    code: str
    structure_name: str
    title: str
    grade: str
    opened_on: date
    priority: str
