-- RH-ADMIN PostgreSQL schema v1
-- Date: 2026-04-03
-- Scope: Primature RH core domains (personnel, documents, movements, workflows, audit)

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

create schema if not exists hr;
set search_path = hr, public;

-- =====================================================================================
-- Helpers
-- =====================================================================================

create or replace function hr.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================================
-- Organization tree
-- =====================================================================================

create table if not exists hr.organizations (
  organization_id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr.directions (
  direction_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  name text not null,
  manager_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.units (
  unit_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  direction_id uuid not null references hr.directions(direction_id) on delete restrict,
  parent_unit_id uuid references hr.units(unit_id) on delete restrict,
  code text not null,
  name text not null,
  manager_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.positions (
  position_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  direction_id uuid references hr.directions(direction_id) on delete restrict,
  unit_id uuid references hr.units(unit_id) on delete restrict,
  code text not null,
  title text not null,
  grade text,
  position_status text not null default 'OPEN'
    check (position_status in ('OPEN', 'FILLED', 'FROZEN', 'CLOSED')),
  budgeted_headcount integer not null default 1 check (budgeted_headcount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

-- =====================================================================================
-- Security / IAM
-- =====================================================================================

create table if not exists hr.permissions (
  permission_id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  module_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists hr.roles (
  role_id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr.role_permissions (
  role_id uuid not null references hr.roles(role_id) on delete cascade,
  permission_id uuid not null references hr.permissions(permission_id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists hr.users (
  user_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  username citext not null unique,
  email citext,
  password_hash text not null,
  full_name text not null,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'SUSPENDED', 'DISABLED')),
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists hr.user_roles (
  user_id uuid not null references hr.users(user_id) on delete cascade,
  role_id uuid not null references hr.roles(role_id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by_user_id uuid references hr.users(user_id) on delete set null,
  primary key (user_id, role_id)
);

create table if not exists hr.user_scopes (
  user_scope_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references hr.users(user_id) on delete cascade,
  scope_type text not null
    check (scope_type in ('SELF', 'TEAM', 'UNIT', 'DIRECTION', 'GLOBAL')),
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  team_key text,
  created_at timestamptz not null default now(),
  check (
    (scope_type = 'GLOBAL')
    or (scope_type = 'DIRECTION' and direction_id is not null)
    or (scope_type = 'UNIT' and unit_id is not null)
    or (scope_type = 'TEAM' and team_key is not null)
    or (scope_type = 'SELF')
  )
);

-- =====================================================================================
-- Files / storage objects
-- =====================================================================================

create table if not exists hr.file_objects (
  file_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  storage_provider text not null default 's3',
  bucket_name text not null,
  object_key text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  sha256 text,
  original_filename text,
  uploaded_by_user_id uuid references hr.users(user_id) on delete set null,
  uploaded_at timestamptz not null default now(),
  unique (bucket_name, object_key)
);

-- =====================================================================================
-- Personnel
-- =====================================================================================

create table if not exists hr.employees (
  employee_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  matricule text not null,
  first_name text,
  last_name text,
  full_name text not null,
  national_id text,
  email citext,
  phone text,
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  position_id uuid references hr.positions(position_id) on delete set null,
  manager_employee_id uuid references hr.employees(employee_id) on delete set null,
  employment_status text not null default 'ACTIVE'
    check (employment_status in ('ACTIVE', 'ON_LEAVE', 'INACTIVE', 'TERMINATED')),
  contract_type text,
  hire_date date,
  exit_date date,
  photo_file_id uuid references hr.file_objects(file_id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, matricule)
);

create table if not exists hr.employee_assignments (
  assignment_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  position_id uuid references hr.positions(position_id) on delete set null,
  assignment_status text not null default 'PLANNED'
    check (assignment_status in ('PLANNED', 'ACTIVE', 'ENDED', 'CANCELLED')),
  effective_start date not null,
  effective_end date,
  created_by_user_id uuid references hr.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_end is null or effective_end >= effective_start)
);

create table if not exists hr.employee_movements (
  movement_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  movement_type text not null
    check (movement_type in ('TRANSFER', 'PROMOTION', 'SECONDMENT', 'RECLASSIFICATION', 'EXIT')),
  movement_status text not null default 'DRAFT'
    check (movement_status in ('DRAFT', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED')),
  from_direction_id uuid references hr.directions(direction_id) on delete set null,
  from_unit_id uuid references hr.units(unit_id) on delete set null,
  from_position_id uuid references hr.positions(position_id) on delete set null,
  to_direction_id uuid references hr.directions(direction_id) on delete set null,
  to_unit_id uuid references hr.units(unit_id) on delete set null,
  to_position_id uuid references hr.positions(position_id) on delete set null,
  effective_date date not null,
  reason text,
  approved_by_user_id uuid references hr.users(user_id) on delete set null,
  approved_at timestamptz,
  created_by_user_id uuid references hr.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================================
-- Leave management
-- =====================================================================================

create table if not exists hr.leave_types (
  leave_type_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  label text not null,
  is_paid boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.leave_balances (
  leave_balance_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  leave_type_id uuid not null references hr.leave_types(leave_type_id) on delete restrict,
  fiscal_year integer not null check (fiscal_year >= 2000),
  allocated_days numeric(6,2) not null default 0 check (allocated_days >= 0),
  consumed_days numeric(6,2) not null default 0 check (consumed_days >= 0),
  remaining_days numeric(6,2) generated always as (allocated_days - consumed_days) stored,
  updated_at timestamptz not null default now(),
  unique (employee_id, leave_type_id, fiscal_year)
);

create table if not exists hr.leave_requests (
  leave_request_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  reference text not null,
  employee_id uuid not null references hr.employees(employee_id) on delete restrict,
  leave_type_id uuid not null references hr.leave_types(leave_type_id) on delete restrict,
  workflow_instance_id uuid,
  request_status text not null default 'PENDING'
    check (request_status in ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED')),
  start_date date not null,
  end_date date not null,
  reason text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by_user_id uuid references hr.users(user_id) on delete set null,
  decision_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference),
  check (end_date >= start_date)
);

-- =====================================================================================
-- Recruitment
-- =====================================================================================

create table if not exists hr.recruitment_campaigns (
  campaign_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  title text not null,
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  need_position text,
  openings integer not null default 1 check (openings > 0),
  need_quota integer check (need_quota is null or need_quota > 0),
  status text not null default 'ACTIVE'
    check (status in ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED')),
  start_date date,
  end_date date,
  owner_user_id uuid references hr.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.recruitment_applications (
  application_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  campaign_id uuid references hr.recruitment_campaigns(campaign_id) on delete set null,
  reference text not null,
  candidate_full_name text not null,
  candidate_email citext,
  candidate_phone text,
  identity_number text,
  desired_position text,
  source_channel text,
  application_status text not null default 'NEW'
    check (application_status in ('NEW', 'PRESELECTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED')),
  received_on date,
  experience_years integer check (experience_years is null or experience_years >= 0),
  skills_match_score numeric(5,2),
  education_score numeric(5,2),
  interview_avg_score numeric(5,2),
  test_score numeric(5,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.recruitment_status_events (
  status_event_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references hr.recruitment_applications(application_id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_at timestamptz not null default now(),
  changed_by_user_id uuid references hr.users(user_id) on delete set null,
  note text
);

create table if not exists hr.recruitment_comments (
  comment_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references hr.recruitment_applications(application_id) on delete cascade,
  author_user_id uuid references hr.users(user_id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists hr.recruitment_attachments (
  attachment_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references hr.recruitment_applications(application_id) on delete cascade,
  file_id uuid not null references hr.file_objects(file_id) on delete restrict,
  uploaded_at timestamptz not null default now(),
  unique (application_id, file_id)
);

-- =====================================================================================
-- Documents / GED
-- =====================================================================================

create table if not exists hr.documents (
  document_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid references hr.employees(employee_id) on delete set null,
  reference text not null,
  title text not null,
  document_type text not null,
  owner_label text,
  document_status text not null default 'DRAFT'
    check (document_status in ('DRAFT', 'IN_VALIDATION', 'VALIDATED', 'PUBLISHED', 'ARCHIVED')),
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  issued_on date,
  start_date date,
  end_date date,
  approver_user_id uuid references hr.users(user_id) on delete set null,
  mission_destination text,
  mission_purpose text,
  absence_reason text,
  notes text,
  current_version_no integer not null default 1 check (current_version_no > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.document_versions (
  document_version_id uuid primary key default gen_random_uuid(),
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  version_no integer not null check (version_no > 0),
  file_id uuid not null references hr.file_objects(file_id) on delete restrict,
  signed_at timestamptz,
  signed_by_user_id uuid references hr.users(user_id) on delete set null,
  stamp_label text,
  signature_hash text,
  verification_code text,
  created_at timestamptz not null default now(),
  unique (document_id, version_no),
  unique (verification_code)
);

create table if not exists hr.document_dispatches (
  document_dispatch_id uuid primary key default gen_random_uuid(),
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  recipient_user_id uuid references hr.users(user_id) on delete set null,
  recipient_employee_id uuid references hr.employees(employee_id) on delete set null,
  assigned_by_user_id uuid references hr.users(user_id) on delete set null,
  delivery_status text not null default 'ASSIGNED'
    check (delivery_status in ('ASSIGNED', 'READ', 'ACKNOWLEDGED', 'REMINDED', 'CANCELLED')),
  assigned_at timestamptz not null default now(),
  due_at timestamptz,
  reminder_at timestamptz,
  reminder_sent_at timestamptz,
  read_at timestamptz,
  acknowledged_at timestamptz,
  note text
);

-- =====================================================================================
-- Workflows
-- =====================================================================================

create table if not exists hr.workflow_definitions (
  workflow_definition_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  name text not null,
  module_name text not null,
  status text not null default 'ACTIVE'
    check (status in ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
  sla_target_hours integer check (sla_target_hours is null or sla_target_hours > 0),
  auto_escalation boolean not null default false,
  version_no integer not null default 1 check (version_no > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code, version_no)
);

create table if not exists hr.workflow_steps (
  workflow_step_id uuid primary key default gen_random_uuid(),
  workflow_definition_id uuid not null references hr.workflow_definitions(workflow_definition_id) on delete cascade,
  step_order integer not null check (step_order > 0),
  code text not null,
  label text not null,
  approver_role_code text,
  sla_hours integer check (sla_hours is null or sla_hours > 0),
  unique (workflow_definition_id, step_order),
  unique (workflow_definition_id, code)
);

create table if not exists hr.workflow_instances (
  workflow_instance_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  reference text not null,
  workflow_definition_id uuid not null references hr.workflow_definitions(workflow_definition_id) on delete restrict,
  requester_employee_id uuid references hr.employees(employee_id) on delete set null,
  requester_user_id uuid references hr.users(user_id) on delete set null,
  owner_user_id uuid references hr.users(user_id) on delete set null,
  current_step_order integer,
  instance_status text not null default 'PENDING'
    check (instance_status in ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'ESCALATED')),
  priority text not null default 'NORMAL'
    check (priority in ('LOW', 'NORMAL', 'HIGH', 'CRITICAL')),
  due_on timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  steps_total integer not null default 0 check (steps_total >= 0),
  steps_completed integer not null default 0 check (steps_completed >= 0),
  escalation_level integer not null default 0 check (escalation_level >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reference)
);

create table if not exists hr.workflow_instance_events (
  workflow_instance_event_id uuid primary key default gen_random_uuid(),
  workflow_instance_id uuid not null references hr.workflow_instances(workflow_instance_id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references hr.users(user_id) on delete set null,
  actor_label text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'fk_leave_requests_workflow_instance'
      and c.conrelid = 'hr.leave_requests'::regclass
  ) then
    alter table hr.leave_requests
      add constraint fk_leave_requests_workflow_instance
      foreign key (workflow_instance_id)
      references hr.workflow_instances(workflow_instance_id)
      on delete set null;
  end if;
end
$$;

-- =====================================================================================
-- Audit + notifications
-- =====================================================================================

create table if not exists hr.audit_logs (
  audit_log_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  user_id uuid references hr.users(user_id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  status text not null default 'SUCCESS'
    check (status in ('SUCCESS', 'FAILURE')),
  source_ip inet,
  user_agent text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists hr.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  recipient_user_id uuid references hr.users(user_id) on delete set null,
  category text not null,
  title text not null,
  message text not null,
  reference_type text,
  reference_id text,
  delivery_status text not null default 'PENDING'
    check (delivery_status in ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================================
-- Indexes
-- =====================================================================================

create index if not exists idx_directions_org on hr.directions (organization_id);
create index if not exists idx_units_org_direction on hr.units (organization_id, direction_id);
create index if not exists idx_positions_org_status on hr.positions (organization_id, position_status);

create index if not exists idx_users_org_status on hr.users (organization_id, status);
create index if not exists idx_users_direction_unit on hr.users (direction_id, unit_id);

create index if not exists idx_employees_org_status on hr.employees (organization_id, employment_status);
create index if not exists idx_employees_direction_unit on hr.employees (direction_id, unit_id);
create index if not exists idx_employees_manager on hr.employees (manager_employee_id);
create index if not exists idx_employee_assignments_employee_dates
  on hr.employee_assignments (employee_id, effective_start desc);
create index if not exists idx_employee_movements_employee_effective
  on hr.employee_movements (employee_id, effective_date desc);

create index if not exists idx_leave_requests_employee_dates
  on hr.leave_requests (employee_id, start_date desc);
create index if not exists idx_leave_requests_status_dates
  on hr.leave_requests (request_status, start_date desc);

create index if not exists idx_recruitment_campaigns_status_dates
  on hr.recruitment_campaigns (status, start_date, end_date);
create index if not exists idx_recruitment_applications_campaign_status
  on hr.recruitment_applications (campaign_id, application_status);
create index if not exists idx_recruitment_applications_received
  on hr.recruitment_applications (received_on desc);
create index if not exists idx_recruitment_status_events_app_changed
  on hr.recruitment_status_events (application_id, changed_at desc);

create index if not exists idx_documents_status_updated
  on hr.documents (document_status, updated_at desc);
create index if not exists idx_documents_employee
  on hr.documents (employee_id);
create index if not exists idx_document_versions_document_version
  on hr.document_versions (document_id, version_no desc);
create index if not exists idx_document_dispatches_recipient_status
  on hr.document_dispatches (recipient_user_id, delivery_status, assigned_at desc);

create index if not exists idx_workflow_instances_status_due
  on hr.workflow_instances (instance_status, due_on);
create index if not exists idx_workflow_instances_owner_status
  on hr.workflow_instances (owner_user_id, instance_status);
create index if not exists idx_workflow_events_instance_time
  on hr.workflow_instance_events (workflow_instance_id, occurred_at desc);

create index if not exists idx_audit_logs_user_time
  on hr.audit_logs (user_id, occurred_at desc);
create index if not exists idx_audit_logs_action_time
  on hr.audit_logs (action, occurred_at desc);
create index if not exists idx_audit_logs_target
  on hr.audit_logs (target_type, target_id);

create index if not exists idx_notifications_recipient_status_sched
  on hr.notifications (recipient_user_id, delivery_status, scheduled_at);

-- =====================================================================================
-- Triggers updated_at
-- =====================================================================================

drop trigger if exists trg_organizations_updated_at on hr.organizations;
create trigger trg_organizations_updated_at
before update on hr.organizations
for each row execute function hr.set_updated_at();

drop trigger if exists trg_directions_updated_at on hr.directions;
create trigger trg_directions_updated_at
before update on hr.directions
for each row execute function hr.set_updated_at();

drop trigger if exists trg_units_updated_at on hr.units;
create trigger trg_units_updated_at
before update on hr.units
for each row execute function hr.set_updated_at();

drop trigger if exists trg_positions_updated_at on hr.positions;
create trigger trg_positions_updated_at
before update on hr.positions
for each row execute function hr.set_updated_at();

drop trigger if exists trg_roles_updated_at on hr.roles;
create trigger trg_roles_updated_at
before update on hr.roles
for each row execute function hr.set_updated_at();

drop trigger if exists trg_users_updated_at on hr.users;
create trigger trg_users_updated_at
before update on hr.users
for each row execute function hr.set_updated_at();

drop trigger if exists trg_employees_updated_at on hr.employees;
create trigger trg_employees_updated_at
before update on hr.employees
for each row execute function hr.set_updated_at();

drop trigger if exists trg_employee_movements_updated_at on hr.employee_movements;
create trigger trg_employee_movements_updated_at
before update on hr.employee_movements
for each row execute function hr.set_updated_at();

drop trigger if exists trg_leave_requests_updated_at on hr.leave_requests;
create trigger trg_leave_requests_updated_at
before update on hr.leave_requests
for each row execute function hr.set_updated_at();

drop trigger if exists trg_recruitment_campaigns_updated_at on hr.recruitment_campaigns;
create trigger trg_recruitment_campaigns_updated_at
before update on hr.recruitment_campaigns
for each row execute function hr.set_updated_at();

drop trigger if exists trg_recruitment_applications_updated_at on hr.recruitment_applications;
create trigger trg_recruitment_applications_updated_at
before update on hr.recruitment_applications
for each row execute function hr.set_updated_at();

drop trigger if exists trg_documents_updated_at on hr.documents;
create trigger trg_documents_updated_at
before update on hr.documents
for each row execute function hr.set_updated_at();

drop trigger if exists trg_workflow_definitions_updated_at on hr.workflow_definitions;
create trigger trg_workflow_definitions_updated_at
before update on hr.workflow_definitions
for each row execute function hr.set_updated_at();

drop trigger if exists trg_workflow_instances_updated_at on hr.workflow_instances;
create trigger trg_workflow_instances_updated_at
before update on hr.workflow_instances
for each row execute function hr.set_updated_at();

commit;
