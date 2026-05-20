"""Workflow adapters — moteur interne (V1) ou SpiffWorkflow BPMN (V2)."""

from app.adapters.workflow.factory import get_workflow_adapter
from app.adapters.workflow.port import (
    BpmnEngineError,
    BpmnInstanceState,
    BpmnUserTask,
    WorkflowEnginePort,
)

__all__ = [
    "BpmnEngineError",
    "BpmnInstanceState",
    "BpmnUserTask",
    "WorkflowEnginePort",
    "get_workflow_adapter",
]
