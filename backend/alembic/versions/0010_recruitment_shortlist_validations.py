"""Validations de shortlist recrutement — table `hr.recruitment_shortlist_validations`.

Alimente l'écran « Recrutement > Shortlists » : pour chaque candidature
suggérée par le scoring, on trace la décision RH (validée / rejetée) avec une
note explicative. Une validation par candidature (par organisation).

Table créée :
- `hr.recruitment_shortlist_validations` : `application_reference` -> décision.

Idempotente : `create table if not exists`.

Revision ID: 0010
Revises: 0008
Create Date: 2026-05-23
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0010"
# 0008 = matricule audit (0009 a ete annule).
down_revision: str | None = "0008"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
create table if not exists hr.recruitment_shortlist_validations (
    shortlist_validation_id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references hr.organizations(organization_id),
    application_reference text not null,
    decision text not null
        constraint recruitment_shortlist_validations_decision_check
        check (decision in ('VALIDATED','REJECTED')),
    note text,
    validated_by_user_id uuid
        references hr.users(user_id),
    validated_at timestamptz not null default now(),
    constraint recruitment_shortlist_validations_unique
        unique (organization_id, application_reference)
);
"""

SQL_DOWN = r"""
drop table if exists hr.recruitment_shortlist_validations;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
