"""Factory de sélection du moteur workflow."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from app.adapters.workflow.internal import InternalWorkflowAdapter
from app.adapters.workflow.port import WorkflowEnginePort
from app.adapters.workflow.spiff import SpiffWorkflowAdapter
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_workflow_adapter() -> WorkflowEnginePort:
    settings = get_settings()
    if settings.bpmn_provider == "spiff":
        # Résolution du dossier bpmn/ : si chemin relatif, prendre par rapport
        # au backend (où le process est lancé).
        models_path = Path(settings.bpmn_models_dir)
        if not models_path.is_absolute():
            models_path = (Path.cwd() / models_path).resolve()
        try:
            return SpiffWorkflowAdapter(models_dir=models_path)
        except Exception:
            # Si le dossier ou Spiff n'est pas dispo, on tombe sur internal
            # pour que le boot ne casse pas.
            return InternalWorkflowAdapter()
    return InternalWorkflowAdapter()
