"""Adapter OCR Mock — déterministe, utile pour tests + démos hors-ligne."""

from __future__ import annotations

from datetime import date
from decimal import Decimal

from app.adapters.ocr.port import (
    DocumentExtractionPort,
    ExtractedField,
    ExtractionResult,
)


class MockOcrAdapter(DocumentExtractionPort):
    """Renvoie des champs cohérents avec le `document_type_code` fourni.

    Permet de tester le pipeline d'extraction de bout en bout sans
    déployer de moteur OCR. Confidence fixe à 0.95.
    """

    provider_name = "mock"

    async def extract(
        self,
        *,
        document_bytes: bytes,
        document_type_code: str | None = None,
        mime_type: str | None = None,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        type_code = (document_type_code or "GENERIC").upper()
        fields: list[ExtractedField] = []

        if type_code in ("BIRTH_CERTIFICATE", "ACTE_NAISSANCE"):
            fields = [
                ExtractedField(
                    field_name="last_name",
                    field_type="TEXT",
                    value_text="DIALLO",
                    confidence_score=Decimal("0.95"),
                ),
                ExtractedField(
                    field_name="first_name",
                    field_type="TEXT",
                    value_text="Mamadou",
                    confidence_score=Decimal("0.95"),
                ),
                ExtractedField(
                    field_name="birth_date",
                    field_type="DATE",
                    value_date=date(1990, 5, 14),
                    confidence_score=Decimal("0.94"),
                ),
                ExtractedField(
                    field_name="birth_place",
                    field_type="TEXT",
                    value_text="Conakry",
                    confidence_score=Decimal("0.92"),
                ),
            ]
        elif type_code in ("DIPLOMA", "DIPLOME_PRINCIPAL"):
            fields = [
                ExtractedField(
                    field_name="degree",
                    field_type="TEXT",
                    value_text="Master en Administration Publique",
                    confidence_score=Decimal("0.91"),
                ),
                ExtractedField(
                    field_name="institution",
                    field_type="TEXT",
                    value_text="Université Gamal Abdel Nasser de Conakry",
                    confidence_score=Decimal("0.93"),
                ),
                ExtractedField(
                    field_name="graduation_year",
                    field_type="NUMBER",
                    value_number=Decimal("2018"),
                    confidence_score=Decimal("0.97"),
                ),
            ]
        elif type_code in ("CONTRACT", "CONTRAT_TRAVAIL"):
            fields = [
                ExtractedField(
                    field_name="hire_date",
                    field_type="DATE",
                    value_date=date(2024, 1, 15),
                    confidence_score=Decimal("0.96"),
                ),
                ExtractedField(
                    field_name="contract_type",
                    field_type="TEXT",
                    value_text="Fonctionnaire",
                    confidence_score=Decimal("0.94"),
                ),
            ]
        else:
            fields = [
                ExtractedField(
                    field_name="raw_text_excerpt",
                    field_type="TEXT",
                    value_text="(extraction Mock — aucun champ structuré)",
                    confidence_score=Decimal("0.50"),
                )
            ]

        return ExtractionResult(
            provider_name=self.provider_name,
            model_name="mock-classifier-v1",
            language_code=language_hint or "fra",
            classified_document_type=type_code,
            confidence_score=Decimal("0.95"),
            summary_text=(
                f"Document {type_code} traité par MockOcrAdapter ({len(document_bytes)} bytes)."
            ),
            ocr_text=None,
            fields=fields,
            raw_payload={"adapter": "mock", "document_bytes_length": len(document_bytes)},
            needs_human_review=False,
        )
