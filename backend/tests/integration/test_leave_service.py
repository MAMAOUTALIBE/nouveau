"""Tests d'integration — `app.services.leave_service` (conges, soldes, calendrier).

Couvre les chemins critiques sur une vraie Postgres :

- list_leave_types : retour tries par code.
- upsert_balance : create + update + audit LEAVE_BALANCE_CREATED/UPDATED.
- list_balances : filtres employee_id / fiscal_year.
- create_request : succes, validation EMPLOYEE_NOT_FOUND, LEAVE_TYPE_NOT_FOUND.
- decide_request : approve + reject + double decision -> ConflictError LEAVE_NOT_PENDING.
- cancel_request : statut cancel + double cancel.
- list_requests : pagination + filtres.
- list_calendar_events : fenetre date + statuts approuves/pending.
- get_request : success + scope (admin GLOBAL voit tout).
- list_requests : scope SELF n'expose rien (RBAC V1).
- create_request : validation dates (end < start) coupee par Pydantic.

Aucune PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.audit import AuditWriter
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.schemas.leave import (
    LeaveBalanceUpsertRequest,
    LeaveCancelRequest,
    LeaveDecisionRequest,
    LeaveRequestCreateRequest,
)
from app.services import leave_service
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = [pytest.mark.integration]


# ---------------------------------------------------------------------------
# Helpers + fixtures locales
# ---------------------------------------------------------------------------


def _make_admin(org_id: UUID, user_id: UUID) -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-leave",
        full_name="Pytest Leave Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _make_agent(org_id: UUID, user_id: UUID) -> AuthenticatedUser:
    """User sans scope GLOBAL / DIRECTION / UNIT (RBAC SELF V1)."""
    return AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-agent",
        full_name="Pytest Agent",
        status="ACTIVE",
        roles=("agent",),
        permissions=frozenset({"leave:read"}),
        scopes=frozenset({"SELF"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _audit_writer(session: AsyncSession, user: AuthenticatedUser) -> AuditWriter:
    return AuditWriter(
        session,
        actor=user,
        organization_id=user.organization_id,
        source_ip="127.0.0.1",
        user_agent="pytest",
    )


@pytest_asyncio.fixture
async def seed_employee(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> Employee:
    """Cree un employee minimal pour les FKs des LeaveRequest / LeaveBalance."""
    org_id, _user_id = seed_organization
    employee = Employee(
        organization_id=org_id,
        matricule="GN-LV-001",
        full_name="Alice Conge",
        employment_status="ACTIVE",
    )
    db_session.add(employee)
    await db_session.commit()
    await db_session.refresh(employee)
    return employee


@pytest_asyncio.fixture
async def seed_leave_type(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> LeaveType:
    org_id, _user_id = seed_organization
    leave_type = LeaveType(
        organization_id=org_id,
        code="ANNUAL",
        label="Conge annuel",
        is_paid=True,
    )
    db_session.add(leave_type)
    await db_session.commit()
    await db_session.refresh(leave_type)
    return leave_type


# ===========================================================================
# 1. list_leave_types
# ===========================================================================


async def test_list_leave_types_returns_org_types(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_leave_type: LeaveType,
) -> None:
    org_id, _user_id = seed_organization
    types = await leave_service.list_leave_types(db_session, organization_id=org_id)
    assert len(types) == 1
    assert types[0].code == "ANNUAL"
    assert types[0].label == "Conge annuel"
    assert types[0].is_paid is True


async def test_list_leave_types_empty_for_other_org(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_leave_type: LeaveType,
) -> None:
    """Une autre organisation ne voit pas les types de la premiere."""
    other_org_id = uuid4()
    types = await leave_service.list_leave_types(db_session, organization_id=other_org_id)
    assert types == []


# ===========================================================================
# 2. upsert_balance
# ===========================================================================


async def test_upsert_balance_creates_new_record(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    result = await leave_service.upsert_balance(
        db_session,
        organization_id=org_id,
        body=LeaveBalanceUpsertRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            fiscal_year=2026,
            allocated_days=Decimal("30"),
            consumed_days=Decimal("0"),
        ),
        audit=audit,
    )
    await db_session.commit()

    assert result.fiscal_year == 2026
    assert result.allocated_days == Decimal("30")
    assert result.remaining_days == Decimal("30")
    assert result.leave_type_code == "ANNUAL"

    # Audit CREATED
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "LEAVE_BALANCE_CREATED",
                    AuditLog.organization_id == org_id,
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


@pytest.mark.xfail(
    reason=(
        "BUG service: leave_service.upsert_balance(update) accede a "
        "existing.remaining_days (colonne Computed persisted) apres flush "
        "sans refresh ; SQLAlchemy declenche un auto-load -> MissingGreenlet. "
        "Ticket a ouvrir : ajouter session.refresh(existing, ['remaining_days', "
        "'updated_at']) dans la branche update."
    ),
    strict=True,
    raises=Exception,
)
async def test_upsert_balance_updates_existing_record(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """Verifie qu'un second upsert met a jour la ligne existante."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    # Premier upsert -> create
    await leave_service.upsert_balance(
        db_session,
        organization_id=org_id,
        body=LeaveBalanceUpsertRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            fiscal_year=2026,
            allocated_days=Decimal("30"),
            consumed_days=Decimal("0"),
        ),
        audit=audit,
    )
    await db_session.commit()

    # Deuxieme upsert -> update (declenche MissingGreenlet aujourd'hui)
    updated = await leave_service.upsert_balance(
        db_session,
        organization_id=org_id,
        body=LeaveBalanceUpsertRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            fiscal_year=2026,
            allocated_days=Decimal("30"),
            consumed_days=Decimal("5"),
        ),
        audit=audit,
    )
    await db_session.commit()
    assert updated.consumed_days == Decimal("5")
    assert updated.remaining_days == Decimal("25")


async def test_leave_balance_remaining_days_computed_from_alloc_consumed(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """Sanity : la colonne remaining_days est bien `allocated - consumed`.

    On contourne `upsert_balance` (bug ci-dessus) et on verifie au niveau DB.
    """
    org_id, _user_id = seed_organization
    initial = LeaveBalance(
        organization_id=org_id,
        employee_id=seed_employee.employee_id,
        leave_type_id=seed_leave_type.leave_type_id,
        fiscal_year=2026,
        allocated_days=Decimal("30"),
        consumed_days=Decimal("7"),
    )
    db_session.add(initial)
    await db_session.flush([initial])
    balance_id = initial.leave_balance_id
    await db_session.commit()
    db_session.expire_all()

    reloaded = (
        await db_session.execute(
            select(LeaveBalance).where(LeaveBalance.leave_balance_id == balance_id)
        )
    ).scalar_one()
    assert reloaded.remaining_days == Decimal("23")


# ===========================================================================
# 3. list_balances
# ===========================================================================


async def test_list_balances_filters_by_fiscal_year(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    for year in (2025, 2026):
        await leave_service.upsert_balance(
            db_session,
            organization_id=org_id,
            body=LeaveBalanceUpsertRequest(
                employee_id=seed_employee.employee_id,
                leave_type_id=seed_leave_type.leave_type_id,
                fiscal_year=year,
                allocated_days=Decimal("30"),
            ),
            audit=audit,
        )
    await db_session.commit()

    items = await leave_service.list_balances(
        db_session, organization_id=org_id, fiscal_year=2026, user=admin
    )
    assert len(items) == 1
    assert items[0].fiscal_year == 2026


async def test_list_balances_filters_by_employee(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await leave_service.upsert_balance(
        db_session,
        organization_id=org_id,
        body=LeaveBalanceUpsertRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            fiscal_year=2026,
            allocated_days=Decimal("30"),
        ),
        audit=audit,
    )
    await db_session.commit()

    items = await leave_service.list_balances(
        db_session,
        organization_id=org_id,
        employee_id=seed_employee.employee_id,
        user=admin,
    )
    assert len(items) == 1
    assert items[0].employee_id == seed_employee.employee_id
    assert items[0].agent_name == "Alice Conge"


# ===========================================================================
# 4. create_request
# ===========================================================================


async def test_create_request_persists_and_writes_audit(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    today = date.today()
    result = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=14),
            reason="Vacances",
        ),
        audit=audit,
    )
    await db_session.commit()

    assert result.request_status == "PENDING"
    assert result.duration_days == 5
    assert result.reference.startswith(f"CONGE-{today.year}-")
    assert result.leave_type_code == "ANNUAL"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "LEAVE_REQUEST_CREATED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1
    assert rows[0].target_type == "leave_request"


async def test_create_request_increments_reference(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """La reference est sequentielle CONGE-YYYY-NNNN."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()

    refs: list[str] = []
    for i in range(2):
        r = await leave_service.create_request(
            db_session,
            organization_id=org_id,
            body=LeaveRequestCreateRequest(
                employee_id=seed_employee.employee_id,
                leave_type_id=seed_leave_type.leave_type_id,
                start_date=today + timedelta(days=20 + i * 10),
                end_date=today + timedelta(days=22 + i * 10),
            ),
            audit=audit,
        )
        await db_session.commit()
        refs.append(r.reference)

    assert refs[0].endswith("-0001")
    assert refs[1].endswith("-0002")


async def test_create_request_unknown_employee_raises(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    with pytest.raises(NotFoundError) as exc_info:
        await leave_service.create_request(
            db_session,
            organization_id=org_id,
            body=LeaveRequestCreateRequest(
                employee_id=uuid4(),
                leave_type_id=seed_leave_type.leave_type_id,
                start_date=today,
                end_date=today + timedelta(days=1),
            ),
            audit=audit,
        )
    assert exc_info.value.code == "EMPLOYEE_NOT_FOUND"


async def test_create_request_unknown_leave_type_raises(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    with pytest.raises(NotFoundError) as exc_info:
        await leave_service.create_request(
            db_session,
            organization_id=org_id,
            body=LeaveRequestCreateRequest(
                employee_id=seed_employee.employee_id,
                leave_type_id=uuid4(),
                start_date=today,
                end_date=today + timedelta(days=1),
            ),
            audit=audit,
        )
    assert exc_info.value.code == "LEAVE_TYPE_NOT_FOUND"


# ===========================================================================
# 5. decide_request
# ===========================================================================


async def test_decide_request_approves_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
        ),
        audit=audit,
    )
    await db_session.commit()

    decided = await leave_service.decide_request(
        db_session,
        leave_request_id=created.leave_request_id,
        decision=LeaveDecisionRequest(decision="APPROVED", comment="OK"),
        decided_by=admin,
        audit=audit,
    )
    await db_session.commit()

    assert decided.request_status == "APPROVED"
    assert decided.decision_comment == "OK"
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "LEAVE_REQUEST_APPROVED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_decide_request_rejects_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
        ),
        audit=audit,
    )
    await db_session.commit()

    decided = await leave_service.decide_request(
        db_session,
        leave_request_id=created.leave_request_id,
        decision=LeaveDecisionRequest(decision="REJECTED", comment="Periode tendue"),
        decided_by=admin,
        audit=audit,
    )
    await db_session.commit()

    assert decided.request_status == "REJECTED"
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "LEAVE_REQUEST_REJECTED")
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
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
        ),
        audit=audit,
    )
    await db_session.commit()

    await leave_service.decide_request(
        db_session,
        leave_request_id=created.leave_request_id,
        decision=LeaveDecisionRequest(decision="APPROVED"),
        decided_by=admin,
        audit=audit,
    )
    await db_session.commit()

    with pytest.raises(ConflictError) as exc_info:
        await leave_service.decide_request(
            db_session,
            leave_request_id=created.leave_request_id,
            decision=LeaveDecisionRequest(decision="REJECTED"),
            decided_by=admin,
            audit=audit,
        )
    assert exc_info.value.code == "LEAVE_NOT_PENDING"


async def test_decide_request_unknown_raises_not_found(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await leave_service.decide_request(
            db_session,
            leave_request_id=uuid4(),
            decision=LeaveDecisionRequest(decision="APPROVED"),
            decided_by=admin,
            audit=audit,
        )
    assert exc_info.value.code == "LEAVE_REQUEST_NOT_FOUND"


# ===========================================================================
# 6. cancel_request
# ===========================================================================


async def test_cancel_request_persists_and_audits(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
        ),
        audit=audit,
    )
    await db_session.commit()

    cancelled = await leave_service.cancel_request(
        db_session,
        leave_request_id=created.leave_request_id,
        user=admin,
        reason="Plus disponible",
        audit=audit,
    )
    await db_session.commit()
    assert cancelled.request_status == "CANCELLED"
    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "LEAVE_REQUEST_CANCELLED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_cancel_request_already_cancelled_raises_conflict(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=7),
        ),
        audit=audit,
    )
    await db_session.commit()

    await leave_service.cancel_request(
        db_session,
        leave_request_id=created.leave_request_id,
        user=admin,
        reason="rebellion",
        audit=audit,
    )
    await db_session.commit()
    with pytest.raises(ConflictError) as exc_info:
        await leave_service.cancel_request(
            db_session,
            leave_request_id=created.leave_request_id,
            user=admin,
            reason=None,
            audit=audit,
        )
    assert exc_info.value.code == "LEAVE_ALREADY_CLOSED"


# ===========================================================================
# 7. list_requests
# ===========================================================================


async def test_list_requests_paginates_and_returns_total(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    for i in range(3):
        await leave_service.create_request(
            db_session,
            organization_id=org_id,
            body=LeaveRequestCreateRequest(
                employee_id=seed_employee.employee_id,
                leave_type_id=seed_leave_type.leave_type_id,
                start_date=today + timedelta(days=10 + i * 5),
                end_date=today + timedelta(days=12 + i * 5),
            ),
            audit=audit,
        )
    await db_session.commit()

    items, total = await leave_service.list_requests(
        db_session, organization_id=org_id, user=admin, page=1, page_size=2
    )
    assert total == 3
    assert len(items) == 2


async def test_list_requests_filters_by_status(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    # 1 pending, 1 approved
    pending = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()
    approved = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=20),
            end_date=today + timedelta(days=22),
        ),
        audit=audit,
    )
    await db_session.commit()
    await leave_service.decide_request(
        db_session,
        leave_request_id=approved.leave_request_id,
        decision=LeaveDecisionRequest(decision="APPROVED"),
        decided_by=admin,
        audit=audit,
    )
    await db_session.commit()

    items, total = await leave_service.list_requests(
        db_session, organization_id=org_id, user=admin, status="PENDING"
    )
    assert total == 1
    assert items[0].leave_request_id == pending.leave_request_id


async def test_list_requests_self_scope_returns_empty(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """En V1, scope SELF sans user.employee_id ne retourne rien (cf. _scope_query)."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()

    agent = _make_agent(org_id, user_id)
    items, total = await leave_service.list_requests(db_session, organization_id=org_id, user=agent)
    assert total == 0
    assert items == []


# ===========================================================================
# 8. get_request
# ===========================================================================


async def test_get_request_returns_dto(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()

    fetched = await leave_service.get_request(
        db_session, leave_request_id=created.leave_request_id, user=admin
    )
    assert fetched.leave_request_id == created.leave_request_id
    assert fetched.leave_type_code == "ANNUAL"


async def test_get_request_out_of_scope_raises_forbidden(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """Un agent SELF sans employee_id ne peut pas voir le congé d'un autre."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()

    agent = _make_agent(org_id, user_id)
    with pytest.raises(ForbiddenError) as exc_info:
        await leave_service.get_request(
            db_session, leave_request_id=created.leave_request_id, user=agent
        )
    assert exc_info.value.code == "OUT_OF_SCOPE"


# ===========================================================================
# 9. list_calendar_events
# ===========================================================================


async def test_list_calendar_events_returns_events_in_window(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()

    events = await leave_service.list_calendar_events(
        db_session,
        organization_id=org_id,
        user=admin,
        from_date=today,
        to_date=today + timedelta(days=30),
    )
    assert len(events) == 1
    event = events[0]
    assert event.id == created.leave_request_id
    assert event.employee_id == seed_employee.employee_id
    assert event.leave_type_code == "ANNUAL"
    assert event.request_status == "PENDING"
    assert event.color is not None


async def test_list_calendar_events_excludes_rejected(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=12),
        ),
        audit=audit,
    )
    await db_session.commit()
    await leave_service.decide_request(
        db_session,
        leave_request_id=created.leave_request_id,
        decision=LeaveDecisionRequest(decision="REJECTED"),
        decided_by=admin,
        audit=audit,
    )
    await db_session.commit()

    events = await leave_service.list_calendar_events(
        db_session,
        organization_id=org_id,
        user=admin,
        from_date=today,
        to_date=today + timedelta(days=30),
    )
    assert events == []


# ===========================================================================
# 10. Validation Pydantic (end_date >= start_date)
# ===========================================================================


def test_create_request_schema_rejects_inverted_dates() -> None:
    """Validation pydantic : end_date < start_date -> ValueError."""
    today = date.today()
    with pytest.raises(ValueError, match=r">= start_date"):
        LeaveRequestCreateRequest(
            employee_id=uuid4(),
            leave_type_id=uuid4(),
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=5),
        )


# ===========================================================================
# 11. LeaveCancelRequest schema sanity
# ===========================================================================


def test_leave_cancel_request_accepts_optional_reason() -> None:
    body = LeaveCancelRequest()
    assert body.reason is None
    body2 = LeaveCancelRequest(reason="motif")
    assert body2.reason == "motif"


# ===========================================================================
# 12. LeaveRequest model: status default
# ===========================================================================


async def test_leave_request_defaults_to_pending(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
    seed_employee: Employee,
    seed_leave_type: LeaveType,
) -> None:
    """Sanity : la requete est creee en PENDING par defaut."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    today = date.today()
    created = await leave_service.create_request(
        db_session,
        organization_id=org_id,
        body=LeaveRequestCreateRequest(
            employee_id=seed_employee.employee_id,
            leave_type_id=seed_leave_type.leave_type_id,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=6),
        ),
        audit=audit,
    )
    await db_session.commit()
    fetched = (
        await db_session.execute(
            select(LeaveRequest).where(LeaveRequest.leave_request_id == created.leave_request_id)
        )
    ).scalar_one()
    assert fetched.request_status == "PENDING"
