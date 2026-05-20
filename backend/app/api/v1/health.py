"""Endpoint /health pour le monitoring (Railway, K8s, load balancers)."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from app import __version__
from app.core.config import get_settings
from app.core.db import healthcheck

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    version: str
    env: str
    database: str


@router.get("/health", response_model=HealthResponse)
async def get_health() -> HealthResponse:
    """Vérifie l'état du backend et de ses dépendances critiques.

    Renvoie toujours 200 ; le champ `status` indique `degraded` si une
    dépendance est KO. Ne renvoie jamais 5xx pour ne pas faire flagguer
    le service par les load balancers en cas d'incident DB temporaire.
    """
    settings = get_settings()
    db_ok = await healthcheck()
    return HealthResponse(
        status="ok" if db_ok else "degraded",
        version=__version__,
        env=settings.env.value,
        database="up" if db_ok else "down",
    )
