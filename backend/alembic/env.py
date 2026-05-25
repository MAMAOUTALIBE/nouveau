"""Configuration Alembic — async-aware, branchée aux settings applicatifs."""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context

# Importe tous les modèles pour que metadata soit complète
from app import models  # noqa: F401
from app.core.config import get_settings
from app.core.db import Base
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url)

target_metadata = Base.metadata


def _include_object(object: object, name: str | None, type_: str, *_args: object) -> bool:
    """Filtre : ne pas générer de migrations pour les objets hors schéma `hr`."""
    if type_ == "table":
        schema = getattr(object, "schema", None)
        return schema == settings.schema_name
    return True


def run_migrations_offline() -> None:
    """Mode offline — génère le SQL sans connexion à la base.

    En offline, on ne peut pas exécuter `CREATE SCHEMA IF NOT EXISTS` côté DB
    (aucune connexion). Le SQL généré devra inclure la création du schéma
    via la migration 0001 elle-même. On laisse donc l'usage offline tel quel ;
    en pratique le projet n'utilise que le mode online (CI + dev).
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        version_table_schema=settings.schema_name,
        include_schemas=True,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    # Garantit que le schéma cible existe avant qu'Alembic ne tente de
    # créer sa table de versions (`hr.alembic_version`). Idempotent.
    connection.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{settings.schema_name}"'))
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        version_table_schema=settings.schema_name,
        include_schemas=True,
        include_object=_include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    cfg = config.get_section(config.config_ini_section, {})
    cfg["sqlalchemy.url"] = settings.database_url
    connectable = async_engine_from_config(
        cfg,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
        # SQLAlchemy 2.0 + asyncpg : la connexion async externe n'auto-commit pas
        # à la sortie du `async with`. Sans ce commit explicite, toute la migration
        # est silencieusement rollbackée (Postgres logue "Running upgrade ... -> 00xx"
        # mais aucune table n'est créée et hr.alembic_version reste à l'ancienne valeur).
        await connection.commit()
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
