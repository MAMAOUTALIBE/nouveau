"""Tests — nettoyage des stubs V1.0 (Chantier 3, Cycle G2).

Couvre :

- Routes câblées vers leur service métier (plus de réponse `[]`/`{}` vide) :
    * ``GET /personnel/risques-turnover`` (alias français de turnover-risk)
    * ``GET /dashboard/operations``
    * ``GET /dashboard/pilotage``
- Routes d'écriture critiques converties en **501 Not Implemented** avec
  corps JSON explicite :
    * ``POST /recruitment/interviews/{id}/reschedule``
    * ``POST /recruitment/interviews/{id}/evaluations``
    * ``POST /recruitment/onboarding/{ref}/306090-feedback``
    * ``POST /recruitment/onboarding/{ref}/sync``

Les tests s'appuient sur ``dependency_overrides`` pour bypasser l'auth
et mocker les services métier — pas besoin de PostgreSQL pour valider
le contrat HTTP (status + body + headers). Le câblage réel vers la DB
est déjà couvert par les tests d'intégration du service ``turnover``
et ``dashboard``.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import pytest
import pytest_asyncio
from app.core.db import get_session
from app.core.errors import ForbiddenError
from app.core.security.rbac import AuthenticatedUser, get_current_user
from app.schemas.dashboard import DashboardSummary
from app.schemas.personnel import TurnoverRiskItem
from app.services import dashboard_service, turnover_service
from httpx import ASGITransport, AsyncClient

# ---------------------------------------------------------------------------
# Constantes : un seul org/user pour tous les tests (déterministe).
# ---------------------------------------------------------------------------
_ORG_ID = uuid4()
_USER_ID = uuid4()
_EMPLOYEE_ID = uuid4()


def _make_user(
    *,
    permissions: frozenset[str],
    roles: tuple[str, ...],
) -> AuthenticatedUser:
    return AuthenticatedUser(
        user_id=_USER_ID,
        organization_id=_ORG_ID,
        username="pytest-stubs",
        full_name="Pytest Stubs",
        status="ACTIVE",
        roles=roles,
        permissions=permissions,
        scopes=frozenset({"GLOBAL"}),
        direction_id=None,
        unit_id=None,
        employee_id=None,
    )


def _admin_user() -> AuthenticatedUser:
    return _make_user(
        permissions=frozenset({"*"}),
        roles=("super_admin",),
    )


def _hr_viewer_user() -> AuthenticatedUser:
    """Utilisateur avec ``dashboard:view`` mais SANS ``personnel:manage``.

    Permet de vérifier le 403 ciblé sur turnover (réservé hr_manager /
    super_admin par règle métier, cf. ``personnel.list_turnover_risk``).
    """
    return _make_user(
        permissions=frozenset({"dashboard:view", "personnel:view"}),
        roles=("rh_viewer",),
    )


def _fake_turnover_item() -> TurnoverRiskItem:
    return TurnoverRiskItem(
        employee_id=_EMPLOYEE_ID,
        matricule="M-0001",
        full_name="Agent Synthetique",
        direction_id=None,
        unit_id=None,
        risk_score=42,
        risk_level="Modere",
        factors=[],
        recommended_action=None,
        model_name="rules-v1",
        generated_at=datetime.now(tz=UTC),
    )


def _fake_dashboard_summary() -> DashboardSummary:
    return DashboardSummary(
        organization_id=_ORG_ID,
        generated_at=datetime.now(tz=UTC),
        employees_total=10,
        employees_active=9,
        employees_on_leave=1,
        positions_vacant=2,
        leave_requests_pending=3,
        leave_requests_approved_period=5,
        discipline_cases_open=0,
        training_sessions_planned=1,
        training_sessions_in_progress=0,
        documents_total=20,
        documents_pending_validation=4,
        workflows_in_progress=2,
        recent_audit_events=15,
        departures_next_12m=1,
        counts=[],
    )


# ---------------------------------------------------------------------------
# Fixture client : services mockés, auth bypass — pas de PostgreSQL.
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def client_factory(
    monkeypatch: pytest.MonkeyPatch,
) -> AsyncIterator[Any]:
    """Factory : crée un AsyncClient avec un user injecté à la demande."""

    # Mocks des services métier — purement HTTP, aucune DB.
    async def _fake_list_turnover(
        _session: Any,
        *,
        organization_id: UUID,
        direction_id: UUID | None = None,
        min_level: Any = None,
    ) -> list[TurnoverRiskItem]:
        _ = organization_id, direction_id, min_level
        return [_fake_turnover_item()]

    async def _fake_build_summary(
        _session: Any,
        *,
        organization_id: UUID,
        user: AuthenticatedUser,
    ) -> DashboardSummary:
        _ = organization_id, user
        return _fake_dashboard_summary()

    async def _fake_report_employees(
        _session: Any,
        *,
        organization_id: UUID,
    ) -> list[dict[str, str | int]]:
        _ = organization_id
        return [{"direction_id": str(uuid4()), "active_count": 5}]

    async def _fake_report_leave(
        _session: Any,
        *,
        organization_id: UUID,
        period_start: Any = None,
        period_end: Any = None,
    ) -> list[dict[str, str | int]]:
        _ = organization_id, period_start, period_end
        return [{"request_status": "APPROVED", "count": 5}]

    monkeypatch.setattr(turnover_service, "list_for_organization", _fake_list_turnover)
    monkeypatch.setattr(dashboard_service, "build_summary", _fake_build_summary)
    monkeypatch.setattr(
        dashboard_service,
        "report_employees_by_direction",
        _fake_report_employees,
    )
    monkeypatch.setattr(dashboard_service, "report_leave_by_status", _fake_report_leave)

    from app.main import create_app

    app = create_app()

    async def _override_session() -> AsyncIterator[None]:
        yield None

    app.dependency_overrides[get_session] = _override_session

    transport = ASGITransport(app=app)

    async def _build(user: AuthenticatedUser | None) -> AsyncClient:
        """Construit un client. ``user=None`` => pas d'auth (test 401)."""
        if user is not None:

            async def _override_user() -> AuthenticatedUser:
                return user

            app.dependency_overrides[get_current_user] = _override_user
        else:
            app.dependency_overrides.pop(get_current_user, None)
        return AsyncClient(transport=transport, base_url="http://test")

    yield _build

    app.dependency_overrides.clear()


# ===========================================================================
# 1-3. /personnel/risques-turnover — câblé via alias
# ===========================================================================
@pytest.mark.asyncio
async def test_risques_turnover_returns_items_for_admin(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.get("/api/v1/personnel/risques-turnover")

    assert response.status_code == 200, response.text
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    item = body[0]
    assert item["matricule"] == "M-0001"
    assert item["risk_level"] == "Modere"
    # Sanity : pas de header de stub résiduel.
    assert "x-implementation-status" not in {k.lower() for k in response.headers}


@pytest.mark.asyncio
async def test_risques_turnover_requires_auth(client_factory: Any) -> None:
    async with await client_factory(None) as http:
        response = await http.get("/api/v1/personnel/risques-turnover")

    assert response.status_code == 401, response.text


@pytest.mark.asyncio
async def test_risques_turnover_forbidden_for_non_hr_role(client_factory: Any) -> None:
    """Un rôle sans ``personnel:manage`` doit recevoir 403 (règle métier DRH)."""
    async with await client_factory(_hr_viewer_user()) as http:
        response = await http.get("/api/v1/personnel/risques-turnover")

    # ``require_permissions(any_of=["personnel:manage", "*"])`` => ForbiddenError
    # qui est sérialisé en 403 par le handler global.
    assert response.status_code == 403, response.text


# ===========================================================================
# 4-5. /dashboard/operations + /dashboard/pilotage — câblés
# ===========================================================================
@pytest.mark.asyncio
async def test_dashboard_operations_returns_composed_view(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.get("/api/v1/dashboard/operations")

    assert response.status_code == 200, response.text
    body = response.json()
    # Schéma DashboardOperationsResponse.
    assert UUID(body["organization_id"]) == _ORG_ID
    assert body["leave_requests_pending"] == 3
    assert body["documents_pending_validation"] == 4
    assert body["workflows_in_progress"] == 2
    assert body["discipline_cases_open"] == 0
    assert isinstance(body["employees_by_direction"], list)
    assert isinstance(body["leave_by_status"], list)
    assert body["leave_by_status"][0]["request_status"] == "APPROVED"
    # Plus de header stub.
    assert "x-implementation-status" not in {k.lower() for k in response.headers}


@pytest.mark.asyncio
async def test_dashboard_pilotage_returns_summary_view(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.get("/api/v1/dashboard/pilotage")

    assert response.status_code == 200, response.text
    body = response.json()
    assert UUID(body["organization_id"]) == _ORG_ID
    assert "summary" in body
    assert body["summary"]["employees_total"] == 10
    assert body["summary"]["employees_active"] == 9
    assert isinstance(body["counts"], list)
    assert "x-implementation-status" not in {k.lower() for k in response.headers}


# ===========================================================================
# 6-9. Recruitment — 501 Not Implemented
# ===========================================================================
_INTERVIEW_ID = uuid4()
_REFERENCE = "ONB-2026-0001"


def _assert_501_with_feature(response: Any, expected_feature: str) -> None:
    """Assert utilitaire : forme du 501 standardisée.

    Le handler global ``_http_handler`` (cf. ``app.core.errors``) sérialise
    le ``detail`` d'une ``HTTPException`` via ``str(exc.detail)`` — donc
    notre dict est aplati en chaîne. On vérifie la présence des marqueurs
    clés (``feature`` + ``etat``) qui DOIVENT figurer pour que le frontend
    puisse afficher un message explicite.
    """
    assert response.status_code == 501, response.text
    body = response.json()
    assert "error" in body, body
    message = body["error"].get("message", "")
    assert expected_feature in message, body
    assert "v1.5-planned" in message, body
    assert "non encore implémenté" in message.lower(), body


@pytest.mark.asyncio
async def test_recruitment_reschedule_returns_501(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.post(f"/api/v1/recruitment/interviews/{_INTERVIEW_ID}/reschedule")
    _assert_501_with_feature(response, "recruitment.interview.reschedule")


@pytest.mark.asyncio
async def test_recruitment_evaluations_returns_501(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.post(f"/api/v1/recruitment/interviews/{_INTERVIEW_ID}/evaluations")
    _assert_501_with_feature(response, "recruitment.interview.evaluation")


@pytest.mark.asyncio
async def test_onboarding_306090_feedback_returns_501(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.post(f"/api/v1/recruitment/onboarding/{_REFERENCE}/306090-feedback")
    _assert_501_with_feature(response, "recruitment.onboarding.306090_feedback")


@pytest.mark.asyncio
async def test_onboarding_sync_returns_501(client_factory: Any) -> None:
    async with await client_factory(_admin_user()) as http:
        response = await http.post(f"/api/v1/recruitment/onboarding/{_REFERENCE}/sync")
    _assert_501_with_feature(response, "recruitment.onboarding.sync")


# ===========================================================================
# 10. Garde-fou : plus de doublon de route stub vide pour les 3 endpoints
#     câblés (sinon le frontend tomberait sur la version stub).
# ===========================================================================
@pytest.mark.asyncio
async def test_no_legacy_stub_route_shadows_wired_endpoints(client_factory: Any) -> None:
    """Vérifie que les anciennes routes stub ont bien été retirées.

    Si un stub ``GET /personnel/risques-turnover`` répondait encore avant
    le router personnel, la réponse serait ``[]`` (et un header
    ``X-Implementation-Status``). Ce test garantit que la route réelle
    est bien atteinte.
    """
    async with await client_factory(_admin_user()) as http:
        for path in (
            "/api/v1/personnel/risques-turnover",
            "/api/v1/dashboard/operations",
            "/api/v1/dashboard/pilotage",
        ):
            response = await http.get(path)
            assert response.status_code == 200, (path, response.text)
            # Header de stub interdit : si présent, c'est qu'un stub
            # répond à la place de la route câblée.
            assert "x-implementation-status" not in {k.lower() for k in response.headers}, (
                f"stub header detected on wired route: {path}"
            )


# Compat pour mypy strict — éviter unused-imports lourds.
_ = ForbiddenError
