"""Endpoints du domaine Workflows : /api/v1/workflows/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.workflow import (
    WorkflowDefinitionCreateRequest,
    WorkflowDefinitionDetail,
    WorkflowDefinitionResponse,
    WorkflowInstanceActionRequest,
    WorkflowInstanceCreateRequest,
    WorkflowInstanceEventResponse,
    WorkflowInstanceResponse,
)
from app.services import workflow_service

router = APIRouter(prefix="/workflows", tags=["workflows"])


# ============================================================================
# Definitions
# ============================================================================
@router.get("/definitions", response_model=list[WorkflowDefinitionResponse])
async def list_definitions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:view", "workflows:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[WorkflowDefinitionResponse]:
    return await workflow_service.list_definitions(
        session, organization_id=current_user.organization_id
    )


@router.post(
    "/definitions",
    response_model=WorkflowDefinitionDetail,
    status_code=status.HTTP_201_CREATED,
)
async def create_definition(
    body: WorkflowDefinitionCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> WorkflowDefinitionDetail:
    return await workflow_service.create_definition(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.get(
    "/definitions/{workflow_definition_id}",
    response_model=WorkflowDefinitionDetail,
)
async def get_definition(
    workflow_definition_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:view", "workflows:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> WorkflowDefinitionDetail:
    return await workflow_service.get_definition(
        session, workflow_definition_id=workflow_definition_id
    )


# ============================================================================
# Instances
# ============================================================================
@router.get("/instances", response_model=Page[WorkflowInstanceResponse])
async def list_instances(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["workflows:view", "workflows:manage", "portal:manager", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    instance_status: str | None = Query(None, alias="status"),
    workflow_definition_id: UUID | None = None,
) -> Page[WorkflowInstanceResponse]:
    items, total = await workflow_service.list_instances(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        instance_status=instance_status,
        workflow_definition_id=workflow_definition_id,
    )
    return Page[WorkflowInstanceResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/instances",
    response_model=WorkflowInstanceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_instance(
    body: WorkflowInstanceCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> WorkflowInstanceResponse:
    return await workflow_service.create_instance(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/instances/{instance_key}/actions",
    response_model=WorkflowInstanceResponse,
)
async def perform_instance_action(
    instance_key: str,
    body: WorkflowInstanceActionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:manage", "portal:manager", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> WorkflowInstanceResponse:
    # `instance_key` accepte l'UUID technique ou la référence métier (WFI-...).
    return await workflow_service.perform_action(
        session,
        instance_key=instance_key,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.get(
    "/instances/{workflow_instance_id}/events",
    response_model=list[WorkflowInstanceEventResponse],
)
async def list_instance_events(
    workflow_instance_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["workflows:view", "workflows:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[WorkflowInstanceEventResponse]:
    return await workflow_service.list_instance_events(
        session, workflow_instance_id=workflow_instance_id
    )
