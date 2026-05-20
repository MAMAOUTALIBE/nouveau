"""Endpoints du domaine Formation : /api/v1/training/*."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.training import (
    TrainingCatalogCreateRequest,
    TrainingCatalogResponse,
    TrainingCertificateIssueSummary,
    TrainingCertificateResponse,
    TrainingColdEvalLaunchSummary,
    TrainingEvaluationPublic,
    TrainingEvaluationRespondRequest,
    TrainingEvaluationResponse,
    TrainingParticipantUpsertRequest,
    TrainingRequestCreateRequest,
    TrainingRequestDecisionRequest,
    TrainingRequestResponse,
    TrainingSessionCreateRequest,
    TrainingSessionParticipantResponse,
    TrainingSessionResponse,
    TrainingSessionTransitionRequest,
)
from app.services import training_service

router = APIRouter(prefix="/training", tags=["training"])


# ============================================================================
# Catalog
# ============================================================================
@router.get("/catalog", response_model=list[TrainingCatalogResponse])
async def list_catalog(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    only_active: bool = True,
) -> list[TrainingCatalogResponse]:
    return await training_service.list_catalog(
        session,
        organization_id=current_user.organization_id,
        only_active=only_active,
    )


@router.post(
    "/catalog",
    response_model=TrainingCatalogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_catalog(
    body: TrainingCatalogCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingCatalogResponse:
    return await training_service.create_catalog_entry(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Sessions
# ============================================================================
@router.get("/sessions", response_model=list[TrainingSessionResponse])
async def list_sessions(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    session_status: str | None = Query(None, alias="status"),
) -> list[TrainingSessionResponse]:
    return await training_service.list_sessions(
        session,
        organization_id=current_user.organization_id,
        session_status=session_status,
    )


@router.post(
    "/sessions",
    response_model=TrainingSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_session(
    body: TrainingSessionCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingSessionResponse:
    return await training_service.create_session(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/sessions/{training_session_id}/transition",
    response_model=TrainingSessionResponse,
)
async def transition_session(
    training_session_id: UUID,
    body: TrainingSessionTransitionRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingSessionResponse:
    return await training_service.transition_session(
        session,
        training_session_id=training_session_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Participants
# ============================================================================
@router.get(
    "/sessions/{training_session_id}/participants",
    response_model=list[TrainingSessionParticipantResponse],
)
async def list_participants(
    training_session_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TrainingSessionParticipantResponse]:
    return await training_service.list_participants(
        session, training_session_id=training_session_id
    )


@router.put(
    "/sessions/{training_session_id}/participants",
    response_model=TrainingSessionParticipantResponse,
)
async def upsert_participant(
    training_session_id: UUID,
    body: TrainingParticipantUpsertRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingSessionParticipantResponse:
    return await training_service.upsert_participant(
        session,
        training_session_id=training_session_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Demandes
# ============================================================================
@router.get("/requests", response_model=list[TrainingRequestResponse])
async def list_requests(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    request_status: str | None = Query(None, alias="status"),
    employee_id: UUID | None = None,
) -> list[TrainingRequestResponse]:
    return await training_service.list_requests(
        session,
        organization_id=current_user.organization_id,
        request_status=request_status,
        employee_id=employee_id,
    )


@router.post(
    "/requests",
    response_model=TrainingRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_request(
    body: TrainingRequestCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(any_of=["training:view", "training:manage", "portal:agent", "*"])
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingRequestResponse:
    return await training_service.create_request(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/requests/{training_request_id}/decide",
    response_model=TrainingRequestResponse,
)
@router.post(
    "/requests/{training_request_id}/decision",
    response_model=TrainingRequestResponse,
    include_in_schema=False,
)
async def decide_request(
    training_request_id: UUID,
    body: TrainingRequestDecisionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingRequestResponse:
    return await training_service.decide_request(
        session,
        training_request_id=training_request_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Évaluations à froid
# ============================================================================
@router.post(
    "/cold-evaluations/launch-pending",
    response_model=TrainingColdEvalLaunchSummary,
)
async def launch_pending_cold_evaluations(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingColdEvalLaunchSummary:
    return await training_service.launch_pending_cold_evaluations(
        session,
        organization_id=current_user.organization_id,
        audit=audit,
    )


@router.get(
    "/sessions/{training_session_id}/evaluations",
    response_model=list[TrainingEvaluationResponse],
)
async def list_evaluations(
    training_session_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TrainingEvaluationResponse]:
    return await training_service.list_evaluations_for_session(
        session, training_session_id=training_session_id
    )


# ============================================================================
# Certificats
# ============================================================================
@router.post(
    "/sessions/{training_session_id}/certificates",
    response_model=TrainingCertificateIssueSummary,
)
async def issue_certificates(
    training_session_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> TrainingCertificateIssueSummary:
    return await training_service.issue_certificates_for_session(
        session,
        organization_id=current_user.organization_id,
        training_session_id=training_session_id,
        audit=audit,
    )


@router.get(
    "/sessions/{training_session_id}/certificates",
    response_model=list[TrainingCertificateResponse],
)
async def list_session_certificates(
    training_session_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["training:view", "training:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TrainingCertificateResponse]:
    return await training_service.list_certificates_for_session(
        session, training_session_id=training_session_id
    )


@router.get(
    "/employees/{employee_id}/certificates",
    response_model=list[TrainingCertificateResponse],
)
async def list_employee_certificates(
    employee_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(any_of=["training:view", "training:manage", "personnel:view", "*"])
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[TrainingCertificateResponse]:
    return await training_service.list_certificates_for_employee(session, employee_id=employee_id)


# ============================================================================
# Public — endpoints sans authentification (token-based)
# ============================================================================
public_router = APIRouter(prefix="/public/training", tags=["training-public"])


@public_router.get(
    "/evaluations/{token}",
    response_model=TrainingEvaluationPublic,
)
async def get_public_evaluation(
    token: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TrainingEvaluationPublic:
    return await training_service.get_evaluation_by_token(session, token=token)


@public_router.post(
    "/evaluations/{token}/respond",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def respond_public_evaluation(
    token: str,
    body: TrainingEvaluationRespondRequest,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    await training_service.respond_to_evaluation(session, token=token, body=body)


@public_router.get(
    "/certificates/verify/{verification_code}",
    response_model=dict[str, Any],
)
async def verify_certificate(
    verification_code: str,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str | datetime]:
    return await training_service.verify_certificate_public(
        session, verification_code=verification_code
    )
