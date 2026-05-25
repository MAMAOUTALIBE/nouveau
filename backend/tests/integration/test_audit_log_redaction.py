"""Tests d'integration — redaction PII des audit_logs (C10 Sub-B).

Verifie que :
- l'update d'un agent ecrit dans ``hr.audit_logs`` des payloads JSONB
  passes par ``RedactedJSONB.process_bind_param`` => PII masquees,
- les emails apparaissent sous forme ``u***@domain``,
- les national_id et autres clefs "full mask" sont remplaces par ``***``,
- les telephones gardent les 4 derniers caracteres,
- les birth_date gardent l'annee uniquement.

Aucune PII reelle : valeurs synthetiques.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _fetch_audit_rows(
    engine: AsyncEngine, *, organization_id: UUID, action: str
) -> list[dict[str, Any]]:
    """Renvoie les payloads audit (before/after) en SQL brut.

    La colonne est JSONB cote DDL, mais le ``TypeDecorator`` a applique la
    redaction AVANT ecriture : on observe donc directement la version masquee.
    """
    async with engine.connect() as conn:
        rows = (
            (
                await conn.execute(
                    text(
                        """
                    SELECT before_data, after_data, action
                    FROM hr.audit_logs
                    WHERE organization_id = :oid AND action = :action
                    ORDER BY occurred_at ASC
                    """
                    ),
                    {"oid": organization_id, "action": action},
                )
            )
            .mappings()
            .all()
        )
    return [dict(r) for r in rows]


async def _create_then_update(
    client: Any,
    *,
    matricule: str,
    full_name: str,
    create_payload: dict[str, Any],
    update_payload: dict[str, Any],
) -> UUID:
    """Cree un agent puis l'update. Renvoie l'employee_id."""
    create_resp = await client.post(
        "/api/v1/personnel/agents",
        json={"matricule": matricule, "full_name": full_name, **create_payload},
    )
    assert create_resp.status_code == 201, create_resp.text
    employee_id = UUID(create_resp.json()["employee_id"])
    update_resp = await client.put(
        f"/api/v1/personnel/agents/{employee_id}",
        json=update_payload,
    )
    assert update_resp.status_code == 200, update_resp.text
    return employee_id


def _serialize(value: Any) -> str:
    """Serialisation defensive pour assertions de non-fuite (str cast)."""
    return str(value)


# ---------------------------------------------------------------------------
# 1. Email masque dans before/after
# ---------------------------------------------------------------------------


async def test_update_agent_audit_log_redacts_email(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    client, org_id = app_client
    initial = "alice.initial@gov.gn"
    updated = "alice.updated@gov.gn"

    await _create_then_update(
        client,
        matricule="AUD-EMAIL",
        full_name="Audit Email",
        create_payload={"email": initial},
        update_payload={"email": updated, "full_name": "Audit Email Updated"},
    )

    rows = await _fetch_audit_rows(db_engine, organization_id=org_id, action="AGENT_UPDATED")
    assert rows, "aucune ligne d'audit AGENT_UPDATED"
    row = rows[-1]
    # Le service inclut email dans after_data ? Verifions both side, et qu'aucun
    # clair n'apparait dans la serialisation totale.
    blob = _serialize(row["before_data"]) + _serialize(row["after_data"])
    assert initial not in blob, f"email initial en clair: {blob!r}"
    assert updated not in blob, f"email updated en clair: {blob!r}"


# ---------------------------------------------------------------------------
# 2. National_id masque integralement
# ---------------------------------------------------------------------------


async def test_update_agent_audit_log_redacts_national_id(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    _, org_id = app_client
    nid_initial = "GN-AUD-NID-001"
    nid_updated = "GN-AUD-NID-999"

    # On force la presence de national_id dans l'audit via l'API : un audit
    # complet contenant national_id. Le service personnel n'inclut pas
    # systematiquement national_id dans le payload audit ; on injecte donc
    # un audit direct via l'AuditLog mais ce serait sortir du perimetre.
    # A la place, on verifie le contrat de RedactedJSONB en inserant une
    # ligne audit_logs directement via SQL brut + ORM (utilisation du
    # TypeDecorator).
    from app.models.audit_log import AuditLog
    from sqlalchemy.ext.asyncio import async_sessionmaker

    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with factory() as session:
        log = AuditLog(
            organization_id=org_id,
            action="AGENT_UPDATED_NID_TEST",
            target_type="employee",
            target_id="fake-target",
            before_data={"national_id": nid_initial, "full_name": "Audit NID"},
            after_data={"national_id": nid_updated, "full_name": "Audit NID 2"},
        )
        session.add(log)
        await session.commit()

    rows = await _fetch_audit_rows(
        db_engine, organization_id=org_id, action="AGENT_UPDATED_NID_TEST"
    )
    assert rows, "audit non ecrit"
    blob = _serialize(rows[0]["before_data"]) + _serialize(rows[0]["after_data"])
    # full mask sur national_id => '***'
    assert nid_initial not in blob
    assert nid_updated not in blob
    assert "***" in blob


# ---------------------------------------------------------------------------
# 3. Phone : garde 4 derniers
# ---------------------------------------------------------------------------


async def test_update_agent_audit_log_redacts_phone(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    _, org_id = app_client
    phone_initial = "+224 600 11 22 33"
    phone_updated = "+224 600 44 55 66"

    from app.models.audit_log import AuditLog
    from sqlalchemy.ext.asyncio import async_sessionmaker

    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with factory() as session:
        log = AuditLog(
            organization_id=org_id,
            action="AGENT_UPDATED_PHONE_TEST",
            target_type="employee",
            target_id="fake-target",
            before_data={"phone": phone_initial},
            after_data={"phone": phone_updated},
        )
        session.add(log)
        await session.commit()

    rows = await _fetch_audit_rows(
        db_engine, organization_id=org_id, action="AGENT_UPDATED_PHONE_TEST"
    )
    assert rows
    before = rows[0]["before_data"]
    after = rows[0]["after_data"]
    assert before["phone"] == "***" + phone_initial[-4:]
    assert after["phone"] == "***" + phone_updated[-4:]
    # Aucun fragment clair des prefixes
    assert "+224 600 11 22" not in _serialize(before)
    assert "+224 600 44 55" not in _serialize(after)


# ---------------------------------------------------------------------------
# 4. Birth date : ne garde que l'annee
# ---------------------------------------------------------------------------


async def test_update_agent_audit_log_redacts_birth_date(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    _, org_id = app_client
    bd_initial = "1990-05-15"
    bd_updated = "1991-07-22"

    from app.models.audit_log import AuditLog
    from sqlalchemy.ext.asyncio import async_sessionmaker

    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with factory() as session:
        log = AuditLog(
            organization_id=org_id,
            action="AGENT_UPDATED_BD_TEST",
            target_type="employee",
            target_id="fake-target",
            before_data={"birth_date": bd_initial},
            after_data={"birth_date": bd_updated},
        )
        session.add(log)
        await session.commit()

    rows = await _fetch_audit_rows(
        db_engine, organization_id=org_id, action="AGENT_UPDATED_BD_TEST"
    )
    assert rows
    before = rows[0]["before_data"]
    after = rows[0]["after_data"]
    assert before["birth_date"] == "***-***-1990"
    assert after["birth_date"] == "***-***-1991"
    # Pas de fuite du mois / jour
    assert "05-15" not in _serialize(before)
    assert "07-22" not in _serialize(after)


# ---------------------------------------------------------------------------
# 5. Dict imbrique : redaction recursive
# ---------------------------------------------------------------------------


async def test_audit_log_dict_imbrique_redacte(
    app_client: tuple[Any, UUID], db_engine: AsyncEngine
) -> None:
    _, org_id = app_client
    leaky_email = "nested.leaky@gov.gn"

    from app.models.audit_log import AuditLog
    from sqlalchemy.ext.asyncio import async_sessionmaker

    factory = async_sessionmaker(bind=db_engine, expire_on_commit=False)
    async with factory() as session:
        log = AuditLog(
            organization_id=org_id,
            action="AGENT_UPDATED_NESTED_TEST",
            target_type="employee",
            target_id="fake-target",
            before_data={
                "contact": {"email": leaky_email, "phone": "+22460012348877"},
                "metadata": {"items": [{"email": leaky_email}]},
            },
            after_data=None,
        )
        session.add(log)
        await session.commit()

    rows = await _fetch_audit_rows(
        db_engine, organization_id=org_id, action="AGENT_UPDATED_NESTED_TEST"
    )
    assert rows
    blob = _serialize(rows[0]["before_data"])
    assert leaky_email not in blob, f"email en clair dans dict imbrique: {blob!r}"
    # Format masque ``n***@gov.gn`` doit apparaitre.
    assert "n***@gov.gn" in blob
    # Phone : 4 derniers prefixes par ***
    assert "***8877" in blob
