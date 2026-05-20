"""Adapter storage filesystem local — utile pour le dev et les démos."""

from __future__ import annotations

from hashlib import sha256
from pathlib import Path

from app.adapters.storage.port import (
    ObjectStoragePort,
    StoredObject,
    StoredObjectMetadata,
)
from app.core.errors import NotFoundError


class LocalFsStorageAdapter(ObjectStoragePort):
    provider_name = "local"

    def __init__(self, root_dir: str = "./uploads") -> None:
        self.root = Path(root_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _resolve(self, object_key: str) -> Path:
        target = (self.root / object_key).resolve()
        # Anti-traversée — refuse tout chemin sortant de root
        if self.root not in target.parents and target != self.root:
            raise ValueError(f"Path traversal interdit : {object_key}")
        return target

    async def put(
        self,
        *,
        object_key: str,
        content: bytes,
        mime_type: str | None = None,
        original_filename: str | None = None,
    ) -> StoredObjectMetadata:
        target = self._resolve(object_key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return StoredObjectMetadata(
            object_key=object_key,
            bucket_name=str(self.root),
            storage_provider=self.provider_name,
            byte_size=len(content),
            sha256=sha256(content).hexdigest(),
            mime_type=mime_type,
            original_filename=original_filename,
        )

    async def get(self, *, object_key: str) -> StoredObject:
        target = self._resolve(object_key)
        if not target.is_file():
            raise NotFoundError(
                f"Objet introuvable : {object_key}",
                code="OBJECT_NOT_FOUND",
            )
        content = target.read_bytes()
        return StoredObject(
            metadata=StoredObjectMetadata(
                object_key=object_key,
                bucket_name=str(self.root),
                storage_provider=self.provider_name,
                byte_size=len(content),
                sha256=sha256(content).hexdigest(),
                mime_type=None,
                original_filename=target.name,
            ),
            content=content,
        )

    async def delete(self, *, object_key: str) -> None:
        target = self._resolve(object_key)
        if target.is_file():
            target.unlink()

    async def presigned_url(self, *, object_key: str, expires_in_seconds: int = 300) -> str:
        # En local : pas de presigned URL ; on renvoie le chemin file://.
        target = self._resolve(object_key)
        return f"file://{target}"
