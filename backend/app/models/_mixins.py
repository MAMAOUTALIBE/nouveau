"""Mixins partagés pour les modèles."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

DEFAULT_SCHEMA = "hr"


class TimestampMixin:
    """Colonnes `created_at` / `updated_at` standard du schéma RH."""

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


def uuid_pk_column() -> Mapped[UUID]:
    """Helper pour clé primaire UUID v4 (côté serveur si possible, fallback Python)."""
    return mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )
