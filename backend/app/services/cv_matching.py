"""Matching CV ↔ poste — version V1 LLM-explicable.

Pipeline :
1. Récupère le CV texte de la candidature (OCR fait en amont, Vague 4).
2. Construit un prompt structuré (système : règles RH, user : poste + CV).
3. Appelle le `LlmPort` configuré, demande un JSON typé.
4. Persiste la suggestion dans `recruitment_applications.metadata.cv_matching_run`
   (sans écraser les scores manuels — c'est une **suggestion** que le
   recruteur valide).
5. Audit `RECRUITMENT_CV_MATCHING_RUN`.

**Validation humaine obligatoire** : la sortie LLM est stockée comme
SUGGESTION. Les colonnes `skills_match_score` etc. ne sont PAS écrasées
automatiquement — c'est le recruteur qui clique "accepter" via un endpoint
séparé. Cette règle métier est documentée dans le Plan d'Action et
implémentée structurellement.

**Données envoyées à un LLM tiers** : le contenu du CV est transmis. Si
souveraineté requise → utiliser `LLM_PROVIDER=ollama` avec un modèle
local. Avant déploiement avec données réelles, valider avec le DPO.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.llm import LlmMessage, LlmPort, get_llm_adapter
from app.core.audit import AuditWriter
from app.core.errors import NotFoundError, ValidationError
from app.core.logging import get_logger
from app.models.recruitment import RecruitmentApplication, RecruitmentCampaign

logger = get_logger(__name__)

# ============================================================================
# Prompt système — RÈGLES MÉTIER VALIDÉES (à modifier seulement avec DRH)
# ============================================================================
_SYSTEM_PROMPT = """Tu es un assistant RH spécialisé dans l'évaluation de candidatures \
pour la fonction publique de la République de Guinée. Tu travailles dans un cadre \
strictement non-discriminatoire.

Tu reçois :
- Une fiche de poste (title, missions, compétences attendues).
- Le contenu textuel d'un CV.

Tu dois retourner UNIQUEMENT un JSON valide avec ce schéma :

{
  "skills_match_score": <0 à 100>,
  "experience_match_score": <0 à 100>,
  "education_match_score": <0 à 100>,
  "overall_score": <0 à 100, moyenne pondérée>,
  "matched_skills": [<liste>],
  "missing_skills": [<liste>],
  "strengths": [<3-5 raisons textuelles>],
  "concerns": [<0-3 points à vérifier en entretien>],
  "language_proficiency_estimate": "elementary"|"intermediate"|"advanced"|"fluent"|"unknown",
  "confidence": <0 à 1>
}

Règles de notation :
- Aucune information personnelle protégée ne doit influencer le score :
  âge, genre, situation familiale, religion, opinion politique, origine
  ethnique, état de santé. Si ces informations apparaissent dans le CV,
  les ignorer pour la notation.
- "skills_match_score" mesure la couverture des compétences attendues.
- "experience_match_score" mesure l'adéquation années d'expérience + secteur.
- "education_match_score" mesure le niveau et la spécialité diplôme.
- "overall_score" = (40 % skills + 35 % experience + 25 % education).
- En cas de doute, baisser le score plutôt que sur-évaluer.
- "confidence" reflète la qualité du CV fourni (texte court → confidence basse).
"""


async def run_cv_matching(
    session: AsyncSession,
    *,
    organization_id: UUID,
    application_id: UUID,
    cv_text: str,
    job_description: str | None = None,
    actor_user_id: UUID,
    audit: AuditWriter,
    adapter: LlmPort | None = None,
) -> dict[str, Any]:
    """Exécute le matching et stocke la suggestion dans `application.metadata`.

    Returns: le payload JSON parsé du LLM (pour affichage immédiat côté client).
    """
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

    if not cv_text or len(cv_text.strip()) < 50:
        raise ValidationError(
            "Le texte du CV est trop court (< 50 caractères).",
            code="CV_TEXT_TOO_SHORT",
        )

    # Si pas de job_description fournie, utilise la campagne associée
    if not job_description and application.campaign_id is not None:
        campaign = (
            await session.execute(
                select(RecruitmentCampaign).where(
                    RecruitmentCampaign.campaign_id == application.campaign_id
                )
            )
        ).scalar_one_or_none()
        if campaign is not None:
            job_description = (
                f"Titre du poste : {campaign.title}\n"
                f"Code : {campaign.code}\n"
                f"Position : {campaign.need_position or '—'}\n"
                f"Ouvertures : {campaign.openings}"
            )

    user_prompt = (
        f"=== Fiche de poste ===\n{job_description or '(non fournie)'}\n\n"
        f"=== CV candidat ({application.candidate_full_name}) ===\n{cv_text}\n\n"
        "Retourne le JSON conforme au schéma."
    )

    completion = await adapter.complete(
        messages=[
            LlmMessage(role="system", content=_SYSTEM_PROMPT),
            LlmMessage(role="user", content=user_prompt),
        ],
        max_tokens=1024,
        temperature=0.1,
        response_format_json=True,
    )

    if completion.error_code:
        await audit.record(
            action="RECRUITMENT_CV_MATCHING_FAILED",
            target_type="recruitment_application",
            target_id=str(application_id),
            status="FAILURE",
            after={
                "provider": completion.provider_name,
                "error_code": completion.error_code,
            },
        )
        raise ValidationError(
            f"LLM error: {completion.error_message or completion.error_code}",
            code="LLM_ERROR",
        )

    payload = completion.parsed_json
    if payload is None:
        # Tente un parse JSON défensif
        try:
            payload = json.loads(completion.text)
        except json.JSONDecodeError:
            raise ValidationError(
                "Le LLM n'a pas renvoyé un JSON valide.",
                code="LLM_NON_JSON",
                details={"raw_text_excerpt": completion.text[:500]},
            ) from None

    # Stocke la suggestion dans metadata.cv_matching_run (NE pas écraser
    # les scores validés humainement)
    metadata = dict(application.application_metadata or {})
    metadata["cv_matching_run"] = {
        "ran_at": datetime.now(tz=UTC).isoformat(),
        "ran_by_user_id": str(actor_user_id),
        "provider": completion.provider_name,
        "model": completion.model_name,
        "input_tokens": completion.input_tokens,
        "output_tokens": completion.output_tokens,
        "result": payload,
        "validation_status": "PENDING_HUMAN_REVIEW",
    }
    application.application_metadata = metadata
    await session.flush()

    await audit.record(
        action="RECRUITMENT_CV_MATCHING_RUN",
        target_type="recruitment_application",
        target_id=str(application_id),
        after={
            "provider": completion.provider_name,
            "model": completion.model_name,
            "overall_score": payload.get("overall_score"),
            "input_tokens": completion.input_tokens,
            "output_tokens": completion.output_tokens,
        },
    )
    _ = organization_id  # multi-tenant déjà via application
    return payload


async def accept_cv_matching_suggestion(
    session: AsyncSession,
    *,
    application_id: UUID,
    actor_user_id: UUID,
    audit: AuditWriter,
) -> RecruitmentApplication:
    """Le recruteur valide la suggestion du LLM : on copie les scores
    LLM dans les colonnes officielles `skills_match_score`, etc."""
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
    suggestion = metadata.get("cv_matching_run")
    if not suggestion or "result" not in suggestion:
        raise ValidationError(
            "Aucune suggestion LLM à valider pour cette candidature.",
            code="NO_LLM_SUGGESTION",
        )
    result = suggestion["result"]
    before = {
        "skills_match_score": (
            str(application.skills_match_score) if application.skills_match_score else None
        ),
        "education_score": (
            str(application.education_score) if application.education_score else None
        ),
    }

    if "skills_match_score" in result:
        application.skills_match_score = Decimal(str(result["skills_match_score"]))
    if "education_match_score" in result:
        application.education_score = Decimal(str(result["education_match_score"]))

    suggestion["validation_status"] = "ACCEPTED"
    suggestion["validated_by_user_id"] = str(actor_user_id)
    suggestion["validated_at"] = datetime.now(tz=UTC).isoformat()
    metadata["cv_matching_run"] = suggestion
    application.application_metadata = metadata
    await session.flush()

    await audit.record(
        action="RECRUITMENT_CV_MATCHING_ACCEPTED",
        target_type="recruitment_application",
        target_id=str(application_id),
        before=before,
        after={
            "skills_match_score": (
                str(application.skills_match_score) if application.skills_match_score else None
            ),
            "education_score": (
                str(application.education_score) if application.education_score else None
            ),
        },
    )
    return application
