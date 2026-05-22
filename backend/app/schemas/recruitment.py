"""Schémas Pydantic pour le domaine Recrutement."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

CampaignStatus = Literal["DRAFT", "ACTIVE", "PAUSED", "CLOSED", "CANCELLED"]
ApplicationStatus = Literal["NEW", "PRESELECTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"]


# ---------------------------------------------------------------------------
# Campaigns
# ---------------------------------------------------------------------------
class CampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    campaign_id: UUID
    organization_id: UUID
    code: str
    title: str
    direction_id: UUID | None
    unit_id: UUID | None
    need_position: str | None
    openings: int
    need_quota: int | None
    status: CampaignStatus
    start_date: date | None
    end_date: date | None
    owner_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


class CampaignCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64)
    title: str = Field(..., min_length=2, max_length=255)
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    need_position: str | None = None
    openings: int = Field(default=1, ge=1)
    need_quota: int | None = Field(default=None, ge=1)
    status: CampaignStatus = "ACTIVE"
    start_date: date | None = None
    end_date: date | None = None
    owner_user_id: UUID | None = None


# ---------------------------------------------------------------------------
# Applications
# ---------------------------------------------------------------------------
class ApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    application_id: UUID
    organization_id: UUID
    campaign_id: UUID | None
    reference: str
    candidate_full_name: str
    candidate_email: EmailStr | None
    candidate_phone: str | None
    desired_position: str | None
    source_channel: str | None
    application_status: ApplicationStatus
    received_on: date | None
    experience_years: int | None
    skills_match_score: Decimal | None
    education_score: Decimal | None
    interview_avg_score: Decimal | None
    test_score: Decimal | None
    metadata: dict[str, Any]
    created_at: datetime
    updated_at: datetime


class ApplicationCreateRequest(BaseModel):
    campaign_id: UUID | None = None
    candidate_full_name: str = Field(..., min_length=2, max_length=255)
    candidate_email: EmailStr | None = None
    candidate_phone: str | None = None
    identity_number: str | None = None
    desired_position: str | None = None
    source_channel: str | None = None
    received_on: date | None = None
    experience_years: int | None = Field(default=None, ge=0, le=70)


class ApplicationStatusUpdateRequest(BaseModel):
    application_status: ApplicationStatus
    note: str | None = None


# ---------------------------------------------------------------------------
# Status events / comments
# ---------------------------------------------------------------------------
class ApplicationStatusEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status_event_id: UUID
    application_id: UUID
    from_status: str | None
    to_status: str
    changed_at: datetime
    changed_by_user_id: UUID | None
    note: str | None


class ApplicationCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    comment_id: UUID
    application_id: UUID
    author_user_id: UUID | None
    message: str
    created_at: datetime


class ApplicationCommentCreateRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)


class OnboardingItemResponse(BaseModel):
    """Élément d'intégration dérivé d'une candidature recrutée (statut HIRED)."""

    application_reference: str
    agent: str
    position: str
    start_date: date
    status: str
    checklist: list[str]
