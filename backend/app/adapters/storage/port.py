"""Port (interface) pour le stockage d'objets (FS, MinIO, S3)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True, slots=True)
class StoredObjectMetadata:
    object_key: str
    bucket_name: str
    storage_provider: str
    byte_size: int | None
    sha256: str | None
    mime_type: str | None
    original_filename: str | None


@dataclass(frozen=True, slots=True)
class StoredObject:
    metadata: StoredObjectMetadata
    content: bytes


class ObjectStoragePort(Protocol):
    provider_name: str

    async def put(
        self,
        *,
        object_key: str,
        content: bytes,
        mime_type: str | None = None,
        original_filename: str | None = None,
    ) -> StoredObjectMetadata: ...

    async def get(self, *, object_key: str) -> StoredObject: ...

    async def delete(self, *, object_key: str) -> None: ...

    async def presigned_url(self, *, object_key: str, expires_in_seconds: int = 300) -> str: ...
