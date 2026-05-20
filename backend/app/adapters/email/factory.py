"""Factory de sélection de l'adapter email."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.email.mock import MockEmailAdapter
from app.adapters.email.port import EmailSenderPort
from app.adapters.email.smtp import SmtpEmailAdapter
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_email_adapter() -> EmailSenderPort:
    settings = get_settings()
    provider = settings.email_provider

    if provider == "smtp" and settings.smtp_host:
        return SmtpEmailAdapter(
            host=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_username,
            password=(
                settings.smtp_password.get_secret_value() if settings.smtp_password else None
            ),
            use_tls=settings.smtp_use_tls,
            mail_from=settings.mail_from,
        )

    if provider == "sendgrid":
        # Stub — adapter cloud à brancher si choisi.
        return MockEmailAdapter()

    return MockEmailAdapter()
