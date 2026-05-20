"""Service métier — règles avancées de congés.

PY-036 : `LeaveServiceCoverageRule` — par direction/unit, on définit un
ratio minimal de présence + un effectif minimal absolu. Une demande qui
ferait passer le service sous le seuil → conflit.

PY-035 : `LeaveAutoApprovalRule` — par type de congé, conditions
cumulatives pour l'auto-approbation : durée ≤ N + quota OK + couverture
service OK + hors période critique (blackout).

L'évaluation d'auto-approbation peut être appelée à la création d'une
demande (vague 4 — un hook dans `leave_service.create_request`).
Pour V1, l'API est exposée pour preview/calcul à la demande, le hook
arrivera plus tard.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import NotFoundError, ValidationError
from app.models.employee import Employee
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.leave_rules import LeaveAutoApprovalRule, LeaveServiceCoverageRule
from app.schemas.leave_advanced import (
    AutoApprovalEvaluation,
    AutoApprovalRuleResponse,
    AutoApprovalRuleUpsertRequest,
    CoverageCheckRequest,
    CoverageCheckResult,
    CoverageRuleResponse,
    CoverageRuleUpsertRequest,
)


# ============================================================================
# Coverage rules — CRUD
# ============================================================================
async def list_coverage_rules(
    session: AsyncSession, *, organization_id: UUID
) -> list[CoverageRuleResponse]:
    rows = (
        (
            await session.execute(
                select(LeaveServiceCoverageRule).where(
                    LeaveServiceCoverageRule.organization_id == organization_id
                )
            )
        )
        .scalars()
        .all()
    )
    return [CoverageRuleResponse.model_validate(r) for r in rows]


async def upsert_coverage_rule(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: CoverageRuleUpsertRequest,
    audit: AuditWriter,
) -> CoverageRuleResponse:
    if body.min_presence_ratio is None and body.min_headcount is None:
        raise ValidationError(
            "Au moins un seuil (min_presence_ratio ou min_headcount) doit être fourni.",
            code="COVERAGE_RULE_NO_THRESHOLD",
        )
    existing = (
        await session.execute(
            select(LeaveServiceCoverageRule).where(
                LeaveServiceCoverageRule.organization_id == organization_id,
                LeaveServiceCoverageRule.scope_type == body.scope_type,
                LeaveServiceCoverageRule.scope_id == body.scope_id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        existing = LeaveServiceCoverageRule(
            organization_id=organization_id,
            scope_type=body.scope_type,
            scope_id=body.scope_id,
            min_presence_ratio=body.min_presence_ratio,
            min_headcount=body.min_headcount,
            is_active=True,
            note=body.note,
        )
        session.add(existing)
    else:
        existing.min_presence_ratio = body.min_presence_ratio
        existing.min_headcount = body.min_headcount
        existing.note = body.note
    await session.flush([existing])
    await audit.record(
        action="LEAVE_COVERAGE_RULE_UPSERTED",
        target_type="leave_service_coverage_rule",
        target_id=str(existing.leave_service_coverage_rule_id),
        after={
            "scope_type": body.scope_type,
            "scope_id": str(body.scope_id),
            "min_presence_ratio": body.min_presence_ratio,
            "min_headcount": body.min_headcount,
        },
    )
    return CoverageRuleResponse.model_validate(existing)


# ============================================================================
# Coverage check (preview)
# ============================================================================
async def check_coverage(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: CoverageCheckRequest,
) -> CoverageCheckResult:
    """Calcule l'impact d'une demande de congé sur la continuité du service."""
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == body.employee_id))
    ).scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Employé introuvable.", code="EMPLOYEE_NOT_FOUND")

    if employee.direction_id is None:
        return CoverageCheckResult(
            has_conflicts=False,
            overlap_count=0,
            direction_active_employees=0,
            direction_absent_during_period=0,
            direction_predicted_presence_ratio=1.0,
            direction_min_presence_ratio=None,
            direction_min_headcount=None,
            warnings=["L'employé n'est rattaché à aucune direction."],
        )

    # Effectif total ACTIVE de la direction
    total_active = int(
        (
            await session.execute(
                select(func.count())
                .select_from(Employee)
                .where(
                    Employee.organization_id == organization_id,
                    Employee.direction_id == employee.direction_id,
                    Employee.employment_status == "ACTIVE",
                )
            )
        ).scalar_one()
    )

    # Demandes APPROVED de la direction qui chevauchent la fenêtre
    overlap_count = int(
        (
            await session.execute(
                select(func.count())
                .select_from(LeaveRequest)
                .join(Employee, Employee.employee_id == LeaveRequest.employee_id)
                .where(
                    LeaveRequest.organization_id == organization_id,
                    Employee.direction_id == employee.direction_id,
                    LeaveRequest.request_status == "APPROVED",
                    LeaveRequest.start_date <= body.end_date,
                    LeaveRequest.end_date >= body.start_date,
                )
            )
        ).scalar_one()
    )
    # +1 si la nouvelle demande est ajoutée
    absent_during_period = overlap_count + 1
    predicted_present = max(total_active - absent_during_period, 0)
    predicted_ratio = predicted_present / total_active if total_active > 0 else 0.0

    rule = (
        await session.execute(
            select(LeaveServiceCoverageRule).where(
                LeaveServiceCoverageRule.organization_id == organization_id,
                LeaveServiceCoverageRule.scope_type == "DIRECTION",
                LeaveServiceCoverageRule.scope_id == employee.direction_id,
                LeaveServiceCoverageRule.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()

    blocking_rule: str | None = None
    warnings: list[str] = []
    if rule is not None:
        min_ratio = float(rule.min_presence_ratio) if rule.min_presence_ratio is not None else None
        if min_ratio is not None and predicted_ratio < min_ratio:
            blocking_rule = "min_presence_ratio"
            warnings.append(
                f"Présence prévisionnelle {predicted_ratio:.0%} < seuil {min_ratio:.0%}"
            )
        if rule.min_headcount is not None and predicted_present < rule.min_headcount:
            blocking_rule = blocking_rule or "min_headcount"
            warnings.append(
                f"Effectif présent prévisionnel {predicted_present} < min {rule.min_headcount}"
            )

    return CoverageCheckResult(
        has_conflicts=blocking_rule is not None,
        overlap_count=overlap_count,
        direction_active_employees=total_active,
        direction_absent_during_period=absent_during_period,
        direction_predicted_presence_ratio=round(predicted_ratio, 3),
        direction_min_presence_ratio=(
            float(rule.min_presence_ratio) if rule and rule.min_presence_ratio else None
        ),
        direction_min_headcount=rule.min_headcount if rule else None,
        blocking_rule=blocking_rule,
        warnings=warnings,
    )


# ============================================================================
# Auto-approval rules — CRUD
# ============================================================================
async def list_auto_approval_rules(
    session: AsyncSession, *, organization_id: UUID
) -> list[AutoApprovalRuleResponse]:
    rows = (
        (
            await session.execute(
                select(LeaveAutoApprovalRule).where(
                    LeaveAutoApprovalRule.organization_id == organization_id
                )
            )
        )
        .scalars()
        .all()
    )
    return [AutoApprovalRuleResponse.model_validate(r) for r in rows]


async def upsert_auto_approval_rule(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: AutoApprovalRuleUpsertRequest,
    audit: AuditWriter,
) -> AutoApprovalRuleResponse:
    existing = (
        await session.execute(
            select(LeaveAutoApprovalRule).where(
                LeaveAutoApprovalRule.organization_id == organization_id,
                LeaveAutoApprovalRule.leave_type_id == body.leave_type_id,
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        existing = LeaveAutoApprovalRule(
            organization_id=organization_id,
            leave_type_id=body.leave_type_id,
            is_active=body.is_active,
            max_duration_days=body.max_duration_days,
            require_quota_ok=body.require_quota_ok,
            require_service_coverage=body.require_service_coverage,
            blackout_periods=body.blackout_periods,
        )
        session.add(existing)
    else:
        existing.is_active = body.is_active
        existing.max_duration_days = body.max_duration_days
        existing.require_quota_ok = body.require_quota_ok
        existing.require_service_coverage = body.require_service_coverage
        existing.blackout_periods = body.blackout_periods
    await session.flush([existing])
    await audit.record(
        action="LEAVE_AUTO_APPROVAL_RULE_UPSERTED",
        target_type="leave_auto_approval_rule",
        target_id=str(existing.leave_auto_approval_rule_id),
        after={
            "leave_type_id": str(body.leave_type_id),
            "max_duration_days": body.max_duration_days,
            "is_active": body.is_active,
        },
    )
    return AutoApprovalRuleResponse.model_validate(existing)


# ============================================================================
# Auto-approval — évaluation
# ============================================================================
def _is_in_blackout(blackout_periods: list[dict[str, Any]], start: date, end: date) -> bool:
    """Vérifie si la fenêtre de la demande chevauche une période bloquée."""
    for period in blackout_periods:
        try:
            p_from = date.fromisoformat(str(period.get("from", "")))
            p_to = date.fromisoformat(str(period.get("to", "")))
        except (ValueError, TypeError):
            continue
        if start <= p_to and end >= p_from:
            return True
    return False


async def evaluate_auto_approval(
    session: AsyncSession,
    *,
    organization_id: UUID,
    leave_request_id: UUID,
) -> AutoApprovalEvaluation:
    """Évalue si une demande peut être auto-approuvée selon les règles métier.

    Conditions cumulatives (toutes doivent être vraies pour APPROVE) :
    1. Règle d'auto-approbation `is_active` pour ce leave_type.
    2. duration_days ≤ max_duration_days.
    3. require_quota_ok : remaining_days ≥ duration_days.
    4. require_service_coverage : check_coverage().has_conflicts == False.
    5. Hors période de blackout.
    """
    request = (
        await session.execute(
            select(LeaveRequest).where(LeaveRequest.leave_request_id == leave_request_id)
        )
    ).scalar_one_or_none()
    if request is None:
        raise NotFoundError("Demande introuvable.", code="LEAVE_REQUEST_NOT_FOUND")

    duration_days = (request.end_date - request.start_date).days + 1
    inputs: dict[str, Any] = {
        "duration_days": duration_days,
        "leave_type_id": str(request.leave_type_id),
    }

    rule = (
        await session.execute(
            select(LeaveAutoApprovalRule).where(
                LeaveAutoApprovalRule.organization_id == organization_id,
                LeaveAutoApprovalRule.leave_type_id == request.leave_type_id,
                LeaveAutoApprovalRule.is_active.is_(True),
            )
        )
    ).scalar_one_or_none()
    if rule is None:
        return AutoApprovalEvaluation(
            decision="ROUTE_HUMAN",
            reason_code="NO_ACTIVE_RULE",
            reason_label="Aucune règle d'auto-approbation active pour ce type de congé.",
            inputs=inputs,
        )

    # 1. Durée
    if duration_days > rule.max_duration_days:
        return AutoApprovalEvaluation(
            decision="ROUTE_HUMAN",
            reason_code="DURATION_EXCEEDED",
            reason_label=(
                f"Durée {duration_days} > max autorisé pour auto-approbation "
                f"({rule.max_duration_days})."
            ),
            inputs=inputs,
        )

    # 2. Quota
    if rule.require_quota_ok:
        leave_type = (
            await session.execute(
                select(LeaveType).where(LeaveType.leave_type_id == request.leave_type_id)
            )
        ).scalar_one_or_none()
        # année fiscale = année du start_date
        balance = (
            await session.execute(
                select(LeaveBalance).where(
                    LeaveBalance.employee_id == request.employee_id,
                    LeaveBalance.leave_type_id == request.leave_type_id,
                    LeaveBalance.fiscal_year == request.start_date.year,
                )
            )
        ).scalar_one_or_none()
        if balance is None:
            return AutoApprovalEvaluation(
                decision="ROUTE_HUMAN",
                reason_code="NO_BALANCE",
                reason_label="Aucun solde n'est défini pour cet agent.",
                inputs={
                    **inputs,
                    "leave_type_code": leave_type.code if leave_type else None,
                },
            )
        if balance.remaining_days < Decimal(duration_days):
            return AutoApprovalEvaluation(
                decision="ROUTE_HUMAN",
                reason_code="INSUFFICIENT_QUOTA",
                reason_label=(
                    f"Solde restant {balance.remaining_days} < durée demandée {duration_days}."
                ),
                inputs={
                    **inputs,
                    "remaining_days": str(balance.remaining_days),
                },
            )

    # 3. Couverture service
    if rule.require_service_coverage:
        coverage = await check_coverage(
            session,
            organization_id=organization_id,
            body=CoverageCheckRequest(
                employee_id=request.employee_id,
                start_date=request.start_date,
                end_date=request.end_date,
            ),
        )
        if coverage.has_conflicts:
            return AutoApprovalEvaluation(
                decision="ROUTE_HUMAN",
                reason_code="COVERAGE_CONFLICT",
                reason_label="Présence minimum violée — voir warnings.",
                inputs={
                    **inputs,
                    "warnings": coverage.warnings,
                    "blocking_rule": coverage.blocking_rule,
                },
            )

    # 4. Période bloquée
    if _is_in_blackout(rule.blackout_periods, request.start_date, request.end_date):
        return AutoApprovalEvaluation(
            decision="ROUTE_HUMAN",
            reason_code="BLACKOUT_PERIOD",
            reason_label="Demande située en période bloquée (auto-approbation suspendue).",
            inputs=inputs,
        )

    return AutoApprovalEvaluation(
        decision="APPROVE",
        reason_code="ALL_CONDITIONS_MET",
        reason_label=(
            "Toutes les conditions cumulatives sont remplies : auto-approbation autorisée."
        ),
        inputs=inputs,
    )
