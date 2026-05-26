"""Helpers cookies httpOnly pour les tokens JWT (access + refresh).

Convention (cf. ADR P0 #4) :

- Deux cookies distincts pour confiner le refresh à l'endpoint qui en a
  besoin :
    * ``settings.jwt_cookie_name`` (defaut ``rh_access``) : ``Path=/``
    * ``settings.jwt_refresh_cookie_name`` (defaut ``rh_refresh``) :
      ``Path=/api/v1/auth/refresh`` (le navigateur ne l'enverra QUE sur
      cet endpoint, réduisant la surface CSRF + l'exposition réseau).
- ``SameSite=Lax`` par défaut (compromis entre confort UX et CSRF).
- ``Secure`` est conditionnel (False en dev local sans TLS, True forcé en
  staging/prod via validator dans :mod:`app.core.config`).
- ``Domain`` est vide par défaut (cookie *host-only*, plus sûr).

API :

- :func:`set_auth_cookies` : pose les deux cookies (login + refresh).
- :func:`clear_auth_cookies` : les supprime (logout).
"""

from __future__ import annotations

from typing import Literal, cast

from fastapi import Response

from app.core.config import Settings

REFRESH_COOKIE_PATH: str = "/api/v1/auth/refresh"


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    settings: Settings,
) -> None:
    """Pose les deux cookies httpOnly d'authentification.

    Doit être appelé après chaque émission de paire de tokens
    (login, refresh). Les valeurs de TTL et de flags proviennent
    intégralement des settings — l'appelant n'a aucune décision
    sécurité à prendre ici.
    """
    samesite = cast(
        Literal["lax", "strict", "none"],
        settings.jwt_cookie_samesite.lower(),
    )
    response.set_cookie(
        key=settings.jwt_cookie_name,
        value=access_token,
        max_age=settings.jwt_access_ttl_seconds,
        httponly=True,
        secure=settings.jwt_cookie_secure,
        samesite=samesite,
        path="/",
        domain=settings.jwt_cookie_domain,
    )
    response.set_cookie(
        key=settings.jwt_refresh_cookie_name,
        value=refresh_token,
        max_age=settings.jwt_refresh_ttl_seconds,
        httponly=True,
        secure=settings.jwt_cookie_secure,
        samesite=samesite,
        path=REFRESH_COOKIE_PATH,
        domain=settings.jwt_cookie_domain,
    )


def clear_auth_cookies(response: Response, settings: Settings) -> None:
    """Supprime les deux cookies d'authentification (logout).

    Important : le ``path`` (et le ``domain`` le cas échéant) doivent
    correspondre exactement à ceux utilisés à la pose, sinon le
    navigateur garde l'ancien cookie.
    """
    response.delete_cookie(
        key=settings.jwt_cookie_name,
        path="/",
        domain=settings.jwt_cookie_domain,
    )
    response.delete_cookie(
        key=settings.jwt_refresh_cookie_name,
        path=REFRESH_COOKIE_PATH,
        domain=settings.jwt_cookie_domain,
    )


__all__ = ["REFRESH_COOKIE_PATH", "clear_auth_cookies", "set_auth_cookies"]
