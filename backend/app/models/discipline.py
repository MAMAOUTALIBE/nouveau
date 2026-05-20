"""Tables disciplinaires — dossiers et événements.

Présent côté frontend (Final/src/app/modules/discipline/) mais en mémoire
seulement dans le mock-backend Node.js. La vague 1 introduit la persistance.
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
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class DisciplineCase(Base, TimestampMixin):
    __tablename__ = "discipline_cases"
    __table_args__ = (
        CheckConstraint(
            "case_status in ('OPEN','UNDER_INVESTIGATION','SANCTION_PROPOSED',"
            "'SANCTION_APPLIED','CLOSED','DISMISSED')",
            name="discipline_cases_status_check",
        ),
        CheckConstraint(
            "severity in ('Faible','Modere','Eleve','Critique')",
            name="discipline_cases_severity_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="discipline_cases_ref_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    discipline_case_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    case_status: Mapped[str] = mapped_column(
        String, nullable=False, default="OPEN", server_default="OPEN"
    )
    severity: Mapped[str] = mapped_column(
        String, nullable=False, default="Modere", server_default="Modere"
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    summary: Mapped[str | None] = mapped_column(String)
    incident_date: Mapped[date | None] = mapped_column(Date)
    proposed_sanction: Mapped[str | None] = mapped_column(String)
    applied_sanction: Mapped[str | None] = mapped_column(String)
    opened_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    closed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))


class DisciplineEvent(Base):
    __tablename__ = "discipline_events"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    discipline_event_id: Mapped[UUID] = uuid_pk_column()
    discipline_case_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.discipline_cases.discipline_case_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    note: Mapped[str | None] = mapped_column(String)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    occurred_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
