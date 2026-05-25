"""Chiffre les valeurs PII existantes de ``hr.employees`` au repos.

Idempotent : peut etre lance plusieurs fois sans effet de bord (les valeurs
deja prefixees ``kvN:`` sont skippees via :func:`crypto.is_encrypted`).

Pre-requis :

- Migration 0011 appliquee (colonnes hash + types TEXT).
- ``PII_ENCRYPTION_KEYS`` et ``EMAIL_LOOKUP_HMAC_KEY`` definis en env.

Usage::

    python -m app.scripts.encrypt_existing_pii [--dry-run] [--batch-size 500] [--verbose]

Comportement :

- Lit chaque ligne via SQL brut (``text(...)``) pour **bypass** les
  ``TypeDecorator`` ``EncryptedString`` / ``EncryptedDate``. Sans ce bypass,
  les valeurs legacy en clair seraient lues ``telles quelles`` (warning
  ``pii_legacy_plaintext_read``) mais les valeurs deja chiffrees seraient
  dechiffrees a la lecture et re-chiffrees a l'ecriture, ce qui (a) double
  inutilement le travail et (b) risque de masquer un ciphertext corrompu.
- Detecte le statut de chaque champ via :func:`crypto.is_encrypted` :
  ciphertext deja en place => skip ; clair => chiffrement + hash.
- Batchs transactionnels (``COMMIT`` toutes les N lignes). En cas d'erreur
  sur un batch (ciphertext mal forme, valeur incoherente), rollback du
  batch + log structure + on continue avec le batch suivant.
- ``--dry-run`` : aucun ``UPDATE`` n'est emis, on compte uniquement.

Securite :

- Aucune valeur PII (clair ou ciphertext) n'est loguee.
- Les erreurs sont loguees sous forme structuree (compteur + categorie),
  jamais avec la valeur fautive.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
import time
from collections.abc import Sequence
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_session_factory
from app.core.security.crypto import encrypt, hmac_lookup, is_encrypted

logger = structlog.get_logger(__name__)


# ----------------------------------------------------------------------
# Stats & types internes
# ----------------------------------------------------------------------


@dataclass
class Stats:
    """Compteurs agreges remontes en sortie de script."""

    scanned: int = 0
    encrypted: int = 0  # nombre de lignes dont AU MOINS un champ a ete chiffre
    already_encrypted: int = 0  # nombre de lignes toutes deja chiffrees
    errors: int = 0  # nombre de batches en erreur (rollback)
    batches: int = 0  # nombre de batches effectivement traites


@dataclass
class _RowUpdate:
    """Patch a appliquer a une ligne (champs None = ne pas toucher)."""

    employee_id: UUID
    email: str | None = None
    national_id: str | None = None
    phone: str | None = None
    birth_date: str | None = None
    email_lookup_hash: str | None = None
    national_id_lookup_hash: str | None = None
    fields_changed: list[str] = field(default_factory=list)

    @property
    def has_changes(self) -> bool:
        return bool(self.fields_changed)


# ----------------------------------------------------------------------
# Logique de transformation (pure, testable sans DB)
# ----------------------------------------------------------------------


def _plan_row_update(row: Any) -> _RowUpdate:
    """Calcule le patch a appliquer pour une ligne brute (SQL row).

    Pure : pas d'I/O, juste crypto + hash. Renvoie un ``_RowUpdate`` dont
    ``has_changes`` est ``False`` si la ligne est deja entierement chiffree
    ou si tous les champs sont vides.

    Args:
        row: une ligne fetchee via SQL brut. Doit exposer ``employee_id``,
            ``email``, ``national_id``, ``phone``, ``birth_date``,
            ``email_lookup_hash``, ``national_id_lookup_hash`` (acces
            attributaire ou indexable).
    """
    # Acces attributaire pour robustesse (Row, NamedTuple, dataclass-mock).
    employee_id = row.employee_id
    update = _RowUpdate(employee_id=employee_id)

    # --- email : ciphertext + hash lookup (normalize=True) ---
    email_raw = row.email
    if isinstance(email_raw, str) and email_raw != "" and not is_encrypted(email_raw):
        update.email = encrypt(email_raw)
        update.fields_changed.append("email")
        # On (re)calcule le hash uniquement si la valeur etait en clair :
        # on n'a aucun moyen de remonter au plaintext d'un ciphertext deja
        # en place sans le dechiffrer (et on ne veut pas ouvrir cette boite
        # ici — c'est le job du service applicatif).
        new_hash = hmac_lookup(email_raw, normalize=True)
        if new_hash is not None and row.email_lookup_hash != new_hash:
            update.email_lookup_hash = new_hash
            update.fields_changed.append("email_lookup_hash")

    # --- national_id : ciphertext + hash lookup (normalize=False) ---
    nid_raw = row.national_id
    if isinstance(nid_raw, str) and nid_raw != "" and not is_encrypted(nid_raw):
        update.national_id = encrypt(nid_raw)
        update.fields_changed.append("national_id")
        new_hash = hmac_lookup(nid_raw, normalize=False)
        if new_hash is not None and row.national_id_lookup_hash != new_hash:
            update.national_id_lookup_hash = new_hash
            update.fields_changed.append("national_id_lookup_hash")

    # --- phone : ciphertext seul (pas de hash de lookup) ---
    phone_raw = row.phone
    if isinstance(phone_raw, str) and phone_raw != "" and not is_encrypted(phone_raw):
        update.phone = encrypt(phone_raw)
        update.fields_changed.append("phone")

    # --- birth_date : la colonne est TEXT post-migration 0011. Les valeurs
    # legacy sont des strings ISO ``YYYY-MM-DD`` (cast natif date->text
    # produit par Postgres lors du ALTER COLUMN). On les chiffre tel quel.
    bd_raw = row.birth_date
    if isinstance(bd_raw, str) and bd_raw != "" and not is_encrypted(bd_raw):
        update.birth_date = encrypt(bd_raw)
        update.fields_changed.append("birth_date")

    return update


# ----------------------------------------------------------------------
# Acces DB (SQL brut, bypass ORM)
# ----------------------------------------------------------------------


def _fetch_batch_sql(schema: str) -> Any:
    """Requete de pagination keyset (employee_id strictement croissant)."""
    # S608 (SQL injection) : `schema` provient de Settings (env validee), pas
    # d'une entree utilisateur. Le seul moyen de l'influencer est de modifier
    # SCHEMA_NAME en env de deploiement (controle ops).
    sql = (
        "SELECT employee_id, email, national_id, phone, birth_date, "  # noqa: S608
        "email_lookup_hash, national_id_lookup_hash "
        f"FROM {schema}.employees "
        "WHERE employee_id > :cursor "
        "ORDER BY employee_id ASC "
        "LIMIT :batch_size"
    )
    return text(sql)


def _build_update_sql(schema: str, update: _RowUpdate) -> tuple[Any, dict[str, Any]]:
    """Construit dynamiquement la requete UPDATE pour les champs modifies.

    On evite ``UPDATE ... SET col = COALESCE(:col, col)`` parce qu'il
    serait impossible de distinguer ``None`` (ne pas toucher) d'un
    plaintext qu'on voudrait remettre a NULL (cas hors-perimetre ici).
    """
    set_clauses: list[str] = []
    params: dict[str, Any] = {"employee_id": update.employee_id}

    for col in update.fields_changed:
        # Les noms de colonnes proviennent d'une liste hardcoded (pas
        # d'injection possible).
        set_clauses.append(f"{col} = :{col}")
        params[col] = getattr(update, col)

    # S608 (SQL injection) : `schema` vient de Settings, `set_clauses` est
    # construit a partir d'une liste fermee de noms de colonnes (cf.
    # _plan_row_update). Aucune entree utilisateur ici.
    sql = (
        f"UPDATE {schema}.employees SET {', '.join(set_clauses)} "  # noqa: S608
        "WHERE employee_id = :employee_id"
    )
    return text(sql), params


# ----------------------------------------------------------------------
# Boucle principale
# ----------------------------------------------------------------------


async def _process_batch(
    session: AsyncSession,
    schema: str,
    rows: Sequence[Any],
    *,
    dry_run: bool,
    stats: Stats,
    verbose: bool,
) -> None:
    """Traite un batch (deja fetche) : applique les UPDATE necessaires.

    En cas d'erreur SQL sur un UPDATE, on rollback **tout le batch** et
    on incremente ``stats.errors`` (la boucle appelante passe au batch
    suivant). C'est volontaire : on prefere un retry idempotent qu'un
    etat partiellement applique.
    """
    batch_encrypted = 0
    batch_already = 0
    try:
        for row in rows:
            stats.scanned += 1
            update = _plan_row_update(row)
            if not update.has_changes:
                batch_already += 1
                continue
            if dry_run:
                batch_encrypted += 1
                continue
            stmt, params = _build_update_sql(schema, update)
            await session.execute(stmt, params)
            batch_encrypted += 1
        if not dry_run:
            await session.commit()
    except Exception:
        # Pas de PII dans le log : juste la categorie d'erreur.
        if not dry_run:
            await session.rollback()
        stats.errors += 1
        logger.exception(
            "pii_migration_batch_failed",
            batch_size=len(rows),
            scanned_so_far=stats.scanned,
        )
        return

    stats.encrypted += batch_encrypted
    stats.already_encrypted += batch_already
    stats.batches += 1
    if verbose:
        logger.info(
            "pii_migration_batch_processed",
            batch_size=len(rows),
            encrypted_in_batch=batch_encrypted,
            already_encrypted_in_batch=batch_already,
            dry_run=dry_run,
        )


async def encrypt_existing(
    *,
    dry_run: bool,
    batch_size: int,
    verbose: bool,
    session: AsyncSession | None = None,
) -> Stats:
    """Point d'entree principal.

    Args:
        dry_run: si True, n'ecrit rien (que des SELECT).
        batch_size: nombre de lignes par batch transactionnel.
        verbose: si True, log un evenement par batch.
        session: session injectable (tests). Si None, en ouvre une nouvelle
            via :func:`get_session_factory`.

    Returns:
        Les ``Stats`` agreges du run.
    """
    settings = get_settings()
    schema = settings.schema_name
    stats = Stats()
    started = time.monotonic()

    logger.info(
        "pii_migration_started",
        dry_run=dry_run,
        batch_size=batch_size,
        schema=schema,
    )

    fetch_stmt = _fetch_batch_sql(schema)

    async def _run(active_session: AsyncSession) -> None:
        # Curseur de pagination keyset. UUID min : 00000000-... < tout UUID.
        cursor = UUID("00000000-0000-0000-0000-000000000000")
        while True:
            result = await active_session.execute(
                fetch_stmt,
                {"cursor": cursor, "batch_size": batch_size},
            )
            rows = result.fetchall()
            if not rows:
                break
            await _process_batch(
                active_session,
                schema,
                rows,
                dry_run=dry_run,
                stats=stats,
                verbose=verbose,
            )
            # Curseur = dernier employee_id de la page (rows[-1] meme apres
            # un rollback : on n'a PAS modifie la valeur SELECTionnee).
            cursor = rows[-1].employee_id

    if session is not None:
        await _run(session)
    else:
        factory = get_session_factory()
        async with factory() as owned:
            await _run(owned)

    duration = time.monotonic() - started
    logger.info(
        "pii_migration_completed",
        dry_run=dry_run,
        scanned=stats.scanned,
        encrypted=stats.encrypted,
        already_encrypted=stats.already_encrypted,
        errors=stats.errors,
        batches=stats.batches,
        duration_seconds=round(duration, 3),
    )
    return stats


# ----------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="encrypt_existing_pii",
        description=(
            "Chiffre les valeurs PII en clair de hr.employees (idempotent). "
            "A executer apres la migration 0011, avant de redeployer l'app "
            "en mode chiffrement."
        ),
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="N'ecrit rien en DB, affiche seulement le nombre de lignes a chiffrer.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Taille des batches transactionnels (defaut: 500).",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Logue chaque batch (sans aucune PII).",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    """Entree CLI : code retour 0 si tout OK, 1 si au moins un batch a echoue."""
    parser = _build_parser()
    args = parser.parse_args(argv)
    if args.batch_size < 1:
        parser.error("--batch-size doit etre >= 1")

    stats = asyncio.run(
        encrypt_existing(
            dry_run=args.dry_run,
            batch_size=args.batch_size,
            verbose=args.verbose,
        )
    )
    return 0 if stats.errors == 0 else 1


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
