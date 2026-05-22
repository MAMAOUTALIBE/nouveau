"""Service métier — Documents.

Aligné sur le SQL réel `002_unified_documents.sql` :
- DocumentType supporte module_scope / owner_entity_type / requires_*.
- Document supporte confidentiality_level / source_module / legal_hold /
  analysis_status (extensions 002).
- DocumentExtractedField a des valeurs typées (text/date/number/boolean/json)
  exposées via une propriété `value` polymorphe côté DTO.
"""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.security.rbac import AuthenticatedUser
from app.models.document import (
    Document,
    DocumentAnalysisRun,
    DocumentExtractedField,
    DocumentRequest,
    DocumentType,
)
from app.models.employee import Employee
from app.schemas.document import (
    DocumentAnalysisRunResponse,
    DocumentCreateRequest,
    DocumentExtractedFieldResponse,
    DocumentExtractedFieldValidateRequest,
    DocumentRequestCreateRequest,
    DocumentRequestDecisionRequest,
    DocumentRequestResponse,
    DocumentResponse,
    DocumentTypeCreateRequest,
    DocumentTypeResponse,
    DocumentUpdateStatusRequest,
)


# ============================================================================
# Helpers
# ============================================================================
def _doc_type_to_dto(dt: DocumentType) -> DocumentTypeResponse:
    return DocumentTypeResponse(
        document_type_id=dt.document_type_id,
        code=dt.code,
        label=dt.label,
        module_scope=dt.module_scope,
        owner_entity_type=dt.owner_entity_type,
        requires_expiry=dt.requires_expiry,
        requires_signature=dt.requires_signature,
        requires_dispatch=dt.requires_dispatch,
        is_sensitive=dt.is_sensitive,
        is_active=dt.is_active,
        default_validity_days=dt.default_validity_days,
        retention_days=dt.retention_days,
        allowed_mime_types=list(dt.allowed_mime_types or []),
    )


_DOCUMENT_STATUS_LABELS: dict[str, str] = {
    "DRAFT": "Brouillon",
    "IN_VALIDATION": "En validation",
    "VALIDATED": "Validé",
    "PUBLISHED": "Publié",
    "ARCHIVED": "Archivé",
}


def _doc_to_dto(
    doc: Document,
    *,
    type_label: str | None = None,
    owner_name: str | None = None,
) -> DocumentResponse:
    return DocumentResponse(
        document_id=doc.document_id,
        organization_id=doc.organization_id,
        employee_id=doc.employee_id,
        reference=doc.reference,
        title=doc.title,
        document_type=doc.document_type,
        type=type_label or doc.document_type,
        owner=owner_name or doc.owner_label or "—",
        status=_DOCUMENT_STATUS_LABELS.get(doc.document_status, doc.document_status),
        document_type_id=doc.document_type_id,
        document_status=doc.document_status,
        direction_id=doc.direction_id,
        unit_id=doc.unit_id,
        issued_on=doc.issued_on,
        start_date=doc.start_date,
        end_date=doc.end_date,
        expires_on=doc.expires_on,
        current_version_no=doc.current_version_no,
        notes=doc.notes,
        source_module=doc.source_module,
        source_record_id=doc.source_record_id,
        confidentiality_level=doc.confidentiality_level,
        requires_acknowledgement=doc.requires_acknowledgement,
        archived_at=doc.archived_at,
        legal_hold=doc.legal_hold,
        analysis_status=doc.analysis_status,
        last_analysis_at=doc.last_analysis_at,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _extract_value(field: DocumentExtractedField) -> str | None | Decimal | bool | dict[str, Any]:
    """Renvoie la valeur typée selon `field_type`."""
    match field.field_type:
        case "TEXT":
            return field.field_value_text
        case "DATE":
            return field.field_value_date.isoformat() if field.field_value_date else None
        case "NUMBER":
            return field.field_value_number
        case "BOOLEAN":
            return field.field_value_boolean
        case "JSON":
            return field.field_value_json
        case _:
            return field.field_value_text


def _field_to_dto(field: DocumentExtractedField) -> DocumentExtractedFieldResponse:
    return DocumentExtractedFieldResponse(
        document_extracted_field_id=field.document_extracted_field_id,
        document_analysis_run_id=field.document_analysis_run_id,
        document_id=field.document_id,
        field_name=field.field_name,
        field_label=field.field_label,
        field_type=field.field_type,
        value=_extract_value(field),
        normalized_value=field.normalized_value,
        confidence_score=field.confidence_score,
        source_page=field.source_page,
        is_validated=field.is_validated,
        validated_by_user_id=field.validated_by_user_id,
        validated_at=field.validated_at,
    )


# ============================================================================
# Document types
# ============================================================================
async def list_document_types(
    session: AsyncSession,
    *,
    organization_id: UUID,
    module_scope: str | None = None,
    only_active: bool = True,
) -> list[DocumentTypeResponse]:
    base = select(DocumentType).where(DocumentType.organization_id == organization_id)
    if module_scope:
        base = base.where(DocumentType.module_scope == module_scope)
    if only_active:
        base = base.where(DocumentType.is_active.is_(True))
    rows = (await session.execute(base.order_by(DocumentType.code))).scalars().all()
    return [_doc_type_to_dto(dt) for dt in rows]


async def create_document_type(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: DocumentTypeCreateRequest,
    audit: AuditWriter,
) -> DocumentTypeResponse:
    existing = (
        await session.execute(
            select(DocumentType).where(
                DocumentType.organization_id == organization_id,
                DocumentType.code == body.code,
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError(
            f"Code de type de document '{body.code}' déjà utilisé.",
            code="DOCUMENT_TYPE_CODE_TAKEN",
        )

    dt = DocumentType(
        organization_id=organization_id,
        code=body.code,
        label=body.label,
        module_scope=body.module_scope,
        owner_entity_type=body.owner_entity_type,
        requires_expiry=body.requires_expiry,
        requires_signature=body.requires_signature,
        requires_dispatch=body.requires_dispatch,
        is_sensitive=body.is_sensitive,
        is_active=True,
        default_validity_days=body.default_validity_days,
        retention_days=body.retention_days,
        allowed_mime_types=body.allowed_mime_types,
    )
    session.add(dt)
    await session.flush([dt])
    await audit.record(
        action="DOCUMENT_TYPE_CREATED",
        target_type="document_type",
        target_id=str(dt.document_type_id),
        after={
            "code": body.code,
            "module_scope": body.module_scope,
            "is_sensitive": body.is_sensitive,
        },
    )
    return _doc_type_to_dto(dt)


# ============================================================================
# Documents (library)
# ============================================================================
async def list_documents(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    document_type: str | None = None,
    document_status: str | None = None,
    employee_id: UUID | None = None,
    confidentiality_level: str | None = None,
    search: str | None = None,
    user: AuthenticatedUser | None = None,
) -> tuple[list[DocumentResponse], int]:
    base = select(Document).where(Document.organization_id == organization_id)

    if document_type:
        base = base.where(Document.document_type == document_type)
    if document_status:
        base = base.where(Document.document_status == document_status)
    if employee_id:
        base = base.where(Document.employee_id == employee_id)
    if confidentiality_level:
        base = base.where(Document.confidentiality_level == confidentiality_level)
    if search:
        like = f"%{search}%"
        base = base.where(Document.title.ilike(like) | Document.reference.ilike(like))

    # Restriction de scope (manager↔direction). Documents sans direction
    # restent visibles à tout le périmètre (cohérent avec scope vide = global).
    if user is not None and not user.has_scope("GLOBAL"):
        if user.has_scope("DIRECTION") and user.direction_id is not None:
            base = base.where(
                (Document.direction_id == user.direction_id) | (Document.direction_id.is_(None))
            )
        elif user.has_scope("UNIT") and user.unit_id is not None:
            base = base.where((Document.unit_id == user.unit_id) | (Document.unit_id.is_(None)))

    # Confidentiality : un user sans `documents:view:sensitive` ne voit pas
    # les documents CONFIDENTIAL ni STRICTLY_CONFIDENTIAL.
    if user is not None and not user.has_permission("documents:view:sensitive"):
        base = base.where(Document.confidentiality_level.in_(["PUBLIC", "INTERNAL"]))

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    page_stmt = (
        base.order_by(Document.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    rows = (await session.execute(page_stmt)).scalars().all()

    employee_ids = {d.employee_id for d in rows if d.employee_id is not None}
    type_ids = {d.document_type_id for d in rows if d.document_type_id is not None}

    employee_names: dict[UUID, str] = {}
    if employee_ids:
        employee_names = {
            eid: name
            for eid, name in (
                await session.execute(
                    select(Employee.employee_id, Employee.full_name).where(
                        Employee.employee_id.in_(employee_ids)
                    )
                )
            ).all()
        }
    type_labels: dict[UUID, str] = {}
    if type_ids:
        type_labels = {
            tid: label
            for tid, label in (
                await session.execute(
                    select(DocumentType.document_type_id, DocumentType.label).where(
                        DocumentType.document_type_id.in_(type_ids)
                    )
                )
            ).all()
        }

    items = [
        _doc_to_dto(
            d,
            type_label=type_labels.get(d.document_type_id) if d.document_type_id else None,
            owner_name=employee_names.get(d.employee_id) if d.employee_id else None,
        )
        for d in rows
    ]
    return items, int(total)


async def _next_reference(session: AsyncSession, organization_id: UUID, document_type: str) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"DOC-{document_type.upper()[:8]}-{year}-"
    count_stmt = (
        select(func.count())
        .select_from(Document)
        .where(
            Document.organization_id == organization_id,
            Document.reference.startswith(prefix),
        )
    )
    count = (await session.execute(count_stmt)).scalar_one()
    return f"{prefix}{int(count) + 1:04d}"


async def create_document(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: DocumentCreateRequest,
    audit: AuditWriter,
) -> DocumentResponse:
    reference = await _next_reference(session, organization_id, body.document_type)

    doc = Document(
        organization_id=organization_id,
        employee_id=body.employee_id,
        reference=reference,
        title=body.title,
        document_type=body.document_type,
        document_type_id=body.document_type_id,
        document_status="DRAFT",
        direction_id=body.direction_id,
        unit_id=body.unit_id,
        issued_on=body.issued_on,
        start_date=body.start_date,
        end_date=body.end_date,
        expires_on=body.expires_on,
        notes=body.notes,
        source_module=body.source_module,
        source_record_id=body.source_record_id,
        confidentiality_level=body.confidentiality_level,
        requires_acknowledgement=body.requires_acknowledgement,
    )
    session.add(doc)
    await session.flush([doc])

    await audit.record(
        action="DOCUMENT_CREATED",
        target_type="document",
        target_id=str(doc.document_id),
        after={
            "reference": reference,
            "title": body.title,
            "document_type": body.document_type,
            "confidentiality_level": body.confidentiality_level,
            "employee_id": str(body.employee_id) if body.employee_id else None,
        },
    )
    return _doc_to_dto(doc)


async def _load_document(session: AsyncSession, document_id: UUID) -> Document:
    doc = (
        await session.execute(select(Document).where(Document.document_id == document_id))
    ).scalar_one_or_none()
    if doc is None:
        raise NotFoundError("Document introuvable.", code="DOCUMENT_NOT_FOUND")
    return doc


async def get_document(session: AsyncSession, document_id: UUID) -> DocumentResponse:
    return _doc_to_dto(await _load_document(session, document_id))


async def update_document_status(
    session: AsyncSession,
    *,
    document_id: UUID,
    body: DocumentUpdateStatusRequest,
    audit: AuditWriter,
) -> DocumentResponse:
    doc = await _load_document(session, document_id)
    before = {"document_status": doc.document_status, "notes": doc.notes}

    valid_next = {
        "DRAFT": {"IN_VALIDATION", "ARCHIVED"},
        "IN_VALIDATION": {"VALIDATED", "DRAFT", "ARCHIVED"},
        "VALIDATED": {"PUBLISHED", "ARCHIVED"},
        "PUBLISHED": {"ARCHIVED"},
        "ARCHIVED": set(),
    }
    if body.document_status not in valid_next.get(doc.document_status, set()):
        raise ConflictError(
            f"Transition de statut invalide : {doc.document_status} → {body.document_status}",
            code="INVALID_STATUS_TRANSITION",
        )

    doc.document_status = body.document_status
    if body.document_status == "ARCHIVED":
        doc.archived_at = datetime.now(tz=UTC)
    if body.notes is not None:
        doc.notes = body.notes

    await audit.record(
        action="DOCUMENT_STATUS_CHANGED",
        target_type="document",
        target_id=str(doc.document_id),
        before=before,
        after={"document_status": doc.document_status, "notes": doc.notes},
    )
    return _doc_to_dto(doc)


# ============================================================================
# Analysis runs + extracted fields (lecture seule en V1 ; le worker OCR vague 4 écrit)
# ============================================================================
async def list_analysis_runs(
    session: AsyncSession, *, document_id: UUID
) -> list[DocumentAnalysisRunResponse]:
    stmt = (
        select(DocumentAnalysisRun)
        .where(DocumentAnalysisRun.document_id == document_id)
        .order_by(DocumentAnalysisRun.created_at.desc())
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [DocumentAnalysisRunResponse.model_validate(r) for r in rows]


async def list_extracted_fields(
    session: AsyncSession, *, document_analysis_run_id: UUID
) -> list[DocumentExtractedFieldResponse]:
    stmt = (
        select(DocumentExtractedField)
        .where(DocumentExtractedField.document_analysis_run_id == document_analysis_run_id)
        .order_by(DocumentExtractedField.field_name)
    )
    rows = (await session.execute(stmt)).scalars().all()
    return [_field_to_dto(f) for f in rows]


async def validate_extracted_field(
    session: AsyncSession,
    *,
    field_id: UUID,
    body: DocumentExtractedFieldValidateRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> DocumentExtractedFieldResponse:
    field = (
        await session.execute(
            select(DocumentExtractedField).where(
                DocumentExtractedField.document_extracted_field_id == field_id
            )
        )
    ).scalar_one_or_none()
    if field is None:
        raise NotFoundError("Champ extrait introuvable.", code="FIELD_NOT_FOUND")

    before = {
        "field_value_text": field.field_value_text,
        "field_value_date": (
            field.field_value_date.isoformat() if field.field_value_date else None
        ),
        "field_value_number": (str(field.field_value_number) if field.field_value_number else None),
        "field_value_boolean": field.field_value_boolean,
        "normalized_value": field.normalized_value,
        "is_validated": field.is_validated,
    }

    # Cohérence type ↔ valeur fournie
    if body.value_text is not None and field.field_type != "TEXT":
        raise ValidationError(
            f"Champ {field.field_name}: type {field.field_type}, value_text invalide.",
            code="FIELD_TYPE_MISMATCH",
        )
    if body.value_date is not None and field.field_type != "DATE":
        raise ValidationError(
            f"Champ {field.field_name}: type {field.field_type}, value_date invalide.",
            code="FIELD_TYPE_MISMATCH",
        )
    if body.value_number is not None and field.field_type != "NUMBER":
        raise ValidationError(
            f"Champ {field.field_name}: type {field.field_type}, value_number invalide.",
            code="FIELD_TYPE_MISMATCH",
        )
    if body.value_boolean is not None and field.field_type != "BOOLEAN":
        raise ValidationError(
            f"Champ {field.field_name}: type {field.field_type}, value_boolean invalide.",
            code="FIELD_TYPE_MISMATCH",
        )
    if body.value_json is not None and field.field_type != "JSON":
        raise ValidationError(
            f"Champ {field.field_name}: type {field.field_type}, value_json invalide.",
            code="FIELD_TYPE_MISMATCH",
        )

    if body.value_text is not None:
        field.field_value_text = body.value_text
    if body.value_date is not None:
        field.field_value_date = body.value_date
    if body.value_number is not None:
        field.field_value_number = body.value_number
    if body.value_boolean is not None:
        field.field_value_boolean = body.value_boolean
    if body.value_json is not None:
        field.field_value_json = body.value_json
    if body.normalized_value is not None:
        field.normalized_value = body.normalized_value

    field.is_validated = body.is_validated
    if body.is_validated:
        field.validated_by_user_id = actor_user_id
        field.validated_at = datetime.now(tz=UTC)

    await audit.record(
        action="OCR_FIELD_VALIDATED",
        target_type="document_extracted_field",
        target_id=str(field.document_extracted_field_id),
        before=before,
        after={
            "field_value_text": field.field_value_text,
            "is_validated": field.is_validated,
        },
    )
    return _field_to_dto(field)


# ============================================================================
# Demandes de documents administratifs (Portail manager / Portail agent)
# ============================================================================
# Libellés alignés sur le vocabulaire du frontend (Portail manager) :
# 'Soumise' / 'Validee' / 'Rejetee' — sans accent, filtrage exact.
_DOCUMENT_REQUEST_STATUS_LABELS: dict[str, str] = {
    "PENDING": "Soumise",
    "APPROVED": "Validee",
    "REJECTED": "Rejetee",
    "CANCELLED": "Annulee",
}


def _request_to_dto(
    r: DocumentRequest, *, requester_name: str = "—"
) -> DocumentRequestResponse:
    dto = DocumentRequestResponse.model_validate(r)
    dto.document_type = r.document_type_label
    dto.requester_name = requester_name
    dto.requester_username = ""
    dto.status = _DOCUMENT_REQUEST_STATUS_LABELS.get(
        r.request_status, r.request_status
    )
    return dto


async def list_requests(
    session: AsyncSession,
    *,
    organization_id: UUID,
    request_status: str | None = None,
    employee_id: UUID | None = None,
) -> list[DocumentRequestResponse]:
    base = select(DocumentRequest).where(
        DocumentRequest.organization_id == organization_id
    )
    if request_status:
        base = base.where(DocumentRequest.request_status == request_status)
    if employee_id:
        base = base.where(DocumentRequest.requested_by_employee_id == employee_id)
    rows = (
        await session.execute(base.order_by(DocumentRequest.created_at.desc()))
    ).scalars().all()

    employee_ids = {
        r.requested_by_employee_id
        for r in rows
        if r.requested_by_employee_id is not None
    }
    employee_names: dict[UUID, str] = {}
    if employee_ids:
        employee_names = {
            emp_id: full_name
            for emp_id, full_name in (
                await session.execute(
                    select(Employee.employee_id, Employee.full_name).where(
                        Employee.employee_id.in_(employee_ids)
                    )
                )
            ).all()
        }

    return [
        _request_to_dto(
            r,
            requester_name=employee_names.get(r.requested_by_employee_id, "—")
            if r.requested_by_employee_id is not None
            else "—",
        )
        for r in rows
    ]


async def _next_request_reference(
    session: AsyncSession, organization_id: UUID
) -> str:
    year = datetime.now(tz=UTC).year
    prefix = f"DEM-DOC-{year}-"
    count = (
        await session.execute(
            select(func.count())
            .select_from(DocumentRequest)
            .where(
                DocumentRequest.organization_id == organization_id,
                DocumentRequest.reference.startswith(prefix),
            )
        )
    ).scalar_one()
    return f"{prefix}{int(count) + 1:05d}"


async def create_request(
    session: AsyncSession,
    *,
    organization_id: UUID,
    requested_by_employee_id: UUID | None,
    body: DocumentRequestCreateRequest,
    audit: AuditWriter,
) -> DocumentRequestResponse:
    employee_id = body.requested_by_employee_id or requested_by_employee_id
    reference = await _next_request_reference(session, organization_id)
    r = DocumentRequest(
        organization_id=organization_id,
        reference=reference,
        requested_by_employee_id=employee_id,
        document_type_label=body.document_type.strip(),
        purpose=body.purpose.strip(),
        needed_by=body.needed_by,
        request_status="PENDING",
    )
    session.add(r)
    await session.flush([r])
    await audit.record(
        action="DOCUMENT_REQUEST_CREATED",
        target_type="document_request",
        target_id=str(r.document_request_id),
        after={
            "reference": reference,
            "document_type_label": r.document_type_label,
        },
    )
    requester_name = "—"
    if employee_id is not None:
        requester_name = (
            await session.execute(
                select(Employee.full_name).where(
                    Employee.employee_id == employee_id
                )
            )
        ).scalar_one_or_none() or "—"
    return _request_to_dto(r, requester_name=requester_name)


async def _find_request_by_key(
    session: AsyncSession, request_key: str
) -> DocumentRequest | None:
    """Résout une demande de document par UUID ou par référence métier."""
    key = str(request_key or "").strip()
    if not key:
        return None
    try:
        request_uuid: UUID | None = UUID(key)
    except (ValueError, TypeError):
        request_uuid = None
    if request_uuid is not None:
        row = (
            await session.execute(
                select(DocumentRequest).where(
                    DocumentRequest.document_request_id == request_uuid
                )
            )
        ).scalar_one_or_none()
        if row is not None:
            return row
    return (
        await session.execute(
            select(DocumentRequest).where(DocumentRequest.reference == key)
        )
    ).scalar_one_or_none()


async def decide_request(
    session: AsyncSession,
    *,
    request_key: str,
    body: DocumentRequestDecisionRequest,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> DocumentRequestResponse:
    r = await _find_request_by_key(session, request_key)
    if r is None:
        raise NotFoundError("Demande introuvable.", code="DOCUMENT_REQUEST_NOT_FOUND")
    if r.request_status != "PENDING":
        raise ConflictError(
            f"Demande déjà {r.request_status}.",
            code="DOCUMENT_REQUEST_ALREADY_DECIDED",
        )
    before = {"request_status": r.request_status}
    r.request_status = body.decision
    r.decided_by_user_id = actor_user_id
    r.decided_at = datetime.now(tz=UTC)
    r.decision_comment = body.comment
    await audit.record(
        action=f"DOCUMENT_REQUEST_{body.decision}",
        target_type="document_request",
        target_id=str(r.document_request_id),
        before=before,
        after={
            "request_status": body.decision,
            "decision_comment": body.comment,
        },
    )
    requester_name = "—"
    if r.requested_by_employee_id is not None:
        requester_name = (
            await session.execute(
                select(Employee.full_name).where(
                    Employee.employee_id == r.requested_by_employee_id
                )
            )
        ).scalar_one_or_none() or "—"
    return _request_to_dto(r, requester_name=requester_name)
