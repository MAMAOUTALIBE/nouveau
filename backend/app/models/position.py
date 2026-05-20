"""Table `hr.positions` — postes budgétés / vacants."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class Position(Base, TimestampMixin):
    __tablename__ = "positions"
    __table_args__ = (
        CheckConstraint(
            "position_status in ('OPEN','FILLED','FROZEN','CLOSED')",
            name="positions_status_check",
        ),
        CheckConstraint("budgeted_headcount > 0", name="positions_headcount_check"),
        UniqueConstraint("organization_id", "code", name="positions_org_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    position_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    grade: Mapped[str | None] = mapped_column(String)
    position_status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="OPEN",
        server_default="OPEN",
    )
    budgeted_headcount: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
