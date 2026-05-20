"""Tests unitaires : rate-limiter login."""

from __future__ import annotations

import asyncio

import pytest
from app.core.security.rate_limit import LoginRateLimiter


@pytest.mark.asyncio
async def test_first_attempts_pass() -> None:
    rl = LoginRateLimiter(max_attempts=3, window_seconds=60, lock_seconds=300)
    assert await rl.check("alice") is None
    await rl.register_failure("alice")
    assert await rl.check("alice") is None


@pytest.mark.asyncio
async def test_locks_after_max_failures() -> None:
    rl = LoginRateLimiter(max_attempts=3, window_seconds=60, lock_seconds=300)
    await rl.register_failure("alice")
    await rl.register_failure("alice")
    await rl.register_failure("alice")
    locked_for = await rl.check("alice")
    assert locked_for is not None
    assert 290 <= locked_for <= 301


@pytest.mark.asyncio
async def test_reset_clears_attempts() -> None:
    rl = LoginRateLimiter(max_attempts=2, window_seconds=60, lock_seconds=300)
    await rl.register_failure("alice")
    await rl.reset("alice")
    assert await rl.check("alice") is None
    # On peut à nouveau échouer 1 fois sans être lock
    await rl.register_failure("alice")
    assert await rl.check("alice") is None


@pytest.mark.asyncio
async def test_keys_are_independent() -> None:
    rl = LoginRateLimiter(max_attempts=2, window_seconds=60, lock_seconds=300)
    await rl.register_failure("alice")
    await rl.register_failure("alice")
    # Alice est lock
    assert await rl.check("alice") is not None
    # Bob ne l'est pas
    assert await rl.check("bob") is None


@pytest.mark.asyncio
async def test_concurrent_failures_safe() -> None:
    rl = LoginRateLimiter(max_attempts=10, window_seconds=60, lock_seconds=300)
    await asyncio.gather(*(rl.register_failure("user") for _ in range(20)))
    # Pas de race condition : la clé doit être lockée
    assert await rl.check("user") is not None
