"""Endpoints en attente d'implémentation (V1.5).

Ces routes correspondent à des écrans Angular hérités du mock-backend
historique. Deux stratégies sont employées :

1. **Surface "liste/objet/action" non implémentée** : on renvoie une
   réponse bien formée et vide (``[]`` / ``{}`` / ``{"status": "stub"}``)
   avec l'en-tête ``X-Implementation-Status: stub-v1.5`` pour qu'un test
   E2E ou un humain détecte la zone non câblée. Cela évite aussi que le
   frontend explose en 404 (toasts intempestifs, écrans cassés).

2. **Endpoints d'écriture critiques (V1.0)** : pour les actions qui
   *modifient* l'état métier (replanifier un entretien, soumettre une
   évaluation, synchroniser un onboarding), un ``200 OK`` vide est
   dangereux — le frontend pourrait croire à un succès. On renvoie donc
   un **501 Not Implemented** explicite avec un corps JSON décrivant la
   feature et son état (``v1.5-planned``).

À mesure que les fonctionnalités V1.5 sont livrées, supprime la route
correspondante de ce fichier — un test garde-fou pourrait également
être ajouté plus tard.

Routes câblées vers leurs services métier (donc retirées de ce fichier
au cours du nettoyage Chantier 3 V1.0) :

- ``GET /personnel/risques-turnover`` → ``personnel.list_turnover_risk``
- ``GET /dashboard/operations`` → ``dashboard.get_dashboard_operations``
- ``GET /dashboard/pilotage`` → ``dashboard.get_dashboard_pilotage``
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.core.security.rbac import AuthenticatedUser, get_current_user

router = APIRouter(tags=["stubs"], include_in_schema=False)

_STUB_HEADER = {"X-Implementation-Status": "stub-v1.5"}


def _empty_list(response: Response) -> list[Any]:
    response.headers.update(_STUB_HEADER)
    return []


def _empty_object(response: Response) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {}


def _stub_action(response: Response) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False}


def _not_implemented(feature: str) -> HTTPException:
    """Construit un 501 standardisé pour un endpoint d'écriture V1.5."""
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail={
            "message": "Endpoint non encore implémenté en V1.0",
            "feature": feature,
            "etat": "v1.5-planned",
        },
    )


# ============================================================================
# Recruitment — surface étendue (anti-doublons, scoring, shortlist,
# entretiens, onboarding 30/60/90, règles, BI/observability)
# ============================================================================
_RECRUITMENT_LIST_STUBS = [
    "/recruitment/applications/duplicates",
    "/recruitment/applications/duplicates/links",
    "/recruitment/audit-logs",
    "/recruitment/bi-export",
    "/recruitment/bi-export/logs",
    "/recruitment/campaigns/budgets",
    "/recruitment/campaigns/workload-forecast",
    "/recruitment/interview-question-bank",
    "/recruitment/interviews",
    "/recruitment/notifications",
    "/recruitment/observability/events",
    "/recruitment/onboarding/306090",
    "/recruitment/onboarding/success-scores",
    "/recruitment/onboarding/sync-logs",
    "/recruitment/rules",
    "/recruitment/rules/executions",
]

_RECRUITMENT_OBJECT_STUBS = [
    "/recruitment/control-tower",
    "/recruitment/executive-dashboard",
    "/recruitment/observability",
]

_RECRUITMENT_ACTION_STUBS = [
    "/recruitment/applications/duplicates/link",
    "/recruitment/applications/duplicates/links",
    "/recruitment/executive-dashboard/export",
    "/recruitment/interview-question-bank/import",
    "/recruitment/interview-question-bank/export",
    "/recruitment/rules/simulate",
    "/recruitment/uploads",
]


async def _stub_list_handler(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> list[Any]:
    return _empty_list(response)


async def _stub_object_handler(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    return _empty_object(response)


async def _stub_action_handler(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    return _stub_action(response)


def _register_simple_stub(path: str, method: str, kind: str) -> None:
    handlers = {
        "list": _stub_list_handler,
        "object": _stub_object_handler,
        "action": _stub_action_handler,
    }
    router.add_api_route(
        path,
        handlers[kind],
        methods=[method],
        include_in_schema=False,
        name=f"stub_{method.lower()}_{path.replace('/', '_').strip('_')}",
    )


for _path in _RECRUITMENT_LIST_STUBS:
    _register_simple_stub(_path, "GET", "list")
for _path in _RECRUITMENT_OBJECT_STUBS:
    _register_simple_stub(_path, "GET", "object")
for _path in _RECRUITMENT_ACTION_STUBS:
    _register_simple_stub(_path, "POST", "action")


# ============================================================================
# Recruitment — endpoints d'écriture paramétrés : 501 Not Implemented
# ----------------------------------------------------------------------------
# Un 200 OK vide sur une action de modification serait fragile (le
# frontend pourrait l'interpréter comme un succès). On retourne un 501
# franc avec un corps JSON exploitable côté UI.
# ============================================================================
@router.post("/recruitment/interviews/{interview_id}/reschedule")
async def stub_interview_reschedule(
    interview_id: str,
    _user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> None:
    """Replanification d'entretien — non implémenté en V1.0 (planning V1.5)."""
    del interview_id  # capturé pour cohérence d'URL, non utilisé en V1.0
    raise _not_implemented("recruitment.interview.reschedule")


@router.post("/recruitment/interviews/{interview_id}/evaluations")
async def stub_interview_eval(
    interview_id: str,
    _user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> None:
    """Saisie d'évaluation d'entretien — non implémenté en V1.0 (V1.5)."""
    del interview_id
    raise _not_implemented("recruitment.interview.evaluation")


@router.post("/recruitment/onboarding/{reference}/306090-feedback")
async def stub_onboarding_feedback(
    reference: str,
    _user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> None:
    """Feedback 30/60/90 jours sur un onboarding — non implémenté en V1.0."""
    del reference
    raise _not_implemented("recruitment.onboarding.306090_feedback")


@router.post("/recruitment/onboarding/{reference}/sync")
async def stub_onboarding_sync(
    reference: str,
    _user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> None:
    """Synchronisation onboarding ↔ SIRH externe — non implémenté en V1.0."""
    del reference
    raise _not_implemented("recruitment.onboarding.sync")


# ============================================================================
# Workflows — automation (orchestrateur SLA + canaux + politique)
# ============================================================================
_WORKFLOW_OBJECT_STUBS = [
    "/workflows/automation/status",
    "/workflows/automation/policy",
]
_WORKFLOW_LIST_STUBS = [
    "/workflows/automation/channels",
    "/workflows/automation/events",
]
_WORKFLOW_ACTION_STUBS_GET_OR_POST = [
    ("/workflows/automation/run-cycle", "POST"),
    ("/workflows/automation/simulate", "POST"),
    ("/workflows/automation/events/clear", "POST"),
    ("/workflows/automation/policy", "PUT"),
]

for _path in _WORKFLOW_OBJECT_STUBS:
    _register_simple_stub(_path, "GET", "object")
for _path in _WORKFLOW_LIST_STUBS:
    _register_simple_stub(_path, "GET", "list")
for _path, _method in _WORKFLOW_ACTION_STUBS_GET_OR_POST:
    _register_simple_stub(_path, _method, "action")
