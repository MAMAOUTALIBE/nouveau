"""Endpoints du domaine Organization : /api/v1/organization/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.organization import (
    BudgetedPositionResponse,
    DirectionCreateRequest,
    DirectionResponse,
    OrgChartDirectionNode,
    PositionCreateRequest,
    PositionResponse,
    PositionUpdateStatusRequest,
    UnitCreateRequest,
    UnitResponse,
    VacantPositionResponse,
)
from app.services import organization_service

router = APIRouter(prefix="/organization", tags=["organization"])


# ============================================================================
# Directions
# ============================================================================
@router.get("/directions", response_model=list[DirectionResponse])
async def list_directions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DirectionResponse]:
    return await organization_service.list_directions(
        session, organization_id=current_user.organization_id
    )


@router.post(
    "/directions",
    response_model=DirectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_direction(
    body: DirectionCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DirectionResponse:
    return await organization_service.create_direction(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Units
# ============================================================================
@router.get("/units", response_model=list[UnitResponse])
async def list_units(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    direction_id: UUID | None = None,
) -> list[UnitResponse]:
    return await organization_service.list_units(
        session,
        organization_id=current_user.organization_id,
        direction_id=direction_id,
    )


@router.post(
    "/units",
    response_model=UnitResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_unit(
    body: UnitCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UnitResponse:
    return await organization_service.create_unit(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Positions
# ============================================================================
@router.get("/positions", response_model=list[PositionResponse])
async def list_positions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    direction_id: UUID | None = None,
    unit_id: UUID | None = None,
    position_status: str | None = Query(None, alias="status"),
) -> list[PositionResponse]:
    return await organization_service.list_positions(
        session,
        organization_id=current_user.organization_id,
        direction_id=direction_id,
        unit_id=unit_id,
        position_status=position_status,
    )


@router.get("/positions/budgeted", response_model=list[BudgetedPositionResponse])
async def list_budgeted_positions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[BudgetedPositionResponse]:
    """Liste des postes budgétisés (page Organisation › Postes budgétaires)."""
    return await organization_service.list_budgeted_positions(
        session, organization_id=current_user.organization_id
    )


@router.get("/positions/vacant", response_model=list[VacantPositionResponse])
async def list_vacant_positions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[VacantPositionResponse]:
    """Liste des postes vacants (page Organisation › Postes vacants)."""
    return await organization_service.list_vacant_positions(
        session, organization_id=current_user.organization_id
    )


@router.post(
    "/positions",
    response_model=PositionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_position(
    body: PositionCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PositionResponse:
    return await organization_service.create_position(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/positions/{position_id}/status",
    response_model=PositionResponse,
)
async def update_position_status(
    position_id: UUID,
    body: PositionUpdateStatusRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PositionResponse:
    return await organization_service.update_position_status(
        session,
        position_id=position_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Org chart hiérarchique
# ============================================================================
@router.get("/org-chart", response_model=list[OrgChartDirectionNode])
async def get_org_chart(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["organization:view", "organization:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[OrgChartDirectionNode]:
    return await organization_service.build_org_chart(
        session, organization_id=current_user.organization_id
    )
