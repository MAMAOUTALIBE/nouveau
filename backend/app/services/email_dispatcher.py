"""Email dispatcher — consomme les notifications PENDING via `EmailSenderPort`.

Lance un cycle de traitement : récupère les notifications dont
`delivery_status='PENDING'` et `scheduled_at <= now`, tente l'envoi via
l'adapter email configuré, met à jour le statut et `attempt_count`.

Conçu pour être appelé en endpoint admin OU par un worker arq périodique.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.email import (
    EmailMessage,
    EmailSenderPort,
    get_email_adapter,
)
from app.core.audit import AuditWriter
from app.models.notification import Notification
from app.models.user import User


@dataclass(frozen=True, slots=True)
class DispatchSummary:
    processed: int
    sent: int
    failed: int


async def dispatch_pending_notifications(
    session: AsyncSession,
    *,
    organization_id: UUID,
    audit: AuditWriter,
    limit: int = 100,
    adapter: EmailSenderPort | None = None,
) -> DispatchSummary:
    """Traite les notifications PENDING dans une fenêtre.

    L'envoi est best-effort : on incrémente `attempt_count` et on bascule
    en `FAILED` si on dépasse `max_attempts`. Les `SUCCESS` passent en
    `SENT` (ou `DELIVERED` si l'adapter en a la confirmation).
    """
    adapter = adapter or get_email_adapter()
    now = datetime.now(tz=UTC)
    rows = (
        (
            await session.execute(
                select(Notification)
                .where(
                    Notification.organization_id == organization_id,
                    Notification.delivery_status == "PENDING",
                    Notification.scheduled_at <= now,
                )
                .order_by(Notification.scheduled_at.asc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )

    sent = 0
    failed = 0
    for notif in rows:
        # Résolution destinataire
        recipient_email: str | None = None
        if notif.recipient_user_id is not None:
            user = (
                await session.execute(select(User).where(User.user_id == notif.recipient_user_id))
            ).scalar_one_or_none()
            recipient_email = str(user.email) if user and user.email else None

        if recipient_email is None:
            notif.delivery_status = "FAILED"
            notif.attempt_count = notif.attempt_count + 1
            failed += 1
            continue

        message = EmailMessage(
            to=[recipient_email],
            subject=notif.title,
            text_body=notif.message,
        )
        result = await adapter.send(message)
        notif.attempt_count = notif.attempt_count + 1
        if result.success:
            notif.delivery_status = "SENT"
            notif.sent_at = datetime.now(tz=UTC)
            sent += 1
        else:
            failed += 1
            notif.delivery_status = (
                "FAILED" if notif.attempt_count >= notif.max_attempts else "PENDING"
            )

    await session.flush()
    await audit.record(
        action="EMAIL_DISPATCH_CYCLE",
        target_type="notification_batch",
        target_id=str(organization_id),
        after={
            "processed": len(rows),
            "sent": sent,
            "failed": failed,
            "provider": adapter.provider_name,
        },
    )
    return DispatchSummary(processed=len(rows), sent=sent, failed=failed)
