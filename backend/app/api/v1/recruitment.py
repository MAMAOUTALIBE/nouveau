"""Endpoints du domaine Recrutement : /api/v1/recruitment/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.recruitment import (
    ApplicationCommentCreateRequest,
    ApplicationCommentResponse,
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationScoresResponse,
    ApplicationStatusEventResponse,
    ApplicationStatusUpdateRequest,
    CampaignCreateRequest,
    CampaignResponse,
    OnboardingItemResponse,
    ScoringPolicyResponse,
    ScoringPolicyUpdateRequest,
    ShortlistSuggestionRequest,
    ShortlistSuggestionResponse,
    ShortlistValidateRequest,
    ShortlistValidationEntry,
)
from app.services import recruitment_service

router = APIRouter(prefix="/recruitment", tags=["recruitment"])


# ============================================================================
# Campaigns
# ============================================================================
@router.get("/campaigns", response_model=Page[CampaignResponse])
async def list_campaigns(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    campaign_status: str | None = Query(None, alias="status"),
) -> Page[CampaignResponse]:
    items, total = await recruitment_service.list_campaigns(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        status=campaign_status,
    )
    return Page[CampaignResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/campaigns",
    response_model=CampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign(
    body: CampaignCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> CampaignResponse:
    return await recruitment_service.create_campaign(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Applications
# ============================================================================
@router.get("/applications", response_model=Page[ApplicationResponse])
async def list_applications(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    campaign_id: UUID | None = None,
    application_status: str | None = Query(None, alias="status"),
    search: str | None = Query(None, alias="q"),
) -> Page[ApplicationResponse]:
    items, total = await recruitment_service.list_applications(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        campaign_id=campaign_id,
        application_status=application_status,
        search=search,
    )
    return Page[ApplicationResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/applications",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(
    body: ApplicationCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ApplicationResponse:
    return await recruitment_service.create_application(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.put(
    "/applications/{application_id}/status",
    response_model=ApplicationResponse,
)
async def update_application_status(
    application_id: UUID,
    body: ApplicationStatusUpdateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ApplicationResponse:
    return await recruitment_service.update_application_status(
        session,
        application_id=application_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.get(
    "/applications/{application_id}/status-events",
    response_model=list[ApplicationStatusEventResponse],
)
async def list_status_events(
    application_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[ApplicationStatusEventResponse]:
    return await recruitment_service.list_status_events(session, application_id=application_id)


@router.get(
    "/applications/{application_id}/comments",
    response_model=list[ApplicationCommentResponse],
)
async def list_comments(
    application_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[ApplicationCommentResponse]:
    return await recruitment_service.list_comments(session, application_id=application_id)


@router.post(
    "/applications/{application_id}/comments",
    response_model=ApplicationCommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_comment(
    application_id: UUID,
    body: ApplicationCommentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ApplicationCommentResponse:
    return await recruitment_service.add_comment(
        session,
        application_id=application_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Intégration (onboarding)
# ============================================================================
@router.get("/onboarding", response_model=list[OnboardingItemResponse])
async def list_onboarding(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[OnboardingItemResponse]:
    """Parcours d'intégration des nouvelles recrues (page Recrutement › Intégration)."""
    return await recruitment_service.list_onboarding(
        session, organization_id=current_user.organization_id
    )


# ============================================================================
# Scoring des candidatures
# ============================================================================
@router.get("/scoring-policy", response_model=ScoringPolicyResponse)
async def get_scoring_policy(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ScoringPolicyResponse:
    """Politique de scoring de l'organisation (critères par défaut si absente)."""
    return await recruitment_service.get_scoring_policy(
        session, organization_id=current_user.organization_id
    )


@router.put("/scoring-policy", response_model=ScoringPolicyResponse)
async def update_scoring_policy(
    body: ScoringPolicyUpdateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ScoringPolicyResponse:
    """Met à jour les critères et pondérations de la politique de scoring."""
    return await recruitment_service.update_scoring_policy(
        session,
        organization_id=current_user.organization_id,
        criteria=body.criteria,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.get("/application-scores", response_model=ApplicationScoresResponse)
async def list_application_scores(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    campaign: str | None = None,
    position: str | None = None,
) -> ApplicationScoresResponse:
    """Score classé de chaque candidature, calculé selon la politique en vigueur."""
    return await recruitment_service.list_application_scores(
        session,
        organization_id=current_user.organization_id,
        campaign=campaign,
        position=position,
    )


# ============================================================================
# Shortlists — suggestion top-N + validation RH
# ============================================================================
@router.post("/shortlists/suggest", response_model=ShortlistSuggestionResponse)
async def suggest_shortlist(
    body: ShortlistSuggestionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ShortlistSuggestionResponse:
    """Top-N candidatures selon le scoring, enrichies du statut de validation."""
    return await recruitment_service.suggest_shortlist(
        session,
        organization_id=current_user.organization_id,
        top_n=body.top_n,
        campaign=body.campaign,
        position=body.position,
    )


@router.get("/shortlists/validations", response_model=list[ShortlistValidationEntry])
async def list_shortlist_validations(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:view", "recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[ShortlistValidationEntry]:
    """Historique des validations de shortlist enregistrées."""
    return await recruitment_service.list_shortlist_validations(
        session, organization_id=current_user.organization_id
    )


@router.post(
    "/shortlists/{reference}/validate",
    response_model=ShortlistValidationEntry,
)
async def validate_shortlist_entry(
    reference: str,
    body: ShortlistValidateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["recruitment:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> ShortlistValidationEntry:
    """Valide ou rejette une candidature shortlistée (upsert)."""
    return await recruitment_service.validate_shortlist_entry(
        session,
        organization_id=current_user.organization_id,
        reference=reference,
        body=body,
        actor_user_id=current_user.user_id,
        actor_full_name=current_user.full_name,
        audit=audit,
    )
