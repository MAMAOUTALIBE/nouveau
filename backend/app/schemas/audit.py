"""Schémas Pydantic des endpoints d'audit."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    audit_log_id: UUID
    organization_id: UUID
    user_id: UUID | None
    action: str
    target_type: str | None
    target_id: str | None
    status: str
    source_ip: str | None
    user_agent: str | None
    before_data: dict[str, Any] | None = None
    after_data: dict[str, Any] | None = None
    audit_metadata: dict[str, Any] = Field(default_factory=dict, alias="metadata")
    occurred_at: datetime


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    page_size: int
