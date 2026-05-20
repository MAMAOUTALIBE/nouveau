"""RBAC FastAPI — dépendances réutilisables sur chaque endpoint.

Décisions V0 :
- L'utilisateur authentifié est résolu via JWT + lookup DB (frais à chaque
  requête en V0 ; à mettre en cache par requête en V2 si profilage le justifie).
- Les permissions sont des chaînes (ex: "personnel:view") matchées à l'identique
  avec celles définies en frontend (`access-control.service.ts`).
- Wildcard "*" = super_admin → toute permission accordée.
- Les scopes (`SELF`/`TEAM`/`UNIT`/`DIRECTION`/`GLOBAL`) sont vérifiés
  séparément : un GLOBAL implique tous les autres scopes.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable, Iterable
from dataclasses import dataclass
from typing import Annotated, Literal
from uuid import UUID

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_session
from app.core.errors import AuthenticationError, ForbiddenError
from app.core.security.tokens import decode_token
from app.models.permission import Role
from app.models.user import User

ScopeType = Literal["SELF", "TEAM", "UNIT", "DIRECTION", "GLOBAL"]
SCOPE_HIERARCHY: tuple[ScopeType, ...] = (
    "SELF",
    "TEAM",
    "UNIT",
    "DIRECTION",
    "GLOBAL",
)


@dataclass(frozen=True, slots=True)
class AuthenticatedUser:
    """Représente l'utilisateur authentifié, prêt à être injecté dans un endpoint."""

    user_id: UUID
    organization_id: UUID
    username: str
    full_name: str
    status: str
    roles: tuple[str, ...]
    permissions: frozenset[str]
    scopes: frozenset[ScopeType]
    direction_id: UUID | None
    unit_id: UUID | None
    employee_id: UUID | None = None

    @property
    def is_active(self) -> bool:
        return self.status == "ACTIVE"

    def has_permission(self, permission: str) -> bool:
        return "*" in self.permissions or permission in self.permissions

    def has_any_permission(self, perms: Iterable[str]) -> bool:
        perms_list = list(perms)
        if not perms_list:
            return True
        return any(self.has_permission(p) for p in perms_list)

    def has_all_permissions(self, perms: Iterable[str]) -> bool:
        perms_list = list(perms)
        if not perms_list:
            return True
        return all(self.has_permission(p) for p in perms_list)

    def has_role(self, role: str) -> bool:
        return role in self.roles

    def has_any_role(self, roles: Iterable[str]) -> bool:
        roles_list = list(roles)
        if not roles_list:
            return True
        return any(r in self.roles for r in roles_list)

    def has_scope(self, scope: ScopeType) -> bool:
        if "GLOBAL" in self.scopes:
            return True
        return scope in self.scopes


_bearer = HTTPBearer(auto_error=False)


async def _load_user(session: AsyncSession, user_id: UUID) -> User | None:
    stmt = (
        select(User)
        .where(User.user_id == user_id)
        .options(selectinload(User.roles).selectinload(Role.permissions))
        .options(selectinload(User.scopes))
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def resolve_permissions(user: User) -> frozenset[str]:
    """Calcule la liste des permissions effectives de l'utilisateur."""
    perms: set[str] = set()
    for role in user.roles:
        if role.code == "super_admin":
            perms.add("*")
        for permission in role.permissions:
            perms.add(permission.code)
    return frozenset(perms)


def resolve_scopes(user: User) -> frozenset[ScopeType]:
    """Calcule les scopes effectifs (GLOBAL absorbe le reste)."""
    raw = {scope.scope_type for scope in user.scopes}
    if "GLOBAL" in raw:
        return frozenset(["GLOBAL"])
    valid: set[ScopeType] = set()
    for value in raw:
        if value in SCOPE_HIERARCHY:
            valid.add(value)
    return frozenset(valid)


async def get_current_user(
    request: Request,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuthenticatedUser:
    """Dépendance principale : extrait le JWT, charge l'utilisateur en DB."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise AuthenticationError("Authentification requise.")

    payload = decode_token(credentials.credentials, expected_type="access")
    user = await _load_user(session, payload.user_id)
    if user is None:
        raise AuthenticationError("Utilisateur introuvable.", code="USER_NOT_FOUND")
    if user.status != "ACTIVE":
        raise ForbiddenError(
            "Compte utilisateur inactif ou suspendu.",
            code="USER_INACTIVE",
        )

    auth_user = AuthenticatedUser(
        user_id=user.user_id,
        organization_id=user.organization_id,
        username=str(user.username),
        full_name=user.full_name,
        status=user.status,
        roles=tuple(role.code for role in user.roles),
        permissions=resolve_permissions(user),
        scopes=resolve_scopes(user),
        direction_id=user.direction_id,
        unit_id=user.unit_id,
        employee_id=user.employee_id,
    )
    # Stocker dans request.state pour les middlewares (audit)
    request.state.current_user = auth_user
    return auth_user


def require_permissions(
    *,
    any_of: Iterable[str] | None = None,
    all_of: Iterable[str] | None = None,
) -> Callable[[AuthenticatedUser], Awaitable[AuthenticatedUser]]:
    """Factory de dépendance : valide qu'un utilisateur a les permissions requises.

    Usage :
        @router.get("/agents", dependencies=[
            Depends(require_permissions(any_of=["personnel:view"])),
        ])
    """
    any_list = tuple(any_of or ())
    all_list = tuple(all_of or ())

    async def _checker(
        current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    ) -> AuthenticatedUser:
        if any_list and not current_user.has_any_permission(any_list):
            raise ForbiddenError(
                "Permissions insuffisantes.",
                details={"required_any": list(any_list)},
            )
        if all_list and not current_user.has_all_permissions(all_list):
            raise ForbiddenError(
                "Permissions insuffisantes.",
                details={"required_all": list(all_list)},
            )
        return current_user

    return _checker


def require_roles(
    *roles: str,
) -> Callable[[AuthenticatedUser], Awaitable[AuthenticatedUser]]:
    """Factory de dépendance : exige que l'utilisateur ait au moins un des rôles."""
    role_list = tuple(roles)

    async def _checker(
        current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    ) -> AuthenticatedUser:
        if role_list and not current_user.has_any_role(role_list):
            raise ForbiddenError(
                "Rôle insuffisant.",
                details={"required_any_role": list(role_list)},
            )
        return current_user

    return _checker


def require_scope(
    scope: ScopeType,
) -> Callable[[AuthenticatedUser], Awaitable[AuthenticatedUser]]:
    """Factory de dépendance : exige un scope minimum."""

    async def _checker(
        current_user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    ) -> AuthenticatedUser:
        if not current_user.has_scope(scope):
            raise ForbiddenError(
                "Périmètre d'accès insuffisant.",
                details={"required_scope": scope},
            )
        return current_user

    return _checker
