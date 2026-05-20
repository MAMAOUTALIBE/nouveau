"""Endpoints 2FA TOTP : /api/v1/auth/2fa/*."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.services import totp_service

router = APIRouter(prefix="/auth/2fa", tags=["auth"])


class TotpSetupResponse(BaseModel):
    otpauth_url: str = Field(..., description="Coller dans Google Authenticator / FreeOTP")
    secret_b32: str = Field(..., description="Secret en clair — exposé une seule fois.")
    issuer: str


class TotpConfirmRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=8, pattern=r"^\d{6,8}$")


@router.post(
    "/setup",
    response_model=TotpSetupResponse,
    status_code=status.HTTP_201_CREATED,
)
async def setup_totp(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TotpSetupResponse:
    """Initialise le 2FA pour l'utilisateur courant.

    Renvoie l'URL otpauth + secret. L'agent scanne le QR avec son
    application authenticator. Le 2FA n'est PAS encore actif tant que
    `confirm` n'est pas appelé avec un code valide.
    """
    setup = await totp_service.setup_for_user(session, user_id=current_user.user_id, audit=audit)
    return TotpSetupResponse(
        otpauth_url=setup.otpauth_url,
        secret_b32=setup.secret_b32,
        issuer=setup.issuer,
    )


@router.post("/confirm", status_code=status.HTTP_204_NO_CONTENT)
async def confirm_totp(
    body: TotpConfirmRequest,
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> None:
    """Active le 2FA après vérification du premier code TOTP."""
    await totp_service.confirm_setup(
        session, user_id=current_user.user_id, code=body.code, audit=audit
    )


@router.post("/disable", status_code=status.HTTP_204_NO_CONTENT)
async def disable_totp(
    current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> None:
    """Désactive le 2FA pour l'utilisateur courant.

    À encadrer par une politique RH : la désactivation devrait nécessiter
    une re-authentification forte (2e facteur ou validation manager).
    Pour V1, accessible à l'utilisateur lui-même après login.
    """
    await totp_service.disable_totp(session, user_id=current_user.user_id, audit=audit)
