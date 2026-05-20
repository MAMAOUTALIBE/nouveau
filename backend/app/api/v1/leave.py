"""Endpoints du domaine Congés : /api/v1/leave/*."""

from __future__ import annotations

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.leave import (
    LeaveBalanceResponse,
    LeaveBalanceUpsertRequest,
    LeaveCalendarEvent,
    LeaveCancelRequest,
    LeaveDecisionRequest,
    LeaveRequestCreateRequest,
    LeaveRequestResponse,
    LeaveTypeResponse,
)
from app.services import leave_service

router = APIRouter(prefix="/leave", tags=["leave"])


# ============================================================================
# Types de congés
# ============================================================================
@router.get("/types", response_model=list[LeaveTypeResponse])
async def list_leave_types(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[LeaveTypeResponse]:
    return await leave_service.list_leave_types(
        session, organization_id=current_user.organization_id
    )


# ============================================================================
# Demandes de congé
# ============================================================================
@router.get("/requests", response_model=Page[LeaveRequestResponse])
async def list_leave_requests(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    request_status: str | None = Query(None, alias="status"),
    employee_id: UUID | None = None,
    leave_type_id: UUID | None = None,
) -> Page[LeaveRequestResponse]:
    items, total = await leave_service.list_requests(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
        page=page,
        page_size=page_size,
        status=request_status,
        employee_id=employee_id,
        leave_type_id=leave_type_id,
    )
    return Page[LeaveRequestResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/requests",
    response_model=LeaveRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_leave_request(
    body: LeaveRequestCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "leave:manage", "portal:agent", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> LeaveRequestResponse:
    return await leave_service.create_request(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.get("/requests/{leave_request_id}", response_model=LeaveRequestResponse)
async def get_leave_request(
    leave_request_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> LeaveRequestResponse:
    return await leave_service.get_request(
        session, leave_request_id=leave_request_id, user=current_user
    )


@router.post(
    "/requests/{leave_request_id}/decide",
    response_model=LeaveRequestResponse,
)
async def decide_leave_request(
    leave_request_id: UUID,
    body: LeaveDecisionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["leave:approve:l1", "leave:approve:l2", "leave:manage", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> LeaveRequestResponse:
    return await leave_service.decide_request(
        session,
        leave_request_id=leave_request_id,
        decision=body,
        decided_by=current_user,
        audit=audit,
    )


@router.post(
    "/requests/{leave_request_id}/cancel",
    response_model=LeaveRequestResponse,
)
async def cancel_leave_request(
    leave_request_id: UUID,
    body: LeaveCancelRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> LeaveRequestResponse:
    return await leave_service.cancel_request(
        session,
        leave_request_id=leave_request_id,
        user=current_user,
        reason=body.reason,
        audit=audit,
    )


# ============================================================================
# Soldes
# ============================================================================
@router.get("/balances", response_model=list[LeaveBalanceResponse])
async def list_leave_balances(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    employee_id: UUID | None = None,
    fiscal_year: int | None = None,
) -> list[LeaveBalanceResponse]:
    return await leave_service.list_balances(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        fiscal_year=fiscal_year,
        user=current_user,
    )


@router.put("/balances", response_model=LeaveBalanceResponse)
async def upsert_leave_balance(
    body: LeaveBalanceUpsertRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> LeaveBalanceResponse:
    return await leave_service.upsert_balance(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Calendrier
# ============================================================================
@router.get("/calendar", response_model=list[LeaveCalendarEvent])
async def list_leave_calendar(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    from_date: Annotated[date, Query(alias="from")],
    to_date: Annotated[date, Query(alias="to")],
) -> list[LeaveCalendarEvent]:
    return await leave_service.list_calendar_events(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
        from_date=from_date,
        to_date=to_date,
    )
