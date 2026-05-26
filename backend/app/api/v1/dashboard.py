"""Endpoints Dashboard + Reports + Modernization."""

from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.dashboard import (
    DashboardOperationsResponse,
    DashboardPilotageResponse,
    DashboardSummary,
    ModernizationSummary,
    PendingDecisionItem,
)
from app.services import dashboard_service

dashboard_router = APIRouter(prefix="/dashboard", tags=["dashboard"])
reports_router = APIRouter(prefix="/reports", tags=["reports"])
modernization_router = APIRouter(prefix="/modernization", tags=["modernization"])


# ============================================================================
# Dashboard
# ============================================================================
@dashboard_router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["dashboard:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DashboardSummary:
    return await dashboard_service.build_summary(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
    )


@dashboard_router.get("/operations", response_model=DashboardOperationsResponse)
async def get_dashboard_operations(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["dashboard:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DashboardOperationsResponse:
    """Vue Opérations : indicateurs court-terme + ventilations utiles.

    V1.0 : composition d'agrégats déjà existants (``build_summary`` +
    ``report_employees_by_direction`` + ``report_leave_by_status``). Pas
    de nouvelle requête métier — V1.5 pourra introduire un service dédié.
    """
    summary = await dashboard_service.build_summary(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
    )
    employees_by_direction = await dashboard_service.report_employees_by_direction(
        session, organization_id=current_user.organization_id
    )
    leave_by_status = await dashboard_service.report_leave_by_status(
        session, organization_id=current_user.organization_id
    )
    return DashboardOperationsResponse(
        organization_id=current_user.organization_id,
        generated_at=datetime.now(tz=UTC),
        leave_requests_pending=summary.leave_requests_pending,
        documents_pending_validation=summary.documents_pending_validation,
        workflows_in_progress=summary.workflows_in_progress,
        discipline_cases_open=summary.discipline_cases_open,
        employees_by_direction=employees_by_direction,
        leave_by_status=leave_by_status,
    )


@dashboard_router.get("/pilotage", response_model=DashboardPilotageResponse)
async def get_dashboard_pilotage(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["dashboard:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DashboardPilotageResponse:
    """Vue Pilotage : indicateurs stratégiques DRH.

    V1.0 : re-projette ``build_summary`` avec un focus pilotage (counts
    déjà calculés + summary global). Une V1.5 ajoutera des KPI dédiés
    (taux de rotation, masse salariale, etc.).
    """
    summary = await dashboard_service.build_summary(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
    )
    return DashboardPilotageResponse(
        organization_id=current_user.organization_id,
        generated_at=datetime.now(tz=UTC),
        summary=summary,
        counts=summary.counts,
    )


@dashboard_router.get(
    "/pending-decisions",
    response_model=list[PendingDecisionItem],
)
async def list_pending_decisions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["dashboard:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = Query(default=50, ge=1, le=200),
) -> list[PendingDecisionItem]:
    return await dashboard_service.list_pending_decisions(
        session,
        organization_id=current_user.organization_id,
        limit=limit,
    )


# ============================================================================
# Reports
# ============================================================================
@reports_router.get(
    "/employees-by-direction",
    response_model=list[dict[str, str | int]],
)
async def employees_by_direction(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["reports:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[dict[str, str | int]]:
    return await dashboard_service.report_employees_by_direction(
        session, organization_id=current_user.organization_id
    )


@reports_router.get(
    "/leave-by-status",
    response_model=list[dict[str, str | int]],
)
async def leave_by_status(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["reports:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    period_start: date | None = None,
    period_end: date | None = None,
) -> list[dict[str, str | int]]:
    return await dashboard_service.report_leave_by_status(
        session,
        organization_id=current_user.organization_id,
        period_start=period_start,
        period_end=period_end,
    )


# ============================================================================
# Modernization
# ============================================================================
@modernization_router.get("/summary", response_model=ModernizationSummary)
async def modernization_summary(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["dashboard:view", "*"])),
    ],
) -> ModernizationSummary:
    return await dashboard_service.get_modernization_summary(
        organization_id=current_user.organization_id
    )
