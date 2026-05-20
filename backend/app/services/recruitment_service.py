"""Service métier — Recrutement.

V0/V1 : CRUD campagnes + candidatures + transitions de statut + commentaires.
Le matching CV par LLM arrive en vague 5 (PY-051), pour V1 le score reste
calculable manuellement (champ `skills_match_score` éditable).
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.models.recruitment import (
    RecruitmentApplication,
    RecruitmentCampaign,
    RecruitmentComment,
    RecruitmentStatusEvent,
)
from app.schemas.recruitment import (
    ApplicationCommentCreateRequest,
    ApplicationCommentResponse,
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationStatusEventResponse,
    ApplicationStatusUpdateRequest,
    CampaignCreateRequest,
    CampaignResponse,
)


# ============================================================================
# Campaigns
# ============================================================================
async def list_campaigns(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    status: str | None = None,
) -> tuple[list[CampaignResponse], int]:
    base = select(RecruitmentCampaign).where(RecruitmentCampaign.organization_id == organization_id)
    if status:
        base = base.where(RecruitmentCampaign.status == status)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()
    page_stmt = (
        base.order_by(RecruitmentCampaign.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()
    return [CampaignResponse.model_validate(c) for c in rows], int(total)


async def create_campaign(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: CampaignCreateRequest,
    audit: AuditWriter,
) -> CampaignResponse:
    existing = (
        await session.execute(
            select(RecruitmentCampaign).where(
                RecruitmentCampaign.organization_id == organization_id,
                RecruitmentCampaign.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Code campagne '{body.code}' déjà utilisé.", code="CAMPAIGN_CODE_TAKEN"
        )

    campaign = RecruitmentCampaign(
        organization_id=organization_id,
        code=body.code,
        title=body.title,
        direction_id=body.direction_id,
        unit_id=body.unit_id,
        need_position=body.need_position,
        openings=body.openings,
        need_quota=body.need_quota,
        status=body.status,
        start_date=body.start_date,
        end_date=body.end_date,
        owner_user_id=body.owner_user_id,
    )
    session.add(campaign)
    await session.flush([campaign])

    await audit.record(
        action="RECRUITMENT_CAMPAIGN_CREATED",
        target_type="recruitment_campaign",
        target_id=str(campaign.campaign_id),
        after={"code": body.code, "title": body.title, "openings": body.openings},
    )
    return CampaignResponse.model_validate(campaign)


# ============================================================================
# Applications
# ============================================================================
async def list_applications(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    campaign_id: UUID | None = None,
    application_status: str | None = None,
    search: str | None = None,
) -> tuple[list[ApplicationResponse], int]:
    base = select(RecruitmentApplication).where(
        RecruitmentApplication.organization_id == organization_id
    )
    if campaign_id:
        base = base.where(RecruitmentApplication.campaign_id == campaign_id)
    if application_status:
        base = base.where(RecruitmentApplication.application_status == application_status)
    if search:
        like = f"%{search}%"
        base = base.where(
            RecruitmentApplication.candidate_full_name.ilike(like)
            | RecruitmentApplication.reference.ilike(like)
        )

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()
    page_stmt = (
        base.order_by(RecruitmentApplication.received_on.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()
    items = [
        ApplicationResponse(
            application_id=a.application_id,
            organization_id=a.organization_id,
            campaign_id=a.campaign_id,
            reference=a.reference,
            candidate_full_name=a.candidate_full_name,
            candidate_email=a.candidate_email,
            candidate_phone=a.candidate_phone,
            desired_position=a.desired_position,
            source_channel=a.source_channel,
            application_status=a.application_status,
            received_on=a.received_on,
            experience_years=a.experience_years,
            skills_match_score=a.skills_match_score,
            education_score=a.education_score,
            interview_avg_score=a.interview_avg_score,
            test_score=a.test_score,
            metadata=a.application_metadata,
            created_at=a.created_at,
            updated_at=a.updated_at,
        )
        for a in rows
    ]
    return items, int(total)


async def _next_application_reference(session: AsyncSession, organization_id: UUID) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"CAND-{year}-"
    count_stmt = (
        select(func.count())
        .select_from(RecruitmentApplication)
        .where(
            RecruitmentApplication.organization_id == organization_id,
            RecruitmentApplication.reference.startswith(prefix),
        )
    )
    count = (await session.execute(count_stmt)).scalar_one()
    return f"{prefix}{int(count) + 1:05d}"


async def create_application(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: ApplicationCreateRequest,
    audit: AuditWriter,
) -> ApplicationResponse:
    reference = await _next_application_reference(session, organization_id)
    application = RecruitmentApplication(
        organization_id=organization_id,
        campaign_id=body.campaign_id,
        reference=reference,
        candidate_full_name=body.candidate_full_name,
        candidate_email=body.candidate_email,
        candidate_phone=body.candidate_phone,
        identity_number=body.identity_number,
        desired_position=body.desired_position,
        source_channel=body.source_channel,
        application_status="NEW",
        received_on=body.received_on,
        experience_years=body.experience_years,
    )
    session.add(application)
    await session.flush([application])

    await audit.record(
        action="RECRUITMENT_APPLICATION_CREATED",
        target_type="recruitment_application",
        target_id=str(application.application_id),
        after={
            "reference": reference,
            "candidate_full_name": body.candidate_full_name,
            "campaign_id": str(body.campaign_id) if body.campaign_id else None,
        },
    )
    return ApplicationResponse(
        application_id=application.application_id,
        organization_id=application.organization_id,
        campaign_id=application.campaign_id,
        reference=application.reference,
        candidate_full_name=application.candidate_full_name,
        candidate_email=application.candidate_email,
        candidate_phone=application.candidate_phone,
        desired_position=application.desired_position,
        source_channel=application.source_channel,
        application_status=application.application_status,
        received_on=application.received_on,
        experience_years=application.experience_years,
        skills_match_score=application.skills_match_score,
        education_score=application.education_score,
        interview_avg_score=application.interview_avg_score,
        test_score=application.test_score,
        metadata=application.application_metadata,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


async def update_application_status(
    session: AsyncSession,
    *,
    application_id: UUID,
    body: ApplicationStatusUpdateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> ApplicationResponse:
    application = (
        await session.execute(
            select(RecruitmentApplication).where(
                RecruitmentApplication.application_id == application_id
            )
        )
    ).scalar_one_or_none()
    if application is None:
        raise NotFoundError("Candidature introuvable.", code="APPLICATION_NOT_FOUND")

    before_status = application.application_status
    application.application_status = body.application_status

    # Trace status event (immuable)
    event = RecruitmentStatusEvent(
        application_id=application.application_id,
        from_status=before_status,
        to_status=body.application_status,
        changed_by_user_id=actor_user_id,
        note=body.note,
    )
    session.add(event)

    await audit.record(
        action="RECRUITMENT_APPLICATION_STATUS_CHANGED",
        target_type="recruitment_application",
        target_id=str(application.application_id),
        before={"application_status": before_status},
        after={"application_status": body.application_status, "note": body.note},
    )

    return ApplicationResponse(
        application_id=application.application_id,
        organization_id=application.organization_id,
        campaign_id=application.campaign_id,
        reference=application.reference,
        candidate_full_name=application.candidate_full_name,
        candidate_email=application.candidate_email,
        candidate_phone=application.candidate_phone,
        desired_position=application.desired_position,
        source_channel=application.source_channel,
        application_status=application.application_status,
        received_on=application.received_on,
        experience_years=application.experience_years,
        skills_match_score=application.skills_match_score,
        education_score=application.education_score,
        interview_avg_score=application.interview_avg_score,
        test_score=application.test_score,
        metadata=application.application_metadata,
        created_at=application.created_at,
        updated_at=application.updated_at,
    )


async def list_status_events(
    session: AsyncSession, *, application_id: UUID
) -> list[ApplicationStatusEventResponse]:
    stmt = (
        select(RecruitmentStatusEvent)
        .where(RecruitmentStatusEvent.application_id == application_id)
        .order_by(RecruitmentStatusEvent.changed_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [ApplicationStatusEventResponse.model_validate(e) for e in rows]


# ============================================================================
# Comments
# ============================================================================
async def list_comments(
    session: AsyncSession, *, application_id: UUID
) -> list[ApplicationCommentResponse]:
    stmt = (
        select(RecruitmentComment)
        .where(RecruitmentComment.application_id == application_id)
        .order_by(RecruitmentComment.created_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [ApplicationCommentResponse.model_validate(c) for c in rows]


async def add_comment(
    session: AsyncSession,
    *,
    application_id: UUID,
    body: ApplicationCommentCreateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> ApplicationCommentResponse:
    application = (
        await session.execute(
            select(RecruitmentApplication).where(
                RecruitmentApplication.application_id == application_id
            )
        )
    ).scalar_one_or_none()
    if application is None:
        raise NotFoundError("Candidature introuvable.", code="APPLICATION_NOT_FOUND")

    comment = RecruitmentComment(
        application_id=application_id,
        author_user_id=actor_user_id,
        message=body.message,
    )
    session.add(comment)
    await session.flush([comment])

    await audit.record(
        action="RECRUITMENT_APPLICATION_COMMENTED",
        target_type="recruitment_application",
        target_id=str(application_id),
    )
    return ApplicationCommentResponse.model_validate(comment)
