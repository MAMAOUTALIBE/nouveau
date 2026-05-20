"""Endpoints règles avancées de congés (auto-approbation + couverture service)."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.leave_advanced import (
    AutoApprovalEvaluation,
    AutoApprovalRuleResponse,
    AutoApprovalRuleUpsertRequest,
    CoverageCheckRequest,
    CoverageCheckResult,
    CoverageRuleResponse,
    CoverageRuleUpsertRequest,
)
from app.services import leave_advanced_service

router = APIRouter(prefix="/leave", tags=["leave-rules"])


# ============================================================================
# Coverage rules
# ============================================================================
@router.get("/coverage-rules", response_model=list[CoverageRuleResponse])
async def list_coverage_rules(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[CoverageRuleResponse]:
    return await leave_advanced_service.list_coverage_rules(
        session, organization_id=current_user.organization_id
    )


@router.put("/coverage-rules", response_model=CoverageRuleResponse)
async def upsert_coverage_rule(
    body: CoverageRuleUpsertRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> CoverageRuleResponse:
    return await leave_advanced_service.upsert_coverage_rule(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Coverage check (preview)
# ============================================================================
@router.post("/coverage-check", response_model=CoverageCheckResult)
async def check_coverage(
    body: CoverageCheckRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:view", "leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CoverageCheckResult:
    return await leave_advanced_service.check_coverage(
        session,
        organization_id=current_user.organization_id,
        body=body,
    )


# ============================================================================
# Auto-approval rules
# ============================================================================
@router.get("/auto-approval-rules", response_model=list[AutoApprovalRuleResponse])
async def list_auto_approval_rules(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AutoApprovalRuleResponse]:
    return await leave_advanced_service.list_auto_approval_rules(
        session, organization_id=current_user.organization_id
    )


@router.put("/auto-approval-rules", response_model=AutoApprovalRuleResponse)
async def upsert_auto_approval_rule(
    body: AutoApprovalRuleUpsertRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AutoApprovalRuleResponse:
    return await leave_advanced_service.upsert_auto_approval_rule(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Auto-approval evaluation
# ============================================================================
@router.post(
    "/requests/{leave_request_id}/auto-approval-evaluation",
    response_model=AutoApprovalEvaluation,
)
async def evaluate_auto_approval(
    leave_request_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["leave:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AutoApprovalEvaluation:
    return await leave_advanced_service.evaluate_auto_approval(
        session,
        organization_id=current_user.organization_id,
        leave_request_id=leave_request_id,
    )
