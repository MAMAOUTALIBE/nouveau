"""Tables performance + évaluation 360° anonymisée.

Le 360° respecte une contrainte d'anonymat structurelle : la table
`performance_360_responses` ne référence pas `users.user_id` (l'identité
du répondant n'est récupérable qu'à travers l'invitation, qui est jetée
à la clôture de la campagne — voir service au niveau application).
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import (
    TIMESTAMP,
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


class PerformanceCampaign(Base, TimestampMixin):
    __tablename__ = "performance_campaigns"
    __table_args__ = (
        CheckConstraint(
            "campaign_status in ('DRAFT','OPEN','CLOSED','CANCELLED')",
            name="performance_campaigns_status_check",
        ),
        CheckConstraint(
            "campaign_kind in ('CLASSIC','SURVEY_360')",
            name="performance_campaigns_kind_check",
        ),
        UniqueConstraint(
            "organization_id",
            "code",
            name="performance_campaigns_code_key",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    performance_campaign_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    campaign_kind: Mapped[str] = mapped_column(
        String, nullable=False, default="CLASSIC", server_default="CLASSIC"
    )
    campaign_status: Mapped[str] = mapped_column(
        String, nullable=False, default="DRAFT", server_default="DRAFT"
    )
    period_start: Mapped[date | None] = mapped_column(Date)
    period_end: Mapped[date | None] = mapped_column(Date)
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    min_respondents_per_category: Mapped[int] = mapped_column(
        Integer, nullable=False, default=3, server_default="3"
    )
    description: Mapped[str | None] = mapped_column(String)


class PerformanceEvaluation(Base, TimestampMixin):
    """Évaluation classique (manager ↔ agent ↔ self-assessment)."""

    __tablename__ = "performance_evaluations"
    __table_args__ = (
        CheckConstraint(
            "evaluation_status in ('DRAFT','SUBMITTED','VALIDATED')",
            name="performance_evaluations_status_check",
        ),
        UniqueConstraint(
            "performance_campaign_id",
            "employee_id",
            name="performance_evaluations_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    performance_evaluation_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    performance_campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.performance_campaigns.performance_campaign_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    self_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    manager_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    final_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    evaluation_status: Mapped[str] = mapped_column(
        String, nullable=False, default="DRAFT", server_default="DRAFT"
    )
    submitted_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    notes: Mapped[str | None] = mapped_column(String)


class Performance360Invitation(Base):
    """Invitation à répondre — porte le token signé.

    Ne JAMAIS exposer la liaison invitation → response après clôture
    de la campagne (les invitations doivent être supprimées ou anonymisées
    pour garantir l'anonymat structurel).
    """

    __tablename__ = "performance_360_invitations"
    __table_args__ = (
        CheckConstraint(
            "evaluator_category in ('SELF','MANAGER','PEER','SUBORDINATE')",
            name="performance_360_invitations_category_check",
        ),
        CheckConstraint(
            "invitation_status in ('SENT','RESPONDED','EXPIRED','REVOKED')",
            name="performance_360_invitations_status_check",
        ),
        UniqueConstraint(
            "invitation_token",
            name="performance_360_invitations_token_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    performance_360_invitation_id: Mapped[UUID] = uuid_pk_column()
    performance_campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.performance_campaigns.performance_campaign_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    target_employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    evaluator_employee_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
    )
    evaluator_category: Mapped[str] = mapped_column(String, nullable=False)
    invitation_token: Mapped[str] = mapped_column(String, nullable=False)
    invitation_status: Mapped[str] = mapped_column(
        String, nullable=False, default="SENT", server_default="SENT"
    )
    sent_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    responded_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(TIMESTAMP(timezone=True))


class Performance360Response(Base):
    """Réponse anonymisée — pas de FK vers users.

    Le répondant n'est tracé qu'indirectement via l'invitation, qui doit
    être supprimée à la clôture de campagne pour garantir l'anonymat.
    Aucune lecture côté API ne doit jamais joindre `invitation` <-> `response`.
    """

    __tablename__ = "performance_360_responses"
    __table_args__ = (
        CheckConstraint(
            "evaluator_category in ('SELF','MANAGER','PEER','SUBORDINATE')",
            name="performance_360_responses_category_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    performance_360_response_id: Mapped[UUID] = uuid_pk_column()
    performance_campaign_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.performance_campaigns.performance_campaign_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    target_employee_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.employees.employee_id"),
        nullable=False,
    )
    evaluator_category: Mapped[str] = mapped_column(String, nullable=False)
    answers: Mapped[dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict, server_default="{}"
    )
    submitted_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
