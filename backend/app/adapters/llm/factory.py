"""Factory de sélection de l'adapter LLM."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.llm.anthropic import AnthropicLlmAdapter
from app.adapters.llm.mock import MockLlmAdapter
from app.adapters.llm.ollama import OllamaLlmAdapter
from app.adapters.llm.openai_compatible import OpenAICompatibleLlmAdapter
from app.adapters.llm.port import LlmPort
from app.core.config import get_settings

# Endpoint Groq compatible OpenAI.
_GROQ_BASE_URL = "https://api.groq.com/openai/v1"


@lru_cache(maxsize=1)
def get_llm_adapter() -> LlmPort:
    settings = get_settings()
    provider = settings.llm_provider

    if provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicLlmAdapter(
            api_key=settings.anthropic_api_key.get_secret_value(),
            model_name=settings.llm_model,
        )

    if provider == "groq" and settings.groq_api_key:
        return OpenAICompatibleLlmAdapter(
            api_key=settings.groq_api_key.get_secret_value(),
            base_url=_GROQ_BASE_URL,
            model_name=settings.groq_model,
            provider_name="groq",
        )

    if provider == "openai" and settings.openai_api_key:
        return OpenAICompatibleLlmAdapter(
            api_key=settings.openai_api_key.get_secret_value(),
            base_url=settings.openai_base_url,
            model_name=settings.llm_model,
            provider_name="openai",
        )

    if provider == "ollama":
        return OllamaLlmAdapter(
            base_url=settings.ollama_base_url,
            model_name=settings.llm_model,
        )

    # Aucun provider exploitable (clé manquante, etc.) → repli mock.
    return MockLlmAdapter()
