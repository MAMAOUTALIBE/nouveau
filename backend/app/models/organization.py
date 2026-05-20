"""Tables organisationnelles (organizations / directions / units).

Mappe `hr.organizations`, `hr.directions`, `hr.units` du schéma SQL existant.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    organization_id: Mapped[UUID] = uuid_pk_column()
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Âge légal de départ à la retraite — configurable par l'organisation.
    retirement_age: Mapped[int] = mapped_column(
        Integer, nullable=False, default=60, server_default="60"
    )


class Direction(Base, TimestampMixin):
    __tablename__ = "directions"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="directions_org_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    direction_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    manager_name: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class Unit(Base, TimestampMixin):
    __tablename__ = "units"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="units_org_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    unit_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    direction_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
        nullable=False,
    )
    parent_unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    manager_name: Mapped[str | None] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    direction: Mapped[Direction] = relationship("Direction", lazy="joined")
