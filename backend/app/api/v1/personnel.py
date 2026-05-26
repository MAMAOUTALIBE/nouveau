"""Endpoints du domaine Personnel : /api/v1/personnel/*."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.config import Settings, get_settings
from app.core.db import get_session
from app.core.errors import ForbiddenError
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.core.security.upload_guard import (
    UploadInvalidMimeError,
    UploadMalwareDetectedError,
    UploadTooLargeError,
    validate_upload,
)
from app.schemas.common import Page
from app.schemas.personnel import (
    AgentCreateRequest,
    AgentDuplicateCase,
    AgentDuplicateIndexItem,
    AgentListItem,
    AgentMatriculeSuggestionResponse,
    AgentResponse,
    AgentUpdateRequest,
    AssignmentCreateRequest,
    AssignmentResponse,
    DossierExportResponse,
    DossierResponse,
    MatriculeSuggestionAuditItem,
    MergeDuplicateAgentsRequest,
    MergeDuplicateAgentsResult,
    PersonnelUploadedFile,
    RiskLevel,
    TurnoverRiskItem,
)
from app.services import dossier_pdf, personnel_service, turnover_service

router = APIRouter(prefix="/personnel", tags=["personnel"])


# ============================================================================
# Agents
# ============================================================================
@router.get("/agents", response_model=Page[AgentListItem])
async def list_agents(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    employment_status: str | None = Query(None, alias="status"),
    direction_id: UUID | None = None,
    unit_id: UUID | None = None,
    search: str | None = Query(None, alias="q"),
) -> Page[AgentListItem]:
    items, total = await personnel_service.list_agents(
        session,
        organization_id=current_user.organization_id,
        user=current_user,
        page=page,
        page_size=page_size,
        status=employment_status,
        direction_id=direction_id,
        unit_id=unit_id,
        search=search,
    )
    return Page[AgentListItem](items=items, total=total, page=page, page_size=page_size)


@router.post(
    "/agents",
    response_model=AgentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_agent(
    body: AgentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AgentResponse:
    return await personnel_service.create_agent(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


# ============================================================================
# Anti-doublons agents + uploads — déclarés AVANT `/agents/{employee_id}` pour
# que les segments littéraux ne soient pas pris pour des UUID.
# ============================================================================
@router.get("/agents/duplicate-index", response_model=list[AgentDuplicateIndexItem])
async def list_agent_duplicate_index(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[AgentDuplicateIndexItem]:
    """Agents impliqués dans au moins un doublon (email / national_id / nom complet)."""
    return await personnel_service.list_agent_duplicate_index(
        session, organization_id=current_user.organization_id
    )


@router.get("/agents/duplicate-cases", response_model=list[AgentDuplicateCase])
async def list_agent_duplicate_cases(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    duplicate_field: Annotated[str | None, Query(alias="duplicateField")] = None,
) -> list[AgentDuplicateCase]:
    """Cas de doublons groupés par champ (email / identityNumber / fullName)."""
    return await personnel_service.list_agent_duplicate_cases(
        session,
        organization_id=current_user.organization_id,
        duplicate_field=duplicate_field,
    )


@router.post("/agents/merge", response_model=MergeDuplicateAgentsResult)
async def merge_duplicate_agents(
    body: MergeDuplicateAgentsRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> MergeDuplicateAgentsResult:
    """Fusionne deux agents : applique les sources de champs choisies, archive le secondaire."""
    return await personnel_service.merge_duplicate_agents(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        actor_full_name=current_user.full_name,
        audit=audit,
    )


@router.post(
    "/uploads",
    response_model=PersonnelUploadedFile,
    status_code=status.HTTP_201_CREATED,
)
async def upload_personnel_file(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
    settings: Annotated[Settings, Depends(get_settings)],
    file: Annotated[UploadFile, File(description="Pièce à téléverser")],
) -> PersonnelUploadedFile:
    """Téléverse une pièce attachée à un dossier agent (file_objects).

    Le fichier est validé par :func:`validate_upload` (taille, MIME, scan AV
    optionnel) AVANT d'atteindre le service métier — un upload trop gros est
    coupé en streaming sans charger la RAM.
    """
    try:
        content = await validate_upload(file, settings)
    except UploadTooLargeError as err:
        # FastAPI/Starlette : "REQUEST_ENTITY_TOO_LARGE" est déprécié, on
        # utilise la constante moderne. Code HTTP inchangé (413).
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail=(f"Le fichier dépasse la taille maximale autorisée ({err.max_size} octets)."),
        ) from err
    except UploadInvalidMimeError as err:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "message": "Type de fichier non autorisé.",
                "received": err.received,
                "allowed": err.allowed,
            },
        ) from err
    except UploadMalwareDetectedError as err:
        # Audit du scan rejeté (sans le contenu du fichier).
        if settings.clamav_enabled:
            await audit.record(
                action="UPLOAD_ANTIVIRUS_REJECTED",
                target_type="file_object",
                metadata={
                    "filename": file.filename,
                    "mime_type": file.content_type,
                    "verdict": err.virus_name,
                },
                status="FAILURE",
            )
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Fichier rejeté par le scan antivirus.",
        ) from err

    if settings.clamav_enabled:
        await audit.record(
            action="UPLOAD_ANTIVIRUS_PASSED",
            target_type="file_object",
            metadata={
                "filename": file.filename,
                "mime_type": file.content_type,
                "byte_size": len(content),
            },
        )

    return await personnel_service.create_personnel_upload(
        session,
        organization_id=current_user.organization_id,
        uploaded_by_user_id=current_user.user_id,
        original_filename=file.filename or "fichier",
        mime_type=file.content_type,
        content=content,
    )


# ============================================================================
# Suggestion de matricule — DOIT être déclaré avant `/agents/{employee_id}`,
# sinon « matricule-suggestion » est interprété comme un UUID d'employé.
# ============================================================================
@router.get(
    "/agents/matricule-suggestion",
    response_model=AgentMatriculeSuggestionResponse,
)
async def get_matricule_suggestion(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    direction: str | None = None,
    unit: str | None = None,
    reason: str | None = None,
) -> AgentMatriculeSuggestionResponse:
    """Suggère un matricule pour la création d'un nouvel agent + audit la demande."""
    return await personnel_service.suggest_matricule(
        session,
        organization_id=current_user.organization_id,
        requested_by_user_id=current_user.user_id,
        requested_by_username=current_user.username,
        direction=direction,
        unit=unit,
        reason=reason,
    )


@router.get(
    "/agents/matricule-suggestion-audit",
    response_model=list[MatriculeSuggestionAuditItem],
)
async def list_matricule_suggestion_audit(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    username: str | None = None,
    reason: str | None = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
) -> list[MatriculeSuggestionAuditItem]:
    """Historique des suggestions de matricule produites pour l'organisation."""
    return await personnel_service.list_matricule_suggestion_audit(
        session,
        organization_id=current_user.organization_id,
        username=username,
        reason=reason,
        limit=limit,
    )


@router.get("/agents/{employee_id}", response_model=AgentResponse)
async def get_agent(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AgentResponse:
    return await personnel_service.get_agent(session, employee_id=employee_id, user=current_user)


@router.put("/agents/{employee_id}", response_model=AgentResponse)
async def update_agent(
    employee_id: UUID,
    body: AgentUpdateRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AgentResponse:
    return await personnel_service.update_agent(
        session, employee_id=employee_id, body=body, audit=audit
    )


# ============================================================================
# Affectations
# ============================================================================
@router.get("/affectations", response_model=list[AssignmentResponse])
async def list_assignments(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:view", "personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    employee_id: UUID | None = None,
) -> list[AssignmentResponse]:
    return await personnel_service.list_assignments(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
    )


@router.post(
    "/affectations",
    response_model=AssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_assignment(
    body: AssignmentCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> AssignmentResponse:
    return await personnel_service.create_assignment(
        session,
        organization_id=current_user.organization_id,
        body=body,
        actor_user_id=current_user.user_id,
        audit=audit,
    )


# ============================================================================
# Dossiers administratifs
# ============================================================================
@router.get("/dossiers", response_model=list[DossierResponse])
async def list_dossiers(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(
            require_permissions(
                any_of=["personnel:view", "personnel:manage", "documents:view", "*"]
            )
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[DossierResponse]:
    """Liste les dossiers administratifs (documents rattachés aux agents)."""
    return await personnel_service.list_dossiers(
        session, organization_id=current_user.organization_id
    )


# ============================================================================
# Turnover risk — restreint aux rôles habilités (DRH)
# ============================================================================
@router.get("/turnover-risk", response_model=list[TurnoverRiskItem])
@router.get(
    "/risques-turnover",
    response_model=list[TurnoverRiskItem],
    name="list_turnover_risk_fr_alias",
)
async def list_turnover_risk(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    direction_id: UUID | None = None,
    min_level: RiskLevel | None = None,
) -> list[TurnoverRiskItem]:
    """Liste les agents avec leur score de turnover.

    Exposé sous deux chemins équivalents :
    - ``/personnel/turnover-risk`` (canonique, anglais)
    - ``/personnel/risques-turnover`` (alias français, hérité du
      mock-backend Angular — câblé en V1.0 pour remplacer le stub vide).

    **Règle métier non négociable** : le scoring n'est lisible que par les
    rôles habilités (hr_manager, super_admin). Un manager direct (N+1)
    ne doit pas voir le score de son agent direct sans contrôle DRH —
    cette restriction est imposée par le RBAC : `personnel:manage` n'est
    octroyé qu'aux hr_manager et super_admin (cf. seed_initial.py).
    """
    if not current_user.has_any_role(
        ["hr_manager", "super_admin"]
    ) and not current_user.has_permission("*"):
        raise ForbiddenError(
            "Le scoring turnover est réservé aux rôles RH habilités.",
            code="TURNOVER_FORBIDDEN_FOR_ROLE",
        )
    return await turnover_service.list_for_organization(
        session,
        organization_id=current_user.organization_id,
        direction_id=direction_id,
        min_level=min_level,
    )


@router.post(
    "/agents/{employee_id}/dossier-export",
    response_model=DossierExportResponse,
)
@router.post(
    "/agents/{employee_id}/export-pdf",
    response_model=DossierExportResponse,
    include_in_schema=False,
)
async def export_agent_dossier(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> DossierExportResponse:
    """Génère un dossier PDF signé pour l'agent.

    Le PDF est rendu via le `PdfRenderer` (WeasyPrint si dispo, sinon
    minimal), signé via `SignaturePort` (Mock V1, Endesive PAdES en prod
    avec PKI gouvernementale), stocké via `ObjectStoragePort` (LocalFS
    par défaut, MinIO en prod). Audit `EMPLOYEE_DOSSIER_EXPORTED`.
    """
    export = await dossier_pdf.generate_signed_dossier(
        session,
        organization_id=current_user.organization_id,
        employee_id=employee_id,
        actor_user_id=current_user.user_id,
        audit=audit,
    )
    return DossierExportResponse.model_validate(export)


@router.get(
    "/agents/{employee_id}/turnover-risk",
    response_model=TurnoverRiskItem,
)
async def get_agent_turnover_risk(
    employee_id: UUID,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["personnel:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> TurnoverRiskItem:
    if not current_user.has_any_role(
        ["hr_manager", "super_admin"]
    ) and not current_user.has_permission("*"):
        raise ForbiddenError(
            "Le scoring turnover est réservé aux rôles RH habilités.",
            code="TURNOVER_FORBIDDEN_FOR_ROLE",
        )
    employee = await personnel_service._load_agent(session, employee_id)
    return await turnover_service.compute_for_employee(session, employee=employee)
