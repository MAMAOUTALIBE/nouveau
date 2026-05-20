"""Tables `hr.workflow_*`."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class WorkflowDefinition(Base, TimestampMixin):
    __tablename__ = "workflow_definitions"
    __table_args__ = (
        CheckConstraint(
            "status in ('ACTIVE','INACTIVE','ARCHIVED')",
            name="workflow_definitions_status_check",
        ),
        UniqueConstraint(
            "organization_id",
            "code",
            "version_no",
            name="workflow_definitions_unique_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    workflow_definition_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    module_name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="ACTIVE", server_default="ACTIVE"
    )
    sla_target_hours: Mapped[int | None] = mapped_column(Integer)
    auto_escalation: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    __table_args__ = (
        UniqueConstraint(
            "workflow_definition_id",
            "step_order",
            name="workflow_steps_unique_order",
        ),
        UniqueConstraint(
            "workflow_definition_id",
            "code",
            name="workflow_steps_unique_code",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    workflow_step_id: Mapped[UUID] = uuid_pk_column()
    workflow_definition_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.workflow_definitions.workflow_definition_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    code: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    approver_role_code: Mapped[str | None] = mapped_column(String)
    sla_hours: Mapped[int | None] = mapped_column(Integer)


class WorkflowInstance(Base, TimestampMixin):
    __tablename__ = "workflow_instances"
    __table_args__ = (
        CheckConstraint(
            "instance_status in ('PENDING','IN_PROGRESS','APPROVED','REJECTED',"
            "'CANCELLED','ESCALATED')",
            name="workflow_instances_status_check",
        ),
        CheckConstraint(
            "priority in ('LOW','NORMAL','HIGH','CRITICAL')",
            name="workflow_instances_priority_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="workflow_instances_ref_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    workflow_instance_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    workflow_definition_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.workflow_definitions.workflow_definition_id"),
        nullable=False,
    )
    requester_employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )
    requester_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    owner_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    current_step_order: Mapped[int | None] = mapped_column(Integer)
    instance_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", server_default="PENDING"
    )
    priority: Mapped[str] = mapped_column(
        String, nullable=False, default="NORMAL", server_default="NORMAL"
    )
    due_on: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    steps_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    steps_completed: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    escalation_level: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    instance_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class WorkflowInstanceEvent(Base):
    __tablename__ = "workflow_instance_events"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    workflow_instance_event_id: Mapped[UUID] = uuid_pk_column()
    workflow_instance_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.workflow_instances.workflow_instance_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    actor_label: Mapped[str | None] = mapped_column(String)
    note: Mapped[str | None] = mapped_column(String)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    occurred_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
