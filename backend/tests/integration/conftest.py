"""Conftest pour les tests d'integration PII (Sub-B C8-C11).

Ces fixtures fournissent :

- ``pii_keys_env`` (autouse session) : configure PII_ENCRYPTION_KEYS +
  EMAIL_LOOKUP_HMAC_KEY pour tous les tests d'integration. Les valeurs
  existantes en env (CI) sont preservees.
- ``postgres_available`` (session) : skip tout le module si la DB Postgres
  ciblee n'est pas joignable. Evite les crashes en local sans PG.
- ``db_engine`` (function) : engine async dedie, recree a chaque test pour
  eviter les conflits asyncio (chaque test pytest-asyncio a sa propre
  event-loop sous ``asyncio_mode = "auto"``).
- ``db_session`` (function) : session ORM dediee, apres truncate des tables
  ``hr.employees`` / ``hr.audit_logs`` etc.
- ``seed_organization`` (function) : insere une organisation + un user de
  test (necessaire pour la FK ``hr.audit_logs.user_id -> hr.users``) +
  yield ``(org_id, user_id)``.
- ``app_client`` (function) : client httpx ASGI avec dependency_overrides
  pour bypasser l'authentification (AuthenticatedUser injecte avec
  permission ``*`` et scope ``GLOBAL`` pour l'organisation seedee).

Aucune PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

import asyncio
import os
import secrets
from collections.abc import AsyncIterator, Iterator
from typing import Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from cryptography.fernet import Fernet
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# ---------------------------------------------------------------------------
# Helpers : generation de cles synthetiques
# ---------------------------------------------------------------------------


def _gen_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _gen_hmac_key_hex() -> str:
    return secrets.token_hex(32)


# ---------------------------------------------------------------------------
# Env crypto : monkeypatch session-scope
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session", autouse=True)
def pii_keys_env() -> Iterator[None]:
    """Configure les cles crypto PII pour toute la session d'integration.

    Respecte les valeurs deja injectees en env (CI peut les surcharger). En
    teardown : reset des caches crypto/settings + restauration des valeurs
    d'origine.
    """
    from app.core.config import get_settings
    from app.core.security import crypto

    saved: dict[str, str | None] = {
        "PII_ENCRYPTION_KEYS": os.environ.get("PII_ENCRYPTION_KEYS"),
        "EMAIL_LOOKUP_HMAC_KEY": os.environ.get("EMAIL_LOOKUP_HMAC_KEY"),
    }
    if not saved["PII_ENCRYPTION_KEYS"]:
        os.environ["PII_ENCRYPTION_KEYS"] = _gen_fernet_key()
    if not saved["EMAIL_LOOKUP_HMAC_KEY"]:
        os.environ["EMAIL_LOOKUP_HMAC_KEY"] = _gen_hmac_key_hex()
    get_settings.cache_clear()
    crypto.reset_cache()
    yield
    # Restauration
    for key, value in saved.items():
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value
    get_settings.cache_clear()
    crypto.reset_cache()


# ---------------------------------------------------------------------------
# Disponibilite de Postgres : skip propre si DB inaccessible
# ---------------------------------------------------------------------------


def _can_reach_postgres(database_url: str) -> bool:
    """Tente une connexion via asyncpg pour valider que le service repond."""
    import asyncpg

    raw = database_url.replace("postgresql+asyncpg://", "postgresql://")

    async def _probe() -> bool:
        try:
            conn = await asyncpg.connect(raw, timeout=2.0)
        except Exception:
            return False
        try:
            await conn.execute("SELECT 1")
            return True
        finally:
            await conn.close()

    try:
        return asyncio.run(_probe())
    except Exception:
        return False


@pytest.fixture(scope="session")
def postgres_available() -> bool:
    """True si la DB Postgres cible est joignable."""
    from app.core.config import get_settings

    settings = get_settings()
    return _can_reach_postgres(settings.database_url)


# ---------------------------------------------------------------------------
# Engine + session : recreation par test (compat event-loop pytest-asyncio)
# ---------------------------------------------------------------------------

# Tables purgees AVANT chaque test (ordre = respect FKs).
_TABLES_TO_TRUNCATE: tuple[str, ...] = (
    "hr.audit_logs",
    "hr.employee_assignments",
    "hr.employees",
    "hr.user_scopes",
    "hr.user_roles",
    "hr.users",
    "hr.organizations",
)


@pytest_asyncio.fixture
async def db_engine(postgres_available: bool) -> AsyncIterator[AsyncEngine]:
    """Engine async dedie, recree a chaque test.

    ``pytest-asyncio`` (mode auto) ouvre une nouvelle event-loop par test :
    un engine session-scope referencerait des connexions liees a une
    boucle morte. Function-scope = simple et sur. Le surcout est negligeable
    (quelques ms).
    """
    if not postgres_available:
        pytest.skip("PostgreSQL non joignable (DATABASE_URL).", allow_module_level=False)

    from app.core.config import get_settings

    settings = get_settings()
    engine = create_async_engine(settings.database_url, future=True, pool_pre_ping=True)
    # Truncate des tables sensibles AVANT chaque test : isolation forte.
    async with engine.begin() as conn:
        for table in _TABLES_TO_TRUNCATE:
            await conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """Session ORM dediee au test (post-truncate via db_engine)."""
    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )
    async with factory() as session:
        yield session


# ---------------------------------------------------------------------------
# Seeds : organisation + user (FKs audit_logs)
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def seed_organization(db_engine: AsyncEngine) -> tuple[UUID, UUID]:
    """Insere une organisation + un user systeme. Retourne ``(org_id, user_id)``.

    Le user est requis pour la FK ``hr.audit_logs.user_id`` (sinon les
    endpoints qui ecrivent dans audit_logs renvoient 500).
    """
    org_id = uuid4()
    user_id = uuid4()
    async with db_engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO hr.organizations
                    (organization_id, code, name, is_active, retirement_age)
                VALUES
                    (:oid, :code, :name, true, 60)
                """
            ),
            {"oid": org_id, "code": f"ORG-{org_id.hex[:8]}", "name": "Test Org PII"},
        )
        # Un user minimal pour FKs (audit_logs.user_id, etc.).
        # password_hash : chaine arbitraire (la connexion est mockee, jamais utilisee).
        await conn.execute(
            text(
                """
                INSERT INTO hr.users
                    (user_id, organization_id, username, password_hash, full_name, status)
                VALUES
                    (:uid, :oid, :username, :pwd, :name, 'ACTIVE')
                """
            ),
            {
                "uid": user_id,
                "oid": org_id,
                "username": f"pytest-pii-{user_id.hex[:8]}",
                "pwd": "not-a-real-hash",
                "name": "Pytest PII Admin",
            },
        )
    return org_id, user_id


# ---------------------------------------------------------------------------
# Client HTTP : FastAPI + dependency_overrides bypass auth
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def app_client(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
) -> AsyncIterator[tuple[Any, UUID]]:
    """Client httpx ASGI avec auth bypass (super-admin de l'org seedee).

    Yield un tuple ``(client, organization_id)`` pour eviter aux tests de
    re-resoudre l'organisation. La session FastAPI est forcee a utiliser
    l'engine de test.
    """
    from app.core.audit import AuditWriter, get_audit_writer
    from app.core.db import get_session
    from app.core.security.rbac import AuthenticatedUser, get_current_user
    from app.main import create_app
    from fastapi import Depends as _Depends
    from httpx import ASGITransport, AsyncClient

    org_id, user_id = seed_organization
    fake_user = AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-pii",
        full_name="Pytest PII Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )

    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )

    async def _override_session() -> AsyncIterator[AsyncSession]:
        """Session partagee dans la requete (FastAPI cache Depends par requete)."""
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def _override_current_user() -> AuthenticatedUser:
        return fake_user

    # AuditWriter : reutilise la session injectee (cf. _override_session).
    # FastAPI dedupe les Depends par requete => meme session => meme txn.
    async def _override_audit_writer(
        session: AsyncSession = _Depends(get_session),
    ) -> AuditWriter:
        return AuditWriter(
            session,
            actor=fake_user,
            organization_id=org_id,
            source_ip="127.0.0.1",
            user_agent="pytest",
        )

    app = create_app()
    app.dependency_overrides[get_session] = _override_session
    app.dependency_overrides[get_current_user] = _override_current_user
    app.dependency_overrides[get_audit_writer] = _override_audit_writer

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client, org_id

    app.dependency_overrides.clear()


__all__ = [
    "app_client",
    "db_engine",
    "db_session",
    "pii_keys_env",
    "postgres_available",
    "seed_organization",
]
