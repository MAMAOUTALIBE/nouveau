"""Service métier — Performance + Évaluation 360°.

**Anonymat 360° structurel (règle métier non négociable)** :

1. La table `performance_360_responses` n'a aucune FK vers `users` ni
   vers `employees` (l'évaluateur). Seule `performance_360_invitations`
   trace le lien évaluateur → invitation. C'est imposé en DB +
   testé par `tests/unit/test_models_metadata.test_perf_360_responses_no_user_fk`.

2. À la **clôture** d'une campagne 360°, les invitations doivent être
   supprimées (ou anonymisées) — voir `close_campaign()`. Après clôture,
   il devient impossible de remonter à l'identité d'un répondant.

3. **Seuil minimal de répondants** par catégorie (défaut N=3). Si une
   catégorie reçoit moins de N réponses, **toutes** les statistiques
   pour cette catégorie sont **non divulguées** : on ne renvoie même
   pas le compte exact, pour empêcher la déduction par recoupement.

4. Les invitations sont consultables seulement par les rôles habilités
   (super_admin, hr_manager) via le routeur, jamais par les managers
   directs.
"""

from __future__ import annotations

from datetime import UTC, datetime
from secrets import token_urlsafe
from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.employee import Employee
from app.models.organization import Direction
from app.models.performance import (
    Performance360Invitation,
    Performance360Response,
    PerformanceCampaign,
    PerformanceEvaluation,
)
from app.schemas.performance import (
    PerformanceCampaignCreateRequest,
    PerformanceCampaignResponse,
    PerformanceCampaignTransitionRequest,
    PerformanceEvaluationResponse,
    PerformanceEvaluationUpsertRequest,
    PerformanceResultResponse,
    Survey360CategoryResult,
    Survey360EmployeeResult,
    Survey360InvitationResponse,
    Survey360InvitationsBulkRequest,
    Survey360PublicInvitation,
    Survey360RespondRequest,
)


# ============================================================================
# Helpers
# ============================================================================
_CAMPAIGN_STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Brouillon",
    "OPEN": "En cours",
    "CLOSED": "Clôturée",
    "CANCELLED": "Annulée",
}
_EVALUATION_STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Brouillon",
    "SUBMITTED": "Soumise",
    "VALIDATED": "Validée",
}


def _campaign_period(c: PerformanceCampaign) -> str:
    if c.period_start is not None and c.period_end is not None:
        return f"{c.period_start:%d/%m/%Y} – {c.period_end:%d/%m/%Y}"
    if c.period_start is not None:
        return f"À partir du {c.period_start:%d/%m/%Y}"
    return "Non planifiée"


def _campaign_to_dto(
    c: PerformanceCampaign, *, direction_name: str | None = None
) -> PerformanceCampaignResponse:
    dto = PerformanceCampaignResponse.model_validate(c)
    dto.period = _campaign_period(c)
    dto.population = direction_name or "Tous les agents"
    dto.status = _CAMPAIGN_STATUS_LABELS.get(c.campaign_status, c.campaign_status)
    return dto


def _evaluation_to_dto(e: PerformanceEvaluation) -> PerformanceEvaluationResponse:
    return PerformanceEvaluationResponse.model_validate(e)


def _invitation_to_dto(i: Performance360Invitation) -> Survey360InvitationResponse:
    return Survey360InvitationResponse.model_validate(i)


# ============================================================================
# Campaigns
# ============================================================================
async def list_campaigns(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    campaign_kind: str | None = None,
    campaign_status: str | None = None,
) -> tuple[list[PerformanceCampaignResponse], int]:
    base = select(PerformanceCampaign).where(PerformanceCampaign.organization_id == organization_id)
    if campaign_kind:
        base = base.where(PerformanceCampaign.campaign_kind == campaign_kind)
    if campaign_status:
        base = base.where(PerformanceCampaign.campaign_status == campaign_status)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()
    page_stmt = (
        base.order_by(PerformanceCampaign.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()

    direction_ids = {c.direction_id for c in rows if c.direction_id is not None}
    direction_names: dict[UUID, str] = {}
    if direction_ids:
        direction_names = {
            direction_id: name
            for direction_id, name in (
                await session.execute(
                    select(Direction.direction_id, Direction.name).where(
                        Direction.direction_id.in_(direction_ids)
                    )
                )
            ).all()
        }
    items = [
        _campaign_to_dto(c, direction_name=direction_names.get(c.direction_id))
        for c in rows
    ]
    return items, int(total)


async def list_results(
    session: AsyncSession,
    *,
    organization_id: UUID,
) -> list[PerformanceResultResponse]:
    """Résultats d'évaluation classique — page Pilotage › Résultats."""
    stmt = (
        select(PerformanceEvaluation, Employee, Direction)
        .join(Employee, Employee.employee_id == PerformanceEvaluation.employee_id)
        .outerjoin(Direction, Direction.direction_id == Employee.direction_id)
        .where(PerformanceEvaluation.organization_id == organization_id)
        .order_by(Employee.full_name)
    )
    rows = (await session.execute(stmt)).all()

    results: list[PerformanceResultResponse] = []
    for evaluation, employee, direction in rows:
        manager = float(evaluation.manager_score) if evaluation.manager_score is not None else 0.0
        self_score = float(evaluation.self_score) if evaluation.self_score is not None else 0.0
        if evaluation.final_score is not None:
            final = float(evaluation.final_score)
        else:
            final = round((manager + self_score) / 2, 2)
        results.append(
            PerformanceResultResponse(
                agent=employee.full_name,
                direction=direction.name if direction is not None else "Primature",
                manager_score=manager,
                self_score=self_score,
                final_score=final,
                status=_EVALUATION_STATUS_LABELS.get(
                    evaluation.evaluation_status, evaluation.evaluation_status
                ),
            )
        )
    return results


async def create_campaign(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: PerformanceCampaignCreateRequest,
    audit: AuditWriter,
) -> PerformanceCampaignResponse:
    existing = (
        await session.execute(
            select(PerformanceCampaign).where(
                PerformanceCampaign.organization_id == organization_id,
                PerformanceCampaign.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Campagne '{body.code}' déjà existante.",
            code="PERF_CAMPAIGN_CODE_TAKEN",
        )
    campaign = PerformanceCampaign(
        organization_id=organization_id,
        code=body.code,
        title=body.title,
        campaign_kind=body.campaign_kind,
        campaign_status="DRAFT",
        period_start=body.period_start,
        period_end=body.period_end,
        direction_id=body.direction_id,
        min_respondents_per_category=body.min_respondents_per_category,
        description=body.description,
    )
    session.add(campaign)
    await session.flush([campaign])
    await audit.record(
        action="PERFORMANCE_CAMPAIGN_CREATED",
        target_type="performance_campaign",
        target_id=str(campaign.performance_campaign_id),
        after={
            "code": body.code,
            "campaign_kind": body.campaign_kind,
            "min_respondents_per_category": body.min_respondents_per_category,
        },
    )
    return _campaign_to_dto(campaign)


async def _load_campaign(session: AsyncSession, campaign_id: UUID) -> PerformanceCampaign:
    c = (
        await session.execute(
            select(PerformanceCampaign).where(
                PerformanceCampaign.performance_campaign_id == campaign_id
            )
        )
    ).scalar_one_or_none()
    if c is None:
        raise NotFoundError("Campagne introuvable.", code="PERF_CAMPAIGN_NOT_FOUND")
    return c


async def transition_campaign(
    session: AsyncSession,
    *,
    campaign_id: UUID,
    body: PerformanceCampaignTransitionRequest,
    audit: AuditWriter,
) -> PerformanceCampaignResponse:
    campaign = await _load_campaign(session, campaign_id)
    valid_next = {
        "DRAFT": {"OPEN", "CANCELLED"},
        "OPEN": {"CLOSED", "CANCELLED"},
        "CLOSED": set(),
        "CANCELLED": set(),
    }
    if body.target_status not in valid_next.get(campaign.campaign_status, set()):
        raise ConflictError(
            f"Transition invalide : {campaign.campaign_status} → {body.target_status}",
            code="INVALID_CAMPAIGN_TRANSITION",
        )
    before = {"campaign_status": campaign.campaign_status}
    campaign.campaign_status = body.target_status

    # ANONYMAT — à la clôture d'une 360°, on supprime les invitations
    # (donc on perd définitivement la liaison évaluateur → réponse).
    deleted_invitations = 0
    if campaign.campaign_kind == "SURVEY_360" and body.target_status == "CLOSED":
        # Compte avant suppression (rowcount n'est pas exposé par AsyncSession.execute()
        # sur tous les drivers ; on fait un select count() préalable).
        count = (
            await session.execute(
                select(func.count())
                .select_from(Performance360Invitation)
                .where(Performance360Invitation.performance_campaign_id == campaign_id)
            )
        ).scalar_one()
        await session.execute(
            delete(Performance360Invitation).where(
                Performance360Invitation.performance_campaign_id == campaign_id
            )
        )
        deleted_invitations = int(count)

    await audit.record(
        action="PERFORMANCE_CAMPAIGN_TRANSITIONED",
        target_type="performance_campaign",
        target_id=str(campaign_id),
        before=before,
        after={
            "campaign_status": body.target_status,
            "deleted_invitations": deleted_invitations,
        },
    )
    return _campaign_to_dto(campaign)


# ============================================================================
# Evaluations classiques (CLASSIC)
# ============================================================================
async def list_evaluations(
    session: AsyncSession,
    *,
    campaign_id: UUID,
) -> list[PerformanceEvaluationResponse]:
    rows = (
        (
            await session.execute(
                select(PerformanceEvaluation)
                .where(PerformanceEvaluation.performance_campaign_id == campaign_id)
                .order_by(PerformanceEvaluation.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [_evaluation_to_dto(e) for e in rows]


async def upsert_evaluation(
    session: AsyncSession,
    *,
    organization_id: UUID,
    campaign_id: UUID,
    body: PerformanceEvaluationUpsertRequest,
    audit: AuditWriter,
) -> PerformanceEvaluationResponse:
    campaign = await _load_campaign(session, campaign_id)
    if campaign.campaign_kind != "CLASSIC":
        raise ValidationError(
            "Cette campagne n'est pas une campagne classique.",
            code="WRONG_CAMPAIGN_KIND",
        )

    stmt = select(PerformanceEvaluation).where(
        PerformanceEvaluation.performance_campaign_id == campaign_id,
        PerformanceEvaluation.employee_id == body.employee_id,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()
    is_create = existing is None

    if existing is None:
        existing = PerformanceEvaluation(
            organization_id=organization_id,
            performance_campaign_id=campaign_id,
            employee_id=body.employee_id,
            self_score=body.self_score,
            manager_score=body.manager_score,
            final_score=body.final_score,
            evaluation_status=body.evaluation_status,
            notes=body.notes,
            submitted_at=datetime.now(tz=UTC) if body.evaluation_status == "SUBMITTED" else None,
        )
        session.add(existing)
    else:
        if existing.evaluation_status == "VALIDATED":
            raise ConflictError(
                "Cette évaluation est validée et ne peut plus être modifiée.",
                code="EVAL_ALREADY_VALIDATED",
            )
        if body.self_score is not None:
            existing.self_score = body.self_score
        if body.manager_score is not None:
            existing.manager_score = body.manager_score
        if body.final_score is not None:
            existing.final_score = body.final_score
        existing.notes = body.notes
        existing.evaluation_status = body.evaluation_status
        if body.evaluation_status == "SUBMITTED" and existing.submitted_at is None:
            existing.submitted_at = datetime.now(tz=UTC)
    await session.flush([existing])

    await audit.record(
        action=(
            "PERFORMANCE_EVALUATION_CREATED" if is_create else "PERFORMANCE_EVALUATION_UPDATED"
        ),
        target_type="performance_evaluation",
        target_id=str(existing.performance_evaluation_id),
        after={
            "employee_id": str(body.employee_id),
            "evaluation_status": body.evaluation_status,
            "final_score": str(body.final_score) if body.final_score else None,
        },
    )
    return _evaluation_to_dto(existing)


# ============================================================================
# Invitations 360° (admin / hr_manager — vue nominative)
# ============================================================================
async def list_360_invitations(
    session: AsyncSession,
    *,
    campaign_id: UUID,
    target_employee_id: UUID | None = None,
) -> list[Survey360InvitationResponse]:
    base = select(Performance360Invitation).where(
        Performance360Invitation.performance_campaign_id == campaign_id
    )
    if target_employee_id:
        base = base.where(Performance360Invitation.target_employee_id == target_employee_id)
    rows = (
        (await session.execute(base.order_by(Performance360Invitation.sent_at.desc())))
        .scalars()
        .all()
    )
    return [_invitation_to_dto(i) for i in rows]


async def create_360_invitations(
    session: AsyncSession,
    *,
    campaign_id: UUID,
    body: Survey360InvitationsBulkRequest,
    audit: AuditWriter,
) -> list[Survey360InvitationResponse]:
    campaign = await _load_campaign(session, campaign_id)
    if campaign.campaign_kind != "SURVEY_360":
        raise ValidationError(
            "Cette campagne n'est pas une campagne 360°.",
            code="WRONG_CAMPAIGN_KIND",
        )
    if campaign.campaign_status not in ("DRAFT", "OPEN"):
        raise ConflictError(
            "Campagne pas en état d'accepter de nouvelles invitations.",
            code="CAMPAIGN_NOT_OPEN",
        )

    created: list[Performance360Invitation] = []
    for item in body.invitations:
        invitation = Performance360Invitation(
            performance_campaign_id=campaign_id,
            target_employee_id=item.target_employee_id,
            evaluator_employee_id=item.evaluator_employee_id,
            evaluator_category=item.evaluator_category,
            invitation_token=token_urlsafe(32),
            invitation_status="SENT",
            expires_at=item.expires_at,
        )
        session.add(invitation)
        created.append(invitation)
    await session.flush()

    await audit.record(
        action="PERFORMANCE_360_INVITATIONS_SENT",
        target_type="performance_campaign",
        target_id=str(campaign_id),
        after={"created_count": len(created)},
    )
    return [_invitation_to_dto(i) for i in created]


# ============================================================================
# Public — répondre via token
# ============================================================================
async def get_360_invitation_by_token(
    session: AsyncSession, *, token: str
) -> Survey360PublicInvitation:
    stmt = (
        select(Performance360Invitation, Employee.full_name)
        .join(
            Employee,
            Employee.employee_id == Performance360Invitation.target_employee_id,
        )
        .where(Performance360Invitation.invitation_token == token)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        raise NotFoundError(
            "Invitation introuvable ou expirée.",
            code="INVITATION_NOT_FOUND",
        )
    invitation, target_full_name = row[0], row[1]

    if invitation.invitation_status in ("EXPIRED", "REVOKED"):
        raise ConflictError(
            f"Invitation déjà {invitation.invitation_status}.",
            code="INVITATION_NOT_OPEN",
        )
    if invitation.expires_at is not None and invitation.expires_at < datetime.now(tz=UTC):
        raise ConflictError(
            "Invitation expirée.",
            code="INVITATION_EXPIRED",
        )
    return Survey360PublicInvitation(
        invitation_token=invitation.invitation_token,
        target_employee_full_name=target_full_name,
        evaluator_category=invitation.evaluator_category,
        invitation_status=invitation.invitation_status,
        expires_at=invitation.expires_at,
    )


async def respond_to_360_invitation(
    session: AsyncSession,
    *,
    token: str,
    body: Survey360RespondRequest,
) -> None:
    invitation = (
        await session.execute(
            select(Performance360Invitation).where(
                Performance360Invitation.invitation_token == token
            )
        )
    ).scalar_one_or_none()
    if invitation is None:
        raise NotFoundError(
            "Invitation introuvable ou expirée.",
            code="INVITATION_NOT_FOUND",
        )
    if invitation.invitation_status != "SENT":
        raise ConflictError(
            f"Impossible de répondre : statut {invitation.invitation_status}.",
            code="INVITATION_NOT_OPEN",
        )

    # Insertion de la réponse SANS lien vers l'évaluateur :
    # la réponse ne peut PAS être tracée à un user/employee une fois
    # la campagne clôturée (les invitations seront supprimées).
    response = Performance360Response(
        performance_campaign_id=invitation.performance_campaign_id,
        target_employee_id=invitation.target_employee_id,
        evaluator_category=invitation.evaluator_category,
        answers=body.answers,
    )
    session.add(response)
    invitation.invitation_status = "RESPONDED"
    invitation.responded_at = datetime.now(tz=UTC)
    await session.flush()


# ============================================================================
# Résultats agrégés (anonymat ≥ N par catégorie)
# ============================================================================
async def aggregate_360_results(
    session: AsyncSession,
    *,
    campaign_id: UUID,
    target_employee_id: UUID,
) -> Survey360EmployeeResult:
    """Calcule les résultats agrégés d'un agent pour une campagne 360°.

    Garantit l'anonymat structurel par seuil minimal.
    """
    campaign = await _load_campaign(session, campaign_id)
    if campaign.campaign_kind != "SURVEY_360":
        raise ValidationError(
            "Cette campagne n'est pas une 360°.",
            code="WRONG_CAMPAIGN_KIND",
        )

    target = (
        await session.execute(select(Employee).where(Employee.employee_id == target_employee_id))
    ).scalar_one_or_none()
    if target is None:
        raise NotFoundError("Agent cible introuvable.", code="EMPLOYEE_NOT_FOUND")

    threshold = campaign.min_respondents_per_category
    categories: list[Survey360CategoryResult] = []

    for cat in ("SELF", "MANAGER", "PEER", "SUBORDINATE"):
        responses = (
            (
                await session.execute(
                    select(Performance360Response).where(
                        Performance360Response.performance_campaign_id == campaign_id,
                        Performance360Response.target_employee_id == target_employee_id,
                        Performance360Response.evaluator_category == cat,
                    )
                )
            )
            .scalars()
            .all()
        )

        # ANONYMAT : seuil N. La catégorie SELF est traitée à part car
        # par définition il n'y a qu'un seul répondant (l'agent lui-même).
        if cat == "SELF":
            categories.append(
                Survey360CategoryResult(
                    evaluator_category="SELF",
                    is_disclosed=bool(responses),
                    respondent_count=len(responses) if responses else None,
                    averages=_aggregate_answers([r.answers for r in responses])
                    if responses
                    else None,
                    note=None if responses else "Pas de réponse SELF reçue.",
                )
            )
            continue

        if len(responses) < threshold:
            categories.append(
                Survey360CategoryResult(
                    evaluator_category=cat,
                    is_disclosed=False,
                    respondent_count=None,
                    averages=None,
                    note=(
                        f"Répondants insuffisants (< {threshold}). "
                        "Aucun détail divulgué pour préserver l'anonymat."
                    ),
                )
            )
        else:
            categories.append(
                Survey360CategoryResult(
                    evaluator_category=cat,
                    is_disclosed=True,
                    respondent_count=len(responses),
                    averages=_aggregate_answers([r.answers for r in responses]),
                    note=None,
                )
            )

    return Survey360EmployeeResult(
        target_employee_id=target_employee_id,
        target_full_name=target.full_name,
        campaign_id=campaign_id,
        campaign_code=campaign.code,
        min_respondents_per_category=threshold,
        categories=categories,
    )


def _aggregate_answers(
    answers_list: list[dict[str, object]],
) -> dict[str, float] | None:
    """Calcule la moyenne par clé numérique présente dans plusieurs réponses."""
    sums: dict[str, float] = {}
    counts: dict[str, int] = {}
    for ans in answers_list:
        for key, value in ans.items():
            if isinstance(value, int | float) and not isinstance(value, bool):
                sums[key] = sums.get(key, 0.0) + float(value)
                counts[key] = counts.get(key, 0) + 1
    if not counts:
        return None
    return {k: round(sums[k] / counts[k], 2) for k in sums}
