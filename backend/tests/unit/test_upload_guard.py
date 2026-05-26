"""Tests unitaires du module ``app.core.security.upload_guard`` + ClamAV stub.

Couvre :
- Limite de taille (under / over / streaming non gourmand en RAM).
- Validation MIME (allow-list).
- Scanner ClamAV en mode désactivé (no-op) vs activé sans socket (fail-closed).

Aucune dépendance Docker / ClamAV réelle : si un scan EICAR live est voulu,
il faudra l'écrire dans un fichier séparé avec ``pytest.mark.skipif``.
"""

from __future__ import annotations

import io
from typing import Any

import pytest
from app.adapters.antivirus.clamav import ScanResult, scan_bytes
from app.core.config import Settings
from app.core.security.upload_guard import (
    UploadInvalidMimeError,
    UploadMalwareDetectedError,
    UploadTooLargeError,
    validate_upload,
)
from starlette.datastructures import Headers, UploadFile

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_settings(
    *,
    clamav_enabled: bool = False,
    clamav_unix_socket: str = "/nonexistent/clamd.sock",
    upload_max_size_bytes: int = 50 * 1024 * 1024,
) -> Settings:
    """Settings minimaux pour exercer le guard sans toucher la DB."""
    return Settings(  # type: ignore[call-arg]
        jwt_secret_key="x" * 32,
        database_url="postgresql+asyncpg://u:p@h/db",
        clamav_enabled=clamav_enabled,
        clamav_unix_socket=clamav_unix_socket,
        upload_max_size_bytes=upload_max_size_bytes,
    )


def _make_upload(
    data: bytes,
    *,
    content_type: str = "application/pdf",
    filename: str = "piece.pdf",
) -> UploadFile:
    """UploadFile in-memory simulant un fichier multipart."""
    return UploadFile(
        file=io.BytesIO(data),
        size=len(data),
        filename=filename,
        headers=Headers({"content-type": content_type}),
    )


class _TracedReader:
    """BytesIO instrumenté pour traquer la quantité totale lue.

    Permet de vérifier qu'on coupe en streaming au lieu de tout charger.
    """

    def __init__(self, data: bytes) -> None:
        self._buf = io.BytesIO(data)
        self.total_read = 0

    def read(self, size: int = -1) -> bytes:
        chunk = self._buf.read(size)
        self.total_read += len(chunk)
        return chunk

    def seek(self, offset: int, whence: int = 0) -> int:
        return self._buf.seek(offset, whence)

    def close(self) -> None:
        self._buf.close()

    # Attributs nécessaires à Starlette pour traiter ``file`` comme BinaryIO.
    def tell(self) -> int:
        return self._buf.tell()

    @property
    def closed(self) -> bool:
        return self._buf.closed


# ---------------------------------------------------------------------------
# validate_upload — taille
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_validate_upload_under_limit_returns_bytes() -> None:
    payload = b"x" * (1024 * 1024)  # 1 MB
    upload = _make_upload(payload, content_type="application/pdf")
    settings = _make_settings()

    data = await validate_upload(upload, settings)

    assert data == payload
    assert len(data) == 1024 * 1024


@pytest.mark.asyncio
async def test_validate_upload_over_limit_raises() -> None:
    payload = b"y" * (51 * 1024 * 1024)  # 51 MB > défaut 50 MB
    upload = _make_upload(payload, content_type="application/pdf")
    settings = _make_settings()

    with pytest.raises(UploadTooLargeError) as exc_info:
        await validate_upload(upload, settings)

    assert exc_info.value.max_size == 50 * 1024 * 1024


@pytest.mark.asyncio
async def test_validate_upload_streaming_does_not_load_full_file_in_memory() -> None:
    """Vérifie qu'on n'ingère pas tout le fichier avant de refuser.

    Avec ``max_size=2 MB`` et un payload de 10 MB, on doit cesser de lire
    dès qu'on dépasse — au pire ``max_size + 1 chunk`` (1 MB) octets.
    """
    payload = b"z" * (10 * 1024 * 1024)
    reader = _TracedReader(payload)
    upload = UploadFile(
        file=reader,  # type: ignore[arg-type]
        size=len(payload),
        filename="huge.pdf",
        headers=Headers({"content-type": "application/pdf"}),
    )
    settings = _make_settings(upload_max_size_bytes=2 * 1024 * 1024)

    with pytest.raises(UploadTooLargeError):
        await validate_upload(upload, settings)

    # Tolérance : max_size (2 MB) + un dernier chunk de lecture (1 MB).
    assert reader.total_read <= 2 * 1024 * 1024 + 1024 * 1024


# ---------------------------------------------------------------------------
# validate_upload — MIME
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_validate_upload_mime_not_allowed_raises() -> None:
    upload = _make_upload(
        b"MZ\x90\x00",  # début d'un exécutable Windows
        content_type="application/x-msdownload",
        filename="malware.exe",
    )
    settings = _make_settings()

    with pytest.raises(UploadInvalidMimeError) as exc_info:
        await validate_upload(upload, settings)

    assert exc_info.value.received == "application/x-msdownload"
    assert "application/pdf" in exc_info.value.allowed


@pytest.mark.asyncio
async def test_validate_upload_pdf_accepted() -> None:
    upload = _make_upload(b"%PDF-1.7\n", content_type="application/pdf")
    settings = _make_settings()

    data = await validate_upload(upload, settings)

    assert data.startswith(b"%PDF-1.7")


@pytest.mark.asyncio
async def test_validate_upload_missing_mime_rejected() -> None:
    """Un upload sans Content-Type doit aussi être refusé (no implicit trust)."""
    upload = UploadFile(
        file=io.BytesIO(b"hello"),
        size=5,
        filename="anon",
        headers=Headers({}),
    )
    settings = _make_settings()

    with pytest.raises(UploadInvalidMimeError):
        await validate_upload(upload, settings)


# ---------------------------------------------------------------------------
# ClamAV adapter — désactivé / fail-closed
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_clamav_disabled_returns_clean() -> None:
    settings = _make_settings(clamav_enabled=False)

    result = await scan_bytes(b"hello world", settings)

    assert result == ScanResult(clean=True, virus_name=None, scanner_version="disabled")


@pytest.mark.asyncio
async def test_clamav_enabled_unavailable_socket_raises() -> None:
    """Fail-closed : si le socket n'existe pas, on bloque l'upload."""
    settings = _make_settings(
        clamav_enabled=True,
        clamav_unix_socket="/nonexistent/clamd.ctl",
    )

    with pytest.raises(UploadMalwareDetectedError) as exc_info:
        await scan_bytes(b"any-bytes", settings)

    assert exc_info.value.virus_name == "scanner_unavailable"


@pytest.mark.asyncio
async def test_validate_upload_blocks_when_clamav_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """validate_upload doit propager UploadMalwareDetectedError si scanner KO."""
    settings = _make_settings(clamav_enabled=True)
    upload = _make_upload(b"%PDF-1.7\n", content_type="application/pdf")

    async def _fake_scan(_data: bytes, _settings: Settings) -> ScanResult:
        raise UploadMalwareDetectedError("scanner_unavailable")

    monkeypatch.setattr(
        "app.adapters.antivirus.clamav.scan_bytes",
        _fake_scan,
    )

    with pytest.raises(UploadMalwareDetectedError):
        await validate_upload(upload, settings)


@pytest.mark.asyncio
async def test_validate_upload_blocks_on_virus_verdict(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Si le scanner renvoie clean=False, on lève UploadMalwareDetectedError."""
    settings = _make_settings(clamav_enabled=True)
    upload = _make_upload(b"%PDF-1.7\n", content_type="application/pdf")

    async def _fake_scan(_data: bytes, _settings: Settings) -> ScanResult:
        return ScanResult(clean=False, virus_name="Eicar-Test-Signature", scanner_version="1.0")

    monkeypatch.setattr(
        "app.adapters.antivirus.clamav.scan_bytes",
        _fake_scan,
    )

    with pytest.raises(UploadMalwareDetectedError) as exc_info:
        await validate_upload(upload, settings)

    assert exc_info.value.virus_name == "Eicar-Test-Signature"


# ---------------------------------------------------------------------------
# Optionnel : scan EICAR live si clamd est joignable localement.
# ---------------------------------------------------------------------------


def _clamd_socket_available() -> bool:
    import os

    candidates = (
        "/var/run/clamav/clamd.ctl",
        "/opt/homebrew/var/run/clamav/clamd.sock",
        "/tmp/clamd.socket",  # noqa: S108 — chemin standard clamd.local sur macOS
    )
    return any(os.path.exists(path) for path in candidates)


@pytest.mark.skipif(
    not _clamd_socket_available(),
    reason="clamd local non détecté — test EICAR live ignoré.",
)
@pytest.mark.asyncio
async def test_clamav_scans_eicar_live() -> None:  # pragma: no cover — environnement local
    """Avec un clamd local, le motif EICAR doit être détecté."""
    settings_kwargs: dict[str, Any] = {"clamav_enabled": True}
    settings = _make_settings(**settings_kwargs)
    eicar = (
        rb"X5O!P%@AP[4\PZX54(P^)7CC)7}"
        rb"$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
    )

    with pytest.raises(UploadMalwareDetectedError):
        await scan_bytes(eicar, settings)
