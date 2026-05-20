"""Tables `hr.leave_types`, `hr.leave_balances`, `hr.leave_requests`."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    Boolean,
    CheckConstraint,
    Computed,
    Date,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class LeaveType(Base):
    __tablename__ = "leave_types"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="leave_types_org_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    leave_type_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    is_paid: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class LeaveBalance(Base):
    __tablename__ = "leave_balances"
    __table_args__ = (
        CheckConstraint("fiscal_year >= 2000", name="leave_balances_year_check"),
        CheckConstraint("allocated_days >= 0", name="leave_balances_alloc_check"),
        CheckConstraint("consumed_days >= 0", name="leave_balances_consumed_check"),
        UniqueConstraint(
            "employee_id",
            "leave_type_id",
            "fiscal_year",
            name="leave_balances_unique_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    leave_balance_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id", ondelete="CASCADE"),
        nullable=False,
    )
    leave_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.leave_types.leave_type_id"),
        nullable=False,
    )
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False, default=Decimal("0"), server_default="0"
    )
    consumed_days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2), nullable=False, default=Decimal("0"), server_default="0"
    )
    remaining_days: Mapped[Decimal] = mapped_column(
        Numeric(6, 2),
        Computed("allocated_days - consumed_days", persisted=True),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class LeaveRequest(Base, TimestampMixin):
    __tablename__ = "leave_requests"
    __table_args__ = (
        CheckConstraint(
            "request_status in ('PENDING','IN_REVIEW','APPROVED','REJECTED','CANCELLED')",
            name="leave_requests_status_check",
        ),
        CheckConstraint("end_date >= start_date", name="leave_requests_dates_check"),
        UniqueConstraint("organization_id", "reference", name="leave_requests_ref_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    leave_request_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    leave_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.leave_types.leave_type_id"),
        nullable=False,
    )
    workflow_instance_id: Mapped[UUID | None] = mapped_column(PG_UUID(as_uuid=True))
    request_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PENDING", server_default="PENDING"
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String)
    submitted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    decided_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    decided_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    decision_comment: Mapped[str | None] = mapped_column(String)
