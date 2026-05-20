"""Adapter "internal" — moteur séquentiel maison (V1, pas de BPMN).

Renvoie un message clair invitant à passer en `BPMN_PROVIDER=spiff` pour
l'exécution BPMN. Le moteur séquentiel maison est conservé pour les
instances créées via les endpoints `/workflows/instances/*` classiques
(pas de modélisation BPMN nécessaire).
"""

from __future__ import annotations

import json
from typing import Any

from app.adapters.workflow.port import (
    BpmnEngineError,
    BpmnInstanceState,
    WorkflowEnginePort,
)


class InternalWorkflowAdapter(WorkflowEnginePort):
    provider_name = "internal"

    def list_workflow_codes(self) -> list[str]:
        return []

    def start(self, *, workflow_code: str, variables: dict[str, Any]) -> BpmnInstanceState:
        raise BpmnEngineError(
            "Le moteur 'internal' n'exécute pas de BPMN. Utiliser les endpoints "
            "/workflows/instances/* classiques, ou activer BPMN_PROVIDER=spiff."
        )

    def complete_user_task(
        self,
        *,
        instance_serialized: str,
        workflow_code: str,
        task_id: str,
        variables: dict[str, Any],
    ) -> BpmnInstanceState:
        # Inerte — placeholder pour la même raison que start()
        return BpmnInstanceState(
            workflow_code=workflow_code,
            instance_serialized=instance_serialized or json.dumps({}),
            is_completed=False,
            end_event_id=None,
        )
