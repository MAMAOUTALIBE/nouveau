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
    RecruitmentScoringPolicy,
    RecruitmentStatusEvent,
)
from app.models.user import User
from app.schemas.recruitment import (
    ApplicationCommentCreateRequest,
    ApplicationCommentResponse,
    ApplicationCreateRequest,
    ApplicationResponse,
    ApplicationScoreDetail,
    ApplicationScoreEntry,
    ApplicationScoresResponse,
    ApplicationStatusEventResponse,
    ApplicationStatusUpdateRequest,
    CampaignCreateRequest,
    CampaignResponse,
    OnboardingItemResponse,
    ScoringCriterion,
    ScoringPolicyResponse,
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


# ============================================================================
# Intégration (onboarding) — dérivé des candidatures recrutées
# ============================================================================
_ONBOARDING_CHECKLIST: tuple[str, ...] = (
    "Signature du contrat d'engagement",
    "Création du compte utilisateur et des accès",
    "Remise du matériel de travail",
    "Formation d'accueil et présentation des services",
    "Affectation et prise de poste effective",
    "Entretien de fin de période d'essai",
)


async def list_onboarding(
    session: AsyncSession,
    *,
    organization_id: UUID,
) -> list[OnboardingItemResponse]:
    """Parcours d'intégration dérivé des candidatures recrutées (statut HIRED)."""
    stmt = (
        select(RecruitmentApplication)
        .where(
            RecruitmentApplication.organization_id == organization_id,
            RecruitmentApplication.application_status == "HIRED",
        )
        .order_by(RecruitmentApplication.received_on.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()

    today = datetime.now(UTC).date()
    items: list[OnboardingItemResponse] = []
    for application in rows:
        start_date = application.received_on or application.created_at.date()
        days_elapsed = (today - start_date).days
        status = "Terminé" if days_elapsed > 90 else "En cours"
        items.append(
            OnboardingItemResponse(
                application_reference=application.reference,
                agent=application.candidate_full_name,
                position=application.desired_position or "—",
                start_date=start_date,
                status=status,
                checklist=list(_ONBOARDING_CHECKLIST),
            )
        )
    return items


# ============================================================================
# Scoring des candidatures
# ============================================================================
# Politique par défaut si l'organisation n'en a pas encore configuré une —
# alignée sur le `defaultScoringPolicy` du frontend.
_DEFAULT_SCORING_CRITERIA: tuple[dict[str, object], ...] = (
    {"key": "experienceYears", "label": "Expérience pertinente", "weight": 25, "maxYears": 10},
    {"key": "skillsMatch", "label": "Adéquation compétences", "weight": 30},
    {"key": "educationLevel", "label": "Niveau académique", "weight": 15},
    {"key": "interviewAverage", "label": "Évaluation entretien", "weight": 20},
    {"key": "testScore", "label": "Score test technique", "weight": 10},
)


def _scoring_criteria(policy: RecruitmentScoringPolicy | None) -> list[ScoringCriterion]:
    """Critères de la politique, ou les critères par défaut si non configurée."""
    raw = list(policy.criteria) if policy and policy.criteria else list(_DEFAULT_SCORING_CRITERIA)
    return [ScoringCriterion.model_validate(item) for item in raw]


async def _get_scoring_policy_row(
    session: AsyncSession, organization_id: UUID
) -> RecruitmentScoringPolicy | None:
    return (
        await session.execute(
            select(RecruitmentScoringPolicy).where(
                RecruitmentScoringPolicy.organization_id == organization_id
            )
        )
    ).scalar_one_or_none()


async def _resolve_user_name(session: AsyncSession, user_id: UUID | None) -> str | None:
    if user_id is None:
        return None
    return (
        await session.execute(select(User.full_name).where(User.user_id == user_id))
    ).scalar_one_or_none()


async def get_scoring_policy(
    session: AsyncSession, *, organization_id: UUID
) -> ScoringPolicyResponse:
    """Politique de scoring de l'organisation (critères par défaut si absente)."""
    policy = await _get_scoring_policy_row(session, organization_id)
    return ScoringPolicyResponse(
        criteria=_scoring_criteria(policy),
        updated_at=policy.updated_at if policy else None,
        updated_by=(
            await _resolve_user_name(session, policy.updated_by_user_id) if policy else None
        ),
    )


async def update_scoring_policy(
    session: AsyncSession,
    *,
    organization_id: UUID,
    criteria: list[ScoringCriterion],
    actor_user_id: UUID,
    audit: AuditWriter,
) -> ScoringPolicyResponse:
    """Crée ou met à jour (upsert) la politique de scoring de l'organisation."""
    serialized = [c.model_dump(mode="json") for c in criteria]
    policy = await _get_scoring_policy_row(session, organization_id)
    if policy is None:
        policy = RecruitmentScoringPolicy(
            organization_id=organization_id,
            criteria=serialized,
            updated_by_user_id=actor_user_id,
        )
        session.add(policy)
    else:
        policy.criteria = serialized
        policy.updated_by_user_id = actor_user_id
    await session.flush([policy])
    await session.refresh(policy, ["updated_at"])
    await audit.record(
        action="RECRUITMENT_SCORING_POLICY_UPDATED",
        target_type="recruitment_scoring_policy",
        target_id=str(policy.scoring_policy_id),
        after={"criteria": serialized},
    )
    return ScoringPolicyResponse(
        criteria=_scoring_criteria(policy),
        updated_at=policy.updated_at,
        updated_by=await _resolve_user_name(session, actor_user_id),
    )


def _criterion_raw_score(
    application: RecruitmentApplication, criterion: ScoringCriterion
) -> float:
    """Score brut 0-100 d'une candidature pour un critère donné."""
    if criterion.key == "experienceYears":
        cap = criterion.maxYears or 10
        years = application.experience_years or 0
        return round(min(years, cap) / cap * 100, 1) if cap else 0.0
    value = {
        "skillsMatch": application.skills_match_score,
        "educationLevel": application.education_score,
        "interviewAverage": application.interview_avg_score,
        "testScore": application.test_score,
    }.get(criterion.key)
    if value is None:
        return 0.0
    return max(0.0, min(100.0, round(float(value), 1)))


def _criterion_justification(
    criterion: ScoringCriterion, application: RecruitmentApplication, raw: float
) -> str:
    if criterion.key == "experienceYears":
        return f"{application.experience_years or 0} année(s) d'expérience pertinente."
    if criterion.key == "skillsMatch":
        return f"Adéquation des compétences estimée à {raw:g}%."
    if criterion.key == "educationLevel":
        return f"Niveau académique converti en score {raw:g}%."
    if criterion.key == "interviewAverage":
        return (
            f"Évaluation moyenne d'entretien {raw:g}%."
            if raw > 0
            else "Aucune évaluation d'entretien enregistrée."
        )
    return (
        f"Résultat du test technique {raw:g}%."
        if raw > 0
        else "Aucun test technique enregistré."
    )


async def list_application_scores(
    session: AsyncSession,
    *,
    organization_id: UUID,
    campaign: str | None = None,
    position: str | None = None,
) -> ApplicationScoresResponse:
    """Calcule, à la volée, le score de chaque candidature selon la politique."""
    policy_row = await _get_scoring_policy_row(session, organization_id)
    criteria = _scoring_criteria(policy_row)

    campaigns = {
        c.campaign_id: c
        for c in (
            await session.execute(
                select(RecruitmentCampaign).where(
                    RecruitmentCampaign.organization_id == organization_id
                )
            )
        )
        .scalars()
        .all()
    }

    base = select(RecruitmentApplication).where(
        RecruitmentApplication.organization_id == organization_id
    )
    if position:
        base = base.where(RecruitmentApplication.desired_position.ilike(f"%{position}%"))
    rows = (
        (await session.execute(base.order_by(RecruitmentApplication.received_on.desc())))
        .scalars()
        .all()
    )

    needle = campaign.strip().lower() if campaign else None
    entries: list[ApplicationScoreEntry] = []
    for application in rows:
        camp = campaigns.get(application.campaign_id) if application.campaign_id else None
        if needle:
            haystack = f"{camp.code} {camp.title}".lower() if camp else ""
            if needle not in haystack:
                continue

        details: list[ApplicationScoreDetail] = []
        total = 0.0
        for criterion in criteria:
            raw = _criterion_raw_score(application, criterion)
            weighted = round(raw * criterion.weight / 100, 1)
            total += weighted
            details.append(
                ApplicationScoreDetail(
                    criterion_key=criterion.key,
                    criterion_label=criterion.label,
                    weight=criterion.weight,
                    raw_score=raw,
                    weighted_score=weighted,
                    justification=_criterion_justification(criterion, application, raw),
                )
            )

        entries.append(
            ApplicationScoreEntry(
                reference=application.reference,
                candidate=application.candidate_full_name,
                position=(
                    application.desired_position
                    or (camp.need_position if camp else None)
                    or (camp.title if camp else None)
                    or "Poste non précisé"
                ),
                campaign=camp.title if camp else "",
                status=application.application_status,
                received_on=application.received_on,
                total_score=round(total, 1),
                rank=0,
                details=details,
            )
        )

    entries.sort(key=lambda entry: entry.total_score, reverse=True)
    for index, entry in enumerate(entries, start=1):
        entry.rank = index

    return ApplicationScoresResponse(
        policy_updated_at=policy_row.updated_at if policy_row else None,
        criteria=criteria,
        items=entries,
    )
