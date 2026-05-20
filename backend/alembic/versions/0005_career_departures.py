"""GPEC — anticipation des départs : date de naissance, fin de contrat, âge de retraite.

Champs ajoutés (tous compatibles avec l'existant) :
- `hr.employees.birth_date` : date de naissance — base du calcul de la date de
  départ à la retraite.
- `hr.employees.contract_end_date` : date de fin de contrat — pilotage des
  renouvellements / libérations de poste.
- `hr.organizations.retirement_age` : âge légal de départ à la retraite,
  configurable par l'organisation (défaut 60 ans).

Revision ID: 0005
Revises: 0004
Create Date: 2026-05-20
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
alter table hr.employees
  add column if not exists birth_date date;
alter table hr.employees
  add column if not exists contract_end_date date;
alter table hr.organizations
  add column if not exists retirement_age integer not null default 60;
"""

SQL_DOWN = r"""
alter table hr.organizations drop column if exists retirement_age;
alter table hr.employees drop column if exists contract_end_date;
alter table hr.employees drop column if exists birth_date;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
