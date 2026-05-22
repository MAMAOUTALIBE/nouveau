"""Tables `hr.recruitment_*` — campagnes, candidatures, événements, commentaires, pièces."""

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
from sqlalchemy.dialects.postgresql import CITEXT, JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, TimestampMixin, uuid_pk_column


class RecruitmentCampaign(Base, TimestampMixin):
    __tablename__ = "recruitment_campaigns"
    __table_args__ = (
        CheckConstraint(
            "status in ('DRAFT','ACTIVE','PAUSED','CLOSED','CANCELLED')",
            name="recruitment_campaigns_status_check",
        ),
        CheckConstraint("openings > 0", name="recruitment_campaigns_openings_check"),
        UniqueConstraint("organization_id", "code", name="recruitment_campaigns_code_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    campaign_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    direction_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.directions.direction_id"),
    )
    unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.units.unit_id"),
    )
    need_position: Mapped[str | None] = mapped_column(String)
    openings: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    need_quota: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(
        String, nullable=False, default="ACTIVE", server_default="ACTIVE"
    )
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    owner_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )


class RecruitmentApplication(Base, TimestampMixin):
    __tablename__ = "recruitment_applications"
    __table_args__ = (
        CheckConstraint(
            "application_status in ('NEW','PRESELECTED','INTERVIEW','OFFERED','HIRED','REJECTED')",
            name="recruitment_applications_status_check",
        ),
        UniqueConstraint("organization_id", "reference", name="recruitment_applications_ref_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    application_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    campaign_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.recruitment_campaigns.campaign_id"),
    )
    reference: Mapped[str] = mapped_column(String, nullable=False)
    candidate_full_name: Mapped[str] = mapped_column(String, nullable=False)
    candidate_email: Mapped[str | None] = mapped_column(CITEXT)
    candidate_phone: Mapped[str | None] = mapped_column(String)
    identity_number: Mapped[str | None] = mapped_column(String)
    desired_position: Mapped[str | None] = mapped_column(String)
    source_channel: Mapped[str | None] = mapped_column(String)
    application_status: Mapped[str] = mapped_column(
        String, nullable=False, default="NEW", server_default="NEW"
    )
    received_on: Mapped[date | None] = mapped_column(Date)
    experience_years: Mapped[int | None] = mapped_column(Integer)
    skills_match_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    education_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    interview_avg_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    test_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    application_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata",
        JSONB,
        nullable=False,
        default=dict,
        server_default="{}",
    )


class RecruitmentStatusEvent(Base):
    __tablename__ = "recruitment_status_events"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    status_event_id: Mapped[UUID] = uuid_pk_column()
    application_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.recruitment_applications.application_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    from_status: Mapped[str | None] = mapped_column(String)
    to_status: Mapped[str] = mapped_column(String, nullable=False)
    changed_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    changed_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    note: Mapped[str | None] = mapped_column(String)


class RecruitmentComment(Base):
    __tablename__ = "recruitment_comments"
    __table_args__ = {"schema": DEFAULT_SCHEMA}

    comment_id: Mapped[UUID] = uuid_pk_column()
    application_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.recruitment_applications.application_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    author_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    message: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RecruitmentAttachment(Base):
    __tablename__ = "recruitment_attachments"
    __table_args__ = (
        UniqueConstraint("application_id", "file_id", name="recruitment_attachments_unique_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    attachment_id: Mapped[UUID] = uuid_pk_column()
    application_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(
            f"{DEFAULT_SCHEMA}.recruitment_applications.application_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    file_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.file_objects.file_id"),
        nullable=False,
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )


class RecruitmentScoringPolicy(Base, TimestampMixin):
    """Politique de scoring du recrutement — une ligne par organisation.

    Les critères de notation et leurs pondérations sont stockés en JSONB
    (`[{key, label, weight, maxYears?}]`). Les scores des candidatures sont
    calculés à la volée à partir de cette politique (aucun score persisté).
    """

    __tablename__ = "recruitment_scoring_policies"
    __table_args__ = (
        UniqueConstraint("organization_id", name="recruitment_scoring_policies_org_key"),
        {"schema": DEFAULT_SCHEMA},
    )

    scoring_policy_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    criteria: Mapped[list[dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default="[]",
    )
    updated_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )


class RecruitmentShortlistValidation(Base):
    """Décision RH sur une candidature shortlistée (validée ou rejetée)."""

    __tablename__ = "recruitment_shortlist_validations"
    __table_args__ = (
        CheckConstraint(
            "decision in ('VALIDATED','REJECTED')",
            name="recruitment_shortlist_validations_decision_check",
        ),
        UniqueConstraint(
            "organization_id",
            "application_reference",
            name="recruitment_shortlist_validations_unique",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    shortlist_validation_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    application_reference: Mapped[str] = mapped_column(String, nullable=False)
    decision: Mapped[str] = mapped_column(String, nullable=False)
    note: Mapped[str | None] = mapped_column(String)
    validated_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    validated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
