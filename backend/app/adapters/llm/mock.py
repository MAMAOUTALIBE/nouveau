"""Adapter LLM Mock — réponses déterministes pour tests + démos hors-ligne."""

from __future__ import annotations

import json

from app.adapters.llm.port import LlmCompletion, LlmMessage, LlmPort


class MockLlmAdapter(LlmPort):
    provider_name = "mock"
    model_name = "mock-llm-v1"

    async def complete(
        self,
        *,
        messages: list[LlmMessage],
        max_tokens: int = 4096,
        temperature: float = 0.2,
        response_format_json: bool = False,
    ) -> LlmCompletion:
        # Renvoie une réponse cohérente avec la dernière instruction utilisateur
        last_user = next(
            (m.content for m in reversed(messages) if m.role == "user"),
            "(empty)",
        )

        if response_format_json:
            payload = {
                "answer": "MockLlmAdapter — réponse déterministe pour tests.",
                "input_excerpt": last_user[:160],
                "structured": True,
            }
            text = json.dumps(payload, ensure_ascii=False, indent=2)
            return LlmCompletion(
                provider_name=self.provider_name,
                model_name=self.model_name,
                text=text,
                parsed_json=payload,
                input_tokens=len(last_user) // 4,
                output_tokens=len(text) // 4,
                finish_reason="stop",
            )

        text = (
            f"[mock-llm] Vous avez demandé : « {last_user[:120]} ». "
            "Cette réponse est générée par MockLlmAdapter (déterministe)."
        )
        return LlmCompletion(
            provider_name=self.provider_name,
            model_name=self.model_name,
            text=text,
            input_tokens=len(last_user) // 4,
            output_tokens=len(text) // 4,
            finish_reason="stop",
        )
