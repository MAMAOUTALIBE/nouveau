"""Service d'authentification : login, refresh, lecture identité enrichie."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import AuditWriter
from app.core.errors import AuthenticationError, ForbiddenError, RateLimitError
from app.core.logging import get_logger
from app.core.security.passwords import needs_rehash, verify_password
from app.core.security.rate_limit import LoginRateLimiter
from app.core.security.rbac import resolve_permissions, resolve_scopes
from app.core.security.tokens import (
    TokenPayload,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.models.permission import Role
from app.models.user import User
from app.schemas.auth import LoginResponse, RefreshResponse, TokenPair, UserSummary

logger = get_logger(__name__)


async def _load_user_by_username(session: AsyncSession, identifier: str) -> User | None:
    """Charge un utilisateur par son `username` OU son `email`.

    Le formulaire de connexion accepte historiquement une adresse e-mail ;
    on supporte donc les deux formes pour ne pas forcer les utilisateurs
    finaux à apprendre une convention de nommage technique.
    """
    stmt = (
        select(User)
        .where((User.username == identifier) | (User.email == identifier))
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .options(selectinload(User.scopes))
    )
    return (await session.execute(stmt)).scalar_one_or_none()


async def _load_user_by_id(session: AsyncSession, user_id: UUID) -> User | None:
    stmt = (
        select(User)
        .where(User.user_id == user_id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .options(selectinload(User.scopes))
    )
    return (await session.execute(stmt)).scalar_one_or_none()


def _build_user_summary(user: User) -> UserSummary:
    perms = resolve_permissions(user)
    scopes = resolve_scopes(user)
    return UserSummary(
        user_id=user.user_id,
        username=str(user.username),
        full_name=user.full_name,
        organization_id=user.organization_id,
        roles=[role.code for role in user.roles],
        permissions=sorted(perms),
        scopes=sorted(scopes),
    )


def _issue_token_pair(user: User) -> TokenPair:
    access, access_exp = create_access_token(
        user_id=user.user_id,
        username=str(user.username),
        organization_id=user.organization_id,
    )
    refresh, refresh_exp = create_refresh_token(
        user_id=user.user_id,
        username=str(user.username),
        organization_id=user.organization_id,
    )
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        access_expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )


async def login(
    *,
    session: AsyncSession,
    username: str,
    password: str,
    rate_limiter: LoginRateLimiter,
    audit: AuditWriter | None = None,
) -> LoginResponse:
    """Authentifie un utilisateur et émet une paire de tokens.

    - Lève RateLimitError si la clé est verrouillée.
    - Lève AuthenticationError si username/password invalide.
    - Lève ForbiddenError si le compte est suspendu/désactivé.
    """
    key = username.strip().lower()

    locked_for = await rate_limiter.check(key)
    if locked_for is not None:
        raise RateLimitError(
            "Compte temporairement verrouillé pour cause de tentatives répétées.",
            retry_after_seconds=locked_for,
        )

    user = await _load_user_by_username(session, key)
    if user is None or not verify_password(password, user.password_hash):
        await rate_limiter.register_failure(key)
        # Note V0 : on ne persiste pas le LOGIN_FAILED en DB car la session sera
        # rollback par le handler d'exception. Trace en log structuré uniquement.
        # Vague 8 (PY-080) : audit DB des échecs via session séparée / Redis.
        logger.warning(
            "login_failed",
            username=key,
            user_found=user is not None,
        )
        raise AuthenticationError("Identifiants invalides.", code="BAD_CREDENTIALS")

    if user.status != "ACTIVE":
        raise ForbiddenError(
            "Compte utilisateur inactif ou suspendu.",
            code="USER_INACTIVE",
        )

    # Login réussi → reset compteur, mise à jour last_login, audit
    await rate_limiter.reset(key)
    user.last_login_at = datetime.now(tz=UTC)

    # Re-hash transparent si bcrypt cost augmente entre versions
    if needs_rehash(user.password_hash):
        from app.core.security.passwords import hash_password

        user.password_hash = hash_password(password)

    if audit is not None:
        await audit.record(
            action="LOGIN_SUCCESS",
            target_type="user",
            target_id=str(user.user_id),
            organization_id=user.organization_id,
            actor_user_id=user.user_id,
        )

    tokens = _issue_token_pair(user)
    return LoginResponse(
        user=_build_user_summary(user),
        tokens=tokens,
    )


async def refresh(
    *,
    session: AsyncSession,
    refresh_token: str,
) -> RefreshResponse:
    """Émet une nouvelle paire de tokens à partir d'un refresh valide."""
    payload: TokenPayload = decode_token(refresh_token, expected_type="refresh")
    user = await _load_user_by_id(session, payload.user_id)
    if user is None or user.status != "ACTIVE":
        raise AuthenticationError(
            "Refresh token associé à un compte inactif.",
            code="USER_INACTIVE",
        )
    return RefreshResponse(tokens=_issue_token_pair(user))
