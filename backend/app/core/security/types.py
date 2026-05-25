"""Types SQLAlchemy chiffrés pour les colonnes PII.

Ce module fournit deux ``TypeDecorator`` qui chiffrent/déchiffrent
automatiquement les colonnes sensibles à la frontière ORM/DB :

* :class:`EncryptedString` — pour les chaînes (emails, numéros nationaux,
  téléphones, …).
* :class:`EncryptedDate` — pour les dates (date de naissance, …), sérialisées
  en ISO-8601 avant chiffrement.

Format de stockage en base : **TEXT** ``"kv1:<token-fernet>"`` (cf.
:mod:`app.core.security.crypto`). Stocker en TEXT plutôt qu'en LargeBinary
permet :

* l'idempotence du script de re-chiffrement (clause ``LIKE 'kv1:%'``) ;
* un dump SQL lisible / diffable ;
* aucune conversion bytes↔str dans le code applicatif.

Le déchiffrement à la lecture tolère les valeurs **legacy en clair** pendant
la phase de transition (Sub-B). Un warning structuré ``pii_legacy_plaintext_read``
est émis **une seule fois par process** pour signaler la situation sans
spammer les logs ligne par ligne. Aucune valeur (clair ou chiffrée) n'est
jamais loguée.
"""

from __future__ import annotations

from datetime import date
from typing import Any

import structlog
from sqlalchemy.types import Text, TypeDecorator

from app.core.security import crypto
from app.core.security.crypto import InvalidCiphertextError

logger = structlog.get_logger(__name__)

# Drapeau de session : une fois posé, on ne reloggue plus de warning legacy.
# Volontaire : éviter le spam log si une table contient des milliers de
# lignes en clair pendant la migration.
_legacy_warning_emitted: bool = False


def _warn_legacy_plaintext_once() -> None:
    """Émet le warning ``pii_legacy_plaintext_read`` au plus une fois.

    Pas de plaintext / ciphertext / nom de colonne dans le log : le contexte
    de colonne n'est pas accessible depuis un ``TypeDecorator`` sans hack
    fragile. On signale simplement qu'AU MOINS une valeur PII a été lue en
    clair, ce qui suffit à déclencher l'investigation côté ops.
    """
    global _legacy_warning_emitted
    if _legacy_warning_emitted:
        return
    _legacy_warning_emitted = True
    logger.warning(
        "pii_legacy_plaintext_read",
        detail=(
            "Une colonne chiffrée a été lue avec une valeur en clair "
            "(legacy). Lancer le script de chiffrement de migration."
        ),
    )


def _reset_legacy_warning_flag() -> None:
    """Réinitialise le drapeau — usage tests uniquement."""
    global _legacy_warning_emitted
    _legacy_warning_emitted = False


class EncryptedString(TypeDecorator[str]):
    """Colonne chaîne chiffrée transparente.

    * Écriture : chiffre via :func:`crypto.encrypt`. Idempotent : si la valeur
      est déjà ``"kvN:..."``, elle est écrite telle quelle (utile pour les
      scripts de re-chiffrement).
    * Lecture : déchiffre via :func:`crypto.decrypt`. Tolère les valeurs
      en clair (phase de transition) en émettant un warning unique.
    * ``None`` et ``""`` sont préservés (sémantique : valeur absente vs
      valeur vide explicite — utile pour distinguer "non renseigné" et
      "renseigné vide").
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: str | None, dialect: Any) -> str | None:
        del dialect
        if value is None:
            return None
        if value == "":
            return ""
        # Idempotence : si déjà chiffré, passthrough — pas de double couche.
        if crypto.is_encrypted(value):
            return value
        return crypto.encrypt(value)

    def process_result_value(self, value: str | None, dialect: Any) -> str | None:
        del dialect
        if value is None:
            return None
        if value == "":
            return ""
        if crypto.is_encrypted(value):
            return crypto.decrypt(value)
        # Cas legacy : valeur en clair stockée avant migration. On la rend
        # telle quelle pour ne pas casser la lecture, mais on alerte.
        _warn_legacy_plaintext_once()
        return value


class EncryptedDate(TypeDecorator[date]):
    """Colonne ``date`` chiffrée transparente (sérialisée en ISO-8601).

    * Écriture : ``value.isoformat()`` puis :func:`crypto.encrypt`.
    * Lecture : :func:`crypto.decrypt` puis :func:`date.fromisoformat`.
    * Impl = TEXT (et non DATE) : la valeur en DB est un ciphertext opaque,
      donc on stocke du texte. Les opérateurs ``<`` / ``BETWEEN`` SQL ne
      fonctionnent évidemment pas en clair — les requêtes par tranche
      d'âge doivent passer par la colonne ``birth_year`` dédiée (cf.
      sub-ticket B C3).
    """

    impl = Text
    cache_ok = True

    def process_bind_param(self, value: date | None, dialect: Any) -> str | None:
        del dialect
        if value is None:
            return None
        return crypto.encrypt(value.isoformat())

    def process_result_value(self, value: str | None, dialect: Any) -> date | None:
        del dialect
        if value is None:
            return None
        if not crypto.is_encrypted(value):
            # Pas de cas legacy "DATE Postgres" : la colonne TEXT renverra
            # toujours une string. Si la string n'est pas un ciphertext,
            # on tente quand même de la parser comme ISO date (phase de
            # transition tolérante).
            try:
                parsed = date.fromisoformat(value)
            except ValueError as err:
                raise InvalidCiphertextError(
                    "Valeur de colonne EncryptedDate non reconnue "
                    "(ni ciphertext kvN: ni date ISO-8601)."
                ) from err
            _warn_legacy_plaintext_once()
            return parsed
        decrypted = crypto.decrypt(value)
        if decrypted is None or decrypted == "":
            # Garde-fou : encrypt(None)→None, encrypt("")→""; on a déjà filtré
            # plus haut. Mais on protège contre un ciphertext qui contiendrait
            # une chaîne vide (cas exotique d'un ancien bug).
            raise InvalidCiphertextError(
                "EncryptedDate : plaintext déchiffré vide, impossible à parser."
            )
        try:
            return date.fromisoformat(decrypted)
        except ValueError as err:
            # On NE met PAS le plaintext dans le message d'erreur (PII).
            raise InvalidCiphertextError(
                "EncryptedDate : plaintext déchiffré non conforme à ISO-8601."
            ) from err


__all__ = [
    "EncryptedDate",
    "EncryptedString",
]
