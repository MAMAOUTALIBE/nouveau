"""Endpoints d'administration : users, roles, permissions, audit-logs."""

from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import AuditWriter, get_audit_writer
from app.core.db import get_session
from app.core.security.rbac import AuthenticatedUser, require_permissions
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.admin import (
    PermissionResponse,
    RoleCreateRequest,
    RoleResponse,
    RoleSetPermissionsRequest,
    RoleUpdateRequest,
    UserCreateRequest,
    UserResetPasswordRequest,
    UserResponse,
    UserSetRolesRequest,
    UserUpdateRequest,
)
from app.schemas.audit import AuditLogResponse, PaginatedAuditLogs
from app.schemas.common import Page
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["admin"])


# ============================================================================
# Audit logs (déjà V0 — gardé tel quel)
# ============================================================================
@router.get("/audit-logs", response_model=PaginatedAuditLogs)
async def list_audit_logs(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:audit:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    action: str | None = None,
    target_type: str | None = None,
    target_id: str | None = None,
    user_id: UUID | None = None,
    status_filter: str | None = Query(None, alias="status"),
    occurred_from: datetime | None = None,
    occurred_to: datetime | None = None,
) -> PaginatedAuditLogs:
    """Liste paginée et filtrable des logs d'audit."""
    base = select(AuditLog).where(AuditLog.organization_id == current_user.organization_id)

    if action:
        base = base.where(AuditLog.action == action)
    if target_type:
        base = base.where(AuditLog.target_type == target_type)
    if target_id:
        base = base.where(AuditLog.target_id == target_id)
    if user_id:
        base = base.where(AuditLog.user_id == user_id)
    if status_filter:
        base = base.where(AuditLog.status == status_filter)
    if occurred_from:
        base = base.where(AuditLog.occurred_at >= occurred_from)
    if occurred_to:
        base = base.where(AuditLog.occurred_at <= occurred_to)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await session.execute(count_stmt)).scalar_one()

    items_stmt = (
        base.order_by(AuditLog.occurred_at.desc()).offset((page - 1) * page_size).limit(page_size)
    )
    rows = (await session.execute(items_stmt)).scalars().all()

    # Résolution des noms d'utilisateur (affichage lisible dans le journal).
    user_ids = {row.user_id for row in rows if row.user_id is not None}
    usernames: dict[UUID, str] = {}
    if user_ids:
        usernames = {
            user_id: username
            for user_id, username in (
                await session.execute(
                    select(User.user_id, User.username).where(User.user_id.in_(user_ids))
                )
            ).all()
        }

    # Construction manuelle : le champ `audit_metadata` est mappé à la colonne
    # DB `metadata`, mais `from_attributes` taperait sur `Base.metadata` global.
    items = [
        AuditLogResponse(
            audit_log_id=row.audit_log_id,
            organization_id=row.organization_id,
            user_id=row.user_id,
            username=usernames.get(row.user_id) if row.user_id is not None else None,
            action=row.action,
            target_type=row.target_type,
            target_id=row.target_id,
            status=row.status,
            source_ip=str(row.source_ip) if row.source_ip else None,
            user_agent=row.user_agent,
            before_data=row.before_data,
            after_data=row.after_data,
            metadata=row.audit_metadata,
            occurred_at=row.occurred_at,
        )
        for row in rows
    ]
    return PaginatedAuditLogs(
        items=items,
        total=int(total),
        page=page,
        page_size=page_size,
    )


# ============================================================================
# Users
# ============================================================================
@router.get("/users", response_model=Page[UserResponse])
async def list_users(
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=200)] = 50,
    user_status: str | None = Query(None, alias="status"),
    direction_id: UUID | None = None,
    search: str | None = Query(None, alias="q"),
) -> Page[UserResponse]:
    items, total = await admin_service.list_users(
        session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        status=user_status,
        direction_id=direction_id,
        search=search,
    )
    return Page[UserResponse](
        items=[UserResponse.model_validate(it.model_dump()) for it in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/users",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_user(
    body: UserCreateRequest,
    current_user: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UserResponse:
    return await admin_service.create_user(
        session,
        organization_id=current_user.organization_id,
        body=body,
        audit=audit,
    )


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> UserResponse:
    return await admin_service.get_user(session, user_id)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    body: UserUpdateRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UserResponse:
    return await admin_service.update_user(session, user_id=user_id, body=body, audit=audit)


@router.post("/users/{user_id}/suspend", response_model=UserResponse)
async def suspend_user(
    user_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UserResponse:
    return await admin_service.set_user_status(
        session, user_id=user_id, new_status="SUSPENDED", audit=audit
    )


@router.post("/users/{user_id}/reactivate", response_model=UserResponse)
async def reactivate_user(
    user_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UserResponse:
    return await admin_service.set_user_status(
        session, user_id=user_id, new_status="ACTIVE", audit=audit
    )


@router.post(
    "/users/{user_id}/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def reset_user_password(
    user_id: UUID,
    body: UserResetPasswordRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> None:
    await admin_service.reset_user_password(
        session, user_id=user_id, new_password=body.new_password, audit=audit
    )


@router.put("/users/{user_id}/roles", response_model=UserResponse)
async def set_user_roles(
    user_id: UUID,
    body: UserSetRolesRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:users:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> UserResponse:
    return await admin_service.set_user_roles(session, user_id=user_id, body=body, audit=audit)


# ============================================================================
# Roles
# ============================================================================
@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[RoleResponse]:
    return await admin_service.list_roles(session)


@router.post(
    "/roles",
    response_model=RoleResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_role(
    body: RoleCreateRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> RoleResponse:
    return await admin_service.create_role(session, body=body, audit=audit)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RoleResponse:
    return await admin_service.get_role(session, role_id)


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: UUID,
    body: RoleUpdateRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> RoleResponse:
    return await admin_service.update_role(session, role_id=role_id, body=body, audit=audit)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: UUID,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> None:
    await admin_service.delete_role(session, role_id=role_id, audit=audit)


@router.put("/roles/{role_id}/permissions", response_model=RoleResponse)
async def set_role_permissions(
    role_id: UUID,
    body: RoleSetPermissionsRequest,
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
    audit: Annotated[AuditWriter, Depends(get_audit_writer)],
) -> RoleResponse:
    return await admin_service.set_role_permissions(
        session, role_id=role_id, body=body, audit=audit
    )


# ============================================================================
# Permissions
# ============================================================================
@router.get("/permissions", response_model=list[PermissionResponse])
async def list_permissions(
    _: Annotated[
        AuthenticatedUser,
        Depends(require_permissions(any_of=["admin:roles:manage", "admin:view", "*"])),
    ],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> list[PermissionResponse]:
    return await admin_service.list_permissions(session)
