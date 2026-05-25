"""Tests d'integration — script `app.scripts.encrypt_existing_pii` (C11 Sub-B).

Insere des lignes via SQL brut (bypass TypeDecorator) avec PII en clair, puis
lance le script et verifie la transformation reelle en DB.

Aucune PII reelle : valeurs synthetiques.
"""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.security import crypto
from app.scripts import encrypt_existing_pii as script
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers : insertion / lecture en SQL brut (bypass ORM)
# ---------------------------------------------------------------------------


async def _seed_employee_raw(
    engine: AsyncEngine,
    *,
    organization_id: UUID,
    matricule: str,
    full_name: str = "Raw Seeded",
    email: str | None = None,
    national_id: str | None = None,
    phone: str | None = None,
    birth_date: str | None = None,
    email_lookup_hash: str | None = None,
    national_id_lookup_hash: str | None = None,
) -> UUID:
    """Insere une ligne sans passer par les TypeDecorator (PII en clair)."""
    employee_id = uuid4()
    async with engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO hr.employees
                    (employee_id, organization_id, matricule, full_name,
                     email, national_id, phone, birth_date,
                     email_lookup_hash, national_id_lookup_hash,
                     employment_status, metadata)
                VALUES
                    (:eid, :oid, :matricule, :fn,
                     :email, :nid, :phone, :bd,
                     :eh, :nh,
                     'ACTIVE', '{}'::jsonb)
                """
            ),
            {
                "eid": employee_id,
                "oid": organization_id,
                "matricule": matricule,
                "fn": full_name,
                "email": email,
                "nid": national_id,
                "phone": phone,
                "bd": birth_date,
                "eh": email_lookup_hash,
                "nh": national_id_lookup_hash,
            },
        )
    return employee_id


async def _fetch_raw_employee(engine: AsyncEngine, employee_id: UUID) -> dict[str, str | None]:
    async with engine.connect() as conn:
        row = (
            (
                await conn.execute(
                    text(
                        """
                    SELECT email, national_id, phone, birth_date,
                           email_lookup_hash, national_id_lookup_hash
                    FROM hr.employees
                    WHERE employee_id = :eid
                    """
                    ),
                    {"eid": employee_id},
                )
            )
            .mappings()
            .one()
        )
    return dict(row)


@pytest_asyncio.fixture
async def script_session(db_engine: AsyncEngine) -> AsyncSession:
    """Session async pour injecter dans ``encrypt_existing(session=...)``."""
    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )
    return factory()


# ---------------------------------------------------------------------------
# 1. Chiffre les rows en clair + ecrit le hash
# ---------------------------------------------------------------------------


async def test_script_encrypts_plaintext_rows(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
    script_session: AsyncSession,
) -> None:
    org_id, _ = seed_organization
    email_plain = "raw@email.com"
    employee_id = await _seed_employee_raw(
        db_engine,
        organization_id=org_id,
        matricule="RAW-001",
        email=email_plain,
    )

    # Sanity : avant le script, l'email est en clair (pas de prefixe kv1:)
    before = await _fetch_raw_employee(db_engine, employee_id)
    assert before["email"] == email_plain
    assert before["email_lookup_hash"] is None

    async with script_session as session:
        stats = await script.encrypt_existing(
            dry_run=False, batch_size=100, verbose=False, session=session
        )

    assert stats.encrypted >= 1
    assert stats.errors == 0

    after = await _fetch_raw_employee(db_engine, employee_id)
    assert after["email"] is not None
    assert after["email"].startswith("kv1:"), f"email pas chiffre: {after['email']!r}"
    assert email_plain not in after["email"]
    assert after["email_lookup_hash"] == crypto.hmac_lookup(email_plain, normalize=True)


# ---------------------------------------------------------------------------
# 2. Idempotent : 2eme run skip
# ---------------------------------------------------------------------------


async def test_script_idempotent_second_run_skips(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
) -> None:
    org_id, _ = seed_organization
    # 3 lignes en clair.
    for i in range(3):
        await _seed_employee_raw(
            db_engine,
            organization_id=org_id,
            matricule=f"IDEMP-{i}",
            email=f"plain{i}@gov.gn",
        )

    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )

    # 1er run
    async with factory() as s1:
        stats1 = await script.encrypt_existing(
            dry_run=False, batch_size=100, verbose=False, session=s1
        )
    assert stats1.encrypted == 3
    assert stats1.already_encrypted == 0

    # 2eme run : doit etre no-op
    async with factory() as s2:
        stats2 = await script.encrypt_existing(
            dry_run=False, batch_size=100, verbose=False, session=s2
        )
    assert stats2.encrypted == 0
    assert stats2.already_encrypted == 3
    assert stats2.errors == 0


# ---------------------------------------------------------------------------
# 3. --dry-run : pas d'UPDATE
# ---------------------------------------------------------------------------


async def test_script_dry_run_does_not_write(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
) -> None:
    org_id, _ = seed_organization
    email_plain = "dryrun@gov.gn"
    employee_id = await _seed_employee_raw(
        db_engine,
        organization_id=org_id,
        matricule="DRY-001",
        email=email_plain,
    )

    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )
    async with factory() as session:
        stats = await script.encrypt_existing(
            dry_run=True, batch_size=100, verbose=False, session=session
        )
    assert stats.encrypted == 1  # compte mais n'applique pas
    assert stats.scanned == 1

    # SQL brut : email toujours en clair (pas de UPDATE commit)
    after = await _fetch_raw_employee(db_engine, employee_id)
    assert after["email"] == email_plain
    assert after["email_lookup_hash"] is None


# ---------------------------------------------------------------------------
# 4. Mixed state : 5 deja chiffres + 5 en clair
# ---------------------------------------------------------------------------


async def test_script_handles_mixed_state(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
) -> None:
    org_id, _ = seed_organization
    # 5 deja chiffres
    for i in range(5):
        ciphertext = crypto.encrypt(f"already{i}@gov.gn")
        hashv = crypto.hmac_lookup(f"already{i}@gov.gn", normalize=True)
        await _seed_employee_raw(
            db_engine,
            organization_id=org_id,
            matricule=f"MIX-CIPHER-{i}",
            email=ciphertext,
            email_lookup_hash=hashv,
        )
    # 5 en clair
    for i in range(5):
        await _seed_employee_raw(
            db_engine,
            organization_id=org_id,
            matricule=f"MIX-PLAIN-{i}",
            email=f"plain{i}@gov.gn",
        )

    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )
    async with factory() as session:
        stats = await script.encrypt_existing(
            dry_run=False, batch_size=100, verbose=False, session=session
        )

    assert stats.scanned == 10
    assert stats.encrypted == 5
    assert stats.already_encrypted == 5
    assert stats.errors == 0


# ---------------------------------------------------------------------------
# 5. Rotation : kv1 ancien reste lisible apres ajout kv2 (skip a la 2e passe)
# ---------------------------------------------------------------------------


async def test_script_rotation_old_kv1_still_readable(
    db_engine: AsyncEngine,
    seed_organization: tuple[UUID, UUID],
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Insere une ligne kv1, ajoute kv2 en tete des cles, verifie lecture ORM.

    On lance le script entre les deux : la ligne kv1 doit etre skippee
    (deja chiffree, peu importe la version). Apres ajout de kv2, on
    rechiffre rien (le script ne reecrit pas pour rotation), mais l'ORM
    doit pouvoir dechiffrer la ligne kv1 via le MultiFernet (versions
    multiples).
    """
    from app.core.config import get_settings
    from app.core.security.crypto import is_encrypted
    from cryptography.fernet import Fernet

    org_id, _ = seed_organization

    # 1) Seed avec kv1 (cle courante d'ecriture)
    email_plain = "rotated@gov.gn"
    ciphertext_kv1 = crypto.encrypt(email_plain)
    assert ciphertext_kv1 is not None
    assert ciphertext_kv1.startswith("kv1:")
    employee_id = await _seed_employee_raw(
        db_engine,
        organization_id=org_id,
        matricule="ROT-001",
        email=ciphertext_kv1,
        email_lookup_hash=crypto.hmac_lookup(email_plain, normalize=True),
    )

    # 2) 1er run du script : skip total (rien a faire).
    factory: async_sessionmaker[AsyncSession] = async_sessionmaker(
        bind=db_engine, expire_on_commit=False, autoflush=False
    )
    async with factory() as session:
        stats = await script.encrypt_existing(
            dry_run=False, batch_size=100, verbose=False, session=session
        )
    assert stats.already_encrypted >= 1
    assert stats.encrypted == 0

    # 3) Ajout kv2 EN TETE (devient cle d'ecriture). Verifie que les anciens
    # kv1 restent lisibles via MultiFernet.
    new_kv2 = Fernet.generate_key().decode()
    current_keys = get_settings().pii_encryption_keys.get_secret_value()
    # On prepend kv2 : "kv2:<new>,<current>".
    rotated = f"kv2:{new_kv2},{current_keys}"
    monkeypatch.setenv("PII_ENCRYPTION_KEYS", rotated)
    get_settings.cache_clear()
    crypto.reset_cache()
    try:
        # 4) 2e run script : toujours rien a faire (les valeurs kv1 restent
        # valides, le script ne fait pas de migration kv1->kv2 forcee).
        async with factory() as session:
            stats2 = await script.encrypt_existing(
                dry_run=False, batch_size=100, verbose=False, session=session
            )
        assert stats2.encrypted == 0
        assert stats2.errors == 0

        # 5) Lecture ORM : la ligne kv1 doit toujours se decrypter en clair.
        from app.models.employee import Employee
        from sqlalchemy import select

        async with factory() as session:
            emp = (
                await session.execute(select(Employee).where(Employee.employee_id == employee_id))
            ).scalar_one()
            # TypeDecorator EncryptedString dechiffre via MultiFernet :
            # kv1 lu malgre kv2 en tete.
            assert emp.email == email_plain

        # Verifie aussi que ``is_encrypted`` reconnait l'ancien kv1.
        raw = await _fetch_raw_employee(db_engine, employee_id)
        assert raw["email"] is not None
        assert is_encrypted(raw["email"])
        assert raw["email"].startswith("kv1:")
    finally:
        # Restaure cle precedente pour ne pas polluer la session pytest.
        monkeypatch.setenv("PII_ENCRYPTION_KEYS", current_keys)
        get_settings.cache_clear()
        crypto.reset_cache()
