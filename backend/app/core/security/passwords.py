"""Hachage et vérification de mots de passe (bcrypt via passlib)."""

from __future__ import annotations

from passlib.context import CryptContext

from app.core.config import get_settings


def _build_context() -> CryptContext:
    settings = get_settings()
    return CryptContext(
        schemes=["bcrypt"],
        deprecated="auto",
        bcrypt__rounds=settings.bcrypt_rounds,
    )


_pwd_context: CryptContext = _build_context()


def hash_password(plain: str) -> str:
    """Retourne un hash bcrypt salé du mot de passe."""
    if not plain:
        raise ValueError("Le mot de passe ne peut pas être vide.")
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    """Compare un mot de passe en clair à son hash. False si invalide."""
    if not plain or not hashed:
        return False
    try:
        return _pwd_context.verify(plain, hashed)
    except (ValueError, TypeError):
        return False


def needs_rehash(hashed: str) -> bool:
    """True si le hash utilise un schéma déprécié (à re-hasher au login)."""
    try:
        return _pwd_context.needs_update(hashed)
    except ValueError:
        return True
