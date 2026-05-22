"""Audit des suggestions de matricule — table `hr.personnel_matricule_suggestion_audit`.

Alimente l'écran « Création d'agent » : chaque appel à
`GET /personnel/agents/matricule-suggestion` retourne une suggestion et trace
qui l'a demandée et dans quel scope (Direction / Unité). Cela donne au RH un
historique consultable des suggestions de matricule produites.

Table créée :
- `hr.personnel_matricule_suggestion_audit` : une ligne par suggestion produite.

Idempotente : `create table if not exists` + `create index if not exists`.

Revision ID: 0008
Revises: 0007
Create Date: 2026-05-23
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0008"
down_revision: str | None = "0007"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
create table if not exists hr.personnel_matricule_suggestion_audit (
    suggestion_audit_id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references hr.organizations(organization_id),
    reference text not null,
    requested_by_user_id uuid
        references hr.users(user_id),
    previous_matricule text,
    suggested_matricule text not null,
    direction text,
    unit text,
    scope_label text,
    based_on text not null
        constraint personnel_matricule_audit_based_on_check
        check (based_on in ('Direction+Unite','Direction','Global')),
    reason text,
    created_at timestamptz not null default now(),
    constraint personnel_matricule_audit_ref_key
        unique (organization_id, reference)
);

create index if not exists ix_personnel_matricule_audit_org_created
    on hr.personnel_matricule_suggestion_audit (organization_id, created_at desc);
"""

SQL_DOWN = r"""
drop index if exists hr.ix_personnel_matricule_audit_org_created;
drop table if exists hr.personnel_matricule_suggestion_audit;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
