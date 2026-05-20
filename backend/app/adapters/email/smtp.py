"""Adapter email SMTP — `aiosmtplib`, recommandé pour relay interne."""

from __future__ import annotations

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.adapters.email.port import EmailMessage, EmailSenderPort, SendResult
from app.core.logging import get_logger

logger = get_logger(__name__)


class SmtpEmailAdapter(EmailSenderPort):
    provider_name = "smtp"

    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str | None,
        password: str | None,
        use_tls: bool,
        mail_from: str,
    ) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.use_tls = use_tls
        self.mail_from = mail_from

    async def send(self, message: EmailMessage) -> SendResult:
        try:
            import aiosmtplib  # noqa: F401  # pyright: ignore[reportMissingImports]
        except ImportError:
            return SendResult(
                provider_name=self.provider_name,
                success=False,
                error_code="AIOSMTPLIB_NOT_INSTALLED",
                error_message="`uv add aiosmtplib` requis pour le provider SMTP.",
            )

        from aiosmtplib import SMTP

        mime: MIMEMultipart = MIMEMultipart("alternative")
        mime["From"] = self.mail_from
        mime["To"] = ", ".join(message.to)
        mime["Subject"] = message.subject
        if message.cc:
            mime["Cc"] = ", ".join(message.cc)
        if message.reply_to:
            mime["Reply-To"] = message.reply_to
        for k, v in message.headers.items():
            mime[k] = v
        mime.attach(MIMEText(message.text_body, "plain", "utf-8"))
        if message.html_body:
            mime.attach(MIMEText(message.html_body, "html", "utf-8"))

        try:
            async with SMTP(
                hostname=self.host,
                port=self.port,
                use_tls=False,
                start_tls=self.use_tls,
            ) as smtp:
                if self.username and self.password:
                    await smtp.login(self.username, self.password)
                await smtp.send_message(mime)
        except Exception as exc:
            logger.error(
                "email_smtp_failed",
                to=message.to,
                error=str(exc),
                error_type=type(exc).__name__,
            )
            return SendResult(
                provider_name=self.provider_name,
                success=False,
                error_code="SMTP_SEND_FAILED",
                error_message=str(exc),
            )

        logger.info("email_smtp_sent", to=message.to, subject=message.subject)
        return SendResult(provider_name=self.provider_name, success=True)
