"""Port (interface) pour l'envoi d'email."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True, slots=True)
class EmailMessage:
    to: list[str]
    subject: str
    text_body: str
    html_body: str | None = None
    cc: list[str] = field(default_factory=list)
    reply_to: str | None = None
    headers: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class SendResult:
    provider_name: str
    success: bool
    provider_message_id: str | None = None
    error_code: str | None = None
    error_message: str | None = None


class EmailSenderPort(Protocol):
    provider_name: str

    async def send(self, message: EmailMessage) -> SendResult: ...
