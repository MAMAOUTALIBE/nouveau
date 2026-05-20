"""Schémas Pydantic pour le domaine Notifications."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

DeliveryStatus = Literal["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"]


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: UUID
    organization_id: UUID
    recipient_user_id: UUID | None
    category: str
    title: str
    message: str
    reference_type: str | None = None
    reference_id: str | None = None
    delivery_status: DeliveryStatus
    attempt_count: int
    max_attempts: int
    scheduled_at: datetime
    sent_at: datetime | None = None
    read_at: datetime | None = None
    created_at: datetime


class NotificationCreateRequest(BaseModel):
    recipient_user_id: UUID | None = None
    category: str = Field(..., min_length=2, max_length=64)
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    reference_type: str | None = None
    reference_id: str | None = None
    scheduled_at: datetime | None = None
    max_attempts: int = Field(default=3, ge=1, le=10)
    metadata: dict[str, Any] = Field(default_factory=dict)
