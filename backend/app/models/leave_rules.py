"""Tables règles métier congés — couverture service + auto-approbation."""

from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class LeaveServiceCoverageRule(Base, TimestampMixin):
    """Seuils de couverture minimale par service / direction.

    Un congé qui ferait passer le service sous le seuil minimum est bloqué
    en auto-approbation et signalé à la soumission (preview impact).
    """

    __tablename__ = "leave_service_coverage_rules"
    __table_args__ = (
        CheckConstraint(
            "scope_type in ('DIRECTION','UNIT')",
            name="leave_coverage_scope_check",
        ),
        CheckConstraint(
            "min_presence_ratio is null or (min_presence_ratio >= 0 and min_presence_ratio <= 1)",
            name="leave_coverage_ratio_check",
        ),
        UniqueConstraint(
            "organization_id",
            "scope_type",
            "scope_id",
            name="leave_coverage_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    leave_service_coverage_rule_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    scope_type: Mapped[str] = mapped_column(String, nullable=False)
    scope_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    min_presence_ratio: Mapped[float | None] = mapped_column(Numeric(4, 3))
    min_headcount: Mapped[int | None] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    note: Mapped[str | None] = mapped_column(String)


class LeaveAutoApprovalRule(Base, TimestampMixin):
    """Règles d'auto-approbation paramétrables par leave_type.

    Évaluation cumulative : durée ≤ max_duration_days + quota OK + service
    non sous-effectif (jointure avec leave_service_coverage_rules) +
    pas de chevauchement critique → APPROVED.
    """

    __tablename__ = "leave_auto_approval_rules"
    __table_args__ = (
        CheckConstraint("max_duration_days >= 0", name="leave_auto_duration_check"),
        UniqueConstraint(
            "organization_id",
            "leave_type_id",
            name="leave_auto_rules_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    leave_auto_approval_rule_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    leave_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.leave_types.leave_type_id"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    max_duration_days: Mapped[int] = mapped_column(
        Integer, nullable=False, default=2, server_default="2"
    )
    require_quota_ok: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    require_service_coverage: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    blackout_periods: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list, server_default="[]"
    )
