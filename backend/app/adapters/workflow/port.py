"""Port pour un moteur de workflow (BPMN ou maison).

Interface volontairement minimaliste pour qu'un adapter "internal" (le
moteur séquentiel maison déjà en place) et un adapter "spiff"
(SpiffWorkflow Python pur) implémentent tous les deux.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


class BpmnEngineError(Exception):
    """Erreur fonctionnelle du moteur (workflow inconnu, état invalide…)."""


@dataclass(frozen=True, slots=True)
class BpmnUserTask:
    """Tâche humaine en attente dans une instance."""

    task_id: str
    task_name: str
    assignee_role: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class BpmnInstanceState:
    """État sérialisable d'une instance — persisté en DB pour reprise."""

    workflow_code: str
    instance_serialized: str  # blob opaque (JSON)
    is_completed: bool
    end_event_id: str | None
    pending_tasks: list[BpmnUserTask] = field(default_factory=list)
    variables: dict[str, Any] = field(default_factory=dict)


class WorkflowEnginePort(Protocol):
    """Interface qu'un moteur BPMN doit implémenter."""

    provider_name: str

    def list_workflow_codes(self) -> list[str]: ...

    def start(self, *, workflow_code: str, variables: dict[str, Any]) -> BpmnInstanceState: ...

    def complete_user_task(
        self,
        *,
        instance_serialized: str,
        workflow_code: str,
        task_id: str,
        variables: dict[str, Any],
    ) -> BpmnInstanceState: ...
