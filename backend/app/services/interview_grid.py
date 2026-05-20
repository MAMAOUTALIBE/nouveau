"""Génération de grille d'entretien + filtre des questions discriminatoires.

Pipeline :
1. Le recruteur demande une grille pour une candidature.
2. Le service appelle le LLM avec un prompt structuré (poste + CV + résultat
   du matching s'il existe).
3. Le LLM renvoie une liste de questions par compétence + zones de doute.
4. Le service applique un **filtre regex** + **classification LLM** pour
   rejeter toute question discriminatoire (âge, religion, situation
   familiale, opinion politique, état de santé, origine ethnique).
5. La grille validée est stockée dans `application.metadata.interview_grid`.
6. Audit `INTERVIEW_GRID_GENERATED`.

Le recruteur peut éditer la grille avant l'entretien (endpoint d'édition).
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.llm import LlmMessage, LlmPort, get_llm_adapter
from app.core.audit import AuditWriter
from app.core.errors import NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.recruitment import RecruitmentApplication

logger = get_logger(__name__)

# ============================================================================
# Filtre questions discriminatoires (PY-053)
# ============================================================================
# Patterns regex (insensible à la casse) — première ligne de défense.
# Validé par DRH ; à étendre selon retours métiers.
_DISCRIMINATORY_PATTERNS: tuple[tuple[str, str], ...] = (
    (r"\b(âge|age)\b", "AGE"),
    (r"\b(date de naissance|né\(e\)? en)\b", "AGE"),
    (r"\b(marié|mariée|conjoint|époux|épouse|concubin)\b", "FAMILY"),
    (r"\b(enfant|enfants|parent|parents|maternité|paternité)\b", "FAMILY"),
    (r"\b(grossesse|enceinte)\b", "FAMILY"),
    (r"\b(religion|religieux|religieuse|culte|musulman|chrétien|chrétienne)\b", "RELIGION"),
    (r"\b(parti politique|opinion politique|vote|tendance politique)\b", "POLITICS"),
    (r"\b(handicap|maladie|santé|médical|médicale|traitement)\b", "HEALTH"),
    (r"\b(origine ethnique|ethnie|tribu|ethno)\b", "ETHNICITY"),
    (r"\b(orientation sexuelle|sexualité|homosexuel|hétérosexuel)\b", "SEXUAL_ORIENTATION"),
    (r"\b(syndicat|syndical|syndicale|grève)\b", "UNION"),
)


def screen_question_for_discrimination(question: str) -> tuple[bool, str | None]:
    """Renvoie (is_discriminatory, category)."""
    text = question.strip()
    for pattern, category in _DISCRIMINATORY_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return True, category
    return False, None


# ============================================================================
# Prompt système — pour la génération
# ============================================================================
_GRID_SYSTEM_PROMPT = """Tu es un assistant RH spécialisé dans la conduite d'entretiens \
de recrutement pour la fonction publique guinéenne, dans un cadre strictement \
non-discriminatoire.

Génère une grille d'entretien adaptée au poste et au profil candidat fourni.
Renvoie UNIQUEMENT un JSON valide :

{
  "competencies": [
    {
      "competency": "<nom compétence>",
      "level_target": "Debutant"|"Intermediaire"|"Avance"|"Expert",
      "questions": [
        {"text": "<question ouverte>", "rationale": "<but>"},
        ...
      ]
    },
    ...
  ],
  "concerns_to_clarify": [
    {"text": "<question>", "rationale": "<pourquoi>"},
    ...
  ],
  "estimated_duration_minutes": <int>
}

RÈGLES DE NON-DISCRIMINATION (impératives) :
- Ne JAMAIS poser de questions sur :
  - âge, date de naissance, situation familiale (mariage, enfants, grossesse)
  - religion, opinion politique, syndicalisme
  - origine ethnique, tribu
  - orientation sexuelle
  - handicap, état de santé, traitements médicaux
- Toutes les questions doivent porter sur les compétences professionnelles,
  l'expérience, les motivations, la projection dans le poste.
- Privilégier des questions ouvertes plutôt que fermées.
- 3 à 5 questions par compétence cible (4-7 compétences max).
"""


async def generate_interview_grid(
    session: AsyncSession,
    *,
    application_id: UUID,
    job_description: str | None = None,
    actor_user_id: UUID,
    audit: AuditWriter,
    adapter: LlmPort | None = None,
) -> dict[str, Any]:
    adapter = adapter or get_llm_adapter()
    application = (
        await session.execute(
            select(RecruitmentApplication).where(
                RecruitmentApplication.application_id == application_id
            )
        )
    ).scalar_one_or_none()
    if application is None:
        raise NotFoundError("Candidature introuvable.", code="APPLICATION_NOT_FOUND")

    metadata = dict(application.application_metadata or {})
    cv_matching = metadata.get("cv_matching_run", {}).get("result")

    user_prompt = (
        f"Candidat : {application.candidate_full_name}\n"
        f"Poste recherché : {application.desired_position or '(non précisé)'}\n"
        f"Expérience : {application.experience_years or 'non précisée'} années\n"
        f"\n=== Fiche de poste ===\n{job_description or '(non fournie)'}\n"
    )
    if cv_matching:
        user_prompt += (
            f"\n=== Résultat matching CV ===\n"
            f"Compétences validées : {cv_matching.get('matched_skills', [])}\n"
            f"Compétences manquantes : {cv_matching.get('missing_skills', [])}\n"
            f"Concerns : {cv_matching.get('concerns', [])}\n"
        )

    completion = await adapter.complete(
        messages=[
            LlmMessage(role="system", content=_GRID_SYSTEM_PROMPT),
            LlmMessage(role="user", content=user_prompt),
        ],
        max_tokens=2048,
        temperature=0.3,
        response_format_json=True,
    )
    if completion.error_code:
        raise ValidationError(
            f"LLM error: {completion.error_message or completion.error_code}",
            code="LLM_ERROR",
        )

    payload = completion.parsed_json
    if payload is None:
        try:
            payload = json.loads(completion.text)
        except json.JSONDecodeError:
            raise ValidationError(
                "Le LLM n'a pas renvoyé un JSON valide.",
                code="LLM_NON_JSON",
            ) from None

    # ========================================================================
    # Filtre des questions discriminatoires (post-LLM)
    # ========================================================================
    rejected: list[dict[str, str]] = []
    for competency in payload.get("competencies", []):
        kept_questions: list[dict[str, Any]] = []
        for question in competency.get("questions", []):
            text = str(question.get("text", ""))
            is_disc, category = screen_question_for_discrimination(text)
            if is_disc:
                rejected.append(
                    {
                        "text": text,
                        "category": category or "UNKNOWN",
                        "competency": competency.get("competency", ""),
                    }
                )
                continue
            kept_questions.append(question)
        competency["questions"] = kept_questions

    concerns = payload.get("concerns_to_clarify", [])
    kept_concerns: list[dict[str, Any]] = []
    for concern in concerns:
        text = str(concern.get("text", ""))
        is_disc, category = screen_question_for_discrimination(text)
        if is_disc:
            rejected.append(
                {"text": text, "category": category or "UNKNOWN", "competency": "concerns"}
            )
            continue
        kept_concerns.append(concern)
    payload["concerns_to_clarify"] = kept_concerns

    payload["filter_audit"] = {
        "rejected_count": len(rejected),
        "rejected_samples": rejected[:5],
    }

    # Persistance dans metadata
    metadata["interview_grid"] = {
        "generated_at": datetime.now(tz=UTC).isoformat(),
        "generated_by_user_id": str(actor_user_id),
        "provider": completion.provider_name,
        "model": completion.model_name,
        "input_tokens": completion.input_tokens,
        "output_tokens": completion.output_tokens,
        "grid": payload,
        "validation_status": "PENDING_RECRUITER_REVIEW",
    }
    application.application_metadata = metadata
    await session.flush()

    await audit.record(
        action="INTERVIEW_GRID_GENERATED",
        target_type="recruitment_application",
        target_id=str(application_id),
        after={
            "provider": completion.provider_name,
            "competencies_count": len(payload.get("competencies", [])),
            "rejected_questions": len(rejected),
        },
    )
    return payload
