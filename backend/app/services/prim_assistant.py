"""Prim'Assistant — chatbot RH avec intentions + RBAC + confirmation.

Pipeline V1 :
1. Le user envoie un message → classification intent par LLM.
2. Vérification permission selon l'intent.
3. Action draft (proposition de payload) → renvoyée au client.
4. Le client confirme via un second appel (`/confirm`) → exécution.
5. Audit `AI_ASSISTANT_INTENT` + `AI_ASSISTANT_ACTION`.

Intentions V1 supportées :
- `LEAVE_REQUEST_CREATE` : créer une demande de congé
- `ATTESTATION_REQUEST` : demander une attestation
- `STATUS_CHECK` : vérifier le statut d'une demande
- `HR_FAQ` : question RH générique → réponse texte
- `UNKNOWN` : transfert vers gestionnaire RH humain
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal, cast

from app.adapters.llm import LlmMessage, LlmPort, get_llm_adapter
from app.core.audit import AuditWriter
from app.core.errors import ValidationError
from app.core.logging import get_logger
from app.core.security.rbac import AuthenticatedUser

logger = get_logger(__name__)

Intent = Literal[
    "LEAVE_REQUEST_CREATE",
    "ATTESTATION_REQUEST",
    "STATUS_CHECK",
    "HR_FAQ",
    "UNKNOWN",
]

# Mapping intent → permissions requises
INTENT_PERMISSIONS: dict[str, list[str]] = {
    "LEAVE_REQUEST_CREATE": ["leave:view", "leave:manage", "portal:agent", "*"],
    "ATTESTATION_REQUEST": ["documents:view", "documents:manage", "portal:agent", "*"],
    "STATUS_CHECK": ["leave:view", "documents:view", "portal:agent", "*"],
    "HR_FAQ": [],  # accessible à tout user authentifié
    "UNKNOWN": [],
}


@dataclass(frozen=True, slots=True)
class AssistantTurn:
    intent: Intent
    confidence: float
    text_response: str
    action_draft: dict[str, Any] | None = None
    requires_confirmation: bool = False
    blocked_reason: str | None = None
    sources: list[str] = field(default_factory=list)


_INTENT_SYSTEM_PROMPT = """Tu es Prim'Assistant, l'assistant RH de la Primature de \
la République de Guinée. Tu aides les agents et managers à effectuer des \
opérations RH simples.

Pour CHAQUE message utilisateur, retourne UNIQUEMENT un JSON :

{
  "intent": "LEAVE_REQUEST_CREATE" | "ATTESTATION_REQUEST" | "STATUS_CHECK" | "HR_FAQ" | "UNKNOWN",
  "confidence": <0..1>,
  "text_response": "<réponse en français à l'utilisateur>",
  "action_draft": {
    // Présent si intent crée une action concrète
    // - LEAVE_REQUEST_CREATE: {leave_type_code, start_date, end_date, reason}
    // - ATTESTATION_REQUEST: {document_type_code, reason}
    // - STATUS_CHECK: {reference_or_id}
    // null sinon
  },
  "requires_confirmation": <bool, true si action_draft != null>
}

Règles :
- Si l'utilisateur n'a pas fourni assez d'informations, fixe `intent` selon
  ce que tu détectes mais laisse `action_draft=null` et demande des
  précisions dans `text_response`.
- Si la demande est ambiguë ou hors-périmètre, retourne `UNKNOWN` et
  propose le transfert vers un gestionnaire RH humain.
- Toujours répondre en français, ton respectueux et concis (≤ 200 mots).
- Ne JAMAIS inventer une référence ou un statut : pour STATUS_CHECK, juste
  copier l'identifiant fourni.
- Ne JAMAIS divulguer les données d'autres utilisateurs.
"""


async def chat_turn(
    *,
    user: AuthenticatedUser,
    message: str,
    audit: AuditWriter,
    adapter: LlmPort | None = None,
) -> AssistantTurn:
    """Traite un tour de conversation. Renvoie un AssistantTurn structuré."""
    if not message.strip():
        raise ValidationError("Message vide.", code="EMPTY_MESSAGE")

    adapter = adapter or get_llm_adapter()
    completion = await adapter.complete(
        messages=[
            LlmMessage(role="system", content=_INTENT_SYSTEM_PROMPT),
            LlmMessage(role="user", content=message),
        ],
        max_tokens=512,
        temperature=0.2,
        response_format_json=True,
    )
    if completion.error_code:
        return AssistantTurn(
            intent="UNKNOWN",
            confidence=0.0,
            text_response=(
                "Je ne peux pas traiter votre demande pour le moment "
                "(service IA indisponible). Un gestionnaire RH va prendre "
                "le relais."
            ),
            blocked_reason=f"LLM_ERROR:{completion.error_code}",
        )

    payload = completion.parsed_json
    if payload is None:
        try:
            payload = json.loads(completion.text)
        except json.JSONDecodeError:
            payload = {
                "intent": "UNKNOWN",
                "confidence": 0.0,
                "text_response": ("Je n'ai pas pu structurer ma réponse. Veuillez reformuler."),
                "action_draft": None,
                "requires_confirmation": False,
            }

    intent_raw = payload.get("intent", "UNKNOWN")
    intent: Intent = cast("Intent", intent_raw) if intent_raw in INTENT_PERMISSIONS else "UNKNOWN"

    # RBAC : intent autorisée pour cet utilisateur ?
    required = INTENT_PERMISSIONS[intent]
    if required and not user.has_any_permission(required):
        await audit.record(
            action="AI_ASSISTANT_INTENT_BLOCKED",
            target_type="user",
            target_id=str(user.user_id),
            after={"intent": intent, "required_permissions": required},
        )
        return AssistantTurn(
            intent=intent,
            confidence=float(payload.get("confidence", 0.5)),
            text_response=(
                "Vous n'avez pas les droits requis pour cette opération. "
                "Un gestionnaire RH va vous recontacter."
            ),
            blocked_reason="INSUFFICIENT_PERMISSIONS",
        )

    await audit.record(
        action="AI_ASSISTANT_INTENT",
        target_type="user",
        target_id=str(user.user_id),
        after={
            "intent": intent,
            "confidence": float(payload.get("confidence", 0.5)),
            "requires_confirmation": bool(payload.get("requires_confirmation", False)),
            "provider": completion.provider_name,
        },
    )

    return AssistantTurn(
        intent=intent,
        confidence=float(payload.get("confidence", 0.5)),
        text_response=str(payload.get("text_response", "")),
        action_draft=payload.get("action_draft"),
        requires_confirmation=bool(payload.get("requires_confirmation", False)),
    )


async def confirm_action(
    *,
    user: AuthenticatedUser,
    intent: Intent,
    action_draft: dict[str, Any],
    audit: AuditWriter,
) -> dict[str, Any]:
    """Exécute un draft confirmé.

    L'exécution réelle (création congé, etc.) est déléguée aux services
    métier existants par le router (qui passe par le ServicePort approprié).
    Ici on enregistre l'audit et on renvoie une trace.
    """
    await audit.record(
        action="AI_ASSISTANT_ACTION_CONFIRMED",
        target_type="user",
        target_id=str(user.user_id),
        after={
            "intent": intent,
            "action_draft_keys": list(action_draft.keys()),
            "confirmed_at": datetime.now(tz=UTC).isoformat(),
        },
    )
    return {
        "status": "CONFIRMED",
        "intent": intent,
        "audit_recorded": True,
        "instructions": (
            "Le client doit maintenant appeler l'endpoint métier "
            "correspondant (ex: POST /api/v1/leave/requests pour LEAVE_REQUEST_CREATE)."
        ),
    }
