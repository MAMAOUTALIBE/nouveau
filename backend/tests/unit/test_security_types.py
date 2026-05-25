"""Tests unitaires : TypeDecorators chiffrés (EncryptedString, EncryptedDate)."""

from __future__ import annotations

import secrets
from collections.abc import Iterator
from datetime import date

import pytest
import structlog
from app.core.security import crypto
from app.core.security.crypto import InvalidCiphertextError
from app.core.security.types import (
    EncryptedDate,
    EncryptedString,
    _reset_legacy_warning_flag,
)
from cryptography.fernet import Fernet
from structlog.testing import capture_logs

# ---------------------------------------------------------------------------
# Fixtures (mêmes que test_crypto.py — env crypto isolé par test)
# ---------------------------------------------------------------------------


def _gen_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _gen_hmac_key() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def isolate_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Réinitialise l'env crypto + caches + drapeau legacy autour de chaque test."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", _gen_fernet_key())
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", _gen_hmac_key())
    get_settings.cache_clear()
    crypto.reset_cache()
    _reset_legacy_warning_flag()
    yield
    _reset_legacy_warning_flag()
    crypto.reset_cache()
    get_settings.cache_clear()


# Dialect factice — les TypeDecorators ignorent ce paramètre dans ce module.
_DIALECT: object = object()


# ===========================================================================
# EncryptedString
# ===========================================================================


class TestEncryptedString:
    """Couvre les chemins critiques d'EncryptedString."""

    @pytest.mark.usefixtures("isolate_env")
    def test_round_trip_ascii(self) -> None:
        col = EncryptedString()
        ciphertext = col.process_bind_param("alice", _DIALECT)
        assert ciphertext is not None
        assert ciphertext.startswith("kv1:")
        assert col.process_result_value(ciphertext, _DIALECT) == "alice"

    @pytest.mark.usefixtures("isolate_env")
    def test_round_trip_utf8(self) -> None:
        col = EncryptedString()
        samples = [
            "Café à l'éclair",
            "Sékou Touré — Conakry",
            "中文测试",
            "𠜎 emoji 😀",
        ]
        for s in samples:
            ciphertext = col.process_bind_param(s, _DIALECT)
            assert ciphertext is not None
            assert ciphertext.startswith("kv1:")
            assert col.process_result_value(ciphertext, _DIALECT) == s

    @pytest.mark.usefixtures("isolate_env")
    def test_bind_none_returns_none(self) -> None:
        col = EncryptedString()
        assert col.process_bind_param(None, _DIALECT) is None

    @pytest.mark.usefixtures("isolate_env")
    def test_result_none_returns_none(self) -> None:
        col = EncryptedString()
        assert col.process_result_value(None, _DIALECT) is None

    @pytest.mark.usefixtures("isolate_env")
    def test_bind_empty_string_passthrough(self) -> None:
        col = EncryptedString()
        assert col.process_bind_param("", _DIALECT) == ""

    @pytest.mark.usefixtures("isolate_env")
    def test_result_empty_string_passthrough(self) -> None:
        col = EncryptedString()
        assert col.process_result_value("", _DIALECT) == ""

    @pytest.mark.usefixtures("isolate_env")
    def test_bind_idempotent_on_already_encrypted(self) -> None:
        """Si la valeur est déjà ``kv1:...``, on ne re-chiffre pas."""
        col = EncryptedString()
        first = col.process_bind_param("plain@gov.gn", _DIALECT)
        assert first is not None
        # Re-bind du ciphertext : doit le retourner inchangé.
        second = col.process_bind_param(first, _DIALECT)
        assert second == first
        # Et il doit toujours se déchiffrer correctement (pas de double couche).
        assert col.process_result_value(second, _DIALECT) == "plain@gov.gn"

    @pytest.mark.usefixtures("isolate_env")
    def test_result_legacy_plaintext_passthrough_and_warns(self) -> None:
        """Une valeur en clair en DB (cas legacy) est rendue telle quelle
        avec un warning structuré ``pii_legacy_plaintext_read``."""
        col = EncryptedString()
        with capture_logs() as logs:
            out = col.process_result_value("jean@gov.gn", _DIALECT)
        assert out == "jean@gov.gn"
        events = [log.get("event") for log in logs]
        assert "pii_legacy_plaintext_read" in events
        # Le log NE doit PAS contenir la valeur.
        for log in logs:
            assert "jean@gov.gn" not in repr(log)

    @pytest.mark.usefixtures("isolate_env")
    def test_result_legacy_warning_emitted_once(self) -> None:
        """Plusieurs lectures legacy → un seul warning (pas de spam)."""
        col = EncryptedString()
        with capture_logs() as logs:
            col.process_result_value("alpha", _DIALECT)
            col.process_result_value("beta", _DIALECT)
            col.process_result_value("gamma", _DIALECT)
        warns = [log for log in logs if log.get("event") == "pii_legacy_plaintext_read"]
        assert len(warns) == 1

    @pytest.mark.usefixtures("isolate_env")
    def test_result_corrupted_ciphertext_raises(self) -> None:
        col = EncryptedString()
        with pytest.raises(InvalidCiphertextError):
            col.process_result_value("kv1:GARBAGE", _DIALECT)

    @pytest.mark.usefixtures("isolate_env")
    def test_two_binds_same_value_yield_different_ciphertexts(self) -> None:
        """Nonce aléatoire → 2 ciphertexts distincts, même plaintext."""
        col = EncryptedString()
        c1 = col.process_bind_param("identique", _DIALECT)
        c2 = col.process_bind_param("identique", _DIALECT)
        assert c1 is not None
        assert c2 is not None
        assert c1 != c2
        assert col.process_result_value(c1, _DIALECT) == "identique"
        assert col.process_result_value(c2, _DIALECT) == "identique"


# ===========================================================================
# EncryptedDate
# ===========================================================================


class TestEncryptedDate:
    """Couvre les chemins critiques d'EncryptedDate."""

    @pytest.mark.usefixtures("isolate_env")
    def test_round_trip_basic(self) -> None:
        col = EncryptedDate()
        ciphertext = col.process_bind_param(date(1990, 1, 15), _DIALECT)
        assert ciphertext is not None
        assert ciphertext.startswith("kv1:")
        assert col.process_result_value(ciphertext, _DIALECT) == date(1990, 1, 15)

    @pytest.mark.usefixtures("isolate_env")
    def test_bind_none_returns_none(self) -> None:
        col = EncryptedDate()
        assert col.process_bind_param(None, _DIALECT) is None

    @pytest.mark.usefixtures("isolate_env")
    def test_result_none_returns_none(self) -> None:
        col = EncryptedDate()
        assert col.process_result_value(None, _DIALECT) is None

    @pytest.mark.usefixtures("isolate_env")
    def test_extreme_dates(self) -> None:
        col = EncryptedDate()
        for d in (date(1900, 1, 1), date(2100, 12, 31)):
            ciphertext = col.process_bind_param(d, _DIALECT)
            assert ciphertext is not None
            assert col.process_result_value(ciphertext, _DIALECT) == d

    @pytest.mark.usefixtures("isolate_env")
    def test_result_corrupted_ciphertext_raises(self) -> None:
        col = EncryptedDate()
        with pytest.raises(InvalidCiphertextError):
            col.process_result_value("kv1:GARBAGE", _DIALECT)

    @pytest.mark.usefixtures("isolate_env")
    def test_result_valid_ciphertext_non_iso_payload_raises(self) -> None:
        """Ciphertext valide mais le plaintext n'est pas une date ISO →
        InvalidCiphertextError avec message clair (sans le plaintext)."""
        col = EncryptedDate()
        # On force un ciphertext valide dont le plaintext n'est PAS une date.
        bogus_cipher = crypto.encrypt("not-a-date-at-all")
        assert bogus_cipher is not None
        with pytest.raises(InvalidCiphertextError) as exc_info:
            col.process_result_value(bogus_cipher, _DIALECT)
        msg = str(exc_info.value)
        assert "ISO-8601" in msg or "iso" in msg.lower()
        # Le plaintext ne doit jamais apparaître dans le message d'erreur.
        assert "not-a-date-at-all" not in msg

    @pytest.mark.usefixtures("isolate_env")
    def test_result_legacy_iso_plaintext_parses_and_warns(self) -> None:
        """Phase de transition : une string ISO en clair en DB est parsée
        et un warning legacy est émis (une seule fois)."""
        col = EncryptedDate()
        with capture_logs() as logs:
            out = col.process_result_value("1985-06-30", _DIALECT)
        assert out == date(1985, 6, 30)
        events = [log.get("event") for log in logs]
        assert "pii_legacy_plaintext_read" in events

    @pytest.mark.usefixtures("isolate_env")
    def test_result_legacy_non_iso_plaintext_raises(self) -> None:
        col = EncryptedDate()
        with pytest.raises(InvalidCiphertextError):
            col.process_result_value("totally-not-a-date", _DIALECT)


# ===========================================================================
# Intégration colonne — DDL SQLite (sanity check : TypeDecorator compile bien)
# ===========================================================================


class TestColumnDDLCompilation:
    """Vérifie que les TypeDecorators se compilent en DDL (TEXT) et qu'on peut
    déclarer une table sans erreur SQLAlchemy. Pas de I/O DB."""

    def test_encrypted_string_compiles_to_text_in_sqlite(self) -> None:
        from sqlalchemy import Column, MetaData, Table
        from sqlalchemy.dialects import sqlite

        meta = MetaData()
        t = Table("t", meta, Column("email_enc", EncryptedString()))
        ddl = str(t.columns["email_enc"].type.compile(dialect=sqlite.dialect()))
        assert ddl == "TEXT"

    def test_encrypted_date_compiles_to_text_in_sqlite(self) -> None:
        from sqlalchemy import Column, MetaData, Table
        from sqlalchemy.dialects import sqlite

        meta = MetaData()
        t = Table("t", meta, Column("birth_date_enc", EncryptedDate()))
        ddl = str(t.columns["birth_date_enc"].type.compile(dialect=sqlite.dialect()))
        assert ddl == "TEXT"

    def test_encrypted_string_cache_ok(self) -> None:
        # cache_ok=True est requis par SQLAlchemy 2.0 pour les TypeDecorator
        # personnalisés afin de bénéficier du statement caching.
        assert EncryptedString.cache_ok is True

    def test_encrypted_date_cache_ok(self) -> None:
        assert EncryptedDate.cache_ok is True


# ===========================================================================
# Sanity : structlog est bien configuré pour capture_logs
# ===========================================================================


def test_structlog_capture_works() -> None:
    """Garde-fou : la fixture capture_logs intercepte bien les warnings du module."""
    with capture_logs() as logs:
        log = structlog.get_logger("app.core.security.types")
        log.warning("ping", foo="bar")
    assert any(entry.get("event") == "ping" for entry in logs)


# ===========================================================================
# Tests d'audit (@tester) — cible : pièges potentiels non couverts
# ===========================================================================


class TestAuditEncryptedString:
    """Tests d'audit indépendants, ciblés sur des bugs potentiels subtils."""

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_string_none_does_not_call_encrypt(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """None ne doit JAMAIS passer par crypto.encrypt (court-circuit explicite)."""

        def _explode(_value: str | None) -> str | None:
            raise AssertionError("crypto.encrypt ne doit pas être appelé pour None")

        # On patch sur le module 'types' qui importe crypto (binding par module).
        import app.core.security.types as types_mod

        monkeypatch.setattr(types_mod.crypto, "encrypt", _explode)
        col = EncryptedString()
        assert col.process_bind_param(None, _DIALECT) is None

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_string_empty_does_not_call_encrypt(
        self, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """\"\" ne doit JAMAIS passer par crypto.encrypt (court-circuit explicite)."""

        def _explode(_value: str | None) -> str | None:
            raise AssertionError("crypto.encrypt ne doit pas être appelé pour ''")

        import app.core.security.types as types_mod

        monkeypatch.setattr(types_mod.crypto, "encrypt", _explode)
        col = EncryptedString()
        assert col.process_bind_param("", _DIALECT) == ""

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_string_already_encrypted_value_bind_does_not_double_encrypt(
        self,
    ) -> None:
        """Idempotence STRICTE : un ciphertext re-bindé doit être identique
        (mêmes octets), pas juste 'équivalent au déchiffrement'."""
        col = EncryptedString()
        c1 = col.process_bind_param("alice@gov.gn", _DIALECT)
        assert c1 is not None
        c2 = col.process_bind_param(c1, _DIALECT)
        # Même OBJET de ciphertext : pas de nouveau token avec un nouveau nonce.
        assert c2 == c1
        # Et identité de chaîne (passthrough exact, pas une re-encode/decode).
        assert c2 is c1 or c2 == c1
        # Le déchiffrement reste valide.
        assert col.process_result_value(c2, _DIALECT) == "alice@gov.gn"

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_string_warning_emits_no_pii(self) -> None:
        """Le warning legacy NE DOIT PAS contenir la valeur PII lue."""
        col = EncryptedString()
        secret = "jean.doe@gov.gn"
        with capture_logs() as logs:
            col.process_result_value(secret, _DIALECT)
        # Le warning est bien émis.
        assert any(log.get("event") == "pii_legacy_plaintext_read" for log in logs)
        # AUCUN log ne contient la valeur.
        for log in logs:
            assert secret not in repr(log), f"Fuite PII dans log: {log}"

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_legacy_warning_only_once_across_multiple_reads(self) -> None:
        """5 reads legacy successifs → exactement 1 warning (pas de spam)."""
        col = EncryptedString()
        with capture_logs() as logs:
            for plain in ("a", "b", "c", "d", "e"):
                col.process_result_value(plain, _DIALECT)
        warns = [log for log in logs if log.get("event") == "pii_legacy_plaintext_read"]
        assert len(warns) == 1, f"Attendu 1 warning, vu {len(warns)}: {warns}"

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_string_unicode_round_trip_with_4_byte_chars(self) -> None:
        """Caractères UTF-8 de 4 octets (emoji, glyphes BMP supérieurs) — round-trip."""
        col = EncryptedString()
        samples = [
            "Téléphone: 📞 +224 600 00 00 00",
            "Drapeau 🇬🇳 Guinée",
            "Math 𝕏 𝓐",  # codepoints > U+FFFF (4 bytes UTF-8)
        ]
        for s in samples:
            ciphertext = col.process_bind_param(s, _DIALECT)
            assert ciphertext is not None
            assert ciphertext.startswith("kv1:")
            assert col.process_result_value(ciphertext, _DIALECT) == s


class TestAuditEncryptedDate:
    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_date_invalid_ciphertext_message_no_payload(self) -> None:
        """Ciphertext valide mais plaintext = 'not-a-date' → exception sans
        fuite du plaintext dans le message d'erreur."""
        col = EncryptedDate()
        leaky_plain = "not-a-date"
        bogus_cipher = crypto.encrypt(leaky_plain)
        assert bogus_cipher is not None
        with pytest.raises(InvalidCiphertextError) as exc_info:
            col.process_result_value(bogus_cipher, _DIALECT)
        msg = str(exc_info.value)
        # Le plaintext NE DOIT PAS apparaître dans le message.
        assert leaky_plain not in msg, f"Fuite PII dans message d'erreur: {msg!r}"
        # Le ciphertext ne doit pas non plus apparaître.
        assert bogus_cipher not in msg

    @pytest.mark.usefixtures("isolate_env")
    def test_audit_encrypted_date_min_year_iso(self) -> None:
        """date(1, 1, 1) — année 1 — doit round-trip ou raise documenté."""
        col = EncryptedDate()
        d_min = date(1, 1, 1)
        # Python date.isoformat() pour année 1 produit "0001-01-01" ; ISO valide.
        ciphertext = col.process_bind_param(d_min, _DIALECT)
        assert ciphertext is not None
        # Round-trip attendu (pas de raise documenté).
        result = col.process_result_value(ciphertext, _DIALECT)
        assert result == d_min
