"""Tests d'integration — chiffrement PII bout-en-bout (C8 Sub-B).

Vagues sur une vraie Postgres : POST/GET via l'API, SQL brut pour confirmer
que le stockage est bien chiffre (et que le lookup hash est calcule).

Aucune PII reelle : valeurs synthetiques (Jean Doe / 1990-05-15 / etc.).
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import pytest
from app.core.security.crypto import hmac_lookup
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers : lecture SQL brut (bypass TypeDecorator EncryptedString)
# ---------------------------------------------------------------------------


async def _fetch_raw_employee(engine: AsyncEngine, employee_id: UUID) -> dict[str, Any]:
    """Lit la ligne en SQL brut, sans passer par l'ORM (donc sans dechiffrement)."""
    async with engine.connect() as conn:
        row = (
            (
                await conn.execute(
                    text(
                        """
                    SELECT email, national_id, phone, birth_date,
                           email_lookup_hash, national_id_lookup_hash
                    FROM hr.employees
                    WHERE employee_id = :eid
                    """
                    ),
                    {"eid": employee_id},
                )
            )
            .mappings()
            .one()
        )
    return dict(row)


def _agent_payload(
    *,
    matricule: str,
    full_name: str = "Jean Doe",
    email: str | None = None,
    national_id: str | None = None,
    phone: str | None = None,
    birth_date: str | None = None,
) -> dict[str, Any]:
    """Payload minimal pour POST /personnel/agents."""
    payload: dict[str, Any] = {
        "matricule": matricule,
        "full_name": full_name,
    }
    if email is not None:
        payload["email"] = email
    if national_id is not None:
        payload["national_id"] = national_id
    if phone is not None:
        payload["phone"] = phone
    if birth_date is not None:
        payload["birth_date"] = birth_date
    return payload


# ---------------------------------------------------------------------------
# 1. Email : ciphertext en DB, clair en API
# ---------------------------------------------------------------------------


async def test_create_agent_ciphertext_in_db_plaintext_in_api(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    client, _ = app_client
    email_plain = "jean.doe@gov.gn"

    resp = await client.post(
        "/api/v1/personnel/agents",
        json=_agent_payload(matricule="MX-001", email=email_plain),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    employee_id = UUID(body["employee_id"])
    # API : clair
    assert body["email"] == email_plain

    # SQL brut : ciphertext (prefixe kv1:)
    raw = await _fetch_raw_employee(db_engine, employee_id)
    assert isinstance(raw["email"], str)
    assert raw["email"].startswith("kv1:"), f"email non chiffre: {raw['email']!r}"
    assert email_plain not in raw["email"]

    # GET API : clair
    get_resp = await client.get(f"/api/v1/personnel/agents/{employee_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["email"] == email_plain


# ---------------------------------------------------------------------------
# 2. Hash de lookup email ecrit en DB
# ---------------------------------------------------------------------------


async def test_create_agent_writes_email_hash(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    client, _ = app_client
    email_plain = "jean.doe@gov.gn"

    resp = await client.post(
        "/api/v1/personnel/agents",
        json=_agent_payload(matricule="MX-002", email=email_plain),
    )
    assert resp.status_code == 201, resp.text
    employee_id = UUID(resp.json()["employee_id"])

    raw = await _fetch_raw_employee(db_engine, employee_id)
    expected_hash = hmac_lookup(email_plain, normalize=True)
    assert expected_hash is not None
    assert raw["email_lookup_hash"] == expected_hash
    # HMAC SHA-256 hex = 64 chars
    assert len(raw["email_lookup_hash"]) == 64


# ---------------------------------------------------------------------------
# 3. Birth date : ciphertext en DB, clair en API
# ---------------------------------------------------------------------------


async def test_create_agent_with_birth_date_ciphertext(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    client, _ = app_client
    bd_plain = "1990-05-15"

    resp = await client.post(
        "/api/v1/personnel/agents",
        json=_agent_payload(matricule="MX-003", birth_date=bd_plain),
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    employee_id = UUID(body["employee_id"])
    # API : date claire (ISO)
    assert body["birth_date"] == bd_plain

    raw = await _fetch_raw_employee(db_engine, employee_id)
    assert isinstance(raw["birth_date"], str)
    assert raw["birth_date"].startswith("kv1:"), f"birth_date non chiffre: {raw['birth_date']!r}"
    assert bd_plain not in raw["birth_date"]


# ---------------------------------------------------------------------------
# 4. Update email : recalcul du hash + nouveau ciphertext
# ---------------------------------------------------------------------------


async def test_update_agent_email_recalculates_hash(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    client, _ = app_client
    initial = "alice.initial@gov.gn"
    updated = "alice.updated@gov.gn"

    # Create
    create_resp = await client.post(
        "/api/v1/personnel/agents",
        json=_agent_payload(matricule="MX-004", full_name="Alice Test", email=initial),
    )
    assert create_resp.status_code == 201, create_resp.text
    employee_id = UUID(create_resp.json()["employee_id"])

    initial_raw = await _fetch_raw_employee(db_engine, employee_id)
    initial_ciphertext = initial_raw["email"]
    initial_hash = initial_raw["email_lookup_hash"]
    assert initial_hash == hmac_lookup(initial, normalize=True)

    # Update via PUT (route declare PUT pour /agents/{id})
    update_resp = await client.put(
        f"/api/v1/personnel/agents/{employee_id}",
        json={"email": updated},
    )
    assert update_resp.status_code == 200, update_resp.text
    assert update_resp.json()["email"] == updated

    updated_raw = await _fetch_raw_employee(db_engine, employee_id)
    # Ciphertext different (nonce Fernet aleatoire)
    assert updated_raw["email"] != initial_ciphertext
    assert updated_raw["email"].startswith("kv1:")
    assert updated not in updated_raw["email"]
    # Hash mis a jour
    assert updated_raw["email_lookup_hash"] == hmac_lookup(updated, normalize=True)
    assert updated_raw["email_lookup_hash"] != initial_hash


# ---------------------------------------------------------------------------
# 5. Sanity check : GET via ORM dechiffre automatiquement (TypeDecorator)
# ---------------------------------------------------------------------------


async def test_get_agent_returns_clear_pii(app_client: tuple[Any, UUID]) -> None:
    client, _ = app_client
    email_plain = "sanity@gov.gn"
    nid_plain = "GN-PII-SANITY"
    phone_plain = "+224 600 11 22 33"
    bd_plain = "1985-12-31"

    resp = await client.post(
        "/api/v1/personnel/agents",
        json=_agent_payload(
            matricule="MX-005",
            full_name="Sanity Check",
            email=email_plain,
            national_id=nid_plain,
            phone=phone_plain,
            birth_date=bd_plain,
        ),
    )
    assert resp.status_code == 201, resp.text
    employee_id = UUID(resp.json()["employee_id"])

    get_resp = await client.get(f"/api/v1/personnel/agents/{employee_id}")
    assert get_resp.status_code == 200
    body = get_resp.json()
    # Tous les champs PII en clair via l'API (ORM a dechiffre).
    assert body["email"] == email_plain
    assert body["phone"] == phone_plain
    assert body["birth_date"] == bd_plain
    # national_id n'est pas expose dans AgentResponse — on verifie juste
    # l'absence de leak ciphertext via la presence d'aucun prefixe kv1: dans
    # la reponse.
    assert "kv1:" not in get_resp.text
