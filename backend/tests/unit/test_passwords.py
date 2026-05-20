"""Tests unitaires : hachage et vérification de mots de passe."""

from __future__ import annotations

import pytest
from app.core.security.passwords import hash_password, verify_password


def test_hash_password_returns_non_empty_string() -> None:
    h = hash_password("MotDePasse-Strong-2026")
    assert isinstance(h, str)
    assert len(h) > 30
    assert h != "MotDePasse-Strong-2026"


def test_hash_password_is_salted_each_call() -> None:
    a = hash_password("identique")
    b = hash_password("identique")
    assert a != b  # bcrypt sale chaque hash


def test_verify_password_accepts_valid() -> None:
    h = hash_password("MotDePasse-Valide")
    assert verify_password("MotDePasse-Valide", h) is True


def test_verify_password_rejects_invalid() -> None:
    h = hash_password("BonMotDePasse")
    assert verify_password("MauvaisMotDePasse", h) is False


def test_verify_password_rejects_empty_inputs() -> None:
    h = hash_password("dummy")
    assert verify_password("", h) is False
    assert verify_password("dummy", "") is False


def test_hash_password_rejects_empty() -> None:
    with pytest.raises(ValueError, match="vide"):
        hash_password("")
