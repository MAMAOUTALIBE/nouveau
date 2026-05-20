"""Tests unitaires de l'anonymat 360° (logique d'agrégation).

Vérifie le comportement de `_aggregate_answers` sur des inputs typiques.
La règle de seuil est testée à un niveau plus haut côté service (intégration).
"""

from __future__ import annotations

from app.services.performance_service import _aggregate_answers


def test_aggregate_empty_returns_none() -> None:
    assert _aggregate_answers([]) is None


def test_aggregate_no_numeric_keys_returns_none() -> None:
    assert _aggregate_answers([{"comment": "Bien"}]) is None


def test_aggregate_simple_average() -> None:
    result = _aggregate_answers(
        [
            {"leadership": 4, "communication": 3},
            {"leadership": 5, "communication": 4},
            {"leadership": 3, "communication": 5},
        ]
    )
    assert result == {"leadership": 4.0, "communication": 4.0}


def test_aggregate_ignores_booleans() -> None:
    """Les booléens ne doivent pas être agrégés comme des numériques."""
    result = _aggregate_answers(
        [
            {"agile": True, "score": 5},
            {"agile": False, "score": 3},
        ]
    )
    assert result is not None
    assert "score" in result
    assert "agile" not in result


def test_aggregate_handles_missing_keys() -> None:
    """Si une clé n'apparaît que dans certaines réponses, elle est moyennée
    sur le sous-ensemble qui l'a remplie."""
    result = _aggregate_answers(
        [
            {"a": 10},
            {"a": 20, "b": 4},
            {"b": 6},
        ]
    )
    assert result == {"a": 15.0, "b": 5.0}


def test_aggregate_round_to_2_decimals() -> None:
    result = _aggregate_answers([{"k": 1}, {"k": 2}, {"k": 2}])
    assert result == {"k": 1.67}
