"""Rate-limiter login en mémoire — fenêtre + verrouillage exponentiel.

Implémentation V0 mémoire-process. À remplacer par Redis (vague 8) pour
supporter le multi-instance. La clé de comptage est l'username (et non
l'IP) afin d'éviter les faux positifs derrière un NAT d'entreprise.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass, field

from app.core.config import get_settings


@dataclass
class _AttemptState:
    """État d'un username : tentatives échouées + verrouillage éventuel."""

    failures: list[float] = field(default_factory=list)
    locked_until: float | None = None


class LoginRateLimiter:
    """Limite les tentatives de login par username.

    Règle V0 :
    - Compteur : N tentatives échouées dans une fenêtre glissante de W secondes
    - Si dépassement : verrouillage L secondes
    - Login réussi : reset du compteur
    """

    def __init__(
        self,
        *,
        max_attempts: int | None = None,
        window_seconds: int | None = None,
        lock_seconds: int | None = None,
    ) -> None:
        s = get_settings()
        self.max_attempts = max_attempts or s.rate_limit_login_max
        self.window_seconds = window_seconds or s.rate_limit_login_window_seconds
        self.lock_seconds = lock_seconds or s.rate_limit_login_lock_seconds
        self._state: dict[str, _AttemptState] = {}
        self._lock = asyncio.Lock()

    async def check(self, key: str) -> int | None:
        """Vérifie si la clé est verrouillée.

        Retourne :
        - None si la clé peut tenter un login
        - le nombre de secondes restantes avant déverrouillage sinon
        """
        async with self._lock:
            state = self._state.get(key)
            if state is None or state.locked_until is None:
                return None
            now = time.monotonic()
            if state.locked_until <= now:
                # Verrouillage expiré : on nettoie
                self._state.pop(key, None)
                return None
            return int(state.locked_until - now) + 1

    async def register_failure(self, key: str) -> int | None:
        """Enregistre un échec. Retourne `lock_seconds` si la clé bascule en lock."""
        async with self._lock:
            now = time.monotonic()
            state = self._state.setdefault(key, _AttemptState())

            # Purge de la fenêtre glissante
            cutoff = now - self.window_seconds
            state.failures = [t for t in state.failures if t >= cutoff]
            state.failures.append(now)

            if len(state.failures) >= self.max_attempts:
                state.locked_until = now + self.lock_seconds
                state.failures.clear()
                return self.lock_seconds
            return None

    async def reset(self, key: str) -> None:
        """Réinitialise les compteurs (à appeler après login réussi)."""
        async with self._lock:
            self._state.pop(key, None)


# Singleton applicatif
_default_limiter: LoginRateLimiter | None = None
_refresh_limiter: LoginRateLimiter | None = None


def get_login_limiter() -> LoginRateLimiter:
    global _default_limiter
    if _default_limiter is None:
        _default_limiter = LoginRateLimiter()
    return _default_limiter


def get_refresh_limiter() -> LoginRateLimiter:
    """Limiteur dédié à /refresh (compteur séparé du login).

    Réutilise la classe :class:`LoginRateLimiter` (même mécanique fenêtre
    glissante + lock) avec une configuration dédiée (seuils plus serrés).
    L'isolation du state interne (``self._state``) évite que les échecs
    /refresh fassent basculer le compteur /login en lock — et inversement.
    """
    global _refresh_limiter
    if _refresh_limiter is None:
        s = get_settings()
        _refresh_limiter = LoginRateLimiter(
            max_attempts=s.rate_limit_refresh_max,
            window_seconds=s.rate_limit_refresh_window_seconds,
            lock_seconds=s.rate_limit_refresh_lock_seconds,
        )
    return _refresh_limiter


def reset_limiters_for_tests() -> None:
    """Reset des singletons (à utiliser uniquement dans les tests)."""
    global _default_limiter, _refresh_limiter
    _default_limiter = None
    _refresh_limiter = None
