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
