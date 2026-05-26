"""Garde-fous appliqués aux fichiers téléversés.

Trois protections coordonnées :

1. **Taille** : on lit en streaming par chunks et on coupe court dès que
   le seuil est dépassé — pas d'attaque DoS « 4 GB en mémoire » possible.
2. **Type MIME** : on rejette tout ``Content-Type`` hors d'une liste
   explicite (config). On ne fait pas (encore) de magic-bytes sniffing —
   la défense en profondeur reste l'antivirus.
3. **Antivirus** : si ``clamav_enabled``, on scanne le buffer in-memory
   via :mod:`app.adapters.antivirus.clamav` (protocole INSTREAM). Le
   scanner est invoqué après la validation taille+MIME pour ne pas
   gaspiller des cycles sur des inputs déjà refusés.

L'API publique :

- :class:`UploadValidationError` (parent) + sous-classes spécifiques
  pour traduction directe en codes HTTP côté endpoint.
- :func:`validate_upload` : coroutine unique qui orchestre tout et
  renvoie les bytes lus (à passer au service métier qui décide du
  stockage).
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from fastapi import UploadFile

from app.core.config import Settings
from app.core.logging import get_logger

if TYPE_CHECKING:  # pragma: no cover — éviter cycle import à l'exécution.
    pass

logger = get_logger(__name__)

# Chunks de 1 MB : équilibre RAM / nombre d'appels système. ClamAV lui
# refera ses propres chunks (cf. clamav._INSTREAM_CHUNK).
_READ_CHUNK_SIZE = 1024 * 1024


# ---------------------------------------------------------------------------
# Hiérarchie d'exceptions
# ---------------------------------------------------------------------------


class UploadValidationError(Exception):
    """Erreur générique de validation d'upload (parent)."""


class UploadTooLargeError(UploadValidationError):
    """Le fichier dépasse ``upload_max_size_bytes``."""

    def __init__(self, max_size: int) -> None:
        super().__init__(f"upload exceeds {max_size} bytes")
        self.max_size = max_size


class UploadInvalidMimeError(UploadValidationError):
    """Le ``content_type`` n'est pas dans la liste autorisée."""

    def __init__(self, received: str | None, allowed: list[str]) -> None:
        super().__init__(f"mime '{received}' not in allowed list")
        self.received = received
        self.allowed = allowed


class UploadMalwareDetectedError(UploadValidationError):
    """Le scanner a renvoyé un verdict positif OU est injoignable (fail-closed)."""

    def __init__(self, virus_name: str) -> None:
        super().__init__(f"malware detected: {virus_name}")
        self.virus_name = virus_name


# ---------------------------------------------------------------------------
# Validation orchestrée
# ---------------------------------------------------------------------------


async def validate_upload(
    file: UploadFile,
    settings: Settings,
    *,
    max_size: int | None = None,
    allowed_mime_types: list[str] | None = None,
) -> bytes:
    """Valide et retourne les bytes d'un :class:`UploadFile`.

    Ordre des contrôles :

    1. MIME (early-fail : pas la peine de streamer).
    2. Taille en streaming (fail-fast au premier chunk qui déborde).
    3. Antivirus si activé en config.

    Les ``max_size`` / ``allowed_mime_types`` passés en kwargs surchargent
    la config — utile pour les endpoints qui ont des besoins spécifiques.
    """
    limit = max_size if max_size is not None else settings.upload_max_size_bytes
    allowed = (
        [mime.lower() for mime in allowed_mime_types]
        if allowed_mime_types is not None
        else settings.upload_allowed_mime_types_list()
    )

    _check_mime(file, allowed)
    data = await _read_streaming(file, limit)
    _warn_if_size_mismatch(file, len(data))

    if settings.clamav_enabled:
        # Import différé : casse le cycle ``upload_guard`` <-> ``clamav``.
        from app.adapters.antivirus.clamav import scan_bytes

        result = await scan_bytes(data, settings)
        logger.info(
            "antivirus_scan",
            clean=result.clean,
            scanner_version=result.scanner_version,
            byte_size=len(data),
        )
        if not result.clean and result.virus_name:
            raise UploadMalwareDetectedError(result.virus_name)

    return data


# ---------------------------------------------------------------------------
# Détail des contrôles
# ---------------------------------------------------------------------------


def _check_mime(file: UploadFile, allowed: list[str]) -> None:
    """Refuse les ``content_type`` hors liste (case-insensitive)."""
    received = (file.content_type or "").lower().strip() or None
    if received is None or received not in allowed:
        raise UploadInvalidMimeError(received=file.content_type, allowed=allowed)


async def _read_streaming(file: UploadFile, max_size: int) -> bytes:
    """Lit le fichier par chunks de 1 MB et coupe dès qu'on dépasse ``max_size``.

    On lit **au plus** ``max_size + 1`` octet avant de raise : ça permet de
    détecter le débordement sans charger entièrement un fichier malveillant
    en RAM. On ne fait jamais ``await file.read()`` non bornée.
    """
    buffer = bytearray()
    bytes_seen = 0
    while True:
        # Lit toujours un chunk fixe ; on borne via ``bytes_seen`` après coup.
        chunk = await file.read(_READ_CHUNK_SIZE)
        if not chunk:
            break
        bytes_seen += len(chunk)
        if bytes_seen > max_size:
            raise UploadTooLargeError(max_size=max_size)
        buffer.extend(chunk)
    return bytes(buffer)


def _warn_if_size_mismatch(file: UploadFile, actual_size: int) -> None:
    """Log structuré si ``Content-Length`` annoncé ≠ taille réelle lue.

    Pas d'erreur : c'est juste un signal de tampering éventuel, traité en
    aval. Le ``size`` de Starlette est rempli depuis l'en-tête.
    """
    declared = getattr(file, "size", None)
    if declared is None or declared == actual_size:
        return
    logger.warning(
        "upload_size_mismatch",
        filename=file.filename,
        declared=declared,
        actual=actual_size,
    )


__all__ = [
    "UploadInvalidMimeError",
    "UploadMalwareDetectedError",
    "UploadTooLargeError",
    "UploadValidationError",
    "validate_upload",
]
