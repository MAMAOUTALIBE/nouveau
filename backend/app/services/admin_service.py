"""Service métier pour le domaine Admin (users + roles + permissions).

Toutes les mutations passent par le `AuditWriter` pour traçabilité.
Aucune action ne court-circuite le RBAC : la gestion d'autorisation est
faite côté router via les dépendances `require_permissions`.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import AuditWriter
from app.core.errors import ConflictError, NotFoundError, ValidationError
from app.core.security.passwords import hash_password
from app.models.permission import Permission, Role, RolePermission
from app.models.user import User, UserRole, UserScope
from app.schemas.admin import (
    PermissionResponse,
    RoleCreateRequest,
    RoleResponse,
    RoleSetPermissionsRequest,
    RoleUpdateRequest,
    UserCreateRequest,
    UserListItem,
    UserResponse,
    UserSetRolesRequest,
    UserUpdateRequest,
)


# ============================================================================
# Helpers de sérialisation
# ============================================================================
def _user_to_dto(user: User) -> UserResponse:
    return UserResponse(
        user_id=user.user_id,
        organization_id=user.organization_id,
        username=str(user.username),
        email=str(user.email) if user.email else None,
        full_name=user.full_name,
        status=user.status,
        direction_id=user.direction_id,
        unit_id=user.unit_id,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=[role.code for role in user.roles],
    )


def _role_to_dto(role: Role) -> RoleResponse:
    permission_codes = [p.code for p in role.permissions]
    return RoleResponse(
        role_id=role.role_id,
        code=role.code,
        label=role.label,
        is_system=role.is_system,
        permissions=permission_codes,
        created_at=role.created_at,
        updated_at=role.updated_at,
        description=role.label,
        permissions_count=len(permission_codes),
    )


# ============================================================================
# Users
# ============================================================================
async def list_users(
    session: AsyncSession,
    *,
    organization_id: UUID,
    page: int = 1,
    page_size: int = 50,
    status: str | None = None,
    direction_id: UUID | None = None,
    search: str | None = None,
) -> tuple[list[UserListItem], int]:
    base = select(User).where(User.organization_id == organization_id)
    base = base.options(selectinload(User.roles))

    if status:
        base = base.where(User.status == status)
    if direction_id:
        base = base.where(User.direction_id == direction_id)
    if search:
        like = f"%{search}%"
        base = base.where(User.full_name.ilike(like) | User.username.ilike(like))

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    page_stmt = base.order_by(User.full_name).offset((page - 1) * page_size).limit(page_size)
    rows = (await session.execute(page_stmt)).scalars().unique().all()

    items = [
        UserListItem(
            user_id=u.user_id,
            organization_id=u.organization_id,
            username=str(u.username),
            email=str(u.email) if u.email else None,
            full_name=u.full_name,
            status=u.status,
            direction_id=u.direction_id,
            unit_id=u.unit_id,
            last_login_at=u.last_login_at,
            created_at=u.created_at,
            updated_at=u.updated_at,
            roles=[role.code for role in u.roles],
        )
        for u in rows
    ]
    return items, int(total)


async def _load_user_with_relations(session: AsyncSession, user_id: UUID) -> User:
    stmt = (
        select(User)
        .where(User.user_id == user_id)
        .options(selectinload(User.roles))
        .options(selectinload(User.scopes))
    )
    user = (await session.execute(stmt)).scalar_one_or_none()
    if user is None:
        raise NotFoundError("Utilisateur introuvable.", code="USER_NOT_FOUND")
    return user


async def get_user(session: AsyncSession, user_id: UUID) -> UserResponse:
    user = await _load_user_with_relations(session, user_id)
    return _user_to_dto(user)


async def create_user(
    session: AsyncSession,
    *,
    organization_id: UUID,
    body: UserCreateRequest,
    audit: AuditWriter,
) -> UserResponse:
    existing_stmt = select(User).where(User.username == body.username)
    if (await session.execute(existing_stmt)).scalar_one_or_none() is not None:
        raise ConflictError(
            "Nom d'utilisateur déjà utilisé.",
            code="USERNAME_TAKEN",
        )

    user = User(
        organization_id=organization_id,
        username=body.username,
        email=body.email,
        full_name=body.full_name,
        password_hash=hash_password(body.password),
        status="ACTIVE",
        direction_id=body.direction_id,
        unit_id=body.unit_id,
    )
    session.add(user)
    await session.flush([user])

    # Liaison rôles
    if body.role_codes:
        await _set_user_roles(session, user.user_id, body.role_codes)

    # Scopes initiaux
    for scope_type in body.scopes:
        session.add(UserScope(user_id=user.user_id, scope_type=scope_type))

    await session.flush()

    await audit.record(
        action="USER_CREATED",
        target_type="user",
        target_id=str(user.user_id),
        after={
            "username": str(user.username),
            "full_name": user.full_name,
            "roles": list(body.role_codes),
            "direction_id": str(user.direction_id) if user.direction_id else None,
        },
    )

    refreshed = await _load_user_with_relations(session, user.user_id)
    return _user_to_dto(refreshed)


async def update_user(
    session: AsyncSession,
    *,
    user_id: UUID,
    body: UserUpdateRequest,
    audit: AuditWriter,
) -> UserResponse:
    user = await _load_user_with_relations(session, user_id)

    before = {
        "email": str(user.email) if user.email else None,
        "full_name": user.full_name,
        "direction_id": str(user.direction_id) if user.direction_id else None,
        "unit_id": str(user.unit_id) if user.unit_id else None,
    }

    if body.email is not None:
        user.email = body.email
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.direction_id is not None:
        user.direction_id = body.direction_id
    if body.unit_id is not None:
        user.unit_id = body.unit_id

    after = {
        "email": str(user.email) if user.email else None,
        "full_name": user.full_name,
        "direction_id": str(user.direction_id) if user.direction_id else None,
        "unit_id": str(user.unit_id) if user.unit_id else None,
    }

    await audit.record(
        action="USER_UPDATED",
        target_type="user",
        target_id=str(user.user_id),
        before=before,
        after=after,
    )
    await session.flush()
    return _user_to_dto(user)


async def set_user_status(
    session: AsyncSession,
    *,
    user_id: UUID,
    new_status: str,
    audit: AuditWriter,
) -> UserResponse:
    if new_status not in ("ACTIVE", "SUSPENDED", "DISABLED"):
        raise ValidationError(f"Statut utilisateur invalide : {new_status}", code="INVALID_STATUS")
    user = await _load_user_with_relations(session, user_id)
    before_status = user.status
    user.status = new_status

    await audit.record(
        action="USER_STATUS_CHANGED",
        target_type="user",
        target_id=str(user.user_id),
        before={"status": before_status},
        after={"status": new_status},
    )
    return _user_to_dto(user)


async def reset_user_password(
    session: AsyncSession,
    *,
    user_id: UUID,
    new_password: str,
    audit: AuditWriter,
) -> None:
    user = await _load_user_with_relations(session, user_id)
    user.password_hash = hash_password(new_password)
    await audit.record(
        action="USER_PASSWORD_RESET",
        target_type="user",
        target_id=str(user.user_id),
    )


async def _set_user_roles(session: AsyncSession, user_id: UUID, role_codes: list[str]) -> None:
    """Remplace l'ensemble des rôles d'un utilisateur."""
    if not role_codes:
        await session.execute(delete(UserRole).where(UserRole.user_id == user_id))
        return

    found_roles = (
        (await session.execute(select(Role).where(Role.code.in_(role_codes)))).scalars().all()
    )
    found_codes = {r.code for r in found_roles}
    missing = set(role_codes) - found_codes
    if missing:
        raise ValidationError(
            f"Rôle(s) inconnu(s) : {sorted(missing)}",
            code="UNKNOWN_ROLES",
        )

    await session.execute(delete(UserRole).where(UserRole.user_id == user_id))
    for role in found_roles:
        session.add(UserRole(user_id=user_id, role_id=role.role_id))


async def set_user_roles(
    session: AsyncSession,
    *,
    user_id: UUID,
    body: UserSetRolesRequest,
    audit: AuditWriter,
) -> UserResponse:
    user = await _load_user_with_relations(session, user_id)
    before_roles = [r.code for r in user.roles]

    await _set_user_roles(session, user_id, body.role_codes)
    await session.flush()

    await audit.record(
        action="USER_ROLES_CHANGED",
        target_type="user",
        target_id=str(user.user_id),
        before={"roles": before_roles},
        after={"roles": list(body.role_codes)},
    )

    refreshed = await _load_user_with_relations(session, user_id)
    return _user_to_dto(refreshed)


# ============================================================================
# Roles
# ============================================================================
async def list_roles(session: AsyncSession) -> list[RoleResponse]:
    stmt = select(Role).options(selectinload(Role.permissions)).order_by(Role.code)
    rows = (await session.execute(stmt)).scalars().unique().all()
    return [_role_to_dto(r) for r in rows]


async def _load_role(session: AsyncSession, role_id: UUID) -> Role:
    stmt = select(Role).where(Role.role_id == role_id).options(selectinload(Role.permissions))
    role = (await session.execute(stmt)).scalar_one_or_none()
    if role is None:
        raise NotFoundError("Rôle introuvable.", code="ROLE_NOT_FOUND")
    return role


async def get_role(session: AsyncSession, role_id: UUID) -> RoleResponse:
    return _role_to_dto(await _load_role(session, role_id))


async def create_role(
    session: AsyncSession,
    *,
    body: RoleCreateRequest,
    audit: AuditWriter,
) -> RoleResponse:
    existing = (
        await session.execute(select(Role).where(Role.code == body.code))
    ).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("Code de rôle déjà utilisé.", code="ROLE_CODE_TAKEN")

    role = Role(code=body.code, label=body.label, is_system=False)
    session.add(role)
    await session.flush([role])

    if body.permission_codes:
        await _set_role_permissions(session, role.role_id, body.permission_codes)

    await session.flush()

    await audit.record(
        action="ROLE_CREATED",
        target_type="role",
        target_id=str(role.role_id),
        after={"code": role.code, "label": role.label, "permissions": list(body.permission_codes)},
    )

    refreshed = await _load_role(session, role.role_id)
    return _role_to_dto(refreshed)


async def update_role(
    session: AsyncSession,
    *,
    role_id: UUID,
    body: RoleUpdateRequest,
    audit: AuditWriter,
) -> RoleResponse:
    role = await _load_role(session, role_id)
    if role.is_system:
        raise ValidationError("Impossible de modifier un rôle système.", code="ROLE_IS_SYSTEM")
    before = {"label": role.label}
    if body.label is not None:
        role.label = body.label
    await audit.record(
        action="ROLE_UPDATED",
        target_type="role",
        target_id=str(role.role_id),
        before=before,
        after={"label": role.label},
    )
    return _role_to_dto(role)


async def delete_role(
    session: AsyncSession,
    *,
    role_id: UUID,
    audit: AuditWriter,
) -> None:
    role = await _load_role(session, role_id)
    if role.is_system:
        raise ValidationError("Impossible de supprimer un rôle système.", code="ROLE_IS_SYSTEM")

    # Vérifie qu'aucun utilisateur n'a ce rôle (intégrité avant suppression)
    in_use = (
        await session.execute(select(func.count()).where(UserRole.role_id == role_id))
    ).scalar_one()
    if in_use:
        raise ConflictError(
            f"Rôle utilisé par {in_use} utilisateur(s) — détacher avant suppression.",
            code="ROLE_IN_USE",
            details={"users_count": int(in_use)},
        )

    await audit.record(
        action="ROLE_DELETED",
        target_type="role",
        target_id=str(role.role_id),
        before={"code": role.code, "label": role.label},
    )
    await session.delete(role)


async def _set_role_permissions(
    session: AsyncSession, role_id: UUID, permission_codes: list[str]
) -> None:
    if not permission_codes:
        await session.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
        return

    perms = (
        (await session.execute(select(Permission).where(Permission.code.in_(permission_codes))))
        .scalars()
        .all()
    )
    found = {p.code for p in perms}
    missing = set(permission_codes) - found
    if missing:
        raise ValidationError(
            f"Permission(s) inconnue(s) : {sorted(missing)}",
            code="UNKNOWN_PERMISSIONS",
        )

    await session.execute(delete(RolePermission).where(RolePermission.role_id == role_id))
    for perm in perms:
        session.add(RolePermission(role_id=role_id, permission_id=perm.permission_id))


async def set_role_permissions(
    session: AsyncSession,
    *,
    role_id: UUID,
    body: RoleSetPermissionsRequest,
    audit: AuditWriter,
) -> RoleResponse:
    role = await _load_role(session, role_id)
    if role.is_system:
        raise ValidationError(
            "Impossible de modifier les permissions d'un rôle système.",
            code="ROLE_IS_SYSTEM",
        )
    before_perms = [p.code for p in role.permissions]

    await _set_role_permissions(session, role_id, body.permission_codes)
    await session.flush()

    await audit.record(
        action="ROLE_PERMISSIONS_CHANGED",
        target_type="role",
        target_id=str(role.role_id),
        before={"permissions": before_perms},
        after={"permissions": list(body.permission_codes)},
    )
    refreshed = await _load_role(session, role_id)
    return _role_to_dto(refreshed)


# ============================================================================
# Permissions
# ============================================================================
async def list_permissions(session: AsyncSession) -> list[PermissionResponse]:
    stmt = select(Permission).order_by(Permission.module_name, Permission.code)
    rows = (await session.execute(stmt)).scalars().all()
    return [PermissionResponse.model_validate(p) for p in rows]
