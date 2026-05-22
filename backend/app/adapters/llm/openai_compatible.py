"""Adapter LLM compatible OpenAI — couvre Groq et OpenAI.

Groq expose une API au format OpenAI (`https://api.groq.com/openai/v1`)
avec un **palier gratuit** : modèles Llama rapides, sans coût — idéal pour
le développement et la démo. OpenAI utilise le même format mais est payant.

Optimisations (Prim'Assistant) :
- Client HTTP **persistant** : le pool de connexions garde le TCP/TLS chaud,
  ce qui économise ~150-300 ms par appel par rapport à un client jetable.
- **Retry** unique sur erreur réseau ou statut transitoire (429 / 5xx) :
  absorbe les pics de quota du palier gratuit sans bascule en mode dégradé.
- Timeout court (30 s lecture, 5 s connexion) : on n'attend plus 60 s si Groq
  ne répond pas.

Les données sont envoyées au cloud du fournisseur. À valider avec le DPO
de la Primature avant tout usage avec des données réelles ; en attendant,
réservé aux données de démonstration fictives.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import httpx

from app.adapters.llm.port import LlmCompletion, LlmMessage, LlmPort
from app.core.logging import get_logger

logger = get_logger(__name__)

# Statuts HTTP transitoires : un retry court a de bonnes chances d'aboutir.
_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
# Nombre total de tentatives (1 appel + 1 retry).
_MAX_ATTEMPTS = 2
# Pause avant le retry (s).
_RETRY_BACKOFF_SECONDS = 0.8


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
        # Client lazy + persistant. L'adapter est un singleton (`@lru_cache`
        # sur la factory) : le client vit donc toute la durée du process.
        self._client: httpx.AsyncClient | None = None

    def _get_client(self) -> httpx.AsyncClient:
        """Retourne le client HTTP partagé, en le (re)créant si nécessaire."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=5.0),
                headers={"Authorization": f"Bearer {self.api_key}"},
                limits=httpx.Limits(
                    max_keepalive_connections=5,
                    max_connections=10,
                    keepalive_expiry=60.0,
                ),
            )
        return self._client

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

        client = self._get_client()
        url = f"{self.base_url}/chat/completions"
        data: dict[str, Any] | None = None
        last_error = "réponse LLM indisponible"

        for attempt in range(_MAX_ATTEMPTS):
            is_last = attempt == _MAX_ATTEMPTS - 1
            try:
                response = await client.post(url, json=payload)
                if response.status_code in _RETRYABLE_STATUS and not is_last:
                    last_error = f"HTTP {response.status_code}"
                    logger.warning(
                        "openai_compatible_retry",
                        provider=self.provider_name,
                        status=response.status_code,
                    )
                    await asyncio.sleep(_RETRY_BACKOFF_SECONDS)
                    continue
                response.raise_for_status()
                data = response.json()
                break
            except httpx.HTTPStatusError as exc:
                # Statut d'erreur non transitoire (401, 400…) ou dernier
                # essai sur un 429/5xx : un retry n'aiderait pas.
                last_error = str(exc)
                logger.error(
                    "openai_compatible_http_error",
                    provider=self.provider_name,
                    error=last_error,
                )
                break
            except httpx.HTTPError as exc:
                # Erreur réseau / timeout : transitoire → retry si possible.
                last_error = str(exc)
                if not is_last:
                    logger.warning(
                        "openai_compatible_retry",
                        provider=self.provider_name,
                        error=last_error,
                    )
                    await asyncio.sleep(_RETRY_BACKOFF_SECONDS)
                    continue
                logger.error(
                    "openai_compatible_http_error",
                    provider=self.provider_name,
                    error=last_error,
                )

        if data is None:
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text="",
                error_code="LLM_HTTP_ERROR",
                error_message=last_error,
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
