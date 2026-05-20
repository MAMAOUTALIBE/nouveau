"""Service d'audit transactionnel — écrit dans `hr.audit_logs`.

L'audit est un service métier injectable comme dépendance FastAPI :

    async def my_endpoint(
        ...,
        audit: AuditWriter = Depends(get_audit_writer),
    ):
        ...
        await audit.record(
            action="EMPLOYEE_CREATED",
            target_type="employee",
            target_id=str(emp.employee_id),
            after={"matricule": emp.matricule, ...},
        )

Les écritures se font dans la **même session** que la mutation métier
(transactionnel) — si la mutation rollback, l'audit rollback aussi.
"""

from __future__ import annotations

from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.logging import get_logger
from app.core.security.rbac import AuthenticatedUser
from app.models.audit_log import AuditLog

logger = get_logger(__name__)


class AuditWriter:
    """Helper d'écriture audit, lié à une session SQLAlchemy + une requête HTTP."""

    def __init__(
        self,
        session: AsyncSession,
        *,
        actor: AuthenticatedUser | None = None,
        organization_id: UUID | None = None,
        source_ip: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        self._session = session
        self._actor = actor
        self._organization_id = organization_id
        self._source_ip = source_ip
        self._user_agent = user_agent

    async def record(
        self,
        action: str,
        *,
        target_type: str | None = None,
        target_id: str | UUID | None = None,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
        status: str = "SUCCESS",
        metadata: dict[str, Any] | None = None,
        organization_id: UUID | None = None,
        actor_user_id: UUID | None = None,
    ) -> AuditLog:
        """Insère une ligne d'audit. Retourne l'objet créé (avant flush)."""
        org_id = organization_id or self._organization_id
        if org_id is None and self._actor is not None:
            org_id = self._actor.organization_id
        if org_id is None:
            raise ValueError(
                "AuditWriter.record : organization_id requis (aucun acteur authentifié)."
            )

        user_id = actor_user_id
        if user_id is None and self._actor is not None:
            user_id = self._actor.user_id

        log = AuditLog(
            organization_id=org_id,
            user_id=user_id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            status=status,
            source_ip=self._source_ip,
            user_agent=self._user_agent,
            before_data=before,
            after_data=after,
            audit_metadata=metadata or {},
        )
        self._session.add(log)
        # Flush immédiat pour avoir l'ID dispo + détecter erreur DB en transaction
        await self._session.flush([log])
        logger.info(
            "audit",
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            user_id=str(user_id) if user_id else None,
            status=status,
        )
        return log


async def get_audit_writer(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> AuditWriter:
    """Dépendance FastAPI : un AuditWriter contextualisé par requête."""
    actor: AuthenticatedUser | None = getattr(request.state, "current_user", None)

    # Adresse IP : prend X-Forwarded-For si derrière un proxy, sinon client.host
    forwarded = request.headers.get("x-forwarded-for")
    source_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.client.host if request.client else None)
    )
    user_agent = request.headers.get("user-agent")

    return AuditWriter(
        session,
        actor=actor,
        source_ip=source_ip,
        user_agent=user_agent,
    )


async def get_audit_writer_unauthenticated(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
    organization_id: UUID,
) -> AuditWriter:
    """Variante pour les routes sans authentification (login, signup public).

    À appeler manuellement, pas comme `Depends`, en passant `organization_id`
    récupéré du contexte (ex: organisation par défaut).
    """
    forwarded = request.headers.get("x-forwarded-for")
    source_ip = (
        forwarded.split(",")[0].strip()
        if forwarded
        else (request.client.host if request.client else None)
    )
    user_agent = request.headers.get("user-agent")
    return AuditWriter(
        session,
        organization_id=organization_id,
        source_ip=source_ip,
        user_agent=user_agent,
    )
