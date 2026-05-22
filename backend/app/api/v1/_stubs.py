"""Endpoints en attente d'implémentation (V1.5).

Ces routes correspondent à des écrans Angular hérités du mock-backend
historique. Pour éviter que le frontend explose (404 → toasts, écrans
cassés), on renvoie une réponse bien formée et vide :
- collections → `[]` ou `{ "items": [], "total": 0 }`
- détails → `{}`
- actions (POST) → `{ "status": "stub", "implemented": false }`

Chaque réponse porte l'en-tête `X-Implementation-Status: stub-v1.5`
pour qu'un humain ou un test E2E puisse détecter la zone non câblée.

À mesure que les fonctionnalités V1.5 sont livrées, supprime la route
correspondante de ce fichier — un test garde-fou pourrait également
être ajouté plus tard.
"""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends, Response

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


# ============================================================================
# Dashboard étendu (operations / pilotage)
# ============================================================================
@router.get("/dashboard/operations")
async def stub_dashboard_operations(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    return _empty_object(response)


@router.get("/dashboard/pilotage")
async def stub_dashboard_pilotage(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    return _empty_object(response)


# ============================================================================
# Personnel — anti-doublons / matricule / dossiers / uploads
# ============================================================================
@router.get("/personnel/risques-turnover")
async def stub_personnel_risques_turnover_alias(
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> list[Any]:
    # Alias historique vers /personnel/turnover-risk
    return _empty_list(response)


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
    "/recruitment/shortlists/validations",
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
    "/recruitment/shortlists/suggest",
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


# Routes paramétrées (impossibles à générer en boucle simple)
@router.post("/recruitment/shortlists/{reference}/validate")
async def stub_shortlist_validate(
    reference: str,
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False, "reference": reference}


@router.post("/recruitment/interviews/{interview_id}/reschedule")
async def stub_interview_reschedule(
    interview_id: str,
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False, "interview_id": interview_id}


@router.post("/recruitment/interviews/{interview_id}/evaluations")
async def stub_interview_eval(
    interview_id: str,
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False, "interview_id": interview_id}


@router.post("/recruitment/onboarding/{reference}/306090-feedback")
async def stub_onboarding_feedback(
    reference: str,
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False, "reference": reference}


@router.post("/recruitment/onboarding/{reference}/sync")
async def stub_onboarding_sync(
    reference: str,
    response: Response,
    _: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    response.headers.update(_STUB_HEADER)
    return {"status": "stub", "implemented": False, "reference": reference}


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
