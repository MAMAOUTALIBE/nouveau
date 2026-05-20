"""Tables GPEC — référentiel compétences, exigences par poste, snapshots d'écarts."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    CheckConstraint,
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


class CompetencyReferential(Base, TimestampMixin):
    """Référentiel central des compétences (catalogue d'organisation)."""

    __tablename__ = "competency_referential"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "code",
            name="competency_referential_code_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    competency_referential_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)


class PositionCompetencyRequirement(Base, TimestampMixin):
    """Compétences attendues par un poste, avec niveau cible."""

    __tablename__ = "position_competency_requirements"
    __table_args__ = (
        CheckConstraint(
            "expected_level in ('Debutant','Intermediaire','Avance','Expert')",
            name="position_competency_level_check",
        ),
        UniqueConstraint(
            "position_id",
            "competency_referential_id",
            name="position_competency_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    position_competency_requirement_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    position_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.positions.position_id", ondelete="CASCADE"),
        nullable=False,
    )
    competency_referential_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.competency_referential.competency_referential_id",
        ),
        nullable=False,
    )
    expected_level: Mapped[str] = mapped_column(String, nullable=False)
    is_critical: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")


class CompetencyGapsSnapshot(Base):
    """Snapshot d'écarts compétences par périmètre.

    Calculé périodiquement par `CompetencyGapsService.compute_snapshot(...)`.
    Sert le rapport "Top écarts critiques par direction".
    """

    __tablename__ = "competency_gaps_snapshots"
    __table_args__ = (
        CheckConstraint(
            "scope_type in ('GLOBAL','DIRECTION','UNIT','POSITION')",
            name="competency_gaps_scope_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    competency_gaps_snapshot_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    scope_type: Mapped[str] = mapped_column(String, nullable=False)
    scope_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    employees_assessed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    critical_gaps_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    generated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    generated_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
