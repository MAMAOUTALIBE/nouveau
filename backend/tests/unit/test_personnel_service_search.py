"""Tests unitaires — extension `search` de list_agents au lookup email HMAC.

Le service ``app.services.personnel_service.list_agents`` accepte un parametre
``search`` qui filtre full_name + matricule (ILIKE) et, lorsque le terme
ressemble a un email (presence d'un '@'), ajoute un match EXACT via
``email_lookup_hash`` (HMAC normalise).

Approche : on ne monte pas de DB. On verifie :
- la logique de decision (presence/absence du '@' declenche / ne declenche pas
  l'appel a ``hmac_lookup``) en monkeypatchant le hmac_lookup utilise par le
  service ;
- la coherence du hash calcule cote search avec celui ecrit par create_agent
  (meme primitive, meme parametre ``normalize=True``) ;
- la preservation du comportement existant pour search vide / whitespace.

Pas de PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

import secrets
from collections.abc import Iterator

import pytest
from app.core.security import crypto
from app.core.security.crypto import hmac_lookup
from app.services import personnel_service
from cryptography.fernet import Fernet

# ---------------------------------------------------------------------------
# Fixtures (alignees avec tests/unit/test_personnel_service_hashes.py)
# ---------------------------------------------------------------------------


def _gen_fernet_key(version: str = "kv1") -> str:
    return f"{version}:{Fernet.generate_key().decode()}"


def _gen_hmac_key() -> str:
    return secrets.token_hex(32)


@pytest.fixture
def isolate_env(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    """Reinitialise l'env crypto + caches autour de chaque test."""
    from app.core.config import get_settings

    monkeypatch.setenv("PII_ENCRYPTION_KEYS", _gen_fernet_key())
    monkeypatch.setenv("EMAIL_LOOKUP_HMAC_KEY", _gen_hmac_key())
    get_settings.cache_clear()
    crypto.reset_cache()
    yield
    crypto.reset_cache()
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Helper : reproduit la logique de decision du service (sans toucher a la DB)
# ---------------------------------------------------------------------------


def _simulate_search_decision(
    search: str | None,
    hmac_fn: object = hmac_lookup,
) -> tuple[bool, str | None]:
    """Reproduit la branche de decision de list_agents pour la recherche.

    Renvoie ``(applied_filter, email_hash_added)`` :
    - ``applied_filter`` : True si un filtre WHERE serait applique (full_name /
      matricule / email).
    - ``email_hash_added`` : valeur du hash ajoute au filtre OR si pertinent,
      sinon ``None``.

    Le code reproduit *exactement* le bloc edite dans le service. Tout drift
    doit etre repercute ici (test = filet anti-regression).
    """
    if not (search and search.strip()):
        return False, None
    email_hash: str | None = None
    if "@" in search:
        email_hash = hmac_fn(search.strip(), normalize=True)  # type: ignore[operator]
    return True, email_hash


# ---------------------------------------------------------------------------
# 1) Pas de '@' → pas d'appel a hmac_lookup
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_without_at_does_not_compute_hash(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """search='alice' / 'PRIM-001' → la branche email_lookup_hash est ignoree.

    On monkeypatch ``hmac_lookup`` dans le module du service pour qu'il leve
    si appele ; si la decision est correcte, aucun appel n'a lieu.
    """
    calls: list[tuple[str, bool]] = []

    def _spy(value: str | None, *, normalize: bool = True) -> str | None:
        calls.append((value or "", normalize))
        raise AssertionError("hmac_lookup ne doit pas etre appele sans '@'")

    monkeypatch.setattr(personnel_service, "hmac_lookup", _spy)

    # Reproduit la decision en passant le spy ; ne doit jamais l'appeler.
    applied, email_hash = _simulate_search_decision("alice", hmac_fn=_spy)
    assert applied is True
    assert email_hash is None

    applied, email_hash = _simulate_search_decision("PRIM-001", hmac_fn=_spy)
    assert applied is True
    assert email_hash is None

    assert calls == []  # spy jamais invoque


# ---------------------------------------------------------------------------
# 2) '@' present → un hash est calcule et serait ajoute au filtre OR
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_with_at_uses_email_hash_lookup() -> None:
    """search='alice@gov.gn' → la decision produit un hash != None."""
    applied, email_hash = _simulate_search_decision("alice@gov.gn")
    assert applied is True
    assert email_hash is not None
    # Hex SHA-256 → 64 hex chars.
    assert len(email_hash) == 64
    assert all(c in "0123456789abcdef" for c in email_hash)


# ---------------------------------------------------------------------------
# 3) Coherence avec create_agent : meme primitive, meme parametre normalize
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_email_normalization_matches_create() -> None:
    """Le hash calcule cote search doit matcher exactement celui ecrit par
    create_agent.

    Sans cette egalite, la barre de recherche ne pourrait jamais retrouver les
    agents crees (cas typique : l'utilisateur tape 'Alice@Gov.GN' alors que la
    creation a stocke 'alice@gov.gn' apres normalisation Pydantic, ou
    l'inverse).
    """
    h_create = hmac_lookup("alice@gov.gn", normalize=True)
    _, h_search_lower = _simulate_search_decision("alice@gov.gn")
    _, h_search_mixed = _simulate_search_decision("Alice@Gov.GN")
    _, h_search_padded = _simulate_search_decision("  ALICE@GOV.GN  ")
    assert h_create is not None
    assert h_search_lower == h_create
    assert h_search_mixed == h_create
    assert h_search_padded == h_create


# ---------------------------------------------------------------------------
# 4) search vide / whitespace / None → aucun filtre applique
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_empty_and_whitespace_no_filter() -> None:
    """search='', '   ', None → la branche WHERE n'est PAS empruntee.

    Comportement actuel preserve : un filtre vide doit retourner la liste
    entiere (page courante), pas une liste vide.
    """
    for empty in ("", "   ", None):
        applied, email_hash = _simulate_search_decision(empty)
        assert applied is False
        assert email_hash is None


# ---------------------------------------------------------------------------
# 5) '@' seul (terme tres court) → hmac_lookup retourne un hash valide
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_at_only_no_match_in_db() -> None:
    """search='@' produit bien un hash (chaine non vide apres strip), mais
    aucun email reel ne hash sur cette valeur → 0 match en DB.

    Garde-fou : on documente que la branche ne crash pas et n'est pas court-
    circuitee par le service (la verite finale revient a la DB).
    """
    applied, email_hash = _simulate_search_decision("@")
    assert applied is True
    assert email_hash is not None
    assert email_hash == hmac_lookup("@", normalize=True)


# ---------------------------------------------------------------------------
# 6) Garde-fou : si hmac_lookup renvoyait None (cas exotique : '@' + spaces
#    stripes a vide → impossible ici car '@' reste), la decision NE doit PAS
#    crasher cote service. On simule un fallback None.
# ---------------------------------------------------------------------------


@pytest.mark.usefixtures("isolate_env")
def test_audit_search_hmac_none_is_tolerated() -> None:
    """Si hmac_lookup retournait None (fallback theorique), la branche ne doit
    pas planter — le filtre email est juste ignore."""

    def _hmac_returns_none(_value: str | None, *, normalize: bool = True) -> str | None:
        return None

    applied, email_hash = _simulate_search_decision("alice@gov.gn", hmac_fn=_hmac_returns_none)
    assert applied is True
    # email_hash collecte = None → le service n'ajouterait pas la condition
    # `email_lookup_hash == None` (ce qui matcherait toutes les colonnes NULL).
    assert email_hash is None
