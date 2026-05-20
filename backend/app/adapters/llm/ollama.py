"""Adapter LLM Ollama — option souveraine on-prem (LLM open-source local).

Ollama exécute des modèles open-source (Llama 3.x, Mistral, etc.) sur
GPU local. Aucune donnée n'est envoyée à un cloud étranger.

Recommandation pour la Primature : si un GPU est disponible, déployer
Ollama avec `llama3.1:70b-instruct` ou `mistral-large` pour le matching
CV et Prim'Assistant. Les performances sont inférieures à Claude Opus
mais acceptables pour les tâches structurées.

Nécessite Ollama running sur `OLLAMA_BASE_URL` (défaut localhost:11434).
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from app.adapters.llm.port import LlmCompletion, LlmMessage, LlmPort
from app.core.logging import get_logger

logger = get_logger(__name__)


class OllamaLlmAdapter(LlmPort):
    provider_name = "ollama"

    def __init__(
        self,
        *,
        base_url: str,
        model_name: str = "llama3.1:70b-instruct",
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    async def complete(
        self,
        *,
        messages: list[LlmMessage],
        max_tokens: int = 4096,
        temperature: float = 0.2,
        response_format_json: bool = False,
    ) -> LlmCompletion:
        ollama_messages = [{"role": m.role, "content": m.content} for m in messages]
        payload: dict[str, Any] = {
            "model": self.model_name,
            "messages": ollama_messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            },
        }
        if response_format_json:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
                response = await client.post(f"{self.base_url}/api/chat", json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPError as exc:
            logger.error("ollama_http_error", error=str(exc))
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text="",
                error_code="OLLAMA_HTTP_ERROR",
                error_message=str(exc),
            )

        text = data.get("message", {}).get("content", "")
        parsed_json: dict[str, Any] | None = None
        if response_format_json and text:
            try:
                parsed_json = json.loads(text)
            except json.JSONDecodeError:
                parsed_json = None

        return LlmCompletion(
            provider_name=self.provider_name,
            model_name=self.model_name,
            text=text,
            parsed_json=parsed_json,
            input_tokens=data.get("prompt_eval_count"),
            output_tokens=data.get("eval_count"),
            finish_reason=data.get("done_reason"),
            raw_payload={"adapter": "ollama"},
        )
