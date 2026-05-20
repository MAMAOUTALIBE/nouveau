-- RH-ADMIN PostgreSQL schema v3
-- Date: 2026-04-20
-- Scope: targeted indexing for sync, joins and tenant-scoped reads

begin;

set search_path = hr, public;

-- =====================================================================================
-- Security / IAM
-- =====================================================================================

create index if not exists idx_user_scopes_user_scope
  on hr.user_scopes (user_id, scope_type);

-- =====================================================================================
-- Personnel / leave / recruitment
-- =====================================================================================

create index if not exists idx_employees_org_direction_unit
  on hr.employees (organization_id, direction_id, unit_id);
create index if not exists idx_leave_requests_org_employee_status
  on hr.leave_requests (organization_id, employee_id, request_status, start_date desc);
create index if not exists idx_recruitment_applications_org_status_received
  on hr.recruitment_applications (organization_id, application_status, received_on desc);
create index if not exists idx_recruitment_comments_application_created
  on hr.recruitment_comments (application_id, created_at desc);
create index if not exists idx_recruitment_attachments_application_uploaded
  on hr.recruitment_attachments (application_id, uploaded_at desc);

-- =====================================================================================
-- Documents / storage
-- =====================================================================================

create index if not exists idx_file_objects_org_uploaded
  on hr.file_objects (organization_id, uploaded_at desc);
create index if not exists idx_documents_org_status_updated
  on hr.documents (organization_id, document_status, updated_at desc);
create index if not exists idx_documents_org_employee_updated
  on hr.documents (organization_id, employee_id, updated_at desc);
create index if not exists idx_document_dispatches_document_status
  on hr.document_dispatches (document_id, delivery_status, assigned_at desc);

-- Columns introduced in 002_unified_documents.sql
create index if not exists idx_documents_org_document_type_updated
  on hr.documents (organization_id, document_type_id, updated_at desc);
create index if not exists idx_documents_org_analysis_status_updated
  on hr.documents (organization_id, analysis_status, updated_at desc);
create index if not exists idx_documents_org_source_module_updated
  on hr.documents (organization_id, source_module, updated_at desc);

-- =====================================================================================
-- Workflows / audit / notifications
-- =====================================================================================

create index if not exists idx_workflow_instances_org_status_due
  on hr.workflow_instances (organization_id, instance_status, due_on);
create index if not exists idx_workflow_instances_org_owner_status
  on hr.workflow_instances (organization_id, owner_user_id, instance_status);
create index if not exists idx_audit_logs_org_time
  on hr.audit_logs (organization_id, occurred_at desc);
create index if not exists idx_notifications_org_status_sched
  on hr.notifications (organization_id, delivery_status, scheduled_at);

commit;
