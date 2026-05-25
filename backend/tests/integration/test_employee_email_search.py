"""Tests d'integration — recherche par email + dedup HMAC (C9 Sub-B).

Valide que :
- la recherche d'email passe par ``email_lookup_hash`` (HMAC normalise),
- la dedup regroupe les emails identiques modulo case/whitespace,
- la dedup national_id reste stricte (normalize=False),
- l'endpoint dedup expose le clair (jamais le hash) dans ``duplicate_value``.

Aucune PII reelle : valeurs synthetiques.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import pytest

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers : creation rapide d'agents via l'API
# ---------------------------------------------------------------------------


async def _create_agent(
    client: Any,
    *,
    matricule: str,
    full_name: str,
    email: str | None = None,
    national_id: str | None = None,
) -> UUID:
    payload: dict[str, Any] = {"matricule": matricule, "full_name": full_name}
    if email is not None:
        payload["email"] = email
    if national_id is not None:
        payload["national_id"] = national_id
    resp = await client.post("/api/v1/personnel/agents", json=payload)
    assert resp.status_code == 201, resp.text
    return UUID(resp.json()["employee_id"])


# ---------------------------------------------------------------------------
# 1. Recherche email exacte
# ---------------------------------------------------------------------------


async def test_search_by_email_finds_agent(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    employee_id = await _create_agent(
        client, matricule="SR-001", full_name="Alice Search", email="alice@gov.gn"
    )

    resp = await client.get("/api/v1/personnel/agents", params={"q": "alice@gov.gn"})
    assert resp.status_code == 200
    body = resp.json()
    ids = [item["employee_id"] for item in body["items"]]
    assert str(employee_id) in ids


# ---------------------------------------------------------------------------
# 2. Recherche insensible a la casse
# ---------------------------------------------------------------------------


async def test_search_by_email_case_insensitive(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    employee_id = await _create_agent(
        client, matricule="SR-002", full_name="Alice Case", email="Alice@Gov.GN"
    )

    resp = await client.get("/api/v1/personnel/agents", params={"q": "alice@gov.gn"})
    assert resp.status_code == 200
    ids = [item["employee_id"] for item in resp.json()["items"]]
    assert str(employee_id) in ids


# ---------------------------------------------------------------------------
# 3. Whitespace strip
# ---------------------------------------------------------------------------


async def test_search_by_email_with_whitespace_normalised(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    employee_id = await _create_agent(
        client, matricule="SR-003", full_name="Alice Whitespace", email="alice@gov.gn"
    )

    resp = await client.get("/api/v1/personnel/agents", params={"q": "  alice@gov.gn  "})
    assert resp.status_code == 200
    ids = [item["employee_id"] for item in resp.json()["items"]]
    assert str(employee_id) in ids


# ---------------------------------------------------------------------------
# 4. Recherche partielle (sans @) : pas de match email mais matricule/nom OK
# ---------------------------------------------------------------------------


async def test_search_partial_email_not_supported(app_client: tuple[Any, UUID]) -> None:
    """Sans '@' dans le terme : le service ne touche pas a email_lookup_hash.

    Verifie qu'aucun crash, et que la recherche reste exploitable sur
    full_name / matricule (Alice apparait via le nom).
    """
    client, _ = app_client
    employee_id = await _create_agent(
        client, matricule="SR-004", full_name="Alice Partial", email="alice@gov.gn"
    )

    # Recherche "alice" : matche le full_name (ilike) mais pas l'email.
    resp = await client.get("/api/v1/personnel/agents", params={"q": "alice"})
    assert resp.status_code == 200
    ids = [item["employee_id"] for item in resp.json()["items"]]
    # On retrouve l'agent via full_name "Alice Partial" (ilike %alice%).
    assert str(employee_id) in ids


# ---------------------------------------------------------------------------
# 5. Dedup email : casse differente => groupe
# ---------------------------------------------------------------------------


async def test_duplicate_detection_email(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    a = await _create_agent(
        client, matricule="DUP-EMAIL-A", full_name="Dup Email A", email="Alice@Gov.GN"
    )
    b = await _create_agent(
        client, matricule="DUP-EMAIL-B", full_name="Dup Email B", email="alice@gov.gn"
    )

    resp = await client.get("/api/v1/personnel/agents/duplicate-index")
    assert resp.status_code == 200, resp.text
    flagged_ids = {item["id"] for item in resp.json()}
    # Les deux agents doivent etre flagues comme impliques dans un doublon.
    assert str(a) in flagged_ids
    assert str(b) in flagged_ids


# ---------------------------------------------------------------------------
# 6. Dedup national_id : strict (espace != identique)
# ---------------------------------------------------------------------------


async def test_duplicate_detection_national_id_strict(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    a = await _create_agent(
        client, matricule="DUP-NID-A", full_name="Dup NID A", national_id="12345"
    )
    b = await _create_agent(
        client, matricule="DUP-NID-B", full_name="Dup NID B", national_id="12345 "
    )

    resp = await client.get("/api/v1/personnel/agents/duplicate-index")
    assert resp.status_code == 200
    flagged_ids = {item["id"] for item in resp.json()}
    # normalize=False : les deux valeurs sont distinctes => pas de groupe.
    assert str(a) not in flagged_ids
    assert str(b) not in flagged_ids


# ---------------------------------------------------------------------------
# 7. duplicate_value dans l'API : clair, pas le hash
# ---------------------------------------------------------------------------


async def test_duplicate_value_in_api_is_plaintext_not_hash(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    await _create_agent(
        client,
        matricule="DUP-VAL-A",
        full_name="Dup Val A",
        email="Alice@Gov.GN",
    )
    await _create_agent(
        client,
        matricule="DUP-VAL-B",
        full_name="Dup Val B",
        email="alice@gov.gn",
    )

    resp = await client.get(
        "/api/v1/personnel/agents/duplicate-cases",
        params={"duplicateField": "email"},
    )
    assert resp.status_code == 200, resp.text
    cases = resp.json()
    # Il doit y avoir au moins un groupe sur le champ email.
    email_cases = [c for c in cases if c["duplicate_field"] == "email"]
    assert email_cases, "aucun groupe de doublons email retourne"

    case = email_cases[0]
    duplicate_value = case["duplicate_value"]
    # Clair : contient '@', pas un hex de 64 chars.
    assert "@" in duplicate_value
    assert len(duplicate_value) != 64 or not all(c in "0123456789abcdef" for c in duplicate_value)
    # Et ne ressemble pas a un HMAC : pas de "kv1:" non plus.
    assert not duplicate_value.startswith("kv1:")
