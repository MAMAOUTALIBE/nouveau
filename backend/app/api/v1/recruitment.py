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
    ApplicationStatusEventResponse,
    ApplicationStatusUpdateRequest,
    CampaignCreateRequest,
    CampaignResponse,
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
