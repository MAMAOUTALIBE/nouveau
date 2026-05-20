"""Factory de sélection de l'adapter OCR selon `OCR_PROVIDER`."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.ocr.mock import MockOcrAdapter
from app.adapters.ocr.port import DocumentExtractionPort
from app.adapters.ocr.tesseract import TesseractOcrAdapter
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_ocr_adapter() -> DocumentExtractionPort:
    """Renvoie l'adapter OCR configuré (singleton process)."""
    settings = get_settings()
    provider = settings.ocr_provider

    if provider == "tesseract":
        return TesseractOcrAdapter(lang=settings.tesseract_lang)
    if provider in ("azure", "aws"):
        # Stubs : ces adapters arrivent en V2 avec leur SDK respectif
        # (azure-ai-formrecognizer / boto3 textract). En attendant, on
        # tombe sur Mock pour ne pas bloquer le boot.
        return MockOcrAdapter()
    return MockOcrAdapter()
