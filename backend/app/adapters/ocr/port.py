"""Port (interface) pour l'extraction documentaire."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from decimal import Decimal
from typing import Any, Literal, Protocol

FieldType = Literal["TEXT", "DATE", "NUMBER", "BOOLEAN", "JSON"]


@dataclass(frozen=True, slots=True)
class ExtractedField:
    """Un champ extrait d'un document, typé."""

    field_name: str
    field_type: FieldType
    field_label: str | None = None
    value_text: str | None = None
    value_date: date | None = None
    value_number: Decimal | None = None
    value_boolean: bool | None = None
    value_json: dict[str, Any] | None = None
    confidence_score: Decimal | None = None
    source_page: int | None = None


@dataclass(frozen=True, slots=True)
class ExtractionResult:
    """Résultat d'une extraction OCR/IA sur un document."""

    provider_name: str
    model_name: str | None
    language_code: str | None
    classified_document_type: str | None
    confidence_score: Decimal | None
    summary_text: str | None
    ocr_text: str | None
    fields: list[ExtractedField] = field(default_factory=list)
    raw_payload: dict[str, Any] = field(default_factory=dict)
    needs_human_review: bool = False
    error_code: str | None = None
    error_message: str | None = None


class DocumentExtractionPort(Protocol):
    """Interface qu'un adapter OCR doit implémenter.

    Async-first pour ne pas bloquer l'event loop FastAPI.
    """

    provider_name: str

    async def extract(
        self,
        *,
        document_bytes: bytes,
        document_type_code: str | None = None,
        mime_type: str | None = None,
        language_hint: str | None = None,
    ) -> ExtractionResult: ...
