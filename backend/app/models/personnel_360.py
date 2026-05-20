"""Tables du module 004 (personnel 360 + IA) :
- employee_competencies, employee_dependents
- employee_digital_badges, employee_dossier_exports
- employee_turnover_risk_snapshots
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class EmployeeCompetency(Base, TimestampMixin):
    __tablename__ = "employee_competencies"
    __table_args__ = (
        CheckConstraint(
            "competency_level in ('Debutant','Intermediaire','Avance','Expert')",
            name="employee_competencies_level_check",
        ),
        CheckConstraint(
            "source in ('MANUAL','OCR','IMPORT','SYSTEM')",
            name="employee_competencies_source_check",
        ),
        UniqueConstraint(
            "organization_id",
            "employee_id",
            "label",
            name="employee_competencies_unique_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    employee_competency_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    label: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(
        String, nullable=False, default="Metier", server_default="Metier"
    )
    competency_level: Mapped[str] = mapped_column(
        String, nullable=False, default="Debutant", server_default="Debutant"
    )
    last_assessed_at: Mapped[date | None] = mapped_column(Date)
    source: Mapped[str] = mapped_column(
        String, nullable=False, default="MANUAL", server_default="MANUAL"
    )
    competency_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class EmployeeDependent(Base, TimestampMixin):
    __tablename__ = "employee_dependents"
    __table_args__ = (
        CheckConstraint(
            "coverage_status in ('Actif','Suspendu','Expire')",
            name="employee_dependents_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    employee_dependent_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    relationship: Mapped[str | None] = mapped_column(String)
    birth_date: Mapped[date | None] = mapped_column(Date)
    coverage_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="Protection sociale",
        server_default="Protection sociale",
    )
    coverage_status: Mapped[str] = mapped_column(
        String, nullable=False, default="Actif", server_default="Actif"
    )
    phone: Mapped[str | None] = mapped_column(String)
    dependent_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class EmployeeDigitalBadge(Base, TimestampMixin):
    __tablename__ = "employee_digital_badges"
    __table_args__ = (
        CheckConstraint(
            "badge_status in ('ACTIVE','SUSPENDED','EXPIRED','REVOKED')",
            name="employee_digital_badges_status_check",
        ),
        UniqueConstraint(
            "organization_id",
            "badge_code",
            name="employee_digital_badges_unique_code",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    employee_badge_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    badge_code: Mapped[str] = mapped_column(String, nullable=False)
    verification_code: Mapped[str] = mapped_column(String, nullable=False)
    signature_hash: Mapped[str] = mapped_column(String, nullable=False)
    qr_payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    badge_status: Mapped[str] = mapped_column(
        String, nullable=False, default="ACTIVE", server_default="ACTIVE"
    )
    issued_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    revoked_reason: Mapped[str | None] = mapped_column(String)


class EmployeeDossierExport(Base):
    __tablename__ = "employee_dossier_exports"
    __table_args__ = (
        CheckConstraint(
            "export_format in ('PDF')",
            name="employee_dossier_exports_format_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    dossier_export_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    file_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.file_objects.file_id"),
    )
    export_format: Mapped[str] = mapped_column(
        String, nullable=False, default="PDF", server_default="PDF"
    )
    signature_hash: Mapped[str] = mapped_column(String, nullable=False)
    verification_code: Mapped[str] = mapped_column(String, nullable=False)
    exported_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    exported_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    export_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class EmployeeTurnoverRiskSnapshot(Base):
    __tablename__ = "employee_turnover_risk_snapshots"
    __table_args__ = (
        CheckConstraint(
            "risk_score between 0 and 100",
            name="turnover_risk_score_check",
        ),
        CheckConstraint(
            "risk_level in ('Faible','Modere','Eleve','Critique')",
            name="turnover_risk_level_check",
        ),
        CheckConstraint(
            "review_decision is null or review_decision in ('CONFIRMED','DISMISSED','MONITOR')",
            name="turnover_risk_decision_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    turnover_risk_snapshot_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    risk_score: Mapped[int] = mapped_column(Integer, nullable=False)
    risk_level: Mapped[str] = mapped_column(String, nullable=False)
    factors: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    recommended_action: Mapped[str | None] = mapped_column(String)
    model_name: Mapped[str] = mapped_column(
        String, nullable=False, default="rules-v1", server_default="rules-v1"
    )
    generated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    reviewed_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    review_decision: Mapped[str | None] = mapped_column(String)
    snapshot_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )
