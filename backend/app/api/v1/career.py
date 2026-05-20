"""Endpoints Carrière + GPEC : /api/v1/careers/* et /api/v1/gpec/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.career import (
    CompetencyCreateRequest,
    CompetencyGapsComputeRequest,
    CompetencyGapsSnapshotResponse,
    CompetencyResponse,
    DepartureDecisionUpdateRequest,
    DeparturesResponse,
    MovementCreateRequest,
    MovementDecisionRequest,
    MovementResponse,
    PositionRequirementResponse,
    PositionRequirementUpsertRequest,
    RetirementAgeUpdateRequest,
)
from app.services import career_service

careers_router = APIRouter(prefix="/careers", tags=["careers"])
gpec_router = APIRouter(prefix="/gpec", tags=["gpec"])


# ============================================================================
# Carrière — mouvements
# ============================================================================
@careers_router.get("/movements", response_model=list[MovementResponse])
async def list_movements(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:view", "careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    employee_id: UUID | None = None,
    movement_status: str | None = None,
) -> list[MovementResponse]:
    return await career_service.list_movements(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        movement_status=movement_status,
    )


@careers_router.post(
    "/movements",
    response_model=MovementResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_movement(
    body: MovementCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> MovementResponse:
    return await career_service.create_movement(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@careers_router.post(
    "/movements/{movement_id}/decide",
    response_model=MovementResponse,
)
async def decide_movement(
    movement_id: UUID,
    body: MovementDecisionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> MovementResponse:
    return await career_service.decide_movement(
        session,
        movement_id=movement_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Carrière — anticipation des départs (retraites + fins de contrat)
# ============================================================================
@careers_router.get("/departures", response_model=DeparturesResponse)
async def list_departures(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:view", "careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DeparturesResponse:
    return await career_service.get_departures(
        session, organization_id=current_user.organization_id
    )


@careers_router.put("/departures/retirement-age", response_model=DeparturesResponse)
async def update_retirement_age(
    body: RetirementAgeUpdateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DeparturesResponse:
    return await career_service.set_retirement_age(
        session,
        organization_id=current_user.organization_id,
        retirement_age=body.retirement_age,
        audit=audit,
    )


@careers_router.patch("/departures/{employee_id}/decision", response_model=DeparturesResponse)
async def update_departure_decision(
    employee_id: UUID,
    body: DepartureDecisionUpdateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DeparturesResponse:
    return await career_service.set_departure_decision(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        decision=body.decision,
        audit=audit,
    )


# ============================================================================
# GPEC — référentiel compétences
# ============================================================================
@gpec_router.get("/competencies", response_model=list[CompetencyResponse])
async def list_competencies(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:view", "careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[CompetencyResponse]:
    return await career_service.list_competencies(
        session, organization_id=current_user.organization_id
    )


@gpec_router.post(
    "/competencies",
    response_model=CompetencyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_competency(
    body: CompetencyCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> CompetencyResponse:
    return await career_service.create_competency(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# GPEC — exigences par poste
# ============================================================================
@gpec_router.get(
    "/positions/{position_id}/requirements",
    response_model=list[PositionRequirementResponse],
)
async def list_position_requirements(
    position_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:view", "careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[PositionRequirementResponse]:
    return await career_service.list_position_requirements(session, position_id=position_id)


@gpec_router.put(
    "/positions/{position_id}/requirements",
    response_model=PositionRequirementResponse,
)
async def upsert_position_requirement(
    position_id: UUID,
    body: PositionRequirementUpsertRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> PositionRequirementResponse:
    return await career_service.upsert_position_requirement(
        session,
        organization_id=current_user.organization_id,
        position_id=position_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# GPEC — snapshots d'écarts
# ============================================================================
@gpec_router.get(
    "/gaps-snapshots",
    response_model=list[CompetencyGapsSnapshotResponse],
)
async def list_gaps_snapshots(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:view", "careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    scope_type: str | None = None,
    limit: int = 50,
) -> list[CompetencyGapsSnapshotResponse]:
    return await career_service.list_gaps_snapshots(
        session,
        organization_id=current_user.organization_id,
        scope_type=scope_type,
        limit=limit,
    )


@gpec_router.post(
    "/gaps-snapshots",
    response_model=CompetencyGapsSnapshotResponse,
    status_code=status.HTTP_201_CREATED,
)
async def compute_gaps_snapshot(
    body: CompetencyGapsComputeRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["careers:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> CompetencyGapsSnapshotResponse:
    return await career_service.compute_gaps_snapshot(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
