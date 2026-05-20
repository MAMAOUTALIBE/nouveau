"""Schémas Pydantic pour le domaine Discipline."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

CaseStatus = Literal[
    "OPEN",
    "UNDER_INVESTIGATION",
    "SANCTION_PROPOSED",
    "SANCTION_APPLIED",
    "CLOSED",
    "DISMISSED",
]
Severity = Literal["Faible", "Modere", "Eleve", "Critique"]


class DisciplineCaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    discipline_case_id: UUID
    reference: str
    employee_id: UUID
    case_status: CaseStatus
    severity: Severity
    title: str
    summary: str | None
    incident_date: date | None
    proposed_sanction: str | None
    applied_sanction: str | None
    opened_by_user_id: UUID | None
    closed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class DisciplineCaseCreateRequest(BaseModel):
    employee_id: UUID
    title: str = Field(..., min_length=2, max_length=255)
    summary: str | None = None
    severity: Severity = "Modere"
    incident_date: date | None = None


class DisciplineCaseTransitionRequest(BaseModel):
    target_status: CaseStatus
    proposed_sanction: str | None = None
    applied_sanction: str | None = None
    note: str | None = None


class DisciplineEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    discipline_event_id: UUID
    discipline_case_id: UUID
    event_type: str
    actor_user_id: UUID | None
    note: str | None
    payload: dict[str, Any]
    occurred_at: datetime
