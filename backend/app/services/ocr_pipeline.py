"""Pipeline OCR — orchestrateur entre `DocumentExtractionPort` et la DB.

Lance une extraction synchrone depuis un upload, persiste le run + les
champs extraits, met à jour le statut du document. Pour traitement
asynchrone, ce service peut être appelé depuis un worker arq (V2).
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.ocr import DocumentExtractionPort, get_ocr_adapter
from app.adapters.storage import get_storage_adapter
from app.core.audit import AuditWriter
from app.core.errors import NotFoundError
from app.models.document import (
    Document,
    DocumentAnalysisRun,
    DocumentExtractedField,
    DocumentVersion,
)
from app.models.file_object import FileObject


async def run_extraction(
    session: AsyncSession,
    *,
    organization_id: UUID,
    document_id: UUID,
    actor_user_id: UUID | None,
    audit: AuditWriter,
    adapter: DocumentExtractionPort | None = None,
) -> DocumentAnalysisRun:
    """Lance une extraction OCR sur la dernière version du document.

    Lit les bytes via le `ObjectStoragePort` configuré, applique le
    `DocumentExtractionPort` configuré, persiste le résultat en DB.
    """
    adapter = adapter or get_ocr_adapter()
    storage = get_storage_adapter()

    document = (
        await session.execute(select(Document).where(Document.document_id == document_id))
    ).scalar_one_or_none()
    if document is None:
        raise NotFoundError("Document introuvable.", code="DOCUMENT_NOT_FOUND")

    # Dernière version + fichier
    version = (
        await session.execute(
            select(DocumentVersion)
            .where(DocumentVersion.document_id == document_id)
            .order_by(DocumentVersion.version_no.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if version is None:
        raise NotFoundError(
            "Aucune version chargée pour ce document.",
            code="DOCUMENT_VERSION_NOT_FOUND",
        )
    file_obj = (
        await session.execute(select(FileObject).where(FileObject.file_id == version.file_id))
    ).scalar_one_or_none()
    if file_obj is None:
        raise NotFoundError("Fichier introuvable.", code="FILE_NOT_FOUND")

    stored = await storage.get(object_key=file_obj.object_key)

    # Run d'analyse — créé en RUNNING avant l'appel adapter
    run = DocumentAnalysisRun(
        organization_id=organization_id,
        document_id=document.document_id,
        document_version_id=version.document_version_id,
        pipeline_stage="FULL",
        analysis_status="RUNNING",
        provider_name=adapter.provider_name,
        started_at=datetime.now(tz=UTC),
        created_by_user_id=actor_user_id,
    )
    session.add(run)
    await session.flush([run])

    result = await adapter.extract(
        document_bytes=stored.content,
        document_type_code=document.document_type,
        mime_type=file_obj.mime_type,
    )

    run.model_name = result.model_name
    run.language_code = result.language_code
    run.classified_document_type = result.classified_document_type
    run.confidence_score = result.confidence_score
    run.summary_text = result.summary_text
    run.ocr_text = result.ocr_text
    run.error_code = result.error_code
    run.error_message = result.error_message
    run.raw_payload = result.raw_payload
    run.completed_at = datetime.now(tz=UTC)
    run.analysis_status = (
        "FAILED"
        if result.error_code
        else ("REVIEW_REQUIRED" if result.needs_human_review else "COMPLETED")
    )

    # Champs extraits
    for ef in result.fields:
        session.add(
            DocumentExtractedField(
                organization_id=organization_id,
                document_analysis_run_id=run.document_analysis_run_id,
                document_id=document.document_id,
                field_name=ef.field_name,
                field_label=ef.field_label,
                field_type=ef.field_type,
                field_value_text=ef.value_text,
                field_value_date=ef.value_date,
                field_value_number=ef.value_number,
                field_value_boolean=ef.value_boolean,
                field_value_json=ef.value_json,
                confidence_score=ef.confidence_score,
                source_page=ef.source_page,
            )
        )

    document.analysis_status = run.analysis_status
    document.last_analysis_at = run.completed_at
    await session.flush()

    await audit.record(
        action="DOCUMENT_OCR_RUN",
        target_type="document_analysis_run",
        target_id=str(run.document_analysis_run_id),
        after={
            "document_id": str(document_id),
            "provider": adapter.provider_name,
            "analysis_status": run.analysis_status,
            "fields_count": len(result.fields),
            "confidence_score": (str(result.confidence_score) if result.confidence_score else None),
        },
    )
    return run
