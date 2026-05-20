"""Seed initial idempotent — organisation, permissions, rôles, comptes types.

Exécution :

    cd Final/backend
    uv run python -m scripts.seed_initial

Variables d'env utiles :

    SEED_SUPER_ADMIN_USERNAME=admin
    SEED_SUPER_ADMIN_PASSWORD=ChangeMe!2026

Usage répété : ne crée jamais de doublon (chaque insertion check `unique`).
"""

from __future__ import annotations

import asyncio
import os
from typing import Final
from uuid import UUID

from app.core.db import session_scope
from app.core.security.passwords import hash_password
from app.models.document import DocumentType
from app.models.leave import LeaveType
from app.models.organization import Direction, Organization
from app.models.permission import Permission, Role, RolePermission
from app.models.user import User, UserRole, UserScope
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Référentiel permissions — aligné sur frontend access-control.service.ts
# ---------------------------------------------------------------------------
PERMISSIONS_CATALOG: Final[tuple[tuple[str, str, str], ...]] = (
    ("dashboard:view", "Voir le tableau de bord", "dashboard"),
    ("dashboard:manage", "Gérer le tableau de bord", "dashboard"),
    ("personnel:view", "Voir les agents", "personnel"),
    ("personnel:manage", "Gérer les agents", "personnel"),
    ("organization:view", "Voir l'organigramme", "organization"),
    ("organization:manage", "Gérer l'organigramme", "organization"),
    ("recruitment:view", "Voir le recrutement", "recruitment"),
    ("recruitment:manage", "Gérer le recrutement", "recruitment"),
    ("careers:view", "Voir les carrières", "careers"),
    ("careers:manage", "Gérer les carrières", "careers"),
    ("leave:view", "Voir les congés", "leave"),
    ("leave:manage", "Gérer les congés", "leave"),
    ("leave:approve:l1", "Valider niveau 1", "leave"),
    ("leave:approve:l2", "Valider niveau 2", "leave"),
    ("performance:view", "Voir la performance", "performance"),
    ("performance:manage", "Gérer la performance", "performance"),
    ("training:view", "Voir la formation", "training"),
    ("training:manage", "Gérer la formation", "training"),
    ("discipline:view", "Voir la discipline", "discipline"),
    ("discipline:manage", "Gérer la discipline", "discipline"),
    ("documents:view", "Voir les documents", "documents"),
    ("documents:manage", "Gérer les documents", "documents"),
    ("documents:view:sensitive", "Voir documents sensibles", "documents"),
    ("workflows:view", "Voir les workflows", "workflows"),
    ("workflows:manage", "Gérer les workflows", "workflows"),
    ("reports:view", "Voir les rapports", "reports"),
    ("reports:export", "Exporter les rapports", "reports"),
    ("portal:agent", "Portail agent", "self-service"),
    ("portal:manager", "Portail manager", "self-service"),
    ("admin:view", "Voir l'administration", "admin"),
    ("admin:users:manage", "Gérer les utilisateurs", "admin"),
    ("admin:roles:manage", "Gérer les rôles", "admin"),
    ("admin:audit:view", "Voir le journal d'audit", "admin"),
)

# Mapping rôle → liste de permissions (super_admin a "*" via wildcard logique)
ROLE_PERMISSIONS: Final[dict[str, tuple[str, ...]]] = {
    "super_admin": (),  # wildcard implicite côté code
    "hr_manager": (
        "dashboard:view",
        "dashboard:manage",
        "personnel:view",
        "personnel:manage",
        "organization:view",
        "organization:manage",
        "recruitment:view",
        "recruitment:manage",
        "careers:view",
        "careers:manage",
        "leave:view",
        "leave:manage",
        "leave:approve:l1",
        "leave:approve:l2",
        "performance:view",
        "performance:manage",
        "training:view",
        "training:manage",
        "discipline:view",
        "discipline:manage",
        "documents:view",
        "documents:manage",
        "documents:view:sensitive",
        "workflows:view",
        "workflows:manage",
        "reports:view",
        "reports:export",
        "portal:agent",
        "portal:manager",
    ),
    "manager": (
        "dashboard:view",
        "leave:view",
        "leave:manage",
        "leave:approve:l1",
        "performance:view",
        "performance:manage",
        "training:view",
        "training:manage",
        "documents:view",
        "documents:manage",
        "reports:view",
        "reports:export",
        "portal:manager",
    ),
    "agent": ("portal:agent",),
}

ROLE_LABELS: Final[dict[str, str]] = {
    "super_admin": "Super administrateur",
    "hr_manager": "Gestionnaire RH",
    "manager": "Responsable hiérarchique",
    "agent": "Agent",
}

ROLE_SCOPES: Final[dict[str, tuple[str, ...]]] = {
    "super_admin": ("GLOBAL",),
    "hr_manager": ("GLOBAL",),
    "manager": ("DIRECTION",),
    "agent": ("SELF",),
}

# ---------------------------------------------------------------------------
# Types de congés standard de la fonction publique guinéenne (par défaut)
# ---------------------------------------------------------------------------
LEAVE_TYPES_CATALOG: Final[tuple[tuple[str, str, bool], ...]] = (
    ("ANNUAL", "Congé annuel", True),
    ("SICK", "Congé maladie", True),
    ("MATERNITY", "Congé maternité", True),
    ("PATERNITY", "Congé paternité", True),
    ("BEREAVEMENT", "Congé décès / deuil", True),
    ("MARRIAGE", "Congé mariage", True),
    ("UNPAID", "Congé sans solde", False),
    ("SPECIAL", "Permission exceptionnelle", True),
    ("TRAINING", "Congé formation", True),
)

# ---------------------------------------------------------------------------
# Types de documents administratifs RH standard.
# Schéma : (code, label, module_scope, owner_entity_type, requires_signature,
#           requires_dispatch, is_sensitive, default_validity_days, retention_days,
#           allowed_mime_types).
# Note : ce catalogue est complémentaire de celui inséré directement par le SQL
# 002_unified_documents.sql (seeds INSERT) — d'où `on_conflict do nothing`
# implicite via _ensure_document_type qui vérifie l'existence par code.
# ---------------------------------------------------------------------------
DOCUMENT_TYPES_CATALOG: Final[
    tuple[tuple[str, str, str, str, bool, bool, bool, int | None, int | None, list[str]], ...]
] = (
    (
        "BIRTH_CERTIFICATE",
        "Acte de naissance",
        "PERSONNEL",
        "EMPLOYEE",
        False,
        False,
        True,
        None,
        3650,
        ["application/pdf", "image/jpeg", "image/png"],
    ),
    (
        "NATIONAL_ID",
        "Carte nationale d'identité",
        "PERSONNEL",
        "EMPLOYEE",
        False,
        False,
        True,
        3650,
        3650,
        ["application/pdf", "image/jpeg", "image/png"],
    ),
    (
        "MEDICAL_CERTIFICATE",
        "Certificat médical",
        "PERSONNEL",
        "EMPLOYEE",
        False,
        False,
        True,
        90,
        1825,
        ["application/pdf", "image/jpeg", "image/png"],
    ),
    (
        "MOTIVATION_LETTER",
        "Lettre de motivation",
        "RECRUITMENT",
        "RECRUITMENT_APPLICATION",
        False,
        False,
        False,
        None,
        1825,
        ["application/pdf"],
    ),
    (
        "PAY_SLIP",
        "Bulletin de salaire",
        "PERSONNEL",
        "EMPLOYEE",
        False,
        False,
        True,
        None,
        3650,
        ["application/pdf"],
    ),
)


async def _ensure_organization(session: AsyncSession) -> Organization:
    stmt = select(Organization).where(Organization.code == "PRIMATURE")
    org = (await session.execute(stmt)).scalar_one_or_none()
    if org is not None:
        return org
    org = Organization(code="PRIMATURE", name="Primature de la République de Guinée")
    session.add(org)
    await session.flush([org])
    return org


async def _ensure_demo_direction(session: AsyncSession, *, organization_id: UUID) -> Direction:
    """Crée une direction démo pour rattacher les comptes types (manager, agent)."""
    stmt = select(Direction).where(
        Direction.organization_id == organization_id,
        Direction.code == "DGCAB",
    )
    direction = (await session.execute(stmt)).scalar_one_or_none()
    if direction is not None:
        return direction
    direction = Direction(
        organization_id=organization_id,
        code="DGCAB",
        name="Direction Générale du Cabinet (démo)",
    )
    session.add(direction)
    await session.flush([direction])
    return direction


async def _ensure_permission(
    session: AsyncSession, code: str, label: str, module: str
) -> Permission:
    stmt = select(Permission).where(Permission.code == code)
    perm = (await session.execute(stmt)).scalar_one_or_none()
    if perm is not None:
        return perm
    perm = Permission(code=code, label=label, module_name=module)
    session.add(perm)
    await session.flush([perm])
    return perm


async def _ensure_role(session: AsyncSession, code: str, label: str) -> Role:
    stmt = select(Role).where(Role.code == code)
    role = (await session.execute(stmt)).scalar_one_or_none()
    if role is not None:
        return role
    role = Role(code=code, label=label, is_system=True)
    session.add(role)
    await session.flush([role])
    return role


async def _ensure_role_permission(
    session: AsyncSession, role_id: UUID, permission_id: UUID
) -> None:
    stmt = select(RolePermission).where(
        RolePermission.role_id == role_id,
        RolePermission.permission_id == permission_id,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        return
    session.add(RolePermission(role_id=role_id, permission_id=permission_id))


async def _ensure_leave_type(
    session: AsyncSession,
    *,
    organization_id: UUID,
    code: str,
    label: str,
    is_paid: bool,
) -> LeaveType:
    stmt = select(LeaveType).where(
        LeaveType.organization_id == organization_id,
        LeaveType.code == code,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        return existing
    leave_type = LeaveType(
        organization_id=organization_id,
        code=code,
        label=label,
        is_paid=is_paid,
    )
    session.add(leave_type)
    await session.flush([leave_type])
    return leave_type


async def _ensure_document_type(
    session: AsyncSession,
    *,
    organization_id: UUID,
    code: str,
    label: str,
    module_scope: str,
    owner_entity_type: str,
    requires_signature: bool,
    requires_dispatch: bool,
    is_sensitive: bool,
    default_validity_days: int | None,
    retention_days: int | None,
    allowed_mime_types: list[str],
) -> DocumentType:
    stmt = select(DocumentType).where(
        DocumentType.organization_id == organization_id,
        DocumentType.code == code,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        return existing
    doc_type = DocumentType(
        organization_id=organization_id,
        code=code,
        label=label,
        module_scope=module_scope,
        owner_entity_type=owner_entity_type,
        requires_signature=requires_signature,
        requires_dispatch=requires_dispatch,
        is_sensitive=is_sensitive,
        default_validity_days=default_validity_days,
        retention_days=retention_days,
        allowed_mime_types=allowed_mime_types,
    )
    session.add(doc_type)
    await session.flush([doc_type])
    return doc_type


async def _ensure_user(
    session: AsyncSession,
    *,
    organization_id: UUID,
    username: str,
    full_name: str,
    password: str,
    role: Role,
    scopes: tuple[str, ...],
    direction_id: UUID | None = None,
    email: str | None = None,
) -> User:
    stmt = select(User).where(User.username == username)
    user = (await session.execute(stmt)).scalar_one_or_none()

    if user is None:
        user = User(
            organization_id=organization_id,
            username=username,
            email=email,
            full_name=full_name,
            password_hash=hash_password(password),
            status="ACTIVE",
            direction_id=direction_id,
        )
        session.add(user)
        await session.flush([user])
    else:
        if direction_id is not None and user.direction_id is None:
            user.direction_id = direction_id
        if email is not None and user.email is None:
            user.email = email

    # Liaison rôle (idempotent)
    user_role_stmt = select(UserRole).where(
        UserRole.user_id == user.user_id,
        UserRole.role_id == role.role_id,
    )
    if (await session.execute(user_role_stmt)).scalar_one_or_none() is None:
        session.add(UserRole(user_id=user.user_id, role_id=role.role_id))

    # Scopes (idempotent par scope_type)
    # Le check constraint `user_scopes_check` exige :
    # - DIRECTION → direction_id NOT NULL
    # - UNIT → unit_id NOT NULL
    # - TEAM → team_key NOT NULL
    # - GLOBAL/SELF → tout null OK
    for scope_type in scopes:
        existing_scope = (
            await session.execute(
                select(UserScope).where(
                    UserScope.user_id == user.user_id,
                    UserScope.scope_type == scope_type,
                )
            )
        ).scalar_one_or_none()
        if existing_scope is None:
            scope_kwargs: dict[str, object] = {
                "user_id": user.user_id,
                "scope_type": scope_type,
            }
            if scope_type == "DIRECTION":
                scope_kwargs["direction_id"] = direction_id
            session.add(UserScope(**scope_kwargs))  # type: ignore[arg-type]

    return user


async def main() -> None:
    super_admin_username = os.getenv("SEED_SUPER_ADMIN_USERNAME", "admin")
    super_admin_password = os.getenv("SEED_SUPER_ADMIN_PASSWORD", "ChangeMe!2026")

    async with session_scope() as session:
        org = await _ensure_organization(session)
        demo_direction = await _ensure_demo_direction(session, organization_id=org.organization_id)

        # Permissions
        permissions: dict[str, Permission] = {}
        for code, label, module in PERMISSIONS_CATALOG:
            permissions[code] = await _ensure_permission(session, code, label, module)

        # Rôles + liaisons
        roles: dict[str, Role] = {}
        for role_code, perm_codes in ROLE_PERMISSIONS.items():
            role = await _ensure_role(session, role_code, ROLE_LABELS[role_code])
            roles[role_code] = role
            # super_admin n'a pas de role_permissions explicites (wildcard implicite)
            for perm_code in perm_codes:
                await _ensure_role_permission(
                    session, role.role_id, permissions[perm_code].permission_id
                )

        # Types de congés
        for lt_code, lt_label, lt_is_paid in LEAVE_TYPES_CATALOG:
            await _ensure_leave_type(
                session,
                organization_id=org.organization_id,
                code=lt_code,
                label=lt_label,
                is_paid=lt_is_paid,
            )

        # Types de documents complémentaires (le SQL 002 en seede déjà 13 ;
        # ici on ajoute ceux qui n'y sont pas).
        for (
            dt_code,
            dt_label,
            dt_module_scope,
            dt_owner_entity_type,
            dt_req_sign,
            dt_req_disp,
            dt_is_sensitive,
            dt_default_validity_days,
            dt_retention_days,
            dt_mime_types,
        ) in DOCUMENT_TYPES_CATALOG:
            await _ensure_document_type(
                session,
                organization_id=org.organization_id,
                code=dt_code,
                label=dt_label,
                module_scope=dt_module_scope,
                owner_entity_type=dt_owner_entity_type,
                requires_signature=dt_req_sign,
                requires_dispatch=dt_req_disp,
                is_sensitive=dt_is_sensitive,
                default_validity_days=dt_default_validity_days,
                retention_days=dt_retention_days,
                allowed_mime_types=list(dt_mime_types),
            )

        # Utilisateurs types
        await _ensure_user(
            session,
            organization_id=org.organization_id,
            username=super_admin_username,
            email="admin@primature.gov.gn",
            full_name="Super administrateur",
            password=super_admin_password,
            role=roles["super_admin"],
            scopes=ROLE_SCOPES["super_admin"],
        )
        await _ensure_user(
            session,
            organization_id=org.organization_id,
            username="hr",
            email="hr@primature.gov.gn",
            full_name="Gestionnaire RH (démo)",
            password="ChangeMe!2026",
            role=roles["hr_manager"],
            scopes=ROLE_SCOPES["hr_manager"],
        )
        await _ensure_user(
            session,
            organization_id=org.organization_id,
            username="manager",
            email="manager@primature.gov.gn",
            full_name="Responsable hiérarchique (démo)",
            password="ChangeMe!2026",
            role=roles["manager"],
            scopes=ROLE_SCOPES["manager"],
            direction_id=demo_direction.direction_id,
        )
        await _ensure_user(
            session,
            organization_id=org.organization_id,
            username="agent",
            email="agent@primature.gov.gn",
            full_name="Agent (démo)",
            password="ChangeMe!2026",
            role=roles["agent"],
            scopes=ROLE_SCOPES["agent"],
            direction_id=demo_direction.direction_id,
        )
        # Compte hérité — compatibilité avec l'ancien mock-backend Node.js.
        # À supprimer dès que toutes les démos utilisent les comptes nominaux.
        await _ensure_user(
            session,
            organization_id=org.organization_id,
            username="spruko",
            email="spruko@admin.com",
            full_name="Compte démo (legacy)",
            password="sprukoadmin",
            role=roles["super_admin"],
            scopes=ROLE_SCOPES["super_admin"],
        )

    print(  # noqa: T201
        "Seed terminé. Données initiales :\n"
        "  - 1 organisation (PRIMATURE)\n"
        f"  - {len(PERMISSIONS_CATALOG)} permissions, {len(ROLE_PERMISSIONS)} rôles\n"
        f"  - {len(LEAVE_TYPES_CATALOG)} types de congés\n"
        f"  - {len(DOCUMENT_TYPES_CATALOG)} types de documents\n"
        "  - 5 comptes :\n"
        "      admin@primature.gov.gn / ChangeMe!2026 (super_admin)\n"
        "      hr@primature.gov.gn / ChangeMe!2026\n"
        "      manager@primature.gov.gn / ChangeMe!2026\n"
        "      agent@primature.gov.gn / ChangeMe!2026\n"
        "      spruko@admin.com / sprukoadmin (compte hérité)"
    )  # noqa: T201


if __name__ == "__main__":
    asyncio.run(main())
