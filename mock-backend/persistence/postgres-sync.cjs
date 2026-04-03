const fs = require('fs');
const pathModule = require('path');
const { createHash } = require('crypto');

let PoolCtor = null;
try {
  ({ Pool: PoolCtor } = require('pg'));
} catch {
  PoolCtor = null;
}

const DEFAULT_ORG_CODE = String(process.env.DB_DEFAULT_ORG_CODE || 'PRIMATURE-RH')
  .trim()
  .toUpperCase();
const DEFAULT_ORG_NAME = String(process.env.DB_DEFAULT_ORG_NAME || 'Primature - RH').trim();
const DB_SYNC_INTERVAL_MS = Math.max(Number(process.env.DB_SYNC_INTERVAL_MS || 15000), 5000);
const DB_SYNC_MAX_AUDIT_ROWS = Math.max(Number(process.env.DB_SYNC_MAX_AUDIT_ROWS || 400), 50);
const DB_BOOTSTRAP_SCHEMA = parseBooleanEnv(process.env.DB_BOOTSTRAP_SCHEMA, true);

function parseBooleanEnv(rawValue, fallback) {
  const normalized = String(rawValue || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function dbSyncEnabled() {
  return parseBooleanEnv(process.env.DB_SYNC_ENABLED, Boolean(process.env.DATABASE_URL));
}

function normalizeText(value) {
  return String(value || '').trim();
}

function toSlug(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shortHash(value) {
  return createHash('sha1')
    .update(String(value || ''))
    .digest('hex')
    .slice(0, 10);
}

function uniqueStrings(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((entry) => normalizeText(entry))
        .filter((entry) => entry.length > 0)
    )
  );
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function toIsoDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function parseJsonArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value;
  }
  if (!value || typeof value !== 'string') {
    return fallback;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function mapEmploymentStatusToDb(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'actif' || normalized === 'active') {
    return 'ACTIVE';
  }
  if (normalized.includes('absence') || normalized === 'on_leave') {
    return 'ON_LEAVE';
  }
  if (normalized === 'inactif' || normalized === 'inactive') {
    return 'INACTIVE';
  }
  if (normalized === 'termine' || normalized === 'terminated' || normalized === 'depart') {
    return 'TERMINATED';
  }
  return 'ACTIVE';
}

function mapEmploymentStatusFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'ON_LEAVE':
      return 'En absence';
    case 'INACTIVE':
      return 'Inactif';
    case 'TERMINATED':
      return 'Depart';
    case 'ACTIVE':
    default:
      return 'Actif';
  }
}

function mapDocumentStatusToDb(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'brouillon') {
    return 'DRAFT';
  }
  if (normalized === 'en validation' || normalized === 'en_validation' || normalized === 'in_validation') {
    return 'IN_VALIDATION';
  }
  if (normalized === 'valide' || normalized === 'validé' || normalized === 'validated') {
    return 'VALIDATED';
  }
  if (normalized === 'publie' || normalized === 'publié' || normalized === 'published') {
    return 'PUBLISHED';
  }
  if (normalized === 'archive' || normalized === 'archived') {
    return 'ARCHIVED';
  }
  return 'DRAFT';
}

function mapDocumentStatusFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'IN_VALIDATION':
      return 'En validation';
    case 'VALIDATED':
      return 'Valide';
    case 'PUBLISHED':
      return 'Publie';
    case 'ARCHIVED':
      return 'Archive';
    case 'DRAFT':
    default:
      return 'Brouillon';
  }
}

function mapDispatchStatusToDb(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'lu' || normalized === 'read') {
    return 'READ';
  }
  if (normalized === 'accuse reception' || normalized === 'acknowledged') {
    return 'ACKNOWLEDGED';
  }
  if (normalized.includes('rappel') || normalized === 'reminded') {
    return 'REMINDED';
  }
  if (normalized === 'annule' || normalized === 'cancelled') {
    return 'CANCELLED';
  }
  return 'ASSIGNED';
}

function mapDispatchStatusFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'READ':
      return 'Lu';
    case 'ACKNOWLEDGED':
      return 'Accuse reception';
    case 'REMINDED':
      return 'Rappel envoye';
    case 'CANCELLED':
      return 'Annule';
    case 'ASSIGNED':
    default:
      return 'Assigne';
  }
}

function mapWorkflowStatusToDb(value) {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'EN_ATTENTE' || normalized === 'PENDING') {
    return 'PENDING';
  }
  if (normalized === 'EN_COURS' || normalized === 'IN_PROGRESS') {
    return 'IN_PROGRESS';
  }
  if (normalized === 'APPROUVE' || normalized === 'APPROVED') {
    return 'APPROVED';
  }
  if (normalized === 'REJETE' || normalized === 'REJECTED') {
    return 'REJECTED';
  }
  if (normalized === 'ESCALADE' || normalized === 'ESCALATED') {
    return 'ESCALATED';
  }
  if (normalized === 'CANCELLED' || normalized === 'ANNULE') {
    return 'CANCELLED';
  }
  return 'PENDING';
}

function mapWorkflowStatusFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'IN_PROGRESS':
      return 'EN_COURS';
    case 'APPROVED':
      return 'APPROUVE';
    case 'REJECTED':
      return 'REJETE';
    case 'ESCALATED':
      return 'ESCALADE';
    case 'CANCELLED':
      return 'ANNULE';
    case 'PENDING':
    default:
      return 'EN_ATTENTE';
  }
}

function mapPriorityToDb(value) {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'BASSE' || normalized === 'LOW') {
    return 'LOW';
  }
  if (normalized === 'HAUTE' || normalized === 'HIGH') {
    return 'HIGH';
  }
  if (normalized === 'CRITIQUE' || normalized === 'CRITICAL') {
    return 'CRITICAL';
  }
  return 'NORMAL';
}

function mapPriorityFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'LOW':
      return 'Basse';
    case 'HIGH':
      return 'Haute';
    case 'CRITICAL':
      return 'Critique';
    case 'NORMAL':
    default:
      return 'Normale';
  }
}

function mapRoleStatusToDb(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === 'actif' || normalized === 'active') {
    return 'ACTIVE';
  }
  if (normalized === 'suspended' || normalized === 'suspendu') {
    return 'SUSPENDED';
  }
  if (normalized === 'disabled' || normalized === 'desactive') {
    return 'DISABLED';
  }
  return 'ACTIVE';
}

function mapRoleStatusFromDb(value) {
  switch (normalizeText(value).toUpperCase()) {
    case 'SUSPENDED':
      return 'Suspendu';
    case 'DISABLED':
      return 'Desactive';
    case 'ACTIVE':
    default:
      return 'Actif';
  }
}

function resolveSchemaPath() {
  return pathModule.join(__dirname, '..', '..', 'db', 'postgresql', '001_init_rh_schema.sql');
}

async function bootstrapSchema(client, status) {
  if (!DB_BOOTSTRAP_SCHEMA) {
    status.schemaBootstrap = 'skipped';
    return;
  }

  const schemaPath = resolveSchemaPath();
  if (!fs.existsSync(schemaPath)) {
    status.schemaBootstrap = `missing:${schemaPath}`;
    return;
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(sql);
  status.schemaBootstrap = 'applied';
}

async function ensureOrganization(client) {
  const result = await client.query(
    `
      insert into hr.organizations (code, name)
      values ($1, $2)
      on conflict (code) do update set name = excluded.name
      returning organization_id
    `,
    [DEFAULT_ORG_CODE, DEFAULT_ORG_NAME]
  );

  return result.rows[0].organization_id;
}

async function hasPersistedData(client) {
  const result = await client.query(
    `
      select
        (select count(*)::int from hr.users) as users_count,
        (select count(*)::int from hr.employees) as employees_count,
        (select count(*)::int from hr.documents) as documents_count,
        (select count(*)::int from hr.workflow_instances) as workflows_count
    `
  );

  const row = result.rows[0] || {};
  return (
    Number(row.users_count || 0) > 0 ||
    Number(row.employees_count || 0) > 0 ||
    Number(row.documents_count || 0) > 0 ||
    Number(row.workflows_count || 0) > 0
  );
}

async function hydrateFromDatabase(client, context) {
  const usersResult = await client.query(
    `
      select
        u.username,
        u.password_hash,
        u.full_name,
        u.status,
        d.name as direction_name,
        un.name as unit_name,
        coalesce(array_remove(array_agg(distinct r.code), null), '{}') as roles,
        coalesce(array_remove(array_agg(distinct us.scope_type), null), '{}') as scopes
      from hr.users u
      left join hr.directions d on d.direction_id = u.direction_id
      left join hr.units un on un.unit_id = u.unit_id
      left join hr.user_roles ur on ur.user_id = u.user_id
      left join hr.roles r on r.role_id = ur.role_id
      left join hr.user_scopes us on us.user_id = u.user_id
      group by u.user_id, d.name, un.name
      order by u.username asc
    `
  );

  if (usersResult.rows.length > 0) {
    const hydratedUsers = usersResult.rows.map((row) => ({
      username: row.username,
      password: row.password_hash || 'agent123',
      fullName: row.full_name,
      roles: Array.isArray(row.roles) ? row.roles : [],
      scopes: Array.isArray(row.scopes) ? row.scopes : [],
      direction: row.direction_name || '',
      unit: row.unit_name || '',
      status: row.status || 'ACTIVE',
    }));
    context.users.splice(0, context.users.length, ...hydratedUsers);

    const hydratedAdminUsers = hydratedUsers.map((entry) => ({
      username: entry.username,
      fullName: entry.fullName,
      role: entry.roles[0] || 'agent',
      direction: entry.direction || 'Direction RH',
      status: mapRoleStatusFromDb(entry.status || 'ACTIVE'),
    }));
    context.adminUsers.splice(0, context.adminUsers.length, ...hydratedAdminUsers);
  }

  const rolesResult = await client.query(
    `
      select
        r.code as role_name,
        r.label as role_label,
        count(rp.permission_id)::int as permission_count
      from hr.roles r
      left join hr.role_permissions rp on rp.role_id = r.role_id
      group by r.role_id
      order by r.code asc
    `
  );

  if (rolesResult.rows.length > 0) {
    const hydratedRoles = rolesResult.rows.map((row) => ({
      name: row.role_name,
      description: row.role_label || row.role_name,
      permissions: Number(row.permission_count || 0),
    }));
    context.adminRoles.splice(0, context.adminRoles.length, ...hydratedRoles);
  }

  const employeesResult = await client.query(
    `
      select
        e.matricule,
        e.full_name,
        e.email,
        e.phone,
        e.employment_status,
        d.name as direction_name,
        un.name as unit_name,
        e.metadata
      from hr.employees e
      left join hr.directions d on d.direction_id = e.direction_id
      left join hr.units un on un.unit_id = e.unit_id
      order by e.matricule asc
    `
  );

  if (employeesResult.rows.length > 0) {
    const hydratedAgents = employeesResult.rows.map((row) => {
      const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
      return {
        id: metadata.agentId || row.matricule,
        matricule: row.matricule,
        fullName: row.full_name,
        direction: metadata.direction || row.direction_name || '',
        unit: metadata.unit || row.unit_name || '',
        position: metadata.position || '',
        status: metadata.status || mapEmploymentStatusFromDb(row.employment_status),
        manager: metadata.manager || '',
        email: row.email || '',
        phone: row.phone || '',
        photoUrl: metadata.photoUrl || './assets/images/faces/5.jpg',
        careerEvents: Array.isArray(metadata.careerEvents) ? metadata.careerEvents : [],
        documents: Array.isArray(metadata.documents) ? metadata.documents : [],
      };
    });
    context.agents.splice(0, context.agents.length, ...hydratedAgents);
  }

  const documentsResult = await client.query(
    `
      select
        d.reference,
        d.title,
        d.document_type,
        d.owner_label,
        d.document_status,
        d.updated_at,
        emp.full_name as employee_name,
        emp.matricule as employee_matricule,
        dir.name as direction_name,
        un.name as unit_name,
        d.issued_on,
        d.start_date,
        d.end_date,
        appr.username as approver_username,
        d.mission_destination,
        d.mission_purpose,
        d.absence_reason,
        d.notes,
        dv.signed_at,
        signer.username as signed_by_username,
        dv.stamp_label,
        dv.signature_hash,
        dv.verification_code
      from hr.documents d
      left join hr.employees emp on emp.employee_id = d.employee_id
      left join hr.directions dir on dir.direction_id = d.direction_id
      left join hr.units un on un.unit_id = d.unit_id
      left join hr.users appr on appr.user_id = d.approver_user_id
      left join lateral (
        select *
        from hr.document_versions version_row
        where version_row.document_id = d.document_id
        order by version_row.version_no desc
        limit 1
      ) dv on true
      left join hr.users signer on signer.user_id = dv.signed_by_user_id
      order by d.reference asc
    `
  );

  if (documentsResult.rows.length > 0) {
    const hydratedDocuments = documentsResult.rows.map((row) => ({
      reference: row.reference,
      title: row.title,
      type: row.document_type,
      owner: row.owner_label || '',
      updatedAt: toIsoDateTime(row.updated_at) || new Date().toISOString(),
      status: mapDocumentStatusFromDb(row.document_status),
      employeeName: row.employee_name || '',
      employeeId: row.employee_matricule || '',
      direction: row.direction_name || '',
      unit: row.unit_name || '',
      issuedAt: toIsoDate(row.issued_on) || '',
      startDate: toIsoDate(row.start_date) || '',
      endDate: toIsoDate(row.end_date) || '',
      approver: row.approver_username || '',
      missionDestination: row.mission_destination || '',
      missionPurpose: row.mission_purpose || '',
      absenceReason: row.absence_reason || '',
      notes: row.notes || '',
      signedAt: toIsoDateTime(row.signed_at) || '',
      signedBy: row.signed_by_username || '',
      stampLabel: row.stamp_label || '',
      signatureHash: row.signature_hash || '',
      verificationCode: row.verification_code || '',
    }));
    context.documentsLibrary.splice(0, context.documentsLibrary.length, ...hydratedDocuments);
  }

  const dispatchesResult = await client.query(
    `
      select
        d.reference,
        rec.username as recipient_username,
        emp.matricule as employee_id,
        emp.full_name as employee_name,
        assigned_by.username as assigned_by_username,
        dd.delivery_status,
        dd.assigned_at,
        dd.due_at,
        dd.reminder_at,
        dd.reminder_sent_at,
        dd.read_at,
        dd.acknowledged_at,
        dd.note
      from hr.document_dispatches dd
      join hr.documents d on d.document_id = dd.document_id
      left join hr.users rec on rec.user_id = dd.recipient_user_id
      left join hr.employees emp on emp.employee_id = dd.recipient_employee_id
      left join hr.users assigned_by on assigned_by.user_id = dd.assigned_by_user_id
      order by dd.assigned_at desc
    `
  );

  if (dispatchesResult.rows.length > 0) {
    const hydratedDispatches = dispatchesResult.rows.map((row) => ({
      reference: row.reference,
      employeeId: row.employee_id || '',
      employeeName: row.employee_name || '',
      recipientUsername: row.recipient_username || '',
      note: row.note || '',
      deliveryStatus: mapDispatchStatusFromDb(row.delivery_status),
      assignedAt: toIsoDateTime(row.assigned_at) || '',
      assignedBy: row.assigned_by_username || '',
      assignmentDueAt: toIsoDateTime(row.due_at) || '',
      reminderAt: toIsoDateTime(row.reminder_at) || '',
      reminderSentAt: toIsoDateTime(row.reminder_sent_at) || '',
      readAt: toIsoDateTime(row.read_at) || '',
      acknowledgedAt: toIsoDateTime(row.acknowledged_at) || '',
      acknowledgedBy: '',
    }));
    context.documentDispatches.splice(0, context.documentDispatches.length, ...hydratedDispatches);
  }

  const workflowDefinitionsResult = await client.query(
    `
      select
        wd.code,
        wd.name,
        wd.module_name,
        wd.status,
        wd.sla_target_hours,
        wd.auto_escalation,
        count(ws.workflow_step_id)::int as steps_count
      from hr.workflow_definitions wd
      left join hr.workflow_steps ws on ws.workflow_definition_id = wd.workflow_definition_id
      group by wd.workflow_definition_id
      order by wd.code asc
    `
  );

  if (workflowDefinitionsResult.rows.length > 0) {
    const hydratedDefinitions = workflowDefinitionsResult.rows.map((row) => ({
      code: row.code,
      name: row.name,
      steps: Number(row.steps_count || 0),
      usedFor: row.module_name || 'Workflows',
      status: normalizeText(row.status).toUpperCase() === 'ACTIVE' ? 'Actif' : 'Inactif',
      slaTargetHours: Number(row.sla_target_hours || 0),
      autoEscalation: Boolean(row.auto_escalation),
    }));
    context.workflowDefinitions.splice(0, context.workflowDefinitions.length, ...hydratedDefinitions);
  }

  const workflowInstancesResult = await client.query(
    `
      select
        wi.workflow_instance_id,
        wi.reference,
        wd.name as definition_name,
        wi.instance_status,
        wi.priority,
        wi.due_on,
        wi.steps_total,
        wi.steps_completed,
        wi.escalation_level,
        wi.updated_at,
        wi.metadata
      from hr.workflow_instances wi
      join hr.workflow_definitions wd on wd.workflow_definition_id = wi.workflow_definition_id
      order by wi.reference asc
    `
  );

  const workflowEventsResult = await client.query(
    `
      select
        event.workflow_instance_id,
        event.event_type,
        event.actor_label,
        event.note,
        event.occurred_at
      from hr.workflow_instance_events event
      order by event.occurred_at asc
    `
  );

  if (workflowInstancesResult.rows.length > 0) {
    const eventsByInstance = new Map();
    workflowEventsResult.rows.forEach((row) => {
      const key = String(row.workflow_instance_id || '');
      if (!eventsByInstance.has(key)) {
        eventsByInstance.set(key, []);
      }
      eventsByInstance.get(key).push({
        date: toIsoDateTime(row.occurred_at) || new Date().toISOString(),
        actor: row.actor_label || 'Systeme',
        action: row.event_type || 'EVENT',
        note: row.note || '',
      });
    });

    const hydratedInstances = workflowInstancesResult.rows.map((row) => {
      const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
      const timeline = Array.isArray(metadata.timeline)
        ? metadata.timeline
        : eventsByInstance.get(String(row.workflow_instance_id)) || [];
      return {
        id: row.reference,
        definition: row.definition_name,
        requester: metadata.requesterLabel || '',
        createdOn: toIsoDateTime(metadata.createdOn || row.updated_at) || new Date().toISOString(),
        currentStep: metadata.currentStep || '',
        status: mapWorkflowStatusFromDb(row.instance_status),
        priority: mapPriorityFromDb(row.priority),
        dueOn: toIsoDateTime(row.due_on) || '',
        owner: metadata.ownerLabel || '',
        stepsTotal: Number(row.steps_total || 0),
        stepsCompleted: Number(row.steps_completed || 0),
        escalationLevel: Number(row.escalation_level || 0),
        lastUpdateOn: toIsoDateTime(row.updated_at) || '',
        timeline,
      };
    });
    context.workflowInstances.splice(0, context.workflowInstances.length, ...hydratedInstances);
  }

  const auditResult = await client.query(
    `
      select
        a.occurred_at,
        coalesce(u.username, a.metadata->>'user') as actor_username,
        a.action,
        coalesce(a.target_id, a.metadata->>'target') as target
      from hr.audit_logs a
      left join hr.users u on u.user_id = a.user_id
      order by a.occurred_at desc
      limit $1
    `,
    [DB_SYNC_MAX_AUDIT_ROWS]
  );

  if (auditResult.rows.length > 0) {
    const hydratedAdminAuditLogs = auditResult.rows.map((row) => ({
      date: toIsoDateTime(row.occurred_at) || new Date().toISOString(),
      user: row.actor_username || 'system',
      action: row.action || 'UNKNOWN',
      target: row.target || '',
    }));
    context.adminAuditLogs.splice(0, context.adminAuditLogs.length, ...hydratedAdminAuditLogs);
  }
}

async function ensureDirectionsAndUnits(client, organizationId, context) {
  const directionMap = new Map();
  const unitMap = new Map();

  const directionNames = uniqueStrings([
    ...context.users.map((entry) => entry.direction),
    ...context.adminUsers.map((entry) => entry.direction),
    ...context.agents.map((entry) => entry.direction),
    ...context.documentsLibrary.map((entry) => entry.direction),
  ]);

  for (const directionName of directionNames) {
    const code = `DIR-${shortHash(directionName)}`;
    const row = await client.query(
      `
        insert into hr.directions (organization_id, code, name, is_active)
        values ($1, $2, $3, true)
        on conflict (organization_id, code) do update
          set name = excluded.name, is_active = true
        returning direction_id
      `,
      [organizationId, code, directionName]
    );
    directionMap.set(directionName, row.rows[0].direction_id);
  }

  const units = [];
  const appendUnit = (directionName, unitName) => {
    const normalizedDirection = normalizeText(directionName);
    const normalizedUnit = normalizeText(unitName);
    if (!normalizedDirection || !normalizedUnit) {
      return;
    }
    units.push({ directionName: normalizedDirection, unitName: normalizedUnit });
  };

  context.users.forEach((entry) => appendUnit(entry.direction, entry.unit));
  context.agents.forEach((entry) => appendUnit(entry.direction, entry.unit));
  context.documentsLibrary.forEach((entry) => appendUnit(entry.direction, entry.unit));

  const seenUnits = new Set();
  for (const entry of units) {
    const dedupeKey = `${entry.directionName}|||${entry.unitName}`;
    if (seenUnits.has(dedupeKey)) {
      continue;
    }
    seenUnits.add(dedupeKey);

    const directionId = directionMap.get(entry.directionName) || null;
    const code = `UNT-${shortHash(`${entry.directionName}|${entry.unitName}`)}`;
    const row = await client.query(
      `
        insert into hr.units (organization_id, direction_id, code, name, is_active)
        values ($1, $2, $3, $4, true)
        on conflict (organization_id, code) do update
          set name = excluded.name, direction_id = excluded.direction_id, is_active = true
        returning unit_id
      `,
      [organizationId, directionId, code, entry.unitName]
    );
    unitMap.set(dedupeKey, row.rows[0].unit_id);
  }

  return { directionMap, unitMap };
}

async function persistSnapshot(client, context) {
  const organizationId = await ensureOrganization(client);
  const { directionMap, unitMap } = await ensureDirectionsAndUnits(client, organizationId, context);

  await client.query(
    `
      truncate table
        hr.user_scopes,
        hr.user_roles,
        hr.role_permissions,
        hr.permissions,
        hr.roles,
        hr.users,
        hr.document_dispatches,
        hr.document_versions,
        hr.documents,
        hr.file_objects,
        hr.workflow_instance_events,
        hr.workflow_instances,
        hr.workflow_steps,
        hr.workflow_definitions,
        hr.audit_logs,
        hr.employees
      restart identity cascade
    `
  );

  const roleDescriptions = new Map(
    context.adminRoles.map((entry) => [normalizeText(entry.name), normalizeText(entry.description)])
  );
  const roleCodes = new Set(Object.keys(context.ROLE_PERMISSIONS || {}));
  context.users.forEach((entry) => (entry.roles || []).forEach((role) => roleCodes.add(normalizeText(role))));
  context.adminUsers.forEach((entry) => roleCodes.add(normalizeText(entry.role)));

  const roleIdByCode = new Map();
  for (const roleCodeRaw of roleCodes) {
    const roleCode = normalizeText(roleCodeRaw);
    if (!roleCode) {
      continue;
    }
    const roleLabel = roleDescriptions.get(roleCode) || roleCode;
    const result = await client.query(
      `
        insert into hr.roles (code, label, is_system)
        values ($1, $2, true)
        returning role_id
      `,
      [roleCode, roleLabel]
    );
    roleIdByCode.set(roleCode, result.rows[0].role_id);
  }

  const permissionCodeSet = new Set();
  Object.values(context.ROLE_PERMISSIONS || {}).forEach((permissions) => {
    (permissions || []).forEach((permissionCode) => {
      if (permissionCode !== '*') {
        permissionCodeSet.add(permissionCode);
      }
    });
  });

  const permissionIdByCode = new Map();
  for (const permissionCode of permissionCodeSet) {
    const moduleName = normalizeText(permissionCode.split(':')[0] || 'core');
    const result = await client.query(
      `
        insert into hr.permissions (code, label, module_name)
        values ($1, $2, $3)
        returning permission_id
      `,
      [permissionCode, permissionCode, moduleName]
    );
    permissionIdByCode.set(permissionCode, result.rows[0].permission_id);
  }

  for (const [roleCode, permissions] of Object.entries(context.ROLE_PERMISSIONS || {})) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) {
      continue;
    }
    for (const permissionCode of permissions || []) {
      if (permissionCode === '*') {
        continue;
      }
      const permissionId = permissionIdByCode.get(permissionCode);
      if (!permissionId) {
        continue;
      }
      await client.query(
        `
          insert into hr.role_permissions (role_id, permission_id)
          values ($1, $2)
        `,
        [roleId, permissionId]
      );
    }
  }

  const mergedUsers = new Map();
  context.users.forEach((entry) => {
    const username = normalizeText(entry.username).toLowerCase();
    if (!username) {
      return;
    }
    mergedUsers.set(username, {
      username,
      password: normalizeText(entry.password) || 'agent123',
      fullName: normalizeText(entry.fullName) || username,
      roles: uniqueStrings(entry.roles || []),
      scopes: uniqueStrings(entry.scopes || []),
      direction: normalizeText(entry.direction),
      unit: normalizeText(entry.unit),
      status: 'Actif',
    });
  });

  context.adminUsers.forEach((entry) => {
    const username = normalizeText(entry.username).toLowerCase();
    if (!username) {
      return;
    }
    const existing = mergedUsers.get(username) || {
      username,
      password: 'agent123',
      fullName: normalizeText(entry.fullName) || username,
      roles: [],
      scopes: [context.APP_SCOPES?.SELF || 'SELF'],
      direction: normalizeText(entry.direction),
      unit: '',
      status: normalizeText(entry.status) || 'Actif',
    };
    existing.fullName = normalizeText(entry.fullName) || existing.fullName;
    existing.direction = normalizeText(entry.direction) || existing.direction;
    existing.status = normalizeText(entry.status) || existing.status;
    const role = normalizeText(entry.role);
    if (role && !existing.roles.includes(role)) {
      existing.roles.push(role);
    }
    mergedUsers.set(username, existing);
  });

  const userIdByUsername = new Map();
  for (const user of mergedUsers.values()) {
    const directionId = user.direction ? directionMap.get(user.direction) || null : null;
    const unitKey = user.direction && user.unit ? `${user.direction}|||${user.unit}` : '';
    const unitId = unitKey ? unitMap.get(unitKey) || null : null;
    const result = await client.query(
      `
        insert into hr.users (
          organization_id,
          username,
          email,
          password_hash,
          full_name,
          status,
          direction_id,
          unit_id
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning user_id
      `,
      [
        organizationId,
        user.username,
        user.username.includes('@') ? user.username : null,
        user.password,
        user.fullName,
        mapRoleStatusToDb(user.status),
        directionId,
        unitId,
      ]
    );

    const userId = result.rows[0].user_id;
    userIdByUsername.set(user.username, userId);

    const roleCodesForUser = uniqueStrings(user.roles.length > 0 ? user.roles : ['agent']);
    for (const roleCode of roleCodesForUser) {
      const roleId = roleIdByCode.get(roleCode);
      if (!roleId) {
        continue;
      }
      await client.query(
        `
          insert into hr.user_roles (user_id, role_id)
          values ($1, $2)
        `,
        [userId, roleId]
      );
    }

    const scopes = uniqueStrings(user.scopes.length > 0 ? user.scopes : ['SELF']);
    for (const scopeTypeRaw of scopes) {
      const scopeType = normalizeText(scopeTypeRaw).toUpperCase();
      if (!scopeType) {
        continue;
      }
      const defaultTeamKey = `${toSlug(user.direction || 'global')}:${toSlug(user.unit || user.username)}`;
      const teamKey = scopeType === 'TEAM' ? defaultTeamKey : null;
      await client.query(
        `
          insert into hr.user_scopes (user_id, scope_type, direction_id, unit_id, team_key)
          values ($1, $2, $3, $4, $5)
        `,
        [
          userId,
          scopeType,
          scopeType === 'DIRECTION' ? directionId : null,
          scopeType === 'UNIT' ? unitId : null,
          teamKey,
        ]
      );
    }
  }

  const employeeIdByKey = new Map();
  for (const agent of context.agents) {
    const direction = normalizeText(agent.direction);
    const unit = normalizeText(agent.unit);
    const directionId = direction ? directionMap.get(direction) || null : null;
    const unitId = direction && unit ? unitMap.get(`${direction}|||${unit}`) || null : null;
    const matricule = normalizeText(agent.matricule || agent.id);
    const fullName = normalizeText(agent.fullName || matricule);
    const metadata = {
      agentId: normalizeText(agent.id || matricule),
      direction,
      unit,
      position: normalizeText(agent.position),
      manager: normalizeText(agent.manager),
      status: normalizeText(agent.status || mapEmploymentStatusFromDb('ACTIVE')),
      photoUrl: normalizeText(agent.photoUrl),
      careerEvents: Array.isArray(agent.careerEvents) ? agent.careerEvents : [],
      documents: Array.isArray(agent.documents) ? agent.documents : [],
    };

    const result = await client.query(
      `
        insert into hr.employees (
          organization_id,
          matricule,
          full_name,
          email,
          phone,
          direction_id,
          unit_id,
          employment_status,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        returning employee_id
      `,
      [
        organizationId,
        matricule,
        fullName,
        normalizeText(agent.email) || null,
        normalizeText(agent.phone) || null,
        directionId,
        unitId,
        mapEmploymentStatusToDb(agent.status),
        JSON.stringify(metadata),
      ]
    );

    const employeeId = result.rows[0].employee_id;
    employeeIdByKey.set(matricule, employeeId);
    employeeIdByKey.set(fullName.toLowerCase(), employeeId);
  }

  const documentIdByReference = new Map();
  for (const document of context.documentsLibrary) {
    const direction = normalizeText(document.direction);
    const unit = normalizeText(document.unit);
    const directionId = direction ? directionMap.get(direction) || null : null;
    const unitId = direction && unit ? unitMap.get(`${direction}|||${unit}`) || null : null;
    const employeeId =
      employeeIdByKey.get(normalizeText(document.employeeId)) ||
      employeeIdByKey.get(normalizeText(document.employeeName).toLowerCase()) ||
      null;
    const approverUsername = normalizeText(document.approver).toLowerCase();
    const approverId = userIdByUsername.get(approverUsername) || null;

    const documentResult = await client.query(
      `
        insert into hr.documents (
          organization_id,
          employee_id,
          reference,
          title,
          document_type,
          owner_label,
          document_status,
          direction_id,
          unit_id,
          issued_on,
          start_date,
          end_date,
          approver_user_id,
          mission_destination,
          mission_purpose,
          absence_reason,
          notes,
          current_version_no,
          updated_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, 1, coalesce($18::timestamptz, now())
        )
        returning document_id
      `,
      [
        organizationId,
        employeeId,
        normalizeText(document.reference),
        normalizeText(document.title),
        normalizeText(document.type),
        normalizeText(document.owner),
        mapDocumentStatusToDb(document.status),
        directionId,
        unitId,
        toIsoDate(document.issuedAt),
        toIsoDate(document.startDate),
        toIsoDate(document.endDate),
        approverId,
        normalizeText(document.missionDestination) || null,
        normalizeText(document.missionPurpose) || null,
        normalizeText(document.absenceReason) || null,
        normalizeText(document.notes) || null,
        toIsoDateTime(document.updatedAt),
      ]
    );

    const documentId = documentResult.rows[0].document_id;
    const reference = normalizeText(document.reference);
    documentIdByReference.set(reference, documentId);

    const fileResult = await client.query(
      `
        insert into hr.file_objects (
          organization_id,
          storage_provider,
          bucket_name,
          object_key,
          mime_type,
          byte_size,
          original_filename,
          uploaded_by_user_id
        )
        values ($1, 'mock', 'mock-backend', $2, 'application/json', 0, $3, null)
        returning file_id
      `,
      [organizationId, `mock/documents/${reference}/v1.json`, `${reference}.json`]
    );

    const fileId = fileResult.rows[0].file_id;
    const signedById = userIdByUsername.get(normalizeText(document.signedBy).toLowerCase()) || null;
    await client.query(
      `
        insert into hr.document_versions (
          document_id,
          version_no,
          file_id,
          signed_at,
          signed_by_user_id,
          stamp_label,
          signature_hash,
          verification_code
        )
        values ($1, 1, $2, $3, $4, $5, $6, $7)
      `,
      [
        documentId,
        fileId,
        toIsoDateTime(document.signedAt),
        signedById,
        normalizeText(document.stampLabel) || null,
        normalizeText(document.signatureHash) || null,
        normalizeText(document.verificationCode) || null,
      ]
    );
  }

  for (const dispatch of context.documentDispatches) {
    const reference = normalizeText(dispatch.reference);
    const documentId = documentIdByReference.get(reference);
    if (!documentId) {
      continue;
    }
    const recipientUserId = userIdByUsername.get(normalizeText(dispatch.recipientUsername).toLowerCase()) || null;
    const recipientEmployeeId =
      employeeIdByKey.get(normalizeText(dispatch.employeeId)) ||
      employeeIdByKey.get(normalizeText(dispatch.employeeName).toLowerCase()) ||
      null;
    const assignedByUserId = userIdByUsername.get(normalizeText(dispatch.assignedBy).toLowerCase()) || null;

    await client.query(
      `
        insert into hr.document_dispatches (
          document_id,
          recipient_user_id,
          recipient_employee_id,
          assigned_by_user_id,
          delivery_status,
          assigned_at,
          due_at,
          reminder_at,
          reminder_sent_at,
          read_at,
          acknowledged_at,
          note
        )
        values (
          $1, $2, $3, $4, $5,
          coalesce($6::timestamptz, now()),
          $7, $8, $9, $10, $11, $12
        )
      `,
      [
        documentId,
        recipientUserId,
        recipientEmployeeId,
        assignedByUserId,
        mapDispatchStatusToDb(dispatch.deliveryStatus),
        toIsoDateTime(dispatch.assignedAt),
        toIsoDateTime(dispatch.assignmentDueAt),
        toIsoDateTime(dispatch.reminderAt),
        toIsoDateTime(dispatch.reminderSentAt),
        toIsoDateTime(dispatch.readAt),
        toIsoDateTime(dispatch.acknowledgedAt),
        normalizeText(dispatch.note) || null,
      ]
    );
  }

  const workflowDefinitionIdByCode = new Map();
  const workflowDefinitionIdByName = new Map();
  for (const definition of context.workflowDefinitions) {
    const code = normalizeText(definition.code);
    const result = await client.query(
      `
        insert into hr.workflow_definitions (
          organization_id,
          code,
          name,
          module_name,
          status,
          sla_target_hours,
          auto_escalation,
          version_no
        )
        values ($1, $2, $3, $4, $5, $6, $7, 1)
        returning workflow_definition_id, name
      `,
      [
        organizationId,
        code,
        normalizeText(definition.name),
        normalizeText(definition.usedFor) || 'Workflows',
        normalizeText(definition.status).toLowerCase() === 'actif' ? 'ACTIVE' : 'INACTIVE',
        Number(definition.slaTargetHours || 0) || null,
        Boolean(definition.autoEscalation),
      ]
    );
    const workflowDefinitionId = result.rows[0].workflow_definition_id;
    workflowDefinitionIdByCode.set(code, workflowDefinitionId);
    workflowDefinitionIdByName.set(normalizeText(definition.name), workflowDefinitionId);

    const stepCount = Math.max(Number(definition.steps || 0), 0);
    for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
      await client.query(
        `
          insert into hr.workflow_steps (
            workflow_definition_id,
            step_order,
            code,
            label
          )
          values ($1, $2, $3, $4)
        `,
        [workflowDefinitionId, stepIndex, `STEP_${stepIndex}`, `Etape ${stepIndex}`]
      );
    }
  }

  const workflowInstanceIdByReference = new Map();
  for (const instance of context.workflowInstances) {
    const definitionId = workflowDefinitionIdByName.get(normalizeText(instance.definition));
    if (!definitionId) {
      continue;
    }
    const requesterEmployeeId =
      employeeIdByKey.get(normalizeText(instance.requester)) ||
      employeeIdByKey.get(normalizeText(instance.requester).toLowerCase()) ||
      null;
    const ownerUserId = userIdByUsername.get(normalizeText(instance.owner).toLowerCase()) || null;
    const metadata = {
      currentStep: normalizeText(instance.currentStep),
      timeline: Array.isArray(instance.timeline) ? instance.timeline : [],
      requesterLabel: normalizeText(instance.requester),
      ownerLabel: normalizeText(instance.owner),
      createdOn: toIsoDateTime(instance.createdOn),
    };

    const workflowResult = await client.query(
      `
        insert into hr.workflow_instances (
          organization_id,
          reference,
          workflow_definition_id,
          requester_employee_id,
          owner_user_id,
          current_step_order,
          instance_status,
          priority,
          due_on,
          started_at,
          completed_at,
          steps_total,
          steps_completed,
          escalation_level,
          metadata,
          updated_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15::jsonb, coalesce($16::timestamptz, now())
        )
        returning workflow_instance_id
      `,
      [
        organizationId,
        normalizeText(instance.id),
        definitionId,
        requesterEmployeeId,
        ownerUserId,
        Math.max(Number(instance.stepsCompleted || 0) + 1, 1),
        mapWorkflowStatusToDb(instance.status),
        mapPriorityToDb(instance.priority),
        toIsoDateTime(instance.dueOn),
        toIsoDateTime(instance.createdOn),
        normalizeText(instance.status).toUpperCase() === 'APPROUVE' ? toIsoDateTime(instance.lastUpdateOn) : null,
        Math.max(Number(instance.stepsTotal || 0), 0),
        Math.max(Number(instance.stepsCompleted || 0), 0),
        Math.max(Number(instance.escalationLevel || 0), 0),
        JSON.stringify(metadata),
        toIsoDateTime(instance.lastUpdateOn),
      ]
    );

    const workflowInstanceId = workflowResult.rows[0].workflow_instance_id;
    workflowInstanceIdByReference.set(normalizeText(instance.id), workflowInstanceId);

    const timeline = Array.isArray(instance.timeline) ? instance.timeline : [];
    for (const event of timeline) {
      await client.query(
        `
          insert into hr.workflow_instance_events (
            workflow_instance_id,
            event_type,
            actor_label,
            note,
            occurred_at,
            payload
          )
          values ($1, $2, $3, $4, coalesce($5::timestamptz, now()), $6::jsonb)
        `,
        [
          workflowInstanceId,
          normalizeText(event.action) || 'EVENT',
          normalizeText(event.actor) || 'Systeme',
          normalizeText(event.note) || null,
          toIsoDateTime(event.date),
          JSON.stringify({ source: 'timeline' }),
        ]
      );
    }
  }

  const mergedAuditRows = [];
  context.adminAuditLogs.forEach((entry) => {
    mergedAuditRows.push({
      occurredAt: toIsoDateTime(entry.date),
      username: normalizeText(entry.user).toLowerCase(),
      action: normalizeText(entry.action) || 'UNKNOWN',
      target: normalizeText(entry.target),
      targetType: 'admin',
      metadata: { source: 'adminAuditLogs' },
    });
  });

  context.documentAuditLogs.forEach((entry) => {
    mergedAuditRows.push({
      occurredAt: toIsoDateTime(entry.occurredAt || entry.createdAt),
      username: normalizeText(entry.actor).toLowerCase(),
      action: normalizeText(entry.action) || 'DOCUMENT_EVENT',
      target: normalizeText(entry.reference),
      targetType: 'document',
      metadata: {
        source: 'documentAuditLogs',
        statusBefore: entry.statusBefore || null,
        statusAfter: entry.statusAfter || null,
      },
    });
  });

  const boundedAuditRows = mergedAuditRows
    .filter((entry) => normalizeText(entry.action).length > 0)
    .sort((left, right) => {
      const leftTs = new Date(left.occurredAt || 0).getTime();
      const rightTs = new Date(right.occurredAt || 0).getTime();
      return leftTs - rightTs;
    })
    .slice(-DB_SYNC_MAX_AUDIT_ROWS);

  for (const entry of boundedAuditRows) {
    const userId = userIdByUsername.get(entry.username) || null;
    await client.query(
      `
        insert into hr.audit_logs (
          organization_id,
          user_id,
          action,
          target_type,
          target_id,
          status,
          metadata,
          occurred_at
        )
        values ($1, $2, $3, $4, $5, 'SUCCESS', $6::jsonb, coalesce($7::timestamptz, now()))
      `,
      [
        organizationId,
        userId,
        entry.action,
        entry.targetType,
        entry.target || null,
        JSON.stringify(entry.metadata || {}),
        entry.occurredAt,
      ]
    );
  }

}

async function runSyncCycle(pool, status, context, reason) {
  if (status.inProgress) {
    return;
  }

  status.inProgress = true;
  const startedAt = Date.now();
  const client = await pool.connect();
  try {
    await client.query('begin');
    await persistSnapshot(client, context);
    await client.query('commit');
    status.lastSyncAt = new Date().toISOString();
    status.lastSyncReason = reason;
    status.syncCount += 1;
    status.lastDurationMs = Date.now() - startedAt;
    status.lastError = null;
  } catch (error) {
    await client.query('rollback');
    status.lastError = error instanceof Error ? error.message : String(error);
    status.lastErrorAt = new Date().toISOString();
  } finally {
    client.release();
    status.inProgress = false;
  }
}

function startPostgresSync(context) {
  const status = {
    enabled: false,
    connected: false,
    hydrated: false,
    inProgress: false,
    schemaBootstrap: 'not_started',
    syncCount: 0,
    lastSyncAt: null,
    lastSyncReason: null,
    lastHydrateAt: null,
    lastDurationMs: null,
    lastError: null,
    lastErrorAt: null,
    intervalMs: DB_SYNC_INTERVAL_MS,
  };

  if (!dbSyncEnabled()) {
    status.lastError = 'DB sync disabled (set DB_SYNC_ENABLED=true with DATABASE_URL to enable)';
    return {
      status,
      triggerSync: async () => null,
      stop: () => null,
    };
  }

  if (!PoolCtor) {
    status.lastError = 'PostgreSQL driver not installed. Add dependency "pg".';
    return {
      status,
      triggerSync: async () => null,
      stop: () => null,
    };
  }

  if (!process.env.DATABASE_URL) {
    status.lastError = 'DATABASE_URL is missing';
    return {
      status,
      triggerSync: async () => null,
      stop: () => null,
    };
  }

  const sslRequired = parseBooleanEnv(process.env.DB_SSL_REQUIRE, false);
  const pool = new PoolCtor({
    connectionString: process.env.DATABASE_URL,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    max: Math.max(Number(process.env.DB_POOL_MAX || 5), 1),
    idleTimeoutMillis: Math.max(Number(process.env.DB_POOL_IDLE_TIMEOUT_MS || 30000), 5000),
    connectionTimeoutMillis: Math.max(Number(process.env.DB_POOL_CONN_TIMEOUT_MS || 10000), 1000),
  });

  status.enabled = true;

  let timer = null;
  const triggerSync = async (reason = 'manual') => runSyncCycle(pool, status, context, reason);
  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    pool.end().catch(() => null);
  };

  (async () => {
    const client = await pool.connect();
    try {
      await client.query('select 1');
      status.connected = true;
      await bootstrapSchema(client, status);
      const alreadyHasData = await hasPersistedData(client);
      if (alreadyHasData) {
        await hydrateFromDatabase(client, context);
        status.hydrated = true;
        status.lastHydrateAt = new Date().toISOString();
      }
    } catch (error) {
      status.lastError = error instanceof Error ? error.message : String(error);
      status.lastErrorAt = new Date().toISOString();
    } finally {
      client.release();
    }

    if (!status.lastError) {
      await triggerSync(status.hydrated ? 'startup_refresh' : 'startup_seed');
    }

    timer = setInterval(() => {
      triggerSync('interval').catch(() => null);
    }, DB_SYNC_INTERVAL_MS);
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  })().catch((error) => {
    status.lastError = error instanceof Error ? error.message : String(error);
    status.lastErrorAt = new Date().toISOString();
  });

  const stopSignals = ['SIGINT', 'SIGTERM', 'beforeExit'];
  stopSignals.forEach((signal) => {
    process.once(signal, () => {
      stop();
    });
  });

  return {
    status,
    triggerSync,
    stop,
  };
}

module.exports = {
  startPostgresSync,
};
