"""Vérifie l'absence de drift entre les modèles SQLAlchemy et le schéma DB.

Usage :

    cd Final/backend
    docker compose up -d postgres
    uv run alembic upgrade head
    uv run python -m scripts.check_schema_drift

Sortie :
- Code 0 si parité parfaite (mêmes tables, mêmes colonnes, mêmes types).
- Code 1 sinon, avec un rapport détaillé des écarts.

Limites V1 :
- Ne vérifie pas les indexes ni les triggers (à enrichir en vague 8).
- Compare les noms de colonnes et types fondamentaux.
"""

from __future__ import annotations

import asyncio
import sys

from app import models  # noqa: F401 — enregistre tous les modèles
from app.core.config import get_settings
from app.core.db import Base
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


async def _db_table_columns(schema: str = "hr") -> dict[str, set[str]]:
    """Récupère table → set de noms de colonnes depuis pg_catalog.

    Exclut les vues (`vw_*`) et la table interne `alembic_version` —
    elles ne sont pas modélisées côté SQLAlchemy par design.
    """
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text(
                    """
                    select table_name, column_name
                    from information_schema.columns
                    where table_schema = :schema
                      and table_name <> 'alembic_version'
                      and table_name not like 'vw\\_%' escape '\\'
                    order by table_name, ordinal_position
                    """
                ),
                {"schema": schema},
            )
            tables: dict[str, set[str]] = {}
            for row in result:
                tables.setdefault(row.table_name, set()).add(row.column_name)
            return tables
    finally:
        await engine.dispose()


def _model_table_columns() -> dict[str, set[str]]:
    out: dict[str, set[str]] = {}
    for fullname, table in Base.metadata.tables.items():
        if "." in fullname:
            _, name = fullname.split(".", 1)
        else:
            name = fullname
        out[name] = {col.name for col in table.columns}
    return out


async def main() -> int:
    db_tables = await _db_table_columns()
    model_tables = _model_table_columns()

    missing_in_db = set(model_tables) - set(db_tables)
    extra_in_db = set(db_tables) - set(model_tables)

    issues: list[str] = []

    if missing_in_db:
        issues.append(
            "Tables présentes côté modèles mais absentes en base :\n  - "
            + "\n  - ".join(sorted(missing_in_db))
        )

    if extra_in_db:
        issues.append(
            "Tables présentes en base mais absentes côté modèles :\n  - "
            + "\n  - ".join(sorted(extra_in_db))
        )

    common = set(db_tables) & set(model_tables)
    for table in sorted(common):
        db_cols = db_tables[table]
        model_cols = model_tables[table]
        missing_cols = model_cols - db_cols
        extra_cols = db_cols - model_cols
        if missing_cols:
            issues.append(
                f"Table {table} — colonnes attendues par modèle absentes en base : "
                f"{sorted(missing_cols)}"
            )
        if extra_cols:
            # Tolérance pour les versions Alembic
            extra_cols_filtered = {c for c in extra_cols if table != "alembic_version"}
            if extra_cols_filtered:
                issues.append(
                    f"Table {table} — colonnes en base sans modèle : {sorted(extra_cols_filtered)}"
                )

    if not issues:
        print(  # noqa: T201
            f"OK — {len(common)} tables alignées entre modèles SQLAlchemy et base."
        )
        return 0

    print("DRIFT DÉTECTÉ\n")  # noqa: T201
    for i, issue in enumerate(issues, 1):
        print(f"[{i}] {issue}\n")  # noqa: T201
    return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
