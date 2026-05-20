"""Tests unitaires du strip-PII dans le pipeline structlog.

Couvre les cas critiques :
* clés sensibles (password, jwt, national_id_number, etc.) → REDACTED ;
* JWT inline dans une valeur libre → masqué par regex ;
* Bearer token dans Authorization → masqué ;
* récursion sur dict/list imbriqués ;
* clés non sensibles préservées intactes.
"""

from __future__ import annotations

from app.core.logging import _strip_pii


def _run(event: dict[str, object]) -> dict[str, object]:
    return _strip_pii(None, "info", event)


def test_password_is_redacted() -> None:
    out = _run({"event": "login", "password": "Sup3rS3cret!"})
    assert out["password"] == "[REDACTED]"
    assert out["event"] == "login"


def test_token_keys_are_redacted_case_insensitive() -> None:
    out = _run(
        {
            "event": "auth",
            "Token": "abcdef123",
            "ACCESS_TOKEN": "xyz",
            "refresh_token": "qrs",
        }
    )
    assert out["Token"] == "[REDACTED]"
    assert out["ACCESS_TOKEN"] == "[REDACTED]"
    assert out["refresh_token"] == "[REDACTED]"


def test_pii_health_birthdate_redacted() -> None:
    out = _run(
        {
            "event": "view_dependent",
            "national_id_number": "GN-123456",
            "dependent_birthdate": "2010-04-12",
            "dependent_health_status": "asthma",
        }
    )
    assert out["national_id_number"] == "[REDACTED]"
    assert out["dependent_birthdate"] == "[REDACTED]"
    assert out["dependent_health_status"] == "[REDACTED]"


def test_jwt_pattern_in_free_text_is_masked() -> None:
    jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    out = _run({"event": "request_in", "raw_url": f"/login?token={jwt}"})
    assert "eyJ" not in out["raw_url"]  # type: ignore[operator]
    assert "REDACTED_JWT" in out["raw_url"]  # type: ignore[operator]


def test_bearer_token_in_value_is_masked() -> None:
    out = _run({"event": "headers", "x_authorization": "Bearer aaaabbbbccccddddeeeeffff"})
    assert "Bearer [REDACTED]" in out["x_authorization"]  # type: ignore[operator]


def test_nested_dict_is_walked() -> None:
    out = _run(
        {
            "event": "audit",
            "payload": {
                "user": "marie@gov.gn",
                "secret": "topsecret",
                "nested": {"api_key": "k", "ok": "v"},
            },
        }
    )
    payload = out["payload"]
    assert isinstance(payload, dict)
    assert payload["secret"] == "[REDACTED]"
    nested = payload["nested"]
    assert isinstance(nested, dict)
    assert nested["api_key"] == "[REDACTED]"
    assert nested["ok"] == "v"
    assert payload["user"] == "marie@gov.gn"  # email-pro non sensible côté logs


def test_list_is_walked() -> None:
    out = _run(
        {
            "event": "batch",
            "items": [
                {"password": "p1", "name": "A"},
                {"password": "p2", "name": "B"},
            ],
        }
    )
    items = out["items"]
    assert isinstance(items, list)
    assert items[0]["password"] == "[REDACTED]"
    assert items[1]["password"] == "[REDACTED]"
    assert items[0]["name"] == "A"


def test_non_sensitive_keys_are_untouched() -> None:
    payload: dict[str, object] = {
        "event": "leave_request_created",
        "request_id": "REQ-2026-00012",
        "user_id": "u-abc",
        "leave_type": "ANNUAL",
        "duration_days": 5,
    }
    out = _run(dict(payload))
    assert out == payload
