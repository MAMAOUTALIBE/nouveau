"""Génération de dossier agent PDF + signature électronique.

Pipeline :
1. Charge l'agent + ses affectations.
2. Rend le PDF via `PdfRenderer` (WeasyPrint si dispo, sinon minimal).
3. Signe le PDF via `SignaturePort` (Mock SHA-256 en V1, Endesive PAdES en prod).
4. Persiste un `EmployeeDossierExport` avec `signature_hash` + `verification_code`.
5. (Optionnel) Stocke le PDF via `ObjectStoragePort` et lie le `file_id`.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.pdf import get_pdf_renderer
from app.adapters.signature import get_signature_adapter
from app.adapters.storage import get_storage_adapter
from app.core.audit import AuditWriter
from app.core.errors import NotFoundError
from app.models.employee import Employee, EmployeeAssignment
from app.models.file_object import FileObject
from app.models.personnel_360 import EmployeeDossierExport


async def generate_signed_dossier(
    session: AsyncSession,
    *,
    organization_id: UUID,
    employee_id: UUID,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> EmployeeDossierExport:
    """Pipeline complet de génération d'un dossier signé."""
    employee = (
        await session.execute(select(Employee).where(Employee.employee_id == employee_id))
    ).scalar_one_or_none()
    if employee is None:
        raise NotFoundError("Agent introuvable.", code="EMPLOYEE_NOT_FOUND")

    assignments = (
        (
            await session.execute(
                select(EmployeeAssignment)
                .where(EmployeeAssignment.employee_id == employee_id)
                .order_by(EmployeeAssignment.effective_start.desc())
                .limit(20)
            )
        )
        .scalars()
        .all()
    )

    # 1. PDF
    renderer = get_pdf_renderer()
    pdf_bytes = renderer.render(
        template_name="dossier_agent.html",
        context={
            "employee": {
                "matricule": employee.matricule,
                "full_name": employee.full_name,
                "employment_status": employee.employment_status,
                "email": str(employee.email) if employee.email else None,
                "phone": employee.phone,
                "contract_type": employee.contract_type,
                "hire_date": (employee.hire_date.isoformat() if employee.hire_date else None),
            },
            "assignments": [
                {
                    "effective_start": a.effective_start.isoformat(),
                    "assignment_status": a.assignment_status,
                    "position_id": str(a.position_id) if a.position_id else None,
                }
                for a in assignments
            ],
            "title": f"Dossier — {employee.full_name}",
            "verification_code": "(signed-below)",
        },
    )

    # 2. Signature
    signer = get_signature_adapter()
    signature = await signer.sign_document(
        document_bytes=pdf_bytes,
        document_reference=f"DOSSIER-{employee.matricule}",
        signer_full_name="Service DRH",
        reason=f"Génération dossier administratif — {employee.full_name}",
    )

    # 3. Storage du PDF signé (ou non-signé selon adapter)
    storage = get_storage_adapter()
    object_key = f"dossiers/{organization_id}/{employee_id}/{uuid4()}.pdf"
    file_metadata = await storage.put(
        object_key=object_key,
        content=signature.signed_document_bytes or pdf_bytes,
        mime_type="application/pdf",
        original_filename=f"dossier_{employee.matricule}.pdf",
    )

    # 4. Persistance file_object + dossier_export
    file_obj = FileObject(
        organization_id=organization_id,
        storage_provider=file_metadata.storage_provider,
        bucket_name=file_metadata.bucket_name,
        object_key=file_metadata.object_key,
        mime_type=file_metadata.mime_type,
        byte_size=file_metadata.byte_size,
        sha256=file_metadata.sha256,
        original_filename=file_metadata.original_filename,
        uploaded_by_user_id=actor_user_id,
    )
    session.add(file_obj)
    await session.flush([file_obj])

    export = EmployeeDossierExport(
        organization_id=organization_id,
        employee_id=employee_id,
        file_id=file_obj.file_id,
        export_format="PDF",
        signature_hash=signature.signature_hash,
        verification_code=signature.verification_code,
        exported_by_user_id=actor_user_id,
        exported_at=datetime.now(tz=UTC),
        export_metadata={
            "signature_provider": signature.provider_name,
            "envelope_status": signature.envelope_status,
            "renderer": renderer.provider_name,
        },
    )
    session.add(export)
    await session.flush([export])

    await audit.record(
        action="EMPLOYEE_DOSSIER_EXPORTED",
        target_type="employee_dossier_export",
        target_id=str(export.dossier_export_id),
        after={
            "employee_id": str(employee_id),
            "verification_code": signature.verification_code,
            "signature_provider": signature.provider_name,
            "renderer": renderer.provider_name,
            "object_key": file_metadata.object_key,
        },
    )
    return export
