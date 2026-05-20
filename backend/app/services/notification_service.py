"""Service métier — Notifications.

V0/V1 : stocke en DB. La livraison réelle (email SMTP, SMS) arrive en
vague 4 (PY-044 + PY-087) via un worker arq qui consomme les
notifications PENDING.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ForbiddenError, NotFoundError
from app.core.security.rbac import AuthenticatedUser
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationCreateRequest,
    NotificationResponse,
)


def _to_dto(n: Notification) -> NotificationResponse:
    return NotificationResponse(
        notification_id=n.notification_id,
        organization_id=n.organization_id,
        recipient_user_id=n.recipient_user_id,
        category=n.category,
        title=n.title,
        message=n.message,
        reference_type=n.reference_type,
        reference_id=n.reference_id,
        delivery_status=n.delivery_status,
        attempt_count=n.attempt_count,
        max_attempts=n.max_attempts,
        scheduled_at=n.scheduled_at,
        sent_at=n.sent_at,
        read_at=n.read_at,
        created_at=n.created_at,
    )


# ============================================================================
# Inbox utilisateur — l'utilisateur courant voit ses propres notifications
# ============================================================================
async def list_inbox(
    session: AsyncSession,
    *,
    user: AuthenticatedUser,
    page: int = 1,
    page_size: int = 50,
    only_unread: bool = False,
    category: str | None = None,
) -> tuple[list[NotificationResponse], int]:
    base = select(Notification).where(
        Notification.organization_id == user.organization_id,
        Notification.recipient_user_id == user.user_id,
    )
    if only_unread:
        base = base.where(Notification.read_at.is_(None))
    if category:
        base = base.where(Notification.category == category)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    page_stmt = (
        base.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()
    return [_to_dto(n) for n in rows], int(total)


async def mark_as_read(
    session: AsyncSession, *, notification_id: UUID, user: AuthenticatedUser
) -> NotificationResponse:
    notif = (
        await session.execute(
            select(Notification).where(Notification.notification_id == notification_id)
        )
    ).scalar_one_or_none()
    if notif is None:
        raise NotFoundError("Notification introuvable.", code="NOTIF_NOT_FOUND")
    if notif.recipient_user_id != user.user_id:
        raise ForbiddenError(
            "Cette notification n'est pas adressée à l'utilisateur courant.",
            code="NOT_RECIPIENT",
        )
    if notif.read_at is None:
        notif.read_at = datetime.now(tz=UTC)
        if notif.delivery_status not in ("READ", "FAILED", "CANCELLED"):
            notif.delivery_status = "READ"
    return _to_dto(notif)


async def mark_all_as_read(session: AsyncSession, *, user: AuthenticatedUser) -> int:
    """Marque toutes les notifications de l'utilisateur comme lues. Renvoie le nombre."""
    rows = (
        (
            await session.execute(
                select(Notification).where(
                    Notification.organization_id == user.organization_id,
                    Notification.recipient_user_id == user.user_id,
                    Notification.read_at.is_(None),
                )
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(tz=UTC)
    for notif in rows:
        notif.read_at = now
        if notif.delivery_status not in ("READ", "FAILED", "CANCELLED"):
            notif.delivery_status = "READ"
    return len(rows)


# ============================================================================
# Delivery jobs — admin only, vue file de livraison
# ============================================================================
async def list_delivery_jobs(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    delivery_status: str | None = None,
) -> tuple[list[NotificationResponse], int]:
    base = select(Notification).where(Notification.organization_id == organization_id)
    if delivery_status:
        base = base.where(Notification.delivery_status == delivery_status)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    page_stmt = (
        base.order_by(Notification.scheduled_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()
    return [_to_dto(n) for n in rows], int(total)


async def create_notification(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: NotificationCreateRequest,
    audit: AuditWriter,
) -> NotificationResponse:
    notif = Notification(
        organization_id=organization_id,
        recipient_user_id=body.recipient_user_id,
        category=body.category,
        title=body.title,
        message=body.message,
        reference_type=body.reference_type,
        reference_id=body.reference_id,
        delivery_status="PENDING",
        max_attempts=body.max_attempts,
        scheduled_at=body.scheduled_at or datetime.now(tz=UTC),
        notification_metadata=body.metadata,
    )
    session.add(notif)
    await session.flush([notif])

    await audit.record(
        action="NOTIFICATION_CREATED",
        target_type="notification",
        target_id=str(notif.notification_id),
        after={
            "category": body.category,
            "recipient_user_id": (str(body.recipient_user_id) if body.recipient_user_id else None),
        },
    )
    return _to_dto(notif)
