"""Tables manquantes par rapport à la roadmap : training, perf 360°, discipline,
GPEC, signatures, règles métier congés, file extraction OCR.

Aucune de ces tables n'existait dans le mock-backend Node.js (tout était en
mémoire). La migration crée 16 nouvelles tables dans le schéma `hr` :

- training_catalog, training_sessions, training_session_participants,
  training_requests, training_evaluations, training_certificates
- performance_campaigns, performance_evaluations,
  performance_360_invitations, performance_360_responses
- discipline_cases, discipline_events
- competency_referential, position_competency_requirements,
  competency_gaps_snapshots
- signature_providers, signature_envelopes, signature_audit_trail
- leave_service_coverage_rules, leave_auto_approval_rules
- document_extraction_queue

Idempotente : `create table if not exists` partout.

Revision ID: 0002
Revises: 0001
Create Date: 2026-05-07
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
from app.core.sql_utils import split_statements

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


SQL_UP = r"""
set search_path = hr, public;

-- ============================================================================
-- Formation
-- ============================================================================
create table if not exists hr.training_catalog (
  training_catalog_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  title text not null,
  category text,
  description text,
  duration_hours integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.training_sessions (
  training_session_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  training_catalog_id uuid references hr.training_catalog(training_catalog_id) on delete set null,
  reference text not null,
  title text not null,
  instructor text,
  location text,
  session_status text not null default 'PLANNED'
    check (session_status in ('PLANNED','IN_PROGRESS','COMPLETED','CANCELLED')),
  start_date date,
  end_date date,
  capacity integer,
  cold_eval_scheduled_for date,
  cold_eval_launched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists hr.training_session_participants (
  training_session_participant_id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references hr.training_sessions(training_session_id) on delete cascade,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  attendance_status text not null default 'REGISTERED'
    check (attendance_status in ('REGISTERED','ATTENDED','PARTIAL','NO_SHOW','CANCELLED')),
  final_score numeric(5,2),
  instructor_validated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (training_session_id, employee_id)
);

create table if not exists hr.training_requests (
  training_request_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  reference text not null,
  requested_by_employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  training_catalog_id uuid references hr.training_catalog(training_catalog_id) on delete set null,
  requested_title text,
  motivation text,
  request_status text not null default 'PENDING'
    check (request_status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  decided_by_user_id uuid references hr.users(user_id) on delete set null,
  decided_at timestamptz,
  decision_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.training_evaluations (
  training_evaluation_id uuid primary key default gen_random_uuid(),
  training_session_id uuid not null references hr.training_sessions(training_session_id) on delete cascade,
  employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  evaluation_kind text not null check (evaluation_kind in ('HOT','COLD')),
  invitation_token text unique,
  invited_at timestamptz,
  completed_at timestamptz,
  score_overall numeric(5,2)
    check (score_overall is null or score_overall between 0 and 100),
  answers jsonb not null default '{}'::jsonb,
  comments text,
  unique (training_session_id, employee_id, evaluation_kind)
);

create table if not exists hr.training_certificates (
  training_certificate_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  training_session_id uuid not null references hr.training_sessions(training_session_id) on delete cascade,
  employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  file_id uuid references hr.file_objects(file_id) on delete set null,
  document_id uuid references hr.documents(document_id) on delete set null,
  issued_at timestamptz not null default now(),
  verification_code text not null unique,
  signature_hash text,
  template_version text,
  unique (training_session_id, employee_id)
);

-- ============================================================================
-- Performance + évaluation 360°
-- ============================================================================
create table if not exists hr.performance_campaigns (
  performance_campaign_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  title text not null,
  campaign_kind text not null default 'CLASSIC'
    check (campaign_kind in ('CLASSIC','SURVEY_360')),
  campaign_status text not null default 'DRAFT'
    check (campaign_status in ('DRAFT','OPEN','CLOSED','CANCELLED')),
  period_start date,
  period_end date,
  direction_id uuid references hr.directions(direction_id) on delete set null,
  min_respondents_per_category integer not null default 3,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.performance_evaluations (
  performance_evaluation_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  performance_campaign_id uuid not null references hr.performance_campaigns(performance_campaign_id) on delete cascade,
  employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  self_score numeric(5,2),
  manager_score numeric(5,2),
  final_score numeric(5,2),
  evaluation_status text not null default 'DRAFT'
    check (evaluation_status in ('DRAFT','SUBMITTED','VALIDATED')),
  submitted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (performance_campaign_id, employee_id)
);

create table if not exists hr.performance_360_invitations (
  performance_360_invitation_id uuid primary key default gen_random_uuid(),
  performance_campaign_id uuid not null references hr.performance_campaigns(performance_campaign_id) on delete cascade,
  target_employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  evaluator_employee_id uuid references hr.employees(employee_id) on delete set null,
  evaluator_category text not null
    check (evaluator_category in ('SELF','MANAGER','PEER','SUBORDINATE')),
  invitation_token text not null unique,
  invitation_status text not null default 'SENT'
    check (invitation_status in ('SENT','RESPONDED','EXPIRED','REVOKED')),
  sent_at timestamptz not null default now(),
  responded_at timestamptz,
  expires_at timestamptz
);

-- ANONYMAT — pas de FK vers users / employees pour le répondant.
-- L'identification du répondant n'est possible qu'en croisant l'invitation
-- (qui doit être supprimée à la clôture de campagne).
create table if not exists hr.performance_360_responses (
  performance_360_response_id uuid primary key default gen_random_uuid(),
  performance_campaign_id uuid not null references hr.performance_campaigns(performance_campaign_id) on delete cascade,
  target_employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  evaluator_category text not null
    check (evaluator_category in ('SELF','MANAGER','PEER','SUBORDINATE')),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

-- ============================================================================
-- Discipline
-- ============================================================================
create table if not exists hr.discipline_cases (
  discipline_case_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  reference text not null,
  employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  case_status text not null default 'OPEN'
    check (case_status in ('OPEN','UNDER_INVESTIGATION','SANCTION_PROPOSED',
                           'SANCTION_APPLIED','CLOSED','DISMISSED')),
  severity text not null default 'Modere'
    check (severity in ('Faible','Modere','Eleve','Critique')),
  title text not null,
  summary text,
  incident_date date,
  proposed_sanction text,
  applied_sanction text,
  opened_by_user_id uuid references hr.users(user_id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.discipline_events (
  discipline_event_id uuid primary key default gen_random_uuid(),
  discipline_case_id uuid not null references hr.discipline_cases(discipline_case_id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references hr.users(user_id) on delete set null,
  note text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- ============================================================================
-- GPEC
-- ============================================================================
create table if not exists hr.competency_referential (
  competency_referential_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  label text not null,
  category text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.position_competency_requirements (
  position_competency_requirement_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  position_id uuid not null references hr.positions(position_id) on delete cascade,
  competency_referential_id uuid not null references hr.competency_referential(competency_referential_id),
  expected_level text not null
    check (expected_level in ('Debutant','Intermediaire','Avance','Expert')),
  is_critical boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (position_id, competency_referential_id)
);

create table if not exists hr.competency_gaps_snapshots (
  competency_gaps_snapshot_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  scope_type text not null
    check (scope_type in ('GLOBAL','DIRECTION','UNIT','POSITION')),
  scope_id uuid,
  employees_assessed integer not null default 0,
  critical_gaps_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by_user_id uuid references hr.users(user_id) on delete set null
);

-- ============================================================================
-- Signature électronique
-- ============================================================================
create table if not exists hr.signature_providers (
  signature_provider_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  label text not null,
  provider_kind text not null
    check (provider_kind in ('MOCK','UNIVERSIGN','YOUSIGN','DOCUSIGN','ENDESIVE_LOCAL')),
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.signature_envelopes (
  signature_envelope_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  signature_provider_id uuid not null references hr.signature_providers(signature_provider_id),
  document_id uuid references hr.documents(document_id) on delete set null,
  reference text not null,
  external_envelope_id text,
  envelope_status text not null default 'DRAFT'
    check (envelope_status in ('DRAFT','SENT','SIGNED','REJECTED','EXPIRED','CANCELLED')),
  signature_hash text,
  verification_code text not null unique,
  sent_at timestamptz,
  signed_at timestamptz,
  expires_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.signature_audit_trail (
  signature_audit_trail_id uuid primary key default gen_random_uuid(),
  signature_envelope_id uuid not null references hr.signature_envelopes(signature_envelope_id) on delete cascade,
  event_type text not null,
  actor_label text,
  actor_user_id uuid references hr.users(user_id) on delete set null,
  source_ip text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

-- ============================================================================
-- Règles métier congés
-- ============================================================================
create table if not exists hr.leave_service_coverage_rules (
  leave_service_coverage_rule_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  scope_type text not null check (scope_type in ('DIRECTION','UNIT')),
  scope_id uuid not null,
  min_presence_ratio numeric(4,3)
    check (min_presence_ratio is null
           or (min_presence_ratio >= 0 and min_presence_ratio <= 1)),
  min_headcount integer,
  is_active boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, scope_type, scope_id)
);

create table if not exists hr.leave_auto_approval_rules (
  leave_auto_approval_rule_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  leave_type_id uuid not null references hr.leave_types(leave_type_id),
  is_active boolean not null default true,
  max_duration_days integer not null default 2 check (max_duration_days >= 0),
  require_quota_ok boolean not null default true,
  require_service_coverage boolean not null default true,
  blackout_periods jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, leave_type_id)
);

-- ============================================================================
-- File OCR
-- ============================================================================
create table if not exists hr.document_extraction_queue (
  document_extraction_queue_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  document_version_id uuid references hr.document_versions(document_version_id) on delete set null,
  provider_hint text,
  queue_status text not null default 'PENDING'
    check (queue_status in ('PENDING','RUNNING','COMPLETED','FAILED','REVIEW_REQUIRED')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  enqueued_at timestamptz not null default now()
);

-- ============================================================================
-- Indexes utiles pour les requêtes fréquentes
-- ============================================================================
create index if not exists idx_training_sessions_org_status_dates
  on hr.training_sessions (organization_id, session_status, start_date desc);
create index if not exists idx_training_evaluations_session_kind
  on hr.training_evaluations (training_session_id, evaluation_kind);
create index if not exists idx_perf_eval_campaign_emp
  on hr.performance_evaluations (performance_campaign_id, employee_id);
create index if not exists idx_perf_360_resp_campaign_target_cat
  on hr.performance_360_responses (performance_campaign_id, target_employee_id, evaluator_category);
create index if not exists idx_discipline_cases_emp_status
  on hr.discipline_cases (employee_id, case_status);
create index if not exists idx_competency_gaps_org_scope_generated
  on hr.competency_gaps_snapshots (organization_id, scope_type, generated_at desc);
create index if not exists idx_signature_envelopes_doc_status
  on hr.signature_envelopes (document_id, envelope_status);
create index if not exists idx_doc_extraction_queue_status_enqueued
  on hr.document_extraction_queue (queue_status, enqueued_at);

-- ============================================================================
-- Triggers updated_at sur les nouvelles tables (réutilise hr.set_updated_at())
-- ============================================================================
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'training_catalog','training_sessions','training_session_participants',
    'training_requests',
    'performance_campaigns','performance_evaluations',
    'discipline_cases',
    'competency_referential','position_competency_requirements',
    'signature_providers','signature_envelopes',
    'leave_service_coverage_rules','leave_auto_approval_rules'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on hr.%1$s; '
      'create trigger trg_%1$s_updated_at before update on hr.%1$s '
      'for each row execute function hr.set_updated_at();',
      tbl
    );
  end loop;
end $$;
"""

SQL_DOWN = r"""
drop trigger if exists trg_leave_auto_approval_rules_updated_at on hr.leave_auto_approval_rules;
drop trigger if exists trg_leave_service_coverage_rules_updated_at on hr.leave_service_coverage_rules;
drop trigger if exists trg_signature_envelopes_updated_at on hr.signature_envelopes;
drop trigger if exists trg_signature_providers_updated_at on hr.signature_providers;
drop trigger if exists trg_position_competency_requirements_updated_at on hr.position_competency_requirements;
drop trigger if exists trg_competency_referential_updated_at on hr.competency_referential;
drop trigger if exists trg_discipline_cases_updated_at on hr.discipline_cases;
drop trigger if exists trg_performance_evaluations_updated_at on hr.performance_evaluations;
drop trigger if exists trg_performance_campaigns_updated_at on hr.performance_campaigns;
drop trigger if exists trg_training_requests_updated_at on hr.training_requests;
drop trigger if exists trg_training_session_participants_updated_at on hr.training_session_participants;
drop trigger if exists trg_training_sessions_updated_at on hr.training_sessions;
drop trigger if exists trg_training_catalog_updated_at on hr.training_catalog;

drop table if exists hr.document_extraction_queue;
drop table if exists hr.leave_auto_approval_rules;
drop table if exists hr.leave_service_coverage_rules;
drop table if exists hr.signature_audit_trail;
drop table if exists hr.signature_envelopes;
drop table if exists hr.signature_providers;
drop table if exists hr.competency_gaps_snapshots;
drop table if exists hr.position_competency_requirements;
drop table if exists hr.competency_referential;
drop table if exists hr.discipline_events;
drop table if exists hr.discipline_cases;
drop table if exists hr.performance_360_responses;
drop table if exists hr.performance_360_invitations;
drop table if exists hr.performance_evaluations;
drop table if exists hr.performance_campaigns;
drop table if exists hr.training_certificates;
drop table if exists hr.training_evaluations;
drop table if exists hr.training_requests;
drop table if exists hr.training_session_participants;
drop table if exists hr.training_sessions;
drop table if exists hr.training_catalog;
"""


def upgrade() -> None:
    for statement in split_statements(SQL_UP):
        op.execute(statement)


def downgrade() -> None:
    for statement in split_statements(SQL_DOWN):
        op.execute(statement)
