"""Endpoints d'authentification : /auth/login, /auth/refresh, /auth/logout."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.core.errors import AuthenticationError, RateLimitError
from app.core.logging import get_logger
from app.core.security.cookies import clear_auth_cookies, set_auth_cookies
from app.core.security.rate_limit import (
    LoginRateLimiter,
    get_login_limiter,
    get_refresh_limiter,
)
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.core.security.tokens import decode_token
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


def _strip_tokens_if_needed(
    payload: LoginResponse | RefreshResponse,
    settings: Settings,
) -> None:
    """Vide ``payload.tokens`` si le mode cookie-only est actif.

    Mute le payload en place pour éviter d'avoir à reconstruire un schéma
    différent côté router. La décision est centralisée par ``settings``.
    """
    if not settings.jwt_return_token_in_body:
        payload.tokens = None


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK,
    responses={
        401: {"description": "Identifiants invalides"},
        403: {"description": "Compte suspendu"},
        429: {"description": "Trop de tentatives"},
    },
)
async def login(
    body: LoginRequest,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    limiter: Annotated[LoginRateLimiter, Depends(get_login_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> LoginResponse:
    """Authentifie un utilisateur et émet des cookies httpOnly + identité.

    Comportement body :
    - ``settings.jwt_return_token_in_body=True`` (dev) : tokens dans le body
      ET en cookies → compat tests E2E qui font ``Authorization: Bearer …``.
    - ``False`` (staging/prod) : tokens UNIQUEMENT en cookies httpOnly.
    """
    audit = AuditWriter(session)
    result = await auth_service.login(
        session=session,
        username=body.username,
        password=body.password,
        rate_limiter=limiter,
        audit=audit,
    )
    # `result.tokens` est garanti non-None ici (le service vient de les émettre).
    assert result.tokens is not None
    set_auth_cookies(
        response,
        access_token=result.tokens.access_token,
        refresh_token=result.tokens.refresh_token,
        settings=settings,
    )
    logger.info(
        "login_success",
        user_id=str(result.user.user_id),
        cookie_mode=not settings.jwt_return_token_in_body,
    )
    _strip_tokens_if_needed(result, settings)
    return result


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    request: Request,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    limiter: Annotated[LoginRateLimiter, Depends(get_refresh_limiter)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> RefreshResponse:
    """Émet une nouvelle paire de tokens depuis un refresh token valide.

    Ordre de lecture du refresh token :
    1. Cookie ``settings.jwt_refresh_cookie_name`` (mode httpOnly).
    2. ``body.refresh_token`` (compat : clients non migrés).
    3. Sinon → 401.
    """
    refresh_token = request.cookies.get(settings.jwt_refresh_cookie_name)
    if not refresh_token:
        refresh_token = body.refresh_token
    if not refresh_token:
        raise AuthenticationError(
            "Aucun refresh token fourni.",
            code="REFRESH_TOKEN_MISSING",
        )

    # On extrait le `sub` AVANT validation DB pour servir de clé de
    # rate-limit. Un token mal formé bascule en 401 (decode_token lève).
    # NB : on logge l'événement sans le token lui-même.
    payload = decode_token(refresh_token, expected_type="refresh")
    rate_key = f"refresh:{payload.sub}"

    locked_for = await limiter.check(rate_key)
    if locked_for is not None:
        raise RateLimitError(
            "Trop de tentatives de refresh. Réessayez plus tard.",
            retry_after_seconds=locked_for,
        )

    try:
        result = await auth_service.refresh(
            session=session,
            refresh_token=refresh_token,
        )
    except (AuthenticationError, Exception) as err:
        # On compte aussi les échecs DB (compte inactif) comme tentatives —
        # quelqu'un qui spamme refresh sur un compte désactivé reste suspect.
        if isinstance(err, AuthenticationError):
            await limiter.register_failure(rate_key)
        raise

    # Succès : reset compteur + pose des nouveaux cookies.
    await limiter.reset(rate_key)
    assert result.tokens is not None
    set_auth_cookies(
        response,
        access_token=result.tokens.access_token,
        refresh_token=result.tokens.refresh_token,
        settings=settings,
    )
    logger.info(
        "refresh_success",
        user_id=payload.sub,
        cookie_mode=not settings.jwt_return_token_in_body,
    )
    _strip_tokens_if_needed(result, settings)
    return result


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    response: Response,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> None:
    """Logout : invalide les cookies + log audit.

    Note V0 : sans Redis pour blacklister les JWT, le logout est déclaratif
    côté serveur (le client doit oublier ses tokens — ce qui est fait
    pour les cookies httpOnly via ``clear_auth_cookies``). Une vraie
    révocation arrivera plus tard (Sub-5 / Vague 8) avec stockage Redis
    des ``jti`` révoqués.
    """
    clear_auth_cookies(response, settings)
    await audit.record(
        action="LOGOUT",
        target_type="user",
        target_id=str(current_user.user_id),
    )
    return None
