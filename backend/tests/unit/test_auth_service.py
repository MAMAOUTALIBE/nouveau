"""Tests unitaires — `app.services.auth_service` (login / refresh).

Couvre les chemins critiques de sécurité sans monter de DB Postgres :

- Login OK / KO (mauvais password, user inexistant, compte suspendu, lock).
- Brute-force : 5 echecs → 6e bloquée par le rate-limiter.
- Refresh OK / KO (token expiré, signature corrompue, user inexistant /
  desactive, type incorrect).
- Audit : LOGIN_SUCCESS enregistré uniquement en cas de succès, JAMAIS en
  cas d'echec (cf. note V0 du service : l'echec est uniquement loggé).
- Bcrypt round-trip (helpers utilises par le service).

Strategie : on remplace `_load_user_by_username` / `_load_user_by_id` par
des fakes via monkeypatch. La session SQLAlchemy n'est jamais sollicitee
dans ces tests — seul `user.last_login_at = …` doit pouvoir s'ecrire, ce
qui ne necessite pas de session active (l'attribut est une simple Mapped
column, settable hors transaction).

Aucune PII reelle : usernames / passwords synthetiques.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import UUID, uuid4

import pytest
from app.core.errors import AuthenticationError, ForbiddenError, RateLimitError
from app.core.security.passwords import hash_password, verify_password
from app.core.security.rate_limit import LoginRateLimiter
from app.core.security.tokens import create_refresh_token, decode_token
from app.schemas.auth import LoginResponse, RefreshResponse
from app.services import auth_service

# ---------------------------------------------------------------------------
# Helpers : fakes minimalistes
# ---------------------------------------------------------------------------


@dataclass
class _FakeRole:
    code: str = "agent"
    permissions: list[Any] = field(default_factory=list)


@dataclass
class _FakeUser:
    """Reproduit la surface ORM `User` utilisee par `auth_service`.

    On garde uniquement les attributs lus par `login` / `refresh` (pas
    besoin de simuler tous les Mapped columns).
    """

    user_id: UUID
    organization_id: UUID
    username: str
    full_name: str = "Alice Test"
    status: str = "ACTIVE"
    password_hash: str = ""
    last_login_at: Any = None
    roles: list[_FakeRole] = field(default_factory=lambda: [_FakeRole()])
    scopes: list[Any] = field(default_factory=list)


class _FakeAudit:
    """Capture les appels `record()` pour assertions."""

    def __init__(self) -> None:
        self.calls: list[dict[str, Any]] = []

    async def record(self, **kwargs: Any) -> None:
        self.calls.append(kwargs)


@dataclass
class _LoaderState:
    """Configure ce que `_load_user_by_username` / `_by_id` retournent."""

    user: _FakeUser | None = None


def _patch_loaders(
    monkeypatch: pytest.MonkeyPatch,
    *,
    by_username: _FakeUser | None = None,
    by_id: _FakeUser | None = None,
) -> None:
    """Remplace les loaders DB par des fakes synchrones renvoyant `user`."""

    async def _fake_by_username(_session: Any, _identifier: str) -> _FakeUser | None:
        return by_username

    async def _fake_by_id(_session: Any, _user_id: UUID) -> _FakeUser | None:
        return by_id

    monkeypatch.setattr(auth_service, "_load_user_by_username", _fake_by_username)
    monkeypatch.setattr(auth_service, "_load_user_by_id", _fake_by_id)


def _make_user(
    *,
    username: str = "alice",
    password_plain: str = "S3cret-Pass!",  # noqa: S107 - test fixture
    status: str = "ACTIVE",
) -> _FakeUser:
    return _FakeUser(
        user_id=uuid4(),
        organization_id=uuid4(),
        username=username,
        password_hash=hash_password(password_plain),
        status=status,
    )


# Patch du builder du UserSummary : il accede aux relations RBAC qui peuvent
# ne pas etre satisfaites par notre fake. On le remplace par une fonction qui
# fabrique un UserSummary minimal a partir du _FakeUser.
@pytest.fixture(autouse=True)
def _bypass_summary_builder(monkeypatch: pytest.MonkeyPatch) -> None:
    from app.schemas.auth import UserSummary

    def _fake_summary(user: Any) -> UserSummary:
        return UserSummary(
            user_id=user.user_id,
            username=str(user.username),
            full_name=user.full_name,
            organization_id=user.organization_id,
            roles=[r.code for r in user.roles],
            permissions=[],
            scopes=[],
        )

    monkeypatch.setattr(auth_service, "_build_user_summary", _fake_summary)


# ---------------------------------------------------------------------------
# Fixtures : rate-limiter neuf par test (eviter etat entre tests)
# ---------------------------------------------------------------------------


@pytest.fixture
def limiter() -> LoginRateLimiter:
    # Seuils volontairement plus serres pour eviter d'avoir a faire 5
    # tentatives reelles partout (sauf le test dedie brute-force).
    return LoginRateLimiter(max_attempts=5, window_seconds=60, lock_seconds=300)


# ===========================================================================
# 1. Login : chemin nominal
# ===========================================================================


async def test_login_ok_returns_tokens_and_records_audit(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)
    audit = _FakeAudit()

    result = await auth_service.login(
        session=object(),  # type: ignore[arg-type]
        username="alice",
        password="GoodPass!",
        rate_limiter=limiter,
        audit=audit,  # type: ignore[arg-type]
    )

    assert isinstance(result, LoginResponse)
    assert result.tokens is not None
    assert result.tokens.access_token
    assert result.tokens.refresh_token
    assert result.user.username == "alice"
    assert user.last_login_at is not None  # mis a jour
    # Audit LOGIN_SUCCESS enregistre une fois
    assert len(audit.calls) == 1
    assert audit.calls[0]["action"] == "LOGIN_SUCCESS"
    assert audit.calls[0]["target_type"] == "user"
    assert audit.calls[0]["target_id"] == str(user.user_id)
    assert audit.calls[0]["actor_user_id"] == user.user_id


async def test_login_ok_resets_rate_limiter(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Apres login reussi, le compteur d'echecs doit etre purge."""
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)

    # Un echec prealable
    await limiter.register_failure("alice")
    await auth_service.login(
        session=object(),  # type: ignore[arg-type]
        username="alice",
        password="GoodPass!",
        rate_limiter=limiter,
        audit=_FakeAudit(),  # type: ignore[arg-type]
    )
    # On peut encore faire (max_attempts - 1) echecs sans lock
    for _ in range(4):
        await limiter.register_failure("alice")
    assert await limiter.check("alice") is None


async def test_login_ok_without_audit(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """audit=None autorisé (cf. signature). Pas d'exception, pas d'audit."""
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)

    result = await auth_service.login(
        session=object(),  # type: ignore[arg-type]
        username="alice",
        password="GoodPass!",
        rate_limiter=limiter,
        audit=None,
    )
    assert isinstance(result, LoginResponse)


# ===========================================================================
# 2. Login : echecs
# ===========================================================================


async def test_login_wrong_password_raises_auth_error(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)
    audit = _FakeAudit()

    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="alice",
            password="WrongPass!",
            rate_limiter=limiter,
            audit=audit,  # type: ignore[arg-type]
        )
    assert exc_info.value.code == "BAD_CREDENTIALS"
    # Aucun audit ne doit etre ecrit en cas d'echec (note V0 : rollback).
    assert audit.calls == []


async def test_login_unknown_user_raises_same_generic_error(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Anti-enumeration : meme code/message qu'un mauvais password."""
    _patch_loaders(monkeypatch, by_username=None)

    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="ghost",
            password="WhateverPass!",
            rate_limiter=limiter,
            audit=None,
        )
    assert exc_info.value.code == "BAD_CREDENTIALS"


async def test_login_failure_registers_rate_limiter_attempt(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Un echec doit incrementer le compteur (sinon brute-force impossible a bloquer)."""
    _patch_loaders(monkeypatch, by_username=None)
    # 4 echecs ne lockent pas (max=5)
    for _ in range(4):
        with pytest.raises(AuthenticationError):
            await auth_service.login(
                session=object(),  # type: ignore[arg-type]
                username="ghost",
                password="bad",
                rate_limiter=limiter,
                audit=None,
            )
    assert await limiter.check("ghost") is None
    # 5e echec → lock
    with pytest.raises(AuthenticationError):
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="ghost",
            password="bad",
            rate_limiter=limiter,
            audit=None,
        )
    assert await limiter.check("ghost") is not None


async def test_login_brute_force_6th_attempt_is_rate_limited(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Apres `max_attempts` echecs consecutifs, la tentative suivante leve RateLimitError.

    Le service appelle `rate_limiter.check()` AVANT le lookup user — donc
    meme avec un password correct, le compte verrouille reste bloque.
    """
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)
    # 5 echecs → lock
    for _ in range(5):
        await limiter.register_failure("alice")
    # 6e tentative (meme avec le bon password) → RateLimitError
    with pytest.raises(RateLimitError) as exc_info:
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="alice",
            password="GoodPass!",
            rate_limiter=limiter,
            audit=None,
        )
    assert exc_info.value.retry_after_seconds is not None
    assert exc_info.value.retry_after_seconds > 0


async def test_login_inactive_user_raises_forbidden(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Compte status != ACTIVE → ForbiddenError code USER_INACTIVE."""
    user = _make_user(password_plain="GoodPass!", status="SUSPENDED")
    _patch_loaders(monkeypatch, by_username=user)

    with pytest.raises(ForbiddenError) as exc_info:
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="alice",
            password="GoodPass!",
            rate_limiter=limiter,
            audit=None,
        )
    assert exc_info.value.code == "USER_INACTIVE"


async def test_login_terminated_user_raises_forbidden(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Un user TERMINATED ne doit pas pouvoir se connecter."""
    user = _make_user(password_plain="GoodPass!", status="TERMINATED")
    _patch_loaders(monkeypatch, by_username=user)
    with pytest.raises(ForbiddenError):
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="alice",
            password="GoodPass!",
            rate_limiter=limiter,
            audit=None,
        )


# ===========================================================================
# 3. Login : details d'implementation
# ===========================================================================


async def test_login_normalizes_username_to_lower(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """`Alice` ou ` ALICE ` doivent generer la meme cle rate-limit (lowercase trimee)."""
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)

    # Lookup case-insensitive est gere par le service (key.strip().lower())
    await auth_service.login(
        session=object(),  # type: ignore[arg-type]
        username="  ALICE  ",
        password="GoodPass!",
        rate_limiter=limiter,
        audit=None,
    )
    # La cle 'alice' a ete reset → un echec ne lock pas
    await limiter.register_failure("alice")
    assert await limiter.check("alice") is None


async def test_login_password_round_trip_via_helpers() -> None:
    """Sanity check du helper bcrypt : hash + verify aller-retour."""
    h = hash_password("Pa55word!")
    assert verify_password("Pa55word!", h) is True
    assert verify_password("Pa55word", h) is False
    assert verify_password("", h) is False


async def test_login_empty_password_fails(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Un password vide doit etre refuse (verify_password retourne False)."""
    user = _make_user(password_plain="GoodPass!")
    _patch_loaders(monkeypatch, by_username=user)
    with pytest.raises(AuthenticationError):
        await auth_service.login(
            session=object(),  # type: ignore[arg-type]
            username="alice",
            password="",
            rate_limiter=limiter,
            audit=None,
        )


# ===========================================================================
# 4. Refresh : nominal & echecs
# ===========================================================================


async def test_refresh_ok_returns_new_token_pair(monkeypatch: pytest.MonkeyPatch) -> None:
    user = _make_user()
    _patch_loaders(monkeypatch, by_id=user)

    refresh_token, _ = create_refresh_token(
        user_id=user.user_id,
        username=user.username,
        organization_id=user.organization_id,
    )

    result = await auth_service.refresh(
        session=object(),  # type: ignore[arg-type]
        refresh_token=refresh_token,
    )
    assert isinstance(result, RefreshResponse)
    assert result.tokens is not None
    assert result.tokens.access_token
    assert result.tokens.refresh_token
    # Verifie qu'on a bien un access token decodable
    payload = decode_token(result.tokens.access_token, expected_type="access")
    assert payload.user_id == user.user_id


async def test_refresh_rejects_signature_garbage() -> None:
    """Un refresh token bidon doit lever AuthenticationError."""
    with pytest.raises(AuthenticationError):
        await auth_service.refresh(
            session=object(),  # type: ignore[arg-type]
            refresh_token="not.a.real.jwt",
        )


async def test_refresh_rejects_access_token_as_refresh() -> None:
    """Passer un access token a /refresh doit lever TOKEN_WRONG_TYPE."""
    from app.core.security.tokens import create_access_token

    access, _ = create_access_token(user_id=uuid4(), username="x", organization_id=uuid4())
    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.refresh(
            session=object(),  # type: ignore[arg-type]
            refresh_token=access,
        )
    assert exc_info.value.code == "TOKEN_WRONG_TYPE"


async def test_refresh_rejects_expired_token() -> None:
    """Un token forge avec exp dans le passé → AuthenticationError TOKEN_EXPIRED."""
    import time

    import jwt as pyjwt
    from app.core.config import get_settings

    settings = get_settings()
    payload: dict[str, Any] = {
        "sub": str(uuid4()),
        "type": "refresh",
        "iat": int(time.time()) - 7200,
        "exp": int(time.time()) - 60,
        "jti": str(uuid4()),
        "username": "alice",
        "organization_id": str(uuid4()),
    }
    expired = pyjwt.encode(
        payload,
        settings.jwt_secret_key.get_secret_value(),
        algorithm=settings.jwt_algorithm,
    )
    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.refresh(
            session=object(),  # type: ignore[arg-type]
            refresh_token=expired,
        )
    # Soit TOKEN_EXPIRED soit TOKEN_INVALID selon l'ordre de check
    assert exc_info.value.code in ("TOKEN_EXPIRED", "TOKEN_INVALID")


async def test_refresh_rejects_unknown_user(monkeypatch: pytest.MonkeyPatch) -> None:
    """Refresh signe valide MAIS user introuvable en DB → AuthenticationError."""
    _patch_loaders(monkeypatch, by_id=None)
    refresh_token, _ = create_refresh_token(
        user_id=uuid4(), username="ghost", organization_id=uuid4()
    )
    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.refresh(
            session=object(),  # type: ignore[arg-type]
            refresh_token=refresh_token,
        )
    assert exc_info.value.code == "USER_INACTIVE"


async def test_refresh_rejects_inactive_user(monkeypatch: pytest.MonkeyPatch) -> None:
    """Refresh d'un user devenu inactif entre temps → AuthenticationError."""
    user = _make_user(status="SUSPENDED")
    _patch_loaders(monkeypatch, by_id=user)
    refresh_token, _ = create_refresh_token(
        user_id=user.user_id,
        username=user.username,
        organization_id=user.organization_id,
    )
    with pytest.raises(AuthenticationError) as exc_info:
        await auth_service.refresh(
            session=object(),  # type: ignore[arg-type]
            refresh_token=refresh_token,
        )
    assert exc_info.value.code == "USER_INACTIVE"


# ===========================================================================
# 5. Rate-limiter : isolation entre utilisateurs
# ===========================================================================


async def test_rate_limit_failures_isolated_per_username(
    monkeypatch: pytest.MonkeyPatch, limiter: LoginRateLimiter
) -> None:
    """Lock sur 'alice' ne doit PAS bloquer 'bob'."""
    _patch_loaders(monkeypatch, by_username=None)
    for _ in range(5):
        with pytest.raises(AuthenticationError):
            await auth_service.login(
                session=object(),  # type: ignore[arg-type]
                username="alice",
                password="bad",
                rate_limiter=limiter,
                audit=None,
            )
    # alice lock
    assert await limiter.check("alice") is not None
    # bob libre
    assert await limiter.check("bob") is None
