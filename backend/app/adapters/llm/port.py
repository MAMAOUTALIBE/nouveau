"""Port LLM — abstrait Anthropic / OpenAI / Ollama derrière une seule interface."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

Role = Literal["system", "user", "assistant"]


@dataclass(frozen=True, slots=True)
class LlmMessage:
    role: Role
    content: str


@dataclass(frozen=True, slots=True)
class LlmCompletion:
    """Résultat d'une complétion LLM avec audit data."""

    provider_name: str
    model_name: str
    text: str
    parsed_json: dict[str, Any] | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None
    finish_reason: str | None = None
    raw_payload: dict[str, Any] = field(default_factory=dict)
    error_code: str | None = None
    error_message: str | None = None


class LlmPort(Protocol):
    """Interface LLM. Toutes les méthodes sont async."""

    provider_name: str
    model_name: str

    async def complete(
        self,
        *,
        messages: list[LlmMessage],
        max_tokens: int = 4096,
        temperature: float = 0.2,
        response_format_json: bool = False,
    ) -> LlmCompletion: ...
