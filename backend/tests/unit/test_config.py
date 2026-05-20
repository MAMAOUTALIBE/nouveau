"""Tests unitaires : validation des settings."""

from __future__ import annotations

import pytest
from app.core.config import Settings


def test_jwt_secret_too_short_rejected() -> None:
    with pytest.raises(ValueError, match="32 caract"):
        Settings(  # type: ignore[call-arg]
            jwt_secret_key="short",
            database_url="postgresql+asyncpg://u:p@h/db",
        )


def test_database_url_must_be_async() -> None:
    with pytest.raises(ValueError, match="asyncpg"):
        Settings(  # type: ignore[call-arg]
            jwt_secret_key="x" * 32,
            database_url="postgresql://u:p@h/db",
        )


def test_settings_parses_cors_origins() -> None:
    s = Settings(  # type: ignore[call-arg]
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        allowed_origins="http://a.local, http://b.local ,",
    )
    assert s.cors_origins() == ["http://a.local", "http://b.local"]
