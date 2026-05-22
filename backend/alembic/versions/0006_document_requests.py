"""Demandes de documents administratifs — table `hr.document_requests`.

Alimente le Portail manager (panneau « Demandes de documents en attente ») :
un agent demande une attestation / un certificat, le manager valide ou rejette.

Table créée :
- `hr.document_requests` : référence métier, type de document demandé, motif,
  date souhaitée, statut (PENDING/APPROVED/REJECTED/CANCELLED) et décision.

Idempotente : `create table if not exists` + `create index if not exists`.

Revision ID: 0006
Revises: 0005
Create Date: 2026-05-22
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0006"
down_revision: str | None = "0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
create table if not exists hr.document_requests (
    document_request_id uuid primary key default gen_random_uuid(),
    organization_id uuid not null
        references hr.organizations(organization_id),
    reference text not null,
    requested_by_employee_id uuid
        references hr.employees(employee_id) on delete set null,
    document_type_label text not null,
    purpose text not null,
    needed_by date,
    request_status text not null default 'PENDING'
        constraint document_requests_status_check
        check (request_status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
    decided_by_user_id uuid
        references hr.users(user_id),
    decided_at timestamptz,
    decision_comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint document_requests_ref_key
        unique (organization_id, reference)
);

create index if not exists ix_document_requests_org_status
    on hr.document_requests (organization_id, request_status);
"""

SQL_DOWN = r"""
drop index if exists hr.ix_document_requests_org_status;
drop table if exists hr.document_requests;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
