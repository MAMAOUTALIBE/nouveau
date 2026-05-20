"""Tests unitaires des en-têtes HTTP de sécurité (CSP, HSTS, COOP, etc.).

Couvre :
* construction CSP différenciée dev/prod ;
* présence HSTS uniquement en prod ;
* CORS méthodes/headers explicites en prod, ouverts en dev ;
* Permissions-Policy désactive les API intrusives.
"""

from __future__ import annotations

import importlib
from collections.abc import Iterator
from typing import Any

import pytest

from app.core.config import Environment, Settings


def _make_settings(env: Environment) -> Settings:
    """Construit une instance Settings pour un environnement donné.

    On bypasse `.env` pour rester déterministe en CI.
    """
    return Settings(  # type: ignore[call-arg]
        env=env,
        jwt_secret_key="x" * 64,  # >= 32 chars (validator prod)
        database_url="postgresql+asyncpg://u:p@localhost:5432/db",
        allowed_origins="https://prim.gov.gn,https://app.prim.gov.gn",
    )


@pytest.fixture
def headers_module() -> Any:
    """Recharge le module pour s'assurer que les caches éventuels sont neufs."""
    module = importlib.import_module("app.core.security.headers")
    importlib.reload(module)
    return module


# ---------------------------------------------------------------------------
# CSP
# ---------------------------------------------------------------------------


def test_csp_dev_allows_inline_for_swagger(headers_module: Any) -> None:
    settings = _make_settings(Environment.DEV)
    csp = headers_module._csp_for_env(settings)
    assert "default-src 'self'" in csp
    assert "'unsafe-inline'" in csp  # autorisé en dev pour Swagger
    assert "frame-ancestors 'none'" in csp
    assert "object-src 'none'" in csp


def test_csp_prod_strict_no_inline_scripts(headers_module: Any) -> None:
    settings = _make_settings(Environment.PROD)
    csp = headers_module._csp_for_env(settings)
    assert "script-src 'self'" in csp
    assert "https://cdn.jsdelivr.net" not in csp  # pas de CDN externe en prod
    assert "upgrade-insecure-requests" in csp
    assert "frame-ancestors 'none'" in csp


# ---------------------------------------------------------------------------
# Permissions-Policy
# ---------------------------------------------------------------------------


def test_permissions_policy_disables_camera_microphone(headers_module: Any) -> None:
    policy = headers_module._permissions_policy()
    assert "camera=()" in policy
    assert "microphone=()" in policy
    assert "geolocation=()" in policy
    assert "usb=()" in policy


# ---------------------------------------------------------------------------
# CORS kwargs
# ---------------------------------------------------------------------------


def test_cors_dev_is_permissive(headers_module: Any) -> None:
    settings = _make_settings(Environment.DEV)
    kwargs = headers_module.build_cors_kwargs(settings)
    assert kwargs["allow_methods"] == ["*"]
    assert kwargs["allow_headers"] == ["*"]
    assert kwargs["allow_credentials"] is True
    assert kwargs["allow_origins"] == ["https://prim.gov.gn", "https://app.prim.gov.gn"]


def test_cors_prod_is_strict(headers_module: Any) -> None:
    settings = _make_settings(Environment.PROD)
    kwargs = headers_module.build_cors_kwargs(settings)
    assert kwargs["allow_methods"] != ["*"]
    assert "GET" in kwargs["allow_methods"]
    assert "TRACE" not in kwargs["allow_methods"]
    assert kwargs["allow_headers"] != ["*"]
    assert "Authorization" in kwargs["allow_headers"]
    assert kwargs["max_age"] == 600


def test_cors_staging_is_strict_too(headers_module: Any) -> None:
    settings = _make_settings(Environment.STAGING)
    kwargs = headers_module.build_cors_kwargs(settings)
    assert kwargs["allow_methods"] != ["*"]


# ---------------------------------------------------------------------------
# Middleware injection (intégration légère)
# ---------------------------------------------------------------------------


def test_middleware_adds_hsts_only_in_prod(headers_module: Any) -> None:
    prod_settings = _make_settings(Environment.PROD)
    dev_settings = _make_settings(Environment.DEV)

    prod_mw = headers_module.SecurityHeadersMiddleware(app=lambda *a, **kw: None, settings=prod_settings)
    dev_mw = headers_module.SecurityHeadersMiddleware(app=lambda *a, **kw: None, settings=dev_settings)

    assert "Strict-Transport-Security" in prod_mw._common_headers
    assert "max-age=31536000" in prod_mw._common_headers["Strict-Transport-Security"]
    assert "preload" in prod_mw._common_headers["Strict-Transport-Security"]
    assert "Cross-Origin-Embedder-Policy" in prod_mw._common_headers
    # Pas de HSTS en dev → l'app peut tourner en HTTP local sans piège.
    assert "Strict-Transport-Security" not in dev_mw._common_headers


def test_middleware_always_sets_baseline_headers(headers_module: Any) -> None:
    settings = _make_settings(Environment.DEV)
    mw = headers_module.SecurityHeadersMiddleware(app=lambda *a, **kw: None, settings=settings)
    headers = mw._common_headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "Cross-Origin-Opener-Policy" in headers
    assert "Cross-Origin-Resource-Policy" in headers
    assert "Content-Security-Policy" in headers
    assert "Permissions-Policy" in headers
