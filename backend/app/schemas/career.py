"""Schémas Pydantic pour Carrière (mouvements) + GPEC."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

MovementType = Literal["TRANSFER", "PROMOTION", "SECONDMENT", "RECLASSIFICATION", "EXIT"]
MovementStatus = Literal["DRAFT", "APPROVED", "REJECTED", "EXECUTED", "CANCELLED"]
CompetencyLevel = Literal["Debutant", "Intermediaire", "Avance", "Expert"]
ScopeType = Literal["GLOBAL", "DIRECTION", "UNIT", "POSITION"]


# ---------------------------------------------------------------------------
# Mouvements de carrière
# ---------------------------------------------------------------------------
class MovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    movement_id: UUID
    employee_id: UUID
    movement_type: MovementType
    movement_status: MovementStatus
    from_direction_id: UUID | None
    from_unit_id: UUID | None
    from_position_id: UUID | None
    to_direction_id: UUID | None
    to_unit_id: UUID | None
    to_position_id: UUID | None
    effective_date: date
    reason: str | None
    approved_by_user_id: UUID | None
    approved_at: datetime | None
    created_at: datetime


class MovementCreateRequest(BaseModel):
    employee_id: UUID
    movement_type: MovementType
    to_direction_id: UUID | None = None
    to_unit_id: UUID | None = None
    to_position_id: UUID | None = None
    effective_date: date
    reason: str | None = None


class MovementDecisionRequest(BaseModel):
    decision: Literal["APPROVED", "REJECTED", "EXECUTED", "CANCELLED"]
    comment: str | None = None


# ---------------------------------------------------------------------------
# GPEC — référentiel compétences
# ---------------------------------------------------------------------------
class CompetencyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    competency_referential_id: UUID
    code: str
    label: str
    category: str | None
    description: str | None


class CompetencyCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Z][A-Z0-9_-]*$")
    label: str = Field(..., min_length=2, max_length=255)
    category: str | None = None
    description: str | None = None


# ---------------------------------------------------------------------------
# GPEC — exigences par poste
# ---------------------------------------------------------------------------
class PositionRequirementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    position_competency_requirement_id: UUID
    position_id: UUID
    competency_referential_id: UUID
    competency_code: str | None = None
    competency_label: str | None = None
    expected_level: CompetencyLevel
    is_critical: bool


class PositionRequirementUpsertRequest(BaseModel):
    competency_referential_id: UUID
    expected_level: CompetencyLevel
    is_critical: bool = False


# ---------------------------------------------------------------------------
# GPEC — snapshots d'écarts
# ---------------------------------------------------------------------------
class CompetencyGapsSnapshotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    competency_gaps_snapshot_id: UUID
    scope_type: ScopeType
    scope_id: UUID | None
    employees_assessed: int
    critical_gaps_count: int
    payload: dict[str, Any]
    generated_at: datetime
    generated_by_user_id: UUID | None


class CompetencyGapsComputeRequest(BaseModel):
    scope_type: ScopeType
    scope_id: UUID | None = None


class CompetencyGapDetail(BaseModel):
    """Détail d'un écart compétence pour un poste."""

    position_id: UUID
    competency_code: str
    competency_label: str
    expected_level: CompetencyLevel
    is_critical: bool
    employees_meeting_count: int
    employees_below_count: int
    employees_total: int


# ---------------------------------------------------------------------------
# Anticipation des départs (retraites + fins de contrat)
# ---------------------------------------------------------------------------
DepartureType = Literal["RETRAITE", "FIN_CONTRAT"]
# Fenêtres d'anticipation classées par urgence décroissante.
DepartureHorizon = Literal["DEPASSE", "URGENT", "A_ANTICIPER", "A_PLANIFIER", "VISIBLE"]
DepartureDecision = Literal["A_DECIDER", "A_RENOUVELER", "A_LIBERER", "RECRUTEMENT_LANCE"]


class DepartureItem(BaseModel):
    """Un départ prévu pour un agent (retraite ou fin de contrat)."""

    employee_id: UUID
    matricule: str
    full_name: str
    direction_id: UUID | None
    direction_name: str | None
    unit_name: str | None
    position_title: str | None
    contract_type: str | None
    departure_type: DepartureType
    departure_date: date
    days_until: int
    age_at_departure: int | None
    horizon: DepartureHorizon
    decision: DepartureDecision


class DeparturesSummary(BaseModel):
    """Agrégats d'anticipation des départs."""

    retirement_age: int
    generated_at: datetime
    total_upcoming: int
    overdue: int
    urgent: int
    next_6_months: int
    next_12_months: int
    retirements_12m: int
    contracts_12m: int


class DeparturesResponse(BaseModel):
    summary: DeparturesSummary
    items: list[DepartureItem]


class RetirementAgeUpdateRequest(BaseModel):
    retirement_age: int = Field(..., ge=45, le=80)


class DepartureDecisionUpdateRequest(BaseModel):
    decision: DepartureDecision
