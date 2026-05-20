"""Configuration pytest globale.

Charge un .env de test (`.env.test`) si présent, sinon force des variables
d'environnement minimales avant l'import de l'application. Cela évite que
`Settings()` plante au boot quand le développeur n'a pas configuré son env.
"""

from __future__ import annotations

import os
from pathlib import Path

# Chemins
ROOT = Path(__file__).resolve().parent.parent
ENV_TEST = ROOT / ".env.test"

# Charge .env.test si dispo, sinon force des valeurs sûres (DB sqlite-async only).
if ENV_TEST.is_file():
    from dotenv import load_dotenv  # type: ignore[import-not-found]

    load_dotenv(ENV_TEST)
else:
    os.environ.setdefault("ENV", "test")
    os.environ.setdefault(
        "JWT_SECRET_KEY",
        "test-secret-key-with-at-least-32-characters-please",
    )
    # Par défaut, on attend une base PG locale `rh_primature_test` ; les tests
    # qui n'exigent pas la DB ne la sollicitent pas.
    os.environ.setdefault(
        "DATABASE_URL",
        "postgresql+asyncpg://rh_user:rh_password@localhost:5432/rh_primature_test",
    )
    os.environ.setdefault("LOG_LEVEL", "WARNING")
    os.environ.setdefault("BCRYPT_ROUNDS", "4")  # accélère les tests


import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_settings_cache() -> None:
    """Forcer la relecture des settings entre tests si vars d'env modifiées."""
    from app.core.config import get_settings

    get_settings.cache_clear()
