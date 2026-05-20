"""Liaison `users.employee_id` → `employees.employee_id`.

Permet à un user authentifié d'identifier l'employé qu'il représente
(scope SELF — agent voit ses propres congés/documents/dossier).

Idempotente : `add column if not exists` + FK conditionnelle.

Revision ID: 0003
Revises: 0002
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
alter table hr.users
  add column if not exists employee_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'fk_users_employee'
      and c.conrelid = 'hr.users'::regclass
  ) then
    alter table hr.users
      add constraint fk_users_employee
      foreign key (employee_id)
      references hr.employees(employee_id)
      on delete set null;
  end if;
end $$;

create unique index if not exists uq_users_employee_id
  on hr.users (employee_id)
  where employee_id is not null;
"""

SQL_DOWN = r"""
drop index if exists hr.uq_users_employee_id;
alter table hr.users drop constraint if exists fk_users_employee;
alter table hr.users drop column if exists employee_id;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
