"""Adapter email Mock — log structuré uniquement, n'envoie rien."""

from __future__ import annotations

from secrets import token_hex

from app.adapters.email.port import EmailMessage, EmailSenderPort, SendResult
from app.core.logging import get_logger

logger = get_logger(__name__)


class MockEmailAdapter(EmailSenderPort):
    provider_name = "mock"

    async def send(self, message: EmailMessage) -> SendResult:
        message_id = f"mock-{token_hex(8)}"
        logger.info(
            "email_mock_sent",
            to=message.to,
            subject=message.subject,
            cc=message.cc,
            message_id=message_id,
        )
        return SendResult(
            provider_name=self.provider_name,
            success=True,
            provider_message_id=message_id,
        )
