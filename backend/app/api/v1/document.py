"""Endpoints du domaine Documents : /api/v1/documents/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.schemas.common import Page
from app.schemas.document import (
    DocumentAnalysisRunResponse,
    DocumentAnalyticsReport,
    DocumentArchivePurgeRequest,
    DocumentArchivePurgeResult,
    DocumentArchiveRunRequest,
    DocumentArchiveRunResult,
    DocumentAuditLogItem,
    DocumentCreateRequest,
    DocumentExtractedFieldResponse,
    DocumentExtractedFieldValidateRequest,
    DocumentInboxItem,
    DocumentOverdueItem,
    DocumentProcessingQueueItem,
    DocumentRequestCreateRequest,
    DocumentRequestDecisionRequest,
    DocumentRequestResponse,
    DocumentRequirementItem,
    DocumentResponse,
    DocumentTypeCreateRequest,
    DocumentTypeResponse,
    DocumentUpdateStatusRequest,
)
from app.services import document_service, ocr_pipeline

router = APIRouter(prefix="/documents", tags=["documents"])


# ============================================================================
# Document types catalog
# ============================================================================
@router.get("/types", response_model=list[DocumentTypeResponse])
async def list_document_types(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    module_scope: str | None = None,
    only_active: bool = True,
) -> list[DocumentTypeResponse]:
    return await document_service.list_document_types(
        session,
        organization_id=current_user.organization_id,
        module_scope=module_scope,
        only_active=only_active,
    )


@router.post(
    "/types",
    response_model=DocumentTypeResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document_type(
    body: DocumentTypeCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentTypeResponse:
    return await document_service.create_document_type(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Library
# ============================================================================
@router.get("/library", response_model=Page[DocumentResponse])
async def list_documents(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    document_type: str | None = None,
    document_status: str | None = Query(None, alias="status"),
    employee_id: UUID | None = None,
    search: str | None = Query(None, alias="q"),
) -> Page[DocumentResponse]:
    items, total = await document_service.list_documents(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        document_type=document_type,
        document_status=document_status,
        employee_id=employee_id,
        search=search,
        user=current_user,
    )
    return Page[DocumentResponse](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/library",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document(
    body: DocumentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentResponse:
    return await document_service.create_document(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.get("/library/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DocumentResponse:
    return await document_service.get_document(session, document_id)


@router.post("/library/{document_id}/status", response_model=DocumentResponse)
async def update_document_status(
    document_id: UUID,
    body: DocumentUpdateStatusRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentResponse:
    return await document_service.update_document_status(
        session, document_id=document_id, body=body, audit=audit
    )


# ============================================================================
# Analysis runs (lecture seule en V1 ; le worker OCR PY-041 écrit)
# ============================================================================
@router.get(
    "/library/{document_id}/analysis-runs",
    response_model=list[DocumentAnalysisRunResponse],
)
async def list_analysis_runs(
    document_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DocumentAnalysisRunResponse]:
    return await document_service.list_analysis_runs(session, document_id=document_id)


@router.get(
    "/analysis-runs/{document_analysis_run_id}/extracted-fields",
    response_model=list[DocumentExtractedFieldResponse],
)
async def list_extracted_fields(
    document_analysis_run_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DocumentExtractedFieldResponse]:
    return await document_service.list_extracted_fields(
        session, document_analysis_run_id=document_analysis_run_id
    )


@router.post(
    "/library/{document_id}/run-extraction",
    response_model=DocumentAnalysisRunResponse,
)
async def run_extraction(
    document_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentAnalysisRunResponse:
    """Lance une extraction OCR/IA sur la dernière version du document.

    Le provider est sélectionné via `OCR_PROVIDER` (mock par défaut,
    `tesseract` pour souveraineté on-prem). La validation humaine des
    champs reste obligatoire avant écriture vers le dossier agent.
    """
    run = await ocr_pipeline.run_extraction(
        session,
        organization_id=current_user.organization_id,
        document_id=document_id,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
    return DocumentAnalysisRunResponse.model_validate(run)


@router.post(
    "/extracted-fields/{field_id}/validate",
    response_model=DocumentExtractedFieldResponse,
)
async def validate_extracted_field(
    field_id: UUID,
    body: DocumentExtractedFieldValidateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentExtractedFieldResponse:
    return await document_service.validate_extracted_field(
        session,
        field_id=field_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Demandes de documents administratifs (Portail manager / Portail agent)
# ============================================================================
@router.get("/requests", response_model=list[DocumentRequestResponse])
async def list_document_requests(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["documents:view", "documents:manage", "portal:manager", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    request_status: str | None = Query(None, alias="status"),
    employee_id: UUID | None = None,
) -> list[DocumentRequestResponse]:
    return await document_service.list_requests(
        session,
        organization_id=current_user.organization_id,
        request_status=request_status,
        employee_id=employee_id,
    )


@router.post(
    "/requests",
    response_model=DocumentRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_document_request(
    body: DocumentRequestCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["portal:agent", "portal:manager", "documents:manage", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentRequestResponse:
    return await document_service.create_request(
        session,
        organization_id=current_user.organization_id,
        requested_by_employee_id=current_user.employee_id,
        body=body,
        audit=audit,
    )


@router.post(
    "/requests/{request_key}/decide",
    response_model=DocumentRequestResponse,
)
@router.post(
    "/requests/{request_key}/decision",
    response_model=DocumentRequestResponse,
    include_in_schema=False,
)
async def decide_document_request(
    request_key: str,
    body: DocumentRequestDecisionRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(any_of=["documents:manage", "portal:manager", "*"])
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentRequestResponse:
    # `request_key` accepte l'UUID technique ou la référence métier (DDOC-...).
    return await document_service.decide_request(
        session,
        request_key=request_key,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Journal d'audit / Inbox / Overdue / Processing-queue / Requirements / Analytics
# / Archivage — lot V1.5 documents
# ============================================================================
@router.get("/audit-logs", response_model=list[DocumentAuditLogItem])
async def list_document_audit_logs(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    reference: str | None = None,
    action: str | None = None,
    actor: str | None = None,
    limit: Annotated[int, Query(ge=1, le=1000)] = 200,
) -> list[DocumentAuditLogItem]:
    return await document_service.list_document_audit_logs(
        session,
        organization_id=current_user.organization_id,
        reference=reference,
        action=action,
        actor=actor,
        limit=limit,
    )


@router.get("/inbox", response_model=list[DocumentInboxItem])
async def list_document_inbox(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["portal:agent", "portal:manager", "documents:view", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DocumentInboxItem]:
    return await document_service.list_document_inbox(
        session,
        organization_id=current_user.organization_id,
        recipient_employee_id=current_user.employee_id,
        recipient_user_id=current_user.user_id,
    )


@router.get("/overdue", response_model=list[DocumentOverdueItem])
async def list_document_overdue(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[DocumentOverdueItem]:
    return await document_service.list_document_overdue(
        session, organization_id=current_user.organization_id, limit=limit
    )


@router.get("/processing-queue", response_model=list[DocumentProcessingQueueItem])
async def list_document_processing_queue(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: Annotated[int, Query(ge=1, le=500)] = 100,
) -> list[DocumentProcessingQueueItem]:
    return await document_service.list_document_processing_queue(
        session, organization_id=current_user.organization_id, limit=limit
    )


@router.get("/requirements", response_model=list[DocumentRequirementItem])
async def list_document_requirements(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    scope: str | None = None,
    document_type_code: str | None = Query(None, alias="documentTypeCode"),
    contract_type: str | None = Query(None, alias="contractType"),
) -> list[DocumentRequirementItem]:
    return await document_service.list_document_requirements(
        session,
        organization_id=current_user.organization_id,
        scope=scope,
        document_type_code=document_type_code,
        contract_type=contract_type,
    )


@router.get("/analytics", response_model=DocumentAnalyticsReport)
async def get_document_analytics(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:view", "documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DocumentAnalyticsReport:
    return await document_service.compute_document_analytics(
        session, organization_id=current_user.organization_id
    )


@router.post("/archive-run", response_model=DocumentArchiveRunResult)
async def run_document_archive(
    body: DocumentArchiveRunRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentArchiveRunResult:
    """Lance (ou simule en `dry_run`) une campagne d'archivage."""
    return await document_service.run_document_archive(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


@router.post("/purge-archives", response_model=DocumentArchivePurgeResult)
async def purge_document_archives(
    body: DocumentArchivePurgeRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["documents:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DocumentArchivePurgeResult:
    """Purge (ou simule) les archives plus vieilles que `retention_days`."""
    return await document_service.purge_document_archives(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
