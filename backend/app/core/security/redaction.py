"""Redaction des PII pour les payloads d'audit.

Ce module fournit :

- :func:`redact_pii` — masquage récursif et IMMUTABLE de clés sensibles dans
  un payload JSON-like (dict / list / scalaires).
- :class:`RedactedJSONB` — type SQLAlchemy qui applique la redaction
  AVANT écriture en base (``process_bind_param``). Cela garantit que les
  colonnes ``audit_logs.before_data`` / ``after_data`` ne stockent JAMAIS
  de PII en clair, même si le service appelant oublie de filtrer.

Aucune dépendance sur :mod:`app.core.security.crypto` — la redaction est
irréversible (one-way), à l'inverse du chiffrement.
"""

from __future__ import annotations

import re
from typing import Any, Final

from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.types import TypeDecorator

# ---------------------------------------------------------------------------
# Règles par défaut
# ---------------------------------------------------------------------------

#: Clés masquées par ``"***"`` (identifiants nationaux, etc.).
_FULL_MASK_KEYS: Final[frozenset[str]] = frozenset({"national_id", "ssn", "numero_national"})

#: Clés traitées comme des emails (``u***@domaine``).
_EMAIL_KEYS: Final[frozenset[str]] = frozenset({"email", "candidate_email", "contact_email"})

#: Clés traitées comme des numéros de téléphone (4 derniers caractères).
_PHONE_KEYS: Final[frozenset[str]] = frozenset({"phone", "telephone", "mobile"})

#: Clés traitées comme des dates de naissance (``***-***-YYYY``).
_BIRTHDATE_KEYS: Final[frozenset[str]] = frozenset({"birth_date", "date_naissance", "dob"})


#: Configuration consultable par les appelants (lecture seule).
DEFAULT_RULES: Final[dict[str, frozenset[str]]] = {
    "full_mask": _FULL_MASK_KEYS,
    "email": _EMAIL_KEYS,
    "phone": _PHONE_KEYS,
    "birthdate": _BIRTHDATE_KEYS,
}

_ISO_DATE_RE: Final[re.Pattern[str]] = re.compile(r"^(\d{4})-\d{2}-\d{2}$")
_FULL_MASK: Final[str] = "***"


# ---------------------------------------------------------------------------
# Helpers de masquage (un par catégorie)
# ---------------------------------------------------------------------------


def _mask_email(value: Any) -> Any:
    """Masque un email en ``u***@domaine``. Non-strings → passthrough."""
    if not isinstance(value, str) or value == "":
        return value
    if "@" not in value:
        return _FULL_MASK
    local, _, domain = value.partition("@")
    if not local or not domain:
        return _FULL_MASK
    return f"{local[0]}***@{domain}"


def _mask_phone(value: Any) -> Any:
    """Garde les 4 derniers caractères : ``***1234``."""
    if not isinstance(value, str) or value == "":
        return value
    if len(value) < 4:
        return _FULL_MASK
    return f"***{value[-4:]}"


def _mask_birthdate(value: Any) -> Any:
    """Masque la date de naissance en ne gardant que l'année."""
    if not isinstance(value, str) or value == "":
        return value
    match = _ISO_DATE_RE.match(value)
    if not match:
        return _FULL_MASK
    return f"***-***-{match.group(1)}"


def _classify(key: str) -> str | None:
    """Retourne la catégorie de masquage à appliquer pour cette clé (insensible
    à la casse), ou ``None`` si la clé n'est pas sensible."""
    k = key.lower()
    if k in _FULL_MASK_KEYS:
        return "full"
    if k in _EMAIL_KEYS:
        return "email"
    if k in _PHONE_KEYS:
        return "phone"
    if k in _BIRTHDATE_KEYS:
        return "birthdate"
    return None


def _apply_category(category: str, value: Any) -> Any:
    """Applique la stratégie de masquage correspondante."""
    if value is None:
        return None
    if category == "full":
        return _FULL_MASK
    if category == "email":
        return _mask_email(value)
    if category == "phone":
        return _mask_phone(value)
    if category == "birthdate":
        return _mask_birthdate(value)
    return value  # pragma: no cover (defensive)


# ---------------------------------------------------------------------------
# API publique
# ---------------------------------------------------------------------------


def redact_pii(payload: Any) -> Any:
    """Parcourt récursivement ``payload`` et masque les clés sensibles.

    - ``dict`` → nouveau dict avec mêmes clés ; valeurs sensibles masquées,
      autres valeurs traitées récursivement.
    - ``list`` / ``tuple`` → nouvelle séquence du même type.
    - autres types → passthrough.

    L'entrée n'est jamais mutée.
    """
    if isinstance(payload, dict):
        result: dict[Any, Any] = {}
        for key, value in payload.items():
            category = _classify(key) if isinstance(key, str) else None
            if category is not None:
                # Sur clé sensible : la valeur est masquée à plat (pas de
                # descente récursive — on ne veut pas exposer le contenu).
                result[key] = _apply_category(category, value)
            else:
                result[key] = redact_pii(value)
        return result
    if isinstance(payload, list):
        return [redact_pii(item) for item in payload]
    if isinstance(payload, tuple):
        return tuple(redact_pii(item) for item in payload)
    return payload


# ---------------------------------------------------------------------------
# Type SQLAlchemy
# ---------------------------------------------------------------------------


class RedactedJSONB(TypeDecorator[Any]):
    """Colonne JSONB qui applique :func:`redact_pii` avant écriture.

    Idéal pour ``audit_logs.before_data`` / ``after_data`` : même si un
    service appelant oublie de filtrer les PII, la base ne contiendra que
    des valeurs masquées. La lecture (``process_result_value``) est un
    passthrough — il n'y a rien à déchiffrer puisque la redaction est
    irréversible.
    """

    impl = JSONB
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        # ``dialect`` est requis par la signature SQLAlchemy mais inutile ici.
        del dialect
        if value is None:
            return None
        return redact_pii(value)

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        del dialect
        return value


__all__ = [
    "DEFAULT_RULES",
    "RedactedJSONB",
    "redact_pii",
]
