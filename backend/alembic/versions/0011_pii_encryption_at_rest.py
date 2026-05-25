"""PII encryption at rest — hash de lookup + conversions DDL pour colonnes chiffrees.

Sub-ticket B (PII encryption at rest). Cette migration prepare la base pour
le chiffrement transparent des colonnes PII de `hr.employees` :

- Convertit `hr.employees.email` de CITEXT vers TEXT. Les valeurs futures
  seront chiffrees par le TypeDecorator `EncryptedString` (cf. Sub-A/Sub-B).
  Apres chiffrement, la colonne stockera des ciphertexts opaques `kvN:...`
  pour lesquels CITEXT (case-insensitive) n'a plus aucun sens.
- Convertit `hr.employees.birth_date` de DATE vers TEXT. Le TypeDecorator
  `EncryptedDate` serialise les dates en ISO-8601 puis les chiffre via
  Fernet : le ciphertext stocke est du texte opaque `kvN:...`, incompatible
  avec une colonne DATE Postgres. Les valeurs existantes en clair (au format
  `YYYY-MM-DD`) sont preservees ; le TypeDecorator les tolere en lecture
  (phase de transition, cf. warning `pii_legacy_plaintext_read`).
- Ajoute `hr.employees.email_lookup_hash` (VARCHAR(64), nullable, indexe) :
  HMAC-SHA256 hexadecimal de l'email normalise (lowercase+strip), utilise
  pour les recherches/dedup cote applicatif (WHERE col = X est impossible
  sur du Fernet a cause du nonce aleatoire).
- Ajoute `hr.employees.national_id_lookup_hash` (VARCHAR(64), nullable,
  indexe) : meme principe, sans normalisation (le numero national est
  case-sensitif).

Les colonnes `phone` et `national_id` restent TEXT au niveau DDL (elles
l'etaient deja) — seul leur typage SQLAlchemy change (EncryptedString)
pour declencher le chiffrement transparent.

Pre-requis ops : apres avoir applique cette migration, executer le script
`app/scripts/encrypt_existing_pii.py` (Sub-B C7) AVANT de redeployer l'app
en mode chiffrement, sinon les lectures legacy emettront le warning
`pii_legacy_plaintext_read` (non-bloquant grace au mode tolerant du
TypeDecorator). Tant que ce script n'a pas tourne, un rollback applicatif
reste possible.

Revision ID: 0011
Revises: 0010
Create Date: 2026-05-25
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0011"
down_revision: str | None = "0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # 1. CITEXT -> TEXT pour email (le ciphertext n'a aucun sens en CITEXT).
    op.execute("ALTER TABLE hr.employees ALTER COLUMN email TYPE TEXT")

    # 2. DATE -> TEXT pour birth_date. EncryptedDate.impl=Text et stocke des
    # ciphertexts opaques `kvN:...`. La conversion preserve les dates en
    # clair existantes en `YYYY-MM-DD` (cast natif date->text de Postgres),
    # que le TypeDecorator saura relire (phase de transition tolerante).
    op.execute("ALTER TABLE hr.employees ALTER COLUMN birth_date TYPE TEXT USING birth_date::text")

    # 3. Colonnes hash de lookup (HMAC-SHA256 hex = 64 chars).
    op.add_column(
        "employees",
        sa.Column("email_lookup_hash", sa.String(length=64), nullable=True),
        schema="hr",
    )
    op.add_column(
        "employees",
        sa.Column("national_id_lookup_hash", sa.String(length=64), nullable=True),
        schema="hr",
    )

    # 4. Index B-tree partiels (rapides, sans stocker les NULL).
    op.create_index(
        "idx_employees_email_lookup_hash",
        "employees",
        ["email_lookup_hash"],
        schema="hr",
        postgresql_where=sa.text("email_lookup_hash IS NOT NULL"),
    )
    op.create_index(
        "idx_employees_national_id_lookup_hash",
        "employees",
        ["national_id_lookup_hash"],
        schema="hr",
        postgresql_where=sa.text("national_id_lookup_hash IS NOT NULL"),
    )


def downgrade() -> None:
    # AVERTISSEMENT : downgrade SAFE uniquement tant que C7
    # (`encrypt_existing_pii.py`) N'A PAS encore ete execute. Une fois les
    # PII chiffres en DB :
    # - le cast `birth_date::date` echouera sur les ciphertexts `kvN:...` ;
    # - repasser email en CITEXT expose des ciphertexts au moteur
    #   case-insensitive (sans danger mais inutile).
    # Cote utilisateur, les valeurs visibles seront des `kvN:...` au lieu du
    # clair attendu. Ne pas rollback en prod sans plan de dechiffrement.
    op.drop_index("idx_employees_national_id_lookup_hash", "employees", schema="hr")
    op.drop_index("idx_employees_email_lookup_hash", "employees", schema="hr")
    op.drop_column("employees", "national_id_lookup_hash", schema="hr")
    op.drop_column("employees", "email_lookup_hash", schema="hr")
    op.execute("ALTER TABLE hr.employees ALTER COLUMN birth_date TYPE DATE USING birth_date::date")
    op.execute("ALTER TABLE hr.employees ALTER COLUMN email TYPE CITEXT USING email::citext")
