"""Modèles SQLAlchemy — schéma `hr.*` complet de la base RH Primature.

Le schéma cible est défini dans :
    Final/db/postgresql/001_init_rh_schema.sql        (socle, 31 tables)
    Final/db/postgresql/002_unified_documents.sql     (GED unifiée, 7 tables)
    Final/db/postgresql/004_personnel_360_ai.sql      (360, IA, badges, 5 tables)

Et étendu par les migrations Alembic :
    backend/alembic/versions/0001_baseline_existing_schema.py  (43 tables existantes)
    backend/alembic/versions/0002_training_perf_discipline_gpec.py  (16 nouvelles tables)

Tous les modèles sont mappés au schéma `hr` (configurable via SCHEMA_NAME).
"""

from app.models.audit_log import AuditLog
from app.models.discipline import DisciplineCase, DisciplineEvent
from app.models.document import (
    Document,
    DocumentAnalysisRun,
    DocumentDispatch,
    DocumentExtractedField,
    DocumentLink,
    DocumentRequest,
    DocumentRequirement,
    DocumentRetentionEvent,
    DocumentRetentionRule,
    DocumentType,
    DocumentVersion,
)
from app.models.document_extraction_queue import DocumentExtractionQueue
from app.models.employee import (
    Employee,
    EmployeeAssignment,
    EmployeeMovement,
    PersonnelMatriculeSuggestionAudit,
)
from app.models.file_object import FileObject
from app.models.gpec import (
    CompetencyGapsSnapshot,
    CompetencyReferential,
    PositionCompetencyRequirement,
)
from app.models.leave import LeaveBalance, LeaveRequest, LeaveType
from app.models.leave_rules import LeaveAutoApprovalRule, LeaveServiceCoverageRule
from app.models.notification import Notification
from app.models.organization import Direction, Organization, Unit
from app.models.performance import (
    Performance360Invitation,
    Performance360Response,
    PerformanceCampaign,
    PerformanceEvaluation,
)
from app.models.permission import Permission, Role, RolePermission
from app.models.personnel_360 import (
    EmployeeCompetency,
    EmployeeDependent,
    EmployeeDigitalBadge,
    EmployeeDossierExport,
    EmployeeTurnoverRiskSnapshot,
)
from app.models.position import Position
from app.models.recruitment import (
    RecruitmentApplication,
    RecruitmentAttachment,
    RecruitmentCampaign,
    RecruitmentComment,
    RecruitmentScoringPolicy,
    RecruitmentStatusEvent,
)
from app.models.signature import (
    SignatureAuditTrail,
    SignatureEnvelope,
    SignatureProvider,
)
from app.models.training import (
    TrainingCatalog,
    TrainingCertificate,
    TrainingEvaluation,
    TrainingRequest,
    TrainingSession,
    TrainingSessionParticipant,
)
from app.models.user import User, UserRole, UserScope
from app.models.workflow import (
    WorkflowDefinition,
    WorkflowInstance,
    WorkflowInstanceEvent,
    WorkflowStep,
)

__all__ = [
    "AuditLog",
    "CompetencyGapsSnapshot",
    "CompetencyReferential",
    "Direction",
    "DisciplineCase",
    "DisciplineEvent",
    "Document",
    "DocumentAnalysisRun",
    "DocumentDispatch",
    "DocumentExtractedField",
    "DocumentExtractionQueue",
    "DocumentLink",
    "DocumentRequest",
    "DocumentRequirement",
    "DocumentRetentionEvent",
    "DocumentRetentionRule",
    "DocumentType",
    "DocumentVersion",
    "Employee",
    "EmployeeAssignment",
    "EmployeeCompetency",
    "EmployeeDependent",
    "EmployeeDigitalBadge",
    "EmployeeDossierExport",
    "EmployeeMovement",
    "EmployeeTurnoverRiskSnapshot",
    "FileObject",
    "LeaveAutoApprovalRule",
    "LeaveBalance",
    "LeaveRequest",
    "LeaveServiceCoverageRule",
    "LeaveType",
    "Notification",
    "Organization",
    "Performance360Invitation",
    "Performance360Response",
    "PerformanceCampaign",
    "PerformanceEvaluation",
    "Permission",
    "PersonnelMatriculeSuggestionAudit",
    "Position",
    "PositionCompetencyRequirement",
    "RecruitmentApplication",
    "RecruitmentAttachment",
    "RecruitmentCampaign",
    "RecruitmentComment",
    "RecruitmentScoringPolicy",
    "RecruitmentStatusEvent",
    "Role",
    "RolePermission",
    "SignatureAuditTrail",
    "SignatureEnvelope",
    "SignatureProvider",
    "TrainingCatalog",
    "TrainingCertificate",
    "TrainingEvaluation",
    "TrainingRequest",
    "TrainingSession",
    "TrainingSessionParticipant",
    "Unit",
    "User",
    "UserRole",
    "UserScope",
    "WorkflowDefinition",
    "WorkflowInstance",
    "WorkflowInstanceEvent",
    "WorkflowStep",
]
