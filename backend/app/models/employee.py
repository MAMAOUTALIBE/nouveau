"""Tables `hr.employees`, `hr.employee_assignments`, `hr.employee_movements`."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
    CheckConstraint,
    Date,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.core.security.types import EncryptedDate, EncryptedString
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"
    __table_args__ = (
        CheckConstraint(
            "employment_status in ('ACTIVE','ON_LEAVE','INACTIVE','TERMINATED')",
            name="employees_status_check",
        ),
        UniqueConstraint("organization_id", "matricule", name="employees_org_matricule_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    employee_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    matricule: Mapped[str] = mapped_column(String, nullable=False)
    first_name: Mapped[str | None] = mapped_column(String)
    last_name: Mapped[str | None] = mapped_column(String)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    # Colonnes PII chiffrees au repos (Sub-B). Le DDL en base reste TEXT
    # (cf. migration 0011 qui convertit email CITEXT->TEXT). Les recherches
    # par email/national_id passent par les colonnes _lookup_hash ci-dessous
    # (HMAC deterministe) car le nonce Fernet rend WHERE col = X impossible.
    national_id: Mapped[str | None] = mapped_column(EncryptedString)
    email: Mapped[str | None] = mapped_column(EncryptedString)
    phone: Mapped[str | None] = mapped_column(EncryptedString)
    # Hash de lookup pour requetes/dedup sur les champs chiffres. HMAC-SHA256
    # hexadecimal (64 chars). Indexes partiels WHERE col IS NOT NULL crees
    # par la migration 0011. Alimentation : services applicatifs (Sub-C).
    email_lookup_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    national_id_lookup_hash: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
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
    manager_employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )
    employment_status: Mapped[str] = mapped_column(
        String, nullable=False, default="ACTIVE", server_default="ACTIVE"
    )
    contract_type: Mapped[str | None] = mapped_column(String)
    hire_date: Mapped[date | None] = mapped_column(Date)
    exit_date: Mapped[date | None] = mapped_column(Date)
    # birth_date chiffree (PII sensible). Stockage TEXT (ciphertext opaque) :
    # pas d'ORDER BY ni de BETWEEN possible cote SQL. Le calcul d'age/retraite
    # se fait en Python apres lecture ORM.
    birth_date: Mapped[date | None] = mapped_column(EncryptedDate)
    contract_end_date: Mapped[date | None] = mapped_column(Date)
    photo_file_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.file_objects.file_id"),
    )
    employee_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class EmployeeAssignment(Base):
    __tablename__ = "employee_assignments"
    __table_args__ = (
        CheckConstraint(
            "assignment_status in ('PLANNED','ACTIVE','ENDED','CANCELLED')",
            name="employee_assignments_status_check",
        ),
        CheckConstraint(
            "effective_end is null or effective_end >= effective_start",
            name="employee_assignments_dates_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    assignment_id: Mapped[UUID] = uuid_pk_column()
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
    assignment_status: Mapped[str] = mapped_column(
        String, nullable=False, default="PLANNED", server_default="PLANNED"
    )
    effective_start: Mapped[date] = mapped_column(Date, nullable=False)
    effective_end: Mapped[date | None] = mapped_column(Date)
    created_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class EmployeeMovement(Base, TimestampMixin):
    __tablename__ = "employee_movements"
    __table_args__ = (
        CheckConstraint(
            "movement_type in ('TRANSFER','PROMOTION','SECONDMENT','RECLASSIFICATION','EXIT')",
            name="employee_movements_type_check",
        ),
        CheckConstraint(
            "movement_status in ('DRAFT','APPROVED','REJECTED','EXECUTED','CANCELLED')",
            name="employee_movements_status_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    movement_id: Mapped[UUID] = uuid_pk_column()
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
    movement_type: Mapped[str] = mapped_column(String, nullable=False)
    movement_status: Mapped[str] = mapped_column(
        String, nullable=False, default="DRAFT", server_default="DRAFT"
    )
    from_direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    from_unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    from_position_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.positions.position_id"),
    )
    to_direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    to_unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    to_position_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.positions.position_id"),
    )
    effective_date: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str | None] = mapped_column(String)
    approved_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    approved_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    created_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )


class PersonnelMatriculeSuggestionAudit(Base):
    """Trace une suggestion de matricule produite pour la création d'un agent.

    Chaque appel à `GET /personnel/agents/matricule-suggestion` écrit une ligne
    ici : qui a demandé la suggestion, dans quel scope (Direction / Unité), et
    quelle valeur a été proposée.
    """

    __tablename__ = "personnel_matricule_suggestion_audit"
    __table_args__ = (
        CheckConstraint(
            "based_on in ('Direction+Unite','Direction','Global')",
            name="personnel_matricule_audit_based_on_check",
        ),
        UniqueConstraint(
            "organization_id",
            "reference",
            name="personnel_matricule_audit_ref_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    suggestion_audit_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    requested_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    previous_matricule: Mapped[str | None] = mapped_column(String)
    suggested_matricule: Mapped[str] = mapped_column(String, nullable=False)
    direction: Mapped[str | None] = mapped_column(String)
    unit: Mapped[str | None] = mapped_column(String)
    scope_label: Mapped[str | None] = mapped_column(String)
    based_on: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
