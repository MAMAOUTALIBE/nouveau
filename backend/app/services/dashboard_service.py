"""Service métier — Dashboard, Reports, Modernization (agrégats SQL)."""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog
from app.models.discipline import DisciplineCase
from app.models.document import Document
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.position import Position
from app.models.training import TrainingSession
from app.models.workflow import WorkflowInstance
from app.schemas.dashboard import (
    DashboardCount,
    DashboardSummary,
    ModernizationItem,
    ModernizationSummary,
    PendingDecisionItem,
)
from app.services import career_service


# ============================================================================
# Dashboard summary
# ============================================================================
async def build_summary(
    session: AsyncSession,
    *,
    organization_id: UUID,
    user: AuthenticatedUser,
) -> DashboardSummary:
    """Agrégats SQL pour le dashboard principal."""
    one_month_ago = datetime.now(tz=UTC) - timedelta(days=30)

    employees_total = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Employee)
                .where(Employee.organization_id == organization_id)
            )
        ).scalar_one()
    )
    employees_active = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Employee)
                .where(
                    Employee.organization_id == organization_id,
                    Employee.employment_status == "ACTIVE",
                )
            )
        ).scalar_one()
    )
    positions_vacant = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Position)
                .where(
                    Position.organization_id == organization_id,
                    Position.position_status == "OPEN",
                )
            )
        ).scalar_one()
    )
    employees_on_leave = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Employee)
                .where(
                    Employee.organization_id == organization_id,
                    Employee.employment_status == "ON_LEAVE",
                )
            )
        ).scalar_one()
    )
    leave_pending = int(
        (
            await session.execute(
                select(func.count())
                .select_from(LeaveRequest)
                .where(
                    LeaveRequest.organization_id == organization_id,
                    LeaveRequest.request_status.in_(["PENDING", "IN_REVIEW"]),
                )
            )
        ).scalar_one()
    )
    leave_approved_period = int(
        (
            await session.execute(
                select(func.count())
                .select_from(LeaveRequest)
                .where(
                    LeaveRequest.organization_id == organization_id,
                    LeaveRequest.request_status == "APPROVED",
                    LeaveRequest.decided_at.is_not(None),
                    LeaveRequest.decided_at >= one_month_ago,
                )
            )
        ).scalar_one()
    )
    discipline_open = int(
        (
            await session.execute(
                select(func.count())
                .select_from(DisciplineCase)
                .where(
                    DisciplineCase.organization_id == organization_id,
                    DisciplineCase.case_status.in_(
                        ["OPEN", "UNDER_INVESTIGATION", "SANCTION_PROPOSED"]
                    ),
                )
            )
        ).scalar_one()
    )
    training_planned = int(
        (
            await session.execute(
                select(func.count())
                .select_from(TrainingSession)
                .where(
                    TrainingSession.organization_id == organization_id,
                    TrainingSession.session_status == "PLANNED",
                )
            )
        ).scalar_one()
    )
    training_in_progress = int(
        (
            await session.execute(
                select(func.count())
                .select_from(TrainingSession)
                .where(
                    TrainingSession.organization_id == organization_id,
                    TrainingSession.session_status == "IN_PROGRESS",
                )
            )
        ).scalar_one()
    )
    documents_total = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Document)
                .where(Document.organization_id == organization_id)
            )
        ).scalar_one()
    )
    documents_pending_validation = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Document)
                .where(
                    Document.organization_id == organization_id,
                    Document.document_status.in_(["DRAFT", "IN_VALIDATION"]),
                )
            )
        ).scalar_one()
    )
    workflows_in_progress = int(
        (
            await session.execute(
                select(func.count())
                .select_from(WorkflowInstance)
                .where(
                    WorkflowInstance.organization_id == organization_id,
                    WorkflowInstance.instance_status.in_(["PENDING", "IN_PROGRESS", "ESCALATED"]),
                )
            )
        ).scalar_one()
    )
    recent_audit_events = int(
        (
            await session.execute(
                select(func.count())
                .select_from(AuditLog)
                .where(
                    AuditLog.organization_id == organization_id,
                    AuditLog.occurred_at >= one_month_ago,
                )
            )
        ).scalar_one()
    )

    departures_next_12m = await career_service.count_upcoming_departures(
        session, organization_id=organization_id, within_days=365
    )

    counts = [
        DashboardCount(
            label="Demandes congés en attente",
            value=leave_pending,
            tone="warning" if leave_pending > 0 else "success",
        ),
        DashboardCount(
            label="Documents à valider",
            value=documents_pending_validation,
            tone="warning" if documents_pending_validation > 0 else "info",
        ),
        DashboardCount(
            label="Dossiers disciplinaires ouverts",
            value=discipline_open,
            tone="danger" if discipline_open > 0 else "success",
        ),
        DashboardCount(
            label="Workflows en cours",
            value=workflows_in_progress,
            tone="info",
        ),
    ]

    _ = user  # actuellement non utilisé pour le filtrage (scope GLOBAL DRH)
    return DashboardSummary(
        organization_id=organization_id,
        generated_at=datetime.now(tz=UTC),
        employees_total=employees_total,
        employees_active=employees_active,
        employees_on_leave=employees_on_leave,
        positions_vacant=positions_vacant,
        leave_requests_pending=leave_pending,
        leave_requests_approved_period=leave_approved_period,
        discipline_cases_open=discipline_open,
        training_sessions_planned=training_planned,
        training_sessions_in_progress=training_in_progress,
        documents_total=documents_total,
        documents_pending_validation=documents_pending_validation,
        workflows_in_progress=workflows_in_progress,
        recent_audit_events=recent_audit_events,
        departures_next_12m=departures_next_12m,
        counts=counts,
    )


# ============================================================================
# Pending decisions (file de tâches)
# ============================================================================
async def list_pending_decisions(
    session: AsyncSession,
    *,
    organization_id: UUID,
    limit: int = 50,
) -> list[PendingDecisionItem]:
    """Renvoie une liste agrégée d'éléments en attente de décision RH/manager."""
    items: list[PendingDecisionItem] = []

    # Demandes de congé PENDING / IN_REVIEW
    leave_rows = (
        (
            await session.execute(
                select(LeaveRequest)
                .where(
                    LeaveRequest.organization_id == organization_id,
                    LeaveRequest.request_status.in_(["PENDING", "IN_REVIEW"]),
                )
                .order_by(LeaveRequest.submitted_at.asc())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    for lr in leave_rows:
        items.append(
            PendingDecisionItem(
                kind="LEAVE_REQUEST",
                reference=lr.reference,
                target_id=lr.leave_request_id,
                submitted_at=lr.submitted_at,
                title=f"Congé {lr.reference} ({lr.start_date} → {lr.end_date})",
                metadata={"status": lr.request_status},
            )
        )

    # Workflows in_progress + escalated
    wf_rows = (
        (
            await session.execute(
                select(WorkflowInstance)
                .where(
                    WorkflowInstance.organization_id == organization_id,
                    WorkflowInstance.instance_status.in_(["PENDING", "IN_PROGRESS", "ESCALATED"]),
                )
                .order_by(WorkflowInstance.due_on.asc().nullslast())
                .limit(limit)
            )
        )
        .scalars()
        .all()
    )
    for wf in wf_rows:
        items.append(
            PendingDecisionItem(
                kind="WORKFLOW_INSTANCE",
                reference=wf.reference,
                target_id=wf.workflow_instance_id,
                submitted_at=wf.created_at,
                title=f"Workflow {wf.reference} ({wf.instance_status})",
                metadata={"priority": wf.priority, "step": wf.current_step_order},
            )
        )

    return items


# ============================================================================
# Modernization (alignée sur les vagues du PLAN_ACTION)
# ============================================================================
_MODERNIZATION_ITEMS: tuple[tuple[str, str, str, float, str], ...] = (
    ("PY-001", "Bootstrap projet FastAPI", "DONE", 100.0, "Vague 0"),
    ("PY-002", "Settings 12-factor", "DONE", 100.0, "Vague 0"),
    ("PY-003", "PostgreSQL async + Alembic", "DONE", 100.0, "Vague 0"),
    ("PY-004", "Auth JWT + bcrypt", "DONE", 100.0, "Vague 0"),
    ("PY-005", "RBAC dépendances FastAPI", "DONE", 100.0, "Vague 0"),
    ("PY-006", "Audit transactionnel", "DONE", 100.0, "Vague 0"),
    ("PY-010", "Modèles SQLAlchemy 64 tables", "DONE", 100.0, "Vague 1"),
    ("PY-012", "Migrations Alembic 0001-0003", "DONE", 100.0, "Vague 1"),
    ("PY-020", "Personnel + scoring turnover", "DONE", 100.0, "Vague 2"),
    ("PY-021", "Documents + OCR pipeline", "DONE", 100.0, "Vague 2"),
    ("PY-022", "Recrutement", "DONE", 100.0, "Vague 2"),
    ("PY-023", "Congés (CRUD + balances)", "DONE", 100.0, "Vague 2"),
    ("PY-024", "Workflows", "DONE", 100.0, "Vague 2"),
    ("PY-025", "Notifications", "DONE", 100.0, "Vague 2"),
    ("PY-026", "Admin (users/roles)", "DONE", 100.0, "Vague 2"),
    ("PY-027b", "Liaison user↔employee", "DONE", 100.0, "Vague 3"),
    ("PY-030", "Performance + 360° anonyme", "DONE", 100.0, "Vague 3"),
    ("PY-031", "Formation + cold-eval + certificats", "DONE", 100.0, "Vague 3"),
    ("PY-032", "Carrière + GPEC", "DONE", 100.0, "Vague 3"),
    ("PY-033", "Discipline + Organization", "DONE", 100.0, "Vague 3"),
    ("PY-034", "Dashboard + Reports + Modernization", "DONE", 100.0, "Vague 3"),
    ("PY-035", "Auto-approbation congés", "DONE", 100.0, "Vague 3"),
    ("PY-036", "Planning continuité service", "DONE", 100.0, "Vague 3"),
    ("PY-040", "Abstraction OCR + adapter Tesseract", "PLANNED", 0.0, "Vague 4"),
    ("PY-042", "Abstraction signature + Universign", "PLANNED", 0.0, "Vague 4"),
    ("PY-044", "Connecteur SMTP", "PLANNED", 0.0, "Vague 4"),
    ("PY-045", "Stockage MinIO/S3", "PLANNED", 0.0, "Vague 4"),
    ("PY-051", "Matching CV par LLM", "PLANNED", 0.0, "Vague 5"),
    ("PY-055", "Prim'Assistant chatbot RH", "PLANNED", 0.0, "Vague 5"),
    ("PY-062", "Moteur BPMN SpiffWorkflow", "PLANNED", 0.0, "Vague 6"),
    ("PY-070", "Tests E2E Playwright contre backend Python", "PLANNED", 0.0, "Vague 7"),
    ("PY-071", "Bascule proxy frontend Angular", "PLANNED", 0.0, "Vague 7"),
)


async def get_modernization_summary(*, organization_id: UUID) -> ModernizationSummary:
    """Liste l'état d'avancement des modernisations.

    V1 : liste statique reflétant le PLAN_ACTION. À l'avenir, on pourra
    persister chaque item dans une table `modernization_items` mise à jour
    à chaque livraison.
    """
    items = [
        ModernizationItem(code=code, label=label, status=status, progress_pct=pct, notes=phase)
        for code, label, status, pct, phase in _MODERNIZATION_ITEMS
    ]
    total_done = sum(1 for it in items if it.status == "DONE")
    total_in_progress = sum(1 for it in items if it.status == "IN_PROGRESS")
    total_planned = sum(1 for it in items if it.status == "PLANNED")
    overall = sum(it.progress_pct for it in items) / len(items) if items else 0.0
    return ModernizationSummary(
        organization_id=organization_id,
        items=items,
        total_done=total_done,
        total_in_progress=total_in_progress,
        total_planned=total_planned,
        overall_progress_pct=round(overall, 2),
    )


# ============================================================================
# Reports — agrégats simples par direction
# ============================================================================
async def report_employees_by_direction(
    session: AsyncSession, *, organization_id: UUID
) -> list[dict[str, str | int]]:
    rows = (
        await session.execute(
            select(
                Employee.direction_id,
                func.count().label("active_count"),
            )
            .where(
                Employee.organization_id == organization_id,
                Employee.employment_status == "ACTIVE",
            )
            .group_by(Employee.direction_id)
            .order_by(func.count().desc())
        )
    ).all()
    return [
        {
            "direction_id": str(row[0]) if row[0] else "—",
            "active_count": int(row[1]),
        }
        for row in rows
    ]


async def report_leave_by_status(
    session: AsyncSession,
    *,
    organization_id: UUID,
    period_start: date | None = None,
    period_end: date | None = None,
) -> list[dict[str, str | int]]:
    base = select(
        LeaveRequest.request_status,
        func.count().label("c"),
    ).where(LeaveRequest.organization_id == organization_id)
    if period_start:
        base = base.where(LeaveRequest.start_date >= period_start)
    if period_end:
        base = base.where(LeaveRequest.start_date <= period_end)
    rows = (await session.execute(base.group_by(LeaveRequest.request_status))).all()
    return [{"request_status": row[0], "count": int(row[1])} for row in rows]
