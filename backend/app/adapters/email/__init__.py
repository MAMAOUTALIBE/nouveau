"""Email adapters."""

from app.adapters.email.factory import get_email_adapter
from app.adapters.email.port import EmailMessage, EmailSenderPort, SendResult

__all__ = [
    "EmailMessage",
    "EmailSenderPort",
    "SendResult",
    "get_email_adapter",
]
