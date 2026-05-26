"""Tests d'integration — `app.services.personnel_service` (CRUD agents, dedup, merge).

Couvre les chemins critiques metier sur une vraie Postgres :

- create_agent : creation + ciphertext PII + hashs + audit AGENT_CREATED.
- create_agent : conflit de matricule (meme organization_id).
- update_agent : maj champ standard + recalcul hash email + audit AGENT_UPDATED.
- update_agent : agent inexistant → NotFoundError.
- get_agent : dechiffre la PII (email/phone/birth_date) via TypeDecorator.
- list_agents : pagination + filtre statut + recherche par email (via hash).
- list_agent_duplicate_index : 2 agents meme email casse differente regroupes
  par hash normalise.
- merge_duplicate_agents : copie selective champ par champ, recalcul hash,
  archivage du secondaire, audit AGENT_MERGED.
- suggest_matricule : prochain numero + audit trace.

Aucune PII reelle : valeurs synthetiques (alice@gov.gn, GN-001, etc.).
"""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest
from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.core.security.crypto import hmac_lookup
from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.schemas.personnel import (
    AgentCreateRequest,
    AgentUpdateRequest,
    MergeDuplicateAgentsRequest,
)
from app.services import personnel_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_admin(org_id: UUID, user_id: UUID) -> AuthenticatedUser:
    """User authentifie superviseur (scope GLOBAL, toutes permissions)."""
    return AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-svc",
        full_name="Pytest Service Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _audit_writer(session: AsyncSession, admin: AuthenticatedUser) -> AuditWriter:
    return AuditWriter(
        session,
        actor=admin,
        organization_id=admin.organization_id,
        source_ip="127.0.0.1",
        user_agent="pytest",
    )


# ===========================================================================
# 1. create_agent
# ===========================================================================


async def test_create_agent_persists_with_ciphertext_and_hashes(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    req = AgentCreateRequest(
        matricule="GN-AGT-001",
        full_name="Alice Test",
        email="alice@gov.gn",
        national_id="GN-NID-001",
        phone="+224 600 000 001",
    )
    result = await personnel_service.create_agent(
        db_session, organization_id=org_id, body=req, audit=audit
    )
    await db_session.commit()

    # Reponse contient l'agent en clair
    assert result.matricule == "GN-AGT-001"
    assert result.full_name == "Alice Test"
    assert result.email == "alice@gov.gn"
    assert result.phone == "+224 600 000 001"

    # Verification en DB : email_lookup_hash calcule (normalize=True)
    stmt = select(Employee).where(Employee.employee_id == result.employee_id)
    emp = (await db_session.execute(stmt)).scalar_one()
    assert emp.email_lookup_hash == hmac_lookup("alice@gov.gn", normalize=True)
    assert emp.national_id_lookup_hash == hmac_lookup("GN-NID-001", normalize=False)

    # Audit AGENT_CREATED ecrit
    audit_rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.organization_id == org_id,
                    AuditLog.action == "AGENT_CREATED",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(audit_rows) == 1
    assert audit_rows[0].target_type == "employee"
    assert audit_rows[0].target_id == str(result.employee_id)


async def test_create_agent_duplicate_matricule_raises_conflict(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Meme matricule + meme organization_id → ConflictError MATRICULE_TAKEN."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    req = AgentCreateRequest(matricule="GN-DUP-001", full_name="Bob Premier")
    await personnel_service.create_agent(db_session, organization_id=org_id, body=req, audit=audit)
    await db_session.commit()

    with pytest.raises(ConflictError) as exc_info:
        await personnel_service.create_agent(
            db_session,
            organization_id=org_id,
            body=AgentCreateRequest(matricule="GN-DUP-001", full_name="Bob Bis"),
            audit=audit,
        )
    assert exc_info.value.code == "MATRICULE_TAKEN"


async def test_create_agent_without_email_writes_null_hash(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Agent sans email → email_lookup_hash NULL (coherent index partiel)."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    result = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-NOEM-001", full_name="Charlie Sans-Mail"),
        audit=audit,
    )
    await db_session.commit()

    emp = (
        await db_session.execute(select(Employee).where(Employee.employee_id == result.employee_id))
    ).scalar_one()
    assert emp.email_lookup_hash is None
    assert emp.national_id_lookup_hash is None


# ===========================================================================
# 2. get_agent
# ===========================================================================


async def test_get_agent_returns_clear_pii(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    created = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-READ-001",
            full_name="Diane Read",
            email="diane@gov.gn",
            phone="+224 600 000 002",
        ),
        audit=audit,
    )
    await db_session.commit()

    # Recharger une nouvelle session pour eviter les caches identity-map
    db_session.expire_all()
    fetched = await personnel_service.get_agent(
        db_session, employee_id=created.employee_id, user=admin
    )
    assert fetched.email == "diane@gov.gn"
    assert fetched.phone == "+224 600 000 002"
    assert fetched.full_name == "Diane Read"


async def test_get_agent_not_found_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    with pytest.raises(NotFoundError) as exc_info:
        await personnel_service.get_agent(db_session, employee_id=uuid4(), user=admin)
    assert exc_info.value.code == "AGENT_NOT_FOUND"


# ===========================================================================
# 3. update_agent
# ===========================================================================


async def test_update_agent_email_recomputes_hash(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    created = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-UPD-001",
            full_name="Erwan Update",
            email="initial@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    updated = await personnel_service.update_agent(
        db_session,
        employee_id=created.employee_id,
        body=AgentUpdateRequest(email="updated@gov.gn"),
        audit=audit,
    )
    await db_session.commit()

    assert updated.email == "updated@gov.gn"
    # Hash mis a jour
    emp = (
        await db_session.execute(
            select(Employee).where(Employee.employee_id == created.employee_id)
        )
    ).scalar_one()
    assert emp.email_lookup_hash == hmac_lookup("updated@gov.gn", normalize=True)
    assert emp.email_lookup_hash != hmac_lookup("initial@gov.gn", normalize=True)


async def test_update_agent_writes_audit_with_before_after(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    created = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-UPDA-001",
            full_name="Fanta Audit",
            employment_status="ACTIVE",
        ),
        audit=audit,
    )
    await db_session.commit()

    await personnel_service.update_agent(
        db_session,
        employee_id=created.employee_id,
        body=AgentUpdateRequest(employment_status="ON_LEAVE"),
        audit=audit,
    )
    await db_session.commit()

    audit_rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "AGENT_UPDATED",
                    AuditLog.target_id == str(created.employee_id),
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(audit_rows) == 1
    row = audit_rows[0]
    assert row.before_data is not None
    assert row.after_data is not None
    assert row.before_data.get("employment_status") == "ACTIVE"
    assert row.after_data.get("employment_status") == "ON_LEAVE"


async def test_update_agent_not_found_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await personnel_service.update_agent(
            db_session,
            employee_id=uuid4(),
            body=AgentUpdateRequest(full_name="Ghost Doe"),
            audit=audit,
        )
    assert exc_info.value.code == "AGENT_NOT_FOUND"


async def test_update_agent_none_field_is_skipped(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Semantique PATCH : field=None signifie 'ne pas modifier'."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    created = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-PATCH-001",
            full_name="Gilles Patch",
            email="gilles@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    # Update SANS email : l'email doit etre preserve.
    updated = await personnel_service.update_agent(
        db_session,
        employee_id=created.employee_id,
        body=AgentUpdateRequest(full_name="Gilles Patche"),
        audit=audit,
    )
    await db_session.commit()
    assert updated.full_name == "Gilles Patche"
    assert updated.email == "gilles@gov.gn"


# ===========================================================================
# 4. list_agents : pagination, filtres, recherche
# ===========================================================================


async def test_list_agents_returns_total_and_paginates(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    for i in range(3):
        await personnel_service.create_agent(
            db_session,
            organization_id=org_id,
            body=AgentCreateRequest(
                matricule=f"GN-LST-{i:03d}",
                full_name=f"Agent {i:03d}",
            ),
            audit=audit,
        )
    await db_session.commit()

    items, total = await personnel_service.list_agents(
        db_session, organization_id=org_id, user=admin, page=1, page_size=2
    )
    assert total == 3
    assert len(items) == 2


async def test_list_agents_filters_by_status(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-ACT-001",
            full_name="Hugo Actif",
            employment_status="ACTIVE",
        ),
        audit=audit,
    )
    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-ACT-002",
            full_name="Ines Inactive",
            employment_status="INACTIVE",
        ),
        audit=audit,
    )
    await db_session.commit()

    items, total = await personnel_service.list_agents(
        db_session, organization_id=org_id, user=admin, status="INACTIVE"
    )
    assert total == 1
    assert items[0].matricule == "GN-ACT-002"


async def test_list_agents_search_by_email_exact_hash(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Le service utilise email_lookup_hash si le search contient '@'."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-EMS-001",
            full_name="Julie Match",
            email="julie@gov.gn",
        ),
        audit=audit,
    )
    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-EMS-002",
            full_name="Karim Autre",
            email="karim@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    items, total = await personnel_service.list_agents(
        db_session, organization_id=org_id, user=admin, search="julie@gov.gn"
    )
    assert total == 1
    assert items[0].matricule == "GN-EMS-001"


async def test_list_agents_search_by_matricule_substring(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Search sans '@' : match ILIKE sur matricule + full_name."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-FIND-001", full_name="Leila Search"),
        audit=audit,
    )
    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-OTHER-001", full_name="Marc Other"),
        audit=audit,
    )
    await db_session.commit()

    items, total = await personnel_service.list_agents(
        db_session, organization_id=org_id, user=admin, search="FIND"
    )
    assert total == 1
    assert items[0].matricule == "GN-FIND-001"


# ===========================================================================
# 5. Dedup : list_agent_duplicate_index
# ===========================================================================


async def test_duplicate_index_groups_same_email_case_insensitive(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Deux agents avec le meme email (casse differente) sont detectes via hash normalise."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    a = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-DD-001",
            full_name="Nina First",
            email="Same@gov.gn",
        ),
        audit=audit,
    )
    b = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-DD-002",
            full_name="Oscar Second",
            email="SAME@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    items = await personnel_service.list_agent_duplicate_index(db_session, organization_id=org_id)
    ids = {item.id for item in items}
    assert a.employee_id in ids
    assert b.employee_id in ids


async def test_duplicate_index_empty_when_no_dup(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Aucun agent → []. Un seul agent → []."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-SOLO-001",
            full_name="Patrick Seul",
            email="patrick@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()
    items = await personnel_service.list_agent_duplicate_index(db_session, organization_id=org_id)
    assert items == []


# ===========================================================================
# 6. merge_duplicate_agents
# ===========================================================================


async def test_merge_copies_secondary_email_and_recomputes_hash(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    primary = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-MRG-P001",
            full_name="Quentin Primary",
            email="qprimary@gov.gn",
        ),
        audit=audit,
    )
    secondary = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(
            matricule="GN-MRG-S001",
            full_name="Rita Secondary",
            email="rsecondary@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    result = await personnel_service.merge_duplicate_agents(
        db_session,
        organization_id=org_id,
        body=MergeDuplicateAgentsRequest(
            primary_agent_id=primary.employee_id,
            secondary_agent_id=secondary.employee_id,
            field_sources={"email": "secondary"},
            reason="Doublon detecte par superviseur",
        ),
        actor_user_id=user_id,
        actor_full_name="Pytest Service Admin",
        audit=audit,
    )
    await db_session.commit()

    assert result.primary_agent_id == primary.employee_id
    assert result.field_sources["email"] == "secondary"

    # Verifie en DB
    primary_emp = (
        await db_session.execute(
            select(Employee).where(Employee.employee_id == primary.employee_id)
        )
    ).scalar_one()
    assert primary_emp.email == "rsecondary@gov.gn"
    assert primary_emp.email_lookup_hash == hmac_lookup("rsecondary@gov.gn", normalize=True)
    # Secondary archive
    secondary_emp = (
        await db_session.execute(
            select(Employee).where(Employee.employee_id == secondary.employee_id)
        )
    ).scalar_one()
    assert secondary_emp.employment_status == "TERMINATED"
    assert secondary_emp.employee_metadata.get("merged_into") == str(primary.employee_id)


async def test_merge_same_agent_raises_conflict(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """primary_id == secondary_id → ConflictError AGENT_MERGE_SAME."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    a = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-SELF-001", full_name="Self Merge"),
        audit=audit,
    )
    await db_session.commit()

    with pytest.raises(ConflictError) as exc_info:
        await personnel_service.merge_duplicate_agents(
            db_session,
            organization_id=org_id,
            body=MergeDuplicateAgentsRequest(
                primary_agent_id=a.employee_id,
                secondary_agent_id=a.employee_id,
                field_sources={},
            ),
            actor_user_id=user_id,
            actor_full_name="Pytest",
            audit=audit,
        )
    assert exc_info.value.code == "AGENT_MERGE_SAME"


async def test_merge_writes_agent_merged_audit(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    primary = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-MA-P", full_name="Audited Primary"),
        audit=audit,
    )
    secondary = await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-MA-S", full_name="Audited Secondary"),
        audit=audit,
    )
    await db_session.commit()

    await personnel_service.merge_duplicate_agents(
        db_session,
        organization_id=org_id,
        body=MergeDuplicateAgentsRequest(
            primary_agent_id=primary.employee_id,
            secondary_agent_id=secondary.employee_id,
            field_sources={},
        ),
        actor_user_id=user_id,
        actor_full_name="Pytest",
        audit=audit,
    )
    await db_session.commit()

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "AGENT_MERGED",
                    AuditLog.target_id == str(primary.employee_id),
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1
    assert rows[0].after_data is not None
    assert rows[0].after_data.get("primary_agent_id") == str(primary.employee_id)
    assert rows[0].after_data.get("secondary_agent_id") == str(secondary.employee_id)


# ===========================================================================
# 7. suggest_matricule
# ===========================================================================


async def test_suggest_matricule_increments_from_existing(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Avec GN-AGT-0001 et GN-AGT-0002 en base → suggere GN-AGT-0003."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-AGT-0001", full_name="Un"),
        audit=audit,
    )
    await personnel_service.create_agent(
        db_session,
        organization_id=org_id,
        body=AgentCreateRequest(matricule="GN-AGT-0002", full_name="Deux"),
        audit=audit,
    )
    await db_session.commit()

    result = await personnel_service.suggest_matricule(
        db_session,
        organization_id=org_id,
        requested_by_user_id=user_id,
        requested_by_username="pytest",
    )
    assert result.matricule == "GN-AGT-0003"
    assert result.next_number == 3


async def test_suggest_matricule_fallback_when_empty(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    """Aucun matricule existant → fallback AGENT-0001."""
    org_id, user_id = seed_organization
    result = await personnel_service.suggest_matricule(
        db_session,
        organization_id=org_id,
        requested_by_user_id=user_id,
        requested_by_username="pytest",
    )
    assert result.matricule == "AGENT-0001"
    assert result.next_number == 1
