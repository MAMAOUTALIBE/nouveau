"""Tables documents — schéma `hr` v1 (001_init) + v2 (002_unified_documents).

Alignement strict avec :
    Final/db/postgresql/001_init_rh_schema.sql
        (documents, document_versions, document_dispatches)
    Final/db/postgresql/002_unified_documents.sql
        (extension documents + 7 tables unifiées)

Tables modélisées :
    - documents (étendue par 002 : document_type_id, confidentiality_level,
      legal_hold, source_module, etc.)
    - document_versions
    - document_dispatches
    - document_types
    - document_links
    - document_requirements (référentiel exigences par scope)
    - document_analysis_runs (pipeline OCR/IA)
    - document_extracted_fields (résultats extraction typés)
    - document_retention_rules
    - document_retention_events
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column

# ============================================================================
# 002 — document_types (référentiel)
# ============================================================================


class DocumentType(Base, TimestampMixin):
    __tablename__ = "document_types"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="document_types_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    document_type_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    module_scope: Mapped[str] = mapped_column(
        String, nullable=False, default="GLOBAL", server_default="GLOBAL"
    )
    owner_entity_type: Mapped[str] = mapped_column(
        String, nullable=False, default="GENERIC", server_default="GENERIC"
    )
    requires_expiry: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    requires_signature: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    requires_dispatch: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    is_sensitive: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    default_validity_days: Mapped[int | None] = mapped_column(Integer)
    retention_days: Mapped[int | None] = mapped_column(Integer)
    allowed_mime_types: Mapped[list[str]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
    document_type_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )


# ============================================================================
# 001 — documents (étendue par 002)
# ============================================================================


class Document(Base, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint(
            "document_status in ('DRAFT','IN_VALIDATION','VALIDATED','PUBLISHED','ARCHIVED')",
            name="documents_status_check",
        ),
        CheckConstraint("current_version_no > 0", name="documents_version_check"),
        UniqueConstraint("organization_id", "reference", name="documents_ref_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    document_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    document_type: Mapped[str] = mapped_column(String, nullable=False)
    document_type_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_types.document_type_id"),
    )
    owner_label: Mapped[str | None] = mapped_column(String)
    document_status: Mapped[str] = mapped_column(
        String, nullable=False, default="DRAFT", server_default="DRAFT"
    )
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    issued_on: Mapped[date | None] = mapped_column(Date)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    expires_on: Mapped[date | None] = mapped_column(Date)
    approver_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    mission_destination: Mapped[str | None] = mapped_column(String)
    mission_purpose: Mapped[str | None] = mapped_column(String)
    absence_reason: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    current_version_no: Mapped[int] = mapped_column(
        Integer, nullable=False, default=1, server_default="1"
    )
    # Extensions 002
    source_module: Mapped[str] = mapped_column(
        String, nullable=False, default="DOCUMENTS", server_default="DOCUMENTS"
    )
    source_record_id: Mapped[str | None] = mapped_column(String)
    confidentiality_level: Mapped[str] = mapped_column(
        String, nullable=False, default="INTERNAL", server_default="INTERNAL"
    )
    requires_acknowledgement: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    archived_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    legal_hold: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    analysis_status: Mapped[str] = mapped_column(
        String, nullable=False, default="NOT_REQUESTED", server_default="NOT_REQUESTED"
    )
    last_analysis_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    document_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )


class DocumentVersion(Base):
    __tablename__ = "document_versions"
    __table_args__ = (
        CheckConstraint("version_no > 0", name="document_versions_no_check"),
        UniqueConstraint("document_id", "version_no", name="document_versions_unique_no"),
        UniqueConstraint("verification_code", name="document_versions_verif_unique"),
        {"schema": DEFAULT_SCHEMA},
    )

    document_version_id: Mapped[UUID] = uuid_pk_column()
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    file_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.file_objects.file_id"),
        nullable=False,
    )
    signed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    signed_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    stamp_label: Mapped[str | None] = mapped_column(String)
    signature_hash: Mapped[str | None] = mapped_column(String)
    verification_code: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class DocumentDispatch(Base):
    __tablename__ = "document_dispatches"
    __table_args__ = (
        CheckConstraint(
            "delivery_status in ('ASSIGNED','READ','ACKNOWLEDGED','REMINDED','CANCELLED')",
            name="document_dispatches_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_dispatch_id: Mapped[UUID] = uuid_pk_column()
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    recipient_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    recipient_employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )
    assigned_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    delivery_status: Mapped[str] = mapped_column(
        String, nullable=False, default="ASSIGNED", server_default="ASSIGNED"
    )
    assigned_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    due_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    reminder_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    reminder_sent_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    read_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    acknowledged_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    note: Mapped[str | None] = mapped_column(String)


# ============================================================================
# 002 — document_links (liaisons document ↔ entité)
# ============================================================================


class DocumentLink(Base):
    __tablename__ = "document_links"
    __table_args__ = (
        CheckConstraint(
            "entity_type in ('EMPLOYEE','ASSIGNMENT','MOVEMENT','LEAVE_REQUEST',"
            "'DISCIPLINE_CASE','WORKFLOW_INSTANCE','RECRUITMENT_APPLICATION',"
            "'DOCUMENT_REQUEST','GENERIC')",
            name="document_links_entity_check",
        ),
        CheckConstraint(
            "link_role in ('PRIMARY','SECONDARY','SOURCE','OUTPUT','ATTACHMENT','EVIDENCE')",
            name="document_links_role_check",
        ),
        UniqueConstraint(
            "document_id",
            "entity_type",
            "entity_id",
            "link_role",
            name="document_links_unique_link",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_link_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    entity_type: Mapped[str] = mapped_column(String, nullable=False)
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    link_role: Mapped[str] = mapped_column(
        String, nullable=False, default="PRIMARY", server_default="PRIMARY"
    )
    created_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


# ============================================================================
# 002 — document_requirements (référentiel exigences par scope)
# ============================================================================


class DocumentRequirement(Base, TimestampMixin):
    __tablename__ = "document_requirements"
    __table_args__ = (
        CheckConstraint(
            "requirement_scope in ('GLOBAL','CONTRACT_TYPE','DIRECTION','UNIT',"
            "'POSITION','EMPLOYMENT_STATUS','WORKFLOW')",
            name="document_requirements_scope_check",
        ),
        UniqueConstraint(
            "organization_id",
            "requirement_code",
            name="document_requirements_code_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_requirement_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    requirement_code: Mapped[str] = mapped_column(String, nullable=False)
    document_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_types.document_type_id"),
        nullable=False,
    )
    requirement_scope: Mapped[str] = mapped_column(String, nullable=False)
    contract_type: Mapped[str | None] = mapped_column(String)
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    position_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.positions.position_id"),
    )
    employment_status: Mapped[str | None] = mapped_column(String)
    workflow_definition_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.workflow_definitions.workflow_definition_id",
            ondelete="CASCADE",
        ),
    )
    is_mandatory: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    warning_offset_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=30, server_default="30"
    )
    due_offset_days: Mapped[int | None] = mapped_column(Integer)
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_to: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    requirement_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )


# ============================================================================
# 002 — document_analysis_runs (pipeline OCR/IA)
# ============================================================================


class DocumentAnalysisRun(Base, TimestampMixin):
    __tablename__ = "document_analysis_runs"
    __table_args__ = (
        CheckConstraint(
            "pipeline_stage in ('OCR','CLASSIFICATION','EXTRACTION','COMPLIANCE','FULL')",
            name="document_analysis_runs_stage_check",
        ),
        CheckConstraint(
            "analysis_status in ('PENDING','RUNNING','COMPLETED','FAILED',"
            "'REVIEW_REQUIRED','SKIPPED')",
            name="document_analysis_runs_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_analysis_run_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    document_version_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_versions.document_version_id"),
    )
    pipeline_stage: Mapped[str] = mapped_column(
        String, nullable=False, default="FULL", server_default="FULL"
    )
    analysis_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", server_default="PENDING"
    )
    provider_name: Mapped[str | None] = mapped_column(String)
    model_name: Mapped[str | None] = mapped_column(String)
    language_code: Mapped[str | None] = mapped_column(String)
    classified_document_type: Mapped[str | None] = mapped_column(String)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    ocr_text: Mapped[str | None] = mapped_column(String)
    summary_text: Mapped[str | None] = mapped_column(String)
    error_code: Mapped[str | None] = mapped_column(String)
    error_message: Mapped[str | None] = mapped_column(String)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    started_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    created_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )


# ============================================================================
# 002 — document_extracted_fields (résultats extraction typés)
# ============================================================================


class DocumentExtractedField(Base, TimestampMixin):
    __tablename__ = "document_extracted_fields"
    __table_args__ = (
        CheckConstraint(
            "field_type in ('TEXT','DATE','NUMBER','BOOLEAN','JSON')",
            name="document_extracted_fields_type_check",
        ),
        UniqueConstraint(
            "document_analysis_run_id",
            "field_name",
            name="document_extracted_fields_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_extracted_field_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    document_analysis_run_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.document_analysis_runs.document_analysis_run_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    field_name: Mapped[str] = mapped_column(String, nullable=False)
    field_label: Mapped[str | None] = mapped_column(String)
    field_type: Mapped[str] = mapped_column(
        String, nullable=False, default="TEXT", server_default="TEXT"
    )
    field_value_text: Mapped[str | None] = mapped_column(String)
    field_value_date: Mapped[date | None] = mapped_column(Date)
    field_value_number: Mapped[Decimal | None] = mapped_column(Numeric(18, 4))
    field_value_boolean: Mapped[bool | None] = mapped_column(Boolean)
    field_value_json: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    normalized_value: Mapped[str | None] = mapped_column(String)
    confidence_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    source_page: Mapped[int | None] = mapped_column(Integer)
    source_bbox: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    is_validated: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    validated_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    validated_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    field_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )


# ============================================================================
# 002 — document_retention_rules + events
# ============================================================================


class DocumentRetentionRule(Base, TimestampMixin):
    __tablename__ = "document_retention_rules"
    __table_args__ = (
        CheckConstraint(
            "owner_entity_type in ('GENERIC','EMPLOYEE','ASSIGNMENT','MOVEMENT',"
            "'LEAVE_REQUEST','DISCIPLINE_CASE','WORKFLOW_INSTANCE','RECRUITMENT_APPLICATION')",
            name="document_retention_rules_owner_check",
        ),
        CheckConstraint(
            "retention_trigger in ('ISSUED_ON','END_DATE','UPDATED_AT',"
            "'ACKNOWLEDGED_AT','EMPLOYEE_EXIT','WORKFLOW_COMPLETED_AT')",
            name="document_retention_rules_trigger_check",
        ),
        UniqueConstraint("organization_id", "rule_code", name="document_retention_rules_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    document_retention_rule_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    rule_code: Mapped[str] = mapped_column(String, nullable=False)
    document_type_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_types.document_type_id", ondelete="CASCADE"),
    )
    owner_entity_type: Mapped[str] = mapped_column(
        String, nullable=False, default="GENERIC", server_default="GENERIC"
    )
    retention_trigger: Mapped[str] = mapped_column(String, nullable=False)
    archive_after_days: Mapped[int | None] = mapped_column(Integer)
    purge_after_days: Mapped[int | None] = mapped_column(Integer)
    requires_acknowledgement: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    legal_hold_supported: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    applies_to_published_only: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    rule_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )


class DocumentRetentionEvent(Base):
    __tablename__ = "document_retention_events"
    __table_args__ = (
        CheckConstraint(
            "event_type in ('RULE_APPLIED','ARCHIVED','RESTORED','LEGAL_HOLD_ENABLED',"
            "'LEGAL_HOLD_RELEASED','PURGE_REQUESTED','PURGED')",
            name="document_retention_events_type_check",
        ),
        CheckConstraint(
            "event_status in ('PENDING','SUCCESS','FAILURE')",
            name="document_retention_events_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    document_retention_event_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.documents.document_id", ondelete="CASCADE"),
        nullable=False,
    )
    document_retention_rule_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.document_retention_rules.document_retention_rule_id"),
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    event_status: Mapped[str] = mapped_column(
        String, nullable=False, default="SUCCESS", server_default="SUCCESS"
    )
    note: Mapped[str | None] = mapped_column(String)
    event_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict, server_default="{}"
    )
    performed_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    occurred_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
