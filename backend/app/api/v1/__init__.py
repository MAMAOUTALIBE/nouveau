"""Routers API v1 — agrégation par domaine."""

from fastapi import APIRouter

from app.api.v1 import (
    _stubs,
    admin,
    ai_assistant,
    auth,
    bpmn,
    career,
    dashboard,
    discipline,
    document,
    health,
    leave,
    leave_advanced,
    notification,
    organization,
    performance,
    personnel,
    recruitment,
    totp,
    training,
    workflow,
)
from app.schemas.dashboard import PendingDecisionItem

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(health.router)
# Stubs V1.5 enregistrés AVANT les routers paramétrés pour que les chemins
# littéraux (ex: /personnel/agents/duplicate-index) gagnent contre les
# patterns du type /personnel/agents/{employee_id}.
api_v1_router.include_router(_stubs.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(totp.router)
api_v1_router.include_router(admin.router)
api_v1_router.include_router(career.careers_router)
api_v1_router.include_router(bpmn.router)
api_v1_router.include_router(career.gpec_router)
api_v1_router.include_router(dashboard.dashboard_router)
api_v1_router.include_router(dashboard.modernization_router)
api_v1_router.include_router(dashboard.reports_router)
api_v1_router.include_router(discipline.router)
api_v1_router.include_router(document.router)
api_v1_router.include_router(leave.router)
api_v1_router.include_router(leave_advanced.router)
api_v1_router.include_router(notification.router)
api_v1_router.include_router(organization.router)
api_v1_router.include_router(performance.router)
api_v1_router.include_router(performance.public_router)
api_v1_router.include_router(personnel.router)
api_v1_router.include_router(recruitment.router)
api_v1_router.include_router(ai_assistant.recruitment_ia_router)
api_v1_router.include_router(ai_assistant.assistant_router)
api_v1_router.include_router(training.router)
api_v1_router.include_router(training.public_router)
api_v1_router.include_router(workflow.router)

# Aliases historiques (compat frontend Angular issu du mock-backend).
# On enregistre la même fonction sous un second chemin sans dupliquer la
# logique métier.
api_v1_router.add_api_route(
    "/dashboard/pending-requests",
    dashboard.list_pending_decisions,
    methods=["GET"],
    response_model=list[PendingDecisionItem],
    include_in_schema=False,
    name="alias_pending_decisions",
)
api_v1_router.add_api_route(
    "/notifications/process",
    notification.dispatch_pending,
    methods=["POST"],
    include_in_schema=False,
    name="alias_notifications_process",
)

__all__ = ["api_v1_router"]
