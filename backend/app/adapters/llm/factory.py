"""Factory de sélection de l'adapter LLM."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.llm.anthropic import AnthropicLlmAdapter
from app.adapters.llm.mock import MockLlmAdapter
from app.adapters.llm.ollama import OllamaLlmAdapter
from app.adapters.llm.port import LlmPort
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_llm_adapter() -> LlmPort:
    settings = get_settings()
    provider = settings.llm_provider

    if provider == "anthropic" and settings.anthropic_api_key:
        return AnthropicLlmAdapter(
            api_key=settings.anthropic_api_key.get_secret_value(),
            model_name=settings.llm_model,
        )

    if provider == "ollama":
        return OllamaLlmAdapter(
            base_url=settings.ollama_base_url,
            model_name=settings.llm_model,
        )

    if provider == "openai":
        # Stub : à brancher si choisi.
        return MockLlmAdapter()

    return MockLlmAdapter()
