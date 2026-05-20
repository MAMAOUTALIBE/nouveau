"""Baseline — applique le schéma SQL existant (001_init + 002_unified + 003_indexes + 004_360).

Ce fichier ne re-définit pas les tables en SQLAlchemy : il joue les fichiers SQL
existants (`Final/db/postgresql/00X_*.sql`) tels quels, garantissant une parité
parfaite avec le schéma déployé par le mock-backend Node.js. Cela permet :

- Sur une base vierge : la migration crée tout le schéma `hr.*` d'un coup.
- Sur une base existante (déjà créée par le Node.js) : tous les `create ...
  if not exists` sont no-op ; il suffit de jouer `alembic stamp head`.

Les migrations suivantes (V012+) utiliseront SQLAlchemy / autogenerate
classique pour les nouvelles tables (training, performance 360, GPEC, etc.).

Revision ID: 0001
Revises:
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence
from pathlib import Path

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


# Le dossier `Final/db/postgresql/` est la source de vérité du schéma actuel.
# Chemin résolu à l'exécution via le repo path.
SQL_FILES: tuple[str, ...] = (
    "001_init_rh_schema.sql",
    "002_unified_documents.sql",
    "003_performance_indexes.sql",
    "004_personnel_360_ai.sql",
)


def _sql_dir() -> Path:
    """Localise `Final/db/postgresql/` quel que soit le CWD d'invocation."""
    here = Path(__file__).resolve()
    # backend/alembic/versions/0001_*.py → backend/ → Final/ → db/postgresql/
    candidate = here.parent.parent.parent.parent / "db" / "postgresql"
    if candidate.is_dir():
        return candidate
    # Fallback : remonter jusqu'à trouver `db/postgresql/`
    for parent in here.parents:
        candidate = parent / "db" / "postgresql"
        if candidate.is_dir():
            return candidate
    raise FileNotFoundError("Impossible de localiser le dossier `db/postgresql/` depuis %s" % here)


def upgrade() -> None:
    sql_dir = _sql_dir()
    for filename in SQL_FILES:
        path = sql_dir / filename
        if not path.is_file():
            raise FileNotFoundError(f"Migration SQL manquante : {path}")
        sql = path.read_text(encoding="utf-8")
        # asyncpg refuse les prepared statements multi-commandes :
        # on splitte chaque fichier en statements individuels en respectant
        # les blocs $$...$$ (cf. alembic/_sql_utils.py).
        for statement in split_statements(sql):
            op.execute(statement)


def downgrade() -> None:
    # On ne propose pas de downgrade automatique pour la baseline :
    # supprimer le schéma RH complet n'est jamais une opération qu'on
    # veut déclencher par une simple commande Alembic.
    raise NotImplementedError(
        "La baseline n'est pas réversible. Pour réinitialiser le schéma, "
        "exécutez manuellement : DROP SCHEMA hr CASCADE;"
    )
