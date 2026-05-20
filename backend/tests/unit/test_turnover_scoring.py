"""Tests unitaires : modèle de scoring turnover (rules-v1).

Vérifie le classement et les actions recommandées sur des scores de
référence. Le calcul réel sur la DB est testé en intégration (PY-014).
"""

from __future__ import annotations

import pytest
from app.schemas.personnel import TurnoverRiskFactor
from app.services.turnover_service import _classify_level, _recommended_action


@pytest.mark.parametrize(
    ("score", "expected_level"),
    [
        (0, "Faible"),
        (24, "Faible"),
        (25, "Modere"),
        (49, "Modere"),
        (50, "Eleve"),
        (74, "Eleve"),
        (75, "Critique"),
        (100, "Critique"),
    ],
)
def test_classify_level_thresholds(score: int, expected_level: str) -> None:
    assert _classify_level(score) == expected_level


def test_recommended_action_critique_warns_hierarchy() -> None:
    factors = [
        TurnoverRiskFactor(code="X", label="Test", weight=10),
    ]
    msg = _recommended_action("Critique", factors)
    assert msg is not None
    assert "Entretien individuel" in msg
    assert "responsable hi" in msg.lower()


def test_recommended_action_eleve_suggests_meeting() -> None:
    msg = _recommended_action("Eleve", [])
    assert msg is not None
    assert "Point RH" in msg


def test_recommended_action_faible_returns_none() -> None:
    assert _recommended_action("Faible", []) is None


def test_recommended_action_modere_only_with_factors() -> None:
    """Sans facteur contributif, niveau Modéré n'a pas d'action recommandée."""
    assert _recommended_action("Modere", []) is None


def test_recommended_action_modere_with_factors() -> None:
    factors = [
        TurnoverRiskFactor(code="X", label="Test", weight=10),
    ]
    msg = _recommended_action("Modere", factors)
    assert msg is not None
    assert "Surveiller" in msg
