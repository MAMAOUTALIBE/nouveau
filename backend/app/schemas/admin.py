"""Schémas Pydantic pour le domaine Admin (users / roles / permissions)."""

from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

UserStatus = Literal["ACTIVE", "SUSPENDED", "DISABLED"]
ScopeType = Literal["SELF", "TEAM", "UNIT", "DIRECTION", "GLOBAL"]


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
class UserListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    organization_id: UUID
    username: str
    email: EmailStr | None = None
    full_name: str
    status: UserStatus
    direction_id: UUID | None
    unit_id: UUID | None
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime
    roles: list[str] = Field(default_factory=list)


class UserCreateRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=128)
    email: EmailStr | None = None
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    role_codes: list[str] = Field(
        default_factory=list,
        description="Codes des rôles à attribuer à la création.",
    )
    scopes: list[ScopeType] = Field(
        default_factory=list,
        description="Scopes initiaux (sinon inférés du rôle).",
    )


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(default=None, min_length=2, max_length=255)
    direction_id: UUID | None = None
    unit_id: UUID | None = None


class UserSetRolesRequest(BaseModel):
    role_codes: list[str] = Field(..., min_length=0)


class UserResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserListItem):
    """Identique à UserListItem pour le moment, distinct si on enrichit."""


# ---------------------------------------------------------------------------
# Roles
# ---------------------------------------------------------------------------
class RolePermissionRef(BaseModel):
    code: str
    label: str
    module_name: str


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_id: UUID
    code: str
    label: str
    is_system: bool
    permissions: list[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class RoleCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[a-z][a-z0-9_]*$")
    label: str = Field(..., min_length=2, max_length=128)
    permission_codes: list[str] = Field(default_factory=list)


class RoleUpdateRequest(BaseModel):
    label: str | None = Field(default=None, min_length=2, max_length=128)


class RoleSetPermissionsRequest(BaseModel):
    permission_codes: list[str]


# ---------------------------------------------------------------------------
# Permissions
# ---------------------------------------------------------------------------
class PermissionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    permission_id: UUID
    code: str
    label: str
    module_name: str
    created_at: datetime
