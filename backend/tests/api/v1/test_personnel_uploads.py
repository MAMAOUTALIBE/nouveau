"""Tests d'intégration HTTP — endpoint POST /api/v1/personnel/uploads.

Couvre la mise en place des gardes (P0 #6) :

- Fichier > ``upload_max_size_bytes`` → 413 Payload Too Large.
- MIME hors allow-list → 415 Unsupported Media Type.
- PDF accepté → 201 Created (non-régression).

On *n'a pas besoin* de PostgreSQL : le service ``create_personnel_upload``
est mocké via ``monkeypatch`` et la session DB est short-circuitée par un
``dependency_overrides``. Cela maintient le test rapide et autonome.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.schemas.personnel import PersonnelUploadedFile
from app.services import personnel_service
from httpx import ASGITransport, AsyncClient

_ORG_ID = uuid4()
_USER_ID = uuid4()


def _fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=_USER_ID,
        organization_id=_ORG_ID,
        username="pytest-uploads",
        full_name="Pytest Uploads",
        status="ACTIVE",
        roles=("super_admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


class _NoopAudit(AuditWriter):
    """AuditWriter sans DB : capture les ``record`` en RAM."""

    def __init__(self) -> None:
        self.records: list[dict[str, Any]] = []

    async def record(self, action: str, **kwargs: Any) -> Any:  # type: ignore[override]
        self.records.append({"action": action, **kwargs})
        return None


@pytest_asyncio.fixture
async def client(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[AsyncClient]:
    """Client httpx ASGI avec auth bypass et service DB mocké."""
    # Service métier mocké : pas de DB nécessaire.
    captured: dict[str, Any] = {}

    async def _fake_create_upload(
        _session: Any,
        *,
        organization_id: UUID,
        uploaded_by_user_id: UUID,
        original_filename: str,
        mime_type: str | None,
        content: bytes,
    ) -> PersonnelUploadedFile:
        captured["organization_id"] = organization_id
        captured["uploaded_by_user_id"] = uploaded_by_user_id
        captured["filename"] = original_filename
        captured["mime_type"] = mime_type
        captured["byte_size"] = len(content)
        file_id = uuid4()
        return PersonnelUploadedFile(
            id=file_id,
            file_name=original_filename,
            mime_type=mime_type or "application/octet-stream",
            size=len(content),
            url=f"/files/{file_id}",
        )

    monkeypatch.setattr(personnel_service, "create_personnel_upload", _fake_create_upload)

    from app.main import create_app

    app = create_app()

    async def _override_session() -> AsyncIterator[None]:
        # Session jamais utilisée (service mocké).
        yield None

    async def _override_user() -> AuthenticatedUser:
        return _fake_user()

    async def _override_audit() -> AuditWriter:
        return _NoopAudit()

    app.dependency_overrides[get_session] = _override_session
    app.dependency_overrides[get_current_user] = _override_user
    app.dependency_overrides[get_audit_writer] = _override_audit

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as http:
        # On expose ``captured`` sur l'objet client pour les assertions.
        http.captured = captured  # type: ignore[attr-defined]
        yield http
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_pdf_ok(client: AsyncClient) -> None:
    pdf_bytes = b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n" + b"0" * 1024

    response = await client.post(
        "/api/v1/personnel/uploads",
        files={"file": ("piece.pdf", pdf_bytes, "application/pdf")},
    )

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["mime_type"] == "application/pdf"
    assert body["file_name"] == "piece.pdf"


@pytest.mark.asyncio
async def test_upload_invalid_mime_returns_415(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/personnel/uploads",
        files={"file": ("malware.exe", b"MZ\x90\x00garbage", "application/x-msdownload")},
    )

    assert response.status_code == 415, response.text
    body = response.json()
    # Le handler générique sérialise le ``detail`` (dict) en str(...) — on
    # vérifie donc que les informations clés y figurent au lieu d'un match
    # JSON strict.
    message = body["error"]["message"]
    assert "Type de fichier non autorisé" in message
    assert "application/x-msdownload" in message
    assert "application/pdf" in message


@pytest.mark.asyncio
async def test_upload_too_large_returns_413(
    client: AsyncClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Forçage d'une limite basse pour éviter d'envoyer 50 MB en test."""
    monkeypatch.setenv("UPLOAD_MAX_SIZE_BYTES", str(64 * 1024))  # 64 KB
    from app.core.config import get_settings

    get_settings.cache_clear()

    payload = b"%PDF-1.7\n" + b"x" * (128 * 1024)  # 128 KB > 64 KB

    response = await client.post(
        "/api/v1/personnel/uploads",
        files={"file": ("big.pdf", payload, "application/pdf")},
    )

    assert response.status_code == 413, response.text
    assert "taille maximale" in response.json()["error"]["message"].lower()

    # Reset cache pour ne pas polluer les autres tests.
    get_settings.cache_clear()
