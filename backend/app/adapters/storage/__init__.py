"""Object storage adapters."""

from app.adapters.storage.factory import get_storage_adapter
from app.adapters.storage.port import (
    ObjectStoragePort,
    StoredObject,
    StoredObjectMetadata,
)

__all__ = [
    "ObjectStoragePort",
    "StoredObject",
    "StoredObjectMetadata",
    "get_storage_adapter",
]
