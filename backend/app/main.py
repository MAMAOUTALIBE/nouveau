"""Point d'entrée FastAPI — bootstrap de l'application backend.

Pour lancer le serveur en dev :

    cd Final/backend
    cp .env.example .env  # adapter les valeurs
    uv run uvicorn app.main:app --reload --port 8000

Le frontend Angular `proxy.conf.json` proxie `/api/*` vers ce serveur.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1 import api_v1_router
from app.core.config import get_settings
from app.core.db import dispose_engine, init_engine
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, get_logger
from app.core.security.headers import SecurityHeadersMiddleware, build_cors_kwargs


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    logger = get_logger("app.lifespan")

    init_engine(settings)
    logger.info(
        "backend_started",
        version=__version__,
        env=settings.env.value,
        host=settings.app_host,
        port=settings.app_port,
    )

    if settings.run_migrations_on_startup:
        # En prod / CI : on applique automatiquement les migrations en attente.
        # En dev : on préfère le contrôle manuel via `alembic upgrade head`.
        from alembic import command
        from alembic.config import Config

        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", settings.database_url)
        try:
            command.upgrade(alembic_cfg, "head")
            logger.info("migrations_applied")
        except Exception as exc:
            logger.error("migrations_failed", error=str(exc))
            if settings.is_prod:
                raise

    try:
        yield
    finally:
        await dispose_engine()
        logger.info("backend_stopped")


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings)

    # Sentry doit être initialisé avant la création de l'app pour
    # capturer les exceptions du lifespan.
    from app.core.observability import setup_opentelemetry, setup_sentry

    setup_sentry(settings)

    app = FastAPI(
        title="RH Primature — Backend API",
        description=(
            "API REST de l'application de gestion des ressources humaines "
            "de la Primature de la République de Guinée."
        ),
        version=__version__,
        docs_url="/docs" if not settings.is_prod else None,
        redoc_url="/redoc" if not settings.is_prod else None,
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan,
    )

    # CORS — durci en prod/staging (méthodes et headers explicites).
    app.add_middleware(CORSMiddleware, **build_cors_kwargs(settings))
    # Security headers — CSP/HSTS/COOP/COEP/Permissions-Policy.
    app.add_middleware(SecurityHeadersMiddleware, settings=settings)

    register_exception_handlers(app)
    setup_opentelemetry(app, settings)
    app.include_router(api_v1_router)

    return app


app: FastAPI = create_app()
