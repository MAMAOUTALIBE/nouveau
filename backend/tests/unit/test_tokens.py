"""Tests unitaires : émission et validation des JWT."""

from __future__ import annotations

import time
from uuid import uuid4

import pytest
from app.core.errors import AuthenticationError
from app.core.security.tokens import (
    create_access_token,
    create_refresh_token,
    decode_token,
)


def _user_kwargs() -> dict[str, object]:
    return {
        "user_id": uuid4(),
        "username": "alice",
        "organization_id": uuid4(),
    }


def test_create_access_token_round_trip() -> None:
    kw = _user_kwargs()
    token, exp = create_access_token(**kw)  # type: ignore[arg-type]
    payload = decode_token(token, expected_type="access")
    assert payload.username == "alice"
    assert payload.type == "access"
    assert str(payload.user_id) == str(kw["user_id"])
    assert exp.timestamp() == pytest.approx(payload.exp, abs=2)


def test_create_refresh_token_round_trip() -> None:
    kw = _user_kwargs()
    token, _ = create_refresh_token(**kw)  # type: ignore[arg-type]
    payload = decode_token(token, expected_type="refresh")
    assert payload.type == "refresh"


def test_decode_rejects_wrong_type() -> None:
    kw = _user_kwargs()
    refresh, _ = create_refresh_token(**kw)  # type: ignore[arg-type]
    with pytest.raises(AuthenticationError, match="incorrect"):
        decode_token(refresh, expected_type="access")


def test_decode_rejects_garbage() -> None:
    with pytest.raises(AuthenticationError):
        decode_token("definitely.not.a.jwt")


def test_decode_rejects_expired(monkeypatch: pytest.MonkeyPatch) -> None:
    """En forçant un TTL négatif on simule un token déjà expiré."""
    from app.core.config import get_settings

    monkeypatch.setattr(
        get_settings(),
        "jwt_access_ttl_seconds",
        60,
    )
    kw = _user_kwargs()
    token, _ = create_access_token(**kw)  # type: ignore[arg-type]
    # On attend pour que le token expire (TTL trop court → on triche : on
    # patche aussi la fonction now). Solution simple : on retire 120s à la
    # date courante de validation.
    import jwt as pyjwt

    decoded = pyjwt.decode(
        token,
        get_settings().jwt_secret_key.get_secret_value(),
        algorithms=[get_settings().jwt_algorithm],
        options={"verify_exp": False},
    )
    decoded["exp"] = int(time.time()) - 10
    expired = pyjwt.encode(
        decoded,
        get_settings().jwt_secret_key.get_secret_value(),
        algorithm=get_settings().jwt_algorithm,
    )
    with pytest.raises(AuthenticationError, match="expir"):
        decode_token(expired)
