"""Seed de démonstration — module Personnel.

Peuple les données du module Personnel pour le développement local :

  1. Unités (~6) et postes (~10) sous la direction démo DGCAB.
  2. Rattachement des agents existants à une unité + un poste.
  3. Affectations (~10) — table `employee_assignments`.
  4. Dossiers administratifs (~10) — `documents` + `file_objects`
     + `document_versions` + `document_links`.
  5. Mouvements de carrière (~10) — table `employee_movements`.

Idempotent : ré-exécutable sans créer de doublon.

Exécution :

    cd backend
    uv run python -m scripts.seed_demo_personnel

Pré-requis : `scripts.seed_initial` puis `scripts.seed_demo_employees`.
"""

from __future__ import annotations

import asyncio
from datetime import date
from uuid import UUID

from app.core.db import session_scope
from app.models.document import Document, DocumentType, DocumentVersion, DocumentLink
from app.models.employee import Employee, EmployeeAssignment, EmployeeMovement
from app.models.file_object import FileObject
from app.models.organization import Direction, Organization, Unit
from app.models.position import Position
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Référentiel : unités et postes
# ---------------------------------------------------------------------------
DEMO_UNITS: tuple[tuple[str, str], ...] = (
    ("U-SG", "Secrétariat Général"),
    ("U-RH", "Service des Ressources Humaines"),
    ("U-FIN", "Service Financier"),
    ("U-JUR", "Service Juridique"),
    ("U-COM", "Service Communication"),
    ("U-INFO", "Service Informatique"),
)

# (code, intitulé, grade, index de l'unité de rattachement)
DEMO_POSITIONS: tuple[tuple[str, str, str, int], ...] = (
    ("P-DIR", "Directeur de cabinet", "A1", 0),
    ("P-CHEF-SG", "Chef du secrétariat général", "A2", 0),
    ("P-RH-MGR", "Responsable des ressources humaines", "A2", 1),
    ("P-RH-GEST", "Gestionnaire des ressources humaines", "B1", 1),
    ("P-FIN-MGR", "Chef comptable", "A2", 2),
    ("P-FIN-AGT", "Agent comptable", "B1", 2),
    ("P-JUR-CONS", "Conseiller juridique", "A2", 3),
    ("P-COM-CHARGE", "Chargé de communication", "B1", 4),
    ("P-INFO-ADMIN", "Administrateur systèmes et réseaux", "A2", 5),
    ("P-SEC-ADMIN", "Secrétaire administratif", "C1", 0),
)

MOVEMENT_PLAN: tuple[tuple[str, str, str], ...] = (
    ("PROMOTION", "EXECUTED", "Promotion au grade supérieur"),
    ("TRANSFER", "EXECUTED", "Mutation interne entre services"),
    ("RECLASSIFICATION", "APPROVED", "Reclassement indiciaire"),
    ("SECONDMENT", "EXECUTED", "Détachement temporaire"),
    ("PROMOTION", "APPROVED", "Avancement d'échelon"),
    ("TRANSFER", "DRAFT", "Demande de mutation en cours"),
    ("RECLASSIFICATION", "EXECUTED", "Reclassement après formation"),
    ("PROMOTION", "EXECUTED", "Nomination à un poste de responsabilité"),
    ("TRANSFER", "EXECUTED", "Affectation dans une nouvelle unité"),
    ("SECONDMENT", "APPROVED", "Mise à disposition d'un autre service"),
)


async def _get_organization(session: AsyncSession) -> Organization:
    org = (
        await session.execute(select(Organization).where(Organization.code == "PRIMATURE"))
    ).scalar_one_or_none()
    if org is None:
        raise SystemExit("Organisation PRIMATURE introuvable. Lancez d'abord scripts.seed_initial.")
    return org


async def _get_direction(session: AsyncSession, *, organization_id: UUID) -> Direction:
    direction = (
        await session.execute(
            select(Direction).where(
                Direction.organization_id == organization_id,
                Direction.code == "DGCAB",
            )
        )
    ).scalar_one_or_none()
    if direction is None:
        raise SystemExit("Direction démo DGCAB introuvable. Lancez d'abord scripts.seed_initial.")
    return direction


async def _ensure_units(
    session: AsyncSession, *, organization_id: UUID, direction_id: UUID
) -> tuple[list[Unit], int]:
    units: list[Unit] = []
    created = 0
    for code, name in DEMO_UNITS:
        unit = (
            await session.execute(
                select(Unit).where(Unit.organization_id == organization_id, Unit.code == code)
            )
        ).scalar_one_or_none()
        if unit is None:
            unit = Unit(
                organization_id=organization_id,
                direction_id=direction_id,
                code=code,
                name=name,
            )
            session.add(unit)
            await session.flush([unit])
            created += 1
        units.append(unit)
    return units, created


async def _ensure_positions(
    session: AsyncSession,
    *,
    organization_id: UUID,
    direction_id: UUID,
    units: list[Unit],
) -> tuple[list[Position], int]:
    positions: list[Position] = []
    created = 0
    for code, title, grade, unit_idx in DEMO_POSITIONS:
        position = (
            await session.execute(
                select(Position).where(
                    Position.organization_id == organization_id, Position.code == code
                )
            )
        ).scalar_one_or_none()
        if position is None:
            position = Position(
                organization_id=organization_id,
                direction_id=direction_id,
                unit_id=units[unit_idx].unit_id,
                code=code,
                title=title,
                grade=grade,
                position_status="FILLED",
                budgeted_headcount=1,
            )
            session.add(position)
            await session.flush([position])
            created += 1
        positions.append(position)
    return positions, created


async def _link_employees(
    employees: list[Employee], units: list[Unit], positions: list[Position]
) -> int:
    """Rattache chaque agent à une unité + un poste (round-robin) si non défini."""
    linked = 0
    for index, employee in enumerate(employees):
        changed = False
        if employee.unit_id is None:
            employee.unit_id = units[index % len(units)].unit_id
            changed = True
        if employee.position_id is None:
            employee.position_id = positions[index % len(positions)].position_id
            changed = True
        if changed:
            linked += 1
    return linked


async def _seed_assignments(
    session: AsyncSession, *, organization_id: UUID, direction_id: UUID, employees: list[Employee]
) -> int:
    created = 0
    for employee in employees[:10]:
        existing = (
            await session.execute(
                select(EmployeeAssignment.assignment_id).where(
                    EmployeeAssignment.employee_id == employee.employee_id
                )
            )
        ).first()
        if existing is not None:
            continue
        session.add(
            EmployeeAssignment(
                organization_id=organization_id,
                employee_id=employee.employee_id,
                direction_id=direction_id,
                unit_id=employee.unit_id,
                position_id=employee.position_id,
                assignment_status="ACTIVE",
                effective_start=employee.hire_date or date(2020, 1, 1),
            )
        )
        created += 1
    return created


async def _seed_documents(
    session: AsyncSession, *, organization_id: UUID, employees: list[Employee]
) -> int:
    doc_types = list(
        (
            await session.execute(
                select(DocumentType).where(DocumentType.organization_id == organization_id)
            )
        )
        .scalars()
        .all()
    )
    if not doc_types:
        return 0

    created = 0
    for index, employee in enumerate(employees[:10]):
        reference = f"DOC-{employee.matricule}"
        existing = (
            await session.execute(
                select(Document.document_id).where(
                    Document.organization_id == organization_id,
                    Document.reference == reference,
                )
            )
        ).first()
        if existing is not None:
            continue

        doc_type = doc_types[index % len(doc_types)]

        file_object = FileObject(
            organization_id=organization_id,
            storage_provider="local",
            bucket_name="rh-demo",
            object_key=f"demo/personnel/{employee.matricule}.pdf",
            mime_type="application/pdf",
            byte_size=42_000,
            original_filename=f"{reference}.pdf",
        )
        session.add(file_object)
        await session.flush([file_object])

        document = Document(
            organization_id=organization_id,
            employee_id=employee.employee_id,
            reference=reference,
            title=f"{doc_type.label} — {employee.full_name}",
            document_type=doc_type.code,
            document_type_id=doc_type.document_type_id,
            owner_label=employee.full_name,
            document_status="VALIDATED",
            direction_id=employee.direction_id,
            unit_id=employee.unit_id,
            issued_on=date(2024, 1, 15),
            current_version_no=1,
            source_module="PERSONNEL",
        )
        session.add(document)
        await session.flush([document])

        session.add(
            DocumentVersion(
                document_id=document.document_id,
                version_no=1,
                file_id=file_object.file_id,
            )
        )
        session.add(
            DocumentLink(
                organization_id=organization_id,
                document_id=document.document_id,
                entity_type="EMPLOYEE",
                entity_id=str(employee.employee_id),
                link_role="PRIMARY",
            )
        )
        created += 1
    return created


async def _seed_movements(
    session: AsyncSession, *, organization_id: UUID, employees: list[Employee]
) -> int:
    created = 0
    for index, employee in enumerate(employees[:10]):
        existing = (
            await session.execute(
                select(EmployeeMovement.movement_id).where(
                    EmployeeMovement.employee_id == employee.employee_id
                )
            )
        ).first()
        if existing is not None:
            continue
        movement_type, movement_status, reason = MOVEMENT_PLAN[index % len(MOVEMENT_PLAN)]
        session.add(
            EmployeeMovement(
                organization_id=organization_id,
                employee_id=employee.employee_id,
                movement_type=movement_type,
                movement_status=movement_status,
                to_direction_id=employee.direction_id,
                to_unit_id=employee.unit_id,
                to_position_id=employee.position_id,
                effective_date=date(2025, 6, 1),
                reason=reason,
            )
        )
        created += 1
    return created


async def main() -> None:
    async with session_scope() as session:
        org = await _get_organization(session)
        direction = await _get_direction(session, organization_id=org.organization_id)

        employees = list(
            (
                await session.execute(
                    select(Employee)
                    .where(Employee.organization_id == org.organization_id)
                    .order_by(Employee.matricule)
                )
            )
            .scalars()
            .all()
        )
        if not employees:
            raise SystemExit("Aucun agent. Lancez d'abord scripts.seed_demo_employees.")

        units, units_created = await _ensure_units(
            session, organization_id=org.organization_id, direction_id=direction.direction_id
        )
        positions, positions_created = await _ensure_positions(
            session,
            organization_id=org.organization_id,
            direction_id=direction.direction_id,
            units=units,
        )
        linked = await _link_employees(employees, units, positions)
        assignments_created = await _seed_assignments(
            session,
            organization_id=org.organization_id,
            direction_id=direction.direction_id,
            employees=employees,
        )
        documents_created = await _seed_documents(
            session, organization_id=org.organization_id, employees=employees
        )
        movements_created = await _seed_movements(
            session, organization_id=org.organization_id, employees=employees
        )

    print(  # noqa: T201
        "Seed de démonstration du module Personnel terminé :\n"
        f"  - Unités        : {units_created} créée(s) / {len(DEMO_UNITS)} au total\n"
        f"  - Postes        : {positions_created} créé(s) / {len(DEMO_POSITIONS)} au total\n"
        f"  - Rattachements : {linked} agent(s) rattaché(s) à une unité + un poste\n"
        f"  - Affectations  : {assignments_created} créée(s)\n"
        f"  - Dossiers      : {documents_created} document(s) créé(s)\n"
        f"  - Mouvements    : {movements_created} créé(s)"
    )


if __name__ == "__main__":
    asyncio.run(main())
