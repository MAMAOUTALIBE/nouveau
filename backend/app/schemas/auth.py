"""Schémas Pydantic des endpoints d'authentification."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=128)
    password: str = Field(..., min_length=1, max_length=512)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    access_expires_at: datetime
    refresh_expires_at: datetime


class UserSummary(BaseModel):
    """Identité utilisateur retournée à la connexion."""

    model_config = ConfigDict(from_attributes=True)

    user_id: UUID
    username: str
    full_name: str
    organization_id: UUID
    roles: list[str] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)
    scopes: list[str] = Field(default_factory=list)


class LoginResponse(BaseModel):
    user: UserSummary
    tokens: TokenPair


class RefreshRequest(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class RefreshResponse(BaseModel):
    tokens: TokenPair
