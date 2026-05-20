"""Service 2FA TOTP — setup, vérification, désactivation.

Utilise `pyotp` (lib Python pure, pas de dépendance native).
Le secret TOTP est stocké en base **chiffré** via le `JWT_SECRET_KEY`
comme clé Fernet (suffit pour V1 ; en V2 utiliser une vraie clé KMS).

Flow :
1. `setup_for_user(user_id)` → génère un secret + URL otpauth + QR code
   provisionning. Le secret n'est PAS encore activé (`totp_enabled=false`).
2. L'agent scanne le QR dans Google Authenticator / FreeOTP.
3. `confirm_setup(user_id, code)` → si le code est valide, on met
   `totp_enabled=true`. Sinon, on rejette.
4. `verify_code(user_id, code)` → utilisé par /auth/login en V2 pour
   exiger un 2FA si le rôle de l'user le requiert.

L'audit trace toutes les opérations.
"""

from __future__ import annotations

import base64
import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.config import get_settings
from app.core.errors import AuthenticationError, ConflictError, NotFoundError
from app.models.user import User


@dataclass(frozen=True, slots=True)
class TotpSetup:
    """Résultat de l'étape 1 du setup 2FA."""

    user_id: UUID
    otpauth_url: str
    secret_b32: str  # exposé une seule fois — à stocker côté authenticator
    issuer: str


def _fernet_key() -> bytes:
    """Dérive une clé Fernet 32-bytes depuis JWT_SECRET_KEY."""
    settings = get_settings()
    raw = settings.jwt_secret_key.get_secret_value().encode("utf-8")
    return base64.urlsafe_b64encode(hashlib.sha256(raw).digest())


def _encrypt(secret: str) -> str:
    try:
        from cryptography.fernet import Fernet
    except ImportError as exc:
        raise RuntimeError(
            "cryptography non installé. `uv add cryptography` requis pour 2FA."
        ) from exc
    return Fernet(_fernet_key()).encrypt(secret.encode("utf-8")).decode("ascii")


def _decrypt(encrypted: str) -> str:
    from cryptography.fernet import Fernet

    return Fernet(_fernet_key()).decrypt(encrypted.encode("ascii")).decode("utf-8")


def is_required_for_user_roles(roles: tuple[str, ...]) -> bool:
    """Renvoie True si au moins un rôle de l'user impose le 2FA."""
    settings = get_settings()
    required = {r.strip() for r in settings.totp_required_for_roles.split(",") if r.strip()}
    return any(r in required for r in roles)


async def setup_for_user(
    session: AsyncSession,
    *,
    user_id: UUID,
    audit: AuditWriter,
) -> TotpSetup:
    try:
        import pyotp
    except ImportError as exc:
        raise RuntimeError("pyotp non installé. `uv add pyotp cryptography` requis.") from exc

    user = (await session.execute(select(User).where(User.user_id == user_id))).scalar_one_or_none()
    if user is None:
        raise NotFoundError("Utilisateur introuvable.", code="USER_NOT_FOUND")
    if user.totp_enabled:
        raise ConflictError(
            "Le 2FA est déjà actif pour cet utilisateur.",
            code="TOTP_ALREADY_ENABLED",
        )

    settings = get_settings()
    secret_b32 = pyotp.random_base32()
    user.totp_secret_encrypted = _encrypt(secret_b32)
    # Pas encore confirmé → totp_enabled reste False jusqu'à confirm_setup
    await session.flush()

    otpauth_url = pyotp.TOTP(secret_b32).provisioning_uri(
        name=str(user.username), issuer_name=settings.totp_issuer
    )
    await audit.record(
        action="USER_TOTP_SETUP_INITIATED",
        target_type="user",
        target_id=str(user.user_id),
    )
    return TotpSetup(
        user_id=user.user_id,
        otpauth_url=otpauth_url,
        secret_b32=secret_b32,
        issuer=settings.totp_issuer,
    )


async def confirm_setup(
    session: AsyncSession,
    *,
    user_id: UUID,
    code: str,
    audit: AuditWriter,
) -> None:
    try:
        import pyotp
    except ImportError as exc:
        raise RuntimeError("pyotp non installé.") from exc

    user = (await session.execute(select(User).where(User.user_id == user_id))).scalar_one_or_none()
    if user is None:
        raise NotFoundError("Utilisateur introuvable.", code="USER_NOT_FOUND")
    if user.totp_secret_encrypted is None:
        raise ConflictError(
            "Aucune procédure 2FA en cours. Lancer setup_for_user d'abord.",
            code="TOTP_SETUP_NOT_STARTED",
        )
    if user.totp_enabled:
        raise ConflictError("Le 2FA est déjà actif.", code="TOTP_ALREADY_ENABLED")

    secret_b32 = _decrypt(user.totp_secret_encrypted)
    totp = pyotp.TOTP(secret_b32)
    if not totp.verify(code, valid_window=1):
        raise AuthenticationError("Code TOTP invalide.", code="TOTP_INVALID")

    user.totp_enabled = True
    user.totp_enrolled_at = datetime.now(tz=UTC)
    user.totp_last_used_at = datetime.now(tz=UTC)
    await session.flush()

    await audit.record(
        action="USER_TOTP_ENABLED",
        target_type="user",
        target_id=str(user.user_id),
    )


async def verify_code(
    session: AsyncSession,
    *,
    user_id: UUID,
    code: str,
) -> bool:
    """Vérifie un code TOTP. Anti-replay : refuse si même fenêtre que `totp_last_used_at`."""
    try:
        import pyotp
    except ImportError as exc:
        raise RuntimeError("pyotp non installé.") from exc

    user = (await session.execute(select(User).where(User.user_id == user_id))).scalar_one_or_none()
    if user is None or not user.totp_enabled or user.totp_secret_encrypted is None:
        return False

    secret_b32 = _decrypt(user.totp_secret_encrypted)
    totp = pyotp.TOTP(secret_b32)
    if not totp.verify(code, valid_window=1):
        return False

    # Anti-replay : on ne ré-accepte pas un code dans la même fenêtre 30s
    now = datetime.now(tz=UTC)
    if user.totp_last_used_at is not None and (now - user.totp_last_used_at).total_seconds() < 30:
        return False
    user.totp_last_used_at = now
    await session.flush()
    return True


async def disable_totp(
    session: AsyncSession,
    *,
    user_id: UUID,
    audit: AuditWriter,
) -> None:
    user = (await session.execute(select(User).where(User.user_id == user_id))).scalar_one_or_none()
    if user is None:
        raise NotFoundError("Utilisateur introuvable.", code="USER_NOT_FOUND")
    user.totp_secret_encrypted = None
    user.totp_enabled = False
    user.totp_enrolled_at = None
    user.totp_last_used_at = None
    await audit.record(
        action="USER_TOTP_DISABLED",
        target_type="user",
        target_id=str(user.user_id),
    )
