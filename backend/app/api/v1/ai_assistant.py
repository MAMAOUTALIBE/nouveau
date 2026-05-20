"""Endpoints IA — CV matching + grille entretien + conversion + Prim'Assistant."""

from __future__ import annotations

from typing import Annotated, Any, cast
from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import (
    AuthenticatedUser,
    get_current_user,
    require_permissions,
)
from app.schemas.recruitment import ApplicationResponse
from app.services import (
    candidate_conversion,
    cv_matching,
    interview_grid,
    prim_assistant,
)


# ---------------------------------------------------------------------------
# Schemas locaux pour les endpoints IA
# ---------------------------------------------------------------------------
class CvMatchingRequest(BaseModel):
    cv_text: str = Field(..., min_length=50)
    job_description: str | None = None


class InterviewGridRequest(BaseModel):
    job_description: str | None = None


class ConvertCandidateRequest(BaseModel):
    contract_type: str | None = None


class ConvertCandidateResponse(BaseModel):
    employee_id: UUID
    matricule: str
    application_id: UUID


class AssistantChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4096)


class AssistantChatResponse(BaseModel):
    intent: str
    confidence: float
    text_response: str
    action_draft: dict[str, Any] | None = None
    requires_confirmation: bool
    blocked_reason: str | None = None


class AssistantConfirmRequest(BaseModel):
    intent: str
    action_draft: dict[str, Any]


# ===========================================================================
# Router — recrutement IA
# ===========================================================================
recruitment_ia_router = APIRouter(prefix="/recruitment", tags=["recruitment-ia"])


@recruitment_ia_router.post(
    "/applications/{application_id}/cv-matching",
    response_model=dict[str, Any],
)
async def run_cv_matching(
    application_id: UUID,
    body: CvMatchingRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> dict[str, Any]:
    return await cv_matching.run_cv_matching(
        session,
        organization_id=current_user.organization_id,
        application_id=application_id,
        cv_text=body.cv_text,
        job_description=body.job_description,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@recruitment_ia_router.post(
    "/applications/{application_id}/cv-matching/accept",
    response_model=ApplicationResponse,
)
async def accept_cv_matching(
    application_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ApplicationResponse:
    application = await cv_matching.accept_cv_matching_suggestion(
        session,
        application_id=application_id,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
    return ApplicationResponse(
        application_id=application.application_id,
        organization_id=application.organization_id,
        campaign_id=application.campaign_id,
        reference=application.reference,
        candidate_full_name=application.candidate_full_name,
        candidate_email=application.candidate_email,
        candidate_phone=application.candidate_phone,
        desired_position=application.desired_position,
        source_channel=application.source_channel,
        application_status=application.application_status,
        received_on=application.received_on,
        experience_years=application.experience_years,
        skills_match_score=application.skills_match_score,
        education_score=application.education_score,
        interview_avg_score=application.interview_avg_score,
        test_score=application.test_score,
        metadata=application.application_metadata,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


@recruitment_ia_router.post(
    "/applications/{application_id}/interview-grid",
    response_model=dict[str, Any],
)
async def generate_interview_grid(
    application_id: UUID,
    body: InterviewGridRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> dict[str, Any]:
    return await interview_grid.generate_interview_grid(
        session,
        application_id=application_id,
        job_description=body.job_description,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@recruitment_ia_router.post(
    "/applications/{application_id}/convert-to-employee",
    response_model=ConvertCandidateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def convert_candidate_to_employee(
    application_id: UUID,
    body: ConvertCandidateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ConvertCandidateResponse:
    result = await candidate_conversion.convert_application_to_employee(
        session,
        organization_id=current_user.organization_id,
        application_id=application_id,
        actor_user_id=current_user.user_id,
        audit=audit,
        contract_type=body.contract_type,
    )
    return ConvertCandidateResponse(
        employee_id=result.employee_id,
        matricule=result.matricule,
        application_id=result.application_id,
    )


# ===========================================================================
# Router — Prim'Assistant
# ===========================================================================
assistant_router = APIRouter(prefix="/ai-assistant", tags=["ai-assistant"])


@assistant_router.post("/chat", response_model=AssistantChatResponse)
async def assistant_chat(
    body: AssistantChatRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AssistantChatResponse:
    turn = await prim_assistant.chat_turn(user=current_user, message=body.message, audit=audit)
    return AssistantChatResponse(
        intent=turn.intent,
        confidence=turn.confidence,
        text_response=turn.text_response,
        action_draft=turn.action_draft,
        requires_confirmation=turn.requires_confirmation,
        blocked_reason=turn.blocked_reason,
    )


@assistant_router.post("/confirm", response_model=dict[str, Any])
async def assistant_confirm(
    body: AssistantConfirmRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> dict[str, Any]:
    return await prim_assistant.confirm_action(
        user=current_user,
        intent=cast("prim_assistant.Intent", body.intent),
        action_draft=body.action_draft,
        audit=audit,
    )
