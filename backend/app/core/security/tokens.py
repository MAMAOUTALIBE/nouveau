"""Émission et validation des JWT (access + refresh)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any, Literal
from uuid import UUID, uuid4

import jwt
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.errors import AuthenticationError

TokenType = Literal["access", "refresh"]


class TokenPayload(BaseModel):
    """Contenu décodé d'un JWT, validé par Pydantic."""

    sub: str = Field(..., description="ID utilisateur (UUID)")
    type: TokenType
    iat: int
    exp: int
    jti: str
    username: str
    organization_id: str

    @property
    def user_id(self) -> UUID:
        return UUID(self.sub)


def _now_ts() -> int:
    return int(datetime.now(tz=UTC).timestamp())


def _create_token(
    *,
    user_id: UUID,
    username: str,
    organization_id: UUID,
    token_type: TokenType,
    ttl_seconds: int,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime]:
    settings = get_settings()
    issued_at = datetime.now(tz=UTC)
    expires_at = issued_at + timedelta(seconds=ttl_seconds)
    claims: dict[str, Any] = {
        "sub": str(user_id),
        "type": token_type,
        "iat": int(issued_at.timestamp()),
        "exp": int(expires_at.timestamp()),
        "jti": str(uuid4()),
        "username": username,
        "organization_id": str(organization_id),
    }
    if extra_claims:
        claims.update(extra_claims)
    encoded = jwt.encode(
        claims,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    return encoded, expires_at


def create_access_token(
    *,
    user_id: UUID,
    username: str,
    organization_id: UUID,
    extra_claims: dict[str, Any] | None = None,
) -> tuple[str, datetime]:
    """Émet un token d'accès. Retourne (jwt, expires_at)."""
    settings = get_settings()
    return _create_token(
        user_id=user_id,
        username=username,
        organization_id=organization_id,
        token_type="access",
        ttl_seconds=settings.jwt_access_ttl_seconds,
        extra_claims=extra_claims,
    )


def create_refresh_token(
    *,
    user_id: UUID,
    username: str,
    organization_id: UUID,
) -> tuple[str, datetime]:
    """Émet un refresh token. Retourne (jwt, expires_at)."""
    settings = get_settings()
    return _create_token(
        user_id=user_id,
        username=username,
        organization_id=organization_id,
        token_type="refresh",
        ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )


def decode_token(token: str, *, expected_type: TokenType | None = None) -> TokenPayload:
    """Décode et valide un JWT. Lève AuthenticationError si invalide/expiré.

    Si `expected_type` est fourni, vérifie que le type correspond
    (ex: refuser un refresh token sur un endpoint qui exige un access).
    """
    settings = get_settings()
    try:
        raw = jwt.decode(
            token,
            settings.jwt_secret_key.get_secret_value(),
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as err:
        raise AuthenticationError("Token expiré.", code="TOKEN_EXPIRED") from err
    except jwt.InvalidTokenError as err:
        raise AuthenticationError("Token invalide.", code="TOKEN_INVALID") from err

    try:
        payload = TokenPayload.model_validate(raw)
    except Exception as err:
        raise AuthenticationError("Token mal formé.", code="TOKEN_MALFORMED") from err

    if expected_type is not None and payload.type != expected_type:
        raise AuthenticationError(
            f"Type de token incorrect (attendu {expected_type}).",
            code="TOKEN_WRONG_TYPE",
        )

    if payload.exp < _now_ts():
        raise AuthenticationError("Token expiré.", code="TOKEN_EXPIRED")

    return payload
