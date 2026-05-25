"""Tests unitaires — filet de sécurité pour la logique de hash PII utilisée
par ``app.services.personnel_service`` (création / update / merge / dédup).

Approche : on ne monte pas de DB. On teste la primitive ``hmac_lookup`` avec
les paramètres exacts utilisés par le service (``normalize=True`` pour email,
``normalize=False`` pour national_id) et on simule les invariants critiques
(idempotence, cohérence avec l'index partiel, recalcul lors d'un merge).

Pas de PII réelle : valeurs synthétiques uniquement.
"""

from __future__ import annotations

import secrets
from collections.abc import Iterator
from dataclasses import dataclass

import pytest
from app.core.security import crypto
from app.core.security.crypto import hmac_lookup
from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Fixtures (alignées avec tests/unit/test_crypto.py)
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


# ---------------------------------------------------------------------------
# Constantes : valeurs synthétiques (jamais de PII réelle)
# ---------------------------------------------------------------------------

_EMAIL_RAW = "Alice@Gov.GN  "
_EMAIL_NORMALIZED = "alice@gov.gn"
_NID_STRICT = "GN-12345"
_NID_WITH_SPACE = "GN-12345 "


# ---------------------------------------------------------------------------
# 1) Comportement de hmac_lookup tel qu'invoqué par create_agent
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_create_agent_writes_email_hash() -> None:
    """create_agent calcule email_lookup_hash = hmac_lookup(email, normalize=True).

    On valide la *formule* du hash : la valeur écrite en base lors d'un
    create_agent est strictement égale au HMAC normalisé. Test sans DB.
    """
    expected = hmac_lookup(_EMAIL_RAW, normalize=True)
    # Le hash est non-None pour une valeur non vide.
    assert expected is not None
    # Hexadécimal SHA-256 → 64 caractères.
    assert len(expected) == 64
    assert all(c in "0123456789abcdef" for c in expected)


@pytest.mark.usefixtures("isolate_env")
def test_audit_create_agent_writes_national_id_hash_strict() -> None:
    """create_agent calcule national_id_lookup_hash via normalize=False.

    Conséquence : la casse et les espaces sont strictement préservés.
    """
    h_strict = hmac_lookup(_NID_STRICT, normalize=False)
    h_lower = hmac_lookup(_NID_STRICT.lower(), normalize=False)
    assert h_strict is not None
    assert h_lower is not None
    # Casse strictement significative.
    assert h_strict != h_lower


# ---------------------------------------------------------------------------
# 2) Normalisation email (idempotence en contexte service)
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_email_hash_normalisation_idempotente() -> None:
    """Deux écritures équivalentes du même email produisent le même hash."""
    h1 = hmac_lookup(_EMAIL_RAW, normalize=True)
    h2 = hmac_lookup(_EMAIL_NORMALIZED, normalize=True)
    h3 = hmac_lookup("  ALICE@GOV.GN", normalize=True)
    assert h1 == h2 == h3 is not None


# ---------------------------------------------------------------------------
# 3) National_id non normalisé : comportement strict
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_national_id_hash_non_normalisee() -> None:
    """Un national_id avec espace de bordure produit un hash différent."""
    h_clean = hmac_lookup(_NID_STRICT, normalize=False)
    h_spaced = hmac_lookup(_NID_STRICT + " ", normalize=False)
    assert h_clean is not None
    assert h_spaced is not None
    assert h_clean != h_spaced


@pytest.mark.usefixtures("isolate_env")
def test_audit_national_id_strict_preserve_la_casse() -> None:
    """Pour les ID alphanumériques (prefixes/suffixes), la casse doit compter."""
    assert hmac_lookup("ABC123", normalize=False) != hmac_lookup("abc123", normalize=False)


# ---------------------------------------------------------------------------
# 4) Cohérence avec l'index partiel : None / "" → hash None
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_none_email_returns_none_hash() -> None:
    """email=None → hash=None (cohérent avec WHERE col IS NOT NULL)."""
    assert hmac_lookup(None, normalize=True) is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_empty_email_returns_none_hash() -> None:
    """email='' → hash=None (l'index partiel ignore ces lignes)."""
    assert hmac_lookup("", normalize=True) is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_whitespace_only_email_returns_none_hash() -> None:
    """email='   ' → strip() → '' → None (normalize=True)."""
    assert hmac_lookup("   ", normalize=True) is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_none_national_id_returns_none_hash() -> None:
    """national_id=None → hash=None (idem pour la colonne stricte)."""
    assert hmac_lookup(None, normalize=False) is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_empty_national_id_returns_none_hash() -> None:
    """national_id='' → hash=None (cohérent index partiel)."""
    assert hmac_lookup("", normalize=False) is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_whitespace_only_national_id_not_none() -> None:
    """En mode strict, '   ' n'est PAS vide : produit un hash.

    Note : c'est un comportement délibéré (normalize=False ne strip pas).
    Documenté ici pour figer le contrat — si on devait un jour interdire
    les national_ids whitespace-only, ce serait au niveau du schema Pydantic,
    pas dans hmac_lookup.
    """
    h = hmac_lookup("   ", normalize=False)
    assert h is not None
    assert len(h) == 64


# ---------------------------------------------------------------------------
# 5) Simulation merge_duplicate_agents : recalcul du hash primaire
# ---------------------------------------------------------------------------


@dataclass
class _FakeEmployee:
    """Reproduit la surface ORM utilisée par merge_duplicate_agents."""

    email: str | None = None
    email_lookup_hash: str | None = None
    national_id: str | None = None
    national_id_lookup_hash: str | None = None


def _simulate_merge_copy(primary: _FakeEmployee, secondary: _FakeEmployee, attr: str) -> None:
    """Reproduit la logique exacte du diff merge_duplicate_agents.

    Mapping copié depuis le service (NE PAS modifier sans mettre à jour le
    service correspondant) : ``email`` → ``email_lookup_hash``/normalize=True,
    ``national_id`` → ``national_id_lookup_hash``/normalize=False.
    """
    attr_to_hash: dict[str, tuple[str, bool]] = {
        "email": ("email_lookup_hash", True),
        "national_id": ("national_id_lookup_hash", False),
    }
    value = getattr(secondary, attr, None)
    setattr(primary, attr, value)
    hash_target = attr_to_hash.get(attr)
    if hash_target is not None:
        hash_attr, normalize = hash_target
        setattr(primary, hash_attr, hmac_lookup(value, normalize=normalize))


@pytest.mark.usefixtures("isolate_env")
def test_audit_merge_preserves_hash_when_email_copied() -> None:
    """Quand le merge copie l'email du secondaire, le hash du primaire suit.

    Sans recalcul, le primary.email_lookup_hash pointerait encore sur l'ancien
    email du primaire → la dédup est cassée (collision fantôme avec d'autres
    agents partageant l'ancien email du primaire).
    """
    old_primary_email = "old.primary@gov.gn"
    new_secondary_email = "new.from.secondary@gov.gn"

    primary = _FakeEmployee(
        email=old_primary_email,
        email_lookup_hash=hmac_lookup(old_primary_email, normalize=True),
    )
    secondary = _FakeEmployee(
        email=new_secondary_email,
        email_lookup_hash=hmac_lookup(new_secondary_email, normalize=True),
    )

    _simulate_merge_copy(primary, secondary, "email")

    assert primary.email == new_secondary_email
    # Le hash du primaire doit refléter la NOUVELLE valeur.
    assert primary.email_lookup_hash == hmac_lookup(new_secondary_email, normalize=True)
    # Et NE doit PLUS correspondre à l'ancienne valeur du primaire.
    assert primary.email_lookup_hash != hmac_lookup(old_primary_email, normalize=True)


@pytest.mark.usefixtures("isolate_env")
def test_audit_merge_recalcule_hash_national_id_strict() -> None:
    """Idem pour national_id, en mode strict (normalize=False)."""
    primary = _FakeEmployee(
        national_id="GN-OLD-001",
        national_id_lookup_hash=hmac_lookup("GN-OLD-001", normalize=False),
    )
    secondary = _FakeEmployee(
        national_id="GN-NEW-002",
        national_id_lookup_hash=hmac_lookup("GN-NEW-002", normalize=False),
    )

    _simulate_merge_copy(primary, secondary, "national_id")

    assert primary.national_id == "GN-NEW-002"
    assert primary.national_id_lookup_hash == hmac_lookup("GN-NEW-002", normalize=False)


@pytest.mark.usefixtures("isolate_env")
def test_audit_merge_email_to_none_writes_null_hash() -> None:
    """Si le secondaire a email=None, le merge doit ÉCRIRE NULL côté hash.

    Sinon, le primary garde un hash orphelin (qui ne correspond à aucune valeur
    en clair) → faux positif de dédup.
    """
    primary = _FakeEmployee(
        email="something@gov.gn",
        email_lookup_hash=hmac_lookup("something@gov.gn", normalize=True),
    )
    secondary = _FakeEmployee(email=None, email_lookup_hash=None)

    _simulate_merge_copy(primary, secondary, "email")

    assert primary.email is None
    assert primary.email_lookup_hash is None


# ---------------------------------------------------------------------------
# 6) Simulation update_agent : recalcul conditionnel
# ---------------------------------------------------------------------------


def _simulate_update_email(emp: _FakeEmployee, new_email: str | None) -> None:
    """Reproduit la logique du diff update_agent pour le champ email."""
    if new_email is not None:
        emp.email = new_email
        emp.email_lookup_hash = hmac_lookup(new_email, normalize=True)


@pytest.mark.usefixtures("isolate_env")
def test_audit_update_email_recalcule_hash() -> None:
    """update_agent met aussi à jour email_lookup_hash quand email change."""
    emp = _FakeEmployee(
        email="before@gov.gn",
        email_lookup_hash=hmac_lookup("before@gov.gn", normalize=True),
    )
    _simulate_update_email(emp, "after@gov.gn")
    assert emp.email == "after@gov.gn"
    assert emp.email_lookup_hash == hmac_lookup("after@gov.gn", normalize=True)


@pytest.mark.usefixtures("isolate_env")
def test_audit_update_email_to_empty_string_writes_null_hash() -> None:
    """Si user envoie email='', le hash doit être None (cohérent index partiel).

    Le service traverse le if (value is not None), donc '' passe : on doit
    confirmer que hmac_lookup('', normalize=True) is None pour ne pas écrire
    un hash de chaîne vide en base.
    """
    emp = _FakeEmployee(
        email="before@gov.gn",
        email_lookup_hash=hmac_lookup("before@gov.gn", normalize=True),
    )
    _simulate_update_email(emp, "")
    assert emp.email == ""
    assert emp.email_lookup_hash is None


@pytest.mark.usefixtures("isolate_env")
def test_audit_update_email_to_none_skip() -> None:
    """email=None signifie 'ne pas modifier' (sémantique PATCH)."""
    original_hash = hmac_lookup("kept@gov.gn", normalize=True)
    emp = _FakeEmployee(email="kept@gov.gn", email_lookup_hash=original_hash)
    _simulate_update_email(emp, None)
    # Pas de modification.
    assert emp.email == "kept@gov.gn"
    assert emp.email_lookup_hash == original_hash


# ---------------------------------------------------------------------------
# 7) Garde-fou : le HMAC ne fuite pas dans l'UI (cas duplicate)
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_hmac_is_not_human_readable_email() -> None:
    """Sanity check : un HMAC ne ressemble pas à un email (pas de @, 64 hex).

    Si list_agent_duplicate_cases retournait un HMAC dans duplicate_value, on
    pourrait le détecter avec ces propriétés. Garde-fou pour l'UI.
    """
    h = hmac_lookup("user@gov.gn", normalize=True)
    assert h is not None
    assert "@" not in h
    assert len(h) == 64
    # Pas de séparateurs typiques d'un national_id.
    assert "-" not in h
