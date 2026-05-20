"""Endpoints d'authentification : /auth/login, /auth/refresh, /auth/logout."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rate_limit import LoginRateLimiter, get_login_limiter
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RefreshResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


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
    session: Annotated[AsyncSession, Depends(get_session)],
    limiter: Annotated[LoginRateLimiter, Depends(get_login_limiter)],
) -> LoginResponse:
    """Authentifie un utilisateur et retourne tokens + identité."""
    # AuditWriter en mode unauthenticated : on a besoin de logger même un échec
    # de login. Pour récupérer l'org_id on s'appuie sur le user trouvé (ou pas).
    # Le AuditWriter "best-effort" est créé mais l'org_id sera fourni par le
    # service après lookup user.
    audit = AuditWriter(session)
    return await auth_service.login(
        session=session,
        username=body.username,
        password=body.password,
        rate_limiter=limiter,
        audit=audit,
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RefreshResponse:
    """Émet une nouvelle paire de tokens depuis un refresh token valide."""
    return await auth_service.refresh(
        session=session,
        refresh_token=body.refresh_token,
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> None:
    """Logout côté client.

    Note V0 : sans Redis pour blacklister les JWT, le logout est déclaratif.
    Le client doit oublier ses tokens. Une vraie révocation arrivera en
    Vague 8 (PY-080) avec stockage Redis des `jti` révoqués.
    """
    await audit.record(
        action="LOGOUT",
        target_type="user",
        target_id=str(current_user.user_id),
    )
    return None
