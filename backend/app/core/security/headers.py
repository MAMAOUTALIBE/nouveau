"""Middleware d'en-têtes HTTP de sécurité.

Centralise CSP, HSTS, X-Frame-Options, COOP/COEP/CORP, Permissions-Policy
et Referrer-Policy. La construction des valeurs dépend de l'environnement
(`Settings.env`) :

* en **production** : politique stricte — HSTS preload, CSP serrée,
  COOP/COEP same-origin, COEP require-corp.
* en **dev/staging/test** : politique compatible Swagger UI, hot-reload
  Vite/Angular, sources de polices Google le cas échéant.

L'objectif est de fermer les classes d'attaques OWASP A01/A05 (injection
DOM, clickjacking, downgrade HTTPS) sans casser le développement.
"""

from __future__ import annotations

from collections.abc import Iterable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from app.core.config import Environment, Settings


# ---------------------------------------------------------------------------
# Construction des valeurs CSP / HSTS / Permissions-Policy.
# ---------------------------------------------------------------------------


def _csp_for_env(settings: Settings) -> str:
    """Compose la directive CSP selon l'environnement.

    En production, la politique est restrictive. En dev, on autorise
    `'unsafe-inline'` pour les styles (Bootstrap + Material) et le
    hot-reload Vite via WebSocket.
    """

    base_directives: dict[str, list[str]] = {
        "default-src": ["'self'"],
        "img-src": ["'self'", "data:", "blob:"],
        "font-src": ["'self'", "data:"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
        "frame-ancestors": ["'none'"],
        "frame-src": ["'none'"],
    }

    if settings.is_prod:
        base_directives["script-src"] = ["'self'"]
        base_directives["style-src"] = ["'self'", "'unsafe-inline'"]
        base_directives["connect-src"] = ["'self'"]
        base_directives["upgrade-insecure-requests"] = []
    else:
        # Dev/staging : Swagger UI charge des assets cdn.jsdelivr.net,
        # Vite dev server expose un WS pour HMR.
        base_directives["script-src"] = ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]
        base_directives["style-src"] = ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]
        base_directives["connect-src"] = ["'self'", "ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*"]

    parts: list[str] = []
    for directive, sources in base_directives.items():
        if sources:
            parts.append(f"{directive} {' '.join(sources)}")
        else:
            parts.append(directive)
    return "; ".join(parts)


def _permissions_policy() -> str:
    """Désactive les API potentiellement intrusives non utilisées."""

    disabled_features: Iterable[str] = (
        "accelerometer",
        "ambient-light-sensor",
        "autoplay",
        "battery",
        "camera",
        "display-capture",
        "document-domain",
        "encrypted-media",
        "fullscreen",
        "geolocation",
        "gyroscope",
        "magnetometer",
        "microphone",
        "midi",
        "payment",
        "picture-in-picture",
        "publickey-credentials-get",
        "screen-wake-lock",
        "sync-xhr",
        "usb",
        "xr-spatial-tracking",
    )
    return ", ".join(f"{feature}=()" for feature in disabled_features)


# ---------------------------------------------------------------------------
# Middleware Starlette.
# ---------------------------------------------------------------------------


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injecte les en-têtes recommandés OWASP / RGS sur chaque réponse.

    Les valeurs sont calculées une seule fois au démarrage (cache instance)
    pour éviter le coût par requête.
    """

    def __init__(self, app: ASGIApp, settings: Settings) -> None:
        super().__init__(app)
        self._settings = settings
        self._csp = _csp_for_env(settings)
        self._permissions_policy = _permissions_policy()
        self._common_headers: dict[str, str] = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": self._permissions_policy,
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-origin",
            "Content-Security-Policy": self._csp,
        }
        if settings.is_prod:
            # 1 an + sous-domaines + preload-list browsers.
            self._common_headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
            self._common_headers["Cross-Origin-Embedder-Policy"] = "require-corp"

    async def dispatch(self, request: Request, call_next):  # type: ignore[no-untyped-def]
        response: Response = await call_next(request)
        for header, value in self._common_headers.items():
            response.headers.setdefault(header, value)
        return response


def build_cors_kwargs(settings: Settings) -> dict[str, object]:
    """Retourne les kwargs `CORSMiddleware` durcis pour la prod.

    En prod, on restreint `allow_methods` et `allow_headers` à des listes
    explicites plutôt que `["*"]`. En dev, on conserve `["*"]` pour ne pas
    gêner le tooling (proxy Angular, Postman, etc.).
    """

    prod_methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    prod_headers = [
        "Authorization",
        "Content-Type",
        "Accept",
        "Accept-Language",
        "X-Requested-With",
        "X-CSRF-Token",
        "Idempotency-Key",
    ]
    common: dict[str, object] = {
        "allow_origins": settings.cors_origins(),
        "allow_credentials": True,
        "expose_headers": ["Retry-After", "X-Request-Id"],
        "max_age": 600,
    }
    if settings.env in (Environment.PROD, Environment.STAGING):
        common["allow_methods"] = prod_methods
        common["allow_headers"] = prod_headers
    else:
        common["allow_methods"] = ["*"]
        common["allow_headers"] = ["*"]
    return common
