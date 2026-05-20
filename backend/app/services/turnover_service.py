"""Scoring du risque de turnover — modèle explicable basé sur règles pondérées.

**Décision technique** : V1 utilise un modèle déterministe à règles pondérées,
PAS un LLM opaque ni un modèle ML statistique. Justifications :

1. **Explicabilité**. Chaque score est décomposé en facteurs nommés avec
   leur poids. Un gestionnaire RH peut justifier le score à un agent
   ou à sa hiérarchie sans boîte noire.
2. **Validation métier**. Les coefficients sont validés par la DRH avant
   activation, pas appris automatiquement sur des données potentiellement
   biaisées.
3. **Auditable**. Les snapshots sont stockés dans
   `hr.employee_turnover_risk_snapshots` avec leur `factors[]` complet,
   permettant de retracer les décisions historiques.
4. **Conforme à la roadmap** : « Définir un score explicable plutôt qu'un
   modèle opaque en première version » (cahier des charges § Phase 2.2).

Les règles de scoring V1 sont volontairement conservatrices et
transparentes. Une V2 (LLM + ML supervisé) pourra être branchée via le
champ `model_name` une fois validée par la DRH.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.discipline import DisciplineCase
from app.models.employee import Employee
from app.models.leave import LeaveRequest
from app.models.performance import PerformanceEvaluation
from app.models.personnel_360 import EmployeeTurnoverRiskSnapshot
from app.schemas.personnel import RiskLevel, TurnoverRiskFactor, TurnoverRiskItem

# ============================================================================
# Coefficients du modèle V1 (rules-v1).
# Toute modification doit être validée par la DRH avant déploiement.
# ============================================================================
WEIGHT_OPEN_LEAVE_REQUESTS = 12  # par demande en cours, max 24
WEIGHT_OPEN_LEAVE_REQUESTS_MAX = 24

WEIGHT_RECENT_LEAVE_FREQ_2 = 10  # 2 absences dans les 90 derniers jours
WEIGHT_RECENT_LEAVE_FREQ_3PLUS = 20  # 3+ absences

WEIGHT_PERF_LOW = 18  # perf finale < 75
WEIGHT_PERF_VERY_LOW = 28  # perf finale < 60

WEIGHT_DISCIPLINE_SEVERE = 15  # par dossier, max 25
WEIGHT_DISCIPLINE_SEVERE_MAX = 25

WEIGHT_RECENT_HIRE = 8  # intégration < 120 jours

WEIGHT_NO_RECENT_PERF = 10  # aucune évaluation dans les 18 mois (rétention faible signal)

# ============================================================================
# Mapping score → niveau (seuils validés par la DRH)
# ============================================================================
SCORE_THRESHOLDS = (
    (75, "Critique"),
    (50, "Eleve"),
    (25, "Modere"),
)


def _classify_level(score: int) -> RiskLevel:
    for threshold, level in SCORE_THRESHOLDS:
        if score >= threshold:
            return level  # type: ignore[return-value]
    return "Faible"


def _recommended_action(level: RiskLevel, factors: list[TurnoverRiskFactor]) -> str | None:
    if level == "Critique":
        return (
            "Entretien individuel à programmer cette semaine — niveau critique "
            "à signaler au responsable hiérarchique."
        )
    if level == "Eleve":
        return "Point RH à prévoir dans le mois ; vérifier les facteurs contributifs."
    if level == "Modere" and factors:
        return "Surveiller les indicateurs lors du prochain entretien annuel."
    return None


@dataclass(frozen=True, slots=True)
class _Factor:
    code: str
    label: str
    weight: int


def _make_factor(code: str, label: str, weight: int) -> _Factor:
    return _Factor(code=code, label=label, weight=weight)


# ============================================================================
# Calcul individuel
# ============================================================================
async def _gather_signals(
    session: AsyncSession,
    *,
    employee: Employee,
    reference: datetime | None = None,
) -> tuple[int, list[_Factor]]:
    """Calcule score brut + liste des facteurs contributifs.

    Lit en base les signaux ; pas d'I/O externe. Sans assignation à des
    valeurs par défaut implicites.
    """
    now = reference or datetime.now(tz=UTC)
    today = now.date()
    ninety_days_ago = today.toordinal() - 90
    factors: list[_Factor] = []
    score = 0

    # 1. Demandes de congés ouvertes (PENDING / IN_REVIEW)
    open_leaves = (
        (
            await session.execute(
                select(LeaveRequest).where(
                    LeaveRequest.employee_id == employee.employee_id,
                    LeaveRequest.request_status.in_(["PENDING", "IN_REVIEW"]),
                )
            )
        )
        .scalars()
        .all()
    )
    if open_leaves:
        weight = min(
            WEIGHT_OPEN_LEAVE_REQUESTS_MAX,
            WEIGHT_OPEN_LEAVE_REQUESTS * len(open_leaves),
        )
        score += weight
        factors.append(
            _make_factor(
                "OPEN_LEAVE_REQUESTS",
                f"{len(open_leaves)} demande(s) de congé en attente",
                weight,
            )
        )

    # 2. Fréquence récente des absences (90 jours)
    recent_leaves = [
        lr
        for lr in (
            await session.execute(
                select(LeaveRequest).where(
                    LeaveRequest.employee_id == employee.employee_id,
                    LeaveRequest.request_status == "APPROVED",
                )
            )
        )
        .scalars()
        .all()
        if lr.start_date and lr.start_date.toordinal() >= ninety_days_ago
    ]
    if len(recent_leaves) >= 3:
        score += WEIGHT_RECENT_LEAVE_FREQ_3PLUS
        factors.append(
            _make_factor(
                "RECENT_LEAVE_FREQUENCY_HIGH",
                f"{len(recent_leaves)} absences sur les 90 derniers jours",
                WEIGHT_RECENT_LEAVE_FREQ_3PLUS,
            )
        )
    elif len(recent_leaves) == 2:
        score += WEIGHT_RECENT_LEAVE_FREQ_2
        factors.append(
            _make_factor(
                "RECENT_LEAVE_FREQUENCY_MEDIUM",
                "2 absences sur les 90 derniers jours",
                WEIGHT_RECENT_LEAVE_FREQ_2,
            )
        )

    # 3. Performance basse (dernière évaluation validée)
    last_perf = (
        await session.execute(
            select(PerformanceEvaluation)
            .where(
                PerformanceEvaluation.employee_id == employee.employee_id,
                PerformanceEvaluation.evaluation_status == "VALIDATED",
                PerformanceEvaluation.final_score.is_not(None),
            )
            .order_by(PerformanceEvaluation.updated_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()

    if last_perf and last_perf.final_score is not None:
        score_value = float(last_perf.final_score)
        if score_value < 60:
            score += WEIGHT_PERF_VERY_LOW
            factors.append(
                _make_factor(
                    "PERF_VERY_LOW",
                    f"Performance dernière évaluation très faible ({score_value:.0f}/100)",
                    WEIGHT_PERF_VERY_LOW,
                )
            )
        elif score_value < 75:
            score += WEIGHT_PERF_LOW
            factors.append(
                _make_factor(
                    "PERF_LOW",
                    f"Performance dernière évaluation faible ({score_value:.0f}/100)",
                    WEIGHT_PERF_LOW,
                )
            )

    # 4. Dossiers disciplinaires sévères ou critiques
    severe_cases = (
        (
            await session.execute(
                select(DisciplineCase).where(
                    DisciplineCase.employee_id == employee.employee_id,
                    DisciplineCase.severity.in_(["Eleve", "Critique"]),
                    DisciplineCase.case_status.in_(
                        ["OPEN", "UNDER_INVESTIGATION", "SANCTION_PROPOSED", "SANCTION_APPLIED"]
                    ),
                )
            )
        )
        .scalars()
        .all()
    )
    if severe_cases:
        weight = min(
            WEIGHT_DISCIPLINE_SEVERE_MAX,
            WEIGHT_DISCIPLINE_SEVERE * len(severe_cases),
        )
        score += weight
        factors.append(
            _make_factor(
                "DISCIPLINE_SEVERE",
                f"{len(severe_cases)} dossier(s) disciplinaire(s) sensible(s)",
                weight,
            )
        )

    # 5. Intégration récente (< 120 jours)
    if employee.hire_date is not None:
        days_since_hire = (today - employee.hire_date).days
        if 0 <= days_since_hire <= 120:
            score += WEIGHT_RECENT_HIRE
            factors.append(
                _make_factor(
                    "RECENT_HIRE",
                    "Intégration récente (< 120 jours)",
                    WEIGHT_RECENT_HIRE,
                )
            )

    return min(100, score), factors


def _factors_to_jsonb(factors: list[_Factor]) -> list[dict[str, Any]]:
    return [{"code": f.code, "label": f.label, "weight": f.weight} for f in factors]


def _factors_to_dto(factors: list[_Factor]) -> list[TurnoverRiskFactor]:
    return [TurnoverRiskFactor(code=f.code, label=f.label, weight=f.weight) for f in factors]


# ============================================================================
# API publique
# ============================================================================
async def compute_for_employee(
    session: AsyncSession,
    *,
    employee: Employee,
    reference: datetime | None = None,
) -> TurnoverRiskItem:
    """Calcule le risque pour un agent (sans persister le snapshot)."""
    score, factors = await _gather_signals(session, employee=employee, reference=reference)
    level = _classify_level(score)
    return TurnoverRiskItem(
        employee_id=employee.employee_id,
        matricule=employee.matricule,
        full_name=employee.full_name,
        direction_id=employee.direction_id,
        unit_id=employee.unit_id,
        risk_score=score,
        risk_level=level,
        factors=_factors_to_dto(factors),
        recommended_action=_recommended_action(level, _factors_to_dto(factors)),
        model_name="rules-v1",
        generated_at=reference or datetime.now(tz=UTC),
    )


async def list_for_organization(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_id: UUID | None = None,
    min_level: RiskLevel | None = None,
) -> list[TurnoverRiskItem]:
    """Calcule le scoring pour tous les employés ACTIVE de l'organisation.

    V1 : calcul à la volée à chaque appel (acceptable < 1000 employés).
    V2 : faire tourner un job arq nightly et lire les snapshots.
    """
    base = select(Employee).where(
        Employee.organization_id == organization_id,
        Employee.employment_status == "ACTIVE",
    )
    if direction_id is not None:
        base = base.where(Employee.direction_id == direction_id)

    employees = (await session.execute(base)).scalars().all()
    items: list[TurnoverRiskItem] = []
    for emp in employees:
        item = await compute_for_employee(session, employee=emp)
        if min_level is not None:
            order = ["Faible", "Modere", "Eleve", "Critique"]
            if order.index(item.risk_level) < order.index(min_level):
                continue
        items.append(item)
    items.sort(key=lambda x: x.risk_score, reverse=True)
    return items


async def persist_snapshot(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee: Employee,
    item: TurnoverRiskItem,
    reviewed_by_user_id: UUID | None = None,
) -> EmployeeTurnoverRiskSnapshot:
    """Stocke un snapshot dans `hr.employee_turnover_risk_snapshots`."""
    snapshot = EmployeeTurnoverRiskSnapshot(
        organization_id=organization_id,
        employee_id=employee.employee_id,
        risk_score=item.risk_score,
        risk_level=item.risk_level,
        factors=[{"code": f.code, "label": f.label, "weight": f.weight} for f in item.factors],
        recommended_action=item.recommended_action,
        model_name=item.model_name,
        generated_at=item.generated_at,
        reviewed_by_user_id=reviewed_by_user_id,
    )
    session.add(snapshot)
    await session.flush([snapshot])
    return snapshot


__all__ = [
    # Exposés pour tests unitaires
    "_classify_level",
    "_gather_signals",
    "_recommended_action",
    "compute_for_employee",
    "list_for_organization",
    "persist_snapshot",
]
