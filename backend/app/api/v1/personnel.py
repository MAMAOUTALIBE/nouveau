"""Endpoints du domaine Personnel : /api/v1/personnel/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.errors import ForbiddenError
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.personnel import (
    AgentCreateRequest,
    AgentListItem,
    AgentResponse,
    AgentUpdateRequest,
    AssignmentCreateRequest,
    AssignmentResponse,
    DossierExportResponse,
    RiskLevel,
    TurnoverRiskItem,
)
from app.services import dossier_pdf, personnel_service, turnover_service

router = APIRouter(prefix="/personnel", tags=["personnel"])


# ============================================================================
# Agents
# ============================================================================
@router.get("/agents", response_model=Page[AgentListItem])
async def list_agents(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    employment_status: str | None = Query(None, alias="status"),
    direction_id: UUID | None = None,
    unit_id: UUID | None = None,
    search: str | None = Query(None, alias="q"),
) -> Page[AgentListItem]:
    items, total = await personnel_service.list_agents(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
        page=page,
        page_size=page_size,
        status=employment_status,
        direction_id=direction_id,
        unit_id=unit_id,
        search=search,
    )
    return Page[AgentListItem](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/agents",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent(
    body: AgentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AgentResponse:
    return await personnel_service.create_agent(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.get("/agents/{employee_id}", response_model=AgentResponse)
async def get_agent(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AgentResponse:
    return await personnel_service.get_agent(session, employee_id=employee_id, user=current_user)


@router.put("/agents/{employee_id}", response_model=AgentResponse)
async def update_agent(
    employee_id: UUID,
    body: AgentUpdateRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AgentResponse:
    return await personnel_service.update_agent(
        session, employee_id=employee_id, body=body, audit=audit
    )


# ============================================================================
# Affectations
# ============================================================================
@router.get("/affectations", response_model=list[AssignmentResponse])
async def list_assignments(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    employee_id: UUID | None = None,
) -> list[AssignmentResponse]:
    return await personnel_service.list_assignments(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
    )


@router.post(
    "/affectations",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    body: AssignmentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AssignmentResponse:
    return await personnel_service.create_assignment(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Turnover risk — restreint aux rôles habilités (DRH)
# ============================================================================
@router.get("/turnover-risk", response_model=list[TurnoverRiskItem])
async def list_turnover_risk(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    direction_id: UUID | None = None,
    min_level: RiskLevel | None = None,
) -> list[TurnoverRiskItem]:
    """Liste les agents avec leur score de turnover.

    **Règle métier non négociable** : le scoring n'est lisible que par les
    rôles habilités (hr_manager, super_admin). Un manager direct (N+1)
    ne doit pas voir le score de son agent direct sans contrôle DRH —
    cette restriction est imposée par le RBAC : `personnel:manage` n'est
    octroyé qu'aux hr_manager et super_admin (cf. seed_initial.py).
    """
    if not current_user.has_any_role(
        ["hr_manager", "super_admin"]
    ) and not current_user.has_permission("*"):
        raise ForbiddenError(
            "Le scoring turnover est réservé aux rôles RH habilités.",
            code="TURNOVER_FORBIDDEN_FOR_ROLE",
        )
    return await turnover_service.list_for_organization(
        session,
        organization_id=current_user.organization_id,
        direction_id=direction_id,
        min_level=min_level,
    )


@router.post(
    "/agents/{employee_id}/dossier-export",
    response_model=DossierExportResponse,
)
@router.post(
    "/agents/{employee_id}/export-pdf",
    response_model=DossierExportResponse,
    include_in_schema=False,
)
async def export_agent_dossier(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DossierExportResponse:
    """Génère un dossier PDF signé pour l'agent.

    Le PDF est rendu via le `PdfRenderer` (WeasyPrint si dispo, sinon
    minimal), signé via `SignaturePort` (Mock V1, Endesive PAdES en prod
    avec PKI gouvernementale), stocké via `ObjectStoragePort` (LocalFS
    par défaut, MinIO en prod). Audit `EMPLOYEE_DOSSIER_EXPORTED`.
    """
    export = await dossier_pdf.generate_signed_dossier(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
    return DossierExportResponse.model_validate(export)


@router.get(
    "/agents/{employee_id}/turnover-risk",
    response_model=TurnoverRiskItem,
)
async def get_agent_turnover_risk(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TurnoverRiskItem:
    if not current_user.has_any_role(
        ["hr_manager", "super_admin"]
    ) and not current_user.has_permission("*"):
        raise ForbiddenError(
            "Le scoring turnover est réservé aux rôles RH habilités.",
            code="TURNOVER_FORBIDDEN_FOR_ROLE",
        )
    employee = await personnel_service._load_agent(session, employee_id)
    return await turnover_service.compute_for_employee(session, employee=employee)
