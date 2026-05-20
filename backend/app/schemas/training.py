"""Schémas Pydantic pour le domaine Formation."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

SessionStatus = Literal["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
RequestStatus = Literal["PENDING", "APPROVED", "REJECTED", "CANCELLED"]
AttendanceStatus = Literal["REGISTERED", "ATTENDED", "PARTIAL", "NO_SHOW", "CANCELLED"]
EvaluationKind = Literal["HOT", "COLD"]


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------
class TrainingCatalogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_catalog_id: UUID
    code: str
    title: str
    category: str | None
    description: str | None
    duration_hours: int | None
    is_active: bool


class TrainingCatalogCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Z][A-Z0-9_-]*$")
    title: str = Field(..., min_length=2, max_length=255)
    category: str | None = None
    description: str | None = None
    duration_hours: int | None = Field(default=None, ge=1, le=10000)


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------
class TrainingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_session_id: UUID
    training_catalog_id: UUID | None
    reference: str
    title: str
    instructor: str | None
    location: str | None
    session_status: SessionStatus
    start_date: date | None
    end_date: date | None
    capacity: int | None
    cold_eval_scheduled_for: date | None
    cold_eval_launched_at: datetime | None
    created_at: datetime
    updated_at: datetime


class TrainingSessionCreateRequest(BaseModel):
    training_catalog_id: UUID | None = None
    title: str = Field(..., min_length=2, max_length=255)
    instructor: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    capacity: int | None = Field(default=None, ge=1, le=10000)


class TrainingSessionTransitionRequest(BaseModel):
    target_status: Literal["IN_PROGRESS", "COMPLETED", "CANCELLED"]


# ---------------------------------------------------------------------------
# Participants
# ---------------------------------------------------------------------------
class TrainingSessionParticipantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_session_participant_id: UUID
    training_session_id: UUID
    employee_id: UUID
    attendance_status: AttendanceStatus
    final_score: Decimal | None
    instructor_validated: bool
    created_at: datetime


class TrainingParticipantUpsertRequest(BaseModel):
    employee_id: UUID
    attendance_status: AttendanceStatus = "REGISTERED"
    final_score: Decimal | None = Field(default=None, ge=0, le=100)
    instructor_validated: bool = False


# ---------------------------------------------------------------------------
# Demandes
# ---------------------------------------------------------------------------
class TrainingRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_request_id: UUID
    reference: str
    requested_by_employee_id: UUID
    training_catalog_id: UUID | None
    requested_title: str | None
    motivation: str | None
    request_status: RequestStatus
    decided_by_user_id: UUID | None
    decided_at: datetime | None
    decision_comment: str | None
    created_at: datetime


class TrainingRequestCreateRequest(BaseModel):
    requested_by_employee_id: UUID
    training_catalog_id: UUID | None = None
    requested_title: str | None = Field(default=None, max_length=255)
    motivation: str | None = None


class TrainingRequestDecisionRequest(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]
    comment: str | None = None


# ---------------------------------------------------------------------------
# Évaluations (chaud + froid)
# ---------------------------------------------------------------------------
class TrainingEvaluationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_evaluation_id: UUID
    training_session_id: UUID
    employee_id: UUID
    evaluation_kind: EvaluationKind
    invited_at: datetime | None
    completed_at: datetime | None
    score_overall: Decimal | None
    answers: dict[str, Any] = Field(default_factory=dict)
    comments: str | None


class TrainingEvaluationPublic(BaseModel):
    """Vue exposée à un répondant via token (pas d'identité agent)."""

    invitation_token: str
    session_title: str
    evaluation_kind: EvaluationKind
    completed: bool


class TrainingEvaluationRespondRequest(BaseModel):
    score_overall: Decimal | None = Field(default=None, ge=0, le=100)
    answers: dict[str, Any] = Field(default_factory=dict)
    comments: str | None = None


class TrainingColdEvalLaunchSummary(BaseModel):
    """Résumé du lancement d'évaluations à froid (J+90)."""

    sessions_launched: int
    evaluations_created: int
    notifications_enqueued: int


# ---------------------------------------------------------------------------
# Certificats
# ---------------------------------------------------------------------------
class TrainingCertificateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    training_certificate_id: UUID
    training_session_id: UUID
    employee_id: UUID
    issued_at: datetime
    verification_code: str
    signature_hash: str | None
    template_version: str | None


class TrainingCertificateIssueSummary(BaseModel):
    issued: int
    skipped: int
    skipped_reasons: list[str] = Field(default_factory=list)
