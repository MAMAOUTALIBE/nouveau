-- RH-ADMIN PostgreSQL schema v2
-- Date: 2026-04-20
-- Scope: Unified documents model (types, links, requirements, analysis, retention, compatibility views)

begin;

set search_path = hr, public;

-- =====================================================================================
-- Documents / GED v2
-- =====================================================================================

create table if not exists hr.document_types (
  document_type_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  code text not null,
  label text not null,
  module_scope text not null default 'GLOBAL'
    check (module_scope in ('GLOBAL', 'PERSONNEL', 'DOCUMENTS', 'LEAVE', 'DISCIPLINE', 'WORKFLOW', 'RECRUITMENT', 'ADMIN')),
  owner_entity_type text not null default 'GENERIC'
    check (
      owner_entity_type in (
        'GENERIC',
        'EMPLOYEE',
        'ASSIGNMENT',
        'MOVEMENT',
        'LEAVE_REQUEST',
        'DISCIPLINE_CASE',
        'WORKFLOW_INSTANCE',
        'RECRUITMENT_APPLICATION'
      )
    ),
  requires_expiry boolean not null default false,
  requires_signature boolean not null default false,
  requires_dispatch boolean not null default false,
  is_sensitive boolean not null default false,
  is_active boolean not null default true,
  default_validity_days integer check (default_validity_days is null or default_validity_days > 0),
  retention_days integer check (retention_days is null or retention_days > 0),
  allowed_mime_types jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists hr.document_links (
  document_link_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  entity_type text not null
    check (
      entity_type in (
        'EMPLOYEE',
        'ASSIGNMENT',
        'MOVEMENT',
        'LEAVE_REQUEST',
        'DISCIPLINE_CASE',
        'WORKFLOW_INSTANCE',
        'RECRUITMENT_APPLICATION',
        'DOCUMENT_REQUEST',
        'GENERIC'
      )
    ),
  entity_id text not null,
  link_role text not null default 'PRIMARY'
    check (link_role in ('PRIMARY', 'SECONDARY', 'SOURCE', 'OUTPUT', 'ATTACHMENT', 'EVIDENCE')),
  created_by_user_id uuid references hr.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, entity_type, entity_id, link_role)
);

create table if not exists hr.document_requirements (
  document_requirement_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  requirement_code text not null,
  document_type_id uuid not null references hr.document_types(document_type_id) on delete restrict,
  requirement_scope text not null
    check (
      requirement_scope in ('GLOBAL', 'CONTRACT_TYPE', 'DIRECTION', 'UNIT', 'POSITION', 'EMPLOYMENT_STATUS', 'WORKFLOW')
    ),
  contract_type text,
  direction_id uuid references hr.directions(direction_id) on delete set null,
  unit_id uuid references hr.units(unit_id) on delete set null,
  position_id uuid references hr.positions(position_id) on delete set null,
  employment_status text,
  workflow_definition_id uuid references hr.workflow_definitions(workflow_definition_id) on delete cascade,
  is_mandatory boolean not null default true,
  warning_offset_days integer not null default 30 check (warning_offset_days >= 0),
  due_offset_days integer check (due_offset_days is null or due_offset_days >= 0),
  valid_from date,
  valid_to date,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, requirement_code),
  check (
    (
      requirement_scope = 'GLOBAL'
      and contract_type is null
      and direction_id is null
      and unit_id is null
      and position_id is null
      and employment_status is null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'CONTRACT_TYPE'
      and contract_type is not null
      and direction_id is null
      and unit_id is null
      and position_id is null
      and employment_status is null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'DIRECTION'
      and contract_type is null
      and direction_id is not null
      and unit_id is null
      and position_id is null
      and employment_status is null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'UNIT'
      and contract_type is null
      and direction_id is null
      and unit_id is not null
      and position_id is null
      and employment_status is null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'POSITION'
      and contract_type is null
      and direction_id is null
      and unit_id is null
      and position_id is not null
      and employment_status is null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'EMPLOYMENT_STATUS'
      and contract_type is null
      and direction_id is null
      and unit_id is null
      and position_id is null
      and employment_status is not null
      and workflow_definition_id is null
    )
    or (
      requirement_scope = 'WORKFLOW'
      and contract_type is null
      and direction_id is null
      and unit_id is null
      and position_id is null
      and employment_status is null
      and workflow_definition_id is not null
    )
  ),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table if not exists hr.document_analysis_runs (
  document_analysis_run_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  document_version_id uuid references hr.document_versions(document_version_id) on delete set null,
  pipeline_stage text not null default 'FULL'
    check (pipeline_stage in ('OCR', 'CLASSIFICATION', 'EXTRACTION', 'COMPLIANCE', 'FULL')),
  analysis_status text not null default 'PENDING'
    check (analysis_status in ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED', 'SKIPPED')),
  provider_name text,
  model_name text,
  language_code text,
  classified_document_type text,
  confidence_score numeric(5,2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  ocr_text text,
  summary_text text,
  error_code text,
  error_message text,
  raw_payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by_user_id uuid references hr.users(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table if not exists hr.document_extracted_fields (
  document_extracted_field_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  document_analysis_run_id uuid not null references hr.document_analysis_runs(document_analysis_run_id) on delete cascade,
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  field_name text not null,
  field_label text,
  field_type text not null default 'TEXT'
    check (field_type in ('TEXT', 'DATE', 'NUMBER', 'BOOLEAN', 'JSON')),
  field_value_text text,
  field_value_date date,
  field_value_number numeric(18,4),
  field_value_boolean boolean,
  field_value_json jsonb,
  normalized_value text,
  confidence_score numeric(5,2) check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 100)),
  source_page integer check (source_page is null or source_page > 0),
  source_bbox jsonb,
  is_validated boolean not null default false,
  validated_by_user_id uuid references hr.users(user_id) on delete set null,
  validated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_analysis_run_id, field_name),
  check (validated_at is null or is_validated = true)
);

create table if not exists hr.document_retention_rules (
  document_retention_rule_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  rule_code text not null,
  document_type_id uuid references hr.document_types(document_type_id) on delete cascade,
  owner_entity_type text not null default 'GENERIC'
    check (
      owner_entity_type in (
        'GENERIC',
        'EMPLOYEE',
        'ASSIGNMENT',
        'MOVEMENT',
        'LEAVE_REQUEST',
        'DISCIPLINE_CASE',
        'WORKFLOW_INSTANCE',
        'RECRUITMENT_APPLICATION'
      )
    ),
  retention_trigger text not null
    check (
      retention_trigger in (
        'ISSUED_ON',
        'END_DATE',
        'UPDATED_AT',
        'ACKNOWLEDGED_AT',
        'EMPLOYEE_EXIT',
        'WORKFLOW_COMPLETED_AT'
      )
    ),
  archive_after_days integer check (archive_after_days is null or archive_after_days >= 0),
  purge_after_days integer check (purge_after_days is null or purge_after_days > 0),
  requires_acknowledgement boolean not null default false,
  legal_hold_supported boolean not null default true,
  applies_to_published_only boolean not null default true,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, rule_code),
  check (purge_after_days is null or archive_after_days is null or purge_after_days >= archive_after_days)
);

create table if not exists hr.document_retention_events (
  document_retention_event_id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references hr.organizations(organization_id) on delete restrict,
  document_id uuid not null references hr.documents(document_id) on delete cascade,
  document_retention_rule_id uuid references hr.document_retention_rules(document_retention_rule_id) on delete set null,
  event_type text not null
    check (
      event_type in (
        'RULE_APPLIED',
        'ARCHIVED',
        'RESTORED',
        'LEGAL_HOLD_ENABLED',
        'LEGAL_HOLD_RELEASED',
        'PURGE_REQUESTED',
        'PURGED'
      )
    ),
  event_status text not null default 'SUCCESS'
    check (event_status in ('PENDING', 'SUCCESS', 'FAILURE')),
  note text,
  metadata jsonb not null default '{}'::jsonb,
  performed_by_user_id uuid references hr.users(user_id) on delete set null,
  occurred_at timestamptz not null default now()
);

alter table hr.documents add column if not exists document_type_id uuid;
alter table hr.documents add column if not exists source_module text not null default 'DOCUMENTS';
alter table hr.documents add column if not exists source_record_id text;
alter table hr.documents add column if not exists confidentiality_level text not null default 'INTERNAL';
alter table hr.documents add column if not exists requires_acknowledgement boolean not null default false;
alter table hr.documents add column if not exists expires_on date;
alter table hr.documents add column if not exists archived_at timestamptz;
alter table hr.documents add column if not exists legal_hold boolean not null default false;
alter table hr.documents add column if not exists analysis_status text not null default 'NOT_REQUESTED';
alter table hr.documents add column if not exists last_analysis_at timestamptz;
alter table hr.documents add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'fk_documents_document_type'
      and c.conrelid = 'hr.documents'::regclass
  ) then
    alter table hr.documents
      add constraint fk_documents_document_type
      foreign key (document_type_id)
      references hr.document_types(document_type_id)
      on delete set null;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'chk_documents_source_module'
      and c.conrelid = 'hr.documents'::regclass
  ) then
    alter table hr.documents
      add constraint chk_documents_source_module
      check (source_module in ('PERSONNEL', 'DOCUMENTS', 'LEAVE', 'DISCIPLINE', 'WORKFLOW', 'RECRUITMENT', 'ADMIN', 'IMPORT'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'chk_documents_confidentiality_level'
      and c.conrelid = 'hr.documents'::regclass
  ) then
    alter table hr.documents
      add constraint chk_documents_confidentiality_level
      check (confidentiality_level in ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL'));
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conname = 'chk_documents_analysis_status'
      and c.conrelid = 'hr.documents'::regclass
  ) then
    alter table hr.documents
      add constraint chk_documents_analysis_status
      check (analysis_status in ('NOT_REQUESTED', 'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'REVIEW_REQUIRED'));
  end if;
end
$$;

-- =====================================================================================
-- Seeds and backfill
-- =====================================================================================

insert into hr.document_types (
  organization_id,
  code,
  label,
  module_scope,
  owner_entity_type,
  requires_expiry,
  requires_signature,
  requires_dispatch,
  is_sensitive,
  default_validity_days,
  retention_days,
  allowed_mime_types
)
select
  o.organization_id,
  seed.code,
  seed.label,
  seed.module_scope,
  seed.owner_entity_type,
  seed.requires_expiry,
  seed.requires_signature,
  seed.requires_dispatch,
  seed.is_sensitive,
  seed.default_validity_days,
  seed.retention_days,
  seed.allowed_mime_types
from hr.organizations o
cross join (
  values
    ('PIECE_IDENTITE', 'Piece d''identite (CNI/Passeport)', 'PERSONNEL', 'EMPLOYEE', true, false, false, true, 3650, 3650, '["application/pdf","image/jpeg","image/png"]'::jsonb),
    ('CV', 'CV', 'PERSONNEL', 'EMPLOYEE', false, false, false, false, null, 3650, '["application/pdf"]'::jsonb),
    ('DIPLOME_PRINCIPAL', 'Diplome principal', 'PERSONNEL', 'EMPLOYEE', false, false, false, true, null, 3650, '["application/pdf","image/jpeg","image/png"]'::jsonb),
    ('ARRETE_NOMINATION', 'Acte/Arrete de nomination', 'PERSONNEL', 'EMPLOYEE', false, true, false, true, null, 3650, '["application/pdf"]'::jsonb),
    ('CONTRAT_TRAVAIL', 'Contrat', 'PERSONNEL', 'EMPLOYEE', true, true, false, true, 1095, 3650, '["application/pdf"]'::jsonb),
    ('ORDRE_MISSION', 'Ordre de mission', 'DOCUMENTS', 'EMPLOYEE', false, true, true, false, null, 1825, '["application/pdf"]'::jsonb),
    ('CERTIFICAT_ABSENCE', 'Certificat d''absence', 'LEAVE', 'LEAVE_REQUEST', false, true, true, true, null, 1825, '["application/pdf"]'::jsonb),
    ('AUTORISATION_ABSENCE', 'Autorisation d''absence', 'LEAVE', 'LEAVE_REQUEST', false, true, true, true, null, 1825, '["application/pdf"]'::jsonb),
    ('ATTESTATION_TRAVAIL', 'Attestation de travail', 'DOCUMENTS', 'EMPLOYEE', false, true, true, false, null, 1825, '["application/pdf"]'::jsonb),
    ('ATTESTATION_SALAIRE', 'Attestation de salaire', 'DOCUMENTS', 'EMPLOYEE', false, true, true, true, null, 1825, '["application/pdf"]'::jsonb),
    ('DECISION_AFFECTATION', 'Decision d''affectation', 'PERSONNEL', 'ASSIGNMENT', false, true, true, false, null, 3650, '["application/pdf"]'::jsonb),
    ('NOTIFICATION_DISCIPLINAIRE', 'Notification disciplinaire', 'DISCIPLINE', 'DISCIPLINE_CASE', false, true, true, true, null, 3650, '["application/pdf"]'::jsonb),
    ('RAPPORT_MISSION', 'Rapport de mission', 'DOCUMENTS', 'EMPLOYEE', false, false, false, false, null, 1825, '["application/pdf"]'::jsonb)
) as seed (
  code,
  label,
  module_scope,
  owner_entity_type,
  requires_expiry,
  requires_signature,
  requires_dispatch,
  is_sensitive,
  default_validity_days,
  retention_days,
  allowed_mime_types
)
on conflict (organization_id, code) do nothing;

insert into hr.document_types (
  organization_id,
  code,
  label,
  module_scope,
  owner_entity_type,
  allowed_mime_types
)
select distinct
  d.organization_id,
  coalesce(
    nullif(
      btrim(upper(regexp_replace(coalesce(d.document_type, ''), '[^[:alnum:]]+', '_', 'g')), '_'),
      ''
    ),
    'GENERIC'
  ) as code,
  coalesce(nullif(trim(d.document_type), ''), 'Document generique') as label,
  'DOCUMENTS',
  case when d.employee_id is not null then 'EMPLOYEE' else 'GENERIC' end,
  '["application/pdf"]'::jsonb
from hr.documents d
where coalesce(trim(d.document_type), '') <> ''
on conflict (organization_id, code) do nothing;

update hr.documents d
set document_type_id = dt.document_type_id
from hr.document_types dt
where d.document_type_id is null
  and dt.organization_id = d.organization_id
  and (
    lower(dt.label) = lower(coalesce(nullif(trim(d.document_type), ''), ''))
    or dt.code = coalesce(
      nullif(
        btrim(upper(regexp_replace(coalesce(d.document_type, ''), '[^[:alnum:]]+', '_', 'g')), '_'),
        ''
      ),
      'GENERIC'
    )
  );

insert into hr.document_links (
  organization_id,
  document_id,
  entity_type,
  entity_id,
  link_role
)
select
  d.organization_id,
  d.document_id,
  'EMPLOYEE',
  d.employee_id::text,
  'PRIMARY'
from hr.documents d
where d.employee_id is not null
  and not exists (
    select 1
    from hr.document_links l
    where l.document_id = d.document_id
      and l.entity_type = 'EMPLOYEE'
      and l.entity_id = d.employee_id::text
      and l.link_role = 'PRIMARY'
  );

update hr.documents
set archived_at = coalesce(archived_at, updated_at)
where document_status = 'ARCHIVED'
  and archived_at is null;

insert into hr.document_requirements (
  organization_id,
  requirement_code,
  document_type_id,
  requirement_scope,
  is_mandatory,
  warning_offset_days,
  due_offset_days
)
select
  dt.organization_id,
  concat('REQ_', dt.code, '_GLOBAL'),
  dt.document_type_id,
  'GLOBAL',
  true,
  case when dt.code = 'PIECE_IDENTITE' then 45 else 30 end,
  7
from hr.document_types dt
where dt.code in ('PIECE_IDENTITE', 'CV', 'DIPLOME_PRINCIPAL')
on conflict (organization_id, requirement_code) do nothing;

insert into hr.document_requirements (
  organization_id,
  requirement_code,
  document_type_id,
  requirement_scope,
  contract_type,
  is_mandatory,
  warning_offset_days,
  due_offset_days
)
select
  dt.organization_id,
  concat('REQ_', dt.code, '_FONCTIONNAIRE'),
  dt.document_type_id,
  'CONTRACT_TYPE',
  'Fonctionnaire',
  true,
  30,
  7
from hr.document_types dt
where dt.code = 'ARRETE_NOMINATION'
on conflict (organization_id, requirement_code) do nothing;

insert into hr.document_requirements (
  organization_id,
  requirement_code,
  document_type_id,
  requirement_scope,
  contract_type,
  is_mandatory,
  warning_offset_days,
  due_offset_days
)
select
  dt.organization_id,
  concat('REQ_', dt.code, '_CONTRACTUEL'),
  dt.document_type_id,
  'CONTRACT_TYPE',
  'Contractuel',
  true,
  30,
  7
from hr.document_types dt
where dt.code = 'CONTRAT_TRAVAIL'
on conflict (organization_id, requirement_code) do nothing;

insert into hr.document_requirements (
  organization_id,
  requirement_code,
  document_type_id,
  requirement_scope,
  contract_type,
  is_mandatory,
  warning_offset_days,
  due_offset_days
)
select
  dt.organization_id,
  concat('REQ_', dt.code, '_STAGIAIRE'),
  dt.document_type_id,
  'CONTRACT_TYPE',
  'Stagiaire',
  true,
  30,
  7
from hr.document_types dt
where dt.code = 'CONTRAT_TRAVAIL'
on conflict (organization_id, requirement_code) do nothing;

insert into hr.document_retention_rules (
  organization_id,
  rule_code,
  document_type_id,
  owner_entity_type,
  retention_trigger,
  archive_after_days,
  purge_after_days,
  requires_acknowledgement,
  applies_to_published_only
)
select
  dt.organization_id,
  concat('RET_', dt.code),
  dt.document_type_id,
  dt.owner_entity_type,
  case
    when dt.owner_entity_type = 'EMPLOYEE' then 'EMPLOYEE_EXIT'
    else 'UPDATED_AT'
  end,
  365,
  coalesce(dt.retention_days, 3650),
  dt.requires_dispatch,
  true
from hr.document_types dt
on conflict (organization_id, rule_code) do nothing;

-- =====================================================================================
-- Compatibility views
-- =====================================================================================

create or replace view hr.vw_employee_documents as
select
  d.organization_id,
  coalesce(linked_employee.entity_id, d.employee_id::text) as employee_id,
  e.matricule,
  e.full_name as employee_name,
  d.document_id,
  d.reference,
  d.title,
  d.document_type_id,
  coalesce(dt.code, coalesce(
    nullif(
      btrim(upper(regexp_replace(coalesce(d.document_type, ''), '[^[:alnum:]]+', '_', 'g')), '_'),
      ''
    ),
    'GENERIC'
  )) as document_type_code,
  coalesce(dt.label, d.document_type) as document_type_label,
  d.document_status,
  d.confidentiality_level,
  d.requires_acknowledgement,
  d.source_module,
  d.source_record_id,
  d.issued_on,
  d.start_date,
  coalesce(d.expires_on, d.end_date) as expires_on,
  d.analysis_status,
  d.last_analysis_at,
  d.updated_at,
  current_version.document_version_id,
  current_version.version_no as current_version_no,
  current_version.signed_at,
  current_version.verification_code,
  current_version.signature_hash,
  file_object.file_id,
  file_object.original_filename,
  file_object.mime_type,
  file_object.byte_size
from hr.documents d
left join hr.document_types dt on dt.document_type_id = d.document_type_id
left join lateral (
  select l.entity_id
  from hr.document_links l
  where l.document_id = d.document_id
    and l.entity_type = 'EMPLOYEE'
  order by
    case when l.link_role = 'PRIMARY' then 0 else 1 end,
    l.created_at desc
  limit 1
) linked_employee on true
left join hr.employees e on e.employee_id::text = coalesce(linked_employee.entity_id, d.employee_id::text)
left join lateral (
  select
    dv.document_version_id,
    dv.version_no,
    dv.file_id,
    dv.signed_at,
    dv.verification_code,
    dv.signature_hash
  from hr.document_versions dv
  where dv.document_id = d.document_id
  order by dv.version_no desc
  limit 1
) current_version on true
left join hr.file_objects file_object on file_object.file_id = current_version.file_id
where coalesce(linked_employee.entity_id, d.employee_id::text) is not null;

create or replace view hr.vw_employee_document_compliance as
select
  e.organization_id,
  e.employee_id,
  e.matricule,
  e.full_name,
  e.contract_type,
  e.employment_status,
  r.document_requirement_id,
  r.requirement_code,
  r.requirement_scope,
  r.is_mandatory,
  r.warning_offset_days,
  r.due_offset_days,
  dt.document_type_id,
  dt.code as document_type_code,
  dt.label as document_type_label,
  matched_document.document_id,
  matched_document.reference as document_reference,
  matched_document.document_status,
  matched_document.expires_on,
  matched_document.updated_at as document_updated_at,
  case
    when matched_document.document_id is null then 'MISSING'
    when matched_document.expires_on is not null and matched_document.expires_on < current_date then 'EXPIRED'
    when matched_document.expires_on is not null
      and matched_document.expires_on <= current_date + coalesce(r.warning_offset_days, 30) then 'EXPIRING_SOON'
    when matched_document.document_status not in ('VALIDATED', 'PUBLISHED', 'ARCHIVED') then 'PENDING_VALIDATION'
    else 'COMPLIANT'
  end as compliance_status,
  case
    when matched_document.document_id is null
      and r.due_offset_days is not null
      and e.hire_date is not null then e.hire_date + r.due_offset_days
    when matched_document.expires_on is not null then matched_document.expires_on
    else null
  end as due_on
from hr.employees e
join hr.document_requirements r
  on r.organization_id = e.organization_id
 and r.is_active = true
 and (r.valid_from is null or r.valid_from <= current_date)
 and (r.valid_to is null or r.valid_to >= current_date)
 and (
   r.requirement_scope = 'GLOBAL'
   or (r.requirement_scope = 'CONTRACT_TYPE' and lower(coalesce(r.contract_type, '')) = lower(coalesce(e.contract_type, '')))
   or (r.requirement_scope = 'DIRECTION' and r.direction_id = e.direction_id)
   or (r.requirement_scope = 'UNIT' and r.unit_id = e.unit_id)
   or (r.requirement_scope = 'POSITION' and r.position_id = e.position_id)
   or (r.requirement_scope = 'EMPLOYMENT_STATUS' and upper(coalesce(r.employment_status, '')) = upper(coalesce(e.employment_status, '')))
 )
join hr.document_types dt
  on dt.document_type_id = r.document_type_id
 and dt.is_active = true
left join lateral (
  select
    ved.document_id,
    ved.reference,
    ved.document_status,
    ved.expires_on,
    ved.updated_at
  from hr.vw_employee_documents ved
  where ved.organization_id = e.organization_id
    and ved.employee_id = e.employee_id::text
    and ved.document_type_id = dt.document_type_id
  order by
    case when ved.document_status in ('PUBLISHED', 'VALIDATED', 'ARCHIVED') then 0 else 1 end,
    coalesce(ved.expires_on, date '9999-12-31') desc,
    ved.updated_at desc
  limit 1
) matched_document on true;

create or replace view hr.vw_document_processing_queue as
with latest_analysis as (
  select distinct on (ar.document_id)
    ar.document_id,
    ar.document_analysis_run_id,
    ar.pipeline_stage,
    ar.analysis_status,
    ar.confidence_score,
    ar.created_at,
    ar.completed_at
  from hr.document_analysis_runs ar
  order by ar.document_id, ar.created_at desc
)
select
  d.organization_id,
  d.document_id,
  d.reference,
  d.title,
  coalesce(dt.label, d.document_type) as document_type_label,
  d.document_status,
  d.analysis_status,
  d.requires_acknowledgement,
  d.legal_hold,
  la.document_analysis_run_id,
  la.pipeline_stage as latest_pipeline_stage,
  la.analysis_status as latest_run_status,
  la.confidence_score as latest_confidence_score,
  case
    when d.document_type_id is null then 'CLASSIFY'
    when d.analysis_status in ('NOT_REQUESTED', 'FAILED') and d.document_status <> 'ARCHIVED' then 'ANALYZE'
    when d.analysis_status = 'REVIEW_REQUIRED' then 'VALIDATE_FIELDS'
    when d.document_status in ('DRAFT', 'IN_VALIDATION') then 'VALIDATE_DOCUMENT'
    when d.document_status in ('VALIDATED', 'PUBLISHED')
      and d.requires_acknowledgement
      and exists (
        select 1
        from hr.document_dispatches dispatch
        where dispatch.document_id = d.document_id
          and dispatch.delivery_status in ('ASSIGNED', 'REMINDED')
      ) then 'FOLLOW_UP_DISPATCH'
    when d.document_status = 'ARCHIVED' and d.legal_hold = false then 'RETENTION_CHECK'
    else 'NONE'
  end as next_action,
  d.updated_at
from hr.documents d
left join hr.document_types dt on dt.document_type_id = d.document_type_id
left join latest_analysis la on la.document_id = d.document_id;

-- =====================================================================================
-- Indexes
-- =====================================================================================

create index if not exists idx_document_types_org_active
  on hr.document_types (organization_id, is_active, module_scope);
create index if not exists idx_document_links_entity
  on hr.document_links (organization_id, entity_type, entity_id);
create index if not exists idx_document_links_document_role
  on hr.document_links (document_id, link_role, created_at desc);
create index if not exists idx_document_requirements_scope_active
  on hr.document_requirements (organization_id, requirement_scope, is_active);
create index if not exists idx_document_requirements_type_scope
  on hr.document_requirements (document_type_id, requirement_scope);
create index if not exists idx_document_analysis_runs_doc_created
  on hr.document_analysis_runs (document_id, created_at desc);
create index if not exists idx_document_analysis_runs_status
  on hr.document_analysis_runs (analysis_status, created_at desc);
create index if not exists idx_document_extracted_fields_doc_field
  on hr.document_extracted_fields (document_id, field_name);
create index if not exists idx_document_retention_rules_org_active
  on hr.document_retention_rules (organization_id, is_active, owner_entity_type);
create index if not exists idx_document_retention_events_doc_time
  on hr.document_retention_events (document_id, occurred_at desc);
create index if not exists idx_documents_document_type
  on hr.documents (document_type_id);
create index if not exists idx_documents_source_module
  on hr.documents (source_module, updated_at desc);
create index if not exists idx_documents_analysis_status
  on hr.documents (analysis_status, updated_at desc);
create index if not exists idx_documents_confidentiality
  on hr.documents (confidentiality_level, updated_at desc);

-- =====================================================================================
-- Triggers updated_at
-- =====================================================================================

drop trigger if exists trg_document_types_updated_at on hr.document_types;
create trigger trg_document_types_updated_at
before update on hr.document_types
for each row execute function hr.set_updated_at();

drop trigger if exists trg_document_requirements_updated_at on hr.document_requirements;
create trigger trg_document_requirements_updated_at
before update on hr.document_requirements
for each row execute function hr.set_updated_at();

drop trigger if exists trg_document_analysis_runs_updated_at on hr.document_analysis_runs;
create trigger trg_document_analysis_runs_updated_at
before update on hr.document_analysis_runs
for each row execute function hr.set_updated_at();

drop trigger if exists trg_document_extracted_fields_updated_at on hr.document_extracted_fields;
create trigger trg_document_extracted_fields_updated_at
before update on hr.document_extracted_fields
for each row execute function hr.set_updated_at();

drop trigger if exists trg_document_retention_rules_updated_at on hr.document_retention_rules;
create trigger trg_document_retention_rules_updated_at
before update on hr.document_retention_rules
for each row execute function hr.set_updated_at();

commit;
