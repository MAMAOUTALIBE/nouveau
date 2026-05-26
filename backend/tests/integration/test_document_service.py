"""Tests d'integration — `app.services.document_service` (types, documents, demandes).

Couvre les chemins critiques metier sur une vraie Postgres :

- list_document_types : seulement actifs par defaut + filtre module_scope.
- create_document_type : creation + audit + doublon -> ConflictError.
- create_document : reference auto, audit DOCUMENT_CREATED.
- list_documents : pagination, filtres type/status/search/employee, scope GLOBAL.
- list_documents : filtre confidentialite (sensitive masque sans permission).
- get_document / get_document inconnu -> NotFoundError.
- update_document_status : transition valide DRAFT -> IN_VALIDATION.
- update_document_status : transition invalide -> ConflictError.
- update_document_status : archived_at est setté quand on archive.
- list_document_audit_logs : filtre par target/action.
- list_document_requirements : retourne les exigences avec join document_types.
- create_request (demandes admin) : reference DEM-DOC, audit, validation.
- decide_request : approve / reject / double decision conflict / unknown.
- run_document_archive : dry_run renvoie candidats sans persister.
- purge_document_archives : dry_run.

Aucune PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.document import (
    Document,
    DocumentRequirement,
    DocumentType,
)
from app.models.employee import Employee
from app.schemas.document import (
    DocumentArchivePurgeRequest,
    DocumentArchiveRunRequest,
    DocumentCreateRequest,
    DocumentRequestCreateRequest,
    DocumentRequestDecisionRequest,
    DocumentTypeCreateRequest,
    DocumentUpdateStatusRequest,
)
from app.services import document_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers + fixtures
# ---------------------------------------------------------------------------


def _make_admin(org_id: UUID, user_id: UUID) -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-doc",
        full_name="Pytest Doc Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _make_basic_user(org_id: UUID, user_id: UUID) -> AuthenticatedUser:
    """User sans permission `documents:view:sensitive` -> ne voit que PUBLIC/INTERNAL."""
    return AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-basic",
        full_name="Pytest Basic User",
        status="ACTIVE",
        roles=("agent",),
        permissions=frozenset({"documents:view"}),
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


@pytest_asyncio.fixture
async def seed_employee(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> Employee:
    org_id, _user_id = seed_organization
    employee = Employee(
        organization_id=org_id,
        matricule="GN-DOC-001",
        full_name="Aline Docu",
        employment_status="ACTIVE",
    )
    db_session.add(employee)
    await db_session.commit()
    await db_session.refresh(employee)
    return employee


@pytest_asyncio.fixture
async def seed_document_type(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> DocumentType:
    org_id, _user_id = seed_organization
    dt = DocumentType(
        organization_id=org_id,
        code="CERT_TRAVAIL",
        label="Certificat de travail",
        module_scope="PERSONNEL",
        owner_entity_type="EMPLOYEE",
        requires_expiry=False,
        requires_signature=True,
        requires_dispatch=False,
        is_sensitive=False,
        is_active=True,
    )
    db_session.add(dt)
    await db_session.commit()
    await db_session.refresh(dt)
    return dt


# ===========================================================================
# 1. list_document_types
# ===========================================================================


async def test_list_document_types_returns_actives(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, _user_id = seed_organization
    # Type inactif additionnel
    inactive = DocumentType(
        organization_id=org_id,
        code="OLD_DOC",
        label="Ancien type",
        module_scope="GLOBAL",
        owner_entity_type="GENERIC",
        is_active=False,
    )
    db_session.add(inactive)
    await db_session.commit()
    items = await document_service.list_document_types(db_session, organization_id=org_id)
    codes = [it.code for it in items]
    assert "CERT_TRAVAIL" in codes
    assert "OLD_DOC" not in codes


async def test_list_document_types_filters_by_module_scope(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, _user_id = seed_organization
    # 2e type avec scope different
    other = DocumentType(
        organization_id=org_id,
        code="LEAVE_NOTIF",
        label="Notif conge",
        module_scope="LEAVE",
        owner_entity_type="LEAVE_REQUEST",
        is_active=True,
    )
    db_session.add(other)
    await db_session.commit()
    items = await document_service.list_document_types(
        db_session, organization_id=org_id, module_scope="PERSONNEL"
    )
    codes = [it.code for it in items]
    assert codes == ["CERT_TRAVAIL"]


# ===========================================================================
# 2. create_document_type
# ===========================================================================


async def test_create_document_type_persists_and_audits(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    result = await document_service.create_document_type(
        db_session,
        organization_id=org_id,
        body=DocumentTypeCreateRequest(
            code="ATTESTATION",
            label="Attestation diverse",
            module_scope="PERSONNEL",
            owner_entity_type="EMPLOYEE",
        ),
        audit=audit,
    )
    await db_session.commit()
    assert result.code == "ATTESTATION"
    assert result.module_scope == "PERSONNEL"
    assert result.is_active is True

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_TYPE_CREATED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_create_document_type_duplicate_raises(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(ConflictError) as exc_info:
        await document_service.create_document_type(
            db_session,
            organization_id=org_id,
            body=DocumentTypeCreateRequest(code="CERT_TRAVAIL", label="Bis"),
            audit=audit,
        )
    assert exc_info.value.code == "DOCUMENT_TYPE_CODE_TAKEN"


# ===========================================================================
# 3. create_document
# ===========================================================================


async def test_create_document_assigns_reference_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    result = await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            employee_id=seed_employee.employee_id,
            title="Certificat 2026",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
            issued_on=date.today(),
            confidentiality_level="INTERNAL",
        ),
        audit=audit,
    )
    await db_session.commit()
    assert result.document_status == "DRAFT"
    assert result.reference.startswith("DOC-CERT_TRA-")
    assert result.confidentiality_level == "INTERNAL"
    assert result.employee_id == seed_employee.employee_id

    rows = (
        (await db_session.execute(select(AuditLog).where(AuditLog.action == "DOCUMENT_CREATED")))
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_create_document_reference_increments(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    refs: list[str] = []
    for i in range(2):
        r = await document_service.create_document(
            db_session,
            organization_id=org_id,
            body=DocumentCreateRequest(
                title=f"Document {i}",
                document_type="CERT_TRAVAIL",
                document_type_id=seed_document_type.document_type_id,
            ),
            audit=audit,
        )
        await db_session.commit()
        refs.append(r.reference)
    assert refs[0].endswith("0001")
    assert refs[1].endswith("0002")


# ===========================================================================
# 4. list_documents
# ===========================================================================


async def test_list_documents_paginates_and_filters_by_type(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    for i in range(3):
        await document_service.create_document(
            db_session,
            organization_id=org_id,
            body=DocumentCreateRequest(
                title=f"Doc {i}",
                document_type="CERT_TRAVAIL",
                document_type_id=seed_document_type.document_type_id,
                employee_id=seed_employee.employee_id,
            ),
            audit=audit,
        )
    await db_session.commit()

    items, total = await document_service.list_documents(
        db_session, organization_id=org_id, user=admin, page=1, page_size=2
    )
    assert total == 3
    assert len(items) == 2

    items, total = await document_service.list_documents(
        db_session,
        organization_id=org_id,
        user=admin,
        document_type="CERT_TRAVAIL",
    )
    assert total == 3


async def test_list_documents_filters_by_search_title(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Alpha Speciale",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Beta Standard",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await db_session.commit()
    items, total = await document_service.list_documents(
        db_session, organization_id=org_id, user=admin, search="Speciale"
    )
    assert total == 1
    assert items[0].title == "Alpha Speciale"


async def test_list_documents_basic_user_cannot_see_confidential(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    # 1 doc internal + 1 doc confidential
    await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Public Memo",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
            confidentiality_level="INTERNAL",
        ),
        audit=audit,
    )
    await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Secret Sauce",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
            confidentiality_level="CONFIDENTIAL",
        ),
        audit=audit,
    )
    await db_session.commit()

    basic_user = _make_basic_user(org_id, user_id)
    items, total = await document_service.list_documents(
        db_session, organization_id=org_id, user=basic_user
    )
    assert total == 1
    assert items[0].title == "Public Memo"


# ===========================================================================
# 5. get_document
# ===========================================================================


async def test_get_document_returns_dto(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Doc Get",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await db_session.commit()
    fetched = await document_service.get_document(db_session, document_id=created.document_id)
    assert fetched.document_id == created.document_id
    assert fetched.title == "Doc Get"


async def test_get_document_unknown_raises(db_session: AsyncSession) -> None:
    with pytest.raises(NotFoundError) as exc_info:
        await document_service.get_document(db_session, document_id=uuid4())
    assert exc_info.value.code == "DOCUMENT_NOT_FOUND"


# ===========================================================================
# 6. update_document_status
# ===========================================================================


async def test_update_document_status_valid_transition_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Workflow",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await db_session.commit()

    updated = await document_service.update_document_status(
        db_session,
        document_id=created.document_id,
        body=DocumentUpdateStatusRequest(document_status="IN_VALIDATION"),
        audit=audit,
    )
    await db_session.commit()
    assert updated.document_status == "IN_VALIDATION"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_STATUS_CHANGED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_update_document_status_invalid_transition_raises(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    """DRAFT -> PUBLISHED n'est pas autorise (passe par IN_VALIDATION / VALIDATED)."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="No skip",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await db_session.commit()

    with pytest.raises(ConflictError) as exc_info:
        await document_service.update_document_status(
            db_session,
            document_id=created.document_id,
            body=DocumentUpdateStatusRequest(document_status="PUBLISHED"),
            audit=audit,
        )
    assert exc_info.value.code == "INVALID_STATUS_TRANSITION"


async def test_update_document_status_archive_sets_archived_at(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Archive me",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await db_session.commit()

    updated = await document_service.update_document_status(
        db_session,
        document_id=created.document_id,
        body=DocumentUpdateStatusRequest(document_status="ARCHIVED"),
        audit=audit,
    )
    await db_session.commit()
    assert updated.document_status == "ARCHIVED"
    assert updated.archived_at is not None


async def test_update_document_status_unknown_raises(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await document_service.update_document_status(
            db_session,
            document_id=uuid4(),
            body=DocumentUpdateStatusRequest(document_status="IN_VALIDATION"),
            audit=audit,
        )
    assert exc_info.value.code == "DOCUMENT_NOT_FOUND"


# ===========================================================================
# 7. list_document_audit_logs
# ===========================================================================


async def test_list_document_audit_logs_filters_by_action(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await document_service.create_document(
        db_session,
        organization_id=org_id,
        body=DocumentCreateRequest(
            title="Log A",
            document_type="CERT_TRAVAIL",
            document_type_id=seed_document_type.document_type_id,
        ),
        audit=audit,
    )
    await document_service.create_document_type(
        db_session,
        organization_id=org_id,
        body=DocumentTypeCreateRequest(code="TYPE_B", label="Type B"),
        audit=audit,
    )
    await db_session.commit()

    items = await document_service.list_document_audit_logs(
        db_session, organization_id=org_id, action="DOCUMENT_CREATED"
    )
    assert len(items) >= 1
    assert all("DOCUMENT_CREATED" in it.action for it in items)


# ===========================================================================
# 8. document_requests (demandes admin)
# ===========================================================================


async def test_create_request_persists_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    result = await document_service.create_request(
        db_session,
        organization_id=org_id,
        requested_by_employee_id=seed_employee.employee_id,
        body=DocumentRequestCreateRequest(
            document_type="Attestation de travail",
            purpose="Demande prêt bancaire",
            needed_by=date.today() + timedelta(days=15),
        ),
        audit=audit,
    )
    await db_session.commit()
    assert result.reference.startswith("DEM-DOC-")
    assert result.request_status == "PENDING"
    assert result.document_type_label == "Attestation de travail"
    assert result.requester_name == "Aline Docu"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_REQUEST_CREATED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_list_requests_filters_by_status(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await document_service.create_request(
        db_session,
        organization_id=org_id,
        requested_by_employee_id=seed_employee.employee_id,
        body=DocumentRequestCreateRequest(
            document_type="Type A",
            purpose="Test",
        ),
        audit=audit,
    )
    await db_session.commit()
    items = await document_service.list_requests(
        db_session, organization_id=org_id, request_status="PENDING"
    )
    assert len(items) == 1
    assert items[0].request_status == "PENDING"


async def test_decide_request_approves_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_request(
        db_session,
        organization_id=org_id,
        requested_by_employee_id=seed_employee.employee_id,
        body=DocumentRequestCreateRequest(
            document_type="Type A",
            purpose="Demande",
        ),
        audit=audit,
    )
    await db_session.commit()

    decided = await document_service.decide_request(
        db_session,
        request_key=str(created.document_request_id),
        body=DocumentRequestDecisionRequest(decision="APPROVED", comment="OK"),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert decided.request_status == "APPROVED"
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_REQUEST_APPROVED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_decide_request_rejects_via_reference_key(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    """Resoud la demande par reference metier (pas UUID) — code DOCUMENT_REQUEST_REJECTED."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_request(
        db_session,
        organization_id=org_id,
        requested_by_employee_id=seed_employee.employee_id,
        body=DocumentRequestCreateRequest(
            document_type="Type B",
            purpose="Reject test",
        ),
        audit=audit,
    )
    await db_session.commit()
    decided = await document_service.decide_request(
        db_session,
        request_key=created.reference,
        body=DocumentRequestDecisionRequest(decision="REJECTED", comment="Non recevable"),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert decided.request_status == "REJECTED"
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_REQUEST_REJECTED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_decide_request_double_decision_conflict(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    created = await document_service.create_request(
        db_session,
        organization_id=org_id,
        requested_by_employee_id=seed_employee.employee_id,
        body=DocumentRequestCreateRequest(
            document_type="Type",
            purpose="Test conflict",
        ),
        audit=audit,
    )
    await db_session.commit()
    await document_service.decide_request(
        db_session,
        request_key=str(created.document_request_id),
        body=DocumentRequestDecisionRequest(decision="APPROVED"),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    with pytest.raises(ConflictError) as exc_info:
        await document_service.decide_request(
            db_session,
            request_key=str(created.document_request_id),
            body=DocumentRequestDecisionRequest(decision="REJECTED"),
            actor_user_id=user_id,
            audit=audit,
        )
    assert exc_info.value.code == "DOCUMENT_REQUEST_ALREADY_DECIDED"


async def test_decide_request_unknown_key_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await document_service.decide_request(
            db_session,
            request_key=str(uuid4()),
            body=DocumentRequestDecisionRequest(decision="APPROVED"),
            actor_user_id=user_id,
            audit=audit,
        )
    assert exc_info.value.code == "DOCUMENT_REQUEST_NOT_FOUND"


# ===========================================================================
# 9. list_document_requirements
# ===========================================================================


async def test_list_document_requirements_returns_with_type_label(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, _user_id = seed_organization
    req = DocumentRequirement(
        organization_id=org_id,
        requirement_code="REQ-CERT-001",
        document_type_id=seed_document_type.document_type_id,
        requirement_scope="GLOBAL",
        contract_type=None,
        is_mandatory=True,
        warning_offset_days=30,
        due_offset_days=60,
        is_active=True,
    )
    db_session.add(req)
    await db_session.commit()
    items = await document_service.list_document_requirements(db_session, organization_id=org_id)
    assert len(items) == 1
    assert items[0].requirement_code == "REQ-CERT-001"
    assert items[0].document_type_code == "CERT_TRAVAIL"
    assert items[0].document_type_label == "Certificat de travail"


# ===========================================================================
# 10. Archive runs + purge (dry_run only — pas d'effets de bord)
# ===========================================================================


async def test_run_document_archive_dry_run_lists_candidates(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    # Documents PUBLISHED simulees en bidouillant directement la table
    doc = Document(
        organization_id=org_id,
        reference="DOC-OLD-2020-0001",
        title="Vieux document",
        document_type="CERT_TRAVAIL",
        document_type_id=seed_document_type.document_type_id,
        document_status="PUBLISHED",
        source_module="DOCUMENTS",
        confidentiality_level="INTERNAL",
        requires_acknowledgement=False,
    )
    db_session.add(doc)
    await db_session.flush([doc])
    doc_id = doc.document_id
    # Bidouille direct la date created_at (TimestampMixin auto-init avec now)
    from sqlalchemy import text

    await db_session.execute(
        text("UPDATE hr.documents SET created_at = :old WHERE document_id = :did"),
        {
            "old": datetime.now(UTC) - timedelta(days=400),
            "did": doc_id,
        },
    )
    await db_session.commit()

    result = await document_service.run_document_archive(
        db_session,
        organization_id=org_id,
        body=DocumentArchiveRunRequest(
            older_than_days=365,
            dry_run=True,
            only_acknowledged=False,
            include_unassigned=True,
        ),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert result.dry_run is True
    assert result.candidates_count == 1
    assert result.archived_count == 0
    # Doc PAS archive en mode dry_run
    db_session.expire_all()
    fresh = (
        await db_session.execute(select(Document).where(Document.document_id == doc_id))
    ).scalar_one()
    assert fresh.document_status == "PUBLISHED"


async def test_run_document_archive_persists_when_not_dry_run(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    doc = Document(
        organization_id=org_id,
        reference="DOC-OLD-2019-0001",
        title="Tres vieux",
        document_type="CERT_TRAVAIL",
        document_type_id=seed_document_type.document_type_id,
        document_status="PUBLISHED",
        source_module="DOCUMENTS",
        confidentiality_level="INTERNAL",
        requires_acknowledgement=False,
    )
    db_session.add(doc)
    await db_session.flush([doc])
    doc_id = doc.document_id
    from sqlalchemy import text

    await db_session.execute(
        text("UPDATE hr.documents SET created_at = :old WHERE document_id = :did"),
        {
            "old": datetime.now(UTC) - timedelta(days=500),
            "did": doc_id,
        },
    )
    await db_session.commit()

    result = await document_service.run_document_archive(
        db_session,
        organization_id=org_id,
        body=DocumentArchiveRunRequest(
            older_than_days=365,
            dry_run=False,
            only_acknowledged=False,
            include_unassigned=True,
        ),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert result.archived_count == 1

    db_session.expire_all()
    fresh = (
        await db_session.execute(select(Document).where(Document.document_id == doc_id))
    ).scalar_one()
    assert fresh.document_status == "ARCHIVED"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "DOCUMENT_ARCHIVE_RUN")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_purge_document_archives_dry_run_no_old_archives(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    """Avec uniquement des documents recents, dry_run -> 0 candidat.

    NB: il existe un trigger DB `trg_documents_updated_at` qui ecrase
    `updated_at = now()` a chaque UPDATE. Impossible de simuler proprement
    un document vieux de 5 ans depuis le code applicatif. Le service
    `purge_document_archives` est donc difficilement testable de bout en
    bout sans toucher au schema. On valide ici le chemin "rien a purger".
    """
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    # Cree un document ARCHIVED recent (donc PAS candidat).
    doc = Document(
        organization_id=org_id,
        reference="DOC-RECENT-ARCH",
        title="Archive recente",
        document_type="CERT_TRAVAIL",
        document_type_id=seed_document_type.document_type_id,
        document_status="ARCHIVED",
        source_module="DOCUMENTS",
        confidentiality_level="INTERNAL",
        requires_acknowledgement=False,
    )
    db_session.add(doc)
    await db_session.commit()

    result = await document_service.purge_document_archives(
        db_session,
        organization_id=org_id,
        body=DocumentArchivePurgeRequest(retention_days=1825, dry_run=True),
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert result.dry_run is True
    assert result.candidates_count == 0
    assert result.purged_documents == 0
    assert result.retention_days == 1825


# ===========================================================================
# 11. compute_document_analytics
# ===========================================================================


async def test_compute_document_analytics_zero_when_empty(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, _user_id = seed_organization
    report = await document_service.compute_document_analytics(db_session, organization_id=org_id)
    assert report.totals.total_documents == 0
    assert report.totals.signed_documents == 0
    assert report.rates.signature_rate == 0.0
    assert report.rates.acknowledgement_rate == 0.0


async def test_compute_document_analytics_counts_documents(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_document_type: DocumentType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    for i in range(3):
        await document_service.create_document(
            db_session,
            organization_id=org_id,
            body=DocumentCreateRequest(
                title=f"Doc {i}",
                document_type="CERT_TRAVAIL",
                document_type_id=seed_document_type.document_type_id,
            ),
            audit=audit,
        )
    await db_session.commit()
    report = await document_service.compute_document_analytics(db_session, organization_id=org_id)
    assert report.totals.total_documents == 3
    # Tous en DRAFT -> dans le breakdown
    assert any(b.label == "DRAFT" and b.count == 3 for b in report.status_breakdown)


# ===========================================================================
# 12. list_document_inbox / overdue / processing_queue (lecture vide)
# ===========================================================================


async def test_list_document_inbox_empty(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, _user_id = seed_organization
    items = await document_service.list_document_inbox(
        db_session, organization_id=org_id, recipient_employee_id=None, recipient_user_id=None
    )
    assert items == []


async def test_list_document_overdue_empty(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, _user_id = seed_organization
    items = await document_service.list_document_overdue(db_session, organization_id=org_id)
    assert items == []


async def test_list_document_processing_queue_empty(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, _user_id = seed_organization
    items = await document_service.list_document_processing_queue(
        db_session, organization_id=org_id
    )
    assert items == []
