"""Factory de sélection du storage."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.storage.local_fs import LocalFsStorageAdapter
from app.adapters.storage.minio_s3 import MinioS3StorageAdapter
from app.adapters.storage.port import ObjectStoragePort
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_storage_adapter() -> ObjectStoragePort:
    settings = get_settings()
    provider = settings.storage_provider

    if provider in ("minio", "s3") and settings.s3_access_key:
        return MinioS3StorageAdapter(
            bucket=settings.s3_bucket,
            region=settings.s3_region,
            endpoint_url=settings.s3_endpoint_url,
            access_key=settings.s3_access_key,
            secret_key=(
                settings.s3_secret_key.get_secret_value() if settings.s3_secret_key else None
            ),
        )

    return LocalFsStorageAdapter(root_dir=settings.storage_local_dir)
