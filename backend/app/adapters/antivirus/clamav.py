"""Client ClamAV minimal — protocole INSTREAM, sans dépendance externe.

Implémente le strict nécessaire pour scanner un buffer en mémoire via
``clamd``. Unix socket préféré (POSIX standard sur Ubuntu :
``/var/run/clamav/clamd.ctl``) avec fallback TCP optionnel.

Le protocole INSTREAM est documenté dans ``man clamd`` :

    nINSTREAM\\0
    <uint32 BE: taille chunk><chunk bytes>
    ...
    <uint32 BE: 0>  # sentinelle de fin
    <- réponse: "stream: OK\\n" ou "stream: <Nom-Virus> FOUND\\n"

On reste fail-closed : si le scan est activé mais le scanner indisponible
(socket fermé, timeout, EOF prématuré), on lève
:class:`UploadMalwareDetectedError` avec ``virus_name="scanner_unavailable"``
pour bloquer l'upload — un scanner muet ne doit jamais laisser passer un
fichier.
"""

from __future__ import annotations

import asyncio
import struct
from dataclasses import dataclass

from app.core.config import Settings
from app.core.logging import get_logger
from app.core.security.upload_guard import UploadMalwareDetectedError

logger = get_logger(__name__)

# Taille max d'un chunk INSTREAM. ClamAV refuse au-delà de StreamMaxLength
# (défaut 25 MB). 64 KB est un compromis sûr.
_INSTREAM_CHUNK = 64 * 1024
_INSTREAM_TERMINATOR = struct.pack("!I", 0)


@dataclass(frozen=True)
class ScanResult:
    """Résultat d'un scan antivirus."""

    clean: bool
    virus_name: str | None
    scanner_version: str | None


async def scan_bytes(data: bytes, settings: Settings) -> ScanResult:
    """Scanne un buffer via ClamAV INSTREAM.

    Si ``settings.clamav_enabled`` est ``False``, court-circuite et renvoie
    un résultat « clean » avec ``scanner_version="disabled"`` — c'est au
    caller de décider d'appeler ou non, on garde l'API uniforme.

    Lève :class:`UploadMalwareDetectedError` si :
    - le scanner détecte un virus (``virus_name=<nom-virus>``)
    - le scanner est injoignable / timeout (``virus_name="scanner_unavailable"``)
    """
    if not settings.clamav_enabled:
        return ScanResult(clean=True, virus_name=None, scanner_version="disabled")

    timeout = float(settings.clamav_timeout_seconds)
    try:
        response = await asyncio.wait_for(_instream_scan(data, settings), timeout=timeout)
    except TimeoutError as err:
        logger.warning("clamav_timeout", timeout_seconds=timeout)
        raise UploadMalwareDetectedError("scanner_unavailable") from err
    except (OSError, ConnectionError, EOFError) as err:
        # Socket Unix manquant, connexion refusée, EOF prématuré...
        logger.warning("clamav_unavailable", error=str(err))
        raise UploadMalwareDetectedError("scanner_unavailable") from err

    return _parse_response(response)


async def _instream_scan(data: bytes, settings: Settings) -> bytes:
    """Ouvre la connexion clamd, envoie INSTREAM, retourne la réponse brute."""
    reader, writer = await _connect(settings)
    try:
        # Préfixe "n" = délimiteur par ``\n`` (plus tolérant que "z" + \0).
        writer.write(b"nINSTREAM\n")
        await writer.drain()

        # Chunks de taille préfixée big-endian (network order).
        for offset in range(0, len(data), _INSTREAM_CHUNK):
            chunk = data[offset : offset + _INSTREAM_CHUNK]
            writer.write(struct.pack("!I", len(chunk)))
            writer.write(chunk)
        writer.write(_INSTREAM_TERMINATOR)
        await writer.drain()

        # clamd répond une seule ligne terminée par \n.
        response = await reader.readline()
        if not response:
            raise EOFError("clamd a fermé la connexion sans répondre")
        return response
    finally:
        try:
            writer.close()
            await writer.wait_closed()
        except (OSError, ConnectionError):
            # Best-effort cleanup : la connexion peut déjà être tombée.
            logger.debug("clamav_cleanup_failed", exc_info=True)


async def _connect(
    settings: Settings,
) -> tuple[asyncio.StreamReader, asyncio.StreamWriter]:
    """Connecte au clamd : TCP si configuré, sinon Unix socket."""
    if settings.clamav_tcp_host:
        return await asyncio.open_connection(
            host=settings.clamav_tcp_host,
            port=settings.clamav_tcp_port,
        )
    return await asyncio.open_unix_connection(path=settings.clamav_unix_socket)


def _parse_response(response: bytes) -> ScanResult:
    """Parse la réponse INSTREAM de clamd.

    Formats attendus :
    - ``stream: OK``
    - ``stream: <virus-name> FOUND``
    - ``stream: <message> ERROR``
    """
    text = response.decode("utf-8", errors="replace").strip()
    if text.endswith("OK"):
        return ScanResult(clean=True, virus_name=None, scanner_version=None)
    if text.endswith("FOUND"):
        # Exemple : "stream: Eicar-Test-Signature FOUND"
        body = text.split(":", 1)[1].strip() if ":" in text else text
        virus_name = body.removesuffix("FOUND").strip()
        raise UploadMalwareDetectedError(virus_name or "unknown_virus")
    # Anything else (notably ERROR) = scanner muet/HS => fail-closed.
    logger.warning("clamav_unexpected_response", response=text[:200])
    raise UploadMalwareDetectedError("scanner_unavailable")


__all__ = ["ScanResult", "scan_bytes"]
