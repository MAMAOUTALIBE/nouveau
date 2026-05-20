"""Adapter storage MinIO/S3 — `boto3` (compatible MinIO via endpoint_url).

Souverain si on déploie MinIO on-prem (recommandé pour la Primature).
S3 AWS reste accessible via le même adapter en omettant `endpoint_url`.
"""

from __future__ import annotations

from hashlib import sha256
from typing import Any

from app.adapters.storage.port import (
    ObjectStoragePort,
    StoredObject,
    StoredObjectMetadata,
)
from app.core.errors import NotFoundError


class MinioS3StorageAdapter(ObjectStoragePort):
    provider_name = "minio"

    def __init__(
        self,
        *,
        bucket: str,
        region: str,
        endpoint_url: str | None,
        access_key: str | None,
        secret_key: str | None,
    ) -> None:
        self.bucket = bucket
        self.region = region
        self.endpoint_url = endpoint_url
        self.access_key = access_key
        self.secret_key = secret_key

    def _client(self) -> Any:
        try:
            from boto3 import client
        except ImportError:
            raise RuntimeError("boto3 non installé. `uv add boto3` requis pour MinIO/S3.") from None
        return client(
            "s3",
            endpoint_url=self.endpoint_url,
            region_name=self.region,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
        )

    async def put(
        self,
        *,
        object_key: str,
        content: bytes,
        mime_type: str | None = None,
        original_filename: str | None = None,
    ) -> StoredObjectMetadata:
        client = self._client()
        client.put_object(
            Bucket=self.bucket,
            Key=object_key,
            Body=content,
            ContentType=mime_type or "application/octet-stream",
            ServerSideEncryption="AES256",  # SSE-S3 par défaut
        )
        return StoredObjectMetadata(
            object_key=object_key,
            bucket_name=self.bucket,
            storage_provider=self.provider_name,
            byte_size=len(content),
            sha256=sha256(content).hexdigest(),
            mime_type=mime_type,
            original_filename=original_filename,
        )

    async def get(self, *, object_key: str) -> StoredObject:
        client = self._client()
        try:
            response = client.get_object(Bucket=self.bucket, Key=object_key)
        except Exception as exc:
            raise NotFoundError(
                f"Objet introuvable : {object_key}",
                code="OBJECT_NOT_FOUND",
            ) from exc
        body = response["Body"].read()
        return StoredObject(
            metadata=StoredObjectMetadata(
                object_key=object_key,
                bucket_name=self.bucket,
                storage_provider=self.provider_name,
                byte_size=len(body),
                sha256=sha256(body).hexdigest(),
                mime_type=response.get("ContentType"),
                original_filename=None,
            ),
            content=body,
        )

    async def delete(self, *, object_key: str) -> None:
        client = self._client()
        client.delete_object(Bucket=self.bucket, Key=object_key)

    async def presigned_url(self, *, object_key: str, expires_in_seconds: int = 300) -> str:
        client = self._client()
        return str(
            client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket, "Key": object_key},
                ExpiresIn=expires_in_seconds,
            )
        )
