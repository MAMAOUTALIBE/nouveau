"""Tests unitaires : validation des settings PII (PII_ENCRYPTION_KEYS,
EMAIL_LOOKUP_HMAC_KEY, helper is_pii_crypto_configured)."""

from __future__ import annotations

import secrets

import pytest
from app.core.config import Environment, Settings
from cryptography.fernet import Fernet


def _valid_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _valid_hmac_key() -> str:
    return secrets.token_hex(32)


# ---------------------------------------------------------------------------
# Validation au boot
# ---------------------------------------------------------------------------


def test_pii_keys_invalid_format_in_prod_raises_clear_error() -> None:
    """En PROD, une PII_ENCRYPTION_KEYS au format `kv1:bad-base64` (préfixe
    OK mais contenu non base64-Fernet) doit être rejetée avec message lisible."""
    with pytest.raises(ValueError, match="PII_ENCRYPTION_KEYS") as exc_info:
        Settings(  # type: ignore[call-arg]
            env=Environment.PROD,
            jwt_secret_key="z" * 64,  # >= 32 et ne contient ni 'dev-only' ni 'change'
            database_url="postgresql+asyncpg://u:p@h/db",
            bcrypt_rounds=12,
            pii_encryption_keys="kv1:bad-base64",  # type: ignore[arg-type]
            email_lookup_hmac_key=_valid_hmac_key(),  # type: ignore[arg-type]
        )
    msg = str(exc_info.value)
    # Message lisible mentionnant le champ (vérifié aussi via match plus haut).
    assert "PII_ENCRYPTION_KEYS" in msg


def test_pii_keys_missing_in_prod_raises() -> None:
    """En PROD, PII_ENCRYPTION_KEYS vide doit être refusé au boot."""
    with pytest.raises(ValueError, match="staging/prod"):
        Settings(  # type: ignore[call-arg]
            env=Environment.PROD,
            jwt_secret_key="z" * 64,
            database_url="postgresql+asyncpg://u:p@h/db",
            bcrypt_rounds=12,
            pii_encryption_keys="",  # type: ignore[arg-type]
            email_lookup_hmac_key=_valid_hmac_key(),  # type: ignore[arg-type]
        )


def test_pii_keys_missing_in_staging_raises() -> None:
    """Idem en STAGING : pas de tolérance vis-à-vis de l'absence de clés."""
    with pytest.raises(ValueError, match="staging/prod"):
        Settings(  # type: ignore[call-arg]
            env=Environment.STAGING,
            jwt_secret_key="z" * 64,
            database_url="postgresql+asyncpg://u:p@h/db",
            pii_encryption_keys="",  # type: ignore[arg-type]
            email_lookup_hmac_key="",  # type: ignore[arg-type]
        )


def test_pii_keys_empty_in_dev_is_tolerated() -> None:
    """En DEV : tolérance des clés vides (workflow local)."""
    s = Settings(  # type: ignore[call-arg]
        env=Environment.DEV,
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        pii_encryption_keys="",  # type: ignore[arg-type]
        email_lookup_hmac_key="",  # type: ignore[arg-type]
    )
    assert s.pii_encryption_keys.get_secret_value() == ""


# ---------------------------------------------------------------------------
# Helper is_pii_crypto_configured()
# ---------------------------------------------------------------------------


def test_is_pii_crypto_configured_true_when_both_set() -> None:
    s = Settings(  # type: ignore[call-arg]
        env=Environment.DEV,
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        pii_encryption_keys=_valid_fernet_key(),  # type: ignore[arg-type]
        email_lookup_hmac_key=_valid_hmac_key(),  # type: ignore[arg-type]
    )
    assert s.is_pii_crypto_configured() is True


def test_is_pii_crypto_configured_false_when_pii_keys_empty() -> None:
    s = Settings(  # type: ignore[call-arg]
        env=Environment.DEV,
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        pii_encryption_keys="",  # type: ignore[arg-type]
        email_lookup_hmac_key=_valid_hmac_key(),  # type: ignore[arg-type]
    )
    assert s.is_pii_crypto_configured() is False


def test_is_pii_crypto_configured_false_when_hmac_empty() -> None:
    s = Settings(  # type: ignore[call-arg]
        env=Environment.DEV,
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        pii_encryption_keys=_valid_fernet_key(),  # type: ignore[arg-type]
        email_lookup_hmac_key="",  # type: ignore[arg-type]
    )
    assert s.is_pii_crypto_configured() is False


def test_is_pii_crypto_configured_false_when_both_empty() -> None:
    s = Settings(  # type: ignore[call-arg]
        env=Environment.DEV,
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        pii_encryption_keys="",  # type: ignore[arg-type]
        email_lookup_hmac_key="",  # type: ignore[arg-type]
    )
    assert s.is_pii_crypto_configured() is False


def test_hmac_key_short_rejected() -> None:
    """En staging/prod ou même en DEV avec clé non vide : longueur min 64 hex."""
    with pytest.raises(ValueError, match="64 caract"):
        Settings(  # type: ignore[call-arg]
            env=Environment.DEV,
            jwt_secret_key="x" * 32,
            database_url="postgresql+asyncpg://u:p@h/db",
            pii_encryption_keys=_valid_fernet_key(),  # type: ignore[arg-type]
            email_lookup_hmac_key="aa" * 16,  # 32 hex chars = trop court  # type: ignore[arg-type]
        )


def test_hmac_key_non_hex_rejected() -> None:
    with pytest.raises(ValueError, match="hex"):
        Settings(  # type: ignore[call-arg]
            env=Environment.DEV,
            jwt_secret_key="x" * 32,
            database_url="postgresql+asyncpg://u:p@h/db",
            pii_encryption_keys=_valid_fernet_key(),  # type: ignore[arg-type]
            email_lookup_hmac_key="Z" * 64,  # type: ignore[arg-type]
        )
