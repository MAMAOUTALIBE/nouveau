"""Politique de scoring du recrutement — table `hr.recruitment_scoring_policies`.

Alimente l'écran « Scoring des candidatures » : une politique par organisation
définit les critères de notation (expérience, compétences, niveau académique,
entretien, test) et leur pondération. Les scores des candidatures sont calculés
à la volée à partir de cette politique — aucune table de scores n'est stockée.

Table créée :
- `hr.recruitment_scoring_policies` : une ligne par organisation, les critères
  étant stockés en JSONB (`[{key,label,weight,maxYears?}]`).

Idempotente : `create table if not exists` + `create index if not exists`.

Revision ID: 0007
Revises: 0006
Create Date: 2026-05-22
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
create table if not exists hr.recruitment_scoring_policies (
    scoring_policy_id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references hr.organizations(organization_id),
    criteria jsonb not null default '[]'::jsonb,
    updated_by_user_id uuid
        references hr.users(user_id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint recruitment_scoring_policies_org_key
        unique (organization_id)
);
"""

SQL_DOWN = r"""
drop table if exists hr.recruitment_scoring_policies;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
