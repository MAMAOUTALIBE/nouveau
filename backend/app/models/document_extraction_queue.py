"""File d'attente OCR — découple l'upload du traitement asynchrone.

Branchée par le worker arq (vague 4 — PY-041) qui consomme les entrées
PENDING, appelle l'adapter `DocumentExtractionPort` du provider configuré
(Tesseract / Azure / AWS), et écrit le résultat dans `document_analysis_runs`.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    CheckConstraint,
    ForeignKey,
    Integer,
    String,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, uuid_pk_column


class DocumentExtractionQueue(Base):
    __tablename__ = "document_extraction_queue"
    __table_args__ = (
        CheckConstraint(
            "queue_status in ('PENDING','RUNNING','COMPLETED','FAILED','REVIEW_REQUIRED')",
            name="document_extraction_queue_status_check",
        ),
        CheckConstraint("attempts >= 0", name="document_extraction_queue_attempts_check"),
        {"schema": DEFAULT_SCHEMA},
    )

    document_extraction_queue_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    document_version_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_versions.document_version_id"),
    )
    provider_hint: Mapped[str | None] = mapped_column(String)
    queue_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", server_default="PENDING"
    )
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    last_error: Mapped[str | None] = mapped_column(String)
    started_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    enqueued_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
