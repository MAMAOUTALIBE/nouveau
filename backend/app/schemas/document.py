"""Schémas Pydantic pour le domaine Documents (alignés sur le SQL réel)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

DocumentStatus = Literal["DRAFT", "IN_VALIDATION", "VALIDATED", "PUBLISHED", "ARCHIVED"]
ConfidentialityLevel = Literal["PUBLIC", "INTERNAL", "CONFIDENTIAL", "STRICTLY_CONFIDENTIAL"]
SourceModule = Literal[
    "PERSONNEL",
    "DOCUMENTS",
    "LEAVE",
    "DISCIPLINE",
    "WORKFLOW",
    "RECRUITMENT",
    "ADMIN",
    "IMPORT",
]
AnalysisStatus = Literal[
    "NOT_REQUESTED", "PENDING", "RUNNING", "COMPLETED", "FAILED", "REVIEW_REQUIRED"
]
ModuleScope = Literal[
    "GLOBAL",
    "PERSONNEL",
    "DOCUMENTS",
    "LEAVE",
    "DISCIPLINE",
    "WORKFLOW",
    "RECRUITMENT",
    "ADMIN",
]
OwnerEntityType = Literal[
    "GENERIC",
    "EMPLOYEE",
    "ASSIGNMENT",
    "MOVEMENT",
    "LEAVE_REQUEST",
    "DISCIPLINE_CASE",
    "WORKFLOW_INSTANCE",
    "RECRUITMENT_APPLICATION",
]
EntityType = Literal[
    "EMPLOYEE",
    "ASSIGNMENT",
    "MOVEMENT",
    "LEAVE_REQUEST",
    "DISCIPLINE_CASE",
    "WORKFLOW_INSTANCE",
    "RECRUITMENT_APPLICATION",
    "DOCUMENT_REQUEST",
    "GENERIC",
]
LinkRole = Literal["PRIMARY", "SECONDARY", "SOURCE", "OUTPUT", "ATTACHMENT", "EVIDENCE"]
PipelineStage = Literal["OCR", "CLASSIFICATION", "EXTRACTION", "COMPLIANCE", "FULL"]
RunStatus = Literal["PENDING", "RUNNING", "COMPLETED", "FAILED", "REVIEW_REQUIRED", "SKIPPED"]
FieldType = Literal["TEXT", "DATE", "NUMBER", "BOOLEAN", "JSON"]
RequirementScope = Literal[
    "GLOBAL",
    "CONTRACT_TYPE",
    "DIRECTION",
    "UNIT",
    "POSITION",
    "EMPLOYMENT_STATUS",
    "WORKFLOW",
]
RetentionTrigger = Literal[
    "ISSUED_ON",
    "END_DATE",
    "UPDATED_AT",
    "ACKNOWLEDGED_AT",
    "EMPLOYEE_EXIT",
    "WORKFLOW_COMPLETED_AT",
]
RetentionEventType = Literal[
    "RULE_APPLIED",
    "ARCHIVED",
    "RESTORED",
    "LEGAL_HOLD_ENABLED",
    "LEGAL_HOLD_RELEASED",
    "PURGE_REQUESTED",
    "PURGED",
]


# ---------------------------------------------------------------------------
# Document types
# ---------------------------------------------------------------------------
class DocumentTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    document_type_id: UUID
    code: str
    label: str
    module_scope: ModuleScope
    owner_entity_type: OwnerEntityType
    requires_expiry: bool
    requires_signature: bool
    requires_dispatch: bool
    is_sensitive: bool
    is_active: bool
    default_validity_days: int | None = None
    retention_days: int | None = None
    allowed_mime_types: list[str] = Field(default_factory=list)


class DocumentTypeCreateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=64, pattern=r"^[A-Z][A-Z0-9_]*$")
    label: str = Field(..., min_length=2, max_length=255)
    module_scope: ModuleScope = "GLOBAL"
    owner_entity_type: OwnerEntityType = "GENERIC"
    requires_expiry: bool = False
    requires_signature: bool = False
    requires_dispatch: bool = False
    is_sensitive: bool = False
    default_validity_days: int | None = Field(default=None, gt=0)
    retention_days: int | None = Field(default=None, gt=0)
    allowed_mime_types: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    document_id: UUID
    organization_id: UUID
    employee_id: UUID | None
    reference: str
    title: str
    document_type: str
    document_type_id: UUID | None
    document_status: DocumentStatus
    direction_id: UUID | None
    unit_id: UUID | None
    issued_on: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    expires_on: date | None = None
    current_version_no: int
    notes: str | None = None
    source_module: SourceModule
    source_record_id: str | None = None
    confidentiality_level: ConfidentialityLevel
    requires_acknowledgement: bool
    archived_at: datetime | None = None
    legal_hold: bool
    analysis_status: AnalysisStatus
    last_analysis_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    # Libellés enrichis attendus par le frontend (page Bibliothèque).
    type: str | None = None
    owner: str | None = None
    status: str | None = None


class DocumentCreateRequest(BaseModel):
    employee_id: UUID | None = None
    title: str = Field(..., min_length=1, max_length=255)
    document_type: str = Field(..., min_length=2, max_length=64)
    document_type_id: UUID | None = None
    direction_id: UUID | None = None
    unit_id: UUID | None = None
    issued_on: date | None = None
    start_date: date | None = None
    end_date: date | None = None
    expires_on: date | None = None
    notes: str | None = None
    source_module: SourceModule = "DOCUMENTS"
    source_record_id: str | None = None
    confidentiality_level: ConfidentialityLevel = "INTERNAL"
    requires_acknowledgement: bool = False


class DocumentUpdateStatusRequest(BaseModel):
    document_status: DocumentStatus
    notes: str | None = None


# ---------------------------------------------------------------------------
# Analysis runs (OCR pipeline)
# ---------------------------------------------------------------------------
class DocumentAnalysisRunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    document_analysis_run_id: UUID
    organization_id: UUID
    document_id: UUID
    document_version_id: UUID | None
    pipeline_stage: PipelineStage
    analysis_status: RunStatus
    provider_name: str | None
    model_name: str | None
    language_code: str | None
    classified_document_type: str | None
    confidence_score: Decimal | None
    summary_text: str | None
    error_code: str | None
    error_message: str | None
    started_at: datetime | None
    completed_at: datetime | None
    created_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime


class DocumentExtractedFieldResponse(BaseModel):
    """Champ extrait — la valeur typée est exposée dans `value` selon `field_type`."""

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    document_extracted_field_id: UUID
    document_analysis_run_id: UUID
    document_id: UUID
    field_name: str
    field_label: str | None
    field_type: FieldType
    value: str | date | Decimal | bool | dict[str, Any] | None = None
    normalized_value: str | None
    confidence_score: Decimal | None
    source_page: int | None
    is_validated: bool
    validated_by_user_id: UUID | None
    validated_at: datetime | None


class DocumentExtractedFieldValidateRequest(BaseModel):
    """Corrige et valide un champ extrait. La valeur est typée par `field_type`."""

    value_text: str | None = None
    value_date: date | None = None
    value_number: Decimal | None = None
    value_boolean: bool | None = None
    value_json: dict[str, Any] | None = None
    normalized_value: str | None = None
    is_validated: bool = True


# ---------------------------------------------------------------------------
# Demandes de documents administratifs (Portail manager / Portail agent)
# ---------------------------------------------------------------------------
DocumentRequestStatus = Literal["PENDING", "APPROVED", "REJECTED", "CANCELLED"]


class DocumentRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_request_id: UUID
    organization_id: UUID
    reference: str
    requested_by_employee_id: UUID | None
    document_type_label: str
    purpose: str
    needed_by: date | None
    request_status: DocumentRequestStatus
    decided_by_user_id: UUID | None
    decided_at: datetime | None
    decision_comment: str | None
    created_at: datetime
    # Libellés enrichis attendus par le frontend (Portail manager).
    document_type: str | None = None
    requester_name: str | None = None
    requester_username: str | None = None
    status: str | None = None
    decided_by: str | None = None


class DocumentRequestCreateRequest(BaseModel):
    document_type: str = Field(min_length=1, max_length=255)
    purpose: str = Field(min_length=1)
    needed_by: date | None = None
    requested_by_employee_id: UUID | None = None

    @model_validator(mode="before")
    @classmethod
    def _accept_frontend_camel_case(cls, data: Any) -> Any:
        """Tolère le vocabulaire frontend (documentType / neededBy / reason)."""
        if isinstance(data, dict):
            data = dict(data)
            if not data.get("document_type"):
                data["document_type"] = data.get("documentType") or data.get("type")
            if not data.get("purpose"):
                data["purpose"] = data.get("reason")
            if not data.get("needed_by"):
                data["needed_by"] = data.get("neededBy") or data.get("dueDate")
        return data


class DocumentRequestDecisionRequest(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]
    comment: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _accept_frontend_vocabulary(cls, data: Any) -> Any:
        """Tolère le vocabulaire frontend : {action: APPROUVER|REJETER, reason}."""
        if isinstance(data, dict):
            data = dict(data)
            if not data.get("decision") and data.get("action"):
                action = str(data.get("action") or "").strip().upper()
                data["decision"] = (
                    "REJECTED" if action in ("REJETER", "REJECTED", "REJETE") else "APPROVED"
                )
            if not data.get("comment") and data.get("reason"):
                data["comment"] = data.get("reason")
        return data


# ---------------------------------------------------------------------------
# Journal d'audit documentaire (page Documents > Bibliotheque)
# ---------------------------------------------------------------------------
class DocumentAuditLogItem(BaseModel):
    id: str
    reference: str
    action: str
    actor: str
    happened_at: datetime
    status_before: str
    status_after: str
    detail: str
    metadata: dict[str, str]


# ---------------------------------------------------------------------------
# Inbox / file de traitement / en retard
# ---------------------------------------------------------------------------
class DocumentInboxItem(BaseModel):
    reference: str
    title: str
    document_type: str
    sender: str
    delivery_status: str
    assigned_at: datetime
    due_at: datetime | None
    is_read: bool
    is_acknowledged: bool
    requires_acknowledgement: bool
    confidentiality_level: str


class DocumentOverdueItem(BaseModel):
    reference: str
    title: str
    document_type: str
    assigned_employee_name: str
    delivery_status: str
    assigned_at: datetime
    due_at: datetime
    overdue_hours: int
    overdue_days: int


class DocumentProcessingQueueItem(BaseModel):
    analysis_run_id: UUID
    document_reference: str
    document_title: str
    analysis_status: str
    pipeline: str
    started_at: datetime | None
    completed_at: datetime | None


# ---------------------------------------------------------------------------
# Analytics documentaire (page Documents > Bibliotheque, cockpit)
# ---------------------------------------------------------------------------
class DocumentAnalyticsTotals(BaseModel):
    total_documents: int
    signed_documents: int
    assigned_documents: int
    read_documents: int
    acknowledged_documents: int
    pending_acknowledgements: int
    overdue_documents: int
    due_in_next48h: int


class DocumentAnalyticsRates(BaseModel):
    acknowledgement_rate: float
    signature_rate: float


class DocumentAnalyticsSla(BaseModel):
    average_ack_hours: float
    average_read_hours: float


class DocumentAnalyticsBreakdown(BaseModel):
    label: str
    count: int


class DocumentAnalyticsReport(BaseModel):
    generated_at: datetime
    totals: DocumentAnalyticsTotals
    rates: DocumentAnalyticsRates
    sla: DocumentAnalyticsSla
    status_breakdown: list[DocumentAnalyticsBreakdown]
    type_breakdown: list[DocumentAnalyticsBreakdown]
    overdue_preview: list[DocumentOverdueItem]


# ---------------------------------------------------------------------------
# Exigences documentaires (pièces obligatoires) — expose la table
# `hr.document_requirements` au frontend, alignée sur l'interface
# `DocumentRequirement` du frontend.
# ---------------------------------------------------------------------------
class DocumentRequirementItem(BaseModel):
    id: UUID
    requirement_code: str
    document_type_code: str
    document_type_label: str
    requirement_scope: str
    contract_type: str
    is_mandatory: bool = True
    warning_offset_days: int = 0
    due_offset_days: int = 0
    is_active: bool = True


# ---------------------------------------------------------------------------
# Archivage (campagnes d'archivage et purge)
# ---------------------------------------------------------------------------
class DocumentArchiveRunRequest(BaseModel):
    older_than_days: int = Field(default=365, ge=30, le=3650)
    dry_run: bool = True
    only_acknowledged: bool = True
    include_unassigned: bool = False


class DocumentArchiveCandidate(BaseModel):
    reference: str
    title: str
    status: str
    delivery_status: str
    age_days: int
    eligible_from: datetime


class DocumentArchiveRunResult(BaseModel):
    generated_at: datetime
    dry_run: bool
    older_than_days: int
    only_acknowledged: bool
    include_unassigned: bool
    candidates_count: int
    archived_count: int
    candidates: list[DocumentArchiveCandidate]


class DocumentArchivePurgeRequest(BaseModel):
    retention_days: int = Field(default=1825, ge=365, le=7300)
    dry_run: bool = True
    include_notifications: bool = False


class DocumentArchivePurgeResult(BaseModel):
    generated_at: datetime
    dry_run: bool
    retention_days: int
    include_notifications: bool
    candidates_count: int
    purged_documents: int
    references: list[str]
