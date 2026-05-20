"""Endpoints du domaine Discipline : /api/v1/discipline/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.discipline import (
    DisciplineCaseCreateRequest,
    DisciplineCaseResponse,
    DisciplineCaseTransitionRequest,
    DisciplineEventResponse,
)
from app.services import discipline_service

router = APIRouter(prefix="/discipline", tags=["discipline"])


@router.get("/cases", response_model=list[DisciplineCaseResponse])
async def list_cases(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["discipline:view", "discipline:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    case_status: str | None = Query(None, alias="status"),
    employee_id: UUID | None = None,
    severity: str | None = None,
) -> list[DisciplineCaseResponse]:
    return await discipline_service.list_cases(
        session,
        organization_id=current_user.organization_id,
        case_status=case_status,
        employee_id=employee_id,
        severity=severity,
    )


@router.post(
    "/cases",
    response_model=DisciplineCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_case(
    body: DisciplineCaseCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["discipline:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DisciplineCaseResponse:
    return await discipline_service.create_case(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.post(
    "/cases/{discipline_case_id}/transition",
    response_model=DisciplineCaseResponse,
)
async def transition_case(
    discipline_case_id: UUID,
    body: DisciplineCaseTransitionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["discipline:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DisciplineCaseResponse:
    return await discipline_service.transition_case(
        session,
        discipline_case_id=discipline_case_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.get(
    "/cases/{discipline_case_id}/events",
    response_model=list[DisciplineEventResponse],
)
async def list_events(
    discipline_case_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["discipline:view", "discipline:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DisciplineEventResponse]:
    return await discipline_service.list_events(session, discipline_case_id=discipline_case_id)
