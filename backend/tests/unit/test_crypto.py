"""Tests unitaires : module crypto (Fernet + HMAC lookup)."""

from __future__ import annotations

import secrets
from collections.abc import Iterator

import pytest
from app.core.security import crypto
from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _gen_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _gen_hmac_key() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def isolate_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Réinitialise l'env crypto + les caches autour de chaque test."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", _gen_fernet_key())
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", _gen_hmac_key())
    get_settings.cache_clear()
    crypto.reset_cache()
    yield
    crypto.reset_cache()
    get_settings.cache_clear()


@pytest.fixture
def no_keys(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Vide les variables PII pour tester KeyMissingError."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", "")
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", "")
    get_settings.cache_clear()
    crypto.reset_cache()
    yield
    crypto.reset_cache()
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# encrypt / decrypt
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_encrypt_decrypt_round_trip_ascii() -> None:
    token = crypto.encrypt("hello world")
    assert isinstance(token, str)
    assert token.startswith("kv1:")
    assert crypto.decrypt(token) == "hello world"


@pytest.mark.usefixtures("isolate_env")
def test_encrypt_decrypt_round_trip_utf8() -> None:
    samples = [
        "Café à l'éclair",
        "Sékou Touré — Conakry 🇬🇳",
        "中文测试",
        "𠜎 emoji 😀",
    ]
    for s in samples:
        token = crypto.encrypt(s)
        assert token is not None
        assert crypto.decrypt(token) == s


@pytest.mark.usefixtures("isolate_env")
def test_encrypt_none_returns_none() -> None:
    assert crypto.encrypt(None) is None


@pytest.mark.usefixtures("isolate_env")
def test_encrypt_empty_string_returns_empty() -> None:
    # Une chaîne vide n'a pas besoin d'être chiffrée — on garde "" tel quel.
    assert crypto.encrypt("") == ""


@pytest.mark.usefixtures("isolate_env")
def test_decrypt_none_returns_none() -> None:
    assert crypto.decrypt(None) is None


@pytest.mark.usefixtures("isolate_env")
def test_decrypt_empty_string_returns_empty() -> None:
    assert crypto.decrypt("") == ""


@pytest.mark.usefixtures("isolate_env")
def test_two_encryptions_differ_but_decrypt_equal() -> None:
    a = crypto.encrypt("identique")
    b = crypto.encrypt("identique")
    assert a is not None
    assert b is not None
    assert a != b  # nonce aléatoire → ciphertexts distincts
    assert crypto.decrypt(a) == "identique"
    assert crypto.decrypt(b) == "identique"


@pytest.mark.usefixtures("isolate_env")
def test_decrypt_corrupted_ciphertext_raises() -> None:
    token = crypto.encrypt("secret")
    assert token is not None
    # Corruption d'un caractère du token (après le préfixe).
    head, _, tail = token.partition(":")
    corrupted = f"{head}:A{tail[1:]}" if tail else f"{head}:XYZ"
    with pytest.raises(crypto.InvalidCiphertextError):
        crypto.decrypt(corrupted)


@pytest.mark.usefixtures("isolate_env")
def test_decrypt_unknown_version_raises() -> None:
    with pytest.raises(crypto.InvalidCiphertextError):
        crypto.decrypt("kv99:somethingthatlookslikeatokenbutisnt")


@pytest.mark.usefixtures("isolate_env")
def test_decrypt_without_prefix_raises() -> None:
    with pytest.raises(crypto.InvalidCiphertextError):
        crypto.decrypt("noprefix-just-some-string")


# ---------------------------------------------------------------------------
# Rotation
# ---------------------------------------------------------------------------


def test_rotation_old_ciphertext_still_decrypts(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import get_settings

    old_key = _gen_fernet_key("kv1")
    new_key = _gen_fernet_key("kv2")
    hmac_key = _gen_hmac_key()

    # 1) On chiffre avec une clé seule.
    monkeypatch.setenv("PII_ENCRYPTION_KEYS", old_key)
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", hmac_key)
    get_settings.cache_clear()
    crypto.reset_cache()
    old_token = crypto.encrypt("legacy data")
    assert old_token is not None
    assert old_token.startswith("kv1:")

    # 2) Rotation : on AJOUTE kv2 en tête (nouvelle clé d'écriture).
    monkeypatch.setenv("PII_ENCRYPTION_KEYS", f"{new_key},{old_key}")
    get_settings.cache_clear()
    crypto.reset_cache()

    # Les anciens ciphertexts kv1 doivent toujours se déchiffrer.
    assert crypto.decrypt(old_token) == "legacy data"

    # Les nouveaux ciphertexts portent désormais le préfixe kv2.
    new_token = crypto.encrypt("fresh data")
    assert new_token is not None
    assert new_token.startswith("kv2:")
    assert crypto.decrypt(new_token) == "fresh data"

    crypto.reset_cache()
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Erreurs de configuration
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("no_keys")
def test_encrypt_without_keys_raises() -> None:
    with pytest.raises(crypto.KeyMissingError):
        crypto.encrypt("anything")


@pytest.mark.usefixtures("no_keys")
def test_decrypt_without_keys_raises() -> None:
    with pytest.raises(crypto.KeyMissingError):
        crypto.decrypt("kv1:whatever")


def test_parse_pii_keys_rejects_malformed_entry() -> None:
    # Test direct du parseur — la regex de config est plus stricte mais le
    # parseur doit lui aussi détecter ses propres erreurs.
    with pytest.raises(crypto.CryptoError):
        crypto._parse_pii_keys("not-a-valid-entry")


def test_parse_pii_keys_rejects_invalid_fernet_key() -> None:
    # Une clé syntaxiquement plausible mais non base64-urlsafe valide.
    with pytest.raises(crypto.CryptoError):
        crypto._parse_pii_keys("kv1:not_a_real_fernet_key_just_chars")


def test_parse_pii_keys_rejects_duplicate_version() -> None:
    valid = Fernet.generate_key().decode()
    with pytest.raises(crypto.CryptoError, match="dupli"):
        crypto._parse_pii_keys(f"kv1:{valid},kv1:{valid}")


def test_parse_pii_keys_empty_raises_key_missing() -> None:
    with pytest.raises(crypto.KeyMissingError):
        crypto._parse_pii_keys("")
    with pytest.raises(crypto.KeyMissingError):
        crypto._parse_pii_keys("   ")


def test_parse_hmac_key_rejects_short_key() -> None:
    with pytest.raises(crypto.CryptoError, match="longueur"):
        crypto._parse_hmac_key("aa" * 16)


def test_parse_hmac_key_rejects_non_hex() -> None:
    with pytest.raises(crypto.CryptoError, match="hex"):
        crypto._parse_hmac_key("Z" * 64)


# ---------------------------------------------------------------------------
# is_encrypted
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_is_encrypted_true_for_known_prefix() -> None:
    token = crypto.encrypt("hello")
    assert token is not None
    assert crypto.is_encrypted(token) is True


@pytest.mark.usefixtures("isolate_env")
def test_is_encrypted_false_for_plain() -> None:
    assert crypto.is_encrypted("plain text") is False
    assert crypto.is_encrypted("") is False


@pytest.mark.usefixtures("isolate_env")
def test_is_encrypted_false_for_none() -> None:
    assert crypto.is_encrypted(None) is False


@pytest.mark.usefixtures("isolate_env")
def test_is_encrypted_false_for_unknown_version() -> None:
    # Format structurel OK mais version inconnue dans le bundle.
    assert crypto.is_encrypted("kv42:foo") is False


@pytest.mark.usefixtures("isolate_env")
def test_is_encrypted_non_string() -> None:
    assert crypto.is_encrypted(123) is False  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# hmac_lookup
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_hmac_lookup_deterministic() -> None:
    a = crypto.hmac_lookup("alice@example.com")
    b = crypto.hmac_lookup("alice@example.com")
    assert a == b
    assert a is not None
    assert len(a) == 64  # SHA-256 hex = 64 chars
    int(a, 16)  # format hex valide


@pytest.mark.usefixtures("isolate_env")
def test_hmac_lookup_case_insensitive_when_normalized() -> None:
    a = crypto.hmac_lookup("Alice@Example.COM")
    b = crypto.hmac_lookup("alice@example.com")
    c = crypto.hmac_lookup("  alice@example.com  ")
    assert a == b == c


@pytest.mark.usefixtures("isolate_env")
def test_hmac_lookup_case_sensitive_when_not_normalized() -> None:
    a = crypto.hmac_lookup("Alice", normalize=False)
    b = crypto.hmac_lookup("alice", normalize=False)
    assert a != b


@pytest.mark.usefixtures("isolate_env")
def test_hmac_lookup_none_and_empty() -> None:
    assert crypto.hmac_lookup(None) is None
    assert crypto.hmac_lookup("") is None
    assert crypto.hmac_lookup("   ") is None  # strip → vide


@pytest.mark.usefixtures("isolate_env")
def test_hmac_lookup_distinct_values_distinct_hashes() -> None:
    a = crypto.hmac_lookup("alice@example.com")
    b = crypto.hmac_lookup("bob@example.com")
    assert a is not None
    assert b is not None
    assert a != b


# ---------------------------------------------------------------------------
# Robustesse globale : reset_cache fonctionne
# ---------------------------------------------------------------------------


def test_reset_cache_picks_up_env_changes(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.core.config import get_settings

    k1 = _gen_fernet_key("kv1")
    k2 = _gen_fernet_key("kv1")
    hmac_key = _gen_hmac_key()

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", k1)
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", hmac_key)
    get_settings.cache_clear()
    crypto.reset_cache()
    token_a = crypto.encrypt("payload")

    # Change la clé puis reset → on bascule sur k2 ; le décryptage doit
    # échouer (clé différente sous le même préfixe kv1).
    monkeypatch.setenv("PII_ENCRYPTION_KEYS", k2)
    get_settings.cache_clear()
    crypto.reset_cache()

    assert token_a is not None
    with pytest.raises(crypto.InvalidCiphertextError):
        crypto.decrypt(token_a)

    crypto.reset_cache()
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Audit @tester — anti-bug evidence checks
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_ciphertext_does_not_leak_plaintext() -> None:
    """Protection anti-bug évident : le plaintext ne doit JAMAIS apparaître
    en clair dans le ciphertext produit. Vérifie sur valeur ASCII et UTF-8."""
    plain_ascii = "alice"
    plain_utf8 = "Sékou_Touré"
    cipher_ascii = crypto.encrypt(plain_ascii)
    cipher_utf8 = crypto.encrypt(plain_utf8)
    assert cipher_ascii is not None
    assert cipher_utf8 is not None
    assert plain_ascii not in cipher_ascii
    # Pour l'UTF-8, on vérifie aussi qu'aucun sous-fragment du plaintext
    # n'apparaît (au-delà du préfixe kv1:).
    body_utf8 = cipher_utf8.split(":", 1)[1]
    assert "Sékou" not in body_utf8
    assert "Touré" not in body_utf8


@pytest.mark.usefixtures("isolate_env")
def test_audit_decrypt_known_prefix_unknown_key_raises_clear_error(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Un ciphertext avec préfixe `kvN:` syntaxiquement valide mais dont la
    version N n'est pas connue du bundle → InvalidCiphertextError lisible
    (pas un KeyError Python brut)."""
    # Le bundle ne contient que kv1. On forge un ciphertext kv7:... bien formé.
    # Il doit lever InvalidCiphertextError avant même la tentative Fernet.
    with pytest.raises(crypto.InvalidCiphertextError) as exc_info:
        crypto.decrypt("kv7:gAAAAABh-fake-token-with-good-prefix")
    msg = str(exc_info.value)
    # Le message doit être lisible et mentionner la version inconnue.
    assert "kv7" in msg or "inconnue" in msg.lower() or "unknown" in msg.lower()
    # Et ne doit PAS être un KeyError brut.
    assert "KeyError" not in repr(exc_info.value)


@pytest.mark.usefixtures("isolate_env")
def test_audit_hmac_lookup_normalize_handles_whitespace_and_case() -> None:
    """Avec normalize=True : `  Alice@Gov.gn  ` et `alice@gov.gn` doivent
    produire le MÊME hash. Avec normalize=False, ils doivent différer."""
    raw_messy = "  Alice@Gov.gn  "
    raw_canonical = "alice@gov.gn"
    h_messy_norm = crypto.hmac_lookup(raw_messy, normalize=True)
    h_canon_norm = crypto.hmac_lookup(raw_canonical, normalize=True)
    h_messy_raw = crypto.hmac_lookup(raw_messy, normalize=False)
    h_canon_raw = crypto.hmac_lookup(raw_canonical, normalize=False)
    assert h_messy_norm == h_canon_norm
    assert h_messy_raw != h_canon_raw


def test_audit_encrypt_without_keys_clear_error_message(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Sans PII_ENCRYPTION_KEYS configuré : KeyMissingError lisible (pas un
    stacktrace opaque)."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", "")
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", "")
    get_settings.cache_clear()
    crypto.reset_cache()
    try:
        with pytest.raises(crypto.KeyMissingError) as exc_info:
            crypto.encrypt("anything")
        msg = str(exc_info.value)
        # Le message doit nommer la variable d'env manquante.
        assert "PII_ENCRYPTION_KEYS" in msg
        assert len(msg) > 10  # pas un message vide / opaque
    finally:
        crypto.reset_cache()
        get_settings.cache_clear()
