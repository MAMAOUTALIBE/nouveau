"""Tables signature électronique — providers, enveloppes, audit trail.

L'abstraction provider arrive en vague 4 (PY-024) ; ces tables préparent
le terrain pour stocker la liaison avec les prestataires (Universign,
Yousign, ou PKI gouvernementale via endesive).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class SignatureProvider(Base, TimestampMixin):
    """Configuration d'un prestataire de signature."""

    __tablename__ = "signature_providers"
    __table_args__ = (
        CheckConstraint(
            "provider_kind in ('MOCK','UNIVERSIGN','YOUSIGN','DOCUSIGN','ENDESIVE_LOCAL')",
            name="signature_providers_kind_check",
        ),
        UniqueConstraint(
            "organization_id",
            "code",
            name="signature_providers_code_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    signature_provider_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    provider_kind: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    config: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )


class SignatureEnvelope(Base, TimestampMixin):
    __tablename__ = "signature_envelopes"
    __table_args__ = (
        CheckConstraint(
            "envelope_status in ('DRAFT','SENT','SIGNED','REJECTED','EXPIRED','CANCELLED')",
            name="signature_envelopes_status_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="signature_envelopes_ref_key",
        ),
        UniqueConstraint(
            "verification_code",
            name="signature_envelopes_verif_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    signature_envelope_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    signature_provider_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.signature_providers.signature_provider_id"),
        nullable=False,
    )
    document_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id"),
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    external_envelope_id: Mapped[str | None] = mapped_column(String)
    envelope_status: Mapped[str] = mapped_column(
        String, nullable=False, default="DRAFT", server_default="DRAFT"
    )
    signature_hash: Mapped[str | None] = mapped_column(String)
    verification_code: Mapped[str] = mapped_column(String, nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    signed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )


class SignatureAuditTrail(Base):
    """Journal d'événements signature, distinct de `audit_logs` pour préserver
    le format légal du trail (eIDAS-compatible)."""

    __tablename__ = "signature_audit_trail"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    signature_audit_trail_id: Mapped[UUID] = uuid_pk_column()
    signature_envelope_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.signature_envelopes.signature_envelope_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_label: Mapped[str | None] = mapped_column(String)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    source_ip: Mapped[str | None] = mapped_column(String)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    occurred_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
