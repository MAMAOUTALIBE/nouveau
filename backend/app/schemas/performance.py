"""Schémas Pydantic pour Performance + Évaluation 360° anonyme."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

CampaignKind = Literal["CLASSIC", "SURVEY_360"]
CampaignStatus = Literal["DRAFT", "OPEN", "CLOSED", "CANCELLED"]
EvaluationStatus = Literal["DRAFT", "SUBMITTED", "VALIDATED"]
EvaluatorCategory = Literal["SELF", "MANAGER", "PEER", "SUBORDINATE"]
InvitationStatus = Literal["SENT", "RESPONDED", "EXPIRED", "REVOKED"]


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------
class PerformanceCampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    performance_campaign_id: UUID
    organization_id: UUID
    code: str
    title: str
    campaign_kind: CampaignKind
    campaign_status: CampaignStatus
    period: str | None = None
    population: str | None = None
    status: str | None = None
    period_start: date | None
    period_end: date | None
    direction_id: UUID | None
    min_respondents_per_category: int
    description: str | None
    created_at: datetime
    updated_at: datetime


class PerformanceCampaignCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Z][A-Z0-9_-]*$")
    title: str = Field(..., min_length=2, max_length=255)
    campaign_kind: CampaignKind = "CLASSIC"
    period_start: date | None = None
    period_end: date | None = None
    direction_id: UUID | None = None
    min_respondents_per_category: int = Field(default=3, ge=1, le=20)
    description: str | None = None


class PerformanceCampaignTransitionRequest(BaseModel):
    target_status: Literal["OPEN", "CLOSED", "CANCELLED"]


# ---------------------------------------------------------------------------
# Evaluations classiques
# ---------------------------------------------------------------------------
class PerformanceEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    performance_evaluation_id: UUID
    performance_campaign_id: UUID
    employee_id: UUID
    self_score: Decimal | None
    manager_score: Decimal | None
    final_score: Decimal | None
    evaluation_status: EvaluationStatus
    submitted_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PerformanceEvaluationUpsertRequest(BaseModel):
    employee_id: UUID
    self_score: Decimal | None = Field(default=None, ge=0, le=100)
    manager_score: Decimal | None = Field(default=None, ge=0, le=100)
    final_score: Decimal | None = Field(default=None, ge=0, le=100)
    evaluation_status: EvaluationStatus = "DRAFT"
    notes: str | None = None


# ---------------------------------------------------------------------------
# Invitations 360° (admin / hr_manager — voit le détail nominatif)
# ---------------------------------------------------------------------------
class Survey360InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    performance_360_invitation_id: UUID
    performance_campaign_id: UUID
    target_employee_id: UUID
    evaluator_employee_id: UUID | None
    evaluator_category: EvaluatorCategory
    invitation_status: InvitationStatus
    sent_at: datetime
    responded_at: datetime | None
    expires_at: datetime | None


class Survey360InvitationCreateRequest(BaseModel):
    target_employee_id: UUID
    evaluator_employee_id: UUID | None = None  # None pour SELF
    evaluator_category: EvaluatorCategory
    expires_at: datetime | None = None


class Survey360InvitationsBulkRequest(BaseModel):
    """Crée plusieurs invitations en une seule requête (gain UX côté front)."""

    invitations: list[Survey360InvitationCreateRequest] = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Public — token-based (un répondant non-authentifié)
# ---------------------------------------------------------------------------
class Survey360PublicInvitation(BaseModel):
    """Vue publique exposée à un répondant via le token signé.

    Aucune info sur le target_employee n'est dévoilée si l'utilisateur
    n'est pas habilité.
    """

    invitation_token: str
    target_employee_full_name: str
    evaluator_category: EvaluatorCategory
    invitation_status: InvitationStatus
    expires_at: datetime | None


class Survey360RespondRequest(BaseModel):
    answers: dict[str, Any] = Field(..., description="Réponses libres au questionnaire")


# ---------------------------------------------------------------------------
# Résultats agrégés (anonymisation au seuil ≥ N répondants par catégorie)
# ---------------------------------------------------------------------------
class Survey360CategoryResult(BaseModel):
    """Résultat agrégé pour une catégorie donnée.

    `is_disclosed=False` ⇒ moins de `min_respondents_per_category` répondants
    pour cette catégorie ⇒ AUCUN détail (même pas le compte exact pour
    éviter la déduction). C'est le contrat d'anonymat structurel.
    """

    evaluator_category: EvaluatorCategory
    is_disclosed: bool
    respondent_count: int | None = None
    averages: dict[str, float] | None = None
    note: str | None = None


class Survey360EmployeeResult(BaseModel):
    target_employee_id: UUID
    target_full_name: str
    campaign_id: UUID
    campaign_code: str
    min_respondents_per_category: int
    categories: list[Survey360CategoryResult]


# ---------------------------------------------------------------------------
# Résultats d'évaluation (vue liste de la page Pilotage › Résultats)
# ---------------------------------------------------------------------------
class PerformanceResultResponse(BaseModel):
    """Résultat d'évaluation classique d'un agent."""

    agent: str
    direction: str
    manager_score: float
    self_score: float
    final_score: float
    status: str
