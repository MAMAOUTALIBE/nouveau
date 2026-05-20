"""Adapter SpiffWorkflow — moteur BPMN 2.0 Python pur (souverain, pas de JVM).

SpiffWorkflow charge les fichiers `.bpmn` du dossier configuré
(`BPMN_MODELS_DIR`, défaut `../bpmn` relatif au backend) et exécute
les transitions sur la base des variables fournies.

Sérialisation : on stocke l'état d'une instance comme un JSON opaque
dans `WorkflowInstance.metadata.spiff_state`. À chaque action, on
rehydrate, on avance, on re-sérialise.

Import paresseux : si `SpiffWorkflow` n'est pas installé, l'adapter
tombe en erreur claire au premier appel mais le boot reste OK.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.adapters.workflow.port import (
    BpmnEngineError,
    BpmnInstanceState,
    BpmnUserTask,
    WorkflowEnginePort,
)
from app.core.logging import get_logger

_logger = get_logger(__name__)


class SpiffWorkflowAdapter(WorkflowEnginePort):
    provider_name = "spiff"

    def __init__(self, models_dir: Path) -> None:
        self.models_dir = models_dir
        if not models_dir.is_dir():
            raise BpmnEngineError(
                f"Dossier BPMN introuvable : {models_dir}. "
                "Configurer BPMN_MODELS_DIR ou créer le dossier."
            )
        self._spec_cache: dict[str, Any] = {}

    # --------------------------------------------------------------
    # Helpers SpiffWorkflow (imports paresseux)
    # --------------------------------------------------------------
    def _load_spec(self, workflow_code: str) -> Any:
        if workflow_code in self._spec_cache:
            return self._spec_cache[workflow_code]

        try:
            from SpiffWorkflow.bpmn.parser.BpmnParser import BpmnParser
        except ImportError as exc:
            raise BpmnEngineError(
                "SpiffWorkflow non installé. `uv add spiffworkflow` requis "
                "pour activer le moteur BPMN."
            ) from exc

        parser = BpmnParser()
        for bpmn_file in sorted(self.models_dir.glob("*.bpmn")):
            parser.add_bpmn_file(str(bpmn_file))

        try:
            spec = parser.get_spec(workflow_code)
        except Exception as exc:
            raise BpmnEngineError(
                f"Workflow '{workflow_code}' introuvable dans {self.models_dir}. "
                f"Erreur Spiff : {exc}"
            ) from exc

        self._spec_cache[workflow_code] = spec
        return spec

    @staticmethod
    def _wf_to_state(workflow: Any, code: str) -> BpmnInstanceState:
        """Convertit un BpmnWorkflow Spiff en BpmnInstanceState sérialisable."""
        try:
            from SpiffWorkflow.bpmn.serializer import BpmnSerializer
            from SpiffWorkflow.task import TaskState
        except ImportError as exc:
            raise BpmnEngineError("SpiffWorkflow non installé.") from exc

        ready_tasks = [t for t in workflow.get_tasks(state=TaskState.READY) if t.task_spec.bpmn_id]
        pending_tasks = [
            BpmnUserTask(
                task_id=str(t.task_spec.bpmn_id or t.task_spec.name),
                task_name=str(t.task_spec.bpmn_name or t.task_spec.description or ""),
                assignee_role=None,
                metadata={"task_class": type(t.task_spec).__name__},
            )
            for t in ready_tasks
        ]

        end_event_id: str | None = None
        if workflow.is_completed():
            for t in workflow.get_tasks(state=TaskState.COMPLETED):
                if "EndEvent" in type(t.task_spec).__name__:
                    end_event_id = str(t.task_spec.bpmn_id or t.task_spec.name)

        serialized = BpmnSerializer().serialize_workflow(workflow)
        return BpmnInstanceState(
            workflow_code=code,
            instance_serialized=serialized,
            is_completed=workflow.is_completed(),
            end_event_id=end_event_id,
            pending_tasks=pending_tasks,
            variables=dict(workflow.data),
        )

    def _restore_workflow(self, *, instance_serialized: str, code: str) -> Any:
        try:
            from SpiffWorkflow.bpmn.serializer import BpmnSerializer
        except ImportError as exc:
            raise BpmnEngineError("SpiffWorkflow non installé.") from exc
        spec = self._load_spec(code)
        try:
            workflow = BpmnSerializer().deserialize_workflow(instance_serialized, spec)
        except Exception as exc:
            raise BpmnEngineError(f"Désérialisation impossible : {exc}") from exc
        return workflow

    # --------------------------------------------------------------
    # Implémentation du port
    # --------------------------------------------------------------
    def list_workflow_codes(self) -> list[str]:
        codes: list[str] = []
        try:
            from SpiffWorkflow.bpmn.parser.BpmnParser import BpmnParser
        except ImportError:
            return codes
        parser = BpmnParser()
        for bpmn_file in sorted(self.models_dir.glob("*.bpmn")):
            try:
                parser.add_bpmn_file(str(bpmn_file))
            except Exception as exc:
                _logger.warning("bpmn_parse_skipped", file=str(bpmn_file), error=str(exc))
        # Spiff stocke les processus parsés dans `parser.process_parsers`
        return list(getattr(parser, "process_parsers", {}).keys())

    def start(self, *, workflow_code: str, variables: dict[str, Any]) -> BpmnInstanceState:
        try:
            from SpiffWorkflow.bpmn.workflow import BpmnWorkflow
        except ImportError as exc:
            raise BpmnEngineError(
                "SpiffWorkflow non installé. `uv add spiffworkflow` requis."
            ) from exc

        spec = self._load_spec(workflow_code)
        workflow = BpmnWorkflow(spec)
        for k, v in variables.items():
            workflow.data[k] = v
        workflow.do_engine_steps()
        return self._wf_to_state(workflow, workflow_code)

    def complete_user_task(
        self,
        *,
        instance_serialized: str,
        workflow_code: str,
        task_id: str,
        variables: dict[str, Any],
    ) -> BpmnInstanceState:
        workflow = self._restore_workflow(
            instance_serialized=instance_serialized, code=workflow_code
        )
        try:
            from SpiffWorkflow.task import TaskState
        except ImportError as exc:
            raise BpmnEngineError("SpiffWorkflow non installé.") from exc

        # Injecte les variables avant de compléter
        for k, v in variables.items():
            workflow.data[k] = v

        target = next(
            (
                t
                for t in workflow.get_tasks(state=TaskState.READY)
                if str(t.task_spec.bpmn_id or t.task_spec.name) == task_id
            ),
            None,
        )
        if target is None:
            raise BpmnEngineError(f"Tâche {task_id!r} introuvable ou non prête dans l'instance.")

        target.complete()
        workflow.do_engine_steps()
        return self._wf_to_state(workflow, workflow_code)


def _empty_serialized() -> str:
    return json.dumps({})
