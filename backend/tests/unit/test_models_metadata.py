"""Tests unitaires : sanity sur le metadata SQLAlchemy.

Ces tests vérifient que tous les modèles s'enregistrent dans le metadata
sans erreur (FK manquantes, types incorrects, etc.) et que la couverture
de domaine attendue est présente.
"""

from __future__ import annotations

import pytest
from app import models  # noqa: F401 — déclenche l'enregistrement
from app.core.db import Base


def _all_table_names() -> set[str]:
    return set(Base.metadata.tables.keys())


def test_all_tables_in_hr_schema() -> None:
    tables = _all_table_names()
    assert tables, "Aucune table enregistrée"
    for table in tables:
        assert table.startswith("hr."), f"Table hors schéma hr : {table}"


def test_baseline_tables_present() -> None:
    """Les 43 tables des migrations 001+002+004 doivent être mappées."""
    tables = _all_table_names()
    baseline = {
        "hr.organizations",
        "hr.directions",
        "hr.units",
        "hr.positions",
        "hr.permissions",
        "hr.roles",
        "hr.role_permissions",
        "hr.users",
        "hr.user_roles",
        "hr.user_scopes",
        "hr.file_objects",
        "hr.employees",
        "hr.employee_assignments",
        "hr.employee_movements",
        "hr.leave_types",
        "hr.leave_balances",
        "hr.leave_requests",
        "hr.recruitment_campaigns",
        "hr.recruitment_applications",
        "hr.recruitment_status_events",
        "hr.recruitment_comments",
        "hr.recruitment_attachments",
        "hr.documents",
        "hr.document_versions",
        "hr.document_dispatches",
        "hr.workflow_definitions",
        "hr.workflow_steps",
        "hr.workflow_instances",
        "hr.workflow_instance_events",
        "hr.audit_logs",
        "hr.notifications",
        "hr.document_types",
        "hr.document_links",
        "hr.document_requirements",
        "hr.document_analysis_runs",
        "hr.document_extracted_fields",
        "hr.document_retention_rules",
        "hr.document_retention_events",
        "hr.employee_competencies",
        "hr.employee_dependents",
        "hr.employee_digital_badges",
        "hr.employee_dossier_exports",
        "hr.employee_turnover_risk_snapshots",
    }
    missing = baseline - tables
    assert not missing, f"Tables baseline manquantes : {sorted(missing)}"


def test_v1_new_tables_present() -> None:
    """Les nouvelles tables introduites par la migration 0002 doivent être mappées."""
    tables = _all_table_names()
    new_tables = {
        "hr.training_catalog",
        "hr.training_sessions",
        "hr.training_session_participants",
        "hr.training_requests",
        "hr.training_evaluations",
        "hr.training_certificates",
        "hr.performance_campaigns",
        "hr.performance_evaluations",
        "hr.performance_360_invitations",
        "hr.performance_360_responses",
        "hr.discipline_cases",
        "hr.discipline_events",
        "hr.competency_referential",
        "hr.position_competency_requirements",
        "hr.competency_gaps_snapshots",
        "hr.signature_providers",
        "hr.signature_envelopes",
        "hr.signature_audit_trail",
        "hr.leave_service_coverage_rules",
        "hr.leave_auto_approval_rules",
        "hr.document_extraction_queue",
    }
    missing = new_tables - tables
    assert not missing, f"Tables V1 manquantes : {sorted(missing)}"


def test_total_table_count() -> None:
    """Au moins 64 tables attendues (43 baseline + 21 V1).

    On garde un *floor* à 64 pour détecter toute suppression accidentelle de
    table métier, mais on tolère l'ajout de nouvelles tables (V1.x, V2…) sans
    devoir mettre à jour ce test à chaque migration. Le décompte exact n'a pas
    de valeur intrinsèque : ce qui compte, c'est qu'aucune table baseline ou
    V1 ne disparaisse (couvert par les deux tests ci-dessus).
    """
    tables = _all_table_names()
    count = len(tables)
    assert count >= 64, f"Au moins 64 tables attendues, trouvé {count}"


def test_audit_logs_has_organization_scope() -> None:
    """Toute table métier doit avoir une colonne organization_id (multi-tenant)."""
    audit = Base.metadata.tables["hr.audit_logs"]
    assert "organization_id" in audit.columns


def test_perf_360_responses_no_user_fk() -> None:
    """L'anonymat structurel : pas de FK vers users.user_id depuis responses.

    Le seul user FK toléré serait pour l'audit, mais on vérifie qu'il n'y en
    a aucun pour empêcher tout détournement futur.
    """
    table = Base.metadata.tables["hr.performance_360_responses"]
    for fk in table.foreign_keys:
        target = fk.column.table.fullname
        assert target != "hr.users", (
            "performance_360_responses ne doit JAMAIS référencer users : anonymat structurel cassé."
        )


def test_employees_has_self_referential_manager_fk() -> None:
    """L'arbre managérial est porté par employees.manager_employee_id."""
    table = Base.metadata.tables["hr.employees"]
    manager_col = table.columns.get("manager_employee_id")
    assert manager_col is not None, "Colonne manager_employee_id manquante"
    assert any(fk.column.table.fullname == "hr.employees" for fk in manager_col.foreign_keys), (
        "FK self-référentielle vers employees attendue"
    )


@pytest.mark.parametrize(
    ("table_name", "expected_status_values"),
    [
        ("hr.employees", {"ACTIVE", "ON_LEAVE", "INACTIVE", "TERMINATED"}),
        ("hr.leave_requests", {"PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "CANCELLED"}),
        (
            "hr.recruitment_applications",
            {"NEW", "PRESELECTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"},
        ),
        (
            "hr.workflow_instances",
            {"PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "CANCELLED", "ESCALATED"},
        ),
    ],
)
def test_status_check_constraints_align(table_name: str, expected_status_values: set[str]) -> None:
    """Les check-constraints status sont présents (pas vérifiés par mypy
    sans Postgres, mais on valide qu'ils sont définis dans __table_args__)."""
    table = Base.metadata.tables[table_name]
    found_values: set[str] = set()
    for ck in table.constraints:
        sqltext = str(getattr(ck, "sqltext", "")) or ""
        for value in expected_status_values:
            if f"'{value}'" in sqltext:
                found_values.add(value)
    assert found_values == expected_status_values, (
        f"Valeurs de status manquantes pour {table_name} : {expected_status_values - found_values}"
    )
