"""Adapter LLM compatible OpenAI — couvre Groq et OpenAI.

Groq expose une API au format OpenAI (`https://api.groq.com/openai/v1`)
avec un **palier gratuit** : modèles Llama rapides, sans coût — idéal pour
le développement et la démo. OpenAI utilise le même format mais est payant.

Les données sont envoyées au cloud du fournisseur. À valider avec le DPO
de la Primature avant tout usage avec des données réelles ; en attendant,
réservé aux données de démonstration fictives.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.adapters.llm.port import LlmCompletion, LlmMessage, LlmPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class OpenAICompatibleLlmAdapter(LlmPort):
    """Adapter pour toute API au format OpenAI Chat Completions (Groq, OpenAI…)."""

    def __init__(
        self,
        *,
        api_key: str,
        base_url: str,
        model_name: str,
        provider_name: str = "openai",
    ) -> None:
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name
        self.provider_name = provider_name

    async def complete(
        self,
        *,
        messages: list[LlmMessage],
        max_tokens: int = 4096,
        temperature: float = 0.2,
        response_format_json: bool = False,
    ) -> LlmCompletion:
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if response_format_json:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                )
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.error(
                "openai_compatible_http_error", provider=self.provider_name, error=str(exc)
            )
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text="",
                error_code="LLM_HTTP_ERROR",
                error_message=str(exc),
            )

        choices = data.get("choices") or [{}]
        text = (choices[0].get("message", {}) or {}).get("content", "") or ""

        parsed_json: dict[str, Any] | None = None
        if response_format_json and text:
            try:
                parsed_json = json.loads(text)
            except json.JSONDecodeError:
                parsed_json = None

        usage = data.get("usage", {}) or {}
        return LlmCompletion(
            provider_name=self.provider_name,
            model_name=self.model_name,
            text=text,
            parsed_json=parsed_json,
            input_tokens=usage.get("prompt_tokens"),
            output_tokens=usage.get("completion_tokens"),
            finish_reason=choices[0].get("finish_reason"),
            raw_payload={"adapter": "openai_compatible", "provider": self.provider_name},
        )
