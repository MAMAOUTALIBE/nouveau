"""Tests d'integration — `app.services.recruitment_service` (campagnes + candidatures).

Couvre les chemins critiques metier sur une vraie Postgres :

- create_campaign : creation + audit CAMPAIGN_CREATED.
- create_campaign : doublon code -> ConflictError CAMPAIGN_CODE_TAKEN.
- list_campaigns : pagination + filtre status.
- create_application : reference auto-incrementee + audit.
- update_application_status : transition + status_event + audit.
- update_application_status sur candidature inexistante -> NotFoundError.
- list_applications : pagination + filtres + recherche substring.
- list_status_events : trace immuable.
- add_comment : creation + audit + ref valide.
- list_onboarding : seuls les candidats HIRED apparaissent.
- get_scoring_policy : retourne la policy par defaut sans config.
- update_scoring_policy : upsert + audit.
- list_application_scores : tri descendant + rang.
- suggest_shortlist : top-N + champs justification + validation_required.
- validate_shortlist_entry : create + audit + reference inexistante.

Aucune PII reelle : valeurs synthetiques uniquement.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.recruitment import (
    RecruitmentApplication,
    RecruitmentStatusEvent,
)
from app.schemas.recruitment import (
    ApplicationCommentCreateRequest,
    ApplicationCreateRequest,
    ApplicationStatusUpdateRequest,
    CampaignCreateRequest,
    ScoringCriterion,
    ShortlistValidateRequest,
)
from app.services import recruitment_service
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
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
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


@pytest_asyncio.fixture
async def seeded_campaign(
    db_session: AsyncSession,
    seed_organization: tuple[UUID, UUID],
) -> tuple[UUID, UUID]:
    """Cree une campagne minimale et retourne (campaign_id, org_id)."""
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    campaign = await recruitment_service.create_campaign(
        db_session,
        organization_id=org_id,
        body=CampaignCreateRequest(
            code="CAMP-2026-001",
            title="Campagne de test 2026",
            openings=3,
            status="ACTIVE",
        ),
        audit=audit,
    )
    await db_session.commit()
    return campaign.campaign_id, org_id


# ===========================================================================
# 1. create_campaign
# ===========================================================================


async def test_create_campaign_persists_and_audits(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)

    result = await recruitment_service.create_campaign(
        db_session,
        organization_id=org_id,
        body=CampaignCreateRequest(
            code="CAMP-2026-A",
            title="Campagne A",
            openings=2,
            need_position="Analyste",
            status="ACTIVE",
        ),
        audit=audit,
    )
    await db_session.commit()
    assert result.code == "CAMP-2026-A"
    assert result.title == "Campagne A"
    assert result.openings == 2
    assert result.status == "ACTIVE"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "RECRUITMENT_CAMPAIGN_CREATED",
                    AuditLog.organization_id == org_id,
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1
    assert rows[0].target_type == "recruitment_campaign"
    assert rows[0].target_id == str(result.campaign_id)


async def test_create_campaign_duplicate_code_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await recruitment_service.create_campaign(
        db_session,
        organization_id=org_id,
        body=CampaignCreateRequest(code="DUP-001", title="Premiere", openings=1),
        audit=audit,
    )
    await db_session.commit()
    with pytest.raises(ConflictError) as exc_info:
        await recruitment_service.create_campaign(
            db_session,
            organization_id=org_id,
            body=CampaignCreateRequest(code="DUP-001", title="Seconde", openings=1),
            audit=audit,
        )
    assert exc_info.value.code == "CAMPAIGN_CODE_TAKEN"


# ===========================================================================
# 2. list_campaigns
# ===========================================================================


async def test_list_campaigns_paginates(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    for i in range(3):
        await recruitment_service.create_campaign(
            db_session,
            organization_id=org_id,
            body=CampaignCreateRequest(
                code=f"CAMP-LST-{i:03d}",
                title=f"Liste {i}",
                openings=1,
            ),
            audit=audit,
        )
    await db_session.commit()

    items, total = await recruitment_service.list_campaigns(
        db_session, organization_id=org_id, page=1, page_size=2
    )
    assert total == 3
    assert len(items) == 2


async def test_list_campaigns_filters_by_status(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    await recruitment_service.create_campaign(
        db_session,
        organization_id=org_id,
        body=CampaignCreateRequest(code="ACT-1", title="Active", status="ACTIVE", openings=1),
        audit=audit,
    )
    await recruitment_service.create_campaign(
        db_session,
        organization_id=org_id,
        body=CampaignCreateRequest(code="CLO-1", title="Close", status="CLOSED", openings=1),
        audit=audit,
    )
    await db_session.commit()

    items, total = await recruitment_service.list_campaigns(
        db_session, organization_id=org_id, status="CLOSED"
    )
    assert total == 1
    assert items[0].code == "CLO-1"


# ===========================================================================
# 3. create_application
# ===========================================================================


async def test_create_application_assigns_reference_and_audits(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    user_id = uuid4()
    # On reutilise le user system de seed_organization via une lecture
    # Mais ici on a besoin d'un audit ; recharge admin user via seed.
    # Simplification : on cree un AuditWriter avec un actor minimal.
    admin = AuthenticatedUser(
        user_id=user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    # Recharge le user_id reel (FK audit_logs.user_id).
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)

    result = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Alice Govgn",
            candidate_email="alice@gov.gn",
            desired_position="Analyste",
            experience_years=3,
        ),
        audit=audit,
    )
    await db_session.commit()

    assert result.candidate_full_name == "Alice Govgn"
    assert result.candidate_email == "alice@gov.gn"
    assert result.application_status == "NEW"
    assert result.reference.startswith("CAND-")
    assert result.reference.endswith("00001")

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "RECRUITMENT_APPLICATION_CREATED",
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_create_application_increments_reference(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)

    refs: list[str] = []
    for name in ("alice", "bob"):
        result = await recruitment_service.create_application(
            db_session,
            organization_id=org_id,
            body=ApplicationCreateRequest(
                campaign_id=campaign_id,
                candidate_full_name=name.title(),
                candidate_email=f"{name}@gov.gn",
                experience_years=1,
            ),
            audit=audit,
        )
        await db_session.commit()
        refs.append(result.reference)

    assert refs[0].endswith("00001")
    assert refs[1].endswith("00002")


# ===========================================================================
# 4. update_application_status
# ===========================================================================


async def test_update_application_status_records_event_and_audits(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    created = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Diane Status",
            candidate_email="diane@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    updated = await recruitment_service.update_application_status(
        db_session,
        application_id=created.application_id,
        body=ApplicationStatusUpdateRequest(
            application_status="PRESELECTED",
            note="Pre-selectionne par jury",
        ),
        actor_user_id=real_user_id,
        audit=audit,
    )
    await db_session.commit()

    assert updated.application_status == "PRESELECTED"

    # Event en base
    events = (
        (
            await db_session.execute(
                select(RecruitmentStatusEvent).where(
                    RecruitmentStatusEvent.application_id == created.application_id
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(events) == 1
    assert events[0].from_status == "NEW"
    assert events[0].to_status == "PRESELECTED"
    assert events[0].note == "Pre-selectionne par jury"

    audit_rows = (
        (
            await db_session.execute(
                select(AuditLog).where(
                    AuditLog.action == "RECRUITMENT_APPLICATION_STATUS_CHANGED",
                    AuditLog.target_id == str(created.application_id),
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(audit_rows) == 1


async def test_update_application_status_unknown_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await recruitment_service.update_application_status(
            db_session,
            application_id=uuid4(),
            body=ApplicationStatusUpdateRequest(application_status="HIRED"),
            actor_user_id=user_id,
            audit=audit,
        )
    assert exc_info.value.code == "APPLICATION_NOT_FOUND"


# ===========================================================================
# 5. list_applications
# ===========================================================================


async def test_list_applications_paginates_and_filters_by_search(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)

    for name in ("Alice Govgn", "Bob Other", "Charlie Special"):
        await recruitment_service.create_application(
            db_session,
            organization_id=org_id,
            body=ApplicationCreateRequest(
                campaign_id=campaign_id,
                candidate_full_name=name,
                candidate_email=f"{name.split()[0].lower()}@gov.gn",
            ),
            audit=audit,
        )
    await db_session.commit()

    items, total = await recruitment_service.list_applications(
        db_session, organization_id=org_id, search="Govgn"
    )
    assert total == 1
    assert items[0].candidate_full_name == "Alice Govgn"

    # Pagination
    items, total = await recruitment_service.list_applications(
        db_session, organization_id=org_id, page=1, page_size=2
    )
    assert total == 3
    assert len(items) == 2


async def test_list_applications_filters_by_status(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    a = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Erwan New",
            candidate_email="erwan@gov.gn",
        ),
        audit=audit,
    )
    b = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Fanta Hired",
            candidate_email="fanta@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()
    await recruitment_service.update_application_status(
        db_session,
        application_id=b.application_id,
        body=ApplicationStatusUpdateRequest(application_status="HIRED"),
        actor_user_id=real_user_id,
        audit=audit,
    )
    await db_session.commit()

    items, total = await recruitment_service.list_applications(
        db_session, organization_id=org_id, application_status="HIRED"
    )
    assert total == 1
    assert items[0].application_id == b.application_id
    # 'a' reste NEW
    assert a.application_status == "NEW"


# ===========================================================================
# 6. list_status_events
# ===========================================================================


async def test_list_status_events_returns_history(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    created = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Hugo Histo",
            candidate_email="hugo@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()
    # 2 transitions
    for status in ("PRESELECTED", "INTERVIEW"):
        await recruitment_service.update_application_status(
            db_session,
            application_id=created.application_id,
            body=ApplicationStatusUpdateRequest(application_status=status),
            actor_user_id=real_user_id,
            audit=audit,
        )
        await db_session.commit()

    events = await recruitment_service.list_status_events(
        db_session, application_id=created.application_id
    )
    assert len(events) == 2
    # Ordre desc : INTERVIEW d'abord
    assert events[0].to_status == "INTERVIEW"
    assert events[1].to_status == "PRESELECTED"


# ===========================================================================
# 7. add_comment + list_comments
# ===========================================================================


async def test_add_comment_creates_row_and_audits(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    created = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Ines Talk",
            candidate_email="ines@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()
    await recruitment_service.add_comment(
        db_session,
        application_id=created.application_id,
        body=ApplicationCommentCreateRequest(message="Bon profil"),
        actor_user_id=real_user_id,
        audit=audit,
    )
    await db_session.commit()

    comments = await recruitment_service.list_comments(
        db_session, application_id=created.application_id
    )
    assert len(comments) == 1
    assert comments[0].message == "Bon profil"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "RECRUITMENT_APPLICATION_COMMENTED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_add_comment_unknown_application_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await recruitment_service.add_comment(
            db_session,
            application_id=uuid4(),
            body=ApplicationCommentCreateRequest(message="ghost"),
            actor_user_id=user_id,
            audit=audit,
        )
    assert exc_info.value.code == "APPLICATION_NOT_FOUND"


# ===========================================================================
# 8. Onboarding
# ===========================================================================


async def test_list_onboarding_only_hired(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    hired = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Julie Recrue",
            candidate_email="julie@gov.gn",
            desired_position="Analyste",
            received_on=date.today(),
        ),
        audit=audit,
    )
    not_hired = await recruitment_service.create_application(  # noqa: F841
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Karim Pas-Encore",
            candidate_email="karim@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()
    await recruitment_service.update_application_status(
        db_session,
        application_id=hired.application_id,
        body=ApplicationStatusUpdateRequest(application_status="HIRED"),
        actor_user_id=real_user_id,
        audit=audit,
    )
    await db_session.commit()

    items = await recruitment_service.list_onboarding(db_session, organization_id=org_id)
    assert len(items) == 1
    assert items[0].agent == "Julie Recrue"
    assert items[0].position == "Analyste"
    assert items[0].status in ("Terminé", "En cours")
    assert len(items[0].checklist) >= 4


# ===========================================================================
# 9. Scoring policies
# ===========================================================================


async def test_get_scoring_policy_returns_defaults_when_unset(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, _user_id = seed_organization
    policy = await recruitment_service.get_scoring_policy(db_session, organization_id=org_id)
    assert policy.updated_at is None
    assert len(policy.criteria) == 5
    keys = {c.key for c in policy.criteria}
    assert keys == {
        "experienceYears",
        "skillsMatch",
        "educationLevel",
        "interviewAverage",
        "testScore",
    }


async def test_update_scoring_policy_upserts_and_audits(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    new_criteria = [
        ScoringCriterion(key="experienceYears", label="Exp", weight=40, maxYears=5),
        ScoringCriterion(key="skillsMatch", label="Skills", weight=60),
    ]
    result = await recruitment_service.update_scoring_policy(
        db_session,
        organization_id=org_id,
        criteria=new_criteria,
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert len(result.criteria) == 2
    assert result.criteria[0].weight == 40

    # Second update -> upsert (pas de doublon)
    new_criteria_2 = [
        ScoringCriterion(key="skillsMatch", label="Skills v2", weight=100),
    ]
    result2 = await recruitment_service.update_scoring_policy(
        db_session,
        organization_id=org_id,
        criteria=new_criteria_2,
        actor_user_id=user_id,
        audit=audit,
    )
    await db_session.commit()
    assert len(result2.criteria) == 1
    assert result2.criteria[0].label == "Skills v2"

    audit_rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "RECRUITMENT_SCORING_POLICY_UPDATED")
            )
        )
        .scalars()
        .all()
    )
    assert len(audit_rows) == 2


# ===========================================================================
# 10. list_application_scores + suggest_shortlist
# ===========================================================================


async def test_list_application_scores_ranks_descending(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    # Cree 3 candidatures avec experience_years differents
    for years, name in [(10, "Top"), (3, "Moyen"), (0, "Junior")]:
        await recruitment_service.create_application(
            db_session,
            organization_id=org_id,
            body=ApplicationCreateRequest(
                campaign_id=campaign_id,
                candidate_full_name=name,
                candidate_email=f"{name.lower()}@gov.gn",
                experience_years=years,
            ),
            audit=audit,
        )
    await db_session.commit()
    # Pour les scores : on patch directement la colonne skills_match_score
    apps = (await db_session.execute(select(RecruitmentApplication))).scalars().all()
    score_map = {"Top": 95, "Moyen": 60, "Junior": 30}
    for a in apps:
        a.skills_match_score = Decimal(str(score_map[a.candidate_full_name]))
    await db_session.commit()

    report = await recruitment_service.list_application_scores(db_session, organization_id=org_id)
    assert len(report.items) == 3
    # Top => rank 1
    assert report.items[0].candidate == "Top"
    assert report.items[0].rank == 1
    assert report.items[2].candidate == "Junior"
    assert report.items[2].rank == 3
    # Scores decroissants
    scores = [item.total_score for item in report.items]
    assert scores == sorted(scores, reverse=True)


async def test_suggest_shortlist_top_n(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    for years, name in [(10, "Top"), (3, "Moyen"), (0, "Junior")]:
        await recruitment_service.create_application(
            db_session,
            organization_id=org_id,
            body=ApplicationCreateRequest(
                campaign_id=campaign_id,
                candidate_full_name=name,
                candidate_email=f"{name.lower()}@gov.gn",
                experience_years=years,
            ),
            audit=audit,
        )
    await db_session.commit()
    apps = (await db_session.execute(select(RecruitmentApplication))).scalars().all()
    score_map = {"Top": 95, "Moyen": 60, "Junior": 30}
    for a in apps:
        a.skills_match_score = Decimal(str(score_map[a.candidate_full_name]))
    await db_session.commit()

    suggestion = await recruitment_service.suggest_shortlist(
        db_session, organization_id=org_id, top_n=2
    )
    assert suggestion.top_n == 2
    assert suggestion.total_candidates == 3
    assert len(suggestion.suggested) == 2
    assert suggestion.suggested[0].rank == 1
    # Le top a son justification non vide
    assert suggestion.suggested[0].justification != ""
    # Tous sont en attente PENDING par defaut (pas de validation enregistree)
    assert all(entry.validation_status == "PENDING" for entry in suggestion.suggested)


# ===========================================================================
# 11. validate_shortlist_entry
# ===========================================================================


async def test_validate_shortlist_entry_creates_and_audits(
    db_session: AsyncSession, seeded_campaign: tuple[UUID, UUID]
) -> None:
    campaign_id, org_id = seeded_campaign
    from app.models.user import User

    real_user_id = (await db_session.execute(select(User.user_id))).scalar_one()
    admin = AuthenticatedUser(
        user_id=real_user_id,
        organization_id=org_id,
        username="pytest-rec",
        full_name="Pytest Recruit Admin",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )
    audit = _audit_writer(db_session, admin)
    application = await recruitment_service.create_application(
        db_session,
        organization_id=org_id,
        body=ApplicationCreateRequest(
            campaign_id=campaign_id,
            candidate_full_name="Liam Valid",
            candidate_email="liam@gov.gn",
        ),
        audit=audit,
    )
    await db_session.commit()

    result = await recruitment_service.validate_shortlist_entry(
        db_session,
        organization_id=org_id,
        reference=application.reference,
        body=ShortlistValidateRequest(decision="VALIDATED", note="Profil retenu"),
        actor_user_id=real_user_id,
        actor_full_name="Pytest Recruit Admin",
        audit=audit,
    )
    await db_session.commit()
    assert result.decision == "VALIDATED"
    assert result.validated_by == "Pytest Recruit Admin"

    rows = (
        (
            await db_session.execute(
                select(AuditLog).where(AuditLog.action == "RECRUITMENT_SHORTLIST_VALIDATED")
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1


async def test_validate_shortlist_entry_unknown_reference_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await recruitment_service.validate_shortlist_entry(
            db_session,
            organization_id=org_id,
            reference="CAND-2999-99999",
            body=ShortlistValidateRequest(decision="REJECTED"),
            actor_user_id=user_id,
            actor_full_name="Pytest",
            audit=audit,
        )
    assert exc_info.value.code == "SHORTLIST_APPLICATION_NOT_FOUND"


async def test_validate_shortlist_entry_empty_reference_raises(
    db_session: AsyncSession, seed_organization: tuple[UUID, UUID]
) -> None:
    org_id, user_id = seed_organization
    admin = _make_admin(org_id, user_id)
    audit = _audit_writer(db_session, admin)
    with pytest.raises(NotFoundError) as exc_info:
        await recruitment_service.validate_shortlist_entry(
            db_session,
            organization_id=org_id,
            reference="   ",
            body=ShortlistValidateRequest(decision="VALIDATED"),
            actor_user_id=user_id,
            actor_full_name="Pytest",
            audit=audit,
        )
    assert exc_info.value.code == "SHORTLIST_REFERENCE_MISSING"
