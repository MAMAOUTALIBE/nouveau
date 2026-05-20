"""Tables `hr.users`, `hr.user_roles`, `hr.user_scopes`."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import TIMESTAMP, CheckConstraint, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column

if TYPE_CHECKING:
    from app.models.permission import Role


class User(Base, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    user_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    username: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    email: Mapped[str | None] = mapped_column(CITEXT)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="ACTIVE",
        server_default="ACTIVE",
    )
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    last_login_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    # Liaison user → employee (PY-027b) : un user représente au plus un agent
    # (unique partial index `uq_users_employee_id`). Permet le scope SELF :
    # un agent peut voir ses propres congés / documents.
    employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )

    # 2FA TOTP (PY-082) — secret chiffré applicativement (Fernet).
    totp_secret_encrypted: Mapped[str | None] = mapped_column(String)
    totp_enabled: Mapped[bool] = mapped_column(
        nullable=False, default=False, server_default="false"
    )
    totp_enrolled_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    totp_last_used_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))

    # `user_roles` a deux FKs vers `users` (user_id + assigned_by_user_id) ;
    # on désambiguïse via `foreign_keys` (strings : SQLAlchemy résout au
    # configure-time, pas d'import circulaire).
    roles: Mapped[list[Role]] = relationship(
        "Role",
        secondary=f"{DEFAULT_SCHEMA}.user_roles",
        primaryjoin="User.user_id == UserRole.user_id",
        secondaryjoin="UserRole.role_id == Role.role_id",
        lazy="selectin",
        viewonly=True,
    )
    scopes: Mapped[list[UserScope]] = relationship(
        "UserScope",
        back_populates="user",
        lazy="selectin",
    )

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id", ondelete="CASCADE"),
        primary_key=True,
    )
    role_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.roles.role_id", ondelete="CASCADE"),
        primary_key=True,
    )
    assigned_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    assigned_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )


class UserScope(Base):
    __tablename__ = "user_scopes"
    __table_args__ = (
        CheckConstraint(
            "scope_type in ('SELF','TEAM','UNIT','DIRECTION','GLOBAL')",
            name="user_scopes_type_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    user_scope_id: Mapped[UUID] = uuid_pk_column()
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    scope_type: Mapped[str] = mapped_column(String, nullable=False)
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    team_key: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    user: Mapped[User] = relationship("User", back_populates="scopes")
