"""Table `hr.audit_logs` — journal d'audit transactionnel."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import TIMESTAMP, CheckConstraint, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import INET, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.security.redaction import RedactedJSONB
from app.models._mixins import DEFAULT_SCHEMA, uuid_pk_column


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        CheckConstraint(
            "status in ('SUCCESS','FAILURE')",
            name="audit_logs_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    audit_log_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    action: Mapped[str] = mapped_column(String, nullable=False)
    target_type: Mapped[str | None] = mapped_column(String)
    target_id: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="SUCCESS",
        server_default="SUCCESS",
    )
    source_ip: Mapped[str | None] = mapped_column(INET)
    user_agent: Mapped[str | None] = mapped_column(String)
    # before_data / after_data appliquent la redaction PII a l'ecriture
    # (RedactedJSONB.process_bind_param). Le DDL reste JSONB : aucune
    # migration necessaire. Garantie defense-en-profondeur si un service
    # oublie de filtrer les payloads d'audit.
    before_data: Mapped[dict[str, Any] | None] = mapped_column(RedactedJSONB)
    after_data: Mapped[dict[str, Any] | None] = mapped_column(RedactedJSONB)
    audit_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
    occurred_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
