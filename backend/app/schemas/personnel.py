"""Schémas Pydantic pour le domaine Personnel (agents)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

EmploymentStatus = Literal["ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"]
RiskLevel = Literal["Faible", "Modere", "Eleve", "Critique"]


# ---------------------------------------------------------------------------
# Agents (employees)
# ---------------------------------------------------------------------------
class AgentListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employee_id: UUID
    matricule: str
    full_name: str
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    direction_id: UUID | None
    unit_id: UUID | None
    position_id: UUID | None
    manager_employee_id: UUID | None
    employment_status: EmploymentStatus
    contract_type: str | None
    hire_date: date | None
    exit_date: date | None
    birth_date: date | None = None
    contract_end_date: date | None = None
    # Date de départ à la retraite — calculée (birth_date + âge légal de l'organisation).
    retirement_date: date | None = None
    created_at: datetime
    updated_at: datetime


class AgentResponse(AgentListItem):
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentCreateRequest(BaseModel):
    matricule: str = Field(..., min_length=2, max_length=64)
    full_name: str = Field(..., min_length=2, max_length=255)
    first_name: str | None = None
    last_name: str | None = None
    national_id: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    position_id: UUID | None = None
    manager_employee_id: UUID | None = None
    employment_status: EmploymentStatus = "ACTIVE"
    contract_type: str | None = None
    hire_date: date | None = None
    birth_date: date | None = None
    contract_end_date: date | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentUpdateRequest(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    position_id: UUID | None = None
    manager_employee_id: UUID | None = None
    employment_status: EmploymentStatus | None = None
    contract_type: str | None = None
    hire_date: date | None = None
    exit_date: date | None = None
    birth_date: date | None = None
    contract_end_date: date | None = None
    metadata: dict[str, Any] | None = None


# ---------------------------------------------------------------------------
# Affectations (employee_assignments)
# ---------------------------------------------------------------------------
class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    assignment_id: UUID
    employee_id: UUID
    direction_id: UUID | None
    unit_id: UUID | None
    position_id: UUID | None
    assignment_status: Literal["PLANNED", "ACTIVE", "ENDED", "CANCELLED"]
    effective_start: date
    effective_end: date | None
    created_at: datetime


class AssignmentCreateRequest(BaseModel):
    employee_id: UUID
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    position_id: UUID | None = None
    assignment_status: Literal["PLANNED", "ACTIVE", "ENDED", "CANCELLED"] = "PLANNED"
    effective_start: date
    effective_end: date | None = None


# ---------------------------------------------------------------------------
# Turnover risk
# ---------------------------------------------------------------------------
class TurnoverRiskFactor(BaseModel):
    code: str
    label: str
    weight: int = Field(..., ge=0, le=100)


class DossierExportResponse(BaseModel):
    """Snapshot d'un dossier exporté + signé."""

    model_config = ConfigDict(from_attributes=True)

    dossier_export_id: UUID
    employee_id: UUID
    file_id: UUID | None
    export_format: str
    signature_hash: str
    verification_code: str
    exported_by_user_id: UUID | None
    exported_at: datetime


class TurnoverRiskItem(BaseModel):
    """Un agent avec son score + facteurs explicables.

    Le modèle est V1 = règles pondérées (deterministe), pas un LLM opaque.
    L'utilisateur RH peut auditer chaque score et ses facteurs contributeurs.
    """

    employee_id: UUID
    matricule: str
    full_name: str
    direction_id: UUID | None
    unit_id: UUID | None
    risk_score: int = Field(..., ge=0, le=100)
    risk_level: RiskLevel
    factors: list[TurnoverRiskFactor]
    recommended_action: str | None = None
    model_name: str = "rules-v1"
    generated_at: datetime
