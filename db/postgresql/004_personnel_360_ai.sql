-- RH-ADMIN PostgreSQL schema v4
-- Date: 2026-04-28
-- Scope: personnel 360, digital badges, signed exports and turnover risk snapshots

begin;

set search_path = hr, public;

-- =====================================================================================
-- Personnel 360
-- =====================================================================================

create table if not exists hr.employee_competencies (
  employee_competency_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  label text not null,
  category text not null default 'Metier',
  competency_level text not null default 'Debutant'
    check (competency_level in ('Debutant', 'Intermediaire', 'Avance', 'Expert')),
  last_assessed_at date,
  source text not null default 'MANUAL'
    check (source in ('MANUAL', 'OCR', 'IMPORT', 'SYSTEM')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, employee_id, label)
);

create table if not exists hr.employee_dependents (
  employee_dependent_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  full_name text not null,
  relationship text,
  birth_date date,
  coverage_type text not null default 'Protection sociale',
  coverage_status text not null default 'Actif'
    check (coverage_status in ('Actif', 'Suspendu', 'Expire')),
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================================================
-- Badges and signed dossier exports
-- =====================================================================================

create table if not exists hr.employee_digital_badges (
  employee_badge_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  badge_code text not null,
  verification_code text not null,
  signature_hash text not null,
  qr_payload jsonb not null default '{}'::jsonb,
  badge_status text not null default 'ACTIVE'
    check (badge_status in ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'REVOKED')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, badge_code)
);

create table if not exists hr.employee_dossier_exports (
  dossier_export_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  file_id uuid references hr.file_objects(file_id) on delete set null,
  export_format text not null default 'PDF'
    check (export_format in ('PDF')),
  signature_hash text not null,
  verification_code text not null,
  exported_by_user_id uuid references hr.users(user_id) on delete set null,
  exported_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

-- =====================================================================================
-- Predictive HR risk snapshots
-- =====================================================================================

create table if not exists hr.employee_turnover_risk_snapshots (
  turnover_risk_snapshot_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  employee_id uuid not null references hr.employees(employee_id) on delete cascade,
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null
    check (risk_level in ('Faible', 'Modere', 'Eleve', 'Critique')),
  factors jsonb not null default '[]'::jsonb,
  recommended_action text,
  model_name text not null default 'rules-v1',
  generated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid references hr.users(user_id) on delete set null,
  review_decision text
    check (review_decision is null or review_decision in ('CONFIRMED', 'DISMISSED', 'MONITOR')),
  metadata jsonb not null default '{}'::jsonb
);

-- =====================================================================================
-- Indexes and triggers
-- =====================================================================================

create index if not exists idx_employee_competencies_employee_level
  on hr.employee_competencies (employee_id, competency_level);

create index if not exists idx_employee_dependents_employee_status
  on hr.employee_dependents (employee_id, coverage_status);

create index if not exists idx_employee_digital_badges_employee_status
  on hr.employee_digital_badges (employee_id, badge_status, expires_at);

create index if not exists idx_employee_dossier_exports_employee_exported
  on hr.employee_dossier_exports (employee_id, exported_at desc);

create index if not exists idx_turnover_risk_org_level_generated
  on hr.employee_turnover_risk_snapshots (organization_id, risk_level, generated_at desc);

drop trigger if exists trg_employee_competencies_updated_at on hr.employee_competencies;
create trigger trg_employee_competencies_updated_at
before update on hr.employee_competencies
for each row execute function hr.set_updated_at();

drop trigger if exists trg_employee_dependents_updated_at on hr.employee_dependents;
create trigger trg_employee_dependents_updated_at
before update on hr.employee_dependents
for each row execute function hr.set_updated_at();

drop trigger if exists trg_employee_digital_badges_updated_at on hr.employee_digital_badges;
create trigger trg_employee_digital_badges_updated_at
before update on hr.employee_digital_badges
for each row execute function hr.set_updated_at();

commit;
