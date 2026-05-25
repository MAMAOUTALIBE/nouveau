"""Tests unitaires — script ``app.scripts.encrypt_existing_pii``.

Approche : pas de vraie DB. On mocke ``AsyncSession`` via une classe minuscule
qui retourne des objets ``Row``-like, on capture les ``UPDATE`` emis, et on
verifie :

- idempotence (skip ciphertexts existants),
- chiffrement effectif des valeurs en clair (email/national_id/phone/birth_date)
  avec ecriture du hash de lookup,
- ``--dry-run`` n'emet aucun UPDATE,
- ``None``/``""`` ne sont pas chiffres,
- stats agreges corrects sur un mix de cas,
- aucune valeur PII synthetique n'apparait dans les logs structlog,
- ``batch_size`` respecte (un COMMIT par batch).

Aucune PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

import secrets
from collections.abc import Iterator
from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any
from uuid import UUID, uuid4

import pytest
import structlog
from app.core.security import crypto
from app.scripts import encrypt_existing_pii as script
from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Fixtures (alignees avec tests/unit/test_security_types.py et test_crypto.py)
# ---------------------------------------------------------------------------


def _gen_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _gen_hmac_key() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def isolate_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Initialise PII_ENCRYPTION_KEYS + EMAIL_LOOKUP_HMAC_KEY pour le test."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", _gen_fernet_key())
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", _gen_hmac_key())
    get_settings.cache_clear()
    crypto.reset_cache()
    yield
    crypto.reset_cache()
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Helpers : Row factice + FakeSession asynchrone
# ---------------------------------------------------------------------------


def _make_row(
    *,
    email: str | None = None,
    national_id: str | None = None,
    phone: str | None = None,
    birth_date: str | None = None,
    email_lookup_hash: str | None = None,
    national_id_lookup_hash: str | None = None,
    employee_id: UUID | None = None,
) -> SimpleNamespace:
    """Fabrique un Row-like (acces attributaire)."""
    return SimpleNamespace(
        employee_id=employee_id or uuid4(),
        email=email,
        national_id=national_id,
        phone=phone,
        birth_date=birth_date,
        email_lookup_hash=email_lookup_hash,
        national_id_lookup_hash=national_id_lookup_hash,
    )


@dataclass
class _Result:
    """Mimique le ``Result`` retourne par ``session.execute(SELECT ...)``."""

    rows: list[Any]
    rowcount: int = 0

    def fetchall(self) -> list[Any]:
        return self.rows


class FakeSession:
    """Mini-session async qui sert les rows en pages keyset.

    Sert les ``rows`` provisionnes en respectant le ``LIMIT`` et le ``cursor``
    passes en parametres. Enregistre tous les UPDATE/COMMIT/ROLLBACK pour
    permettre les assertions.
    """

    def __init__(self, rows: list[Any]):
        # Tri stable par employee_id pour respecter ``ORDER BY``.
        self._all_rows = sorted(rows, key=lambda r: r.employee_id)
        self.updates: list[dict[str, Any]] = []
        self.commits: int = 0
        self.rollbacks: int = 0
        # Mode panne : si configure, le N-ieme UPDATE leve.
        self.fail_on_update_index: int | None = None

    async def execute(self, stmt: Any, params: dict[str, Any] | None = None) -> Any:
        sql = str(stmt).strip().upper()
        if sql.startswith("SELECT"):
            assert params is not None
            cursor = params["cursor"]
            limit = params["batch_size"]
            page = [r for r in self._all_rows if r.employee_id > cursor][:limit]
            return _Result(rows=page)
        if sql.startswith("UPDATE"):
            assert params is not None
            if (
                self.fail_on_update_index is not None
                and len(self.updates) == self.fail_on_update_index
            ):
                self.updates.append(dict(params))
                raise RuntimeError("simulated DB failure")
            self.updates.append(dict(params))
            return _Result(rows=[], rowcount=1)
        raise AssertionError(f"Unexpected SQL: {sql[:80]}")

    async def commit(self) -> None:
        self.commits += 1

    async def rollback(self) -> None:
        self.rollbacks += 1


# ---------------------------------------------------------------------------
# 1. Idempotence : ciphertext deja en place => skip
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_idempotent_skip_already_encrypted() -> None:
    already = crypto.encrypt("alice@gov.gn")
    row = _make_row(email=already)
    session = FakeSession([row])

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 1
    assert stats.encrypted == 0
    assert stats.already_encrypted == 1
    assert stats.errors == 0
    # Aucun UPDATE emis.
    assert session.updates == []
    # On a fait au moins un commit (le COMMIT du batch all-already-encrypted).
    assert session.commits >= 1


# ---------------------------------------------------------------------------
# 2. Chiffrement effectif d'un email en clair + hash lookup
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_encrypt_plaintext_email_writes_ciphertext_and_hash() -> None:
    row = _make_row(email="alice@gov.gn")
    session = FakeSession([row])

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.encrypted == 1
    assert stats.already_encrypted == 0
    assert len(session.updates) == 1
    update = session.updates[0]
    # employee_id passe en WHERE.
    assert update["employee_id"] == row.employee_id
    # email mis a jour avec ciphertext (kv1:...).
    assert "email" in update
    assert crypto.is_encrypted(update["email"])
    # email_lookup_hash mis a jour avec HMAC normalise (64 hex).
    assert "email_lookup_hash" in update
    assert isinstance(update["email_lookup_hash"], str)
    assert len(update["email_lookup_hash"]) == 64
    expected_hash = crypto.hmac_lookup("alice@gov.gn", normalize=True)
    assert update["email_lookup_hash"] == expected_hash


# ---------------------------------------------------------------------------
# 3. --dry-run : aucun UPDATE emis
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_dry_run_does_not_emit_updates() -> None:
    rows = [
        _make_row(email="bob@gov.gn"),
        _make_row(national_id="GN-99"),
        _make_row(phone="+224 600 00 00 00"),
    ]
    session = FakeSession(rows)

    stats = await script.encrypt_existing(
        dry_run=True,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 3
    assert stats.encrypted == 3  # comptes mais pas appliques
    assert stats.errors == 0
    assert session.updates == []  # AUCUN UPDATE en dry-run
    assert session.commits == 0  # ni de COMMIT


# ---------------------------------------------------------------------------
# 4. email = None : skip
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_none_email_does_not_encrypt() -> None:
    row = _make_row(email=None, national_id=None, phone=None, birth_date=None)
    session = FakeSession([row])

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 1
    assert stats.encrypted == 0
    assert stats.already_encrypted == 1  # rien a faire => "deja chiffre"
    assert session.updates == []


# ---------------------------------------------------------------------------
# 5. email = "" : skip
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_empty_string_email_does_not_encrypt() -> None:
    row = _make_row(email="", national_id="", phone="", birth_date="")
    session = FakeSession([row])

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 1
    assert stats.encrypted == 0
    assert stats.already_encrypted == 1
    assert session.updates == []


# ---------------------------------------------------------------------------
# 6. Stats agregees sur mix realiste
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_stats_aggregated_correctly() -> None:
    # 5 lignes deja chiffrees, 3 en clair, 2 vides => 10 lignes scannees,
    # 3 encrypted, 7 deja-encryptees (vides comptent comme "rien a faire").
    already = crypto.encrypt("seed@gov.gn")
    rows: list[SimpleNamespace] = []
    for _ in range(5):
        rows.append(_make_row(email=already))
    for i in range(3):
        rows.append(_make_row(email=f"plain{i}@gov.gn"))
    for _ in range(2):
        rows.append(_make_row(email=None))
    session = FakeSession(rows)

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=100,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 10
    assert stats.encrypted == 3
    assert stats.already_encrypted == 7
    assert stats.errors == 0
    assert len(session.updates) == 3


# ---------------------------------------------------------------------------
# 7. Aucun plaintext synthetique dans les logs structlog
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_logs_no_plaintext_value() -> None:
    """Capture les events structlog et verifie qu'aucune valeur synthetique
    ne fuite, en mode verbose (le plus a risque).
    """
    plaintext_email = "leaky@gov.gn"
    plaintext_nid = "GN-LEAKY-42"
    plaintext_phone = "+224 600 11 22 33"
    plaintext_bd = "1991-02-03"
    row = _make_row(
        email=plaintext_email,
        national_id=plaintext_nid,
        phone=plaintext_phone,
        birth_date=plaintext_bd,
    )
    session = FakeSession([row])

    captured: list[Any] = []

    def _capture(_logger: Any, _name: str, event_dict: dict[str, Any]) -> dict[str, Any]:
        captured.append(event_dict)
        return event_dict

    structlog.configure(
        processors=[_capture, structlog.processors.KeyValueRenderer()],
        wrapper_class=structlog.make_filtering_bound_logger(20),  # INFO
        cache_logger_on_first_use=False,
    )
    try:
        await script.encrypt_existing(
            dry_run=False,
            batch_size=10,
            verbose=True,
            session=session,  # type: ignore[arg-type]
        )
    finally:
        structlog.reset_defaults()

    # On serialise tous les events captures et on cherche les plaintexts.
    blob = repr(captured)
    for needle in (plaintext_email, plaintext_nid, plaintext_phone, plaintext_bd):
        assert needle not in blob, f"plaintext leaked in logs: {needle!r}"


# ---------------------------------------------------------------------------
# 8. batch_size respecte : 1500 rows / 500 par batch => 3 commits
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_batch_size_respected() -> None:
    rows = [_make_row(email=f"u{i}@gov.gn") for i in range(1500)]
    session = FakeSession(rows)

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=500,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.scanned == 1500
    assert stats.encrypted == 1500
    # 3 batches de 500 + 1 fetch vide qui termine => 3 commits.
    assert session.commits == 3
    assert stats.batches == 3
    assert stats.errors == 0


# ---------------------------------------------------------------------------
# 9. Erreur en milieu de batch => rollback + continuer (batch suivant OK)
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_batch_failure_rolls_back_and_continues() -> None:
    # 2 batches de 2 : on fait planter le 1er UPDATE du 1er batch.
    # Le batch suivant doit malgre tout etre traite.
    rows = [_make_row(email=f"x{i}@gov.gn") for i in range(4)]
    session = FakeSession(rows)
    session.fail_on_update_index = 0  # crash du tout premier UPDATE

    stats = await script.encrypt_existing(
        dry_run=False,
        batch_size=2,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert stats.errors == 1
    assert session.rollbacks == 1
    # 2eme batch doit avoir reussi.
    assert stats.encrypted == 2
    assert stats.batches == 1  # un seul batch reussi (l'autre a fait rollback)


# ---------------------------------------------------------------------------
# 10. CLI : main() retourne 0 quand tout va bien (smoke test parser)
# ---------------------------------------------------------------------------


def test_main_argparse_dry_run(monkeypatch: pytest.MonkeyPatch) -> None:
    """Smoke test du parser CLI + retour 0 quand stats.errors == 0."""
    fake_stats = script.Stats(scanned=0, encrypted=0, already_encrypted=0, errors=0)

    async def _fake_run(**_kwargs: Any) -> script.Stats:
        return fake_stats

    monkeypatch.setattr(script, "encrypt_existing", _fake_run)
    rc = script.main(["--dry-run", "--batch-size", "10", "--verbose"])
    assert rc == 0


def test_main_returns_nonzero_on_errors(monkeypatch: pytest.MonkeyPatch) -> None:
    fake_stats = script.Stats(errors=1)

    async def _fake_run(**_kwargs: Any) -> script.Stats:
        return fake_stats

    monkeypatch.setattr(script, "encrypt_existing", _fake_run)
    rc = script.main([])
    assert rc == 1


def test_main_rejects_zero_batch_size() -> None:
    with pytest.raises(SystemExit):
        script.main(["--batch-size", "0"])


# ---------------------------------------------------------------------------
# 11. national_id sans normalisation + birth_date chiffres correctement
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
async def test_national_id_hash_uses_normalize_false() -> None:
    row = _make_row(national_id="GN-Casee-42 ")
    session = FakeSession([row])

    await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert len(session.updates) == 1
    update = session.updates[0]
    expected = crypto.hmac_lookup("GN-Casee-42 ", normalize=False)
    assert update["national_id_lookup_hash"] == expected
    # normalize=True donnerait un hash different => contrat respecte.
    wrong = crypto.hmac_lookup("GN-Casee-42 ", normalize=True)
    assert expected != wrong


@pytest.mark.usefixtures("isolate_env")
async def test_birth_date_iso_string_gets_encrypted() -> None:
    row = _make_row(birth_date="1990-01-15")
    session = FakeSession([row])

    await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert len(session.updates) == 1
    update = session.updates[0]
    assert "birth_date" in update
    assert crypto.is_encrypted(update["birth_date"])
    # round-trip : la valeur dechiffree doit etre la string ISO d'origine.
    assert crypto.decrypt(update["birth_date"]) == "1990-01-15"


@pytest.mark.usefixtures("isolate_env")
async def test_phone_encrypted_without_hash() -> None:
    row = _make_row(phone="+224 600 00 00 00")
    session = FakeSession([row])

    await script.encrypt_existing(
        dry_run=False,
        batch_size=10,
        verbose=False,
        session=session,  # type: ignore[arg-type]
    )

    assert len(session.updates) == 1
    update = session.updates[0]
    assert "phone" in update
    assert crypto.is_encrypted(update["phone"])
    # Pas de hash pour phone.
    assert "phone_lookup_hash" not in update
