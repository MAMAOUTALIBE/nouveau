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
    """Réponse /login.

    Le champ ``tokens`` est optionnel : en mode cookie httpOnly (staging/prod),
    les tokens sont posés en cookies et NE doivent PAS apparaître dans le body.
    En dev, ils restent dans le body pour préserver la compat (tests E2E,
    scripts cURL). Cf. ``settings.jwt_return_token_in_body``.
    """

    user: UserSummary
    tokens: TokenPair | None = None


class RefreshRequest(BaseModel):
    """Body de /refresh.

    En mode cookie httpOnly, le refresh token est lu depuis le cookie
    ``rh_refresh`` et le body peut être vide. Le champ reste accepté pour
    préserver la compat (clients qui n'ont pas encore migré).
    """

    refresh_token: str | None = Field(default=None, min_length=10)


class RefreshResponse(BaseModel):
    """Réponse /refresh.

    Tokens optionnels pour la même raison que :class:`LoginResponse`.
    """

    tokens: TokenPair | None = None
