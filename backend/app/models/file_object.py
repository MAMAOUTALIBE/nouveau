"""Table `hr.file_objects` — métadonnées des fichiers stockés (S3 / FS / MinIO)."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import TIMESTAMP, BigInteger, CheckConstraint, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models._mixins import DEFAULT_SCHEMA, uuid_pk_column


class FileObject(Base):
    __tablename__ = "file_objects"
    __table_args__ = (
        CheckConstraint(
            "byte_size is null or byte_size >= 0",
            name="file_objects_size_check",
        ),
        {"schema": DEFAULT_SCHEMA},
    )

    file_id: Mapped[UUID] = uuid_pk_column()
    organization_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.organizations.organization_id"),
        nullable=False,
    )
    storage_provider: Mapped[str] = mapped_column(
        String, nullable=False, default="s3", server_default="s3"
    )
    bucket_name: Mapped[str] = mapped_column(String, nullable=False)
    object_key: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str | None] = mapped_column(String)
    byte_size: Mapped[int | None] = mapped_column(BigInteger)
    sha256: Mapped[str | None] = mapped_column(String)
    original_filename: Mapped[str | None] = mapped_column(String)
    uploaded_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey(f"{DEFAULT_SCHEMA}.users.user_id"),
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
