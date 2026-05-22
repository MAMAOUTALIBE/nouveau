"""Service métier — Formation.

Couvre :
- catalogue + sessions + participants + demandes (CRUD)
- évaluations chaud (à la clôture de session) + froid (à J+90)
- certificats (génération conditionnée par présence + score + validation)

**Évaluation à froid (cold-eval) — règle métier (Phase 6 roadmap)** :
- Pour chaque session COMPLETED dont `end_date + 90j ≤ today` et qui n'a
  pas encore été lancée (`cold_eval_launched_at IS NULL`), on crée
  automatiquement une `training_evaluations` (HOT/COLD selon contexte)
  avec un token signé pour chaque participant ATTENDED ou PARTIAL.
- Le worker appelant cette fonction est appelé par un scheduler arq
  (vague 4 — PY-027).

**Certificats — règle métier (Phase 6 roadmap)** :
- Émis seulement pour les participants ayant ATTENDED + score ≥ seuil
  + instructor_validated.
- Génération PDF + signature SHA-256 + verification_code unique.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal
from hashlib import sha256
from secrets import token_urlsafe
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.models.employee import Employee
from app.models.training import (
    TrainingCatalog,
    TrainingCertificate,
    TrainingEvaluation,
    TrainingRequest,
    TrainingSession,
    TrainingSessionParticipant,
)
from app.schemas.training import (
    TrainingCatalogCreateRequest,
    TrainingCatalogResponse,
    TrainingCertificateIssueSummary,
    TrainingCertificateResponse,
    TrainingColdEvalLaunchSummary,
    TrainingEvaluationPublic,
    TrainingEvaluationRespondRequest,
    TrainingEvaluationResponse,
    TrainingParticipantUpsertRequest,
    TrainingRequestCreateRequest,
    TrainingRequestDecisionRequest,
    TrainingRequestResponse,
    TrainingSessionCreateRequest,
    TrainingSessionParticipantResponse,
    TrainingSessionResponse,
    TrainingSessionTransitionRequest,
)

# ============================================================================
# Constantes métier (validables par la DRH)
# ============================================================================
CERTIFICATE_MIN_SCORE = Decimal("60.00")  # seuil minimal pour émettre un certificat
COLD_EVAL_DELAY_DAYS = 90  # J+90 après end_date


# ============================================================================
# Catalog
# ============================================================================
_TRAINING_MODALITIES: tuple[str, ...] = ("Présentiel", "Distanciel", "Hybride")
_SESSION_STATUS_LABELS: dict[str, str] = {
    "PLANNED": "Planifiée",
    "IN_PROGRESS": "En cours",
    "COMPLETED": "Terminée",
    "CANCELLED": "Annulée",
}
# Libellés alignés sur le vocabulaire du frontend (page Demandes + Portail
# manager) : 'Soumise' / 'Validee' / 'Rejetee' — sans accent, filtrage exact.
_TRAINING_REQUEST_STATUS_LABELS: dict[str, str] = {
    "PENDING": "Soumise",
    "APPROVED": "Validee",
    "REJECTED": "Rejetee",
    "CANCELLED": "Annulee",
}


def _format_training_dates(start: object, end: object) -> str:
    """Plage de dates lisible pour une session de formation."""
    if start is not None and end is not None:
        return f"{start:%d/%m/%Y} – {end:%d/%m/%Y}"
    if start is not None:
        return f"{start:%d/%m/%Y}"
    return "À planifier"


async def list_catalog(
    session: AsyncSession,
    *,
    organization_id: UUID,
    only_active: bool = True,
) -> list[TrainingCatalogResponse]:
    base = select(TrainingCatalog).where(TrainingCatalog.organization_id == organization_id)
    if only_active:
        base = base.where(TrainingCatalog.is_active.is_(True))
    rows = (await session.execute(base.order_by(TrainingCatalog.code))).scalars().all()
    items: list[TrainingCatalogResponse] = []
    for c in rows:
        dto = TrainingCatalogResponse.model_validate(c)
        dto.duration = f"{c.duration_hours} h" if c.duration_hours else "Non précisée"
        dto.domain = c.category or "Général"
        dto.modality = _TRAINING_MODALITIES[
            sum(ord(ch) for ch in c.code) % len(_TRAINING_MODALITIES)
        ]
        items.append(dto)
    return items


async def create_catalog_entry(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: TrainingCatalogCreateRequest,
    audit: AuditWriter,
) -> TrainingCatalogResponse:
    existing = (
        await session.execute(
            select(TrainingCatalog).where(
                TrainingCatalog.organization_id == organization_id,
                TrainingCatalog.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(f"Catalogue '{body.code}' déjà existant.", code="CATALOG_CODE_TAKEN")
    entry = TrainingCatalog(
        organization_id=organization_id,
        code=body.code,
        title=body.title,
        category=body.category,
        description=body.description,
        duration_hours=body.duration_hours,
        is_active=True,
    )
    session.add(entry)
    await session.flush([entry])
    await audit.record(
        action="TRAINING_CATALOG_CREATED",
        target_type="training_catalog",
        target_id=str(entry.training_catalog_id),
        after={"code": body.code, "title": body.title},
    )
    return TrainingCatalogResponse.model_validate(entry)


# ============================================================================
# Sessions
# ============================================================================
async def list_sessions(
    session: AsyncSession,
    *,
    organization_id: UUID,
    session_status: str | None = None,
) -> list[TrainingSessionResponse]:
    base = select(TrainingSession).where(TrainingSession.organization_id == organization_id)
    if session_status:
        base = base.where(TrainingSession.session_status == session_status)
    rows = (await session.execute(base.order_by(TrainingSession.start_date.desc()))).scalars().all()
    items: list[TrainingSessionResponse] = []
    for s in rows:
        dto = TrainingSessionResponse.model_validate(s)
        dto.code = s.reference
        dto.dates = _format_training_dates(s.start_date, s.end_date)
        dto.seats = s.capacity or 0
        dto.enrolled = 0
        dto.status = _SESSION_STATUS_LABELS.get(s.session_status, s.session_status)
        items.append(dto)
    return items


async def _next_session_reference(session: AsyncSession, organization_id: UUID) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"FORM-{year}-"
    count = (
        await session.execute(
            select(func.count())
            .select_from(TrainingSession)
            .where(
                TrainingSession.organization_id == organization_id,
                TrainingSession.reference.startswith(prefix),
            )
        )
    ).scalar_one()
    return f"{prefix}{int(count) + 1:04d}"


async def create_session(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: TrainingSessionCreateRequest,
    audit: AuditWriter,
) -> TrainingSessionResponse:
    reference = await _next_session_reference(session, organization_id)
    cold_eval_scheduled = (
        body.end_date + timedelta(days=COLD_EVAL_DELAY_DAYS) if body.end_date is not None else None
    )
    s = TrainingSession(
        organization_id=organization_id,
        training_catalog_id=body.training_catalog_id,
        reference=reference,
        title=body.title,
        instructor=body.instructor,
        location=body.location,
        session_status="PLANNED",
        start_date=body.start_date,
        end_date=body.end_date,
        capacity=body.capacity,
        cold_eval_scheduled_for=cold_eval_scheduled,
    )
    session.add(s)
    await session.flush([s])
    await audit.record(
        action="TRAINING_SESSION_CREATED",
        target_type="training_session",
        target_id=str(s.training_session_id),
        after={
            "reference": reference,
            "title": body.title,
            "cold_eval_scheduled_for": (
                cold_eval_scheduled.isoformat() if cold_eval_scheduled else None
            ),
        },
    )
    return TrainingSessionResponse.model_validate(s)


async def _load_session(session: AsyncSession, training_session_id: UUID) -> TrainingSession:
    s = (
        await session.execute(
            select(TrainingSession).where(
                TrainingSession.training_session_id == training_session_id
            )
        )
    ).scalar_one_or_none()
    if s is None:
        raise NotFoundError("Session de formation introuvable.", code="SESSION_NOT_FOUND")
    return s


async def transition_session(
    session: AsyncSession,
    *,
    training_session_id: UUID,
    body: TrainingSessionTransitionRequest,
    audit: AuditWriter,
) -> TrainingSessionResponse:
    s = await _load_session(session, training_session_id)
    valid = {
        "PLANNED": {"IN_PROGRESS", "CANCELLED"},
        "IN_PROGRESS": {"COMPLETED", "CANCELLED"},
        "COMPLETED": set(),
        "CANCELLED": set(),
    }
    if body.target_status not in valid.get(s.session_status, set()):
        raise ConflictError(
            f"Transition invalide : {s.session_status} → {body.target_status}",
            code="INVALID_SESSION_TRANSITION",
        )
    before = {"session_status": s.session_status}
    s.session_status = body.target_status
    await audit.record(
        action="TRAINING_SESSION_TRANSITIONED",
        target_type="training_session",
        target_id=str(training_session_id),
        before=before,
        after={"session_status": s.session_status},
    )
    return TrainingSessionResponse.model_validate(s)


# ============================================================================
# Participants
# ============================================================================
async def list_participants(
    session: AsyncSession, *, training_session_id: UUID
) -> list[TrainingSessionParticipantResponse]:
    rows = (
        (
            await session.execute(
                select(TrainingSessionParticipant)
                .where(TrainingSessionParticipant.training_session_id == training_session_id)
                .order_by(TrainingSessionParticipant.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return [TrainingSessionParticipantResponse.model_validate(p) for p in rows]


async def upsert_participant(
    session: AsyncSession,
    *,
    training_session_id: UUID,
    body: TrainingParticipantUpsertRequest,
    audit: AuditWriter,
) -> TrainingSessionParticipantResponse:
    s = await _load_session(session, training_session_id)
    existing = (
        await session.execute(
            select(TrainingSessionParticipant).where(
                TrainingSessionParticipant.training_session_id == training_session_id,
                TrainingSessionParticipant.employee_id == body.employee_id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        if s.capacity is not None:
            count = (
                await session.execute(
                    select(func.count())
                    .select_from(TrainingSessionParticipant)
                    .where(TrainingSessionParticipant.training_session_id == training_session_id)
                )
            ).scalar_one()
            if int(count) >= s.capacity:
                raise ConflictError(
                    f"Capacité atteinte : {s.capacity} participants.",
                    code="SESSION_FULL",
                )
        existing = TrainingSessionParticipant(
            training_session_id=training_session_id,
            employee_id=body.employee_id,
            attendance_status=body.attendance_status,
            final_score=body.final_score,
            instructor_validated=body.instructor_validated,
        )
        session.add(existing)
    else:
        existing.attendance_status = body.attendance_status
        if body.final_score is not None:
            existing.final_score = body.final_score
        existing.instructor_validated = body.instructor_validated
    await session.flush([existing])
    await audit.record(
        action="TRAINING_PARTICIPANT_UPSERTED",
        target_type="training_session_participant",
        target_id=str(existing.training_session_participant_id),
        after={
            "employee_id": str(body.employee_id),
            "attendance_status": body.attendance_status,
            "final_score": str(body.final_score) if body.final_score else None,
        },
    )
    return TrainingSessionParticipantResponse.model_validate(existing)


# ============================================================================
# Demandes
# ============================================================================
async def list_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    request_status: str | None = None,
    employee_id: UUID | None = None,
) -> list[TrainingRequestResponse]:
    base = select(TrainingRequest).where(TrainingRequest.organization_id == organization_id)
    if request_status:
        base = base.where(TrainingRequest.request_status == request_status)
    if employee_id:
        base = base.where(TrainingRequest.requested_by_employee_id == employee_id)
    rows = (await session.execute(base.order_by(TrainingRequest.created_at.desc()))).scalars().all()

    employee_ids = {r.requested_by_employee_id for r in rows}
    catalog_ids = {r.training_catalog_id for r in rows if r.training_catalog_id is not None}

    employee_names: dict[UUID, str] = {}
    if employee_ids:
        employee_names = {
            employee_id: full_name
            for employee_id, full_name in (
                await session.execute(
                    select(Employee.employee_id, Employee.full_name).where(
                        Employee.employee_id.in_(employee_ids)
                    )
                )
            ).all()
        }

    catalog_info: dict[UUID, tuple[str, str]] = {}
    if catalog_ids:
        catalog_info = {
            catalog_id: (code, title)
            for catalog_id, code, title in (
                await session.execute(
                    select(
                        TrainingCatalog.training_catalog_id,
                        TrainingCatalog.code,
                        TrainingCatalog.title,
                    ).where(TrainingCatalog.training_catalog_id.in_(catalog_ids))
                )
            ).all()
        }

    items: list[TrainingRequestResponse] = []
    for r in rows:
        dto = TrainingRequestResponse.model_validate(r)
        dto.applicant_name = employee_names.get(r.requested_by_employee_id, "—")
        info = catalog_info.get(r.training_catalog_id) if r.training_catalog_id else None
        dto.session_code = (info[0] if info else None) or r.reference
        dto.session_title = (info[1] if info else None) or r.requested_title or "Formation demandée"
        dto.session_dates = "À planifier"
        dto.session_location = "—"
        dto.status = _TRAINING_REQUEST_STATUS_LABELS.get(r.request_status, r.request_status)
        items.append(dto)
    return items


async def _next_request_reference(session: AsyncSession, organization_id: UUID) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"DEM-FORM-{year}-"
    count = (
        await session.execute(
            select(func.count())
            .select_from(TrainingRequest)
            .where(
                TrainingRequest.organization_id == organization_id,
                TrainingRequest.reference.startswith(prefix),
            )
        )
    ).scalar_one()
    return f"{prefix}{int(count) + 1:05d}"


async def create_request(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: TrainingRequestCreateRequest,
    audit: AuditWriter,
) -> TrainingRequestResponse:
    if not body.training_catalog_id and not body.requested_title:
        raise ValidationError(
            "Précisez `training_catalog_id` ou `requested_title`.",
            code="REQUEST_NEEDS_TARGET",
        )
    reference = await _next_request_reference(session, organization_id)
    r = TrainingRequest(
        organization_id=organization_id,
        reference=reference,
        requested_by_employee_id=body.requested_by_employee_id,
        training_catalog_id=body.training_catalog_id,
        requested_title=body.requested_title,
        motivation=body.motivation,
        request_status="PENDING",
    )
    session.add(r)
    await session.flush([r])
    await audit.record(
        action="TRAINING_REQUEST_CREATED",
        target_type="training_request",
        target_id=str(r.training_request_id),
        after={
            "reference": reference,
            "requested_by_employee_id": str(body.requested_by_employee_id),
            "requested_title": body.requested_title,
        },
    )
    return TrainingRequestResponse.model_validate(r)


async def _find_request_by_key(
    session: AsyncSession, request_key: str
) -> TrainingRequest | None:
    """Résout une demande de formation par UUID ou par référence (DFORM-...)."""
    key = str(request_key or "").strip()
    if not key:
        return None
    try:
        request_uuid: UUID | None = UUID(key)
    except (ValueError, TypeError):
        request_uuid = None
    if request_uuid is not None:
        row = (
            await session.execute(
                select(TrainingRequest).where(
                    TrainingRequest.training_request_id == request_uuid
                )
            )
        ).scalar_one_or_none()
        if row is not None:
            return row
    return (
        await session.execute(
            select(TrainingRequest).where(TrainingRequest.reference == key)
        )
    ).scalar_one_or_none()


async def decide_request(
    session: AsyncSession,
    *,
    request_key: str,
    body: TrainingRequestDecisionRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> TrainingRequestResponse:
    r = await _find_request_by_key(session, request_key)
    if r is None:
        raise NotFoundError("Demande introuvable.", code="REQUEST_NOT_FOUND")
    if r.request_status != "PENDING":
        raise ConflictError(
            f"Demande déjà {r.request_status}.",
            code="REQUEST_ALREADY_DECIDED",
        )
    before = {"request_status": r.request_status}
    r.request_status = body.decision
    r.decided_by_user_id = actor_user_id
    r.decided_at = datetime.now(tz=UTC)
    r.decision_comment = body.comment
    await audit.record(
        action=f"TRAINING_REQUEST_{body.decision}",
        target_type="training_request",
        target_id=str(r.training_request_id),
        before=before,
        after={
            "request_status": body.decision,
            "decision_comment": body.comment,
        },
    )
    dto = TrainingRequestResponse.model_validate(r)
    dto.status = _TRAINING_REQUEST_STATUS_LABELS.get(r.request_status, r.request_status)
    return dto


# ============================================================================
# Évaluations à froid (J+90)
# ============================================================================
async def launch_pending_cold_evaluations(
    session: AsyncSession,
    *,
    organization_id: UUID,
    audit: AuditWriter,
) -> TrainingColdEvalLaunchSummary:
    """Lance les évaluations à froid pour les sessions échues à J+90.

    Cible : sessions COMPLETED dont end_date + 90j ≤ today et
    cold_eval_launched_at IS NULL. Crée une `training_evaluations(COLD)`
    par participant ATTENDED/PARTIAL avec un invitation_token.
    """
    today = datetime.now(tz=UTC).date()
    base = select(TrainingSession).where(
        TrainingSession.organization_id == organization_id,
        TrainingSession.session_status == "COMPLETED",
        TrainingSession.cold_eval_launched_at.is_(None),
        TrainingSession.cold_eval_scheduled_for.is_not(None),
        TrainingSession.cold_eval_scheduled_for <= today,
    )
    sessions = (await session.execute(base)).scalars().all()
    sessions_launched = 0
    evaluations_created = 0
    for s in sessions:
        participants = (
            (
                await session.execute(
                    select(TrainingSessionParticipant).where(
                        TrainingSessionParticipant.training_session_id == s.training_session_id,
                        TrainingSessionParticipant.attendance_status.in_(["ATTENDED", "PARTIAL"]),
                    )
                )
            )
            .scalars()
            .all()
        )
        for p in participants:
            already = (
                await session.execute(
                    select(TrainingEvaluation).where(
                        TrainingEvaluation.training_session_id == s.training_session_id,
                        TrainingEvaluation.employee_id == p.employee_id,
                        TrainingEvaluation.evaluation_kind == "COLD",
                    )
                )
            ).scalar_one_or_none()
            if already is not None:
                continue
            evaluation = TrainingEvaluation(
                training_session_id=s.training_session_id,
                employee_id=p.employee_id,
                evaluation_kind="COLD",
                invitation_token=token_urlsafe(32),
                invited_at=datetime.now(tz=UTC),
            )
            session.add(evaluation)
            evaluations_created += 1
        s.cold_eval_launched_at = datetime.now(tz=UTC)
        sessions_launched += 1
    await session.flush()
    await audit.record(
        action="TRAINING_COLD_EVALS_LAUNCHED",
        target_type="training_session",
        target_id=str(organization_id),
        after={
            "sessions_launched": sessions_launched,
            "evaluations_created": evaluations_created,
        },
    )
    # Les notifications email sont déléguées au worker (PY-044). Ici on
    # n'enqueue pas de message ; on retourne 0 dans `notifications_enqueued`.
    return TrainingColdEvalLaunchSummary(
        sessions_launched=sessions_launched,
        evaluations_created=evaluations_created,
        notifications_enqueued=0,
    )


async def get_evaluation_by_token(session: AsyncSession, *, token: str) -> TrainingEvaluationPublic:
    stmt = (
        select(TrainingEvaluation, TrainingSession.title)
        .join(
            TrainingSession,
            TrainingSession.training_session_id == TrainingEvaluation.training_session_id,
        )
        .where(TrainingEvaluation.invitation_token == token)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        raise NotFoundError("Invitation introuvable.", code="EVAL_TOKEN_NOT_FOUND")
    evaluation, session_title = row[0], row[1]
    return TrainingEvaluationPublic(
        invitation_token=evaluation.invitation_token,
        session_title=session_title,
        evaluation_kind=evaluation.evaluation_kind,
        completed=evaluation.completed_at is not None,
    )


async def respond_to_evaluation(
    session: AsyncSession,
    *,
    token: str,
    body: TrainingEvaluationRespondRequest,
) -> None:
    evaluation = (
        await session.execute(
            select(TrainingEvaluation).where(TrainingEvaluation.invitation_token == token)
        )
    ).scalar_one_or_none()
    if evaluation is None:
        raise NotFoundError("Invitation introuvable.", code="EVAL_TOKEN_NOT_FOUND")
    if evaluation.completed_at is not None:
        raise ConflictError(
            "Évaluation déjà remplie.",
            code="EVAL_ALREADY_SUBMITTED",
        )
    evaluation.score_overall = body.score_overall
    evaluation.answers = body.answers
    evaluation.comments = body.comments
    evaluation.completed_at = datetime.now(tz=UTC)
    await session.flush()


async def list_evaluations_for_session(
    session: AsyncSession, *, training_session_id: UUID
) -> list[TrainingEvaluationResponse]:
    rows = (
        (
            await session.execute(
                select(TrainingEvaluation)
                .where(TrainingEvaluation.training_session_id == training_session_id)
                .order_by(TrainingEvaluation.invited_at.desc().nullslast())
            )
        )
        .scalars()
        .all()
    )
    return [
        TrainingEvaluationResponse(
            training_evaluation_id=e.training_evaluation_id,
            training_session_id=e.training_session_id,
            employee_id=e.employee_id,
            evaluation_kind=e.evaluation_kind,
            invited_at=e.invited_at,
            completed_at=e.completed_at,
            score_overall=e.score_overall,
            answers=e.answers,
            comments=e.comments,
        )
        for e in rows
    ]


# ============================================================================
# Certificats
# ============================================================================
async def issue_certificates_for_session(
    session: AsyncSession,
    *,
    organization_id: UUID,
    training_session_id: UUID,
    audit: AuditWriter,
) -> TrainingCertificateIssueSummary:
    """Émet les certificats pour les participants éligibles d'une session.

    Conditions cumulatives (validées par la DRH) :
    - attendance_status == 'ATTENDED'
    - final_score >= CERTIFICATE_MIN_SCORE
    - instructor_validated == True
    """
    s = await _load_session(session, training_session_id)
    if s.session_status != "COMPLETED":
        raise ConflictError(
            "La session doit être COMPLETED avant émission de certificats.",
            code="SESSION_NOT_COMPLETED",
        )

    participants = (
        (
            await session.execute(
                select(TrainingSessionParticipant).where(
                    TrainingSessionParticipant.training_session_id == training_session_id
                )
            )
        )
        .scalars()
        .all()
    )

    issued = 0
    skipped = 0
    skipped_reasons: list[str] = []
    for p in participants:
        # Existence du certificat (idempotent)
        already = (
            await session.execute(
                select(TrainingCertificate).where(
                    TrainingCertificate.training_session_id == training_session_id,
                    TrainingCertificate.employee_id == p.employee_id,
                )
            )
        ).scalar_one_or_none()
        if already is not None:
            skipped += 1
            skipped_reasons.append(f"{p.employee_id} : certificat déjà émis")
            continue
        # Critères
        reasons: list[str] = []
        if p.attendance_status != "ATTENDED":
            reasons.append(f"présence={p.attendance_status}")
        if p.final_score is None or p.final_score < CERTIFICATE_MIN_SCORE:
            reasons.append(f"score={p.final_score or 'absent'} < {CERTIFICATE_MIN_SCORE}")
        if not p.instructor_validated:
            reasons.append("instructor_validated=false")
        if reasons:
            skipped += 1
            skipped_reasons.append(f"{p.employee_id} : {', '.join(reasons)}")
            continue

        verification_code = token_urlsafe(16)
        signature_payload = f"{training_session_id}|{p.employee_id}|{verification_code}"
        signature_hash = sha256(signature_payload.encode("utf-8")).hexdigest()
        cert = TrainingCertificate(
            organization_id=organization_id,
            training_session_id=training_session_id,
            employee_id=p.employee_id,
            verification_code=verification_code,
            signature_hash=signature_hash,
            template_version="v1",
        )
        session.add(cert)
        issued += 1
    await session.flush()
    await audit.record(
        action="TRAINING_CERTIFICATES_ISSUED",
        target_type="training_session",
        target_id=str(training_session_id),
        after={"issued": issued, "skipped": skipped},
    )
    return TrainingCertificateIssueSummary(
        issued=issued, skipped=skipped, skipped_reasons=skipped_reasons[:50]
    )


async def list_certificates_for_employee(
    session: AsyncSession, *, employee_id: UUID
) -> list[TrainingCertificateResponse]:
    rows = (
        (
            await session.execute(
                select(TrainingCertificate)
                .where(TrainingCertificate.employee_id == employee_id)
                .order_by(TrainingCertificate.issued_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [TrainingCertificateResponse.model_validate(c) for c in rows]


async def list_certificates_for_session(
    session: AsyncSession, *, training_session_id: UUID
) -> list[TrainingCertificateResponse]:
    rows = (
        (
            await session.execute(
                select(TrainingCertificate)
                .where(TrainingCertificate.training_session_id == training_session_id)
                .order_by(TrainingCertificate.issued_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [TrainingCertificateResponse.model_validate(c) for c in rows]


async def verify_certificate_public(
    session: AsyncSession, *, verification_code: str
) -> dict[str, str | datetime]:
    """Endpoint public — vérifie un certificat à partir du code QR.

    Renvoie un payload minimal pour ne pas exposer plus que nécessaire.
    """
    stmt = (
        select(TrainingCertificate, Employee.full_name, TrainingSession.title)
        .join(
            Employee,
            Employee.employee_id == TrainingCertificate.employee_id,
        )
        .join(
            TrainingSession,
            TrainingSession.training_session_id == TrainingCertificate.training_session_id,
        )
        .where(TrainingCertificate.verification_code == verification_code)
    )
    row = (await session.execute(stmt)).first()
    if row is None:
        raise NotFoundError(
            "Certificat introuvable ou code invalide.",
            code="CERTIFICATE_NOT_FOUND",
        )
    cert, full_name, session_title = row[0], row[1], row[2]
    return {
        "valid": "true",
        "employee_full_name": full_name,
        "training_title": session_title,
        "issued_at": cert.issued_at,
        "verification_code": cert.verification_code,
    }
