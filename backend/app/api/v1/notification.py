"""Endpoints du domaine Notifications : /api/v1/notifications/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, get_current_user, require_permissions
from app.schemas.common import Page
from app.schemas.notification import NotificationCreateRequest, NotificationResponse
from app.services import email_dispatcher, notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


class _MarkAllReadResponse(BaseModel):
    marked_count: int


class _DispatchSummary(BaseModel):
    processed: int
    sent: int
    failed: int


# ============================================================================
# Inbox utilisateur — accessible à tout user authentifié
# ============================================================================
@router.get("/inbox", response_model=Page[NotificationResponse])
async def list_inbox(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    only_unread: bool = False,
    category: str | None = None,
) -> Page[NotificationResponse]:
    items, total = await notification_service.list_inbox(
        session,
        user=current_user,
        page=page,
        page_size=page_size,
        only_unread=only_unread,
        category=category,
    )
    return Page[NotificationResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/inbox/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_inbox_as_read(
    notification_id: UUID,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> NotificationResponse:
    return await notification_service.mark_as_read(
        session, notification_id=notification_id, user=current_user
    )


@router.post("/inbox/read-all", response_model=_MarkAllReadResponse)
async def mark_all_inbox_as_read(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> _MarkAllReadResponse:
    count = await notification_service.mark_all_as_read(session, user=current_user)
    return _MarkAllReadResponse(marked_count=count)


# ============================================================================
# Delivery jobs — admin / hr_manager
# ============================================================================
@router.get(
    "/delivery-jobs",
    response_model=Page[NotificationResponse],
)
async def list_delivery_jobs(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:audit:view", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    delivery_status: str | None = Query(None, alias="status"),
) -> Page[NotificationResponse]:
    items, total = await notification_service.list_delivery_jobs(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        delivery_status=delivery_status,
    )
    return Page[NotificationResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/dispatch-pending",
    response_model=_DispatchSummary,
)
async def dispatch_pending(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
    limit: int = 100,
) -> _DispatchSummary:
    """Traite la file d'envoi email (cycle batch, idempotent).

    Provider choisi via `EMAIL_PROVIDER` (mock par défaut, smtp en prod).
    Gère le retry exponentiel et la transition PENDING→SENT/FAILED selon
    `attempt_count` vs `max_attempts`.
    """
    summary = await email_dispatcher.dispatch_pending_notifications(
        session,
        organization_id=current_user.organization_id,
        audit=audit,
        limit=limit,
    )
    return _DispatchSummary(processed=summary.processed, sent=summary.sent, failed=summary.failed)


@router.post(
    "",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_notification(
    body: NotificationCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> NotificationResponse:
    return await notification_service.create_notification(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )
