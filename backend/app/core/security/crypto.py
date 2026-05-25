"""Chiffrement applicatif des PII et lookup HMAC.

Ce module fournit les primitives cryptographiques utilisées pour protéger
les données personnelles identifiables (PII) stockées en base. Il s'appuie
sur :

- `cryptography.fernet.MultiFernet` pour le chiffrement authentifié (AES-128
  CBC + HMAC-SHA256) avec support natif de la rotation de clés ;
- `hmac` + SHA-256 pour la dérivation déterministe utilisée par les index de
  lookup (ex. recherche par email sans révéler la valeur en clair).

Format des clés (variable d'env `PII_ENCRYPTION_KEYS`) :
    ``kv1:<base64-urlsafe-44>,kv2:<base64-urlsafe-44>,...``

La PREMIÈRE clé du CSV est utilisée pour CHIFFRER ; toutes les clés
(y compris les anciennes) peuvent DÉCHIFFRER, ce qui permet une rotation
sans downtime.

Format des ciphertexts produits :
    ``"kv1:<token-fernet>"`` — le préfixe ``kvN:`` indique la version de la
    clé d'écriture utilisée. Au déchiffrement on retrouve la bonne clé via
    ``MultiFernet`` (qui essaie toutes les clés du plus récent au plus
    ancien). Le préfixe sert également de marqueur pour
    :func:`is_encrypted`.

Sécurité :
- Les valeurs PII ne sont JAMAIS loguées. Seules les erreurs structurelles
  (clé manquante, format invalide) sont rapportées.
- Les exceptions levées par ce module ne contiennent jamais de fragment de
  ciphertext ou de plaintext.
"""

from __future__ import annotations

import hmac
import re
from dataclasses import dataclass
from functools import lru_cache
from hashlib import sha256
from typing import Final

import structlog
from cryptography.fernet import Fernet, InvalidToken, MultiFernet

from app.core.config import get_settings

logger = structlog.get_logger(__name__)

# Format attendu pour un préfixe de version : ``kv\d+:``
_KEY_PREFIX_RE: Final[re.Pattern[str]] = re.compile(r"^kv\d+:")


class CryptoError(Exception):
    """Erreur générique du module crypto."""


class InvalidCiphertextError(CryptoError):
    """Le ciphertext est mal formé ou son MAC est invalide."""


class KeyMissingError(CryptoError):
    """Les clés de chiffrement ne sont pas configurées."""


@dataclass(frozen=True)
class _CryptoBundle:
    """Bundle interne — clés parsées et primitives prêtes à l'emploi."""

    write_version: str  # ex. "kv1"
    multi_fernet: MultiFernet
    known_versions: frozenset[str]  # {"kv1", "kv2", ...}
    hmac_key: bytes


def _parse_pii_keys(raw: str) -> tuple[str, MultiFernet, frozenset[str]]:
    """Parse le CSV ``kvN:<key>`` et construit le MultiFernet.

    Returns:
        tuple ``(write_version, multi_fernet, known_versions)``.

    Raises:
        KeyMissingError: si la chaîne est vide.
        CryptoError: si une entrée est mal formée ou si une clé Fernet est
            rejetée par la bibliothèque.
    """
    if not raw or not raw.strip():
        raise KeyMissingError("PII_ENCRYPTION_KEYS n'est pas configuré.")

    fernets: list[Fernet] = []
    versions: list[str] = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        if ":" not in entry:
            raise CryptoError("PII_ENCRYPTION_KEYS : entrée invalide (préfixe `kvN:` manquant).")
        version, _, b64key = entry.partition(":")
        if not _KEY_PREFIX_RE.match(f"{version}:"):
            raise CryptoError(f"PII_ENCRYPTION_KEYS : version `{version}` non conforme à `kv\\d+`.")
        if version in versions:
            raise CryptoError(f"PII_ENCRYPTION_KEYS : version `{version}` dupliquée.")
        try:
            fernets.append(Fernet(b64key.encode("ascii")))
        except (ValueError, TypeError) as err:
            # On n'inclut PAS la clé dans le message d'erreur.
            raise CryptoError(
                f"PII_ENCRYPTION_KEYS : clé Fernet invalide pour `{version}`."
            ) from err
        versions.append(version)

    if not fernets:
        raise KeyMissingError("PII_ENCRYPTION_KEYS : aucune clé exploitable.")

    return versions[0], MultiFernet(fernets), frozenset(versions)


def _parse_hmac_key(raw: str) -> bytes:
    """Parse la clé HMAC hex (≥ 32 bytes).

    Returns:
        Les bytes bruts de la clé.

    Raises:
        KeyMissingError: si la chaîne est vide.
        CryptoError: si le format hex est invalide ou la clé trop courte.
    """
    if not raw:
        raise KeyMissingError("EMAIL_LOOKUP_HMAC_KEY n'est pas configuré.")
    try:
        key = bytes.fromhex(raw)
    except ValueError as err:
        raise CryptoError("EMAIL_LOOKUP_HMAC_KEY : format hexadécimal invalide.") from err
    if len(key) < 32:
        raise CryptoError("EMAIL_LOOKUP_HMAC_KEY : longueur insuffisante (≥ 32 bytes requis).")
    return key


@lru_cache(maxsize=1)
def _get_bundle() -> _CryptoBundle:
    """Construit (ou récupère depuis le cache) le bundle crypto courant."""
    settings = get_settings()
    raw_keys = settings.pii_encryption_keys.get_secret_value()
    raw_hmac = settings.email_lookup_hmac_key.get_secret_value()

    write_version, multi, versions = _parse_pii_keys(raw_keys)
    hmac_key = _parse_hmac_key(raw_hmac)

    logger.info(
        "pii_crypto_bundle_initialized",
        key_count=len(versions),
        write_version=write_version,
    )
    return _CryptoBundle(
        write_version=write_version,
        multi_fernet=multi,
        known_versions=versions,
        hmac_key=hmac_key,
    )


def reset_cache() -> None:
    """Vide le cache interne — à utiliser dans les tests après changement d'env."""
    _get_bundle.cache_clear()


def encrypt(plaintext: str | None) -> str | None:
    """Chiffre une valeur en clair via la clé d'écriture courante.

    - ``None`` → ``None`` (transparent)
    - ``""``   → ``""`` (transparent — pas de token pour une chaîne vide)
    - sinon, renvoie ``"kv1:<token-fernet>"``.

    Raises:
        KeyMissingError: si aucune clé n'est configurée.
    """
    if plaintext is None:
        return None
    if plaintext == "":
        return ""
    bundle = _get_bundle()
    token = bundle.multi_fernet.encrypt(plaintext.encode("utf-8")).decode("ascii")
    return f"{bundle.write_version}:{token}"


def decrypt(ciphertext: str | None) -> str | None:
    """Déchiffre un ciphertext ``kvN:<token>`` via le MultiFernet.

    - ``None`` → ``None``
    - ``""``   → ``""``

    Raises:
        InvalidCiphertextError: si le format ou le MAC est invalide.
        KeyMissingError: si aucune clé n'est configurée.
    """
    if ciphertext is None:
        return None
    if ciphertext == "":
        return ""
    bundle = _get_bundle()
    if not _KEY_PREFIX_RE.match(ciphertext):
        raise InvalidCiphertextError("Ciphertext sans préfixe `kvN:`.")
    version, _, token = ciphertext.partition(":")
    if version not in bundle.known_versions:
        raise InvalidCiphertextError(f"Ciphertext chiffré avec une version inconnue (`{version}`).")
    try:
        return bundle.multi_fernet.decrypt(token.encode("ascii")).decode("utf-8")
    except InvalidToken as err:
        # Pas de fuite du token dans le message.
        raise InvalidCiphertextError("MAC invalide ou ciphertext corrompu.") from err


def is_encrypted(value: str | None) -> bool:
    """True si ``value`` ressemble à un ciphertext produit par ce module.

    Note : la vérification s'appuie uniquement sur le préfixe ``kvN:`` ; elle
    ne valide PAS le MAC. Utile pour détecter une valeur déjà chiffrée avant
    re-chiffrement (idempotence).
    """
    if value is None or not isinstance(value, str):
        return False
    match = _KEY_PREFIX_RE.match(value)
    if not match:
        return False
    try:
        bundle = _get_bundle()
    except CryptoError:
        # Pas de bundle → on s'appuie quand même sur le motif structurel.
        return True
    version = match.group(0).rstrip(":")
    return version in bundle.known_versions


def hmac_lookup(value: str | None, *, normalize: bool = True) -> str | None:
    """Calcule un HMAC-SHA256 déterministe (hex) pour indexer une PII.

    Args:
        value: valeur à hasher. ``None`` ou chaîne vide → ``None``.
        normalize: si True (par défaut), applique ``strip().lower()`` avant
            hashage (utile pour des emails / identifiants insensibles à la
            casse). Désactiver pour des valeurs où la casse compte.

    Raises:
        KeyMissingError: si la clé HMAC n'est pas configurée.
    """
    if value is None:
        return None
    candidate = value.strip().lower() if normalize else value
    if candidate == "":
        return None
    bundle = _get_bundle()
    mac = hmac.new(bundle.hmac_key, candidate.encode("utf-8"), sha256)
    return mac.hexdigest()


__all__ = [
    "CryptoError",
    "InvalidCiphertextError",
    "KeyMissingError",
    "decrypt",
    "encrypt",
    "hmac_lookup",
    "is_encrypted",
    "reset_cache",
]
