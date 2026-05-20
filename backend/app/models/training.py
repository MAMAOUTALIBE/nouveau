"""Tables formation — catalogue, sessions, demandes, évaluations chaud/froid, certificats.

Nouvelles tables introduites par la migration 0002 (V1 du backend Python).
Aucun équivalent dans le mock-backend Node.js (tout était en mémoire).
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class TrainingCatalog(Base, TimestampMixin):
    __tablename__ = "training_catalog"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="training_catalog_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    training_catalog_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    duration_hours: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )


class TrainingSession(Base, TimestampMixin):
    __tablename__ = "training_sessions"
    __table_args__ = (
        CheckConstraint(
            "session_status in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')",
            name="training_sessions_status_check",
        ),
        CheckConstraint(
            "end_date is null or start_date is null or end_date >= start_date",
            name="training_sessions_dates_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="training_sessions_ref_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    training_session_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    training_catalog_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.training_catalog.training_catalog_id"),
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    instructor: Mapped[str | None] = mapped_column(String)
    location: Mapped[str | None] = mapped_column(String)
    session_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PLANNED", server_default="PLANNED"
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    capacity: Mapped[int | None] = mapped_column(Integer)
    cold_eval_scheduled_for: Mapped[date | None] = mapped_column(Date)
    cold_eval_launched_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))


class TrainingSessionParticipant(Base, TimestampMixin):
    __tablename__ = "training_session_participants"
    __table_args__ = (
        CheckConstraint(
            "attendance_status in ('REGISTERED','ATTENDED','PARTIAL','NO_SHOW','CANCELLED')",
            name="training_participants_attendance_check",
        ),
        UniqueConstraint(
            "training_session_id",
            "employee_id",
            name="training_participants_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    training_session_participant_id: Mapped[UUID] = uuid_pk_column()
    training_session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.training_sessions.training_session_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    attendance_status: Mapped[str] = mapped_column(
        String, nullable=False, default="REGISTERED", server_default="REGISTERED"
    )
    final_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    instructor_validated: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )


class TrainingRequest(Base, TimestampMixin):
    __tablename__ = "training_requests"
    __table_args__ = (
        CheckConstraint(
            "request_status in ('PENDING','APPROVED','REJECTED','CANCELLED')",
            name="training_requests_status_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="training_requests_ref_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    training_request_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    requested_by_employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    training_catalog_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.training_catalog.training_catalog_id"),
    )
    requested_title: Mapped[str | None] = mapped_column(String)
    motivation: Mapped[str | None] = mapped_column(String)
    request_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", server_default="PENDING"
    )
    decided_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    decided_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    decision_comment: Mapped[str | None] = mapped_column(String)


class TrainingEvaluation(Base):
    """Évaluation chaud (à la fin de la session) ou froid (J+90)."""

    __tablename__ = "training_evaluations"
    __table_args__ = (
        CheckConstraint(
            "evaluation_kind in ('HOT','COLD')",
            name="training_evaluations_kind_check",
        ),
        CheckConstraint(
            "score_overall is null or score_overall between 0 and 100",
            name="training_evaluations_score_check",
        ),
        UniqueConstraint(
            "training_session_id",
            "employee_id",
            "evaluation_kind",
            name="training_evaluations_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    training_evaluation_id: Mapped[UUID] = uuid_pk_column()
    training_session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.training_sessions.training_session_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    evaluation_kind: Mapped[str] = mapped_column(String, nullable=False)
    invitation_token: Mapped[str | None] = mapped_column(String, unique=True)
    invited_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    score_overall: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    answers: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    comments: Mapped[str | None] = mapped_column(String)


class TrainingCertificate(Base):
    __tablename__ = "training_certificates"
    __table_args__ = (
        UniqueConstraint(
            "training_session_id",
            "employee_id",
            name="training_certificates_unique",
        ),
        UniqueConstraint(
            "verification_code",
            name="training_certificates_verif_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    training_certificate_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    training_session_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.training_sessions.training_session_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    file_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.file_objects.file_id"),
    )
    document_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id"),
    )
    issued_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    verification_code: Mapped[str] = mapped_column(String, nullable=False)
    signature_hash: Mapped[str | None] = mapped_column(String)
    template_version: Mapped[str | None] = mapped_column(String)
