"""Ajout 2FA TOTP sur `users` (PY-082).

Champs ajoutés (tous nullable) :
- `totp_secret_encrypted` : secret TOTP chiffré applicativement.
- `totp_enabled` : bool — true quand l'agent a finalisé le setup.
- `totp_enrolled_at` : timestamp d'activation.
- `totp_last_used_at` : dernier code valide consommé (anti-replay).

Le 2FA est obligatoire pour les rôles configurés via
`TOTP_REQUIRED_FOR_ROLES` (par défaut super_admin + hr_manager).

Revision ID: 0004
Revises: 0003
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
alter table hr.users
  add column if not exists totp_secret_encrypted text;
alter table hr.users
  add column if not exists totp_enabled boolean not null default false;
alter table hr.users
  add column if not exists totp_enrolled_at timestamptz;
alter table hr.users
  add column if not exists totp_last_used_at timestamptz;
"""

SQL_DOWN = r"""
alter table hr.users drop column if exists totp_last_used_at;
alter table hr.users drop column if exists totp_enrolled_at;
alter table hr.users drop column if exists totp_enabled;
alter table hr.users drop column if exists totp_secret_encrypted;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
