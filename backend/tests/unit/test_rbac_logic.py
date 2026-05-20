"""Tests unitaires de la logique RBAC sur AuthenticatedUser."""

from __future__ import annotations

from uuid import uuid4

from app.core.security.rbac import AuthenticatedUser


def _user(
    *,
    permissions: list[str],
    scopes: list[str] | None = None,
    roles: list[str] | None = None,
) -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=uuid4(),
        organization_id=uuid4(),
        username="testuser",
        full_name="Test User",
        status="ACTIVE",
        roles=tuple(roles or ()),
        permissions=frozenset(permissions),
        scopes=frozenset(scopes or []),  # type: ignore[arg-type]
        direction_id=None,
        unit_id=None,
    )


def test_wildcard_grants_all() -> None:
    u = _user(permissions=["*"])
    assert u.has_permission("anything")
    assert u.has_any_permission(["x", "y"])
    assert u.has_all_permissions(["x", "y", "z"])


def test_specific_permission_match() -> None:
    u = _user(permissions=["personnel:view"])
    assert u.has_permission("personnel:view")
    assert not u.has_permission("personnel:manage")


def test_global_scope_implies_others() -> None:
    u = _user(permissions=[], scopes=["GLOBAL"])
    assert u.has_scope("SELF")
    assert u.has_scope("DIRECTION")
    assert u.has_scope("GLOBAL")


def test_specific_scope_only() -> None:
    u = _user(permissions=[], scopes=["DIRECTION"])
    assert u.has_scope("DIRECTION")
    assert not u.has_scope("GLOBAL")
    assert not u.has_scope("SELF")


def test_inactive_user() -> None:
    u = AuthenticatedUser(
        user_id=uuid4(),
        organization_id=uuid4(),
        username="x",
        full_name="x",
        status="SUSPENDED",
        roles=(),
        permissions=frozenset(),
        scopes=frozenset(),
        direction_id=None,
        unit_id=None,
    )
    assert not u.is_active


def test_empty_lists_pass_through() -> None:
    """Sans permissions/rôles requis, l'utilisateur passe (no-op)."""
    u = _user(permissions=[])
    assert u.has_any_permission([]) is True
    assert u.has_all_permissions([]) is True
    assert u.has_any_role([]) is True
