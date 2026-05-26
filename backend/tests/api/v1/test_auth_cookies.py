"""Tests d'intégration — JWT httpOnly cookies (P0 #4 Sub-1+2+3).

Couvre :

- Pose des cookies ``rh_access`` (Path=/) + ``rh_refresh`` (Path=/api/v1/auth/refresh)
  à /login.
- Présence/absence des tokens dans le body selon ``jwt_return_token_in_body``.
- Flags ``Secure`` / ``HttpOnly`` / ``SameSite`` selon l'environnement.
- /refresh : lecture du token depuis le cookie en priorité, fallback body
  (compat), 401 si rien, 429 sur dépassement du rate-limiter dédié.
- /logout : suppression des deux cookies (Max-Age=0).
- ``get_current_user`` : lecture cookie d'abord, fallback Bearer (compat
  tests E2E), 401 sinon.

Ces tests N'EXIGENT PAS PostgreSQL : on mocke ``auth_service.login`` et
``auth_service.refresh`` via ``monkeypatch`` pour rester sur le périmètre
HTTP/cookies/router/dépendance ``get_current_user``.
"""

from __future__ import annotations

from collections.abc import AsyncIterator, Iterator
from typing import Annotated, Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.config import get_settings
from app.core.errors import AuthenticationError
from app.core.security.rate_limit import reset_limiters_for_tests
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.core.security.tokens import create_access_token, create_refresh_token
from app.schemas.auth import (
    LoginResponse,
    RefreshResponse,
    TokenPair,
    UserSummary,
)
from app.services import auth_service
from fastapi import Depends, FastAPI
from httpx import ASGITransport, AsyncClient


# Route protégée minimale pour tester get_current_user.
# Définie au module pour que `Annotated` se résolve correctement à
# l'inspection FastAPI (avec ``from __future__ import annotations``,
# les annotations locales à une fonction interne ne sont pas évaluables).
async def _whoami_route(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, str]:
    return {"user_id": str(user.user_id)}


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


_FAKE_USER_ID = uuid4()
_FAKE_ORG_ID = uuid4()


@pytest.fixture
def _reset_rate_limiters() -> Iterator[None]:
    """Reset des singletons rate-limiter entre tests (sinon état partagé)."""
    reset_limiters_for_tests()
    yield
    reset_limiters_for_tests()


def _mk_token_pair() -> TokenPair:
    """Fabrique une vraie paire de tokens (les vraies signatures sont décodables)."""
    access, access_exp = create_access_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )
    refresh, refresh_exp = create_refresh_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        access_expires_at=access_exp,
        refresh_expires_at=refresh_exp,
    )


def _mk_login_response() -> LoginResponse:
    return LoginResponse(
        user=UserSummary(
            user_id=_FAKE_USER_ID,
            username="alice",
            full_name="Alice Test",
            organization_id=_FAKE_ORG_ID,
            roles=["admin"],
            permissions=["personnel:view"],
            scopes=["GLOBAL"],
        ),
        tokens=_mk_token_pair(),
    )


def _mk_refresh_response() -> RefreshResponse:
    return RefreshResponse(tokens=_mk_token_pair())


def _mk_fake_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=_FAKE_USER_ID,
        organization_id=_FAKE_ORG_ID,
        username="alice",
        full_name="Alice Test",
        status="ACTIVE",
        roles=("admin",),
        permissions=frozenset({"*"}),
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _build_app() -> FastAPI:
    """Construit l'app FastAPI avec un settings rafraîchi (cf. env patché)."""
    # Le settings est lru_cache : on doit le clear après tout monkeypatch d'env.
    get_settings.cache_clear()
    from app.main import create_app

    app = create_app()
    return app


@pytest_asyncio.fixture
async def client_dev(
    monkeypatch: pytest.MonkeyPatch,
    _reset_rate_limiters: None,
) -> AsyncIterator[AsyncClient]:
    """Client en mode dev (jwt_return_token_in_body=True, Secure=False)."""
    monkeypatch.setenv("ENV", "dev")
    monkeypatch.setenv("JWT_RETURN_TOKEN_IN_BODY", "true")
    monkeypatch.setenv("JWT_COOKIE_SECURE", "false")
    app = _build_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
    # Important : restaurer le settings par défaut pour ne PAS polluer les
    # tests suivants (qui peuvent dépendre du conftest global).
    get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Helpers : monkeypatch des services pour shortcut la DB
# ---------------------------------------------------------------------------


def _patch_login_success(
    monkeypatch: pytest.MonkeyPatch,
    response: LoginResponse | None = None,
) -> None:
    payload = response or _mk_login_response()

    async def _fake_login(**_kwargs: Any) -> LoginResponse:
        return payload

    monkeypatch.setattr(auth_service, "login", _fake_login)


def _patch_refresh_success(
    monkeypatch: pytest.MonkeyPatch,
    response: RefreshResponse | None = None,
) -> None:
    payload = response or _mk_refresh_response()

    async def _fake_refresh(**_kwargs: Any) -> RefreshResponse:
        return payload

    monkeypatch.setattr(auth_service, "refresh", _fake_refresh)


def _patch_refresh_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """Simule un refresh qui échoue (compte inactif côté DB)."""

    async def _fake_refresh(**_kwargs: Any) -> RefreshResponse:
        raise AuthenticationError("compte inactif", code="USER_INACTIVE")

    monkeypatch.setattr(auth_service, "refresh", _fake_refresh)


def _override_session(app: FastAPI) -> None:
    """Override get_session pour éviter d'avoir besoin d'une vraie DB."""
    from app.core.db import get_session

    async def _fake_session() -> AsyncIterator[None]:
        yield None  # type: ignore[misc]

    app.dependency_overrides[get_session] = _fake_session


# ---------------------------------------------------------------------------
# Sub-1 — /login pose des cookies
# ---------------------------------------------------------------------------


async def test_login_sets_access_and_refresh_cookies(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """POST /login → set-cookie ``rh_access`` + ``rh_refresh``."""
    _patch_login_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    response = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    assert response.status_code == 200, response.text

    settings = get_settings()
    set_cookies = response.headers.get_list("set-cookie")
    assert any(s.startswith(settings.jwt_cookie_name + "=") for s in set_cookies)
    assert any(s.startswith(settings.jwt_refresh_cookie_name + "=") for s in set_cookies)


async def test_login_cookies_have_httponly_and_samesite_flags(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Les deux cookies portent ``HttpOnly`` + ``SameSite=Lax``."""
    _patch_login_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    response = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    assert response.status_code == 200

    settings = get_settings()
    set_cookies = response.headers.get_list("set-cookie")
    access_line = next(s for s in set_cookies if s.startswith(settings.jwt_cookie_name + "="))
    refresh_line = next(
        s for s in set_cookies if s.startswith(settings.jwt_refresh_cookie_name + "=")
    )
    for line in (access_line, refresh_line):
        assert "HttpOnly" in line, line
        assert "samesite=lax" in line.lower(), line


async def test_login_cookies_no_secure_in_dev(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """En dev, ``Secure`` n'est pas posé (compat http://localhost)."""
    _patch_login_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    response = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    set_cookies = response.headers.get_list("set-cookie")
    for line in set_cookies:
        assert "Secure" not in line, line


@pytest.mark.usefixtures("_reset_rate_limiters")
async def test_login_cookies_have_secure_flag_in_prod(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """En prod, ``Secure`` est forcé sur les deux cookies."""
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("JWT_COOKIE_SECURE", "true")
    monkeypatch.setenv("JWT_RETURN_TOKEN_IN_BODY", "false")
    monkeypatch.setenv("BCRYPT_ROUNDS", "12")
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )
    get_settings.cache_clear()
    _patch_login_success(monkeypatch)

    app = _build_app()
    _override_session(app)

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={"username": "alice", "password": "x" * 12},
            )
        assert response.status_code == 200, response.text

        settings = get_settings()
        set_cookies = response.headers.get_list("set-cookie")
        access_line = next(s for s in set_cookies if s.startswith(settings.jwt_cookie_name + "="))
        refresh_line = next(
            s for s in set_cookies if s.startswith(settings.jwt_refresh_cookie_name + "=")
        )
        for line in (access_line, refresh_line):
            assert "Secure" in line, line
    finally:
        get_settings.cache_clear()


async def test_login_refresh_cookie_path_is_scoped(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Le cookie refresh est scoped à ``/api/v1/auth/refresh``."""
    _patch_login_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    response = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    settings = get_settings()
    set_cookies = response.headers.get_list("set-cookie")
    refresh_line = next(
        s for s in set_cookies if s.startswith(settings.jwt_refresh_cookie_name + "=")
    )
    assert "Path=/api/v1/auth/refresh" in refresh_line, refresh_line
    access_line = next(s for s in set_cookies if s.startswith(settings.jwt_cookie_name + "="))
    assert "Path=/" in access_line, access_line


async def test_login_body_contains_tokens_when_flag_true(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """En dev (flag=True), les tokens sont aussi présents dans le body."""
    _patch_login_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    response = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    body = response.json()
    assert body["tokens"] is not None
    assert "access_token" in body["tokens"]


@pytest.mark.usefixtures("_reset_rate_limiters")
async def test_login_body_omits_tokens_when_flag_false(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """En prod (flag=False), le body ne contient PAS les tokens."""
    monkeypatch.setenv("ENV", "prod")
    monkeypatch.setenv("JWT_COOKIE_SECURE", "true")
    monkeypatch.setenv("JWT_RETURN_TOKEN_IN_BODY", "false")
    monkeypatch.setenv("BCRYPT_ROUNDS", "12")
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    )
    get_settings.cache_clear()
    _patch_login_success(monkeypatch)

    app = _build_app()
    _override_session(app)

    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/auth/login",
                json={"username": "alice", "password": "x" * 12},
            )
        body = response.json()
        assert body["tokens"] is None
        assert body["user"]["username"] == "alice"
    finally:
        get_settings.cache_clear()


# ---------------------------------------------------------------------------
# Sub-2 — /refresh lit le cookie + rate-limit
# ---------------------------------------------------------------------------


async def test_refresh_from_cookie_renews_tokens(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """POST /refresh avec cookie rh_refresh → 200 + nouveaux cookies."""
    _patch_login_success(monkeypatch)
    _patch_refresh_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    login_resp = await client_dev.post(
        "/api/v1/auth/login",
        json={"username": "alice", "password": "x" * 12},
    )
    assert login_resp.status_code == 200
    settings = get_settings()
    refresh_cookie = client_dev.cookies.get(
        settings.jwt_refresh_cookie_name,
        path="/api/v1/auth/refresh",
    )
    assert refresh_cookie, "Cookie refresh non récupéré du login"

    response = await client_dev.post("/api/v1/auth/refresh", json={})
    assert response.status_code == 200, response.text
    set_cookies = response.headers.get_list("set-cookie")
    assert any(s.startswith(settings.jwt_cookie_name + "=") for s in set_cookies)
    assert any(s.startswith(settings.jwt_refresh_cookie_name + "=") for s in set_cookies)


async def test_refresh_from_body_still_works_for_compat(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """POST /refresh avec body.refresh_token (sans cookie) → 200 (compat)."""
    _patch_refresh_success(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]

    refresh_token, _ = create_refresh_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )
    client_dev.cookies.clear()

    response = await client_dev.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert response.status_code == 200, response.text


async def test_refresh_without_token_returns_401(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """POST /refresh sans cookie ni body → 401."""
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]
    client_dev.cookies.clear()

    response = await client_dev.post("/api/v1/auth/refresh", json={})
    assert response.status_code == 401, response.text
    body = response.json()
    assert body["error"]["code"] == "REFRESH_TOKEN_MISSING"


async def test_refresh_rate_limit_locks_after_n_attempts(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Au-delà du seuil de tentatives échouées, /refresh renvoie 429."""
    _patch_refresh_failure(monkeypatch)
    _override_session(client_dev._transport.app)  # type: ignore[attr-defined]
    client_dev.cookies.clear()

    refresh_token, _ = create_refresh_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )

    settings = get_settings()
    max_attempts = settings.rate_limit_refresh_max
    statuses: list[int] = []
    for _ in range(max_attempts + 1):
        r = await client_dev.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        statuses.append(r.status_code)

    assert statuses[-1] == 429, statuses
    assert any(s == 401 for s in statuses[:-1]), statuses


# ---------------------------------------------------------------------------
# Sub-3 — /logout clear cookies + get_current_user lit cookie
# ---------------------------------------------------------------------------


async def test_logout_clears_both_cookies(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """POST /logout → set-cookie sur ``rh_access`` et ``rh_refresh`` avec Max-Age=0."""
    app = client_dev._transport.app  # type: ignore[attr-defined]
    fake_user = _mk_fake_user()

    async def _fake_current_user() -> AuthenticatedUser:
        return fake_user

    from app.core.audit import AuditWriter, get_audit_writer

    class _NoopAudit:
        async def record(self, *_args: Any, **_kwargs: Any) -> None:
            return None

    async def _fake_audit() -> AuditWriter:
        return _NoopAudit()  # type: ignore[return-value]

    app.dependency_overrides[get_current_user] = _fake_current_user
    app.dependency_overrides[get_audit_writer] = _fake_audit
    _override_session(app)

    response = await client_dev.post("/api/v1/auth/logout")
    assert response.status_code == 204, response.text

    settings = get_settings()
    set_cookies = response.headers.get_list("set-cookie")
    cleared_names = [s.split("=", 1)[0] for s in set_cookies]
    assert settings.jwt_cookie_name in cleared_names
    assert settings.jwt_refresh_cookie_name in cleared_names
    for line in set_cookies:
        assert "Max-Age=0" in line or "1970" in line or "expires=" in line.lower(), line


def _install_whoami_route(app: FastAPI, monkeypatch: pytest.MonkeyPatch) -> None:
    """Ajoute /api/v1/_test/whoami protégée par get_current_user.

    Mocke aussi la session DB + ``_load_user`` pour ne pas dépendre de PG.
    """
    from app.core.db import get_session
    from app.core.security import rbac

    async def _fake_load_user(_session: Any, _user_id: UUID) -> Any:
        class _U:
            user_id = _FAKE_USER_ID
            organization_id = _FAKE_ORG_ID
            username = "alice"
            full_name = "Alice"
            status = "ACTIVE"
            roles: list[Any] = []
            scopes: list[Any] = []
            direction_id = None
            unit_id = None
            employee_id = None

        return _U()

    monkeypatch.setattr(rbac, "_load_user", _fake_load_user)

    async def _fake_session() -> AsyncIterator[None]:
        yield None  # type: ignore[misc]

    app.dependency_overrides[get_session] = _fake_session
    app.add_api_route("/api/v1/_test/whoami", _whoami_route, methods=["GET"])


async def test_get_current_user_reads_cookie_first(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Une route protégée accepte un token via cookie ``rh_access`` (sans Bearer)."""
    app = client_dev._transport.app  # type: ignore[attr-defined]
    _install_whoami_route(app, monkeypatch)

    access_token, _ = create_access_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )
    settings = get_settings()
    client_dev.cookies.clear()
    client_dev.cookies.set(settings.jwt_cookie_name, access_token, path="/")

    response = await client_dev.get("/api/v1/_test/whoami")
    assert response.status_code == 200, response.text
    assert response.json()["user_id"] == str(_FAKE_USER_ID)


async def test_get_current_user_falls_back_to_bearer(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Sans cookie, la lecture Bearer fonctionne toujours (compat D5)."""
    app = client_dev._transport.app  # type: ignore[attr-defined]
    _install_whoami_route(app, monkeypatch)

    access_token, _ = create_access_token(
        user_id=_FAKE_USER_ID,
        username="alice",
        organization_id=_FAKE_ORG_ID,
    )
    client_dev.cookies.clear()

    response = await client_dev.get(
        "/api/v1/_test/whoami",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200, response.text


async def test_get_current_user_without_anything_returns_401(
    monkeypatch: pytest.MonkeyPatch,
    client_dev: AsyncClient,
) -> None:
    """Ni cookie ni Bearer → 401."""
    app = client_dev._transport.app  # type: ignore[attr-defined]
    _install_whoami_route(app, monkeypatch)

    client_dev.cookies.clear()
    response = await client_dev.get("/api/v1/_test/whoami")
    assert response.status_code == 401, response.text
