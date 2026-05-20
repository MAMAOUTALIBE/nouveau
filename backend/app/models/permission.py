"""Tables RBAC : permissions, rôles, role_permissions.

Mappe `hr.permissions`, `hr.roles`, `hr.role_permissions`.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import TIMESTAMP, Boolean, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class Permission(Base):
    __tablename__ = "permissions"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    permission_id: Mapped[UUID] = uuid_pk_column()
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    module_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class Role(Base, TimestampMixin):
    __tablename__ = "roles"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    role_id: Mapped[UUID] = uuid_pk_column()
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    label: Mapped[str] = mapped_column(String, nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    permissions: Mapped[list[Permission]] = relationship(
        "Permission",
        secondary=f"{DEFAULT_SCHEMA}.role_permissions",
        lazy="selectin",
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    role_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.roles.role_id", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.permissions.permission_id", ondelete="CASCADE"),
        primary_key=True,
    )
    granted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
