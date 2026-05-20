"""Configuration logging structuré (structlog) avec corrélation par requête.

Inclut un processeur **strip-PII** qui supprime ou masque les champs
sensibles (mots de passe, secrets, tokens, identifiants nationaux, données
de santé d'ayants droit) avant émission. Cf. fiche
``MODERNISATION_01_SOCLE_TECHNIQUE.md`` proposition P9 et fiche
``MODERNISATION_13_CONDUITE_CHANGEMENT_CONFORMITE.md`` pour la conformité
loi 037/AN/2016.
"""

from __future__ import annotations

import logging
import re
import sys
from typing import Any

import structlog

from app.core.config import Environment, Settings


# ---------------------------------------------------------------------------
# Strip PII — clés de champs et patterns à expurger.
# ---------------------------------------------------------------------------
PII_KEYS_TO_REDACT: frozenset[str] = frozenset(
    {
        "password",
        "old_password",
        "new_password",
        "password_hash",
        "current_password",
        "secret",
        "totp_secret",
        "client_secret",
        "api_key",
        "apikey",
        "authorization",
        "auth",
        "token",
        "access_token",
        "refresh_token",
        "jwt",
        "bearer",
        "cookie",
        "set-cookie",
        "session",
        "national_id_number",
        "identity_number",
        "birth_date",
        "birthdate",
        "dependent_birthdate",
        "dependent_health_status",
        "salary",
        "salary_amount",
        "iban",
        "bic",
        "card_number",
        "cvv",
        "ssn",
        "anthropic_api_key",
        "openai_api_key",
        "smtp_password",
        "minio_secret_key",
    }
)

# Patterns de chaînes typiques à masquer dans les valeurs textuelles longues.
PII_VALUE_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    # JWT (3 segments base64url séparés par .)
    (re.compile(r"\beyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}\b"), "[REDACTED_JWT]"),
    # Bearer tokens dans Authorization header
    (re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._\-]{16,}"), "Bearer [REDACTED]"),
)

REDACTED_PLACEHOLDER = "[REDACTED]"


def _redact_value(value: Any) -> Any:
    """Applique les patterns de redaction sur une valeur."""
    if isinstance(value, str):
        out = value
        for pattern, replacement in PII_VALUE_PATTERNS:
            out = pattern.sub(replacement, out)
        return out
    return value


def _strip_pii(_logger: Any, _name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
    """Processeur structlog : remplace les valeurs sensibles par un placeholder.

    Récursif : descend dans dict / list pour expurger les clés sensibles
    (case-insensitive). Préserve la structure pour ne pas casser
    l'ingestion downstream (ELK/Loki).
    """

    def _walk(obj: Any) -> Any:
        if isinstance(obj, dict):
            redacted = {}
            for key, val in obj.items():
                if isinstance(key, str) and key.lower() in PII_KEYS_TO_REDACT:
                    redacted[key] = REDACTED_PLACEHOLDER
                else:
                    redacted[key] = _walk(val)
            return redacted
        if isinstance(obj, list):
            return [_walk(item) for item in obj]
        if isinstance(obj, tuple):
            return tuple(_walk(item) for item in obj)
        return _redact_value(obj)

    walked = _walk(event_dict)
    # `event_dict` doit rester un dict ; _walk le préserve.
    assert isinstance(walked, dict)
    return walked


def configure_logging(settings: Settings) -> None:
    """Configure structlog + stdlib logging selon l'environnement.

    En dev : sortie console lisible (couleurs).
    En prod/staging : sortie JSON (ingestible par ELK/Loki/Datadog).
    Le processeur `_strip_pii` est appliqué dans **tous** les environnements
    pour éviter qu'un développeur ne logue accidentellement un secret.
    """

    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)

    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # ⚠️ doit être placé *après* les enrichissements et *avant* le renderer.
        _strip_pii,
    ]

    if settings.env in (Environment.PROD, Environment.STAGING):
        renderer: Any = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[*shared_processors, renderer],
        wrapper_class=structlog.make_filtering_bound_logger(getattr(logging, settings.log_level)),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.log_level),
    )

    # Réduction du bruit Uvicorn / SQLAlchemy
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.db_echo else logging.WARNING
    )


def get_logger(name: str | None = None) -> Any:
    """Récupère un logger structuré nommé.

    Retourne `Any` pour ne pas dépendre du type interne de structlog (qui
    diffère légèrement entre versions).
    """
    return structlog.get_logger(name) if name else structlog.get_logger()
