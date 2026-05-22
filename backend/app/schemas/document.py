"""Schémas Pydantic pour le domaine Documents (alignés sur le SQL réel)."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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
