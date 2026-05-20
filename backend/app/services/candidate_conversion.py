"""Conversion candidat HIRED → agent dans le SI RH (PY-054).

Pipeline transactionnel :
1. La candidature doit être en statut HIRED.
2. Génération d'un matricule unique (PRM-NNNN).
3. Création de l'`Employee` avec les données du candidat (nom, email, phone).
4. Liaison `application.metadata.converted_employee_id`.
5. Audit `CANDIDATE_CONVERTED_TO_EMPLOYEE`.

Règle métier roadmap : les pièces validées (documents) sont transférées
plus tard via un endpoint séparé — la conversion ne crée que l'employé.
"""

from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError
from app.models.employee import Employee
from app.models.recruitment import RecruitmentApplication


@dataclass(frozen=True, slots=True)
class ConversionResult:
    employee_id: UUID
    matricule: str
    application_id: UUID


async def _next_matricule(session: AsyncSession, organization_id: UUID) -> str:
    """Génère un matricule séquentiel `PRM-NNNN`."""
    count = (
        await session.execute(
            select(func.count())
            .select_from(Employee)
            .where(
                Employee.organization_id == organization_id,
                Employee.matricule.startswith("PRM-"),
            )
        )
    ).scalar_one()
    return f"PRM-{int(count) + 1:04d}"


async def convert_application_to_employee(
    session: AsyncSession,
    *,
    organization_id: UUID,
    application_id: UUID,
    actor_user_id: UUID,
    audit: AuditWriter,
    contract_type: str | None = None,
) -> ConversionResult:
    """Crée un employé à partir d'une candidature HIRED."""
    application = (
        await session.execute(
            select(RecruitmentApplication).where(
                RecruitmentApplication.application_id == application_id
            )
        )
    ).scalar_one_or_none()
    if application is None:
        raise NotFoundError("Candidature introuvable.", code="APPLICATION_NOT_FOUND")
    if application.application_status != "HIRED":
        raise ConflictError(
            f"Conversion impossible : statut={application.application_status} (HIRED requis).",
            code="APPLICATION_NOT_HIRED",
        )
    metadata = dict(application.application_metadata or {})
    if metadata.get("converted_employee_id"):
        raise ConflictError(
            "Cette candidature a déjà été convertie en employé.",
            code="ALREADY_CONVERTED",
            details={"converted_employee_id": metadata["converted_employee_id"]},
        )

    matricule = await _next_matricule(session, organization_id)
    employee = Employee(
        organization_id=organization_id,
        matricule=matricule,
        full_name=application.candidate_full_name,
        email=application.candidate_email,
        phone=application.candidate_phone,
        national_id=application.identity_number,
        employment_status="ACTIVE",
        contract_type=contract_type,
        employee_metadata={
            "source_application_id": str(application_id),
            "source_campaign_id": (
                str(application.campaign_id) if application.campaign_id else None
            ),
            "converted_by_user_id": str(actor_user_id),
        },
    )
    session.add(employee)
    await session.flush([employee])

    metadata["converted_employee_id"] = str(employee.employee_id)
    metadata["converted_matricule"] = matricule
    application.application_metadata = metadata
    await session.flush()

    await audit.record(
        action="CANDIDATE_CONVERTED_TO_EMPLOYEE",
        target_type="recruitment_application",
        target_id=str(application_id),
        after={
            "employee_id": str(employee.employee_id),
            "matricule": matricule,
            "candidate_full_name": application.candidate_full_name,
        },
    )
    return ConversionResult(
        employee_id=employee.employee_id,
        matricule=matricule,
        application_id=application_id,
    )
