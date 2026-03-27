export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
  },
  dashboard: {
    summary: '/dashboard/summary',
    pendingRequests: '/dashboard/pending-requests',
  },
  personnel: {
    agents: '/personnel/agents',
    agentDetail: (id: string) => `/personnel/agents/${id}`,
    upload: '/personnel/uploads',
    dossiers: '/personnel/dossiers',
    affectations: '/personnel/affectations',
  },
  leave: {
    requests: '/leave/requests',
    balances: '/leave/balances',
    events: '/leave/events',
  },
  organization: {
    units: '/organization/units',
    budgetedPositions: '/organization/positions/budgeted',
    vacantPositions: '/organization/positions/vacant',
  },
  recruitment: {
    applications: '/recruitment/applications',
    campaigns: '/recruitment/campaigns',
    onboarding: '/recruitment/onboarding',
  },
  careers: {
    moves: '/careers/movements',
  },
  performance: {
    campaigns: '/performance/campaigns',
    results: '/performance/results',
  },
  training: {
    sessions: '/training/sessions',
    catalog: '/training/catalog',
  },
  discipline: {
    cases: '/discipline/cases',
  },
  documents: {
    library: '/documents/library',
    item: (reference: string) => `/documents/library/${encodeURIComponent(reference)}`,
    sign: (reference: string) => `/documents/library/${encodeURIComponent(reference)}/sign`,
    assign: (reference: string) => `/documents/library/${encodeURIComponent(reference)}/assign`,
    audit: '/documents/audit-logs',
    analytics: '/documents/analytics',
    overdue: '/documents/overdue',
    archiveRun: '/documents/archive-run',
    purgeArchives: '/documents/purge-archives',
    inbox: '/documents/inbox',
    inboxRead: (reference: string) => `/documents/inbox/${encodeURIComponent(reference)}/read`,
    inboxAcknowledge: (reference: string) => `/documents/inbox/${encodeURIComponent(reference)}/acknowledge`,
  },
  notifications: {
    inbox: '/notifications/inbox',
    read: (id: string) => `/notifications/inbox/${encodeURIComponent(id)}/read`,
    jobs: '/notifications/delivery-jobs',
    process: '/notifications/process',
  },
  workflows: {
    definitions: '/workflows/definitions',
    instances: '/workflows/instances',
    instanceAction: (id: string) => `/workflows/instances/${id}/actions`,
    automationStatus: '/workflows/automation/status',
    automationChannels: '/workflows/automation/channels',
    automationPolicy: '/workflows/automation/policy',
    automationSimulate: '/workflows/automation/simulate',
    automationRunCycle: '/workflows/automation/run-cycle',
    automationEvents: '/workflows/automation/events',
    automationEventsClear: '/workflows/automation/events/clear',
  },
  admin: {
    users: '/admin/users',
    roles: '/admin/roles',
    audit: '/admin/audit-logs',
  },
};
