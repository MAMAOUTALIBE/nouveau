"""Adapter LLM Anthropic Claude — recommandé V1 pour qualité de sortie.

Uses `anthropic` SDK avec prompt caching automatique sur les messages
système (réduit le coût de ~90 % sur des prompts répétés type matching CV).

Nécessite `ANTHROPIC_API_KEY`. Données envoyées au cloud Anthropic — à
mettre en sandbox d'abord, et à valider avec le DPO de la Primature
avant déploiement avec données réelles.
"""

from __future__ import annotations

import json
from typing import Any

from app.adapters.llm.port import LlmCompletion, LlmMessage, LlmPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class AnthropicLlmAdapter(LlmPort):
    provider_name = "anthropic"

    def __init__(self, api_key: str, model_name: str = "claude-opus-4-7") -> None:
        self.api_key = api_key
        self.model_name = model_name

    async def complete(
        self,
        *,
        messages: list[LlmMessage],
        max_tokens: int = 4096,
        temperature: float = 0.2,
        response_format_json: bool = False,
    ) -> LlmCompletion:
        try:
            from anthropic import (
                AsyncAnthropic,  # pyright: ignore[reportMissingImports]
            )
        except ImportError:
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text="",
                error_code="ANTHROPIC_SDK_NOT_INSTALLED",
                error_message="`uv add anthropic` requis.",
            )

        from anthropic import AsyncAnthropic

        client = AsyncAnthropic(api_key=self.api_key)

        # Sépare les messages système des autres (l'API Anthropic les traite
        # différemment). Le system prompt est mis en cache automatiquement.
        system_parts = [m.content for m in messages if m.role == "system"]
        chat_messages = [
            {"role": m.role, "content": m.content} for m in messages if m.role != "system"
        ]
        # On force le format JSON via instruction si demandé (Anthropic n'a
        # pas de `response_format` strict — on applique l'instruction dans
        # le system prompt).
        if response_format_json:
            system_parts.append(
                "Tu dois répondre EXCLUSIVEMENT par un JSON valide, sans "
                "préfixe ni texte libre. Aucune balise Markdown."
            )

        try:
            response = await client.messages.create(
                model=self.model_name,
                max_tokens=max_tokens,
                temperature=temperature,
                system=[
                    {
                        "type": "text",
                        "text": part,
                        "cache_control": {"type": "ephemeral"},
                    }
                    for part in system_parts
                ]
                if system_parts
                else None,
                messages=chat_messages,
            )
        except Exception as exc:
            logger.error("anthropic_llm_error", error=str(exc))
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text="",
                error_code="ANTHROPIC_API_ERROR",
                error_message=str(exc),
            )

        # Extraction du texte
        text_parts: list[str] = []
        for block in response.content:
            if getattr(block, "type", None) == "text":
                text_parts.append(block.text)
        text = "".join(text_parts)

        parsed_json: dict[str, Any] | None = None
        if response_format_json:
            try:
                parsed_json = json.loads(text)
            except json.JSONDecodeError:
                parsed_json = None

        return LlmCompletion(
            provider_name=self.provider_name,
            model_name=self.model_name,
            text=text,
            parsed_json=parsed_json,
            input_tokens=getattr(response.usage, "input_tokens", None),
            output_tokens=getattr(response.usage, "output_tokens", None),
            finish_reason=response.stop_reason,
        )
