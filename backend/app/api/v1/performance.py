"""Endpoints du domaine Performance + Évaluation 360°."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.performance import (
    PerformanceCampaignCreateRequest,
    PerformanceCampaignResponse,
    PerformanceCampaignTransitionRequest,
    PerformanceEvaluationResponse,
    PerformanceEvaluationUpsertRequest,
    PerformanceResultResponse,
    Survey360EmployeeResult,
    Survey360InvitationResponse,
    Survey360InvitationsBulkRequest,
    Survey360PublicInvitation,
    Survey360RespondRequest,
)
from app.services import performance_service

router = APIRouter(prefix="/performance", tags=["performance"])


# ============================================================================
# Campaigns
# ============================================================================
@router.get("/campaigns", response_model=Page[PerformanceCampaignResponse])
async def list_campaigns(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:view", "performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    campaign_kind: str | None = None,
    campaign_status: str | None = Query(None, alias="status"),
) -> Page[PerformanceCampaignResponse]:
    items, total = await performance_service.list_campaigns(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        campaign_kind=campaign_kind,
        campaign_status=campaign_status,
    )
    return Page[PerformanceCampaignResponse](
        items=items, total=total, page=page, page_size=page_size
    )


@router.post(
    "/campaigns",
    response_model=PerformanceCampaignResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_campaign(
    body: PerformanceCampaignCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PerformanceCampaignResponse:
    return await performance_service.create_campaign(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/campaigns/{campaign_id}/transition",
    response_model=PerformanceCampaignResponse,
)
async def transition_campaign(
    campaign_id: UUID,
    body: PerformanceCampaignTransitionRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PerformanceCampaignResponse:
    return await performance_service.transition_campaign(
        session, campaign_id=campaign_id, body=body, audit=audit
    )


# ============================================================================
# Evaluations classiques (CLASSIC)
# ============================================================================
@router.get(
    "/campaigns/{campaign_id}/evaluations",
    response_model=list[PerformanceEvaluationResponse],
)
async def list_evaluations(
    campaign_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:view", "performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[PerformanceEvaluationResponse]:
    return await performance_service.list_evaluations(session, campaign_id=campaign_id)


@router.put(
    "/campaigns/{campaign_id}/evaluations",
    response_model=PerformanceEvaluationResponse,
)
async def upsert_evaluation(
    campaign_id: UUID,
    body: PerformanceEvaluationUpsertRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PerformanceEvaluationResponse:
    return await performance_service.upsert_evaluation(
        session,
        organization_id=current_user.organization_id,
        campaign_id=campaign_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Invitations 360° (admin/hr_manager — vue nominative)
# ============================================================================
@router.get(
    "/campaigns/{campaign_id}/360-invitations",
    response_model=list[Survey360InvitationResponse],
)
async def list_360_invitations(
    campaign_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    target_employee_id: UUID | None = None,
) -> list[Survey360InvitationResponse]:
    return await performance_service.list_360_invitations(
        session, campaign_id=campaign_id, target_employee_id=target_employee_id
    )


@router.post(
    "/campaigns/{campaign_id}/360-invitations",
    response_model=list[Survey360InvitationResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_360_invitations(
    campaign_id: UUID,
    body: Survey360InvitationsBulkRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> list[Survey360InvitationResponse]:
    return await performance_service.create_360_invitations(
        session, campaign_id=campaign_id, body=body, audit=audit
    )


# ============================================================================
# Résultats agrégés 360° (admin/hr_manager — anonymisés au seuil ≥ N)
# ============================================================================
@router.get(
    "/campaigns/{campaign_id}/360-results/{target_employee_id}",
    response_model=Survey360EmployeeResult,
)
async def get_360_results(
    campaign_id: UUID,
    target_employee_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Survey360EmployeeResult:
    return await performance_service.aggregate_360_results(
        session,
        campaign_id=campaign_id,
        target_employee_id=target_employee_id,
    )


# ============================================================================
# Résultats d'évaluation
# ============================================================================
@router.get("/results", response_model=list[PerformanceResultResponse])
async def list_results(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["performance:view", "performance:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[PerformanceResultResponse]:
    """Résultats des évaluations classiques (page Pilotage › Résultats)."""
    return await performance_service.list_results(
        session, organization_id=current_user.organization_id
    )


# ============================================================================
# Endpoint public — répondre via token signé (sans authentification)
# ============================================================================
public_router = APIRouter(prefix="/public/performance/360", tags=["performance-public"])


@public_router.get(
    "/invitations/{token}",
    response_model=Survey360PublicInvitation,
)
async def get_public_invitation(
    token: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> Survey360PublicInvitation:
    return await performance_service.get_360_invitation_by_token(session, token=token)


@public_router.post(
    "/invitations/{token}/respond",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def respond_public_invitation(
    token: str,
    body: Survey360RespondRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await performance_service.respond_to_360_invitation(session, token=token, body=body)
