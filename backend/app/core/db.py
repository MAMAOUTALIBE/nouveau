"""Connexion PostgreSQL async + factory de sessions."""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import Settings, get_settings


class Base(DeclarativeBase):
    """Base déclarative pour tous les modèles SQLAlchemy.

    Convention : tous les modèles vivent dans le schéma `hr` par défaut
    (configurable via SCHEMA_NAME). Les classes ne définissent pas
    `__table_args__ = {"schema": ...}` directement — elles utilisent
    `__table_args__` qui sera fusionné avec le schéma global au build.
    """


_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def init_engine(settings: Settings | None = None) -> AsyncEngine:
    """Initialise (idempotent) l'engine async global."""
    global _engine, _session_factory

    if _engine is not None:
        return _engine

    cfg = settings or get_settings()

    _engine = create_async_engine(
        cfg.database_url,
        echo=cfg.db_echo,
        pool_size=cfg.db_pool_size,
        max_overflow=cfg.db_max_overflow,
        pool_pre_ping=True,
        pool_recycle=1800,
        future=True,
    )
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )
    return _engine


async def dispose_engine() -> None:
    """Libère le pool de connexions à l'arrêt."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _session_factory = None


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Retourne la factory de sessions, initialise si nécessaire."""
    if _session_factory is None:
        init_engine()
    assert _session_factory is not None
    return _session_factory


async def get_session() -> AsyncIterator[AsyncSession]:
    """Dépendance FastAPI : fournit une session asynchrone par requête.

    La session est commit/rollback automatiquement selon le déroulé.
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def session_scope() -> AsyncIterator[AsyncSession]:
    """Context manager pour usage hors-requête (workers, scripts)."""
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def healthcheck() -> bool:
    """Renvoie True si PostgreSQL répond, False sinon."""
    from sqlalchemy import text

    try:
        async with session_scope() as session:
            await session.execute(text("select 1"))
        return True
    except Exception:
        return False
