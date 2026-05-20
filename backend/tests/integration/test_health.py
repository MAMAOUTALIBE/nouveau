"""Test d'intégration léger : /api/v1/health.

Ce test ne nécessite **pas** de PostgreSQL fonctionnel : il vérifie
juste que l'application boot et répond. Le statut DB sera `down` sans
PG, c'est attendu.
"""

from __future__ import annotations

import pytest
from app.main import create_app
from httpx import ASGITransport, AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint_returns_payload() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] in ("ok", "degraded")
    assert "version" in body
    assert "env" in body
    assert body["database"] in ("up", "down")


@pytest.mark.asyncio
async def test_security_headers_set() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.headers.get("x-content-type-options") == "nosniff"
    assert response.headers.get("x-frame-options") == "DENY"
    assert "referrer-policy" in response.headers


@pytest.mark.asyncio
async def test_openapi_schema_available_in_dev() -> None:
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"].startswith("RH Primature")


@pytest.mark.asyncio
async def test_error_format_uniform() -> None:
    """Une erreur 401 doit suivre le format `{ error: {...} }`."""
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/admin/audit-logs")

    assert response.status_code == 401
    body = response.json()
    assert "error" in body
    assert body["error"]["code"] == "UNAUTHORIZED"
