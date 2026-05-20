"""Adapter OCR Tesseract — solution souveraine on-prem.

Utilise `pytesseract` (binding du moteur Tesseract OCR open-source) pour
extraire le texte brut, puis applique des règles regex/heuristiques par
type de document pour identifier les champs typés (date, numéro, etc.).

Avantages :
- 100 % local, aucune donnée n'est envoyée à un cloud étranger.
- Gratuit, pas de quota.
- Supporte le français + arabe + langues régionales (configurable).

Limites :
- Précision inférieure à Azure Form Recognizer pour les documents
  manuscrits ou de qualité dégradée.
- Nécessite l'installation du binaire `tesseract` sur la machine cible
  (`apt-get install tesseract-ocr tesseract-ocr-fra tesseract-ocr-ara`).

L'import est paresseux pour permettre au backend de booter sans
Tesseract installé (le sélecteur `OCR_PROVIDER=mock` reste fonctionnel).
"""

from __future__ import annotations

import re
from datetime import date
from decimal import Decimal

from app.adapters.ocr.port import (
    DocumentExtractionPort,
    ExtractedField,
    ExtractionResult,
)


class TesseractOcrAdapter(DocumentExtractionPort):
    provider_name = "tesseract"

    def __init__(self, lang: str = "fra+eng") -> None:
        self.lang = lang

    async def extract(
        self,
        *,
        document_bytes: bytes,
        document_type_code: str | None = None,
        mime_type: str | None = None,
        language_hint: str | None = None,
    ) -> ExtractionResult:
        # Import paresseux — n'échoue qu'à l'appel, pas au boot
        try:
            from io import BytesIO

            import pytesseract
            from PIL import Image
        except ImportError as exc:
            return ExtractionResult(
                provider_name=self.provider_name,
                model_name=None,
                language_code=None,
                classified_document_type=document_type_code,
                confidence_score=None,
                summary_text=None,
                ocr_text=None,
                error_code="TESSERACT_NOT_INSTALLED",
                error_message=(
                    "pytesseract / Pillow non installé. "
                    "`uv add pytesseract pillow` + binaire Tesseract requis."
                ),
                needs_human_review=True,
                raw_payload={"import_error": str(exc)},
            )

        # OCR du flux d'octets
        try:
            image = Image.open(BytesIO(document_bytes))
            lang = language_hint or self.lang
            ocr_text = pytesseract.image_to_string(image, lang=lang)
        except Exception as exc:
            return ExtractionResult(
                provider_name=self.provider_name,
                model_name=None,
                language_code=language_hint,
                classified_document_type=document_type_code,
                confidence_score=None,
                summary_text=None,
                ocr_text=None,
                error_code="OCR_FAILED",
                error_message=str(exc),
                needs_human_review=True,
                raw_payload={"exception": type(exc).__name__},
            )

        fields = _extract_fields_by_type(ocr_text, document_type_code or "GENERIC")

        return ExtractionResult(
            provider_name=self.provider_name,
            model_name=f"tesseract-{lang}",
            language_code=lang.split("+")[0],
            classified_document_type=document_type_code,
            confidence_score=Decimal("0.80"),  # estimation conservative
            summary_text=ocr_text[:300] if ocr_text else None,
            ocr_text=ocr_text,
            fields=fields,
            raw_payload={"ocr_length_chars": len(ocr_text or "")},
            needs_human_review=True,  # Tesseract → toujours review humaine
        )


# ============================================================================
# Heuristiques par type de document (post-OCR)
# ============================================================================
_DATE_RE = re.compile(r"\b(\d{1,2})[\/\-\s.](\d{1,2})[\/\-\s.](\d{2,4})\b")
_YEAR_RE = re.compile(r"\b(19[5-9]\d|20[0-3]\d)\b")


def _extract_fields_by_type(text: str, doc_type: str) -> list[ExtractedField]:
    """Applique des règles regex pour extraire les champs typés du texte OCR."""
    fields: list[ExtractedField] = []
    upper = doc_type.upper()

    # Date — premier match
    date_match = _DATE_RE.search(text)
    if date_match:
        try:
            day, month, year = (
                int(date_match.group(1)),
                int(date_match.group(2)),
                int(date_match.group(3)),
            )
            if year < 100:
                year += 2000 if year < 30 else 1900
            extracted = date(year, month, day)
            field_name = "birth_date" if "BIRTH" in upper or "NAISS" in upper else "date"
            fields.append(
                ExtractedField(
                    field_name=field_name,
                    field_type="DATE",
                    value_date=extracted,
                    confidence_score=Decimal("0.75"),
                )
            )
        except (ValueError, IndexError):
            pass

    # Année (typiquement diplôme)
    if "DIPLOM" in upper:
        year_match = _YEAR_RE.search(text)
        if year_match:
            fields.append(
                ExtractedField(
                    field_name="graduation_year",
                    field_type="NUMBER",
                    value_number=Decimal(year_match.group(1)),
                    confidence_score=Decimal("0.80"),
                )
            )

    # Nom / Prénom : on prend les 2 premières lignes capitalisées
    capitalized_lines = [
        line.strip()
        for line in text.split("\n")
        if line.strip() and line.strip().isupper() and 3 <= len(line.strip()) <= 60
    ]
    if capitalized_lines and ("BIRTH" in upper or "NAISS" in upper):
        fields.append(
            ExtractedField(
                field_name="full_name_uppercase",
                field_type="TEXT",
                value_text=capitalized_lines[0],
                confidence_score=Decimal("0.65"),
            )
        )

    return fields
