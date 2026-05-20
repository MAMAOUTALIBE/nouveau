"""OCR adapters."""

from app.adapters.ocr.factory import get_ocr_adapter
from app.adapters.ocr.port import (
    DocumentExtractionPort,
    ExtractedField,
    ExtractionResult,
)

__all__ = [
    "DocumentExtractionPort",
    "ExtractedField",
    "ExtractionResult",
    "get_ocr_adapter",
]
