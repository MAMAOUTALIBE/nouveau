"""Tests unitaires : redaction PII + RedactedJSONB."""

from __future__ import annotations

from typing import Any

import pytest
from app.core.security.redaction import RedactedJSONB, redact_pii

# ---------------------------------------------------------------------------
# redact_pii — comportement de base
# ---------------------------------------------------------------------------


def test_redact_flat_dict_national_id() -> None:
    out = redact_pii({"name": "Alice", "national_id": "AB123456"})
    assert out == {"name": "Alice", "national_id": "***"}


def test_redact_ssn_and_numero_national() -> None:
    out = redact_pii({"ssn": "1234567", "numero_national": "GN-9999"})
    assert out == {"ssn": "***", "numero_national": "***"}


def test_redact_email_default_format() -> None:
    out = redact_pii({"email": "alice@example.com"})
    assert out == {"email": "a***@example.com"}


def test_redact_email_without_at_full_mask() -> None:
    out = redact_pii({"email": "no-at-sign"})
    assert out == {"email": "***"}


def test_redact_email_empty_passthrough() -> None:
    # Chaîne vide n'a rien à masquer.
    assert redact_pii({"email": ""}) == {"email": ""}


def test_redact_candidate_and_contact_email() -> None:
    out = redact_pii(
        {
            "candidate_email": "bob@gov.gn",
            "contact_email": "carol@primature.gn",
        }
    )
    assert out == {
        "candidate_email": "b***@gov.gn",
        "contact_email": "c***@primature.gn",
    }


def test_redact_phone_keeps_last_4() -> None:
    out = redact_pii({"phone": "+224620123456"})
    assert out == {"phone": "***3456"}


def test_redact_phone_short_full_mask() -> None:
    out = redact_pii({"phone": "12"})
    assert out == {"phone": "***"}


def test_redact_phone_exact_4() -> None:
    out = redact_pii({"phone": "1234"})
    assert out == {"phone": "***1234"}


def test_redact_telephone_and_mobile() -> None:
    out = redact_pii({"telephone": "0102030405", "mobile": "0606060606"})
    assert out == {"telephone": "***0405", "mobile": "***0606"}


def test_redact_birth_date_iso() -> None:
    out = redact_pii({"birth_date": "1990-05-12"})
    assert out == {"birth_date": "***-***-1990"}


def test_redact_birth_date_non_iso() -> None:
    out = redact_pii({"birth_date": "12/05/1990"})
    assert out == {"birth_date": "***"}


def test_redact_dob_and_date_naissance() -> None:
    out = redact_pii({"dob": "2000-01-01", "date_naissance": "1985-07-21"})
    assert out == {"dob": "***-***-2000", "date_naissance": "***-***-1985"}


# ---------------------------------------------------------------------------
# Casse + clés non sensibles
# ---------------------------------------------------------------------------


def test_redact_case_insensitive_keys() -> None:
    assert redact_pii({"Email": "x@y.z"}) == {"Email": "x***@y.z"}
    assert redact_pii({"EMAIL": "x@y.z"}) == {"EMAIL": "x***@y.z"}
    assert redact_pii({"NATIONAL_ID": "abc"}) == {"NATIONAL_ID": "***"}


def test_redact_non_sensitive_passthrough() -> None:
    payload = {"name": "Alice", "department": "RH", "age": 35}
    assert redact_pii(payload) == payload


# ---------------------------------------------------------------------------
# Structures imbriquées + immutabilité
# ---------------------------------------------------------------------------


def test_redact_nested_dict() -> None:
    inp = {
        "user": {
            "name": "Alice",
            "email": "alice@example.com",
            "national_id": "X1",
        },
        "request_id": "req-1",
    }
    out = redact_pii(inp)
    assert out == {
        "user": {
            "name": "Alice",
            "email": "a***@example.com",
            "national_id": "***",
        },
        "request_id": "req-1",
    }


def test_redact_list_of_dicts() -> None:
    inp = [
        {"email": "a@b.c", "name": "A"},
        {"email": "d@e.f", "name": "D"},
    ]
    out = redact_pii(inp)
    assert out == [
        {"email": "a***@b.c", "name": "A"},
        {"email": "d***@e.f", "name": "D"},
    ]


def test_redact_mixed_structure() -> None:
    inp = {
        "employees": [
            {"name": "Alice", "phone": "+224620111222", "email": "a@x.gn"},
            {"name": "Bob", "phone": "12", "national_id": "B-1"},
        ],
        "meta": {"count": 2},
    }
    out = redact_pii(inp)
    assert out == {
        "employees": [
            {"name": "Alice", "phone": "***1222", "email": "a***@x.gn"},
            {"name": "Bob", "phone": "***", "national_id": "***"},
        ],
        "meta": {"count": 2},
    }


def test_redact_input_not_mutated() -> None:
    inp: dict[str, Any] = {"email": "a@b.c", "users": [{"email": "x@y.z"}]}
    snapshot = {"email": "a@b.c", "users": [{"email": "x@y.z"}]}
    _ = redact_pii(inp)
    assert inp == snapshot


# ---------------------------------------------------------------------------
# Types divers
# ---------------------------------------------------------------------------


def test_redact_none_input() -> None:
    assert redact_pii(None) is None


def test_redact_primitives_passthrough() -> None:
    assert redact_pii(42) == 42
    assert redact_pii("string") == "string"
    assert redact_pii(3.14) == pytest.approx(3.14)
    assert redact_pii(True) is True


def test_redact_email_value_is_none() -> None:
    # Si la valeur est None on garde None (pas de "N***@one").
    assert redact_pii({"email": None}) == {"email": None}


def test_redact_email_value_non_string() -> None:
    # Type imprévu sur une clé sensible → passthrough plutôt que crash.
    assert redact_pii({"email": 12345}) == {"email": 12345}


def test_redact_tuple_preserves_type() -> None:
    out = redact_pii(({"email": "a@b.c"}, "literal"))
    assert isinstance(out, tuple)
    assert out == ({"email": "a***@b.c"}, "literal")


# ---------------------------------------------------------------------------
# RedactedJSONB
# ---------------------------------------------------------------------------


def test_redacted_jsonb_process_bind_param_masks() -> None:
    col = RedactedJSONB()
    payload = {"email": "alice@example.com", "name": "Alice", "ssn": "1"}
    out = col.process_bind_param(payload, dialect=None)
    assert out == {"email": "a***@example.com", "name": "Alice", "ssn": "***"}


def test_redacted_jsonb_process_bind_param_none() -> None:
    col = RedactedJSONB()
    assert col.process_bind_param(None, dialect=None) is None


def test_redacted_jsonb_process_result_value_passthrough() -> None:
    col = RedactedJSONB()
    payload = {"email": "a***@example.com"}
    # La lecture ne change rien : la redaction est irréversible.
    assert col.process_result_value(payload, dialect=None) is payload


def test_redacted_jsonb_does_not_mutate_input() -> None:
    col = RedactedJSONB()
    payload: dict[str, Any] = {"email": "alice@example.com"}
    snapshot = {"email": "alice@example.com"}
    _ = col.process_bind_param(payload, dialect=None)
    assert payload == snapshot


def test_redacted_jsonb_nested_payload() -> None:
    col = RedactedJSONB()
    payload = {
        "before": {"phone": "+224620111222", "email": "a@b.c"},
        "after": {"phone": "+224620333444", "email": "x@y.z"},
    }
    out = col.process_bind_param(payload, dialect=None)
    assert out == {
        "before": {"phone": "***1222", "email": "a***@b.c"},
        "after": {"phone": "***3444", "email": "x***@y.z"},
    }


# ---------------------------------------------------------------------------
# Audit @tester — edge cases supplementaires
# ---------------------------------------------------------------------------


def test_audit_redact_two_case_variants_of_sensitive_key() -> None:
    """Si un dict contient deux entrées dont les clés ne diffèrent que par la
    casse (`national_id` ET `National_ID`), les DEUX doivent être masquées."""
    inp = {"national_id": "X1", "National_ID": "X2", "name": "Alice"}
    out = redact_pii(inp)
    assert out == {"national_id": "***", "National_ID": "***", "name": "Alice"}


def test_audit_redact_none_on_sensitive_key_stays_none() -> None:
    """Distinction null vs masqué : une valeur None sur clé sensible doit
    rester None (et pas devenir le sentinel `"***"`)."""
    inp = {
        "national_id": None,
        "email": None,
        "phone": None,
        "birth_date": None,
    }
    out = redact_pii(inp)
    assert out == {
        "national_id": None,
        "email": None,
        "phone": None,
        "birth_date": None,
    }


def test_audit_redact_tuple_passthrough_decision() -> None:
    """Un tuple comme payload racine est traité récursivement en préservant
    le type (décision : passthrough du type tuple, redaction du contenu)."""
    inp = ({"email": "a@b.c"}, "literal", 42)
    out = redact_pii(inp)
    assert isinstance(out, tuple)
    assert out == ({"email": "a***@b.c"}, "literal", 42)


def test_audit_redacted_jsonb_none_in_none_out() -> None:
    """RedactedJSONB.process_bind_param avec None doit retourner None
    (pas un dict vide ni `"***"`)."""
    col = RedactedJSONB()
    result = col.process_bind_param(None, dialect=None)
    assert result is None


def test_audit_redacted_jsonb_does_not_mutate_input_identity_check() -> None:
    """Vérifie que l'entrée originale reste structurellement intacte ET
    qu'elle est une instance distincte du résultat (immutabilité forte)."""
    col = RedactedJSONB()
    inner = {"email": "alice@example.com"}
    payload: dict[str, Any] = {"user": inner, "name": "Alice"}
    snapshot_payload = {"user": {"email": "alice@example.com"}, "name": "Alice"}
    snapshot_inner = {"email": "alice@example.com"}
    out = col.process_bind_param(payload, dialect=None)
    # 1) Le payload racine n'est pas muté.
    assert payload == snapshot_payload
    # 2) Le sous-dict imbriqué n'est pas muté non plus.
    assert inner == snapshot_inner
    # 3) Le résultat est une instance différente (nouveau dict).
    assert out is not payload
    assert out["user"] is not inner
    # 4) Le contenu masqué est bien présent dans le résultat.
    assert out == {"user": {"email": "a***@example.com"}, "name": "Alice"}
