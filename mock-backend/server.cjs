const http = require('http');
const fs = require('fs');
const pathModule = require('path');
const { createHash } = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || process.env.MOCK_API_PORT || 8080);
const HOST = process.env.HOST || process.env.MOCK_API_HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const ACCESS_TOKEN_TTL_MS = Number(process.env.MOCK_ACCESS_TOKEN_TTL_MS || 30 * 60 * 1000);
const REFRESH_TOKEN_TTL_MS = Number(process.env.MOCK_REFRESH_TOKEN_TTL_MS || 24 * 60 * 60 * 1000);
const MAX_UPLOAD_BYTES = Number(process.env.MOCK_MAX_UPLOAD_BYTES || 15 * 1024 * 1024);
const PERSONNEL_UPLOAD_DIR = pathModule.join(__dirname, 'uploads');
const FRONTEND_DIST_DIR = pathModule.join(__dirname, '..', 'dist', 'nowa-angular-21');
const FRONTEND_INDEX_PATH = pathModule.join(FRONTEND_DIST_DIR, 'index.html');
const ALLOWED_UPLOAD_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/octet-stream',
]);
const UPLOAD_MIME_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
const UPLOAD_EXTENSION_BY_MIME = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};
const STATIC_MIME_BY_EXTENSION = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!fs.existsSync(PERSONNEL_UPLOAD_DIR)) {
  fs.mkdirSync(PERSONNEL_UPLOAD_DIR, { recursive: true });
}

const APP_SCOPES = {
  SELF: 'SELF',
  TEAM: 'TEAM',
  UNIT: 'UNIT',
  DIRECTION: 'DIRECTION',
  GLOBAL: 'GLOBAL',
};

const SCOPE_ALIASES = {
  self: APP_SCOPES.SELF,
  own: APP_SCOPES.SELF,
  team: APP_SCOPES.TEAM,
  unit: APP_SCOPES.UNIT,
  direction: APP_SCOPES.DIRECTION,
  global: APP_SCOPES.GLOBAL,
};

const APP_PERMISSIONS = {
  dashboardView: 'dashboard:view',
  dashboardManage: 'dashboard:manage',
  personnelView: 'personnel:view',
  personnelManage: 'personnel:manage',
  organizationView: 'organization:view',
  organizationManage: 'organization:manage',
  recruitmentView: 'recruitment:view',
  recruitmentManage: 'recruitment:manage',
  careersView: 'careers:view',
  careersManage: 'careers:manage',
  leaveView: 'leave:view',
  leaveManage: 'leave:manage',
  leaveApproveL1: 'leave:approve:l1',
  leaveApproveL2: 'leave:approve:l2',
  performanceView: 'performance:view',
  performanceManage: 'performance:manage',
  trainingView: 'training:view',
  trainingManage: 'training:manage',
  disciplineView: 'discipline:view',
  disciplineManage: 'discipline:manage',
  documentsView: 'documents:view',
  documentsManage: 'documents:manage',
  documentsViewSensitive: 'documents:view:sensitive',
  workflowsView: 'workflows:view',
  workflowsManage: 'workflows:manage',
  reportsView: 'reports:view',
  reportsExport: 'reports:export',
  portalAgent: 'portal:agent',
  portalManager: 'portal:manager',
  adminView: 'admin:view',
  adminUsersManage: 'admin:users:manage',
  adminRolesManage: 'admin:roles:manage',
  adminAuditView: 'admin:audit:view',
};

const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  hr_manager: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.dashboardManage,
    APP_PERMISSIONS.personnelView,
    APP_PERMISSIONS.personnelManage,
    APP_PERMISSIONS.organizationView,
    APP_PERMISSIONS.organizationManage,
    APP_PERMISSIONS.recruitmentView,
    APP_PERMISSIONS.recruitmentManage,
    APP_PERMISSIONS.careersView,
    APP_PERMISSIONS.careersManage,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.leaveManage,
    APP_PERMISSIONS.leaveApproveL1,
    APP_PERMISSIONS.leaveApproveL2,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.performanceManage,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.trainingManage,
    APP_PERMISSIONS.disciplineView,
    APP_PERMISSIONS.disciplineManage,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.documentsManage,
    APP_PERMISSIONS.documentsViewSensitive,
    APP_PERMISSIONS.workflowsView,
    APP_PERMISSIONS.workflowsManage,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.reportsExport,
    APP_PERMISSIONS.portalAgent,
    APP_PERMISSIONS.portalManager,
  ],
  manager: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.leaveManage,
    APP_PERMISSIONS.leaveApproveL1,
    APP_PERMISSIONS.performanceView,
    APP_PERMISSIONS.performanceManage,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.trainingManage,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.documentsManage,
    APP_PERMISSIONS.reportsView,
    APP_PERMISSIONS.reportsExport,
    APP_PERMISSIONS.portalManager,
  ],
  agent: [
    APP_PERMISSIONS.dashboardView,
    APP_PERMISSIONS.leaveView,
    APP_PERMISSIONS.leaveManage,
    APP_PERMISSIONS.trainingView,
    APP_PERMISSIONS.trainingManage,
    APP_PERMISSIONS.documentsView,
    APP_PERMISSIONS.documentsManage,
    APP_PERMISSIONS.portalAgent,
  ],
};

const ROLE_SCOPES = {
  super_admin: [APP_SCOPES.GLOBAL],
  hr_manager: [APP_SCOPES.GLOBAL],
  manager: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION],
  agent: [APP_SCOPES.SELF],
};

const users = [
  {
    username: 'spruko@admin.com',
    password: 'sprukoadmin',
    fullName: 'Admin RH',
    roles: ['super_admin'],
    scopes: [APP_SCOPES.GLOBAL],
    direction: 'Cabinet',
    unit: 'Administration',
  },
  {
    username: 'manager.rh@gouv.gn',
    password: 'manager123',
    fullName: 'Manager RH',
    roles: ['hr_manager'],
    scopes: [APP_SCOPES.GLOBAL],
    direction: 'Direction RH',
    unit: 'Pilotage RH',
  },
  {
    username: 'chef.service@gouv.gn',
    password: 'chef123',
    fullName: 'Chef Service',
    roles: ['manager'],
    scopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION],
    direction: 'Direction RH',
    unit: 'Gestion administrative',
  },
  {
    username: 'agent.rh@gouv.gn',
    password: 'agent123',
    fullName: 'Agent RH',
    roles: ['agent'],
    scopes: [APP_SCOPES.SELF],
    direction: 'Direction RH',
    unit: 'Gestion administrative',
  },
  {
    username: 'aminata.diallo@gouv.gn',
    password: 'agent123',
    fullName: 'Aminata Diallo',
    roles: ['agent'],
    scopes: [APP_SCOPES.SELF],
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
  },
  {
    username: 'mamadou.camara@gouv.gn',
    password: 'agent123',
    fullName: 'Mamadou Camara',
    roles: ['agent'],
    scopes: [APP_SCOPES.SELF],
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
  },
];

const accessSessions = new Map();
const refreshSessions = new Map();

const agents = [
  {
    id: 'PRM-0001',
    matricule: 'PRM-0001',
    fullName: 'Aminata Diallo',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    position: 'Chargee RH',
    status: 'Actif',
    manager: 'Directeur RH',
    email: 'aminata.diallo@gouv.gn',
    phone: '+224 620000001',
    photoUrl: './assets/images/faces/5.jpg',
    careerEvents: [
      {
        title: 'Prise de fonction',
        description: 'Affectation initiale au service RH',
        date: '2024-01-15',
      },
    ],
    documents: [
      {
        type: 'Contrat',
        reference: 'CTR-2024-001',
        status: 'Valide',
      },
    ],
  },
  {
    id: 'PRM-0002',
    matricule: 'PRM-0002',
    fullName: 'Mamadou Camara',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    position: 'Assistant RH',
    status: 'Actif',
    manager: 'Aminata Diallo',
    email: 'mamadou.camara@gouv.gn',
    phone: '+224 620000002',
    photoUrl: './assets/images/faces/9.jpg',
    careerEvents: [],
    documents: [],
  },
];

const personnelDossiers = [
  {
    reference: 'DOS-2026-001',
    agent: 'Aminata Diallo',
    type: 'Arrete nomination',
    status: 'Actif',
    updatedAt: '2026-03-12T09:00:00.000Z',
  },
  {
    reference: 'DOS-2026-002',
    agent: 'Mamadou Camara',
    type: 'Contrat de travail',
    status: 'En revue',
    updatedAt: '2026-03-20T14:30:00.000Z',
  },
  {
    reference: 'DOS-2026-003',
    agent: 'Saran Bah',
    type: 'Decision administrative',
    status: 'Archive',
    updatedAt: '2026-02-18T11:15:00.000Z',
  },
];

const personnelAffectations = [
  {
    reference: 'AFF-2026-001',
    agent: 'Mamadou Camara',
    fromUnit: 'Gestion administrative',
    toUnit: 'Service Paie',
    effectiveDate: '2026-04-01',
    status: 'Planifiee',
  },
  {
    reference: 'AFF-2026-002',
    agent: 'Aminata Diallo',
    fromUnit: 'Direction des Ressources Humaines',
    toUnit: 'Cabinet',
    effectiveDate: '2026-03-15',
    status: 'Effective',
  },
  {
    reference: 'AFF-2026-003',
    agent: 'Ibrahima Conde',
    fromUnit: 'Direction Administrative',
    toUnit: 'Direction des Ressources Humaines',
    effectiveDate: '2026-03-28',
    status: 'En cours',
  },
];

const personnelMatriculeSuggestionAudit = [
  {
    reference: 'MAT-AUD-2026-001',
    createdAt: '2026-03-29T21:40:00.000Z',
    username: 'spruko@admin.com',
    previousMatricule: 'PRM-0002',
    suggestedMatricule: 'PRM-0003',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    scopeLabel: 'Direction des Ressources Humaines / Gestion administrative',
    basedOn: 'Direction+Unite',
    reason: 'regeneration_manuelle',
  },
];

const personnelAgentAuditTrail = [
  {
    reference: 'AG-AUD-2026-0001',
    agentId: 'PRM-0001',
    agentLabel: 'Aminata Diallo',
    changedAt: '2026-03-29T21:20:00.000Z',
    changedBy: 'spruko@admin.com',
    source: 'update',
    reason: 'mise_a_jour_fiche',
    changes: [
      {
        field: 'phone',
        label: 'Telephone',
        before: '+224 620000000',
        after: '+224 620000001',
      },
      {
        field: 'manager',
        label: 'Manager',
        before: 'Directeur RH Interim',
        after: 'Directeur RH',
      },
    ],
  },
];

const leaveRequests = [
  {
    reference: 'ABS-2026-001',
    agent: 'Aminata Diallo',
    type: 'Conge annuel',
    startDate: '2026-03-24',
    endDate: '2026-03-28',
    status: 'En attente',
  },
  {
    reference: 'ABS-2026-002',
    agent: 'Mamadou Camara',
    type: 'Mission',
    startDate: '2026-03-20',
    endDate: '2026-03-22',
    status: 'Approuve',
  },
  {
    reference: 'ABS-2026-003',
    agent: 'Ibrahima Conde',
    type: 'Maladie',
    startDate: '2026-03-18',
    endDate: '2026-03-25',
    status: 'En cours',
  },
  {
    reference: 'ABS-2026-004',
    agent: 'Saran Bah',
    type: 'Conge annuel',
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    status: 'Rejete',
  },
  {
    reference: 'ABS-2026-005',
    agent: 'Kadiatou Sylla',
    type: 'Conge maternité',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    status: 'En attente',
  },
  {
    reference: 'ABS-2026-006',
    agent: 'Moussa Cisse',
    type: 'Conge sans solde',
    startDate: '2026-04-05',
    endDate: '2026-04-20',
    status: 'En attente',
  },
];

const leaveBalances = [
  { type: 'Conge annuel', allocated: 30, consumed: 8, remaining: 22 },
  { type: 'RTT', allocated: 12, consumed: 4, remaining: 8 },
  { type: 'Conge exceptionnel', allocated: 5, consumed: 1, remaining: 4 },
  { type: 'Mission', allocated: 20, consumed: 6, remaining: 14 },
];

const leaveEvents = [
  { title: 'Conge - A. Diallo', start: '2026-03-24', end: '2026-03-28', className: 'bg-warning-transparent' },
  { title: 'Mission - M. Camara', start: '2026-03-20', end: '2026-03-22', className: 'bg-primary-transparent' },
  { title: 'Maladie - I. Conde', start: '2026-03-18', end: '2026-03-25', className: 'bg-danger-transparent' },
  { title: 'Conge maternite - K. Sylla', start: '2026-04-01', end: '2026-06-30', className: 'bg-info-transparent' },
];

const orgUnits = [
  {
    id: 'ORG-CAB',
    name: 'Cabinet',
    parentId: null,
    head: 'Directeur de Cabinet',
    headTitle: 'Directeur',
    staffCount: 25,
  },
  {
    id: 'ORG-DRH',
    name: 'Direction des Ressources Humaines',
    parentId: 'ORG-CAB',
    head: 'Directeur RH',
    headTitle: 'Directeur',
    staffCount: 42,
  },
  {
    id: 'ORG-DAG',
    name: 'Direction Administrative',
    parentId: 'ORG-CAB',
    head: 'Directeur Administratif',
    headTitle: 'Directeur',
    staffCount: 31,
  },
  {
    id: 'ORG-PAIE',
    name: 'Service Paie',
    parentId: 'ORG-DRH',
    head: 'Chef service Paie',
    headTitle: 'Chef service',
    staffCount: 12,
  },
  {
    id: 'ORG-RECRUT',
    name: 'Service Recrutement',
    parentId: 'ORG-DRH',
    head: 'Chef service Recrutement',
    headTitle: 'Chef service',
    staffCount: 10,
  },
];

const budgetedPositions = [
  {
    code: 'PB-DRH-001',
    structure: 'Direction des Ressources Humaines',
    title: 'Charge RH',
    grade: 'A2',
    status: 'Occupe',
    holder: 'Aminata Diallo',
  },
  {
    code: 'PB-DRH-002',
    structure: 'Direction des Ressources Humaines',
    title: 'Assistant RH',
    grade: 'B1',
    status: 'Occupe',
    holder: 'Mamadou Camara',
  },
  {
    code: 'PB-PAIE-001',
    structure: 'Service Paie',
    title: 'Gestionnaire Paie',
    grade: 'A1',
    status: 'Ouvert',
    holder: '',
  },
  {
    code: 'PB-RECRUT-001',
    structure: 'Service Recrutement',
    title: 'Analyste Recrutement',
    grade: 'A1',
    status: 'Ouvert',
    holder: '',
  },
];

const vacantPositions = [
  {
    code: 'VAC-2026-001',
    structure: 'Service Paie',
    title: 'Gestionnaire Paie',
    grade: 'A1',
    openedOn: '2026-03-11',
    priority: 'Haute',
  },
  {
    code: 'VAC-2026-002',
    structure: 'Service Recrutement',
    title: 'Analyste Recrutement',
    grade: 'A1',
    openedOn: '2026-03-18',
    priority: 'Normale',
  },
  {
    code: 'VAC-2026-003',
    structure: 'Direction Administrative',
    title: 'Assistant Logistique',
    grade: 'B1',
    openedOn: '2026-03-09',
    priority: 'Basse',
  },
];

const recruitmentApplications = [
  {
    reference: 'APP-2026-001',
    candidate: 'Fatoumata Barry',
    candidateEmail: 'fatoumata.barry@gmail.com',
    candidatePhone: '+224622111001',
    identityNumber: 'CNI-GN-00124578',
    position: 'Analyste Recrutement',
    campaign: 'CMP-RECRUT-Q2',
    source: 'Portail RH',
    status: 'Preselection',
    receivedOn: '2026-03-12',
    experienceYears: 4,
    skillsMatch: 84,
    educationLevel: 82,
    interviewAverage: 76,
    testScore: 79,
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'Nouveau',
        changedAt: '2026-03-12T09:00:00.000Z',
        changedBy: 'system',
        note: 'Creation candidature',
      },
      {
        fromStatus: 'Nouveau',
        toStatus: 'Preselection',
        changedAt: '2026-03-14T11:10:00.000Z',
        changedBy: 'responsable.rh',
        note: 'Profil retenu pour analyse approfondie',
      },
    ],
    comments: [
      {
        id: 'COM-APP-2026-001-001',
        author: 'responsable.rh',
        message: 'Profil interessant pour entretien technique.',
        createdAt: '2026-03-14T11:25:00.000Z',
      },
    ],
    attachments: [],
  },
  {
    reference: 'APP-2026-002',
    candidate: 'Sekou Keita',
    candidateEmail: 'sekou.keita@outlook.com',
    candidatePhone: '+224622111002',
    identityNumber: 'CNI-GN-00163544',
    position: 'Gestionnaire Paie',
    campaign: 'CMP-PAIE-Q2',
    source: 'Jobboard',
    status: 'Entretien',
    receivedOn: '2026-03-10',
    experienceYears: 7,
    skillsMatch: 91,
    educationLevel: 75,
    interviewAverage: 83,
    testScore: 88,
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'Nouveau',
        changedAt: '2026-03-10T08:30:00.000Z',
        changedBy: 'system',
        note: 'Creation candidature',
      },
      {
        fromStatus: 'Nouveau',
        toStatus: 'Preselection',
        changedAt: '2026-03-11T14:45:00.000Z',
        changedBy: 'responsable.rh',
      },
      {
        fromStatus: 'Preselection',
        toStatus: 'Entretien',
        changedAt: '2026-03-13T10:20:00.000Z',
        changedBy: 'responsable.rh',
      },
    ],
    comments: [
      {
        id: 'COM-APP-2026-002-001',
        author: 'responsable.rh',
        message: 'Entretien planifie avec le manager de service.',
        createdAt: '2026-03-13T12:00:00.000Z',
      },
    ],
    attachments: [],
  },
  {
    reference: 'APP-2026-003',
    candidate: 'Mariama Camara',
    candidateEmail: 'mariama.camara@yahoo.fr',
    candidatePhone: '+224622111003',
    identityNumber: 'CNI-GN-00884110',
    position: 'Assistant RH',
    campaign: 'CMP-RH-Q1',
    source: 'Cooptation',
    status: 'Rejete',
    receivedOn: '2026-03-05',
    experienceYears: 2,
    skillsMatch: 65,
    educationLevel: 68,
    interviewAverage: 0,
    testScore: 60,
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'Nouveau',
        changedAt: '2026-03-05T09:00:00.000Z',
        changedBy: 'system',
      },
      {
        fromStatus: 'Nouveau',
        toStatus: 'Rejete',
        changedAt: '2026-03-07T15:00:00.000Z',
        changedBy: 'responsable.rh',
        note: 'Candidature non alignée avec le poste',
      },
    ],
    attachments: [],
  },
  {
    reference: 'APP-2026-004',
    candidate: 'Oumar Bah',
    candidateEmail: 'oumar.bah@gmail.com',
    candidatePhone: '+224622111004',
    identityNumber: 'CNI-GN-00600219',
    position: 'Gestionnaire Paie',
    campaign: 'CMP-PAIE-Q2',
    source: 'Cabinet',
    status: 'Nouveau',
    receivedOn: '2026-03-20',
    experienceYears: 5,
    skillsMatch: 73,
    educationLevel: 80,
    interviewAverage: 0,
    testScore: 74,
    statusHistory: [
      {
        fromStatus: null,
        toStatus: 'Nouveau',
        changedAt: '2026-03-20T09:00:00.000Z',
        changedBy: 'system',
      },
    ],
    attachments: [],
  },
];

const recruitmentCampaigns = [
  {
    code: 'CMP-RH-Q1',
    title: 'Campagne RH T1',
    department: 'Direction des Ressources Humaines',
    openings: 2,
    startDate: '2026-01-10',
    endDate: '2026-03-30',
    needPosition: 'Assistant RH',
    needQuota: 2,
    needDeadline: '2026-03-20',
    needOwner: 'responsable.rh',
    status: 'Cloturee',
  },
  {
    code: 'CMP-PAIE-Q2',
    title: 'Renfort Paie T2',
    department: 'Service Paie',
    openings: 3,
    startDate: '2026-03-01',
    endDate: '2026-05-15',
    needPosition: 'Gestionnaire Paie',
    needQuota: 3,
    needDeadline: '2026-05-01',
    needOwner: 'manager.paie',
    status: 'Active',
  },
  {
    code: 'CMP-RECRUT-Q2',
    title: 'Renfort Recrutement T2',
    department: 'Service Recrutement',
    openings: 2,
    startDate: '2026-03-15',
    endDate: '2026-05-30',
    needPosition: 'Analyste Recrutement',
    needQuota: 2,
    needDeadline: '2026-05-20',
    needOwner: 'manager.recrutement',
    status: 'Active',
  },
];

const recruitmentOnboarding = [
  {
    agent: 'Aissatou Diallo',
    position: 'Analyste Recrutement',
    startDate: '2026-03-18',
    checklistTasks: [
      { label: 'Contrat signe', assignedTo: 'RH Admin', status: 'Termine', dueDate: '2026-03-18' },
      {
        label: 'Badge cree',
        assignedTo: 'Services Generaux',
        status: 'Bloquee',
        dueDate: '2026-03-19',
        blockedReason: 'Validation securite batiment en attente',
        blockedSince: '2026-03-20',
      },
      { label: 'Compte SI active', assignedTo: 'IT Support', status: 'A faire', dueDate: '2026-03-20' },
      {
        label: 'Formation ATS et process recrutement',
        assignedTo: 'Manager Recrutement',
        status: 'A faire',
        dueDate: '2026-03-21',
      },
    ],
    history: [
      {
        type: 'Blocage',
        taskLabel: 'Badge cree',
        detail: 'Validation securite batiment en attente',
        occurredAt: '2026-03-20',
      },
    ],
    status: 'En cours',
    applicationReference: 'APP-2026-001',
  },
  {
    agent: 'Abdoulaye Camara',
    position: 'Gestionnaire Paie',
    startDate: '2026-04-10',
    checklist: ['Contrat signe', 'Materiel remis', 'Formation initiale'],
    status: 'Planifie',
  },
  {
    agent: 'Ibrahima Keita',
    position: 'Assistant RH',
    startDate: '2026-03-04',
    checklist: ['Contrat signe', 'Badge cree', 'Formation completee'],
    status: 'Termine',
  },
];

const recruitmentOnboardingTemplates = [
  {
    id: 'ONB-TPL-REC-ANALYSTE',
    label: 'Template Analyste Recrutement',
    keywords: ['analyste recrutement', 'recrutement'],
    tasks: [
      { label: 'Contrat signe', assignedTo: 'RH Admin' },
      { label: 'Badge cree', assignedTo: 'Services Generaux' },
      { label: 'Compte SI active', assignedTo: 'IT Support' },
      { label: 'Formation ATS et process recrutement', assignedTo: 'Manager Recrutement' },
    ],
  },
  {
    id: 'ONB-TPL-PAIE-GEST',
    label: 'Template Gestionnaire Paie',
    keywords: ['gestionnaire paie', 'paie'],
    tasks: [
      { label: 'Contrat signe', assignedTo: 'RH Admin' },
      { label: 'Badge cree', assignedTo: 'Services Generaux' },
      { label: 'Compte SI active', assignedTo: 'IT Support' },
      { label: 'Acces outils paie valide', assignedTo: 'Manager Paie' },
      { label: 'Formation procedure paie', assignedTo: 'Manager Paie' },
    ],
  },
  {
    id: 'ONB-TPL-RH-ASSIST',
    label: 'Template Assistant RH',
    keywords: ['assistant rh', 'rh'],
    tasks: [
      { label: 'Contrat signe', assignedTo: 'RH Admin' },
      { label: 'Badge cree', assignedTo: 'Services Generaux' },
      { label: 'Compte SI active', assignedTo: 'IT Support' },
      { label: 'Formation dossiers personnel', assignedTo: 'Responsable RH' },
    ],
  },
];

const RECRUITMENT_ONBOARDING_ESCALATION_DELAY_DAYS = 2;
const RECRUITMENT_ONBOARDING_ESCALATION_TARGET_BY_LEVEL = {
  N1: 'Manager RH',
  N2: 'Direction RH',
  N3: 'Secretariat General',
};

const RECRUITMENT_NOTIFICATION_SLA_DAYS_BY_STATUS = {
  Nouveau: 3,
  Preselection: 4,
  Entretien: 5,
};
const RECRUITMENT_NOTIFICATION_INTERVIEW_REMINDER_DAYS = 2;
const RECRUITMENT_NOTIFICATION_VALIDATION_REMINDER_DAYS = 1;

const recruitmentAuditLogs = [];
const recruitmentDuplicateLinks = [];
const recruitmentShortlistValidations = [];
const RECRUITMENT_SHORTLIST_VALIDATION_LIMIT = 800;

const recruitmentScoringPolicy = {
  criteria: [
    {
      key: 'experienceYears',
      label: 'Experience pertinente',
      weight: 25,
      maxYears: 10,
    },
    {
      key: 'skillsMatch',
      label: 'Adequation competences',
      weight: 30,
    },
    {
      key: 'educationLevel',
      label: 'Niveau academique',
      weight: 15,
    },
    {
      key: 'interviewAverage',
      label: 'Evaluation entretien',
      weight: 20,
    },
    {
      key: 'testScore',
      label: 'Score test technique',
      weight: 10,
    },
  ],
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const recruitmentInterviewQuestionBank = [
  {
    id: 'IQB-ANALYSTE-RECRUTEMENT-V1',
    position: 'Analyste Recrutement',
    version: 1,
    questions: [
      'Comment structurez-vous un processus de sourcing pour un poste penurique ?',
      'Quelle methode utilisez-vous pour evaluer l objectivite d un entretien ?',
      'Donnez un exemple de KPI recrutement que vous avez fait progresser.',
    ],
    createdAt: '2026-03-14T09:00:00.000Z',
    updatedAt: '2026-03-14T09:00:00.000Z',
    createdBy: 'responsable.rh',
  },
  {
    id: 'IQB-GESTIONNAIRE-PAIE-V1',
    position: 'Gestionnaire Paie',
    version: 1,
    questions: [
      'Expliquez votre methode de controle d un bulletin avant validation.',
      'Comment traitez-vous une anomalie de cotisation detectee apres cloture ?',
      'Quel est votre plan de secours si le cycle paie est bloque la veille de paie ?',
    ],
    createdAt: '2026-03-10T08:30:00.000Z',
    updatedAt: '2026-03-10T08:30:00.000Z',
    createdBy: 'manager.paie',
  },
];

const recruitmentInterviewSchedules = [
  {
    id: 'INT-2026-001',
    applicationReference: 'APP-2026-002',
    candidate: 'Sekou Keita',
    position: 'Gestionnaire Paie',
    campaign: 'CMP-PAIE-Q2',
    slotStart: '2026-04-03T09:00:00.000Z',
    slotEnd: '2026-04-03T10:00:00.000Z',
    interviewers: ['manager.paie', 'rh.operations'],
    location: 'Salle RH 2',
    status: 'Planifie',
    history: [],
    evaluations: [
      {
        interviewer: 'manager.paie',
        technicalScore: 82,
        communicationScore: 75,
        cultureFitScore: 80,
        recommendation: 'Go',
        comment: 'Profil solide, besoin de renfort sur outils internes.',
        submittedAt: '2026-04-03T11:10:00.000Z',
      },
    ],
  },
  {
    id: 'INT-2026-002',
    applicationReference: 'APP-2026-001',
    candidate: 'Fatoumata Barry',
    position: 'Analyste Recrutement',
    campaign: 'CMP-RECRUT-Q2',
    slotStart: '2026-04-04T14:00:00.000Z',
    slotEnd: '2026-04-04T15:00:00.000Z',
    interviewers: ['manager.recrutement', 'responsable.rh'],
    location: 'Visio Teams',
    status: 'Planifie',
    history: [],
    evaluations: [],
  },
];

const recruitmentCampaignBudgets = [
  {
    campaignCode: 'CMP-PAIE-Q2',
    budgetAmount: 120000000,
    currency: 'GNF',
    expensesAmount: 45000000,
    lastUpdatedAt: '2026-03-28T10:00:00.000Z',
    updatedBy: 'manager.paie',
  },
  {
    campaignCode: 'CMP-RECRUT-Q2',
    budgetAmount: 90000000,
    currency: 'GNF',
    expensesAmount: 32000000,
    lastUpdatedAt: '2026-03-28T10:30:00.000Z',
    updatedBy: 'manager.recrutement',
  },
];

const recruitmentRuleEngineRules = [
  {
    id: 'REC-RULE-001',
    name: 'Relance auto candidature en retard',
    event: 'application_sla_breached',
    condition: 'status in [Nouveau, Preselection]',
    action: 'send_notification',
    enabled: true,
    createdAt: '2026-03-20T08:00:00.000Z',
    updatedAt: '2026-03-20T08:00:00.000Z',
    createdBy: 'responsable.rh',
  },
  {
    id: 'REC-RULE-002',
    name: 'Auto-planification entretien shortlist',
    event: 'shortlist_validated',
    condition: 'score >= 70',
    action: 'create_interview_slot',
    enabled: false,
    createdAt: '2026-03-22T10:00:00.000Z',
    updatedAt: '2026-03-22T10:00:00.000Z',
    createdBy: 'responsable.rh',
  },
];

const recruitmentRuleExecutions = [];
const recruitmentOnboardingSyncLogs = [];
const recruitmentOnboardingMilestoneFeedback = [];
const recruitmentBiExportLogs = [];
const recruitmentObservabilityEvents = [];

const RECRUITMENT_PERF_THRESHOLDS = {
  apiP95Ms: 900,
  errorRatePercent: 1.5,
  staleDataMinutes: 15,
};

const careerMovements = [
  {
    reference: 'CAR-2026-001',
    agent: 'Aminata Diallo',
    type: 'Avancement',
    from: 'A2',
    to: 'A1',
    effectiveDate: '2026-04-01',
    status: 'Valide',
  },
  {
    reference: 'CAR-2026-002',
    agent: 'Mamadou Camara',
    type: 'Mutation',
    from: 'Service RH',
    to: 'Service Paie',
    effectiveDate: '2026-03-28',
    status: 'En attente',
  },
  {
    reference: 'CAR-2026-003',
    agent: 'Saran Bah',
    type: 'Detachement',
    from: 'Direction RH',
    to: 'Inspection Generale',
    effectiveDate: '2026-05-01',
    status: 'Valide',
  },
  {
    reference: 'CAR-2026-004',
    agent: 'Ibrahima Conde',
    type: 'Promotion',
    from: 'Assistant RH',
    to: 'Responsable RH',
    effectiveDate: '2026-06-01',
    status: 'Propose',
  },
];

const performanceCampaigns = [
  {
    code: 'PERF-2026-S1',
    title: 'Evaluation semestrielle S1',
    period: 'Jan-Jun 2026',
    population: 'Tout personnel cadre',
    status: 'Active',
  },
  {
    code: 'PERF-2025-AN',
    title: 'Evaluation annuelle 2025',
    period: 'Jan-Dec 2025',
    population: 'Ensemble du personnel',
    status: 'Cloturee',
  },
];

const performanceResults = [
  {
    agent: 'Aminata Diallo',
    direction: 'Direction des Ressources Humaines',
    managerScore: 88,
    selfScore: 84,
    finalScore: 86,
    status: 'Valide',
  },
  {
    agent: 'Mamadou Camara',
    direction: 'Direction des Ressources Humaines',
    managerScore: 76,
    selfScore: 80,
    finalScore: 78,
    status: 'En revue',
  },
  {
    agent: 'Ibrahima Conde',
    direction: 'Direction Administrative',
    managerScore: 70,
    selfScore: 72,
    finalScore: 71,
    status: 'Valide',
  },
];

const trainingSessions = [
  {
    code: 'TRN-2026-001',
    title: 'Gestion avancee des conges',
    dates: '25/03/2026 - 27/03/2026',
    location: 'Conakry',
    seats: 25,
    enrolled: 18,
    status: 'Ouverte',
  },
  {
    code: 'TRN-2026-002',
    title: 'Pilotage KPI RH',
    dates: '02/04/2026 - 03/04/2026',
    location: 'Conakry',
    seats: 20,
    enrolled: 20,
    status: 'Complete',
  },
  {
    code: 'TRN-2026-003',
    title: 'SIRH niveau expert',
    dates: '15/04/2026 - 19/04/2026',
    location: 'Kindia',
    seats: 18,
    enrolled: 9,
    status: 'Ouverte',
  },
];

const trainingCatalog = [
  { code: 'CAT-001', title: 'Gestion RH moderne', duration: '5 jours', modality: 'Presentiel', domain: 'RH' },
  { code: 'CAT-002', title: 'Conduite du changement', duration: '3 jours', modality: 'Hybride', domain: 'Management' },
  { code: 'CAT-003', title: 'Analyse de donnees RH', duration: '4 jours', modality: 'Distanciel', domain: 'Data RH' },
];

const trainingEnrollmentRequests = [
  {
    reference: 'TRN-REQ-2026-001',
    sessionCode: 'TRN-2026-001',
    sessionTitle: 'Gestion avancee des conges',
    sessionDates: '25/03/2026 - 27/03/2026',
    sessionLocation: 'Conakry',
    applicantName: 'Agent RH',
    applicantUsername: 'agent.rh@gouv.gn',
    motivation: 'Renforcer mes competences sur la gestion avancee des absences.',
    status: 'Soumise',
    createdAt: '2026-03-27T10:40:00.000Z',
    decidedAt: '',
    decidedBy: '',
    decisionComment: '',
  },
  {
    reference: 'TRN-REQ-2026-002',
    sessionCode: 'TRN-2026-003',
    sessionTitle: 'SIRH niveau expert',
    sessionDates: '15/04/2026 - 19/04/2026',
    sessionLocation: 'Kindia',
    applicantName: 'Aminata Diallo',
    applicantUsername: 'aminata.diallo@gouv.gn',
    motivation: 'Accompagner le deploiement du SIRH dans la direction RH.',
    status: 'Validee',
    createdAt: '2026-03-23T14:12:00.000Z',
    decidedAt: '2026-03-24T09:05:00.000Z',
    decidedBy: 'Manager RH',
    decisionComment: 'Priorite validee pour le plan de formation du trimestre.',
  },
  {
    reference: 'TRN-REQ-2026-003',
    sessionCode: 'TRN-2026-002',
    sessionTitle: 'Pilotage KPI RH',
    sessionDates: '02/04/2026 - 03/04/2026',
    sessionLocation: 'Conakry',
    applicantName: 'Mamadou Camara',
    applicantUsername: 'mamadou.camara@gouv.gn',
    motivation: 'Mieux analyser les indicateurs RH de mon unite.',
    status: 'Rejetee',
    createdAt: '2026-03-22T08:18:00.000Z',
    decidedAt: '2026-03-22T17:30:00.000Z',
    decidedBy: 'Chef Service',
    decisionComment: 'Session complete, proposer une prochaine edition.',
  },
];

const disciplineCases = [
  {
    reference: 'DISC-2026-001',
    agent: 'Moussa Cisse',
    infraction: 'Absence non justifiee',
    openedOn: '2026-03-12',
    status: 'Instruction',
    sanction: '',
  },
  {
    reference: 'DISC-2026-002',
    agent: 'Kadiatou Sylla',
    infraction: 'Non-respect de procedure',
    openedOn: '2026-03-02',
    status: 'Cloture',
    sanction: 'Avertissement',
  },
  {
    reference: 'DISC-2026-003',
    agent: 'Ibrahima Keita',
    infraction: 'Retard recurrent',
    openedOn: '2026-03-20',
    status: 'Ouvert',
    sanction: '',
  },
];

const documentsLibrary = [
  {
    reference: 'DOC-2026-001',
    title: 'Ordre de mission - Audit RH Kindia',
    type: 'Ordre de mission',
    owner: 'Direction RH',
    updatedAt: '2026-03-10T09:20:00.000Z',
    status: 'Valide',
    employeeName: 'Aminata Diallo',
    employeeId: 'PRM-0001',
    direction: 'Direction des Ressources Humaines',
    unit: 'Gestion administrative',
    issuedAt: '2026-03-10',
    startDate: '2026-03-14',
    endDate: '2026-03-17',
    approver: 'Directeur RH',
    missionDestination: 'Kindia',
    missionPurpose: 'Audit des procedures RH',
    absenceReason: '',
    notes: 'Transport et hebergement pris en charge par le service RH.',
    signedAt: '2026-03-10T10:05:00.000Z',
    signedBy: 'manager.rh@gouv.gn',
    stampLabel: 'CACHET RH PRIMATURE',
    signatureHash: 'd76ef4072624f5a8e6eb2484e13a0f8ad4abaf9659e8788ec6fd9291e4dcb2cd',
    verificationCode: 'VRF-2026-6F1A2C74',
  },
  {
    reference: 'DOC-2026-002',
    title: 'Certificat d absence - Kadiatou Sylla',
    type: 'Certificat d absence',
    owner: 'Direction RH',
    updatedAt: '2026-03-14T12:00:00.000Z',
    status: 'Publie',
    employeeName: 'Kadiatou Sylla',
    employeeId: 'PRM-0018',
    direction: 'Direction RH',
    unit: 'Gestion administrative',
    issuedAt: '2026-03-14',
    startDate: '2026-03-13',
    endDate: '2026-03-13',
    approver: 'Chef service RH',
    missionDestination: '',
    missionPurpose: '',
    absenceReason: 'Consultation medicale',
    notes: 'Justificatif medical fourni.',
    signedAt: '2026-03-14T13:12:00.000Z',
    signedBy: 'chef.service@gouv.gn',
    stampLabel: 'CACHET RH PRIMATURE',
    signatureHash: 'ce776f6e4c24864ca68086fb6283635ff38102fe3d8f2575f2a6a0dbf6b0c8cf',
    verificationCode: 'VRF-2026-89D1AAE3',
  },
  {
    reference: 'DOC-2026-003',
    title: 'Attestation de travail - Ibrahima Keita',
    type: 'Attestation de travail',
    owner: 'Direction RH',
    updatedAt: '2026-03-18T15:30:00.000Z',
    status: 'Publie',
    employeeName: 'Ibrahima Keita',
    employeeId: 'PRM-0023',
    direction: 'Direction RH',
    unit: 'Paie',
    issuedAt: '2026-03-18',
    startDate: '',
    endDate: '',
    approver: 'Directeur RH',
    missionDestination: '',
    missionPurpose: '',
    absenceReason: '',
    notes: 'Attestation emise pour demarche bancaire.',
    signedAt: '2026-03-18T16:10:00.000Z',
    signedBy: 'manager.rh@gouv.gn',
    stampLabel: 'CACHET RH PRIMATURE',
    signatureHash: '6a08ef85ed39ed2f9f96ebfdf9655f5453da991ad14560e72b8f3ca648b65d56',
    verificationCode: 'VRF-2026-BC33E9F0',
  },
];

const documentDispatches = [];
const documentAuditLogs = [];

const DOCUMENT_STATUS_FLOW = Object.freeze({
  Brouillon: ['En validation', 'Archive'],
  'En validation': ['Brouillon', 'Valide', 'Archive'],
  Valide: ['En validation', 'Publie', 'Archive'],
  Publie: ['Archive'],
  Archive: [],
});

const DOCUMENT_STATUS_MAP = Object.freeze({
  brouillon: 'Brouillon',
  'en validation': 'En validation',
  envalidation: 'En validation',
  en_validation: 'En validation',
  valide: 'Valide',
  validee: 'Valide',
  'validé': 'Valide',
  publie: 'Publie',
  publiee: 'Publie',
  'publié': 'Publie',
  archive: 'Archive',
  archivee: 'Archive',
  'archivé': 'Archive',
  'archivée': 'Archive',
});

const DOCUMENT_AUDIT_ACTIONS = Object.freeze({
  CREATED: 'DOCUMENT_CREATED',
  UPDATED: 'DOCUMENT_UPDATED',
  STATUS_CHANGED: 'DOCUMENT_STATUS_CHANGED',
  SIGNED: 'DOCUMENT_SIGNED',
  ASSIGNED: 'DOCUMENT_ASSIGNED',
  READ: 'DOCUMENT_READ',
  ACKNOWLEDGED: 'DOCUMENT_ACKNOWLEDGED',
});

const DOCUMENT_AUDIT_LIMIT = 1200;
let documentAuditSequence = 1;

const notificationDeliveryJobs = [];
const notificationInboxItems = [];
const NOTIFICATION_DELIVERY_LIMIT = 1600;
const NOTIFICATION_INBOX_LIMIT = 2400;
const NOTIFICATION_MAX_ATTEMPTS = 3;
const NOTIFICATION_RETRY_DELAYS_MS = [0, 5000, 30000];
let notificationSequence = 1;

const DOCUMENT_ARCHIVE_DEFAULT_DAYS = 30;
const DOCUMENT_PURGE_DEFAULT_RETENTION_DAYS = 120;

const adminUsers = [
  { username: 'spruko@admin.com', fullName: 'Admin RH', role: 'super_admin', direction: 'Cabinet', status: 'Actif' },
  { username: 'manager.rh@gouv.gn', fullName: 'Manager RH', role: 'hr_manager', direction: 'Direction RH', status: 'Actif' },
  { username: 'chef.service@gouv.gn', fullName: 'Chef Service', role: 'manager', direction: 'Direction RH', status: 'Actif' },
  { username: 'agent.rh@gouv.gn', fullName: 'Agent RH', role: 'agent', direction: 'Direction RH', status: 'Actif' },
  { username: 'aminata.diallo@gouv.gn', fullName: 'Aminata Diallo', role: 'agent', direction: 'Direction RH', status: 'Actif' },
  { username: 'mamadou.camara@gouv.gn', fullName: 'Mamadou Camara', role: 'agent', direction: 'Direction RH', status: 'Actif' },
];

const adminRoles = [
  { name: 'super_admin', description: 'Acces complet plateforme', permissions: 32 },
  { name: 'hr_manager', description: 'Pilotage RH global', permissions: 18 },
  { name: 'manager', description: 'Gestion equipe', permissions: 9 },
  { name: 'agent', description: 'Portail agent', permissions: 5 },
];

const adminAuditLogs = [
  { date: '2026-03-22T08:20:00.000Z', user: 'spruko@admin.com', action: 'ROLE_UPDATE', target: 'manager.rh@gouv.gn' },
  { date: '2026-03-22T10:40:00.000Z', user: 'manager.rh@gouv.gn', action: 'APPROVAL_BATCH', target: 'ABS-2026-001' },
  { date: '2026-03-22T14:15:00.000Z', user: 'spruko@admin.com', action: 'USER_CREATE', target: 'agent.new@gouv.gn' },
  { date: '2026-03-23T07:55:00.000Z', user: 'chef.service@gouv.gn', action: 'WORKFLOW_ESCALATION', target: 'WFI-2026-003' },
];

const workflowDefinitions = [
  {
    code: 'WF-CONGE',
    name: 'Validation conges annuels',
    steps: 3,
    usedFor: 'Absences',
    status: 'Actif',
    slaTargetHours: 48,
    autoEscalation: true,
  },
  {
    code: 'WF-RECRUT',
    name: 'Circuit de recrutement',
    steps: 4,
    usedFor: 'Recrutement',
    status: 'Actif',
    slaTargetHours: 72,
    autoEscalation: true,
  },
  {
    code: 'WF-DISC',
    name: 'Instruction disciplinaire',
    steps: 5,
    usedFor: 'Discipline',
    status: 'Actif',
    slaTargetHours: 96,
    autoEscalation: false,
  },
];

const workflowInstances = [
  {
    id: 'WFI-2026-001',
    definition: 'Validation conges annuels',
    requester: 'Aminata Diallo',
    createdOn: hoursFromNow(-24),
    currentStep: 'Validation niveau 2',
    status: 'EN_COURS',
    priority: 'Normale',
    dueOn: hoursFromNow(18),
    owner: 'Directeur RH',
    stepsTotal: 3,
    stepsCompleted: 1,
    escalationLevel: 0,
    lastUpdateOn: hoursFromNow(-2),
    timeline: [
      { date: hoursFromNow(-24), actor: 'Systeme', action: 'CREATION', note: '' },
      { date: hoursFromNow(-6), actor: 'Chef service', action: 'APPROUVER', note: 'Conforme' },
    ],
  },
  {
    id: 'WFI-2026-002',
    definition: 'Circuit de recrutement',
    requester: 'Mamadou Camara',
    createdOn: hoursFromNow(-48),
    currentStep: 'Validation niveau 1',
    status: 'EN_ATTENTE',
    priority: 'Haute',
    dueOn: hoursFromNow(-3),
    owner: 'Responsable recrutement',
    stepsTotal: 4,
    stepsCompleted: 0,
    escalationLevel: 1,
    lastUpdateOn: hoursFromNow(-4),
    timeline: [{ date: hoursFromNow(-48), actor: 'Systeme', action: 'CREATION', note: '' }],
  },
  {
    id: 'WFI-2026-003',
    definition: 'Instruction disciplinaire',
    requester: 'Ibrahima Conde',
    createdOn: hoursFromNow(-10),
    currentStep: 'Validation niveau 1',
    status: 'EN_ATTENTE',
    priority: 'Critique',
    dueOn: hoursFromNow(6),
    owner: 'Cellule juridique',
    stepsTotal: 5,
    stepsCompleted: 0,
    escalationLevel: 0,
    lastUpdateOn: hoursFromNow(-1),
    timeline: [{ date: hoursFromNow(-10), actor: 'Systeme', action: 'CREATION', note: '' }],
  },
  {
    id: 'WFI-2026-004',
    definition: 'Validation conges annuels',
    requester: 'Saran Bah',
    createdOn: hoursFromNow(-72),
    currentStep: 'Termine',
    status: 'APPROUVE',
    priority: 'Basse',
    dueOn: hoursFromNow(-24),
    owner: 'Directeur RH',
    stepsTotal: 3,
    stepsCompleted: 3,
    escalationLevel: 0,
    lastUpdateOn: hoursFromNow(-20),
    timeline: [
      { date: hoursFromNow(-72), actor: 'Systeme', action: 'CREATION', note: '' },
      { date: hoursFromNow(-20), actor: 'Directeur RH', action: 'APPROUVER', note: 'Valide' },
    ],
  },
];

const workflowAutomationState = {
  enabled: false,
  intervalSeconds: 45,
  lastRunAt: null,
  totalCycles: 0,
  escalationsExecuted: 0,
  notificationsSent: 0,
  channels: {
    email: {
      enabled: true,
      recipients: ['drh@gouv.gn', 'ops.rh@gouv.gn'],
    },
    teams: {
      enabled: false,
      webhookUrl: 'https://teams.example/webhook/rh-ops',
      channelName: 'RH-OPS',
    },
  },
};

const workflowAutomationPolicy = {
  weights: {
    priorityCritique: 35,
    priorityHaute: 22,
    slaBreached: 38,
    slaWarning: 18,
    overdueHours: 12,
    agingHours: 10,
    escalationLevel: 8,
    remainingSteps: 6,
  },
  thresholds: {
    notify: 55,
    n1: 65,
    n2: 80,
    comex: 92,
  },
  owners: {
    n1: 'Responsable RH',
    n2: 'Direction RH',
    comex: 'COMEX RH',
  },
};

const workflowAutomationEvents = [];
const workflowEscalationCooldownByInstance = new Map();
const workflowNotificationCooldownByKey = new Map();

const WORKFLOW_EVENT_HISTORY_LIMIT = 150;
const ESCALATION_COOLDOWN_MS = 30 * 60 * 1000;
const NOTIFICATION_COOLDOWN_MS = 15 * 60 * 1000;

let workflowAutomationTimer = null;

function nowToken(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function toStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function uniqueStrings(values) {
  return Array.from(new Set(values));
}

function normalizeRoles(roles) {
  const normalized = toStringArray(roles).map((role) => role.toLowerCase());
  return normalized.length ? uniqueStrings(normalized) : ['hr_manager'];
}

function normalizeScopes(scopes) {
  const normalized = toStringArray(scopes).map((scope) => scope.toLowerCase());
  const resolved = normalized.map((scope) => SCOPE_ALIASES[scope]).filter(Boolean);
  if (!resolved.length) {
    return [];
  }

  const unique = uniqueStrings(resolved);
  if (unique.includes(APP_SCOPES.GLOBAL)) {
    return [APP_SCOPES.GLOBAL];
  }

  return unique;
}

function resolvePermissions(roles, explicitPermissions) {
  const normalizedRoles = normalizeRoles(roles);
  const normalizedPermissions = toStringArray(explicitPermissions);
  if (normalizedPermissions.includes('*')) {
    return ['*'];
  }

  const rolePermissions = normalizedRoles.flatMap((role) => ROLE_PERMISSIONS[role] || []);
  if (rolePermissions.includes('*')) {
    return ['*'];
  }

  return uniqueStrings([...rolePermissions, ...normalizedPermissions]);
}

function resolveScopes(roles, explicitScopes) {
  const normalizedRoles = normalizeRoles(roles);
  const roleScopes = normalizedRoles.flatMap((role) => ROLE_SCOPES[role] || []);
  const merged = [...roleScopes, ...normalizeScopes(explicitScopes)];
  const unique = uniqueStrings(merged);

  if (unique.includes(APP_SCOPES.GLOBAL)) {
    return [APP_SCOPES.GLOBAL];
  }

  return unique;
}

function buildScopeAssignments(source, scopes) {
  const assignments = [];
  const username = String(source?.username || '').trim();
  const fullName = String(source?.fullName || '').trim();
  const direction = String(source?.direction || '').trim();
  const unit = String(source?.unit || '').trim();

  if (scopes.includes(APP_SCOPES.GLOBAL)) {
    assignments.push({ scope: APP_SCOPES.GLOBAL });
    return assignments;
  }

  if (scopes.includes(APP_SCOPES.SELF) && username) {
    assignments.push({ scope: APP_SCOPES.SELF, username });
  }

  if (scopes.includes(APP_SCOPES.TEAM)) {
    assignments.push({
      scope: APP_SCOPES.TEAM,
      manager: fullName || username,
      direction,
      unit,
    });
  }

  if (scopes.includes(APP_SCOPES.UNIT) && unit) {
    assignments.push({ scope: APP_SCOPES.UNIT, unit, direction });
  }

  if (scopes.includes(APP_SCOPES.DIRECTION) && direction) {
    assignments.push({ scope: APP_SCOPES.DIRECTION, direction });
  }

  return assignments;
}

function makePrincipal(source) {
  const username = String(source?.username || '').trim();
  const fullName = String(source?.fullName || '').trim() || username;
  const roles = normalizeRoles(source?.roles);
  const permissions = resolvePermissions(roles, source?.permissions);
  const scopes = resolveScopes(roles, source?.scopes);
  const scopeAssignments = buildScopeAssignments(source, scopes);

  return {
    username,
    fullName,
    roles,
    permissions,
    scopes,
    scopeAssignments,
  };
}

function buildAuthResponse(sessionResult) {
  const { accessToken, refreshToken, principal, accessTokenExpiresAt, refreshTokenExpiresAt } = sessionResult;
  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: Math.max(1, Math.floor((accessTokenExpiresAt - Date.now()) / 1000)),
    refreshExpiresIn: Math.max(1, Math.floor((refreshTokenExpiresAt - Date.now()) / 1000)),
    username: principal.username,
    roles: principal.roles,
    permissions: principal.permissions,
    scopes: principal.scopes,
    access: {
      roles: principal.roles,
      permissions: principal.permissions,
      scopes: principal.scopes,
      scopeAssignments: principal.scopeAssignments,
    },
    user: {
      username: principal.username,
      email: principal.username,
      fullName: principal.fullName,
      roles: principal.roles,
      permissions: principal.permissions,
      scopes: principal.scopes,
      scopeAssignments: principal.scopeAssignments,
    },
  };
}

function purgeExpiredSessions(referenceTime = Date.now()) {
  for (const [token, session] of accessSessions.entries()) {
    if (Number(session.expiresAt || 0) <= referenceTime) {
      accessSessions.delete(token);
    }
  }

  for (const [token, session] of refreshSessions.entries()) {
    if (Number(session.expiresAt || 0) <= referenceTime) {
      refreshSessions.delete(token);
    }
  }
}

function issueSession(sourceUser) {
  purgeExpiredSessions();
  const principal = makePrincipal(sourceUser);
  const issuedAt = Date.now();
  const accessToken = nowToken('mock-token');
  const refreshToken = nowToken('mock-refresh');
  const accessTokenExpiresAt = issuedAt + ACCESS_TOKEN_TTL_MS;
  const refreshTokenExpiresAt = issuedAt + REFRESH_TOKEN_TTL_MS;

  accessSessions.set(accessToken, {
    ...principal,
    issuedAt,
    expiresAt: accessTokenExpiresAt,
    refreshToken,
  });
  refreshSessions.set(refreshToken, {
    ...principal,
    issuedAt,
    expiresAt: refreshTokenExpiresAt,
    accessToken,
  });

  return {
    accessToken,
    refreshToken,
    principal,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
}

function extractBearerToken(req) {
  const header = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const value = String(header || '').trim();
  if (!value) {
    return '';
  }

  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match ? match[1].trim() : '';
}

function authenticateRequest(req, res) {
  purgeExpiredSessions();
  const accessToken = extractBearerToken(req);
  if (!accessToken) {
    sendApiError(res, 401, 'AUTH_TOKEN_MISSING', "Token d'acces manquant");
    return null;
  }

  const session = accessSessions.get(accessToken);
  if (!session) {
    sendApiError(res, 401, 'AUTH_TOKEN_INVALID', "Token d'acces invalide");
    return null;
  }

  if (Number(session.expiresAt || 0) <= Date.now()) {
    accessSessions.delete(accessToken);
    sendApiError(res, 401, 'AUTH_TOKEN_EXPIRED', "Token d'acces expire");
    return null;
  }

  return {
    accessToken,
    session,
  };
}

function hasAnyRole(session, requiredRoles = []) {
  if (!requiredRoles.length) {
    return true;
  }

  const userRoles = normalizeRoles(session.roles);
  if (userRoles.includes('super_admin')) {
    return true;
  }

  return requiredRoles.some((role) => userRoles.includes(String(role || '').toLowerCase()));
}

function hasAnyPermission(session, requiredPermissions = []) {
  if (!requiredPermissions.length) {
    return true;
  }

  const permissions = toStringArray(session.permissions);
  if (permissions.includes('*')) {
    return true;
  }

  return requiredPermissions.some((permission) => permissions.includes(String(permission || '').trim()));
}

function hasAllPermissions(session, requiredPermissions = []) {
  if (!requiredPermissions.length) {
    return true;
  }

  const permissions = toStringArray(session.permissions);
  if (permissions.includes('*')) {
    return true;
  }

  return requiredPermissions.every((permission) => permissions.includes(String(permission || '').trim()));
}

function hasAnyScope(session, requiredScopes = []) {
  if (!requiredScopes.length) {
    return true;
  }

  const userScopes = normalizeScopes(session.scopes);
  if (userScopes.includes(APP_SCOPES.GLOBAL)) {
    return true;
  }

  const expectedScopes = toStringArray(requiredScopes)
    .map((scope) => SCOPE_ALIASES[String(scope || '').toLowerCase()])
    .filter((scope) => !!scope);
  if (!expectedScopes.length) {
    return true;
  }

  return expectedScopes.some((scope) => userScopes.includes(scope));
}

function ensureAccess(res, session, requirements = {}) {
  const requiredRoles = toStringArray(requirements.requiredRoles);
  const requiredAnyPermissions = toStringArray(requirements.requiredAnyPermissions);
  const requiredAllPermissions = toStringArray(requirements.requiredAllPermissions);
  const requiredAnyScopes = toStringArray(requirements.requiredAnyScopes);

  if (
    hasAnyRole(session, requiredRoles) &&
    hasAnyPermission(session, requiredAnyPermissions) &&
    hasAllPermissions(session, requiredAllPermissions) &&
    hasAnyScope(session, requiredAnyScopes)
  ) {
    return true;
  }

  sendApiError(
    res,
    403,
    'AUTH_FORBIDDEN',
    'Acces refuse',
    {
      requiredRoles,
      requiredAnyPermissions,
      requiredAllPermissions,
      requiredAnyScopes,
      actualRoles: normalizeRoles(session.roles),
      actualPermissions: toStringArray(session.permissions),
      actualScopes: normalizeScopes(session.scopes),
    }
  );
  return false;
}

function resolveRouteAccessRequirements(method, path) {
  const isRead = method === 'GET' || method === 'HEAD';

  if (path.startsWith('/api/v1/dashboard/')) {
    return { requiredAnyPermissions: [APP_PERMISSIONS.dashboardView] };
  }

  if (path.startsWith('/api/v1/personnel/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.personnelView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.personnelManage],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/leave/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.leaveView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.leaveManage],
      requiredAnyScopes: [APP_SCOPES.SELF, APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/organization/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.organizationView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.organizationManage],
      requiredAnyScopes: [APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/recruitment/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.recruitmentView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.recruitmentManage],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/careers/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.careersView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.careersManage],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/performance/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.performanceView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.performanceManage],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/training/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.trainingView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.trainingManage],
      requiredAnyScopes: [APP_SCOPES.SELF, APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/discipline/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.disciplineView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.disciplineManage],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/documents/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.documentsView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.documentsManage],
      requiredAnyScopes: [APP_SCOPES.SELF, APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/notifications/')) {
    if (isRead) {
      return {
        requiredAnyPermissions: [APP_PERMISSIONS.documentsView, APP_PERMISSIONS.portalAgent, APP_PERMISSIONS.portalManager],
        requiredAnyScopes: [APP_SCOPES.SELF, APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
      };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.documentsManage, APP_PERMISSIONS.portalAgent, APP_PERMISSIONS.portalManager],
      requiredAnyScopes: [APP_SCOPES.SELF, APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/workflows/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.workflowsView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.workflowsManage],
      requiredAnyScopes: [APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/reports/')) {
    if (isRead) {
      return { requiredAnyPermissions: [APP_PERMISSIONS.reportsView] };
    }
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.reportsExport],
      requiredAnyScopes: [APP_SCOPES.TEAM, APP_SCOPES.UNIT, APP_SCOPES.DIRECTION, APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/admin/users')) {
    if (isRead) {
      return {
        requiredAnyPermissions: [APP_PERMISSIONS.adminView, APP_PERMISSIONS.adminUsersManage],
        requiredAnyScopes: [APP_SCOPES.GLOBAL],
      };
    }
    return {
      requiredAllPermissions: [APP_PERMISSIONS.adminUsersManage],
      requiredAnyScopes: [APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/admin/roles')) {
    if (isRead) {
      return {
        requiredAnyPermissions: [APP_PERMISSIONS.adminView, APP_PERMISSIONS.adminRolesManage],
        requiredAnyScopes: [APP_SCOPES.GLOBAL],
      };
    }
    return {
      requiredAllPermissions: [APP_PERMISSIONS.adminRolesManage],
      requiredAnyScopes: [APP_SCOPES.GLOBAL],
    };
  }

  if (path.startsWith('/api/v1/admin/audit-logs')) {
    return {
      requiredAnyPermissions: [APP_PERMISSIONS.adminAuditView],
      requiredAnyScopes: [APP_SCOPES.GLOBAL],
    };
  }

  return null;
}

function ensureRoles(res, session, requiredRoles = []) {
  return ensureAccess(res, session, { requiredRoles });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-Id',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Expose-Headers': 'X-Correlation-Id',
  });
  res.end(JSON.stringify(data));
}

function sendApiError(res, statusCode, code, message, detail) {
  const payload = {
    status: statusCode,
    code,
    message,
  };
  if (detail !== undefined) {
    payload.detail = detail;
    if (Array.isArray(detail)) {
      payload.errors = detail;
    } else if (typeof detail === 'object' && detail !== null && Array.isArray(detail.errors)) {
      payload.errors = detail.errors;
    }
  }

  const requestId = String(res.getHeader('X-Correlation-Id') || '').trim();
  if (requestId) {
    payload.requestId = requestId;
  }

  sendJson(res, statusCode, payload);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function readRawBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalSize = 0;
    let settled = false;

    req.on('data', (chunk) => {
      if (settled) {
        return;
      }

      totalSize += chunk.length;
      if (totalSize > maxBytes) {
        settled = true;
        reject(new Error('Body too large'));
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (error) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    });
  });
}

function extractMultipartBoundary(contentTypeHeader) {
  const contentType = String(contentTypeHeader || '').trim();
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) {
    return '';
  }

  return String(match[1] || match[2] || '').trim();
}

function parseMultipartFile(rawBody, contentTypeHeader) {
  const boundary = extractMultipartBoundary(contentTypeHeader);
  if (!boundary) {
    throw new Error('Boundary multipart manquante');
  }

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from('\r\n\r\n');
  let cursor = 0;

  while (cursor < rawBody.length) {
    const partStart = rawBody.indexOf(boundaryBuffer, cursor);
    if (partStart === -1) {
      break;
    }

    cursor = partStart + boundaryBuffer.length;
    const isClosingBoundary = rawBody[cursor] === 45 && rawBody[cursor + 1] === 45;
    if (isClosingBoundary) {
      break;
    }

    if (rawBody[cursor] === 13 && rawBody[cursor + 1] === 10) {
      cursor += 2;
    }

    const headersEnd = rawBody.indexOf(headerSeparator, cursor);
    if (headersEnd === -1) {
      throw new Error('Multipart invalide');
    }

    const nextBoundary = rawBody.indexOf(boundaryBuffer, headersEnd + headerSeparator.length);
    if (nextBoundary === -1) {
      throw new Error('Multipart invalide');
    }

    const headersText = rawBody.slice(cursor, headersEnd).toString('utf8');
    const fieldNameMatch = /name="([^"]+)"/i.exec(headersText);
    const fileNameMatch = /filename="([^"]*)"/i.exec(headersText);

    let dataEnd = nextBoundary;
    if (rawBody[dataEnd - 2] === 13 && rawBody[dataEnd - 1] === 10) {
      dataEnd -= 2;
    }
    const fileBuffer = rawBody.slice(headersEnd + headerSeparator.length, dataEnd);
    cursor = nextBoundary;

    if (!fieldNameMatch || !fileNameMatch) {
      continue;
    }

    const mimeTypeMatch = /content-type:\s*([^\r\n;]+)/i.exec(headersText);
    return {
      fieldName: String(fieldNameMatch[1] || '').trim(),
      fileName: String(fileNameMatch[1] || '').trim(),
      mimeType: String(mimeTypeMatch?.[1] || '').trim().toLowerCase(),
      data: fileBuffer,
    };
  }

  throw new Error('Aucun fichier trouve dans le formulaire');
}

function sanitizeUploadFileName(fileName) {
  const candidate = pathModule.basename(String(fileName || '').trim());
  const normalized = candidate
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_\.]+/, '')
    .slice(0, 180);
  return normalized || 'document';
}

function resolveUploadExtension(fileName, mimeType) {
  const extensionFromName = pathModule.extname(String(fileName || '')).toLowerCase();
  if (ALLOWED_UPLOAD_EXTENSIONS.has(extensionFromName)) {
    return extensionFromName;
  }

  const normalizedMimeType = String(mimeType || '').toLowerCase();
  const extensionFromMimeType = UPLOAD_EXTENSION_BY_MIME[normalizedMimeType] || '';
  if (ALLOWED_UPLOAD_EXTENSIONS.has(extensionFromMimeType)) {
    return extensionFromMimeType;
  }

  return '';
}

function resolveUploadMimeType(mimeType, extension) {
  const normalizedMimeType = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (ALLOWED_UPLOAD_MIME_TYPES.has(normalizedMimeType) && normalizedMimeType !== 'application/octet-stream') {
    return normalizedMimeType;
  }

  return UPLOAD_MIME_BY_EXTENSION[extension] || 'application/octet-stream';
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

function normalizeRouteMatchPath(pathname) {
  const raw = String(pathname || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  return normalizePath(raw).toLowerCase();
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isLikelyDateString(value) {
  return typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value);
}

function toComparable(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (isLikelyDateString(value)) {
    const timestamp = Date.parse(value);
    if (!Number.isNaN(timestamp)) {
      return timestamp;
    }
  }
  return normalizeText(value);
}

function applyStringFilter(items, url, queryParam, field) {
  const raw = url.searchParams.get(queryParam);
  if (!raw) return items;
  const expected = normalizeText(raw);
  return items.filter((item) => normalizeText(item[field]).includes(expected));
}

function applyCollectionQuery(items, url, options = {}) {
  const {
    searchFields = [],
    defaultSortBy = '',
    defaultSortOrder = 'asc',
    defaultLimit = 50,
    maxLimit = 200,
  } = options;

  let next = [...items];

  const search = normalizeText(url.searchParams.get('q'));
  if (search && searchFields.length) {
    next = next.filter((item) =>
      searchFields.some((field) => normalizeText(item[field]).includes(search))
    );
  }

  const sortBy = String(url.searchParams.get('sortBy') || defaultSortBy || '').trim();
  const sortOrderRaw = normalizeText(url.searchParams.get('sortOrder') || defaultSortOrder || 'asc');
  const sortOrder = sortOrderRaw === 'desc' ? 'desc' : 'asc';
  if (sortBy) {
    next.sort((left, right) => {
      const leftValue = toComparable(left[sortBy]);
      const rightValue = toComparable(right[sortBy]);
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });
  }

  const limit = toSafeInteger(Number(url.searchParams.get('limit') || defaultLimit), defaultLimit, 1, maxLimit);
  const page = toSafeInteger(Number(url.searchParams.get('page') || 1), 1, 1, 5000);
  const offset = (page - 1) * limit;

  return next.slice(offset, offset + limit);
}

function findAgent(id) {
  return agents.find((a) => a.id === id);
}

function extractMatriculeNumber(value) {
  const match = /^PRM-(\d{4,8})$/i.exec(String(value || '').trim());
  if (!match) return Number.NaN;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function buildAgentMatriculeSuggestion(direction, unit) {
  const normalizedDirection = normalizeText(direction);
  const normalizedUnit = normalizeText(unit);

  const scoped = agents.filter((agent) => {
    if (!normalizedDirection) {
      return false;
    }
    if (normalizeText(agent.direction) !== normalizedDirection) {
      return false;
    }
    if (!normalizedUnit) {
      return true;
    }
    return normalizeText(agent.unit) === normalizedUnit;
  });

  const scopeAgents = scoped.length > 0 ? scoped : agents;
  const highest = scopeAgents.reduce((max, agent) => {
    const value = extractMatriculeNumber(agent.matricule);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  const nextNumber = highest + 1;
  const matricule = `PRM-${String(nextNumber).padStart(4, '0')}`;
  const basedOn = normalizedDirection
    ? normalizedUnit
      ? 'Direction+Unite'
      : 'Direction'
    : 'Global';
  const scopeLabel = basedOn === 'Direction+Unite'
    ? `${String(direction || '').trim()} / ${String(unit || '').trim()}`
    : basedOn === 'Direction'
      ? String(direction || '').trim()
      : 'Global';

  return {
    matricule,
    scopeLabel: scopeLabel || 'Global',
    basedOn,
    nextNumber,
  };
}

function normalizeDuplicateCaseField(value) {
  const normalized = normalizeText(value);
  if (normalized === 'email') return 'email';
  if (normalized === 'identitynumber' || normalized === 'identity_number') return 'identityNumber';
  return 'fullName';
}

function duplicateCaseConfidence(field) {
  if (field === 'identityNumber') return 99;
  if (field === 'email') return 96;
  return 72;
}

function toAgentDuplicateSummary(agent) {
  return {
    id: String(agent.id || '').trim(),
    matricule: String(agent.matricule || '').trim(),
    fullName: String(agent.fullName || '').trim(),
    direction: String(agent.direction || '').trim(),
    unit: String(agent.unit || '').trim(),
    position: String(agent.position || '').trim(),
    status: String(agent.status || '').trim(),
    manager: String(agent.manager || '').trim(),
    email: String(agent.email || '').trim(),
    identityNumber: String(agent.identity?.identityNumber || '').trim(),
    phone: String(agent.phone || '').trim(),
    contractType: String(agent.administrative?.contractType || '').trim(),
  };
}

function buildAgentDuplicateCases() {
  const buckets = {
    email: new Map(),
    identityNumber: new Map(),
    fullName: new Map(),
  };

  agents.forEach((agent) => {
    const normalizedEmail = normalizeText(agent.email || '');
    if (normalizedEmail) {
      const current = buckets.email.get(normalizedEmail) || [];
      current.push(agent);
      buckets.email.set(normalizedEmail, current);
    }

    const normalizedIdentity = normalizeText(agent.identity?.identityNumber || '');
    if (normalizedIdentity) {
      const current = buckets.identityNumber.get(normalizedIdentity) || [];
      current.push(agent);
      buckets.identityNumber.set(normalizedIdentity, current);
    }

    const normalizedName = normalizeText(agent.fullName || '');
    if (normalizedName.length >= 4) {
      const current = buckets.fullName.get(normalizedName) || [];
      current.push(agent);
      buckets.fullName.set(normalizedName, current);
    }
  });

  const createdAt = new Date().toISOString();
  const cases = [];
  const fields = ['email', 'identityNumber', 'fullName'];
  fields.forEach((field) => {
    buckets[field].forEach((members, key) => {
      if (!Array.isArray(members) || members.length < 2) {
        return;
      }
      const sortedMembers = [...members].sort((left, right) => {
        const leftKey = `${String(left.fullName || '').toLowerCase()}-${String(left.matricule || '').toLowerCase()}`;
        const rightKey = `${String(right.fullName || '').toLowerCase()}-${String(right.matricule || '').toLowerCase()}`;
        return leftKey.localeCompare(rightKey);
      });
      const duplicateValue = field === 'email'
        ? String(sortedMembers[0]?.email || '').trim()
        : field === 'identityNumber'
          ? String(sortedMembers[0]?.identity?.identityNumber || '').trim()
          : String(sortedMembers[0]?.fullName || '').trim();
      if (!duplicateValue) {
        return;
      }

      const compactKey = String(key || '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 22)
        .toUpperCase();
      const code = field === 'email' ? 'EML' : field === 'identityNumber' ? 'IDN' : 'NAM';
      const reference = `DUP-${code}-${compactKey || 'CASE'}-${String(sortedMembers.length).padStart(2, '0')}`;
      cases.push({
        reference,
        duplicateField: field,
        duplicateValue,
        confidenceScore: duplicateCaseConfidence(field),
        impactedCount: sortedMembers.length,
        createdAt,
        agents: sortedMembers.map((agent) => toAgentDuplicateSummary(agent)),
      });
    });
  });

  cases.sort((left, right) => {
    if (left.confidenceScore !== right.confidenceScore) {
      return right.confidenceScore - left.confidenceScore;
    }
    if (left.impactedCount !== right.impactedCount) {
      return right.impactedCount - left.impactedCount;
    }
    return String(left.duplicateValue || '').localeCompare(String(right.duplicateValue || ''));
  });

  return cases;
}

function getAgentMergeFieldValue(agent, field) {
  if (!agent || typeof agent !== 'object') {
    return '';
  }
  if (field === 'identityNumber') {
    return String(agent.identity?.identityNumber || '').trim();
  }
  if (field === 'contractType') {
    return String(agent.administrative?.contractType || '').trim();
  }
  return String(agent[field] || '').trim();
}

function normalizeAgentMergeFieldSource(value) {
  return value === 'secondary' ? 'secondary' : 'primary';
}

function validateAgentMergePayload(body) {
  const errors = [];
  const safeBody = body && typeof body === 'object' ? body : {};
  const reference = String(safeBody.reference || '').trim().toUpperCase();
  const primaryAgentId = String(safeBody.primaryAgentId || safeBody.primary_agent_id || '').trim();
  const secondaryAgentId = String(safeBody.secondaryAgentId || safeBody.secondary_agent_id || '').trim();
  const reason = String(safeBody.reason || 'fusion_doublon').trim() || 'fusion_doublon';
  const allowedFields = new Set([
    'matricule',
    'fullName',
    'direction',
    'unit',
    'position',
    'status',
    'manager',
    'email',
    'phone',
    'identityNumber',
    'contractType',
  ]);

  if (!primaryAgentId) {
    errors.push('Agent principal requis');
  }
  if (!secondaryAgentId) {
    errors.push('Agent secondaire requis');
  }
  if (primaryAgentId && secondaryAgentId && primaryAgentId === secondaryAgentId) {
    errors.push('Agents de fusion invalides (identiques)');
  }
  if (reason.length < 3) {
    errors.push('Motif fusion requis');
  }

  const primaryAgent = primaryAgentId ? findAgent(primaryAgentId) : null;
  const secondaryAgent = secondaryAgentId ? findAgent(secondaryAgentId) : null;
  if (primaryAgentId && !primaryAgent) {
    errors.push('Agent principal introuvable');
  }
  if (secondaryAgentId && !secondaryAgent) {
    errors.push('Agent secondaire introuvable');
  }

  const fieldSourcesRaw = safeBody.fieldSources && typeof safeBody.fieldSources === 'object'
    ? safeBody.fieldSources
    : {};
  const fieldSources = {};
  Object.keys(fieldSourcesRaw).forEach((field) => {
    if (!allowedFields.has(field)) {
      return;
    }
    fieldSources[field] = normalizeAgentMergeFieldSource(fieldSourcesRaw[field]);
  });

  return {
    errors,
    payload: {
      reference: reference || null,
      primaryAgentId,
      secondaryAgentId,
      reason,
      fieldSources,
      primaryAgent,
      secondaryAgent,
    },
  };
}

function mergeAgentDocumentLists(primaryDocuments, secondaryDocuments) {
  const merged = [
    ...normalizeAgentDocumentsPayload(primaryDocuments),
    ...normalizeAgentDocumentsPayload(secondaryDocuments),
  ];
  const byKey = new Map();
  merged.forEach((document) => {
    const key = `${normalizeText(document.type)}:${normalizeText(document.reference)}`;
    if (!key || key === ':') {
      return;
    }
    byKey.set(key, document);
  });
  return Array.from(byKey.values());
}

function mergeAgentEducationLists(primaryEducations, secondaryEducations) {
  const merged = [
    ...normalizeAgentEducationsPayload(primaryEducations),
    ...normalizeAgentEducationsPayload(secondaryEducations),
  ];
  const byKey = new Map();
  merged.forEach((education) => {
    const key = `${normalizeText(education.degree)}:${normalizeText(education.institution)}:${normalizeText(education.graduationYear)}`;
    if (!key || key === '::') {
      return;
    }
    byKey.set(key, education);
  });
  return Array.from(byKey.values());
}

function isAgentAliasMatch(candidate, aliases) {
  const normalizedCandidate = normalizeText(candidate);
  if (!normalizedCandidate) {
    return false;
  }
  return aliases.some((alias) => {
    if (!alias) return false;
    return (
      normalizedCandidate === alias ||
      normalizedCandidate.includes(alias) ||
      alias.includes(normalizedCandidate)
    );
  });
}

function executeAgentMerge(payload, currentUser) {
  const mergeTimestamp = new Date().toISOString();
  const primaryAgent = payload.primaryAgent;
  const secondaryAgent = payload.secondaryAgent;
  const beforePrimarySnapshot = buildAgentAuditSnapshot(primaryAgent);
  const fieldSources = payload.fieldSources || {};
  const allFields = [
    'matricule',
    'fullName',
    'direction',
    'unit',
    'position',
    'status',
    'manager',
    'email',
    'phone',
    'identityNumber',
    'contractType',
  ];

  allFields.forEach((field) => {
    const source = normalizeAgentMergeFieldSource(fieldSources[field] || 'primary');
    const preferred = source === 'secondary' ? secondaryAgent : primaryAgent;
    const fallback = source === 'secondary' ? primaryAgent : secondaryAgent;
    const nextValue = getAgentMergeFieldValue(preferred, field) || getAgentMergeFieldValue(fallback, field);

    if (field === 'identityNumber') {
      primaryAgent.identity = normalizeAgentIdentityPayload({
        ...(primaryAgent.identity || {}),
        identityNumber: nextValue,
      });
      return;
    }

    if (field === 'contractType') {
      primaryAgent.administrative = normalizeAgentAdministrativePayload({
        ...(primaryAgent.administrative || {}),
        contractType: nextValue,
      });
      return;
    }

    primaryAgent[field] = nextValue;
  });

  primaryAgent.educations = mergeAgentEducationLists(primaryAgent.educations, secondaryAgent.educations);
  primaryAgent.documents = mergeAgentDocumentLists(primaryAgent.documents, secondaryAgent.documents);
  primaryAgent.careerEvents = normalizeAgentCareerEventsPayload([
    {
      title: 'Fusion doublon',
      description: `Fusion de ${String(secondaryAgent.matricule || secondaryAgent.id || '').trim()} vers ${String(primaryAgent.matricule || primaryAgent.id || '').trim()} (${payload.reason})`,
      date: mergeTimestamp.slice(0, 10),
    },
    ...(Array.isArray(primaryAgent.careerEvents) ? primaryAgent.careerEvents : []),
    ...(Array.isArray(secondaryAgent.careerEvents) ? secondaryAgent.careerEvents : []),
  ]);

  const mergeAuditChanges = computeAgentAuditChanges(beforePrimarySnapshot, buildAgentAuditSnapshot(primaryAgent));
  mergeAuditChanges.unshift({
    field: 'merge',
    label: 'Fusion doublon',
    before: String(secondaryAgent.matricule || secondaryAgent.id || '').trim(),
    after: String(primaryAgent.matricule || primaryAgent.id || '').trim(),
  });

  appendAgentAuditEvent({
    agentId: primaryAgent.id,
    agentLabel: primaryAgent.fullName,
    changedAt: mergeTimestamp,
    changedBy: String(currentUser?.username || 'system').trim() || 'system',
    source: 'merge',
    reason: String(payload.reason || 'fusion_doublon').trim() || 'fusion_doublon',
    changes: mergeAuditChanges,
  });

  const aliases = [secondaryAgent.id, secondaryAgent.matricule, secondaryAgent.fullName]
    .map((value) => normalizeText(value))
    .filter((value) => !!value);

  let reassignedDossiers = 0;
  personnelDossiers.forEach((item) => {
    if (!isAgentAliasMatch(item.agent, aliases)) {
      return;
    }
    item.agent = String(primaryAgent.fullName || '').trim();
    item.updatedAt = mergeTimestamp;
    reassignedDossiers += 1;
  });

  let reassignedAffectations = 0;
  personnelAffectations.forEach((item) => {
    if (!isAgentAliasMatch(item.agent, aliases)) {
      return;
    }
    item.agent = String(primaryAgent.fullName || '').trim();
    reassignedAffectations += 1;
  });

  const secondaryIndex = agents.findIndex((item) => item.id === secondaryAgent.id);
  if (secondaryIndex >= 0) {
    agents.splice(secondaryIndex, 1);
  }

  const reference = payload.reference || `AG-MERGE-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}`;
  const mergedBy = String(currentUser?.username || 'system').trim() || 'system';

  return {
    reference,
    mergedAt: mergeTimestamp,
    mergedBy,
    primaryAgentId: primaryAgent.id,
    secondaryAgentId: secondaryAgent.id,
    removedAgentId: secondaryAgent.id,
    keptAgentId: primaryAgent.id,
    mergedAgent: primaryAgent,
    reassignedDossiers,
    reassignedAffectations,
  };
}

function findOrgUnit(id) {
  return orgUnits.find((unit) => unit.id === id);
}

function buildOrgUnitId(name) {
  const normalizedName = String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  const base = normalizedName || 'UNIT';

  let candidate = `ORG-${base}`;
  let suffix = 2;
  while (findOrgUnit(candidate)) {
    candidate = `ORG-${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function validateOrgUnitCreatePayload(body) {
  const errors = [];

  const name = String(body.name || body.label || '').trim();
  const parentId = String(body.parentId || body.parent_id || '').trim();
  const head = String(body.head || body.manager || '').trim();
  const headTitle = String(
    body.headTitle || body.head_title || body.managerTitle || body.manager_title || ''
  ).trim();
  const staffCountRaw = Number(
    body.staffCount ?? body.staff_count ?? body.agentsCount ?? body.agents_count ?? 0
  );
  const staffCount = Number.isFinite(staffCountRaw) ? Math.max(0, Math.round(staffCountRaw)) : 0;

  if (name.length < 2) {
    errors.push('Nom unite requis (2 caracteres minimum)');
  }
  if (parentId && !findOrgUnit(parentId)) {
    errors.push('Unite parente introuvable');
  }
  if (head.length > 120) {
    errors.push('Responsable trop long');
  }
  if (headTitle.length > 120) {
    errors.push('Titre du responsable trop long');
  }
  if (!Number.isFinite(staffCountRaw) || staffCountRaw < 0) {
    errors.push('Effectif invalide');
  }

  if (
    name &&
    orgUnits.some(
      (unit) =>
        normalizeText(unit.name) === normalizeText(name) &&
        String(unit.parentId || '') === String(parentId || '')
    )
  ) {
    errors.push('Une unite avec ce nom existe deja a ce niveau');
  }

  return {
    errors,
    payload: {
      name,
      parentId: parentId || null,
      head: head || '',
      headTitle: headTitle || '',
      staffCount,
    },
  };
}

function createsOrgHierarchyCycle(unitId, parentId) {
  let cursor = String(parentId || '').trim();
  const visited = new Set([String(unitId || '').trim()]);

  while (cursor) {
    if (visited.has(cursor)) {
      return true;
    }

    visited.add(cursor);
    const parent = findOrgUnit(cursor);
    if (!parent) {
      return false;
    }
    cursor = String(parent.parentId || '').trim();
  }

  return false;
}

function validateOrgUnitUpdatePayload(body, currentUnit) {
  const errors = [];

  const name = String(body.name || body.label || currentUnit?.name || '').trim();
  const parentId = String(body.parentId || body.parent_id || '').trim();
  const head = String(body.head || body.manager || '').trim();
  const headTitle = String(
    body.headTitle || body.head_title || body.managerTitle || body.manager_title || ''
  ).trim();
  const staffCountRaw = Number(
    body.staffCount ?? body.staff_count ?? body.agentsCount ?? body.agents_count ?? currentUnit?.staffCount ?? 0
  );
  const staffCount = Number.isFinite(staffCountRaw) ? Math.max(0, Math.round(staffCountRaw)) : 0;

  if (name.length < 2) {
    errors.push('Nom unite requis (2 caracteres minimum)');
  }
  if (parentId && !findOrgUnit(parentId)) {
    errors.push('Unite parente introuvable');
  }
  if (parentId && parentId === String(currentUnit?.id || '').trim()) {
    errors.push('Une unite ne peut pas etre sa propre parente');
  }
  if (parentId && createsOrgHierarchyCycle(String(currentUnit?.id || '').trim(), parentId)) {
    errors.push('Cycle hierarchique detecte');
  }
  if (head.length > 120) {
    errors.push('Responsable trop long');
  }
  if (headTitle.length > 120) {
    errors.push('Titre du responsable trop long');
  }
  if (!Number.isFinite(staffCountRaw) || staffCountRaw < 0) {
    errors.push('Effectif invalide');
  }

  if (
    name &&
    orgUnits.some(
      (unit) =>
        unit.id !== currentUnit?.id &&
        normalizeText(unit.name) === normalizeText(name) &&
        String(unit.parentId || '') === String(parentId || '')
    )
  ) {
    errors.push('Une unite avec ce nom existe deja a ce niveau');
  }

  return {
    errors,
    payload: {
      name,
      parentId: parentId || null,
      head: head || '',
      headTitle: headTitle || '',
      staffCount,
    },
  };
}

function findBudgetedPosition(code) {
  return budgetedPositions.find((item) => item.code === code);
}

function buildBudgetedPositionCode(structure) {
  const structureCode = String(structure || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12) || 'ORG';

  let sequence = 1;
  let candidate = `PB-${structureCode}-${String(sequence).padStart(3, '0')}`;
  while (findBudgetedPosition(candidate)) {
    sequence += 1;
    candidate = `PB-${structureCode}-${String(sequence).padStart(3, '0')}`;
  }
  return candidate;
}

function validateBudgetedPositionCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const structure = String(body.structure || '').trim();
  const title = String(body.title || body.label || '').trim();
  const grade = String(body.grade || '').trim();
  const statusRaw = String(body.status || 'Ouvert').trim().toLowerCase();
  const status = statusRaw === 'occupe' || statusRaw === 'occupé' ? 'Occupe' : 'Ouvert';
  const holder = String(body.holder || body.holderName || body.holder_name || '').trim();

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code poste invalide');
  }
  if (code && findBudgetedPosition(code)) {
    errors.push('Code poste deja existant');
  }
  if (structure.length < 2) {
    errors.push('Structure requise');
  }
  if (title.length < 2) {
    errors.push('Intitule requis');
  }
  if (!grade) {
    errors.push('Grade requis');
  }
  if (holder.length > 120) {
    errors.push('Titulaire trop long');
  }

  return {
    errors,
    payload: {
      code: code || null,
      structure,
      title,
      grade,
      status,
      holder: holder || '',
    },
  };
}

function findVacantPosition(code) {
  return vacantPositions.find((item) => item.code === code);
}

function buildVacantPositionCode() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^VAC-${year}-(\\d+)$`);
  const maxExisting = vacantPositions.reduce((max, item) => {
    const match = regex.exec(String(item.code || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `VAC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function validateVacantPositionCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const structure = String(body.structure || '').trim();
  const title = String(body.title || body.label || '').trim();
  const grade = String(body.grade || '').trim();
  const openedOn = String(body.openedOn || body.opened_on || body.openDate || body.open_date || '').trim();
  const priorityRaw = String(body.priority || 'Normale').trim().toLowerCase();
  const priority = priorityRaw === 'haute' ? 'Haute' : priorityRaw === 'basse' ? 'Basse' : 'Normale';

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code poste invalide');
  }
  if (code && findVacantPosition(code)) {
    errors.push('Code poste deja existant');
  }
  if (structure.length < 2) {
    errors.push('Structure requise');
  }
  if (title.length < 2) {
    errors.push('Intitule requis');
  }
  if (!grade) {
    errors.push('Grade requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openedOn) || Number.isNaN(Date.parse(openedOn))) {
    errors.push('Date ouverture invalide');
  }

  return {
    errors,
    payload: {
      code: code || null,
      structure,
      title,
      grade,
      openedOn,
      priority,
    },
  };
}

function findRecruitmentApplication(reference) {
  return recruitmentApplications.find((item) => item.reference === reference);
}

function buildRecruitmentApplicationReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^APP-${year}-(\\d+)$`);
  const maxExisting = recruitmentApplications.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `APP-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeRecruitmentApplicationStatus(value, fallback = 'Nouveau') {
  const normalized = normalizeText(value);
  if (normalized === 'nouveau') return 'Nouveau';
  if (normalized === 'preselection' || normalized === 'shortlist') return 'Preselection';
  if (normalized === 'entretien') return 'Entretien';
  if (normalized === 'retenu' || normalized === 'accepte' || normalized === 'accepté' || normalized === 'embauche') {
    return 'Retenu';
  }
  if (normalized === 'rejete' || normalized === 'rejeté') return 'Rejete';
  return fallback;
}

function normalizeRecruitmentApplicationSource(value, fallback = 'Autre') {
  const normalized = normalizeText(value);

  if (
    normalized === 'portailrh' ||
    normalized === 'portail rh' ||
    normalized === 'portail' ||
    normalized === 'sitecarriere' ||
    normalized === 'site carriere'
  ) {
    return 'Portail RH';
  }
  if (
    normalized === 'jobboard' ||
    normalized === 'linkedin' ||
    normalized === 'apec' ||
    normalized === 'indeed' ||
    normalized === 'reseau social' ||
    normalized === 'reseaux sociaux'
  ) {
    return 'Jobboard';
  }
  if (normalized === 'cooptation' || normalized === 'referral' || normalized === 'recommandation') {
    return 'Cooptation';
  }
  if (normalized === 'cabinet' || normalized === 'agence' || normalized === 'chasseur de tete' || normalized === 'chasseurdetete') {
    return 'Cabinet';
  }
  if (normalized === 'interne' || normalized === 'mobilite interne' || normalized === 'mobiliteinterne') {
    return 'Interne';
  }
  if (normalized === 'autre' || normalized === 'other') {
    return 'Autre';
  }
  return fallback;
}

function normalizeRecruitmentCandidateEmail(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (!normalized) {
    return null;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }
  return normalized;
}

function normalizeRecruitmentCandidatePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }
  const digits = raw.replace(/[^\d+]/g, '');
  if (digits.length < 8 || digits.length > 20) {
    return null;
  }
  return digits.startsWith('+') ? digits : `+${digits}`;
}

function normalizeRecruitmentCandidateIdentity(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
  return normalized || null;
}

function normalizeRecruitmentPercentage(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.max(0, Math.min(100, fallback));
  }
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function normalizeRecruitmentExperienceYears(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return Math.max(0, Math.floor(fallback));
  }
  return Math.max(0, Math.floor(parsed));
}

function hashRecruitmentSeed(value) {
  const source = String(value || '');
  let hash = 0;
  for (let index = 0; index < source.length; index += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function deriveRecruitmentPseudoScore(reference, key, min, max) {
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) ? max : 100;
  if (safeMax <= safeMin) {
    return safeMin;
  }
  const spread = safeMax - safeMin + 1;
  const seeded = hashRecruitmentSeed(`${reference || 'APP'}|${key}`);
  return safeMin + (seeded % spread);
}

function normalizeRecruitmentScoringCriterionLabel(key) {
  if (key === 'experienceYears') return 'Experience pertinente';
  if (key === 'skillsMatch') return 'Adequation competences';
  if (key === 'educationLevel') return 'Niveau academique';
  if (key === 'interviewAverage') return 'Evaluation entretien';
  if (key === 'testScore') return 'Score test technique';
  return key;
}

function normalizeRecruitmentScoringCriteria(criteria) {
  const allowedKeys = new Set(['experienceYears', 'skillsMatch', 'educationLevel', 'interviewAverage', 'testScore']);
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return recruitmentScoringPolicy.criteria.map((item) => ({ ...item }));
  }

  const normalized = criteria
    .map((entry) => {
      const key = String(entry?.key || '').trim();
      if (!allowedKeys.has(key)) {
        return null;
      }
      const weightRaw = Number(entry?.weight);
      const weight = Number.isFinite(weightRaw) ? Math.max(1, Math.min(100, Math.round(weightRaw))) : 0;
      const label = String(entry?.label || normalizeRecruitmentScoringCriterionLabel(key)).trim()
        || normalizeRecruitmentScoringCriterionLabel(key);
      const maxYearsRaw = Number(entry?.maxYears);
      const maxYears = Number.isFinite(maxYearsRaw) && maxYearsRaw > 0 ? Math.round(maxYearsRaw) : undefined;
      return {
        key,
        label,
        weight,
        maxYears,
      };
    })
    .filter((entry) => !!entry);

  if (normalized.length === 0) {
    return recruitmentScoringPolicy.criteria.map((item) => ({ ...item }));
  }

  const totalWeight = normalized.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) {
    return recruitmentScoringPolicy.criteria.map((item) => ({ ...item }));
  }

  return normalized.map((item) => ({
    ...item,
    weight: Math.max(1, Math.round((item.weight / totalWeight) * 100)),
  }));
}

function rebalanceRecruitmentScoringCriteria(criteria) {
  const working = Array.isArray(criteria) ? criteria.map((item) => ({ ...item })) : [];
  if (working.length === 0) {
    return [];
  }
  const total = working.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (total <= 0) {
    const evenWeight = Math.floor(100 / working.length);
    let remainder = 100 - evenWeight * working.length;
    return working.map((item) => {
      const weight = evenWeight + (remainder > 0 ? 1 : 0);
      remainder = Math.max(0, remainder - 1);
      return { ...item, weight };
    });
  }
  let remaining = 100;
  const rebalanced = working.map((item, index) => {
    if (index === working.length - 1) {
      return { ...item, weight: Math.max(1, remaining) };
    }
    const ratio = Number(item.weight || 0) / total;
    const weight = Math.max(1, Math.round(ratio * 100));
    remaining -= weight;
    return { ...item, weight };
  });
  if (remaining !== 0) {
    const last = rebalanced[rebalanced.length - 1];
    last.weight = Math.max(1, last.weight + remaining);
  }
  return rebalanced;
}

function scoreRecruitmentApplication(application, scoringCriteria) {
  const criteria = Array.isArray(scoringCriteria) && scoringCriteria.length > 0
    ? scoringCriteria
    : recruitmentScoringPolicy.criteria;
  const reference = String(application?.reference || '').trim().toUpperCase();
  const details = criteria.map((criterion) => {
    if (criterion.key === 'experienceYears') {
      const maxYears = Number.isFinite(criterion.maxYears) && criterion.maxYears > 0
        ? criterion.maxYears
        : 10;
      const inputYears = normalizeRecruitmentExperienceYears(
        application?.experienceYears,
        deriveRecruitmentPseudoScore(reference, 'experienceYears', 1, maxYears)
      );
      const normalizedScore = normalizeRecruitmentPercentage(Math.round((Math.min(maxYears, inputYears) / maxYears) * 100), 0);
      const weightedScore = Math.round((normalizedScore * criterion.weight) / 1000) / 10;
      return {
        criterionKey: criterion.key,
        criterionLabel: criterion.label,
        weight: criterion.weight,
        rawScore: normalizedScore,
        weightedScore,
        justification: `${inputYears} an(s) d experience sur une cible de ${maxYears} an(s).`,
      };
    }

    const fallbackValue = deriveRecruitmentPseudoScore(reference, criterion.key, 45, 92);
    const scoreValue = normalizeRecruitmentPercentage(application?.[criterion.key], fallbackValue);
    const weightedScore = Math.round((scoreValue * criterion.weight) / 1000) / 10;
    let justification = 'Critere evalue automatiquement.';
    if (criterion.key === 'skillsMatch') {
      justification = `Matching competences estime a ${scoreValue}%.`;
    } else if (criterion.key === 'educationLevel') {
      justification = `Niveau academique converti en score ${scoreValue}%.`;
    } else if (criterion.key === 'interviewAverage') {
      justification = scoreValue > 0
        ? `Evaluation entretien moyenne ${scoreValue}%.`
        : 'Entretien non encore conduit, score provisoire.';
    } else if (criterion.key === 'testScore') {
      justification = `Resultat test technique ${scoreValue}%.`;
    }
    return {
      criterionKey: criterion.key,
      criterionLabel: criterion.label,
      weight: criterion.weight,
      rawScore: scoreValue,
      weightedScore,
      justification,
    };
  });

  const totalScore = Math.round(details.reduce((sum, entry) => sum + entry.weightedScore, 0) * 10) / 10;
  return {
    reference,
    candidate: application?.candidate,
    position: application?.position,
    campaign: application?.campaign,
    status: application?.status,
    receivedOn: application?.receivedOn,
    totalScore,
    details,
  };
}

function buildRecruitmentApplicationScores(options = {}) {
  const campaign = String(options?.campaign || '').trim().toLowerCase();
  const position = String(options?.position || '').trim().toLowerCase();
  const includeStatuses = Array.isArray(options?.includeStatuses)
    ? options.includeStatuses
        .map((status) => normalizeRecruitmentApplicationStatus(status, ''))
        .filter((status) => !!status)
    : [];
  const hasStatusFilter = includeStatuses.length > 0;

  const filtered = recruitmentApplications.filter((application) => {
    if (campaign && !String(application?.campaign || '').toLowerCase().includes(campaign)) {
      return false;
    }
    if (position && !String(application?.position || '').toLowerCase().includes(position)) {
      return false;
    }
    if (hasStatusFilter && !includeStatuses.includes(application.status)) {
      return false;
    }
    return true;
  });

  const ranked = filtered
    .map((application) => scoreRecruitmentApplication(application, recruitmentScoringPolicy.criteria))
    .sort((left, right) => {
      if (left.totalScore !== right.totalScore) {
        return right.totalScore - left.totalScore;
      }
      const leftTs = parseRecruitmentReceivedTimestamp(left.receivedOn);
      const rightTs = parseRecruitmentReceivedTimestamp(right.receivedOn);
      const safeLeft = Number.isFinite(leftTs) ? leftTs : 0;
      const safeRight = Number.isFinite(rightTs) ? rightTs : 0;
      return safeRight - safeLeft;
    })
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return ranked;
}

function normalizeRecruitmentDuplicateMode(value) {
  const normalized = normalizeText(value);
  if (normalized === 'merge' || normalized === 'fusion') return 'merge';
  return 'link';
}

function buildRecruitmentIdentityMatchLabel(matchType) {
  if (matchType === 'email') return 'email';
  if (matchType === 'phone') return 'telephone';
  if (matchType === 'identity') return 'identite';
  return matchType;
}

function findRecruitmentPotentialDuplicateMatches(candidateData, currentReference = '') {
  const reference = String(currentReference || '').trim().toUpperCase();
  const email = normalizeRecruitmentCandidateEmail(candidateData?.candidateEmail || candidateData?.email);
  const phone = normalizeRecruitmentCandidatePhone(candidateData?.candidatePhone || candidateData?.phone);
  const identity = normalizeRecruitmentCandidateIdentity(candidateData?.identityNumber || candidateData?.identity);

  if (!email && !phone && !identity) {
    return [];
  }

  return recruitmentApplications
    .filter((item) => String(item.reference || '').trim().toUpperCase() !== reference)
    .map((item) => {
      const itemEmail = normalizeRecruitmentCandidateEmail(item.candidateEmail || item.email);
      const itemPhone = normalizeRecruitmentCandidatePhone(item.candidatePhone || item.phone);
      const itemIdentity = normalizeRecruitmentCandidateIdentity(item.identityNumber || item.identity);
      const matchTypes = [];
      if (email && itemEmail && email === itemEmail) {
        matchTypes.push('email');
      }
      if (phone && itemPhone && phone === itemPhone) {
        matchTypes.push('phone');
      }
      if (identity && itemIdentity && identity === itemIdentity) {
        matchTypes.push('identity');
      }
      if (matchTypes.length === 0) {
        return null;
      }
      return {
        reference: item.reference,
        candidate: item.candidate,
        status: item.status,
        campaign: item.campaign,
        position: item.position,
        matchTypes,
      };
    })
    .filter((item) => !!item);
}

function buildRecruitmentDuplicateCases() {
  const bySignature = new Map();

  recruitmentApplications.forEach((application) => {
    const email = normalizeRecruitmentCandidateEmail(application.candidateEmail || application.email);
    const phone = normalizeRecruitmentCandidatePhone(application.candidatePhone || application.phone);
    const identity = normalizeRecruitmentCandidateIdentity(application.identityNumber || application.identity);
    const signatures = [];
    if (email) signatures.push(`email:${email}`);
    if (phone) signatures.push(`phone:${phone}`);
    if (identity) signatures.push(`identity:${identity}`);

    signatures.forEach((signature) => {
      if (!bySignature.has(signature)) {
        bySignature.set(signature, []);
      }
      bySignature.get(signature).push(application);
    });
  });

  const cases = [];
  bySignature.forEach((applications, signature) => {
    if (!Array.isArray(applications) || applications.length < 2) {
      return;
    }
    const [type, value] = String(signature).split(':');
    const items = applications
      .map((item) => ({
        reference: item.reference,
        candidate: item.candidate,
        status: item.status,
        campaign: item.campaign,
        position: item.position,
      }))
      .sort((left, right) => String(left.reference).localeCompare(String(right.reference)));
    const referenceList = items.map((item) => item.reference).join('|');
    const caseId = `DEDUP-${type.toUpperCase()}-${hashRecruitmentSeed(referenceList)}`;
    cases.push({
      id: caseId,
      matchType: type,
      matchLabel: buildRecruitmentIdentityMatchLabel(type),
      matchValue: value,
      count: items.length,
      applications: items,
      suggestedPrimaryReference: items[0]?.reference,
    });
  });

  cases.sort((left, right) => {
    if (left.count !== right.count) {
      return right.count - left.count;
    }
    return String(left.matchValue || '').localeCompare(String(right.matchValue || ''));
  });
  return cases;
}

function trimRecruitmentShortlistValidationJournal() {
  if (recruitmentShortlistValidations.length <= RECRUITMENT_SHORTLIST_VALIDATION_LIMIT) {
    return;
  }
  recruitmentShortlistValidations.splice(
    0,
    recruitmentShortlistValidations.length - RECRUITMENT_SHORTLIST_VALIDATION_LIMIT
  );
}

function buildRecruitmentShortlistSuggestions(input) {
  const topNCandidate = Number(input?.topN ?? input?.top_n ?? 5);
  const topN = Number.isFinite(topNCandidate) ? Math.max(1, Math.min(30, Math.floor(topNCandidate))) : 5;
  const includeStatusesRaw = Array.isArray(input?.includeStatuses)
    ? input.includeStatuses
    : Array.isArray(input?.include_statuses)
      ? input.include_statuses
      : ['Nouveau', 'Preselection', 'Entretien'];
  const includeStatuses = includeStatusesRaw
    .map((status) => normalizeRecruitmentApplicationStatus(status, ''))
    .filter((status) => !!status);
  const includeStatusesSet = new Set(includeStatuses);

  const scored = buildRecruitmentApplicationScores({
    campaign: input?.campaign,
    position: input?.position,
    includeStatuses: includeStatuses.length > 0 ? includeStatuses : undefined,
  });

  const shortlisted = scored
    .filter((item) => includeStatusesSet.size === 0 || includeStatusesSet.has(item.status))
    .slice(0, topN)
    .map((item) => {
      const strongest = [...item.details]
        .sort((left, right) => right.weightedScore - left.weightedScore)
        .slice(0, 2);
      const strongestReason = strongest
        .map((entry) => `${entry.criterionLabel}: ${entry.rawScore}%`)
        .join(' | ');
      return {
        ...item,
        justification: strongestReason || 'Score global prioritaire',
        validationRequired: true,
        validationStatus: 'PENDING',
      };
    });

  return {
    generatedAt: new Date().toISOString(),
    topN,
    totalCandidates: scored.length,
    suggested: shortlisted,
    criteriaVersion: recruitmentScoringPolicy.updatedAt,
  };
}

function normalizeRecruitmentQuestionList(input) {
  let values = [];
  if (Array.isArray(input)) {
    values = input;
  } else if (typeof input === 'string') {
    values = input.split(/\r?\n/);
  }
  return values
    .map((entry) => String(entry || '').trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.replace(/\s+/g, ' '));
}

function buildRecruitmentQuestionTemplateId(position, version) {
  const normalizedPosition = String(position || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'POSTE';
  return `IQB-${normalizedPosition.slice(0, 40)}-V${version}`;
}

function listRecruitmentInterviewQuestionTemplates(filters = {}) {
  const positionFilter = String(filters?.position || '').trim().toLowerCase();
  const search = String(filters?.q || '').trim().toLowerCase();
  const latestOnly = parseBooleanFlag(filters?.latestOnly ?? filters?.latest_only, false);

  let items = recruitmentInterviewQuestionBank.filter((item) => {
    if (positionFilter && !String(item.position || '').toLowerCase().includes(positionFilter)) {
      return false;
    }
    if (!search) {
      return true;
    }
    return (
      String(item.id || '').toLowerCase().includes(search) ||
      String(item.position || '').toLowerCase().includes(search) ||
      item.questions.some((question) => String(question || '').toLowerCase().includes(search))
    );
  });

  if (latestOnly) {
    const bestByPosition = new Map();
    items.forEach((item) => {
      const key = String(item.position || '').trim().toLowerCase();
      const current = bestByPosition.get(key);
      if (!current || Number(item.version || 0) > Number(current.version || 0)) {
        bestByPosition.set(key, item);
      }
    });
    items = Array.from(bestByPosition.values());
  }

  items.sort((left, right) => {
    if (left.position !== right.position) {
      return String(left.position).localeCompare(String(right.position));
    }
    return Number(right.version || 0) - Number(left.version || 0);
  });
  return items;
}

function validateRecruitmentQuestionTemplatePayload(body, currentUser) {
  const errors = [];
  const position = String(body?.position || body?.positionTitle || body?.position_title || '').trim();
  const questions = normalizeRecruitmentQuestionList(
    body?.questions ?? body?.questionList ?? body?.question_list ?? body?.content
  );

  if (position.length < 2) {
    errors.push('Poste template requis');
  }
  if (questions.length === 0) {
    errors.push('Questions template requises');
  }
  if (questions.length > 80) {
    errors.push('Nombre de questions limite a 80');
  }
  if (questions.some((question) => question.length < 6)) {
    errors.push('Chaque question doit contenir au moins 6 caracteres');
  }
  if (questions.some((question) => question.length > 320)) {
    errors.push('Chaque question est limitee a 320 caracteres');
  }

  const existingSamePosition = recruitmentInterviewQuestionBank.filter(
    (item) => normalizeText(item.position) === normalizeText(position)
  );
  const maxVersion = existingSamePosition.reduce(
    (max, item) => Math.max(max, Number(item.version || 0)),
    0
  );
  const nextVersion = maxVersion + 1;
  const now = new Date().toISOString();

  return {
    errors,
    payload: {
      id: buildRecruitmentQuestionTemplateId(position, nextVersion),
      position,
      version: nextVersion,
      questions,
      createdAt: now,
      updatedAt: now,
      createdBy: String(currentUser?.username || body?.createdBy || body?.created_by || 'system').trim() || 'system',
    },
  };
}

function parseRecruitmentQuestionBankCsvRows(csvText) {
  const lines = String(csvText || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [];
  }

  const rows = [];
  lines.forEach((line, index) => {
    if (index === 0 && /position/i.test(line) && /questions?/i.test(line)) {
      return;
    }
    const parts = line.split(';');
    const position = String(parts[0] || '').trim();
    const questionsRaw = parts.slice(1).join(';').trim();
    if (!position || !questionsRaw) {
      return;
    }
    const questions = questionsRaw
      .split('|')
      .map((question) => question.trim())
      .filter((question) => question.length > 0);
    if (questions.length === 0) {
      return;
    }
    rows.push({ position, questions });
  });
  return rows;
}

function buildRecruitmentQuestionBankCsvExport(items) {
  const rows = ['position;version;questions'];
  items.forEach((item) => {
    const position = String(item.position || '').replace(/;/g, ',');
    const version = Number(item.version || 1);
    const questions = (Array.isArray(item.questions) ? item.questions : [])
      .map((question) => String(question || '').replace(/[;\n\r|]/g, ' ').trim())
      .filter((question) => question.length > 0)
      .join(' | ');
    rows.push(`${position};${version};${questions}`);
  });
  return rows.join('\n');
}

function normalizeRecruitmentInterviewStatus(value, fallback = 'Planifie') {
  const normalized = normalizeText(value);
  if (normalized === 'planifie' || normalized === 'planned') return 'Planifie';
  if (normalized === 'replanifie' || normalized === 'rescheduled') return 'Replanifie';
  if (normalized === 'termine' || normalized === 'completed') return 'Termine';
  if (normalized === 'annule' || normalized === 'canceled' || normalized === 'cancelled') return 'Annule';
  return fallback;
}

function normalizeRecruitmentInterviewers(input) {
  const values = Array.isArray(input) ? input : typeof input === 'string' ? input.split(/[;,]/) : [];
  const normalized = values
    .map((entry) => String(entry || '').trim())
    .filter((entry) => entry.length > 0)
    .slice(0, 8);
  return Array.from(new Set(normalized));
}

function buildRecruitmentInterviewId() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^INT-${year}-(\\d+)$`);
  const maxExisting = recruitmentInterviewSchedules.reduce((max, item) => {
    const match = regex.exec(String(item.id || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `INT-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function findRecruitmentInterview(interviewId) {
  const normalizedId = String(interviewId || '').trim().toUpperCase();
  return recruitmentInterviewSchedules.find(
    (item) => String(item.id || '').trim().toUpperCase() === normalizedId
  );
}

function normalizeRecruitmentInterviewEvaluations(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((entry) => {
      const interviewer = String(entry?.interviewer || '').trim();
      if (!interviewer) {
        return null;
      }
      const technicalScore = normalizeRecruitmentPercentage(entry?.technicalScore, 0);
      const communicationScore = normalizeRecruitmentPercentage(entry?.communicationScore, 0);
      const cultureFitScore = normalizeRecruitmentPercentage(entry?.cultureFitScore, 0);
      const recommendationRaw = normalizeText(entry?.recommendation || 'go');
      const recommendation = recommendationRaw === 'no-go' || recommendationRaw === 'nogo' ? 'No-Go' : 'Go';
      const comment = String(entry?.comment || '').trim();
      const submittedAt = normalizeRecruitmentNotificationSentAt(entry?.submittedAt || entry?.submitted_at);
      return {
        interviewer,
        technicalScore,
        communicationScore,
        cultureFitScore,
        recommendation,
        comment,
        submittedAt,
      };
    })
    .filter((entry) => !!entry);
}

function buildRecruitmentInterviewConsolidation(evaluations) {
  const list = normalizeRecruitmentInterviewEvaluations(evaluations);
  if (list.length === 0) {
    return {
      evaluators: 0,
      overallScore: 0,
      recommendation: 'Pending',
    };
  }
  const averageByEvaluator = list.map((entry) => {
    return (entry.technicalScore + entry.communicationScore + entry.cultureFitScore) / 3;
  });
  const overallScore = Math.round(
    (averageByEvaluator.reduce((sum, item) => sum + item, 0) / averageByEvaluator.length) * 10
  ) / 10;
  const goVotes = list.filter((entry) => entry.recommendation === 'Go').length;
  const recommendation = goVotes >= Math.ceil(list.length / 2) ? 'Go' : 'No-Go';
  return {
    evaluators: list.length,
    overallScore,
    recommendation,
  };
}

function normalizeRecruitmentInterviewHistory(input) {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((entry) => {
      const type = String(entry?.type || '').trim() || 'Event';
      const detail = String(entry?.detail || '').trim() || type;
      const at = normalizeRecruitmentNotificationSentAt(entry?.at || entry?.occurredAt || entry?.occurred_at);
      const actor = String(entry?.actor || 'system').trim() || 'system';
      return {
        type,
        detail,
        at,
        actor,
      };
    })
    .filter((entry) => !!entry.detail)
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

function normalizeRecruitmentInterviewSchedule(entry) {
  const id = String(entry?.id || '').trim().toUpperCase() || buildRecruitmentInterviewId();
  const applicationReference = String(entry?.applicationReference || entry?.application_reference || '').trim().toUpperCase();
  const linkedApplication = applicationReference ? findRecruitmentApplication(applicationReference) : null;
  const candidate = String(entry?.candidate || linkedApplication?.candidate || '').trim();
  const position = String(entry?.position || linkedApplication?.position || '').trim();
  const campaign = String(entry?.campaign || linkedApplication?.campaign || '').trim();
  const slotStart = normalizeRecruitmentNotificationSentAt(entry?.slotStart || entry?.slot_start);
  const slotEnd = normalizeRecruitmentNotificationSentAt(entry?.slotEnd || entry?.slot_end || slotStart);
  const interviewers = normalizeRecruitmentInterviewers(entry?.interviewers || entry?.panel || []);
  const location = String(entry?.location || 'A definir').trim() || 'A definir';
  const status = normalizeRecruitmentInterviewStatus(entry?.status, 'Planifie');
  const evaluations = normalizeRecruitmentInterviewEvaluations(entry?.evaluations || []);
  const history = normalizeRecruitmentInterviewHistory(entry?.history || []);
  const consolidation = buildRecruitmentInterviewConsolidation(evaluations);
  return {
    id,
    applicationReference,
    candidate,
    position,
    campaign,
    slotStart,
    slotEnd,
    interviewers,
    location,
    status,
    evaluations,
    history,
    consolidation,
  };
}

function validateRecruitmentInterviewCreatePayload(body, currentUser) {
  const errors = [];
  const applicationReference = String(
    body?.applicationReference || body?.application_reference || body?.reference || ''
  ).trim().toUpperCase();
  const application = applicationReference ? findRecruitmentApplication(applicationReference) : null;
  const candidate = String(body?.candidate || application?.candidate || '').trim();
  const position = String(body?.position || application?.position || '').trim();
  const campaign = String(body?.campaign || application?.campaign || '').trim();
  const slotStart = normalizeRecruitmentNotificationSentAt(body?.slotStart || body?.slot_start);
  const slotEnd = normalizeRecruitmentNotificationSentAt(body?.slotEnd || body?.slot_end || slotStart);
  const interviewers = normalizeRecruitmentInterviewers(body?.interviewers || body?.panel || []);
  const location = String(body?.location || '').trim() || 'A definir';

  if (!applicationReference) {
    errors.push('Reference candidature requise');
  }
  if (applicationReference && !application) {
    errors.push('Candidature introuvable');
  }
  if (application && !['Preselection', 'Entretien'].includes(application.status)) {
    errors.push('La candidature doit etre en Preselection ou Entretien pour planifier un entretien');
  }
  if (candidate.length < 2) {
    errors.push('Candidat requis');
  }
  if (position.length < 2) {
    errors.push('Poste requis');
  }
  if (interviewers.length === 0) {
    errors.push('Panel interviewers requis');
  }
  if (interviewers.length > 8) {
    errors.push('Panel interviewers limite a 8');
  }

  const startTs = Date.parse(slotStart);
  const endTs = Date.parse(slotEnd);
  if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
    errors.push('Creneau entretien invalide');
  }

  return {
    errors,
    payload: {
      id: buildRecruitmentInterviewId(),
      applicationReference,
      candidate,
      position,
      campaign,
      slotStart,
      slotEnd,
      interviewers,
      location,
      status: 'Planifie',
      evaluations: [],
      history: [
        {
          type: 'Creation',
          detail: `Reservation creneau entretien ${applicationReference}`,
          at: new Date().toISOString(),
          actor: String(currentUser?.username || 'system').trim() || 'system',
        },
      ],
    },
  };
}

function validateRecruitmentInterviewReschedulePayload(body, interview, currentUser) {
  const errors = [];
  const slotStart = normalizeRecruitmentNotificationSentAt(body?.slotStart || body?.slot_start);
  const slotEnd = normalizeRecruitmentNotificationSentAt(body?.slotEnd || body?.slot_end || slotStart);
  const location = String(body?.location || interview?.location || '').trim() || interview?.location || 'A definir';
  const reason = String(body?.reason || body?.note || '').trim() || 'Replanification manuelle';
  const interviewers = normalizeRecruitmentInterviewers(body?.interviewers || interview?.interviewers || []);
  const startTs = Date.parse(slotStart);
  const endTs = Date.parse(slotEnd);

  if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
    errors.push('Nouveau creneau invalide');
  }
  if (interviewers.length === 0) {
    errors.push('Panel interviewers requis');
  }

  return {
    errors,
    payload: {
      slotStart,
      slotEnd,
      location,
      reason,
      interviewers,
      actor: String(currentUser?.username || 'system').trim() || 'system',
    },
  };
}

function validateRecruitmentInterviewEvaluationPayload(body, interview, currentUser) {
  const errors = [];
  const interviewer = String(body?.interviewer || currentUser?.username || '').trim();
  const technicalScore = normalizeRecruitmentPercentage(body?.technicalScore ?? body?.technical_score, 0);
  const communicationScore = normalizeRecruitmentPercentage(body?.communicationScore ?? body?.communication_score, 0);
  const cultureFitScore = normalizeRecruitmentPercentage(body?.cultureFitScore ?? body?.culture_fit_score, 0);
  const recommendationRaw = normalizeText(body?.recommendation || 'go');
  const recommendation = recommendationRaw === 'no-go' || recommendationRaw === 'nogo' ? 'No-Go' : 'Go';
  const comment = String(body?.comment || body?.note || '').trim();

  if (!interviewer) {
    errors.push('Interviewer requis');
  }
  if (comment.length > 400) {
    errors.push('Commentaire evaluation trop long');
  }
  if (
    Array.isArray(interview?.interviewers) &&
    interview.interviewers.length > 0 &&
    !interview.interviewers.includes(interviewer)
  ) {
    errors.push('Interviewer non membre du panel');
  }

  return {
    errors,
    payload: {
      interviewer,
      technicalScore,
      communicationScore,
      cultureFitScore,
      recommendation,
      comment,
      submittedAt: new Date().toISOString(),
    },
  };
}

function buildRecruitmentInterviewWorkloadForecast() {
  const nowTs = Date.now();
  const next14DaysTs = nowTs + 14 * 86400000;
  const bucketByRecruiter = new Map();

  recruitmentInterviewSchedules.forEach((rawItem) => {
    const item = normalizeRecruitmentInterviewSchedule(rawItem);
    const startTs = Date.parse(item.slotStart);
    const inNext14Days = !Number.isNaN(startTs) && startTs >= nowTs && startTs <= next14DaysTs;
    item.interviewers.forEach((recruiter) => {
      if (!bucketByRecruiter.has(recruiter)) {
        bucketByRecruiter.set(recruiter, {
          recruiter,
          targetPerWeek: 6,
          currentWeekLoad: 0,
          upcomingTwoWeeksLoad: 0,
          monthlyLoadEstimate: 0,
          alert: 'OK',
        });
      }
      const entry = bucketByRecruiter.get(recruiter);
      const date = new Date(startTs);
      const today = new Date(nowTs);
      const sameWeek = date.getUTCFullYear() === today.getUTCFullYear()
        && Math.floor((date.getUTCDate() - 1) / 7) === Math.floor((today.getUTCDate() - 1) / 7)
        && date.getUTCMonth() === today.getUTCMonth();
      if (sameWeek) {
        entry.currentWeekLoad += 1;
      }
      if (inNext14Days) {
        entry.upcomingTwoWeeksLoad += 1;
      }
      if (!Number.isNaN(startTs)) {
        entry.monthlyLoadEstimate += 1;
      }
    });
  });

  const recruiters = Array.from(bucketByRecruiter.values()).map((item) => {
    const ratio = item.currentWeekLoad / Math.max(1, item.targetPerWeek);
    let alert = 'OK';
    if (ratio > 1.2) alert = 'Surcharge';
    else if (ratio < 0.5) alert = 'Sous-charge';
    return {
      ...item,
      alert,
    };
  });

  return recruiters.sort((left, right) => left.recruiter.localeCompare(right.recruiter));
}

function findRecruitmentCampaignBudget(campaignCode) {
  const normalizedCode = String(campaignCode || '').trim().toUpperCase();
  return recruitmentCampaignBudgets.find(
    (item) => String(item.campaignCode || '').trim().toUpperCase() === normalizedCode
  );
}

function validateRecruitmentCampaignBudgetPayload(body, currentUser) {
  const errors = [];
  const campaignCode = String(body?.campaignCode || body?.campaign_code || '').trim().toUpperCase();
  const budgetAmount = Number(body?.budgetAmount ?? body?.budget_amount ?? 0);
  const expensesAmount = Number(body?.expensesAmount ?? body?.expenses_amount ?? 0);
  const currency = String(body?.currency || 'GNF').trim().toUpperCase() || 'GNF';

  if (!campaignCode) {
    errors.push('Code campagne requis');
  }
  if (!findRecruitmentCampaign(campaignCode)) {
    errors.push('Campagne budget introuvable');
  }
  if (!Number.isFinite(budgetAmount) || budgetAmount < 0) {
    errors.push('Budget invalide');
  }
  if (!Number.isFinite(expensesAmount) || expensesAmount < 0) {
    errors.push('Depenses invalides');
  }
  if (expensesAmount > budgetAmount && Number.isFinite(budgetAmount)) {
    errors.push('Depenses superieures au budget');
  }

  return {
    errors,
    payload: {
      campaignCode,
      budgetAmount: Math.max(0, Math.round(budgetAmount)),
      expensesAmount: Math.max(0, Math.round(expensesAmount)),
      currency,
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: String(currentUser?.username || 'system').trim() || 'system',
    },
  };
}

function buildRecruitmentCampaignBudgetAnalytics() {
  return recruitmentCampaigns.map((campaign) => {
    const budget = findRecruitmentCampaignBudget(campaign.code) || {
      campaignCode: campaign.code,
      budgetAmount: 0,
      expensesAmount: 0,
      currency: 'GNF',
      lastUpdatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };
    const applications = recruitmentApplications.filter(
      (item) => String(item.campaign || '').trim().toUpperCase() === String(campaign.code || '').trim().toUpperCase()
    );
    const hires = applications.filter((item) => item.status === 'Retenu').length;
    const costPerApplication = applications.length > 0 ? budget.expensesAmount / applications.length : 0;
    const costPerHire = hires > 0 ? budget.expensesAmount / hires : 0;
    const variance = budget.budgetAmount - budget.expensesAmount;
    return {
      campaignCode: campaign.code,
      campaignTitle: campaign.title,
      budgetAmount: budget.budgetAmount,
      expensesAmount: budget.expensesAmount,
      variance,
      hires,
      applications: applications.length,
      costPerApplication: Math.round(costPerApplication),
      costPerHire: Math.round(costPerHire),
      currency: budget.currency || 'GNF',
      updatedAt: budget.lastUpdatedAt,
      updatedBy: budget.updatedBy,
    };
  });
}

function isoDateFromValue(value, fallback = '') {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function addDaysToIsoDate(isoDate, days) {
  const parsed = Date.parse(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed)) {
    return isoDate;
  }
  return new Date(parsed + Math.floor(days) * 86400000).toISOString().slice(0, 10);
}

function buildRecruitmentOnboarding306090Milestones() {
  return recruitmentOnboarding.map((rawItem) => {
    const item = normalizeRecruitmentOnboardingRecord(rawItem);
    const startDate = isoDateFromValue(item.startDate, new Date().toISOString().slice(0, 10));
    const milestones = [
      { day: 30, targetDate: addDaysToIsoDate(startDate, 30) },
      { day: 60, targetDate: addDaysToIsoDate(startDate, 60) },
      { day: 90, targetDate: addDaysToIsoDate(startDate, 90) },
    ].map((milestone) => {
      const now = Date.now();
      const targetTs = Date.parse(`${milestone.targetDate}T23:59:59.999Z`);
      const feedbacks = recruitmentOnboardingMilestoneFeedback.filter((feedback) => {
        return (
          String(feedback.applicationReference || '').trim().toUpperCase() === String(item.applicationReference || '').trim().toUpperCase()
          && Number(feedback.day) === milestone.day
        );
      });
      let status = 'A venir';
      if (!Number.isNaN(targetTs) && now > targetTs) {
        status = feedbacks.length > 0 ? 'Complete' : 'En retard';
      } else if (feedbacks.length > 0) {
        status = 'Complete';
      }
      return {
        day: milestone.day,
        targetDate: milestone.targetDate,
        status,
        feedbacks,
      };
    });
    return {
      applicationReference: item.applicationReference,
      agent: item.agent,
      position: item.position,
      startDate,
      milestones,
    };
  });
}

function validateRecruitmentOnboardingMilestoneFeedbackPayload(body, reference, currentUser) {
  const errors = [];
  const applicationReference = String(reference || '').trim().toUpperCase();
  const day = Number(body?.day ?? body?.milestoneDay ?? body?.milestone_day ?? 0);
  const authorRoleRaw = normalizeText(body?.authorRole || body?.author_role || 'manager');
  const authorRole = authorRoleRaw === 'agent' ? 'agent' : 'manager';
  const comment = String(body?.comment || '').trim();
  const score = normalizeRecruitmentPercentage(body?.score, 0);
  if (!applicationReference) {
    errors.push('Reference onboarding requise');
  }
  if (![30, 60, 90].includes(day)) {
    errors.push('Jalon onboarding invalide (30/60/90)');
  }
  if (comment.length < 3) {
    errors.push('Commentaire feedback requis');
  }
  if (comment.length > 400) {
    errors.push('Commentaire feedback trop long');
  }

  return {
    errors,
    payload: {
      id: `ONB-FB-${applicationReference}-${day}-${Date.now()}`.toUpperCase(),
      applicationReference,
      day,
      authorRole,
      author: String(currentUser?.username || 'system').trim() || 'system',
      comment,
      score,
      createdAt: new Date().toISOString(),
    },
  };
}

function buildRecruitmentOnboardingSuccessScores() {
  const milestones = buildRecruitmentOnboarding306090Milestones();
  return milestones.map((entry) => {
    const onboarding = recruitmentOnboarding.find((item) => String(item.applicationReference || '').trim().toUpperCase() === String(entry.applicationReference || '').trim().toUpperCase());
    const normalized = onboarding ? normalizeRecruitmentOnboardingRecord(onboarding) : null;
    const completionRate = Number(normalized?.progress?.completionRate || 0);
    const blocked = Number(normalized?.progress?.blocked || 0);
    const milestoneCompletion = entry.milestones.filter((item) => item.status === 'Complete').length;
    const milestoneRate = (milestoneCompletion / 3) * 100;
    const incidentPenalty = blocked > 0 ? Math.min(30, blocked * 8) : 0;
    const score = Math.max(0, Math.round((completionRate * 0.5 + milestoneRate * 0.5) - incidentPenalty));
    const cohortKey = String(entry.startDate || '').slice(0, 7);
    return {
      applicationReference: entry.applicationReference,
      agent: entry.agent,
      position: entry.position,
      cohort: cohortKey,
      completionRate: Math.round(completionRate),
      milestoneRate: Math.round(milestoneRate),
      blockedIncidents: blocked,
      score,
      alert: score < 60 ? 'Critique' : score < 75 ? 'Alerte' : 'OK',
    };
  });
}

function findRecruitmentOnboardingByReference(reference) {
  const normalizedReference = String(reference || '').trim().toUpperCase();
  return recruitmentOnboarding.find((item) => {
    const normalizedItem = normalizeRecruitmentOnboardingRecord(item);
    return String(normalizedItem.applicationReference || '').trim().toUpperCase() === normalizedReference;
  });
}

function runRecruitmentOnboardingSync(reference, currentUser) {
  const onboardingItem = findRecruitmentOnboardingByReference(reference);
  if (!onboardingItem) {
    return { error: 'Onboarding introuvable' };
  }
  const normalizedOnboarding = normalizeRecruitmentOnboardingRecord(onboardingItem);
  const referenceCode = String(reference || '').trim().toUpperCase();
  const now = new Date().toISOString();
  const dossierReference = `DOS-${new Date().getFullYear()}-${String(recruitmentOnboardingSyncLogs.length + 1).padStart(3, '0')}`;
  const affectationReference = `AFF-${new Date().getFullYear()}-${String(recruitmentOnboardingSyncLogs.length + 1).padStart(3, '0')}`;

  personnelDossiers.push({
    reference: dossierReference,
    agent: normalizedOnboarding.agent,
    type: 'Dossier agent auto-onboarding',
    status: 'Actif',
    updatedAt: now,
  });

  personnelAffectations.push({
    reference: affectationReference,
    agent: normalizedOnboarding.agent,
    fromUnit: 'Recrutement',
    toUnit: normalizedOnboarding.position,
    effectiveDate: normalizedOnboarding.startDate,
    status: 'Effective',
  });

  const log = {
    id: `ONB-SYNC-${Date.now()}`,
    applicationReference: referenceCode,
    agent: normalizedOnboarding.agent,
    position: normalizedOnboarding.position,
    syncedAt: now,
    syncedBy: String(currentUser?.username || 'system').trim() || 'system',
    dossierReference,
    affectationReference,
    status: 'SUCCESS',
    detail: 'Creation dossier et affectation automatique',
  };
  recruitmentOnboardingSyncLogs.push(log);
  return { log };
}

function validateRecruitmentRulePayload(body, currentUser) {
  const errors = [];
  const name = String(body?.name || '').trim();
  const event = String(body?.event || '').trim();
  const condition = String(body?.condition || '').trim();
  const action = String(body?.action || '').trim();
  const enabled = parseBooleanFlag(body?.enabled, true);
  if (name.length < 3) errors.push('Nom regle requis');
  if (event.length < 3) errors.push('Evenement regle requis');
  if (condition.length < 3) errors.push('Condition regle requise');
  if (action.length < 3) errors.push('Action regle requise');
  return {
    errors,
    payload: {
      id: `REC-RULE-${String(recruitmentRuleEngineRules.length + 1).padStart(3, '0')}`,
      name,
      event,
      condition,
      action,
      enabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: String(currentUser?.username || 'system').trim() || 'system',
    },
  };
}

function simulateRecruitmentRuleExecution(payload) {
  const event = normalizeText(payload?.event || '');
  const context = payload?.context || {};
  const matches = recruitmentRuleEngineRules
    .filter((rule) => rule.enabled && normalizeText(rule.event) === event)
    .map((rule) => ({
      ruleId: rule.id,
      ruleName: rule.name,
      action: rule.action,
      wouldExecute: true,
      reason: `Condition [${rule.condition}] evaluee sur contexte fourni`,
      context,
    }));
  return {
    event: payload?.event || '',
    simulatedAt: new Date().toISOString(),
    matches,
  };
}

function appendRecruitmentRuleExecution(entry) {
  recruitmentRuleExecutions.push({
    id: `REC-RUN-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase(),
    ruleId: String(entry?.ruleId || '').trim(),
    ruleName: String(entry?.ruleName || '').trim(),
    event: String(entry?.event || '').trim(),
    executedAt: normalizeRecruitmentNotificationSentAt(entry?.executedAt || ''),
    outcome: String(entry?.outcome || 'SUCCESS').trim(),
    detail: String(entry?.detail || '').trim() || 'Execution regle',
  });
}

function buildRecruitmentControlTowerView(filters = {}) {
  const campaignFilter = String(filters.campaign || '').trim().toLowerCase();
  const statusFilter = String(filters.status || '').trim().toLowerCase();
  const search = String(filters.q || '').trim().toLowerCase();
  const onboardingByReference = new Map(
    recruitmentOnboarding
      .map((item) => normalizeRecruitmentOnboardingRecord(item))
      .map((item) => [String(item.applicationReference || '').trim().toUpperCase(), item])
  );
  const interviewsByReference = new Map();
  recruitmentInterviewSchedules.forEach((item) => {
    const normalized = normalizeRecruitmentInterviewSchedule(item);
    const reference = String(normalized.applicationReference || '').trim().toUpperCase();
    if (!reference) {
      return;
    }
    if (!interviewsByReference.has(reference)) {
      interviewsByReference.set(reference, []);
    }
    interviewsByReference.get(reference).push(normalized);
  });

  let items = recruitmentApplications.map((application) => {
    const reference = String(application.reference || '').trim().toUpperCase();
    const onboarding = onboardingByReference.get(reference);
    const interviews = interviewsByReference.get(reference) || [];
    const lastInterview = interviews
      .slice()
      .sort((left, right) => Date.parse(right.slotStart) - Date.parse(left.slotStart))[0];
    return {
      reference,
      candidate: application.candidate,
      campaign: application.campaign,
      position: application.position,
      status: application.status,
      receivedOn: application.receivedOn,
      interviewStatus: lastInterview ? lastInterview.status : 'Non planifie',
      interviewSlot: lastInterview ? lastInterview.slotStart : '',
      onboardingStatus: onboarding ? onboarding.status : 'Non lance',
      onboardingProgress: Number(onboarding?.progress?.completionRate || 0),
    };
  });

  if (campaignFilter) {
    items = items.filter((item) => String(item.campaign || '').toLowerCase().includes(campaignFilter));
  }
  if (statusFilter) {
    items = items.filter((item) => String(item.status || '').toLowerCase().includes(statusFilter));
  }
  if (search) {
    items = items.filter((item) => {
      return (
        String(item.reference || '').toLowerCase().includes(search)
        || String(item.candidate || '').toLowerCase().includes(search)
        || String(item.position || '').toLowerCase().includes(search)
        || String(item.campaign || '').toLowerCase().includes(search)
      );
    });
  }

  const summary = {
    totalApplications: items.length,
    interviewsPlanned: items.filter((item) => item.interviewStatus === 'Planifie' || item.interviewStatus === 'Replanifie').length,
    onboardingActive: items.filter((item) => item.onboardingStatus === 'En cours' || item.onboardingStatus === 'Planifie').length,
    retained: items.filter((item) => item.status === 'Retenu').length,
  };

  return { summary, items };
}

function buildRecruitmentExecutiveDashboard() {
  const totalApplications = recruitmentApplications.length;
  const retained = recruitmentApplications.filter((item) => item.status === 'Retenu').length;
  const interviewStage = recruitmentApplications.filter((item) => item.status === 'Entretien').length;
  const conversionInterviewToRetained = interviewStage > 0 ? (retained / interviewStage) * 100 : 0;
  const processingDurations = recruitmentApplications.map((application) => {
    const history = normalizeRecruitmentStatusHistory(application.statusHistory, application.status, application.receivedOn);
    const createdAt = Date.parse(history[0]?.changedAt || application.receivedOn);
    const finalEvent = history
      .slice()
      .reverse()
      .find((event) => event.toStatus === 'Retenu' || event.toStatus === 'Rejete');
    const finalAt = finalEvent ? Date.parse(finalEvent.changedAt) : Date.now();
    if (Number.isNaN(createdAt) || Number.isNaN(finalAt)) return 0;
    return Math.max(0, Math.round((finalAt - createdAt) / 86400000));
  });
  const avgTimeToHire = processingDurations.length > 0
    ? processingDurations.reduce((sum, value) => sum + value, 0) / processingDurations.length
    : 0;

  const byCampaign = recruitmentCampaigns.map((campaign) => {
    const scoped = recruitmentApplications.filter((item) => item.campaign === campaign.code);
    const retainedCount = scoped.filter((item) => item.status === 'Retenu').length;
    const rejectedCount = scoped.filter((item) => item.status === 'Rejete').length;
    return {
      campaignCode: campaign.code,
      campaignTitle: campaign.title,
      total: scoped.length,
      retained: retainedCount,
      rejected: rejectedCount,
      conversion: scoped.length > 0 ? Math.round((retainedCount / scoped.length) * 1000) / 10 : 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    kpis: {
      totalApplications,
      retained,
      conversionInterviewToRetained: Math.round(conversionInterviewToRetained * 10) / 10,
      averageTimeToHireDays: Math.round(avgTimeToHire * 10) / 10,
    },
    byCampaign,
  };
}

function appendRecruitmentBiExportLog(entry) {
  recruitmentBiExportLogs.push({
    id: `REC-BI-LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
    createdAt: normalizeRecruitmentNotificationSentAt(entry?.createdAt || ''),
    requestedBy: String(entry?.requestedBy || 'system').trim() || 'system',
    format: String(entry?.format || 'json').trim().toLowerCase() === 'csv' ? 'csv' : 'json',
    records: Number.isFinite(Number(entry?.records)) ? Number(entry.records) : 0,
    status: String(entry?.status || 'SUCCESS').trim(),
  });
}

function buildRecruitmentBiExportPayload() {
  return {
    exportedAt: new Date().toISOString(),
    schemaVersion: 'rec-bi-v1',
    datasets: {
      applications: recruitmentApplications,
      campaigns: recruitmentCampaigns,
      onboarding: recruitmentOnboarding.map((item) => normalizeRecruitmentOnboardingRecord(item)),
      interviews: recruitmentInterviewSchedules.map((item) => normalizeRecruitmentInterviewSchedule(item)),
      budgets: buildRecruitmentCampaignBudgetAnalytics(),
    },
  };
}

function buildRecruitmentObservabilitySnapshot() {
  const now = Date.now();
  const simulatedApiP95 = 540 + (recruitmentObservabilityEvents.length % 150);
  const simulatedErrorRate = recruitmentObservabilityEvents.length === 0
    ? 0
    : Math.min(5, Math.round((recruitmentObservabilityEvents.length / 250) * 1000) / 10);
  const alerts = [];
  if (simulatedApiP95 > RECRUITMENT_PERF_THRESHOLDS.apiP95Ms) {
    alerts.push('API_P95_THRESHOLD_BREACH');
  }
  if (simulatedErrorRate > RECRUITMENT_PERF_THRESHOLDS.errorRatePercent) {
    alerts.push('ERROR_RATE_THRESHOLD_BREACH');
  }
  const lastEvent = recruitmentObservabilityEvents
    .slice()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0];
  const staleMinutes = lastEvent ? Math.floor((now - Date.parse(lastEvent.createdAt)) / 60000) : 0;
  if (staleMinutes > RECRUITMENT_PERF_THRESHOLDS.staleDataMinutes) {
    alerts.push('STALE_DATA_WARNING');
  }
  return {
    generatedAt: new Date().toISOString(),
    thresholds: RECRUITMENT_PERF_THRESHOLDS,
    metrics: {
      apiP95Ms: simulatedApiP95,
      errorRatePercent: simulatedErrorRate,
      staleDataMinutes: staleMinutes,
      e2eCriticalPassRate: 98.5,
    },
    alerts,
    recentEvents: recruitmentObservabilityEvents
      .slice()
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 30),
  };
}

function listRecruitmentApplicationNextStatuses(status) {
  if (status === 'Nouveau') return ['Preselection', 'Rejete'];
  if (status === 'Preselection') return ['Entretien', 'Rejete'];
  if (status === 'Entretien') return ['Retenu', 'Rejete'];
  return [];
}

function isRecruitmentApplicationTransitionAllowed(fromStatus, toStatus) {
  return listRecruitmentApplicationNextStatuses(fromStatus).includes(toStatus);
}

function normalizeRecruitmentHistoryTimestamp(value, receivedOn) {
  const parsedChangedAt = Date.parse(String(value || '').trim());
  if (!Number.isNaN(parsedChangedAt)) {
    return new Date(parsedChangedAt).toISOString();
  }

  const parsedReceivedOn = Date.parse(String(receivedOn || '').trim());
  if (!Number.isNaN(parsedReceivedOn)) {
    return new Date(parsedReceivedOn).toISOString();
  }

  return new Date().toISOString();
}

function buildRecruitmentInitialStatusHistory(status, receivedOn, changedBy = 'system') {
  return [
    {
      fromStatus: null,
      toStatus: status,
      changedAt: normalizeRecruitmentHistoryTimestamp('', receivedOn),
      changedBy: String(changedBy || '').trim() || 'system',
      note: 'Initialisation',
    },
  ];
}

function normalizeRecruitmentStatusHistory(value, currentStatus, receivedOn) {
  if (!Array.isArray(value)) {
    return buildRecruitmentInitialStatusHistory(currentStatus, receivedOn);
  }

  const normalized = value
    .map((entry) => {
      const fromStatusInput = String(entry?.fromStatus ?? entry?.from_status ?? '').trim();
      const toStatusInput = String(entry?.toStatus ?? entry?.to_status ?? '').trim();
      const toStatus = normalizeRecruitmentApplicationStatus(toStatusInput, currentStatus);
      const changedAt = normalizeRecruitmentHistoryTimestamp(entry?.changedAt ?? entry?.changed_at, receivedOn);
      const changedBy = String(entry?.changedBy ?? entry?.changed_by ?? '').trim() || 'system';
      const note = String(entry?.note || '').trim() || undefined;

      return {
        fromStatus: fromStatusInput ? normalizeRecruitmentApplicationStatus(fromStatusInput, currentStatus) : null,
        toStatus,
        changedAt,
        changedBy,
        note,
      };
    })
    .filter((entry) => !!entry.toStatus);

  if (normalized.length === 0) {
    return buildRecruitmentInitialStatusHistory(currentStatus, receivedOn);
  }

  normalized.sort((left, right) => Date.parse(left.changedAt) - Date.parse(right.changedAt));
  return normalized;
}

function parseRecruitmentDateBoundary(value, boundary = 'start') {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const suffix = boundary === 'end' ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
    const parsedDateOnly = Date.parse(`${raw}${suffix}`);
    return Number.isNaN(parsedDateOnly) ? null : parsedDateOnly;
  }

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseRecruitmentReceivedTimestamp(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return Number.NaN;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return Date.parse(`${raw}T00:00:00.000Z`);
  }

  return Date.parse(raw);
}

function applyRecruitmentReceivedOnRangeFilter(items, url) {
  const fromTimestamp = parseRecruitmentDateBoundary(
    url.searchParams.get('receivedFrom') || url.searchParams.get('received_from'),
    'start'
  );
  const toTimestamp = parseRecruitmentDateBoundary(
    url.searchParams.get('receivedTo') || url.searchParams.get('received_to'),
    'end'
  );

  if (!Number.isFinite(fromTimestamp) && !Number.isFinite(toTimestamp)) {
    return items;
  }

  return items.filter((item) => {
    const timestamp = parseRecruitmentReceivedTimestamp(item?.receivedOn ?? item?.received_on);
    if (!Number.isFinite(timestamp)) {
      return false;
    }
    if (Number.isFinite(fromTimestamp) && timestamp < fromTimestamp) {
      return false;
    }
    if (Number.isFinite(toTimestamp) && timestamp > toTimestamp) {
      return false;
    }
    return true;
  });
}

function normalizeRecruitmentCommentCreatedAt(value) {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function buildRecruitmentApplicationCommentId(reference, existingComments) {
  const referenceCode = String(reference || 'APP')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'APP';
  const prefix = `COM-${referenceCode}-`;
  const maxExisting = Array.isArray(existingComments)
    ? existingComments.reduce((max, comment) => {
        const id = String(comment?.id || '')
          .trim()
          .toUpperCase();
        if (!id.startsWith(prefix)) {
          return max;
        }
        const sequence = Number(id.slice(prefix.length));
        return Number.isFinite(sequence) ? Math.max(max, sequence) : max;
      }, 0)
    : 0;
  return `${prefix}${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeRecruitmentApplicationComments(value, reference = '') {
  if (!Array.isArray(value)) {
    return [];
  }

  const referenceCode = String(reference || 'APP')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'APP';

  const normalized = value
    .map((entry, index) => {
      const message = String(entry?.message ?? entry?.text ?? entry?.comment ?? '').trim();
      if (!message) {
        return null;
      }
      const author = String(
        entry?.author ??
          entry?.createdBy ??
          entry?.created_by ??
          entry?.actor ??
          'system'
      ).trim() || 'system';
      const createdAt = normalizeRecruitmentCommentCreatedAt(entry?.createdAt ?? entry?.created_at);
      const id = String(entry?.id || '').trim() || `COM-${referenceCode}-${String(index + 1).padStart(3, '0')}`;
      return {
        id,
        author,
        message,
        createdAt,
      };
    })
    .filter((entry) => !!entry);

  normalized.sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
  return normalized;
}

function normalizeRecruitmentAttachmentUploadedAt(value) {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function normalizeRecruitmentApplicationAttachments(value, reference = '') {
  if (!Array.isArray(value)) {
    return [];
  }

  const referenceCode = String(reference || 'APP')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'APP';

  const normalized = value
    .map((entry, index) => {
      const fileName = String(entry?.fileName ?? entry?.file_name ?? entry?.name ?? '').trim();
      const url = String(entry?.url ?? entry?.fileDataUrl ?? entry?.file_data_url ?? entry?.path ?? '').trim();
      if (!fileName || !url) {
        return null;
      }
      const id = String(entry?.id || '').trim() || `ATT-${referenceCode}-${String(index + 1).padStart(3, '0')}`;
      const mimeType = String(entry?.mimeType ?? entry?.mime_type ?? 'application/octet-stream').trim() || 'application/octet-stream';
      const sizeRaw = Number(entry?.size ?? 0);
      const size = Number.isFinite(sizeRaw) && sizeRaw >= 0 ? Math.round(sizeRaw) : 0;
      const uploadedAt = normalizeRecruitmentAttachmentUploadedAt(entry?.uploadedAt ?? entry?.uploaded_at);
      return {
        id,
        fileName,
        url,
        mimeType,
        size,
        uploadedAt,
      };
    })
    .filter((entry) => !!entry);

  normalized.sort((left, right) => Date.parse(left.uploadedAt) - Date.parse(right.uploadedAt));
  return normalized;
}

function validateRecruitmentApplicationAttachmentsPayload(value) {
  const errors = [];

  if (value === null || value === undefined) {
    return { errors, attachments: [] };
  }

  if (!Array.isArray(value)) {
    return {
      errors: ['Pieces jointes invalides'],
      attachments: [],
    };
  }

  if (value.length > 20) {
    errors.push('Nombre maximal de pieces jointes depasse (20)');
  }

  const attachments = normalizeRecruitmentApplicationAttachments(value);
  attachments.forEach((attachment) => {
    if (attachment.fileName.length > 180) {
      errors.push(`Nom de fichier trop long: ${attachment.fileName}`);
    }
    if (attachment.url.length > 500) {
      errors.push(`URL piece jointe trop longue: ${attachment.fileName}`);
    }
    if (
      !attachment.url.startsWith('/api/v1/public/uploads/') &&
      !/^https?:\/\//i.test(attachment.url)
    ) {
      errors.push(`URL piece jointe invalide: ${attachment.fileName}`);
    }
    if (attachment.size > MAX_UPLOAD_BYTES) {
      errors.push(`Piece jointe trop volumineuse: ${attachment.fileName}`);
    }
  });

  return {
    errors,
    attachments,
  };
}

function validateRecruitmentApplicationCommentCreatePayload(body, currentUser) {
  const errors = [];

  const message = String(body.message || body.text || body.comment || body.note || '').trim();
  const author = String(
    body.author ||
      body.createdBy ||
      body.created_by ||
      body.actor ||
      body.username ||
      currentUser?.username ||
      'system'
  ).trim();

  if (message.length < 2) {
    errors.push('Commentaire requis (2 caracteres minimum)');
  }
  if (message.length > 1000) {
    errors.push('Commentaire trop long (1000 caracteres max)');
  }
  if (author.length > 120) {
    errors.push('Auteur commentaire trop long');
  }

  return {
    errors,
    payload: {
      message,
      author: author || 'system',
    },
  };
}

function validateRecruitmentApplicationCreatePayload(body) {
  const errors = [];

  const reference = String(body.reference || body.requestRef || body.request_ref || '').trim().toUpperCase();
  const candidate = String(body.candidate || body.candidateName || body.candidate_name || '').trim();
  const candidateEmailInput = String(body.candidateEmail || body.candidate_email || body.email || '').trim();
  const candidatePhoneInput = String(body.candidatePhone || body.candidate_phone || body.phone || '').trim();
  const identityNumberInput = String(body.identityNumber || body.identity_number || body.identity || '').trim();
  const candidateEmail = candidateEmailInput ? normalizeRecruitmentCandidateEmail(candidateEmailInput) : null;
  const candidatePhone = candidatePhoneInput ? normalizeRecruitmentCandidatePhone(candidatePhoneInput) : null;
  const identityNumber = identityNumberInput ? normalizeRecruitmentCandidateIdentity(identityNumberInput) : null;
  const position = String(body.position || body.positionTitle || body.position_title || '').trim();
  const campaign = String(body.campaign || body.campaignTitle || body.campaign_title || '').trim().toUpperCase();
  const sourceInput = String(
    body.source || body.sourceName || body.source_name || body.channel || body.canal || body.origin || body.origine || ''
  ).trim();
  const source = sourceInput ? normalizeRecruitmentApplicationSource(sourceInput, '') : '';
  const statusInput = String(body.status || '').trim();
  const status = normalizeRecruitmentApplicationStatus(statusInput || 'Nouveau', 'Nouveau');
  const explicitStatus = statusInput ? normalizeRecruitmentApplicationStatus(statusInput, '') : status;
  const receivedOn = String(body.receivedOn || body.received_on || '').trim();
  const experienceYears = normalizeRecruitmentExperienceYears(body.experienceYears ?? body.experience_years, 0);
  const skillsMatch = normalizeRecruitmentPercentage(body.skillsMatch ?? body.skills_match, 0);
  const educationLevel = normalizeRecruitmentPercentage(body.educationLevel ?? body.education_level, 0);
  const interviewAverage = normalizeRecruitmentPercentage(body.interviewAverage ?? body.interview_average, 0);
  const testScore = normalizeRecruitmentPercentage(body.testScore ?? body.test_score, 0);
  const allowDuplicate = parseBooleanFlag(body.allowDuplicate ?? body.allow_duplicate, false);
  const attachmentsValidation = validateRecruitmentApplicationAttachmentsPayload(
    body.attachments ?? body.files ?? body.documents
  );

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference candidature invalide');
  }
  if (reference && findRecruitmentApplication(reference)) {
    errors.push('Reference candidature deja existante');
  }
  if (candidate.length < 2) {
    errors.push('Nom candidat requis');
  }
  if (candidateEmailInput && !candidateEmail) {
    errors.push('Email candidat invalide');
  }
  if (candidatePhoneInput && !candidatePhone) {
    errors.push('Telephone candidat invalide');
  }
  if (identityNumberInput && !identityNumber) {
    errors.push('Identite candidat invalide');
  }
  if (position.length < 2) {
    errors.push('Poste requis');
  }
  if (campaign.length < 3) {
    errors.push('Campagne requise');
  }
  if (!sourceInput) {
    errors.push('Source candidature requise');
  } else if (!source) {
    errors.push('Source candidature invalide');
  }
  if (statusInput && !explicitStatus) {
    errors.push('Statut candidature invalide');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn) || Number.isNaN(Date.parse(receivedOn))) {
    errors.push('Date reception invalide');
  }
  const duplicateMatches = findRecruitmentPotentialDuplicateMatches(
    {
      candidateEmail,
      candidatePhone,
      identityNumber,
    }
  );
  if (duplicateMatches.length > 0 && !allowDuplicate) {
    errors.push(
      `Doublon potentiel detecte (${duplicateMatches
        .map((item) => `${item.reference} via ${item.matchTypes.map((type) => buildRecruitmentIdentityMatchLabel(type)).join(', ')}`)
        .join(' | ')})`
    );
  }
  if (attachmentsValidation.errors.length > 0) {
    errors.push(...attachmentsValidation.errors);
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      candidate,
      candidateEmail,
      candidatePhone,
      identityNumber,
      position,
      campaign,
      source,
      status,
      receivedOn,
      experienceYears,
      skillsMatch,
      educationLevel,
      interviewAverage,
      testScore,
      duplicateMatches,
      attachments: attachmentsValidation.attachments,
    },
  };
}

function validateRecruitmentApplicationStatusUpdatePayload(body, currentApplication, currentUser) {
  const errors = [];

  const targetStatusInput = String(body.status || '').trim();
  const targetStatus = normalizeRecruitmentApplicationStatus(targetStatusInput, '');
  const note = String(body.note || body.reason || '').trim();
  const changedBy = String(
    body.changedBy ||
      body.changed_by ||
      body.actor ||
      body.username ||
      currentUser?.username ||
      'system'
  ).trim();

  if (!targetStatusInput) {
    errors.push('Statut cible requis');
  } else if (!targetStatus) {
    errors.push('Statut cible invalide');
  } else if (targetStatus === currentApplication.status) {
    errors.push('Candidature deja dans ce statut');
  } else if (!isRecruitmentApplicationTransitionAllowed(currentApplication.status, targetStatus)) {
    const allowed = listRecruitmentApplicationNextStatuses(currentApplication.status);
    errors.push(
      allowed.length > 0
        ? `Transition invalide (${currentApplication.status} -> ${targetStatus}). Etapes autorisees: ${allowed.join(', ')}`
        : `Transition invalide depuis le statut ${currentApplication.status}`
    );
  }

  if (note.length > 240) {
    errors.push('Note trop longue (240 caracteres max)');
  }

  return {
    errors,
    payload: {
      status: targetStatus || currentApplication.status,
      note: note || null,
      changedBy: changedBy || 'system',
    },
  };
}

function validateRecruitmentScoringPolicyUpdatePayload(body, currentUser) {
  const errors = [];
  const criteriaInput = Array.isArray(body?.criteria) ? body.criteria : [];
  if (criteriaInput.length === 0) {
    errors.push('Liste de criteres de scoring requise');
  }
  const normalized = normalizeRecruitmentScoringCriteria(criteriaInput);
  const rebalanced = rebalanceRecruitmentScoringCriteria(normalized);
  const totalWeight = rebalanced.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (totalWeight !== 100) {
    errors.push('Ponderation globale invalide (100 attendu)');
  }
  return {
    errors,
    payload: {
      criteria: rebalanced,
      updatedAt: new Date().toISOString(),
      updatedBy: String(currentUser?.username || body?.updatedBy || body?.updated_by || 'system').trim() || 'system',
    },
  };
}

function validateRecruitmentShortlistValidationPayload(body, reference, currentUser) {
  const errors = [];
  const normalizedReference = String(reference || '').trim().toUpperCase();
  const application = findRecruitmentApplication(normalizedReference);
  if (!application) {
    errors.push('Candidature shortlist introuvable');
  }

  const decisionRaw = normalizeText(body?.decision || body?.status || body?.validationStatus || body?.validation_status || '');
  let decision = 'VALIDATED';
  if (decisionRaw === 'rejected' || decisionRaw === 'refused' || decisionRaw === 'rejete' || decisionRaw === 'rejected') {
    decision = 'REJECTED';
  } else if (decisionRaw && decisionRaw !== 'validated' && decisionRaw !== 'valide') {
    errors.push('Decision shortlist invalide');
  }

  const note = String(body?.note || body?.reason || '').trim();
  if (note.length > 240) {
    errors.push('Commentaire validation shortlist trop long');
  }

  return {
    errors,
    payload: {
      reference: normalizedReference,
      decision,
      note: note || undefined,
      validatedAt: new Date().toISOString(),
      validatedBy: String(currentUser?.username || body?.validatedBy || body?.validated_by || 'system').trim() || 'system',
    },
  };
}

function validateRecruitmentDuplicateLinkPayload(body, currentUser) {
  const errors = [];
  const primaryReference = String(body?.primaryReference || body?.primary_reference || '').trim().toUpperCase();
  const secondaryReference = String(body?.secondaryReference || body?.secondary_reference || '').trim().toUpperCase();
  const mode = normalizeRecruitmentDuplicateMode(body?.mode || body?.action || 'link');
  const reason = String(body?.reason || '').trim() || 'Traitement dedoublonnage manuel';

  if (!primaryReference || !findRecruitmentApplication(primaryReference)) {
    errors.push('Reference primaire introuvable');
  }
  if (!secondaryReference || !findRecruitmentApplication(secondaryReference)) {
    errors.push('Reference secondaire introuvable');
  }
  if (primaryReference && secondaryReference && primaryReference === secondaryReference) {
    errors.push('References primaire et secondaire doivent etre differentes');
  }
  if (reason.length > 240) {
    errors.push('Motif dedoublonnage trop long');
  }

  return {
    errors,
    payload: {
      id: `DEDUP-LINK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
      primaryReference,
      secondaryReference,
      mode,
      reason,
      linkedAt: new Date().toISOString(),
      linkedBy: String(currentUser?.username || body?.linkedBy || body?.linked_by || 'system').trim() || 'system',
    },
  };
}

recruitmentApplications.forEach((application) => {
  const normalizedStatus = normalizeRecruitmentApplicationStatus(application.status, 'Nouveau');
  application.status = normalizedStatus;
  application.candidateEmail = normalizeRecruitmentCandidateEmail(
    application.candidateEmail || application.candidate_email || application.email
  ) || undefined;
  application.candidatePhone = normalizeRecruitmentCandidatePhone(
    application.candidatePhone || application.candidate_phone || application.phone
  ) || undefined;
  application.identityNumber = normalizeRecruitmentCandidateIdentity(
    application.identityNumber || application.identity_number || application.identity
  ) || undefined;
  application.experienceYears = normalizeRecruitmentExperienceYears(
    application.experienceYears || application.experience_years,
    deriveRecruitmentPseudoScore(application.reference, 'experienceYears', 1, 8)
  );
  application.skillsMatch = normalizeRecruitmentPercentage(
    application.skillsMatch || application.skills_match,
    deriveRecruitmentPseudoScore(application.reference, 'skillsMatch', 50, 92)
  );
  application.educationLevel = normalizeRecruitmentPercentage(
    application.educationLevel || application.education_level,
    deriveRecruitmentPseudoScore(application.reference, 'educationLevel', 45, 90)
  );
  application.interviewAverage = normalizeRecruitmentPercentage(
    application.interviewAverage || application.interview_average,
    application.status === 'Entretien' || application.status === 'Retenu'
      ? deriveRecruitmentPseudoScore(application.reference, 'interviewAverage', 60, 92)
      : 0
  );
  application.testScore = normalizeRecruitmentPercentage(
    application.testScore || application.test_score,
    deriveRecruitmentPseudoScore(application.reference, 'testScore', 48, 94)
  );
  application.source = normalizeRecruitmentApplicationSource(
    application.source || application.sourceName || application.source_name || application.channel || application.canal || application.origin || application.origine,
    'Autre'
  );
  application.statusHistory = normalizeRecruitmentStatusHistory(
    application.statusHistory,
    normalizedStatus,
    application.receivedOn
  );
  application.comments = normalizeRecruitmentApplicationComments(
    application.comments || application.commentaries || application.comments_history,
    application.reference
  );
  application.attachments = normalizeRecruitmentApplicationAttachments(
    application.attachments || application.files || application.documents,
    application.reference
  );
});

function findRecruitmentCampaign(code) {
  return recruitmentCampaigns.find((item) => item.code === code);
}

function buildRecruitmentCampaignCode(department) {
  const year = new Date().getFullYear();
  const rawDepartmentCode = String(department || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const departmentCode = rawDepartmentCode.slice(0, 10).replace(/^-+|-+$/g, '') || 'RH';
  const prefix = `CMP-${departmentCode}-${year}`;
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  const maxExisting = recruitmentCampaigns.reduce((max, item) => {
    const match = regex.exec(String(item.code || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}-${String(maxExisting + 1).padStart(2, '0')}`;
}

function validateRecruitmentCampaignCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const title = String(body.title || body.name || '').trim();
  const department = String(body.department || body.departmentName || body.department_name || '').trim();
  const openingsRaw = Number(body.openings ?? body.openPositions ?? body.open_positions ?? 0);
  const openings = Number.isFinite(openingsRaw) ? Math.max(0, Math.round(openingsRaw)) : 0;
  const startDate = String(body.startDate || body.start_date || '').trim();
  const endDate = String(body.endDate || body.end_date || '').trim();
  const needPosition = String(
    body.needPosition || body.need_position || body.targetPosition || body.target_position || body.position || ''
  ).trim();
  const needQuotaRaw = Number(body.needQuota ?? body.need_quota ?? body.quota ?? openingsRaw);
  const needQuota = Number.isFinite(needQuotaRaw) ? Math.max(0, Math.round(needQuotaRaw)) : 0;
  const needDeadline = String(
    body.needDeadline || body.need_deadline || body.deadline || body.targetDeadline || body.target_deadline || ''
  ).trim();
  const needOwner = String(body.needOwner || body.need_owner || body.owner || body.campaignOwner || '').trim();
  const statusRaw = normalizeText(body.status || 'planifiee');
  let status = 'Planifiee';
  if (statusRaw === 'active') status = 'Active';
  else if (statusRaw === 'suspendue') status = 'Suspendue';
  else if (statusRaw === 'cloturee' || statusRaw === 'clôturée') status = 'Cloturee';

  if (code && !/^[A-Z0-9-]{3,50}$/.test(code)) {
    errors.push('Code campagne invalide');
  }
  if (code && findRecruitmentCampaign(code)) {
    errors.push('Code campagne deja existant');
  }
  if (title.length < 2) {
    errors.push('Intitule campagne requis');
  }
  if (department.length < 2) {
    errors.push('Direction requise');
  }
  if (!Number.isFinite(openingsRaw) || openingsRaw <= 0) {
    errors.push('Nombre ouvertures invalide');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.push('Date debut invalide');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(Date.parse(endDate))) {
    errors.push('Date fin invalide');
  }
  if (!Number.isNaN(Date.parse(startDate)) && !Number.isNaN(Date.parse(endDate))) {
    if (Date.parse(endDate) < Date.parse(startDate)) {
      errors.push('Date fin doit etre superieure ou egale a date debut');
    }
  }
  if (needPosition.length < 2) {
    errors.push('Besoin poste cible requis');
  }
  if (!Number.isFinite(needQuotaRaw) || needQuotaRaw <= 0) {
    errors.push('Besoin quota invalide');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(needDeadline) || Number.isNaN(Date.parse(needDeadline))) {
    errors.push('Besoin delai invalide');
  }
  if (
    !Number.isNaN(Date.parse(startDate)) &&
    !Number.isNaN(Date.parse(endDate)) &&
    !Number.isNaN(Date.parse(needDeadline))
  ) {
    const needDeadlineTs = Date.parse(needDeadline);
    if (needDeadlineTs < Date.parse(startDate) || needDeadlineTs > Date.parse(endDate)) {
      errors.push('Besoin delai doit etre compris entre date debut et date fin');
    }
  }
  if (needOwner.length < 2) {
    errors.push('Besoin owner requis');
  }

  return {
    errors,
    payload: {
      code: code || null,
      title,
      department,
      openings,
      startDate,
      endDate,
      needPosition,
      needQuota,
      needDeadline,
      needOwner,
      status,
    },
  };
}

function normalizeRecruitmentNotificationType(value, fallback = 'Alerte SLA candidature') {
  const normalized = normalizeText(value);
  if (normalized === 'relance entretien' || normalized === 'entretien reminder') return 'Relance entretien';
  if (normalized === 'relance validation' || normalized === 'validation reminder') return 'Relance validation';
  if (
    normalized === 'alerte sla candidature' ||
    normalized === 'alerte sla' ||
    normalized === 'sla alert'
  ) {
    return 'Alerte SLA candidature';
  }
  return fallback;
}

function normalizeRecruitmentNotificationSeverity(value, fallback = 'Alerte') {
  const normalized = normalizeText(value);
  if (normalized === 'info') return 'Info';
  if (normalized === 'alerte' || normalized === 'warning') return 'Alerte';
  if (normalized === 'critique' || normalized === 'critical') return 'Critique';
  return fallback;
}

function normalizeRecruitmentNotificationStatus(value, fallback = 'Envoyee') {
  const normalized = normalizeText(value);
  if (normalized === 'envoyee' || normalized === 'envoye' || normalized === 'sent') return 'Envoyee';
  if (normalized === 'en attente' || normalized === 'pending') return 'En attente';
  if (normalized === 'echec' || normalized === 'failed') return 'Echec';
  return fallback;
}

function normalizeRecruitmentNotificationSentAt(value) {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function daysSinceRecruitmentDate(value) {
  const parsed = Date.parse(String(value || '').trim());
  if (Number.isNaN(parsed)) {
    return 0;
  }
  const elapsed = Date.now() - parsed;
  return Math.max(0, Math.floor(elapsed / 86400000));
}

function addDaysToRecruitmentIsoDateTime(value, days) {
  const parsed = Date.parse(String(value || '').trim());
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }
  const safeDays = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  return new Date(parsed + safeDays * 86400000).toISOString();
}

function getRecruitmentApplicationStageChangedAt(application) {
  const history = normalizeRecruitmentStatusHistory(
    application?.statusHistory,
    application?.status || 'Nouveau',
    application?.receivedOn || ''
  );
  for (let index = history.length - 1; index >= 0; index -= 1) {
    if (history[index]?.toStatus === application?.status && history[index]?.changedAt) {
      return history[index].changedAt;
    }
  }
  return normalizeRecruitmentHistoryTimestamp(application?.receivedOn, application?.receivedOn);
}

function hasRecruitmentOnboardingForApplication(reference, candidate, position) {
  const normalizedReference = String(reference || '').trim().toUpperCase();
  const normalizedCandidate = normalizeText(candidate);
  const normalizedPosition = normalizeText(position);

  return recruitmentOnboarding.some((item) => {
    const normalizedItem = normalizeRecruitmentOnboardingRecord(item);
    const itemReference = String(normalizedItem.applicationReference || '').trim().toUpperCase();
    if (normalizedReference && itemReference === normalizedReference) {
      return true;
    }
    return (
      normalizeText(normalizedItem.agent) === normalizedCandidate &&
      normalizeText(normalizedItem.position) === normalizedPosition
    );
  });
}

function buildRecruitmentNotificationsJournal() {
  const notifications = [];

  recruitmentApplications.forEach((application) => {
    const stageChangedAt = getRecruitmentApplicationStageChangedAt(application);
    const stageAgeDays = daysSinceRecruitmentDate(stageChangedAt);
    const campaign = findRecruitmentCampaign(String(application?.campaign || '').trim().toUpperCase());
    const recipient = String(campaign?.needOwner || 'responsable.rh').trim() || 'responsable.rh';
    const slaThreshold = RECRUITMENT_NOTIFICATION_SLA_DAYS_BY_STATUS[application.status];

    if (Number.isFinite(slaThreshold) && stageAgeDays > slaThreshold) {
      const overdueDays = stageAgeDays - slaThreshold;
      notifications.push({
        id: `REC-NOTIF-SLA-${application.reference}-${slaThreshold}`,
        type: 'Alerte SLA candidature',
        severity: overdueDays >= 3 ? 'Critique' : 'Alerte',
        status: 'Envoyee',
        channel: 'Email',
        recipient,
        reference: application.reference,
        candidate: application.candidate,
        campaign: application.campaign,
        message: `SLA depasse sur ${application.reference} (${application.status}) de ${overdueDays} jour(s).`,
        trigger: `SLA etape ${application.status} depasse (${slaThreshold} jour(s))`,
        sentAt: addDaysToRecruitmentIsoDateTime(stageChangedAt, slaThreshold),
      });
    }

    if (application.status === 'Entretien' && stageAgeDays >= RECRUITMENT_NOTIFICATION_INTERVIEW_REMINDER_DAYS) {
      notifications.push({
        id: `REC-NOTIF-ENTRETIEN-${application.reference}-${RECRUITMENT_NOTIFICATION_INTERVIEW_REMINDER_DAYS}`,
        type: 'Relance entretien',
        severity: stageAgeDays >= 6 ? 'Critique' : 'Alerte',
        status: 'Envoyee',
        channel: 'Email',
        recipient,
        reference: application.reference,
        candidate: application.candidate,
        campaign: application.campaign,
        message: `Relance entretien pour ${application.candidate} (${application.reference}) en attente depuis ${stageAgeDays} jour(s).`,
        trigger: 'Etape entretien non finalisee',
        sentAt: addDaysToRecruitmentIsoDateTime(stageChangedAt, RECRUITMENT_NOTIFICATION_INTERVIEW_REMINDER_DAYS),
      });
    }

    if (application.status === 'Retenu' && stageAgeDays >= RECRUITMENT_NOTIFICATION_VALIDATION_REMINDER_DAYS) {
      const hasOnboarding = hasRecruitmentOnboardingForApplication(
        application.reference,
        application.candidate,
        application.position
      );
      if (!hasOnboarding) {
        notifications.push({
          id: `REC-NOTIF-VALIDATION-${application.reference}-${RECRUITMENT_NOTIFICATION_VALIDATION_REMINDER_DAYS}`,
          type: 'Relance validation',
          severity: stageAgeDays >= 4 ? 'Critique' : 'Alerte',
          status: 'Envoyee',
          channel: 'Email',
          recipient,
          reference: application.reference,
          candidate: application.candidate,
          campaign: application.campaign,
          message: `Validation integration en attente pour ${application.reference}.`,
          trigger: 'Candidature retenue sans integration planifiee',
          sentAt: addDaysToRecruitmentIsoDateTime(stageChangedAt, RECRUITMENT_NOTIFICATION_VALIDATION_REMINDER_DAYS),
        });
      }
    }
  });

  recruitmentOnboarding.forEach((item) => {
    const normalizedItem = normalizeRecruitmentOnboardingRecord(item);
    const tasks = Array.isArray(normalizedItem.checklistTasks) ? normalizedItem.checklistTasks : [];
    tasks.forEach((task) => {
      if (task.status !== 'Bloquee') {
        return;
      }
      const blockedSince = normalizeRecruitmentOnboardingDate(
        task.blockedSince || task.dueDate || normalizedItem.startDate
      );
      if (!blockedSince) {
        return;
      }
      const blockedDays = daysSinceRecruitmentDate(blockedSince);
      if (blockedDays < 1) {
        return;
      }
      const reference = String(normalizedItem.applicationReference || '').trim().toUpperCase() || undefined;
      notifications.push({
        id: `REC-NOTIF-BLOCK-${reference || normalizedItem.agent}-${task.label}-${blockedSince}`
          .replace(/\s+/g, '-')
          .toUpperCase(),
        type: 'Relance validation',
        severity: task?.escalation?.level === 'N3' || blockedDays >= 5 ? 'Critique' : 'Alerte',
        status: 'Envoyee',
        channel: 'Email',
        recipient: String(task.assignedTo || 'RH Operations').trim() || 'RH Operations',
        reference,
        candidate: normalizedItem.agent,
        campaign: undefined,
        message: `Blocage onboarding: ${task.label} pour ${normalizedItem.agent}.`,
        trigger: String(task.blockedReason || 'Tache onboarding bloquee').trim(),
        sentAt: addDaysToRecruitmentIsoDateTime(blockedSince, 1),
      });
    });
  });

  const normalized = notifications
    .map((entry) => {
      const type = normalizeRecruitmentNotificationType(entry.type, 'Alerte SLA candidature');
      const severity = normalizeRecruitmentNotificationSeverity(entry.severity, 'Alerte');
      const status = normalizeRecruitmentNotificationStatus(entry.status, 'Envoyee');
      const sentAt = normalizeRecruitmentNotificationSentAt(entry.sentAt);
      const reference = String(entry.reference || '').trim().toUpperCase() || undefined;
      const candidate = String(entry.candidate || '').trim() || undefined;
      const campaign = String(entry.campaign || '').trim() || undefined;
      const channel = String(entry.channel || 'Email').trim() || 'Email';
      const recipient = String(entry.recipient || 'responsable.rh').trim() || 'responsable.rh';
      const message = String(entry.message || '').trim();
      const trigger = String(entry.trigger || 'Automatique').trim() || 'Automatique';
      const id = String(entry.id || '').trim()
        || `${type}-${reference || candidate || campaign || 'GLOBAL'}-${sentAt}`.replace(/\s+/g, '-').toUpperCase();
      return {
        id,
        type,
        severity,
        status,
        channel,
        recipient,
        reference,
        candidate,
        campaign,
        message: message || `${type} ${reference || candidate || ''}`.trim(),
        trigger,
        sentAt,
      };
    })
    .filter((entry) => !!entry.id && !!entry.message);

  const deduped = new Map();
  normalized.forEach((entry) => {
    const key = `${entry.type}|${entry.reference || ''}|${entry.candidate || ''}|${entry.message}|${entry.sentAt}`.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  });

  return Array.from(deduped.values()).sort((left, right) => {
    const leftTs = Date.parse(left.sentAt);
    const rightTs = Date.parse(right.sentAt);
    const safeLeft = Number.isNaN(leftTs) ? 0 : leftTs;
    const safeRight = Number.isNaN(rightTs) ? 0 : rightTs;
    return safeRight - safeLeft;
  });
}

function normalizeRecruitmentAuditAction(value, fallback = 'APPLICATION_STATUS_UPDATED') {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'APPLICATION_CREATED') return 'APPLICATION_CREATED';
  if (normalized === 'APPLICATION_STATUS_UPDATED') return 'APPLICATION_STATUS_UPDATED';
  if (normalized === 'APPLICATION_COMMENT_ADDED') return 'APPLICATION_COMMENT_ADDED';
  if (normalized === 'CAMPAIGN_CREATED') return 'CAMPAIGN_CREATED';
  if (normalized === 'ONBOARDING_CREATED') return 'ONBOARDING_CREATED';
  if (normalized === 'NOTIFICATION_SENT') return 'NOTIFICATION_SENT';
  return fallback;
}

function normalizeRecruitmentAuditEntityType(value, fallback = 'Application') {
  const normalized = normalizeText(value);
  if (normalized === 'application') return 'Application';
  if (normalized === 'campaign' || normalized === 'campagne') return 'Campaign';
  if (normalized === 'onboarding' || normalized === 'integration') return 'Onboarding';
  if (normalized === 'notification' || normalized === 'notifications') return 'Notification';
  return fallback;
}

function normalizeRecruitmentAuditOutcome(value, fallback = 'SUCCESS') {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === 'SUCCESS' || normalized === 'SUCCES') return 'SUCCESS';
  if (normalized === 'DENIED' || normalized === 'REFUSED') return 'DENIED';
  if (normalized === 'FAILED' || normalized === 'ECHEC') return 'FAILED';
  return fallback;
}

function normalizeRecruitmentAuditCreatedAt(value) {
  const parsed = Date.parse(String(value || '').trim());
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }
  return new Date().toISOString();
}

function buildRecruitmentAuditLogId(action, entityType, entityId, createdAt) {
  const safeAction = String(action || '').trim() || 'ACTION';
  const safeEntityType = String(entityType || '').trim() || 'ENTITY';
  const safeEntityId = String(entityId || '').trim() || 'GLOBAL';
  const safeDate = String(createdAt || '').trim() || new Date().toISOString();
  return `REC-AUDIT-${safeAction}-${safeEntityType}-${safeEntityId}-${safeDate}`
    .replace(/[^A-Z0-9-:T.Z_]/gi, '-')
    .replace(/-+/g, '-')
    .toUpperCase();
}

function appendRecruitmentAuditLog(entry) {
  const action = normalizeRecruitmentAuditAction(entry?.action, 'APPLICATION_STATUS_UPDATED');
  const entityType = normalizeRecruitmentAuditEntityType(entry?.entityType, 'Application');
  const entityId = String(entry?.entityId || entry?.reference || '').trim().toUpperCase() || undefined;
  const actor = String(entry?.actor || entry?.user || 'system').trim() || 'system';
  const outcome = normalizeRecruitmentAuditOutcome(entry?.outcome, 'SUCCESS');
  const detail = String(entry?.detail || entry?.message || '').trim()
    || `${action} ${entityId || ''}`.trim();
  const createdAt = normalizeRecruitmentAuditCreatedAt(entry?.createdAt || '');
  const id = String(entry?.id || '').trim() || buildRecruitmentAuditLogId(action, entityType, entityId || actor, createdAt);

  recruitmentAuditLogs.push({
    id,
    action,
    entityType,
    entityId,
    actor,
    outcome,
    detail,
    createdAt,
  });
}

function seedRecruitmentAuditLogs() {
  if (recruitmentAuditLogs.length > 0) {
    return;
  }

  recruitmentApplications.forEach((application) => {
    const history = normalizeRecruitmentStatusHistory(
      application.statusHistory,
      application.status,
      application.receivedOn
    );
    const createdAt = history[0]?.changedAt || normalizeRecruitmentHistoryTimestamp(application.receivedOn, application.receivedOn);
    appendRecruitmentAuditLog({
      action: 'APPLICATION_CREATED',
      entityType: 'Application',
      entityId: application.reference,
      actor: history[0]?.changedBy || 'system',
      detail: `Creation candidature ${application.reference}`,
      createdAt,
    });

    history
      .filter((entry) => !!entry.fromStatus)
      .forEach((entry) => {
        appendRecruitmentAuditLog({
          action: 'APPLICATION_STATUS_UPDATED',
          entityType: 'Application',
          entityId: application.reference,
          actor: entry.changedBy || 'system',
          detail: `Transition ${entry.fromStatus} -> ${entry.toStatus}`,
          createdAt: entry.changedAt,
        });
      });

    (application.comments || []).forEach((comment) => {
      appendRecruitmentAuditLog({
        action: 'APPLICATION_COMMENT_ADDED',
        entityType: 'Application',
        entityId: application.reference,
        actor: comment.author || 'system',
        detail: `Commentaire ajoute sur ${application.reference}`,
        createdAt: comment.createdAt,
      });
    });
  });

  recruitmentCampaigns.forEach((campaign) => {
    appendRecruitmentAuditLog({
      action: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign.code,
      actor: campaign.needOwner || 'responsable.rh',
      detail: `Creation campagne ${campaign.code}`,
      createdAt: campaign.startDate,
    });
  });

  recruitmentOnboarding.forEach((item) => {
    const normalizedItem = normalizeRecruitmentOnboardingRecord(item);
    const entityId = String(normalizedItem.applicationReference || '').trim().toUpperCase()
      || `${normalizedItem.agent}-${normalizedItem.position}-${normalizedItem.startDate}`;
    appendRecruitmentAuditLog({
      action: 'ONBOARDING_CREATED',
      entityType: 'Onboarding',
      entityId,
      actor: 'rh.operations',
      detail: `Creation parcours integration ${normalizedItem.agent}`,
      createdAt: normalizedItem.startDate,
    });
  });

  buildRecruitmentNotificationsJournal().forEach((notification) => {
    appendRecruitmentAuditLog({
      action: 'NOTIFICATION_SENT',
      entityType: 'Notification',
      entityId: notification.reference || notification.id,
      actor: notification.recipient || 'system',
      outcome: notification.status === 'Echec' ? 'FAILED' : 'SUCCESS',
      detail: `${notification.type} - ${notification.message}`,
      createdAt: notification.sentAt,
    });
  });
}

function findRecruitmentOnboarding(agent, position, startDate) {
  return recruitmentOnboarding.find(
    (item) =>
      normalizeText(item.agent) === normalizeText(agent) &&
      normalizeText(item.position) === normalizeText(position) &&
      String(item.startDate || '') === String(startDate || '')
  );
}

function normalizeRecruitmentOnboardingStatus(value, fallback = 'Planifie') {
  const statusRaw = normalizeText(value || fallback);
  if (statusRaw === 'bloque' || statusRaw === 'bloquee' || statusRaw === 'blocked') return 'Bloque';
  if (statusRaw === 'en cours' || statusRaw === 'en_cours' || statusRaw === 'encours') return 'En cours';
  if (statusRaw === 'termine' || statusRaw === 'valide') return 'Termine';
  return 'Planifie';
}

function normalizeRecruitmentOnboardingTaskStatus(value, fallback = 'A faire') {
  const statusRaw = normalizeText(value || fallback);
  if (statusRaw === 'bloque' || statusRaw === 'bloquee' || statusRaw === 'blocked') return 'Bloquee';
  if (statusRaw === 'en cours' || statusRaw === 'en_cours' || statusRaw === 'encours') return 'En cours';
  if (statusRaw === 'termine' || statusRaw === 'valide' || statusRaw === 'done') return 'Termine';
  return 'A faire';
}

function normalizeRecruitmentOnboardingEscalationLevel(value) {
  const normalized = normalizeText(value);
  if (normalized === 'n1' || normalized === 'niveau1') return 'N1';
  if (normalized === 'n2' || normalized === 'niveau2') return 'N2';
  if (normalized === 'n3' || normalized === 'niveau3') return 'N3';
  return null;
}

function findRecruitmentOnboardingTemplate(position, templateId = '') {
  const normalizedTemplateId = String(templateId || '').trim().toUpperCase();
  if (normalizedTemplateId) {
    const byId = recruitmentOnboardingTemplates.find((template) => String(template.id || '').trim().toUpperCase() === normalizedTemplateId);
    if (byId) return byId;
  }

  const normalizedPosition = normalizeText(position);
  if (!normalizedPosition) {
    return null;
  }

  return recruitmentOnboardingTemplates.find((template) =>
    Array.isArray(template.keywords) && template.keywords.some((keyword) => normalizedPosition.includes(normalizeText(keyword)))
  ) || null;
}

function deriveRecruitmentOnboardingTaskDefaultStatus(index, onboardingStatus) {
  const normalizedOnboardingStatus = normalizeText(onboardingStatus);
  if (normalizedOnboardingStatus === 'termine' || normalizedOnboardingStatus === 'valide') {
    return 'Termine';
  }
  if (normalizedOnboardingStatus === 'bloque' || normalizedOnboardingStatus === 'bloquee' || normalizedOnboardingStatus === 'blocked') {
    if (index === 0) return 'Bloquee';
    return 'A faire';
  }
  if (normalizedOnboardingStatus === 'en cours' || normalizedOnboardingStatus === 'en_cours' || normalizedOnboardingStatus === 'encours') {
    if (index === 0) return 'Termine';
    if (index === 1) return 'En cours';
  }
  return 'A faire';
}

function addDaysIsoDate(baseDate, daysToAdd) {
  const parsed = Date.parse(String(baseDate || '').trim());
  if (Number.isNaN(parsed)) {
    return undefined;
  }
  const date = new Date(parsed);
  date.setUTCDate(date.getUTCDate() + Math.max(0, Number(daysToAdd) || 0));
  return date.toISOString().slice(0, 10);
}

function normalizeRecruitmentOnboardingDate(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function daysSinceIsoDate(isoDate) {
  const normalized = normalizeRecruitmentOnboardingDate(isoDate);
  if (!normalized) {
    return 0;
  }
  const parsed = Date.parse(`${normalized}T00:00:00Z`);
  if (Number.isNaN(parsed)) {
    return 0;
  }
  const elapsedMs = Date.now() - parsed;
  return Math.max(0, Math.floor(elapsedMs / 86400000));
}

function computeRecruitmentOnboardingEscalation(blockedSince) {
  const blockedDate = normalizeRecruitmentOnboardingDate(blockedSince);
  if (!blockedDate) {
    return null;
  }
  const elapsedDays = daysSinceIsoDate(blockedDate);
  if (elapsedDays < RECRUITMENT_ONBOARDING_ESCALATION_DELAY_DAYS) {
    return null;
  }

  let level = 'N1';
  if (elapsedDays >= 8) level = 'N3';
  else if (elapsedDays >= 5) level = 'N2';

  return {
    level,
    triggeredAt: addDaysIsoDate(blockedDate, RECRUITMENT_ONBOARDING_ESCALATION_DELAY_DAYS) || blockedDate,
    delayDays: elapsedDays,
    target: RECRUITMENT_ONBOARDING_ESCALATION_TARGET_BY_LEVEL[level] || RECRUITMENT_ONBOARDING_ESCALATION_TARGET_BY_LEVEL.N1,
  };
}

function normalizeRecruitmentOnboardingTaskEscalation(inputEscalation, blockedSince) {
  const autoEscalation = computeRecruitmentOnboardingEscalation(blockedSince);
  if (!inputEscalation || typeof inputEscalation !== 'object') {
    return autoEscalation;
  }

  const level = normalizeRecruitmentOnboardingEscalationLevel(inputEscalation.level) || autoEscalation?.level;
  if (!level) {
    return autoEscalation;
  }
  const triggeredAt = normalizeRecruitmentOnboardingDate(
    inputEscalation.triggeredAt || inputEscalation.triggered_at || autoEscalation?.triggeredAt || blockedSince
  );
  const delayCandidate = Number(inputEscalation.delayDays ?? inputEscalation.delay_days);
  const delayDays = Number.isFinite(delayCandidate)
    ? Math.max(0, Math.floor(delayCandidate))
    : autoEscalation?.delayDays || 0;
  const target = String(inputEscalation.target || autoEscalation?.target || RECRUITMENT_ONBOARDING_ESCALATION_TARGET_BY_LEVEL[level] || '').trim()
    || RECRUITMENT_ONBOARDING_ESCALATION_TARGET_BY_LEVEL[level];

  return {
    level,
    triggeredAt: triggeredAt || autoEscalation?.triggeredAt || blockedSince || new Date().toISOString().slice(0, 10),
    delayDays,
    target,
  };
}

function normalizeRecruitmentOnboardingHistoryType(value) {
  const normalized = normalizeText(value);
  if (normalized === 'blocage' || normalized === 'blocked') return 'Blocage';
  if (normalized === 'deblocage' || normalized === 'unblocked') return 'Deblocage';
  if (normalized === 'escalade auto' || normalized === 'escalade_auto' || normalized === 'auto escalation') return 'Escalade auto';
  return null;
}

function buildRecruitmentOnboardingHistoryFromTasks(tasks) {
  const items = [];
  (Array.isArray(tasks) ? tasks : []).forEach((task) => {
    if (task.status !== 'Bloquee') {
      return;
    }
    const blockedDate = normalizeRecruitmentOnboardingDate(task.blockedSince || task.dueDate || '');
    if (blockedDate) {
      items.push({
        id: `BLOCAGE-${task.label}-${blockedDate}`.replace(/\s+/g, '-').toUpperCase(),
        type: 'Blocage',
        taskLabel: task.label,
        detail: task.blockedReason || `Blocage detecte sur la tache ${task.label}`,
        occurredAt: blockedDate,
      });
    }
    if (task.escalation?.level && task.escalation?.triggeredAt) {
      items.push({
        id: `ESCALADE-${task.label}-${task.escalation.triggeredAt}-${task.escalation.level}`.replace(/\s+/g, '-').toUpperCase(),
        type: 'Escalade auto',
        taskLabel: task.label,
        detail: `Escalade ${task.escalation.level} vers ${task.escalation.target}`,
        occurredAt: task.escalation.triggeredAt,
        escalationLevel: task.escalation.level,
      });
    }
  });
  return items;
}

function normalizeRecruitmentOnboardingHistory(inputHistory, tasks) {
  const automaticHistory = buildRecruitmentOnboardingHistoryFromTasks(tasks);
  const manualHistory = Array.isArray(inputHistory)
    ? inputHistory
        .map((entry) => {
          const type = normalizeRecruitmentOnboardingHistoryType(entry?.type);
          const taskLabel = String(entry?.taskLabel || entry?.task_label || '').trim();
          const detail = String(entry?.detail || entry?.message || '').trim();
          const occurredAt = normalizeRecruitmentOnboardingDate(entry?.occurredAt || entry?.occurred_at || '');
          if (!type || !taskLabel || !detail || !occurredAt) {
            return null;
          }
          const escalationLevel = normalizeRecruitmentOnboardingEscalationLevel(entry?.escalationLevel || entry?.escalation_level || '');
          const id = String(entry?.id || '').trim()
            || `${type}-${taskLabel}-${occurredAt}`.replace(/\s+/g, '-').toUpperCase();
          return {
            id,
            type,
            taskLabel,
            detail,
            occurredAt,
            escalationLevel: escalationLevel || undefined,
          };
        })
        .filter((entry) => !!entry)
    : [];

  const merged = [...manualHistory, ...automaticHistory];
  const deduped = new Map();
  merged.forEach((event) => {
    const key = `${event.type}|${event.taskLabel}|${event.occurredAt}|${event.detail}|${event.escalationLevel || ''}`.toLowerCase();
    if (!deduped.has(key)) {
      deduped.set(key, event);
    }
  });
  return Array.from(deduped.values()).sort((left, right) => {
    const leftTime = Date.parse(left.occurredAt);
    const rightTime = Date.parse(right.occurredAt);
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
    return safeRight - safeLeft;
  });
}

function buildRecruitmentOnboardingChecklistTasks(inputTasks, inputChecklist, template, onboardingStatus, startDate) {
  const templateTasks = Array.isArray(template?.tasks)
    ? template.tasks
        .map((task) => ({
          label: String(task?.label || '').trim(),
          assignedTo: String(task?.assignedTo || '').trim() || 'RH Operations',
        }))
        .filter((task) => task.label.length > 0)
    : [];

  const templateTaskByLabel = new Map(
    templateTasks.map((task) => [normalizeText(task.label), task])
  );

  const normalizedInputTasks = Array.isArray(inputTasks)
    ? inputTasks
        .map((entry) => {
          const label = String(entry?.label ?? entry?.title ?? entry?.name ?? '').trim();
          if (!label) {
            return null;
          }
          const templateMatch = templateTaskByLabel.get(normalizeText(label));
          const assignedTo = String(entry?.assignedTo ?? entry?.assigned_to ?? entry?.owner ?? templateMatch?.assignedTo ?? 'RH Operations').trim() || 'RH Operations';
          const status = normalizeRecruitmentOnboardingTaskStatus(
            entry?.status,
            deriveRecruitmentOnboardingTaskDefaultStatus(0, onboardingStatus)
          );
          const dueDate = normalizeRecruitmentOnboardingDate(entry?.dueDate ?? entry?.due_date ?? '');
          const blockedReason = String(
            entry?.blockedReason ??
              entry?.blocked_reason ??
              entry?.blockReason ??
              entry?.block_reason ??
              ''
          ).trim();
          const blockedSince = normalizeRecruitmentOnboardingDate(
            entry?.blockedSince ?? entry?.blocked_since ?? entry?.blockedAt ?? entry?.blocked_at ?? ''
          );
          const escalation = normalizeRecruitmentOnboardingTaskEscalation(
            entry?.escalation ?? entry?.escalationInfo ?? entry?.escalation_info ?? null,
            blockedSince || dueDate
          );
          if (status === 'Bloquee') {
            return {
              label,
              assignedTo,
              status,
              dueDate: dueDate || undefined,
              blockedReason: blockedReason || 'Blocage en attente de resolution',
              blockedSince: blockedSince || dueDate || undefined,
              escalation: escalation || undefined,
            };
          }
          return {
            label,
            assignedTo,
            status,
            dueDate: dueDate || undefined,
          };
        })
        .filter((task) => !!task)
    : [];

  if (normalizedInputTasks.length > 0) {
    return normalizedInputTasks.map((task, index) => ({
      ...task,
      dueDate: task.dueDate || addDaysIsoDate(startDate, index),
      blockedReason: task.status === 'Bloquee'
        ? task.blockedReason || 'Blocage en attente de resolution'
        : undefined,
      blockedSince: task.status === 'Bloquee'
        ? task.blockedSince || task.dueDate || addDaysIsoDate(startDate, index)
        : undefined,
      escalation: task.status === 'Bloquee'
        ? normalizeRecruitmentOnboardingTaskEscalation(task.escalation || null, task.blockedSince || task.dueDate || addDaysIsoDate(startDate, index))
        : undefined,
    }));
  }

  const checklistSource = Array.isArray(inputChecklist)
    ? inputChecklist.map((item) => String(item || '').trim()).filter((item) => item.length > 0)
    : [];
  const baseChecklist = checklistSource.length > 0
    ? checklistSource
    : templateTasks.length > 0
      ? templateTasks.map((task) => task.label)
      : ['Accueil et prise de poste'];

  return baseChecklist.map((label, index) => {
    const templateMatch = templateTaskByLabel.get(normalizeText(label));
    const status = deriveRecruitmentOnboardingTaskDefaultStatus(index, onboardingStatus);
    const dueDate = addDaysIsoDate(startDate, index);
    return {
      label,
      assignedTo: templateMatch?.assignedTo || 'RH Operations',
      status,
      dueDate,
      blockedReason: status === 'Bloquee' ? 'Blocage en attente de resolution' : undefined,
      blockedSince: status === 'Bloquee' ? dueDate : undefined,
      escalation: status === 'Bloquee'
        ? normalizeRecruitmentOnboardingTaskEscalation(null, dueDate)
        : undefined,
    };
  });
}

function buildRecruitmentOnboardingChecklistProgress(checklistTasks, onboardingStatus) {
  const tasks = Array.isArray(checklistTasks) ? checklistTasks : [];
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === 'Termine').length;
  const inProgress = tasks.filter((task) => task.status === 'En cours').length;
  const blocked = tasks.filter((task) => task.status === 'Bloquee').length;
  const todo = Math.max(0, total - completed - inProgress - blocked);
  const completionRate = total > 0 ? (completed / total) * 100 : 0;

  let status = 'Non demarre';
  if (total > 0 && completed === total) {
    status = 'Termine';
  } else if (blocked > 0) {
    status = 'Bloque';
  } else if (inProgress > 0 || completed > 0) {
    status = 'En cours';
  } else {
    const normalizedOnboardingStatus = normalizeText(onboardingStatus);
    if (normalizedOnboardingStatus === 'termine' || normalizedOnboardingStatus === 'valide') status = 'Termine';
    else if (normalizedOnboardingStatus === 'en cours' || normalizedOnboardingStatus === 'en_cours' || normalizedOnboardingStatus === 'encours') status = 'En cours';
    else if (normalizedOnboardingStatus === 'bloque' || normalizedOnboardingStatus === 'bloquee' || normalizedOnboardingStatus === 'blocked') status = 'Bloque';
  }

  return {
    total,
    completed,
    inProgress,
    blocked,
    todo,
    completionRate,
    status,
  };
}

function normalizeRecruitmentOnboardingRecord(item) {
  const normalizedStatus = normalizeRecruitmentOnboardingStatus(item?.status || 'Planifie', 'Planifie');
  const template = findRecruitmentOnboardingTemplate(item?.position || '', item?.templateId || item?.template_id || '');
  const checklistSource = Array.isArray(item?.checklist)
    ? item.checklist
    : Array.isArray(item?.tasks)
      ? item.tasks
      : [];
  const checklistTasksSource = Array.isArray(item?.checklistTasks)
    ? item.checklistTasks
    : Array.isArray(item?.checklist_tasks)
      ? item.checklist_tasks
      : Array.isArray(item?.tasksDetailed)
        ? item.tasksDetailed
        : Array.isArray(item?.task_assignments)
          ? item.task_assignments
          : [];
  const historySource = Array.isArray(item?.history)
    ? item.history
    : Array.isArray(item?.onboardingHistory)
      ? item.onboardingHistory
      : Array.isArray(item?.onboarding_history)
        ? item.onboarding_history
        : [];

  const checklistTasks = buildRecruitmentOnboardingChecklistTasks(
    checklistTasksSource,
    checklistSource,
    template,
    normalizedStatus,
    item?.startDate || item?.start_date || ''
  );
  const checklist = checklistTasks.map((task) => task.label);
  const progress = buildRecruitmentOnboardingChecklistProgress(checklistTasks, normalizedStatus);
  const history = normalizeRecruitmentOnboardingHistory(historySource, checklistTasks);
  const blockedTasksCount = checklistTasks.filter((task) => task.status === 'Bloquee').length;
  const escalatedTasksCount = checklistTasks.filter((task) => !!task.escalation).length;

  return {
    agent: String(item?.agent || item?.agentName || item?.agent_name || '').trim(),
    position: String(item?.position || item?.positionTitle || item?.position_title || '').trim(),
    startDate: String(item?.startDate || item?.start_date || '').trim(),
    checklist,
    checklistTasks,
    progress,
    templateId: template?.id || String(item?.templateId || item?.template_id || '').trim() || undefined,
    history,
    blockedTasksCount,
    escalatedTasksCount,
    status: normalizedStatus,
    applicationReference: String(
      item?.applicationReference || item?.application_reference || item?.applicationRef || item?.application_ref || ''
    ).trim().toUpperCase() || undefined,
  };
}

function validateRecruitmentOnboardingCreatePayload(body) {
  const errors = [];

  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const position = String(body.position || body.positionTitle || body.position_title || '').trim();
  const startDate = String(body.startDate || body.start_date || '').trim();
  const templateIdInput = String(body.templateId || body.template_id || '').trim();
  const applicationReference = String(
    body.applicationReference ||
      body.application_reference ||
      body.applicationRef ||
      body.application_ref ||
      ''
  ).trim().toUpperCase();
  const checklistSource = Array.isArray(body.checklist)
    ? body.checklist
    : Array.isArray(body.tasks)
      ? body.tasks
      : [];
  const checklistTasksSource = Array.isArray(body.checklistTasks)
    ? body.checklistTasks
    : Array.isArray(body.checklist_tasks)
      ? body.checklist_tasks
      : Array.isArray(body.tasksDetailed)
        ? body.tasksDetailed
        : Array.isArray(body.task_assignments)
          ? body.task_assignments
          : [];
  const historySource = Array.isArray(body.history)
    ? body.history
    : Array.isArray(body.onboardingHistory)
      ? body.onboardingHistory
      : Array.isArray(body.onboarding_history)
        ? body.onboarding_history
        : [];

  const status = normalizeRecruitmentOnboardingStatus(body.status || 'Planifie', 'Planifie');
  const template = findRecruitmentOnboardingTemplate(position, templateIdInput);
  const checklistTasks = buildRecruitmentOnboardingChecklistTasks(
    checklistTasksSource,
    checklistSource,
    template,
    status,
    startDate
  );
  const checklist = checklistTasks.map((task) => task.label);
  const progress = buildRecruitmentOnboardingChecklistProgress(checklistTasks, status);
  const history = normalizeRecruitmentOnboardingHistory(historySource, checklistTasks);
  const blockedTasksCount = checklistTasks.filter((task) => task.status === 'Bloquee').length;
  const escalatedTasksCount = checklistTasks.filter((task) => !!task.escalation).length;

  const sourceApplication = applicationReference ? findRecruitmentApplication(applicationReference) : null;

  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (position.length < 2) {
    errors.push('Poste requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.push('Date debut integration invalide');
  }
  if (applicationReference && !/^[A-Z0-9-]{3,40}$/.test(applicationReference)) {
    errors.push('Reference candidature source invalide');
  }
  if (applicationReference && !sourceApplication) {
    errors.push('Reference candidature source introuvable');
  }
  if (sourceApplication && sourceApplication.status !== 'Retenu') {
    errors.push('La candidature source doit etre au statut Retenu');
  }
  if (templateIdInput && !template) {
    errors.push('Template onboarding introuvable');
  }
  if (checklist.some((item) => item.length > 160)) {
    errors.push('Checklist contient une etape trop longue');
  }
  if (checklistTasks.some((task) => String(task.assignedTo || '').trim().length > 120)) {
    errors.push('Checklist contient un assignee trop long');
  }
  if (checklistTasks.some((task) => task.status === 'Bloquee' && String(task.blockedReason || '').trim().length < 3)) {
    errors.push('Chaque tache bloquee doit avoir une raison de blocage');
  }
  if (history.some((event) => String(event.detail || '').trim().length > 240)) {
    errors.push('Historique onboarding contient un detail trop long');
  }
  if (agent && position && startDate && findRecruitmentOnboarding(agent, position, startDate)) {
    errors.push('Parcours integration deja existant');
  }

  return {
    errors,
    payload: {
      agent,
      position,
      startDate,
      checklist,
      checklistTasks,
      progress,
      templateId: template?.id || templateIdInput || null,
      history,
      blockedTasksCount,
      escalatedTasksCount,
      status,
      applicationReference: applicationReference || null,
    },
  };
}

for (let index = 0; index < recruitmentOnboarding.length; index += 1) {
  recruitmentOnboarding[index] = normalizeRecruitmentOnboardingRecord(recruitmentOnboarding[index]);
}
for (let index = 0; index < recruitmentInterviewSchedules.length; index += 1) {
  recruitmentInterviewSchedules[index] = normalizeRecruitmentInterviewSchedule(recruitmentInterviewSchedules[index]);
}
seedRecruitmentAuditLogs();

function upsertRecruitmentShortlistValidation(entry) {
  const reference = String(entry?.reference || '').trim().toUpperCase();
  if (!reference) {
    return null;
  }

  const normalized = {
    reference,
    decision: entry?.decision === 'REJECTED' ? 'REJECTED' : 'VALIDATED',
    note: String(entry?.note || '').trim() || undefined,
    validatedAt: String(entry?.validatedAt || '').trim() || new Date().toISOString(),
    validatedBy: String(entry?.validatedBy || '').trim() || 'system',
  };

  const index = recruitmentShortlistValidations.findIndex(
    (item) => String(item?.reference || '').trim().toUpperCase() === reference
  );
  if (index >= 0) {
    recruitmentShortlistValidations[index] = normalized;
  } else {
    recruitmentShortlistValidations.push(normalized);
  }
  trimRecruitmentShortlistValidationJournal();
  return normalized;
}

function getRecruitmentShortlistValidation(reference) {
  const normalizedReference = String(reference || '').trim().toUpperCase();
  if (!normalizedReference) {
    return null;
  }
  return recruitmentShortlistValidations.find(
    (item) => String(item?.reference || '').trim().toUpperCase() === normalizedReference
  ) || null;
}

function resolveRecruitmentDuplicateLink(payload) {
  const primary = findRecruitmentApplication(payload.primaryReference);
  const secondary = findRecruitmentApplication(payload.secondaryReference);
  if (!primary || !secondary) {
    return null;
  }

  const mode = payload.mode === 'merge' ? 'merge' : 'link';
  const record = {
    id: payload.id,
    primaryReference: payload.primaryReference,
    secondaryReference: payload.secondaryReference,
    mode,
    reason: payload.reason,
    linkedAt: payload.linkedAt,
    linkedBy: payload.linkedBy,
  };

  const existingIndex = recruitmentDuplicateLinks.findIndex(
    (item) =>
      item.primaryReference === record.primaryReference &&
      item.secondaryReference === record.secondaryReference
  );
  if (existingIndex >= 0) {
    recruitmentDuplicateLinks[existingIndex] = record;
  } else {
    recruitmentDuplicateLinks.push(record);
  }

  if (mode === 'merge') {
    const primaryComments = normalizeRecruitmentApplicationComments(primary.comments, primary.reference);
    const secondaryComments = normalizeRecruitmentApplicationComments(secondary.comments, secondary.reference);
    const mergedComments = normalizeRecruitmentApplicationComments(
      [...primaryComments, ...secondaryComments],
      primary.reference
    );
    primary.comments = mergedComments;

    const primaryAttachments = normalizeRecruitmentApplicationAttachments(primary.attachments, primary.reference);
    const secondaryAttachments = normalizeRecruitmentApplicationAttachments(secondary.attachments, secondary.reference);
    primary.attachments = normalizeRecruitmentApplicationAttachments(
      [...primaryAttachments, ...secondaryAttachments],
      primary.reference
    );

    const secondaryHistory = normalizeRecruitmentStatusHistory(
      secondary.statusHistory,
      secondary.status,
      secondary.receivedOn
    );
    primary.statusHistory = normalizeRecruitmentStatusHistory(
      [...normalizeRecruitmentStatusHistory(primary.statusHistory, primary.status, primary.receivedOn), ...secondaryHistory],
      primary.status,
      primary.receivedOn
    );

    secondary.status = 'Rejete';
    secondary.statusHistory = normalizeRecruitmentStatusHistory(
      secondary.statusHistory,
      secondary.status,
      secondary.receivedOn
    );
    secondary.statusHistory.push({
      fromStatus: secondary.statusHistory[secondary.statusHistory.length - 1]?.toStatus || 'Nouveau',
      toStatus: 'Rejete',
      changedAt: new Date().toISOString(),
      changedBy: payload.linkedBy,
      note: `Fusion vers ${primary.reference}`,
    });
  }

  return {
    link: record,
    primary,
    secondary,
  };
}

function normalizeCareerMovementType(value, fallback = 'Mutation') {
  const normalized = normalizeText(value);
  if (normalized === 'avancement') return 'Avancement';
  if (normalized === 'mutation') return 'Mutation';
  if (normalized === 'detachement') return 'Détachement';
  if (normalized === 'promotion') return 'Promotion';
  return fallback;
}

function findCareerMovement(reference) {
  return careerMovements.find((item) => item.reference === reference);
}

function buildCareerMovementReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^CAR-${year}-(\\d+)$`);
  const maxExisting = careerMovements.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `CAR-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function validateCareerMovementCreatePayload(body) {
  const errors = [];

  const reference = String(body.reference || body.requestRef || body.request_ref || '').trim().toUpperCase();
  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const typeInput = String(body.type || body.movementType || body.movement_type || '').trim();
  const type = normalizeCareerMovementType(typeInput, '');
  const from = String(body.from || body.fromLabel || body.from_label || '').trim();
  const to = String(body.to || body.toLabel || body.to_label || '').trim();
  const effectiveDate = String(body.effectiveDate || body.effective_date || '').trim();

  const statusRaw = normalizeText(body.status || 'en attente');
  let status = 'En attente';
  if (statusRaw === 'propose') status = 'Propose';
  else if (statusRaw === 'valide') status = 'Valide';
  else if (statusRaw === 'rejete' || statusRaw === 'refuse') status = 'Rejete';

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference mouvement invalide');
  }
  if (reference && findCareerMovement(reference)) {
    errors.push('Reference mouvement deja existante');
  }
  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (!type) {
    errors.push('Type mouvement invalide');
  }
  if (from.length < 1) {
    errors.push('Origine requise');
  }
  if (to.length < 1) {
    errors.push('Destination requise');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || Number.isNaN(Date.parse(effectiveDate))) {
    errors.push('Date effet invalide');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      agent,
      type: normalizeCareerMovementType(type, 'Mutation'),
      from,
      to,
      effectiveDate,
      status,
    },
  };
}

function findLeaveRequest(reference) {
  return leaveRequests.find((item) => item.reference === reference);
}

function buildLeaveRequestReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^ABS-${year}-(\\d+)$`);
  const maxExisting = leaveRequests.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `ABS-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function validateLeaveRequestCreatePayload(body) {
  const errors = [];

  const reference = String(body.reference || body.requestRef || body.request_ref || '').trim().toUpperCase();
  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const type = String(body.type || body.leaveType || body.leave_type || '').trim();
  const startDate = String(body.startDate || body.start_date || '').trim();
  const endDate = String(body.endDate || body.end_date || '').trim();

  const statusRaw = normalizeText(body.status || 'en attente');
  let status = 'En attente';
  if (statusRaw === 'en cours') status = 'En cours';
  else if (statusRaw === 'approuve') status = 'Approuve';
  else if (statusRaw === 'rejete') status = 'Rejete';

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference demande invalide');
  }
  if (reference && findLeaveRequest(reference)) {
    errors.push('Reference demande deja existante');
  }
  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (type.length < 2) {
    errors.push('Type absence requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.push('Date debut invalide');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || Number.isNaN(Date.parse(endDate))) {
    errors.push('Date fin invalide');
  }
  if (!Number.isNaN(Date.parse(startDate)) && !Number.isNaN(Date.parse(endDate))) {
    if (Date.parse(endDate) < Date.parse(startDate)) {
      errors.push('Date fin doit etre superieure ou egale a date debut');
    }
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      agent,
      type,
      startDate,
      endDate,
      status,
    },
  };
}

function findLeaveBalance(type) {
  const expected = normalizeText(type);
  return leaveBalances.find((item) => normalizeText(item.type) === expected);
}

function validateLeaveBalanceCreatePayload(body) {
  const errors = [];

  const type = String(body.type || body.leaveType || body.leave_type || '').trim();
  const allocatedRaw = Number(body.allocated ?? body.allocatedDays ?? body.allocated_days ?? 0);
  const consumedRaw = Number(body.consumed ?? body.consumedDays ?? body.consumed_days ?? 0);
  const allocated = Number.isFinite(allocatedRaw) ? Math.max(0, Math.round(allocatedRaw)) : 0;
  const consumed = Number.isFinite(consumedRaw) ? Math.max(0, Math.round(consumedRaw)) : 0;

  if (type.length < 2) {
    errors.push('Type de conge requis');
  }
  if (!Number.isFinite(allocatedRaw) || allocatedRaw < 0) {
    errors.push('Jours alloues invalides');
  }
  if (!Number.isFinite(consumedRaw) || consumedRaw < 0) {
    errors.push('Jours consommes invalides');
  }
  if (consumed > allocated) {
    errors.push('Jours consommes ne peuvent pas depasser jours alloues');
  }

  return {
    errors,
    payload: {
      type,
      allocated,
      consumed: Math.min(consumed, allocated),
      remaining: Math.max(0, allocated - consumed),
    },
  };
}

function normalizeLeaveEventClass(value) {
  const normalized = String(value || '').trim();
  const allowed = [
    'bg-primary-transparent',
    'bg-warning-transparent',
    'bg-success-transparent',
    'bg-info-transparent',
    'bg-danger-transparent',
  ];
  if (allowed.includes(normalized)) {
    return normalized;
  }
  return 'bg-primary-transparent';
}

function validateLeaveEventCreatePayload(body) {
  const errors = [];

  const title = String(body.title || body.label || '').trim();
  const start = String(body.start || body.startDate || body.start_date || '').trim();
  const end = String(body.end || body.endDate || body.end_date || '').trim();
  const className = normalizeLeaveEventClass(body.className || body.class_name || body.colorClass || '');

  if (title.length < 2) {
    errors.push('Titre evenement requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start))) {
    errors.push('Date debut evenement invalide');
  }
  if (end && (!/^\d{4}-\d{2}-\d{2}$/.test(end) || Number.isNaN(Date.parse(end)))) {
    errors.push('Date fin evenement invalide');
  }
  if (end && !Number.isNaN(Date.parse(start)) && !Number.isNaN(Date.parse(end))) {
    if (Date.parse(end) < Date.parse(start)) {
      errors.push('Date fin evenement doit etre superieure ou egale a date debut');
    }
  }

  return {
    errors,
    payload: {
      title,
      start,
      end: end || null,
      className,
    },
  };
}

function findPerformanceCampaign(code) {
  return performanceCampaigns.find((item) => item.code === code);
}

function buildPerformanceCampaignCode() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^PERF-${year}-C(\\d+)$`);
  const maxExisting = performanceCampaigns.reduce((max, item) => {
    const match = regex.exec(String(item.code || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `PERF-${year}-C${String(maxExisting + 1).padStart(2, '0')}`;
}

function validatePerformanceCampaignCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const title = String(body.title || body.name || '').trim();
  const period = String(body.period || '').trim();
  const population = String(body.population || body.targetPopulation || body.target_population || '').trim();

  const statusRaw = normalizeText(body.status || 'planifiee');
  let status = 'Planifiee';
  if (statusRaw === 'active') status = 'Active';
  else if (statusRaw === 'suspendue') status = 'Suspendue';
  else if (statusRaw === 'cloturee' || statusRaw === 'clôturée') status = 'Cloturee';

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code campagne evaluation invalide');
  }
  if (code && findPerformanceCampaign(code)) {
    errors.push('Code campagne evaluation deja existant');
  }
  if (title.length < 2) {
    errors.push('Intitule campagne requis');
  }
  if (period.length < 3) {
    errors.push('Periode requise');
  }
  if (population.length < 2) {
    errors.push('Population cible requise');
  }

  return {
    errors,
    payload: {
      code: code || null,
      title,
      period,
      population,
      status,
    },
  };
}

function findPerformanceResult(agent, direction) {
  return performanceResults.find(
    (item) =>
      normalizeText(item.agent) === normalizeText(agent) &&
      normalizeText(item.direction) === normalizeText(direction)
  );
}

function normalizePerformanceScore(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  const rounded = Math.round(parsed);
  return Math.max(0, Math.min(100, rounded));
}

function validatePerformanceResultCreatePayload(body) {
  const errors = [];

  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const direction = String(body.direction || body.directionName || body.direction_name || '').trim();
  const managerScore = normalizePerformanceScore(body.managerScore ?? body.manager_score);
  const selfScore = normalizePerformanceScore(body.selfScore ?? body.self_score);
  const finalRaw = body.finalScore ?? body.final_score;
  const finalScore = finalRaw === undefined || finalRaw === null
    ? null
    : normalizePerformanceScore(finalRaw);

  const statusRaw = normalizeText(body.status || 'en revue');
  let status = 'En revue';
  if (statusRaw === 'valide') status = 'Valide';
  else if (statusRaw === 'publie' || statusRaw === 'publié') status = 'Publie';
  else if (statusRaw === 'brouillon') status = 'Brouillon';

  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (direction.length < 2) {
    errors.push('Direction requise');
  }
  if (managerScore === null) {
    errors.push('Score manager invalide');
  }
  if (selfScore === null) {
    errors.push('Score auto-evaluation invalide');
  }
  if (finalRaw !== undefined && finalRaw !== null && finalScore === null) {
    errors.push('Score final invalide');
  }

  return {
    errors,
    payload: {
      agent,
      direction,
      managerScore: managerScore === null ? 0 : managerScore,
      selfScore: selfScore === null ? 0 : selfScore,
      finalScore: finalScore === null
        ? Math.round(((managerScore === null ? 0 : managerScore) + (selfScore === null ? 0 : selfScore)) / 2)
        : finalScore,
      status,
      existing: agent && direction ? findPerformanceResult(agent, direction) : null,
    },
  };
}

function findTrainingSession(code) {
  return trainingSessions.find((item) => item.code === code);
}

function buildTrainingSessionCode() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^TRN-${year}-(\\d+)$`);
  const maxExisting = trainingSessions.reduce((max, item) => {
    const match = regex.exec(String(item.code || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `TRN-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeTrainingSessionStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'ouverte') return 'Ouverte';
  if (normalized === 'complete' || normalized === 'complète') return 'Complete';
  if (normalized === 'annulee' || normalized === 'annulée') return 'Annulee';
  return 'Ouverte';
}

function validateTrainingSessionCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const title = String(body.title || body.name || '').trim();
  const dates = String(body.dates || body.sessionDates || body.session_dates || '').trim();
  const location = String(body.location || body.venue || '').trim();
  const seatsRaw = Number(body.seats ?? body.seatsCount ?? body.seats_count ?? 0);
  const enrolledRaw = Number(body.enrolled ?? body.enrolledCount ?? body.enrolled_count ?? 0);
  const seats = Number.isFinite(seatsRaw) ? Math.max(1, Math.round(seatsRaw)) : 0;
  const enrolled = Number.isFinite(enrolledRaw) ? Math.max(0, Math.round(enrolledRaw)) : 0;
  const status = normalizeTrainingSessionStatus(body.status || 'Ouverte');

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code session formation invalide');
  }
  if (code && findTrainingSession(code)) {
    errors.push('Code session formation deja existant');
  }
  if (title.length < 2) {
    errors.push('Intitule session requis');
  }
  if (dates.length < 5) {
    errors.push('Periode session requise');
  }
  if (location.length < 2) {
    errors.push('Lieu session requis');
  }
  if (!Number.isFinite(seatsRaw) || seatsRaw < 1) {
    errors.push('Nombre de places invalide');
  }
  if (!Number.isFinite(enrolledRaw) || enrolledRaw < 0) {
    errors.push('Nombre inscrits invalide');
  }
  if (Number.isFinite(seatsRaw) && Number.isFinite(enrolledRaw) && enrolled > seats) {
    errors.push('Nombre inscrits ne peut pas depasser nombre de places');
  }

  return {
    errors,
    payload: {
      code: code || null,
      title,
      dates,
      location,
      seats: seats || 1,
      enrolled: Math.min(enrolled, seats || 1),
      status,
    },
  };
}

function findTrainingCourse(code) {
  return trainingCatalog.find((item) => item.code === code);
}

function buildTrainingCourseCode() {
  const regex = /^CAT-(\d+)$/;
  const maxExisting = trainingCatalog.reduce((max, item) => {
    const match = regex.exec(String(item.code || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `CAT-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeTrainingCourseModality(value) {
  const normalized = normalizeText(value);
  if (normalized === 'presentiel' || normalized === 'présentiel') return 'Presentiel';
  if (normalized === 'distanciel') return 'Distanciel';
  if (normalized === 'hybride') return 'Hybride';
  return String(value || '').trim() || 'Presentiel';
}

function validateTrainingCourseCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const title = String(body.title || body.name || '').trim();
  const duration = String(body.duration || '').trim();
  const modality = normalizeTrainingCourseModality(body.modality || body.mode || 'Presentiel');
  const domain = String(body.domain || body.category || '').trim();

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code formation invalide');
  }
  if (code && findTrainingCourse(code)) {
    errors.push('Code formation deja existant');
  }
  if (title.length < 2) {
    errors.push('Intitule formation requis');
  }
  if (duration.length < 2) {
    errors.push('Duree formation requise');
  }
  if (modality.length < 2) {
    errors.push('Modalite formation requise');
  }
  if (domain.length < 2) {
    errors.push('Domaine formation requis');
  }

  return {
    errors,
    payload: {
      code: code || null,
      title,
      duration,
      modality,
      domain,
    },
  };
}

function findTrainingEnrollmentRequest(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return trainingEnrollmentRequests.find((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function findTrainingEnrollmentRequestIndex(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return trainingEnrollmentRequests.findIndex((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function buildTrainingEnrollmentRequestReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^TRN-REQ-${year}-(\\d+)$`);
  const maxExisting = trainingEnrollmentRequests.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `TRN-REQ-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function validateTrainingEnrollmentRequestCreatePayload(body, currentUser) {
  const errors = [];

  const reference = String(body.reference || body.requestRef || body.request_ref || '').trim().toUpperCase();
  const sessionCode = String(
    body.sessionCode || body.session_code || body.trainingSessionCode || body.training_session_code || ''
  )
    .trim()
    .toUpperCase();
  const applicantName = String(body.applicantName || body.applicant_name || body.applicant || body.agent || currentUser?.fullName || '')
    .trim();
  const applicantUsername = String(body.applicantUsername || body.applicant_username || body.username || currentUser?.username || '')
    .trim()
    .toLowerCase();
  const motivation = String(body.motivation || body.reason || '').trim();

  const session = sessionCode ? findTrainingSession(sessionCode) : null;

  if (reference && !/^[A-Z0-9-]{3,60}$/.test(reference)) {
    errors.push('Reference demande formation invalide');
  }
  if (reference && findTrainingEnrollmentRequest(reference)) {
    errors.push('Reference demande formation deja existante');
  }
  if (!sessionCode) {
    errors.push('Code session formation requis');
  }
  if (sessionCode && !session) {
    errors.push('Session formation introuvable');
  }
  if (session && normalizeText(session.status) === 'annulee') {
    errors.push('Session formation annulee');
  }
  if (session && Number(session.enrolled || 0) >= Number(session.seats || 0)) {
    errors.push('Session formation complete');
  }
  if (applicantName.length < 2) {
    errors.push('Nom agent requis');
  }
  if (applicantUsername.length < 5 || !applicantUsername.includes('@')) {
    errors.push('Username agent invalide');
  }
  if (motivation.length < 8) {
    errors.push('Motivation demande trop courte');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      sessionCode,
      sessionTitle: session ? String(session.title || '').trim() : String(body.sessionTitle || body.title || '').trim(),
      sessionDates: session ? String(session.dates || '').trim() : String(body.sessionDates || body.dates || '').trim(),
      sessionLocation: session ? String(session.location || '').trim() : String(body.sessionLocation || body.location || '').trim(),
      applicantName,
      applicantUsername,
      motivation,
      status: 'Soumise',
      createdAt: new Date().toISOString(),
      decidedAt: '',
      decidedBy: '',
      decisionComment: '',
    },
  };
}

function validateTrainingEnrollmentDecisionPayload(body, currentRequest, currentUser) {
  const errors = [];
  const actionRaw = normalizeText(body.action || body.decision || body.status || '');
  let action = '';

  if (actionRaw === 'approuver' || actionRaw === 'valider' || actionRaw === 'validee' || actionRaw === 'approved') {
    action = 'APPROUVER';
  } else if (actionRaw === 'rejeter' || actionRaw === 'rejetee' || actionRaw === 'rejected') {
    action = 'REJETER';
  } else {
    errors.push('Action decision invalide');
  }

  const reason = String(body.reason || body.comment || body.note || body.decisionReason || '').trim();
  if (action === 'REJETER' && reason.length < 3) {
    errors.push('Motif rejet requis');
  }

  if (currentRequest && normalizeText(currentRequest.status) !== 'soumise') {
    errors.push('Demande formation deja traitee');
  }

  const session = currentRequest ? findTrainingSession(currentRequest.sessionCode) : null;
  if (action === 'APPROUVER') {
    if (!session) {
      errors.push('Session formation introuvable');
    } else if (Number(session.enrolled || 0) >= Number(session.seats || 0)) {
      errors.push('Plus de places disponibles sur cette session');
    }
  }

  return {
    errors,
    payload: {
      action,
      reason,
      decidedAt: new Date().toISOString(),
      decidedBy: String(currentUser?.fullName || currentUser?.username || 'Responsable RH').trim() || 'Responsable RH',
    },
  };
}

function findDisciplineCase(reference) {
  return disciplineCases.find((item) => item.reference === reference);
}

function buildDisciplineCaseReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^DISC-${year}-(\\d+)$`);
  const maxExisting = disciplineCases.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `DISC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeDisciplineCaseStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'instruction') return 'Instruction';
  if (normalized === 'cloture' || normalized === 'clôture') return 'Cloture';
  return 'Ouvert';
}

function validateDisciplineCaseCreatePayload(body) {
  const errors = [];

  const reference = String(body.reference || body.caseRef || body.case_ref || '').trim().toUpperCase();
  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const infraction = String(body.infraction || body.reason || body.motif || '').trim();
  const openedOn = String(body.openedOn || body.opened_on || '').trim();
  const status = normalizeDisciplineCaseStatus(body.status || 'Ouvert');
  const sanction = String(body.sanction || '').trim();

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference dossier disciplinaire invalide');
  }
  if (reference && findDisciplineCase(reference)) {
    errors.push('Reference dossier disciplinaire deja existante');
  }
  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (infraction.length < 3) {
    errors.push('Motif dossier requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(openedOn) || Number.isNaN(Date.parse(openedOn))) {
    errors.push('Date ouverture dossier invalide');
  }
  if (sanction.length > 160) {
    errors.push('Sanction trop longue');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      agent,
      infraction,
      openedOn,
      status,
      sanction,
    },
  };
}

function findLibraryDocument(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return documentsLibrary.find((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function findLibraryDocumentIndex(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return documentsLibrary.findIndex((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function buildLibraryDocumentReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^DOC-${year}-(\\d+)$`);
  const maxExisting = documentsLibrary.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `DOC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function resolveDocumentStatusAlias(value) {
  const normalized = normalizeText(value).replace(/\s+/g, ' ');
  return DOCUMENT_STATUS_MAP[normalized] || null;
}

function resolveDocumentStatusFallback(fallback = 'Brouillon') {
  const raw = String(fallback ?? '').trim();
  if (!raw) {
    return 'Brouillon';
  }
  return resolveDocumentStatusAlias(raw) || raw;
}

function resolveDocumentStatusInput(value, fallback = 'Brouillon') {
  const fallbackStatus = resolveDocumentStatusFallback(fallback);
  const raw = String(value ?? '').trim();
  if (!raw) {
    return {
      value: fallbackStatus,
      provided: false,
      valid: true,
    };
  }

  const mapped = resolveDocumentStatusAlias(raw);
  if (!mapped) {
    return {
      value: fallbackStatus,
      provided: true,
      valid: false,
    };
  }

  return {
    value: mapped,
    provided: true,
    valid: true,
  };
}

function normalizeDocumentStatus(value, fallback = 'Brouillon') {
  const resolution = resolveDocumentStatusInput(value, fallback);
  return resolution.valid ? resolution.value : resolveDocumentStatusFallback(fallback);
}

function getAllowedDocumentTransitions(fromStatus) {
  const normalized = normalizeDocumentStatus(fromStatus, 'Brouillon');
  return [...(DOCUMENT_STATUS_FLOW[normalized] || [])];
}

function isValidDocumentStatusTransition(fromStatus, toStatus) {
  const from = normalizeDocumentStatus(fromStatus, 'Brouillon');
  const to = normalizeDocumentStatus(toStatus, 'Brouillon');
  if (from === to) {
    return true;
  }

  const allowed = DOCUMENT_STATUS_FLOW[from] || [];
  return allowed.includes(to);
}

function normalizeLibraryDocumentDateOnly(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw))) {
    return raw;
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return '';
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function validateLibraryDocumentPayload(body, currentDocument) {
  const errors = [];

  const reference = currentDocument
    ? String(currentDocument.reference || '').trim().toUpperCase()
    : String(body.reference || body.docRef || body.doc_ref || '').trim().toUpperCase();
  const title = String(body.title ?? body.name ?? currentDocument?.title ?? '').trim();
  const type = String(body.type ?? body.category ?? currentDocument?.type ?? '').trim();
  const owner = String(body.owner ?? body.ownerName ?? body.owner_name ?? currentDocument?.owner ?? '').trim();
  const updatedAtRaw = String(body.updatedAt ?? body.updated_at ?? currentDocument?.updatedAt ?? '').trim();
  const statusFallback = currentDocument ? normalizeDocumentStatus(currentDocument.status, 'Brouillon') : 'Brouillon';
  const statusResolution = resolveDocumentStatusInput(body.status, statusFallback);
  const status = statusResolution.value;
  const updatedAt = updatedAtRaw || new Date().toISOString();
  const updatedAtIso = Number.isNaN(Date.parse(updatedAt)) ? new Date().toISOString() : new Date(updatedAt).toISOString();

  const employeeName = String(body.employeeName ?? body.employee_name ?? body.agent ?? currentDocument?.employeeName ?? '').trim();
  const employeeId = String(body.employeeId ?? body.employee_id ?? body.matricule ?? currentDocument?.employeeId ?? '').trim();
  const direction = String(body.direction ?? currentDocument?.direction ?? '').trim();
  const unit = String(body.unit ?? currentDocument?.unit ?? '').trim();
  const issuedAtRaw = String(
    body.issuedAt ?? body.issued_at ?? body.issueDate ?? body.issue_date ?? currentDocument?.issuedAt ?? updatedAtIso.slice(0, 10)
  ).trim();
  const startDateRaw = String(body.startDate ?? body.start_date ?? currentDocument?.startDate ?? '').trim();
  const endDateRaw = String(body.endDate ?? body.end_date ?? currentDocument?.endDate ?? '').trim();
  const approver = String(body.approver ?? body.validator ?? currentDocument?.approver ?? '').trim();
  const missionDestination = String(
    body.missionDestination ?? body.mission_destination ?? body.destination ?? currentDocument?.missionDestination ?? ''
  ).trim();
  const missionPurpose = String(
    body.missionPurpose ?? body.mission_purpose ?? body.purpose ?? currentDocument?.missionPurpose ?? ''
  ).trim();
  const absenceReason = String(
    body.absenceReason ?? body.absence_reason ?? body.reason ?? currentDocument?.absenceReason ?? ''
  ).trim();
  const notes = String(body.notes ?? currentDocument?.notes ?? '').trim();

  const issuedAt = normalizeLibraryDocumentDateOnly(issuedAtRaw);
  const startDate = normalizeLibraryDocumentDateOnly(startDateRaw);
  const endDate = normalizeLibraryDocumentDateOnly(endDateRaw);
  const normalizedType = normalizeText(type);
  const requiresMission = normalizedType.includes('mission');
  const requiresAbsence = normalizedType.includes('absence');

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference document invalide');
  }
  if (!currentDocument && reference && findLibraryDocument(reference)) {
    errors.push('Reference document deja existante');
  }
  if (title.length < 2) {
    errors.push('Titre document requis');
  }
  if (type.length < 2) {
    errors.push('Type document requis');
  }
  if (owner.length < 2) {
    errors.push('Proprietaire document requis');
  }
  if (statusResolution.provided && !statusResolution.valid) {
    errors.push('Statut document invalide');
  }
  if (currentDocument) {
    const previousStatus = normalizeDocumentStatus(currentDocument.status, 'Brouillon');
    if (!isValidDocumentStatusTransition(previousStatus, status)) {
      const allowed = getAllowedDocumentTransitions(previousStatus);
      errors.push(
        `Transition statut invalide: ${previousStatus} -> ${status}. Autorise: ${
          allowed.length ? allowed.join(', ') : 'Aucune'
        }`
      );
    }
  }
  if (Number.isNaN(Date.parse(updatedAt))) {
    errors.push('Date mise a jour document invalide');
  }
  if (employeeName.length < 2) {
    errors.push('Nom employe ou agent requis');
  }
  if (direction.length < 2) {
    errors.push('Direction de rattachement requise');
  }
  if (!issuedAt) {
    errors.push('Date emission document invalide');
  }
  if (startDateRaw && !startDate) {
    errors.push('Date debut document invalide');
  }
  if (endDateRaw && !endDate) {
    errors.push('Date fin document invalide');
  }
  if (startDate && endDate && Date.parse(endDate) < Date.parse(startDate)) {
    errors.push('Date fin document doit etre superieure ou egale a date debut');
  }
  if (requiresMission && missionDestination.length < 2) {
    errors.push('Destination mission requise');
  }
  if (requiresMission && missionPurpose.length < 2) {
    errors.push('Objet mission requis');
  }
  if (requiresAbsence && absenceReason.length < 2) {
    errors.push('Motif absence requis');
  }
  if (approver.length > 120) {
    errors.push('Nom approbateur trop long');
  }
  if (notes.length > 600) {
    errors.push('Observations document trop longues');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      title,
      type,
      owner,
      updatedAt: updatedAtIso,
      status,
      employeeName,
      employeeId,
      direction,
      unit,
      issuedAt,
      startDate,
      endDate,
      approver,
      missionDestination,
      missionPurpose,
      absenceReason,
      notes,
    },
  };
}

function validateLibraryDocumentCreatePayload(body) {
  return validateLibraryDocumentPayload(body, null);
}

function validateLibraryDocumentUpdatePayload(body, currentDocument) {
  return validateLibraryDocumentPayload(body, currentDocument);
}

function findDocumentDispatch(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return documentDispatches.find((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function findDocumentDispatchIndex(reference) {
  const expected = String(reference || '').trim().toUpperCase();
  return documentDispatches.findIndex((item) => String(item.reference || '').trim().toUpperCase() === expected);
}

function normalizeDocumentDeliveryStatus(value) {
  const normalized = normalizeText(value);
  if (
    normalized === 'accuse reception' ||
    normalized === 'accuse_reception' ||
    normalized === 'accusereception' ||
    normalized === 'acknowledged'
  ) {
    return 'Accuse reception';
  }
  if (normalized === 'lu' || normalized === 'read') {
    return 'Lu';
  }
  return 'Assigne';
}

function isDocumentReadyForDispatch(document) {
  const normalizedStatus = normalizeText(document?.status || '');
  return normalizedStatus === 'valide' || normalizedStatus === 'validé' || normalizedStatus === 'publie' || normalizedStatus === 'publié';
}

function findAgentByEmployeeId(employeeId) {
  const expected = normalizeText(employeeId);
  if (!expected) {
    return null;
  }

  return agents.find((item) => {
    return normalizeText(item.matricule) === expected || normalizeText(item.id) === expected;
  }) || null;
}

function findPortalUserByUsername(username) {
  const expected = normalizeText(username);
  if (!expected) {
    return null;
  }
  return users.find((item) => normalizeText(item.username) === expected) || null;
}

function toDispatchedDocument(document) {
  const dispatch = findDocumentDispatch(document.reference);
  if (!dispatch) {
    return {
      ...document,
      assignedEmployeeId: '',
      assignedEmployeeName: '',
      recipientUsername: '',
      assignmentNote: '',
      deliveryStatus: 'Non assigne',
      assignedAt: '',
      assignedBy: '',
      assignmentDueAt: '',
      reminderAt: '',
      reminderSentAt: '',
      readAt: '',
      acknowledgedAt: '',
      acknowledgedBy: '',
      signedAt: String(document.signedAt || '').trim(),
      signedBy: String(document.signedBy || '').trim(),
      stampLabel: String(document.stampLabel || '').trim(),
      signatureHash: String(document.signatureHash || '').trim(),
      verificationCode: String(document.verificationCode || '').trim(),
    };
  }

  return {
    ...document,
    assignedEmployeeId: dispatch.employeeId || '',
    assignedEmployeeName: dispatch.employeeName || '',
    recipientUsername: dispatch.recipientUsername || '',
    assignmentNote: dispatch.note || '',
    deliveryStatus: normalizeDocumentDeliveryStatus(dispatch.deliveryStatus),
    assignedAt: dispatch.assignedAt || '',
    assignedBy: dispatch.assignedBy || '',
    assignmentDueAt: dispatch.assignmentDueAt || '',
    reminderAt: dispatch.reminderAt || '',
    reminderSentAt: dispatch.reminderSentAt || '',
    readAt: dispatch.readAt || '',
    acknowledgedAt: dispatch.acknowledgedAt || '',
    acknowledgedBy: dispatch.acknowledgedBy || '',
    signedAt: String(document.signedAt || '').trim(),
    signedBy: String(document.signedBy || '').trim(),
    stampLabel: String(document.stampLabel || '').trim(),
    signatureHash: String(document.signatureHash || '').trim(),
    verificationCode: String(document.verificationCode || '').trim(),
  };
}

function validateDocumentAssignPayload(body, document) {
  const errors = [];

  const employeeId = String(
    body.employeeId ||
      body.employee_id ||
      body.matricule ||
      body.assignedEmployeeId ||
      body.assigned_employee_id ||
      ''
  ).trim();
  const employeeNameInput = String(
    body.employeeName ||
      body.employee_name ||
      body.assignedEmployeeName ||
      body.assigned_employee_name ||
      ''
  ).trim();
  const recipientUsernameInput = String(
    body.recipientUsername ||
      body.recipient_username ||
      body.recipient ||
      ''
  ).trim().toLowerCase();
  const note = String(body.note || body.assignmentNote || body.assignment_note || '').trim();
  const forceReassign = Boolean(body.forceReassign || body.force_reassign || body.override);
  const assignmentDueAtInput = String(
    body.assignmentDueAt ||
      body.assignment_due_at ||
      body.dueAt ||
      body.due_at ||
      ''
  ).trim();
  const reminderAtInput = String(
    body.reminderAt ||
      body.reminder_at ||
      ''
  ).trim();

  const agent = findAgentByEmployeeId(employeeId);
  const employeeName = employeeNameInput || (agent ? String(agent.fullName || '').trim() : String(document.employeeName || '').trim());
  const recipientUsername = recipientUsernameInput || (agent ? String(agent.email || '').trim().toLowerCase() : '');
  const portalUser = findPortalUserByUsername(recipientUsername);
  const existingDispatch = findDocumentDispatch(document.reference);
  const now = Date.now();
  const dueAtParsed = assignmentDueAtInput ? Date.parse(assignmentDueAtInput) : now + 72 * 60 * 60 * 1000;
  const reminderParsed = reminderAtInput ? Date.parse(reminderAtInput) : dueAtParsed - 24 * 60 * 60 * 1000;
  const assignmentDueAt = Number.isNaN(dueAtParsed) ? '' : new Date(dueAtParsed).toISOString();
  const reminderAt = Number.isNaN(reminderParsed) ? '' : new Date(reminderParsed).toISOString();

  if (!isDocumentReadyForDispatch(document)) {
    errors.push('Le document doit etre valide ou publie avant assignation');
  }
  if (!isDocumentSigned(document)) {
    errors.push('Le document doit etre signe et cachete avant assignation');
  }
  if (employeeId.length < 2) {
    errors.push('Matricule employe requis');
  }
  if (employeeName.length < 2) {
    errors.push('Nom employe requis');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientUsername)) {
    errors.push('Username portail employe invalide');
  }
  if (!portalUser) {
    errors.push('Compte portail employe introuvable');
  }
  if (note.length > 400) {
    errors.push('Note assignation trop longue');
  }
  if (assignmentDueAtInput && !assignmentDueAt) {
    errors.push('Date limite assignation invalide');
  }
  if (reminderAtInput && !reminderAt) {
    errors.push('Date relance invalide');
  }
  if (assignmentDueAt && Date.parse(assignmentDueAt) <= now + 60 * 60 * 1000) {
    errors.push('Date limite assignation doit etre superieure a maintenant + 1h');
  }
  if (assignmentDueAt && reminderAt && Date.parse(reminderAt) >= Date.parse(assignmentDueAt)) {
    errors.push('Date relance doit etre anterieure a la date limite');
  }

  if (existingDispatch) {
    const currentDeliveryStatus = normalizeDocumentDeliveryStatus(existingDispatch.deliveryStatus || 'Assigne');
    const currentRecipient = String(existingDispatch.recipientUsername || '').trim().toLowerCase();
    if (currentDeliveryStatus !== 'Accuse reception') {
      if (!forceReassign && currentRecipient === recipientUsername) {
        errors.push('Document deja assigne a cet employe et en attente de reception');
      }
      if (!forceReassign && currentRecipient && currentRecipient !== recipientUsername) {
        errors.push(`Document deja assigne a ${currentRecipient}. Active la reassignation forcee pour le remplacer`);
      }
    }
  }

  return {
    errors,
    payload: {
      employeeId,
      employeeName,
      recipientUsername,
      note,
      forceReassign,
      assignmentDueAt,
      reminderAt,
    },
  };
}

function validateDocumentAcknowledgePayload(body) {
  const note = String(body.note || body.assignmentNote || body.assignment_note || '').trim();
  const errors = [];
  if (note.length > 400) {
    errors.push('Note accuse reception trop longue');
  }
  return {
    errors,
    payload: {
      note,
    },
  };
}

function normalizeAuditMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const entries = Object.entries(metadata)
    .filter(([key]) => String(key || '').trim().length > 0)
    .map(([key, value]) => [String(key || '').trim(), String(value ?? '').trim()]);
  return Object.fromEntries(entries);
}

function addDocumentAuditLog(entry) {
  const reference = String(entry?.reference || '').trim().toUpperCase();
  if (!reference) {
    return null;
  }

  const actor = String(entry?.actor || 'system').trim().toLowerCase() || 'system';
  const action = String(entry?.action || DOCUMENT_AUDIT_ACTIONS.UPDATED).trim().toUpperCase();
  const happenedAt = new Date().toISOString();
  const statusBeforeRaw = String(entry?.statusBefore || '').trim();
  const statusAfterRaw = String(entry?.statusAfter || '').trim();
  const statusBefore = statusBeforeRaw ? resolveDocumentStatusFallback(statusBeforeRaw) : '';
  const statusAfter = statusAfterRaw ? resolveDocumentStatusFallback(statusAfterRaw) : '';
  const detail = String(entry?.detail || '').trim();
  const metadata = normalizeAuditMetadata(entry?.metadata);

  const created = {
    id: `DOC-AUD-${String(documentAuditSequence++).padStart(6, '0')}`,
    reference,
    action,
    actor,
    happenedAt,
    statusBefore,
    statusAfter,
    detail,
    metadata,
  };
  documentAuditLogs.unshift(created);
  if (documentAuditLogs.length > DOCUMENT_AUDIT_LIMIT) {
    documentAuditLogs.length = DOCUMENT_AUDIT_LIMIT;
  }
  return created;
}

function isDocumentSigned(document) {
  return !!(
    document &&
    String(document.signedAt || '').trim() &&
    String(document.signedBy || '').trim() &&
    String(document.signatureHash || '').trim() &&
    String(document.verificationCode || '').trim()
  );
}

function computeDocumentSignatureHash(document, signedBy, signedAt) {
  const seed = [
    String(document?.reference || '').trim().toUpperCase(),
    String(document?.title || '').trim(),
    String(document?.type || '').trim(),
    String(document?.employeeId || '').trim(),
    String(document?.employeeName || '').trim(),
    String(signedBy || '').trim().toLowerCase(),
    String(signedAt || '').trim(),
  ].join('|');
  return createHash('sha256').update(seed).digest('hex');
}

function buildDocumentVerificationCode(reference, signedAt) {
  const parsed = Date.parse(String(signedAt || '').trim());
  const year = Number.isNaN(parsed) ? new Date().getFullYear() : new Date(parsed).getFullYear();
  const seed = createHash('sha1')
    .update(`${String(reference || '').trim().toUpperCase()}|${String(signedAt || '').trim()}`)
    .digest('hex')
    .slice(0, 8)
    .toUpperCase();
  return `VRF-${year}-${seed}`;
}

function validateDocumentSignPayload(body, document) {
  const errors = [];

  const signatoryName = String(
    body.signatoryName ||
      body.signatory_name ||
      body.signedBy ||
      body.signed_by ||
      ''
  ).trim();
  const stampLabel = String(body.stampLabel || body.stamp_label || 'CACHET RH PRIMATURE').trim();

  if (!isDocumentReadyForDispatch(document)) {
    errors.push('Le document doit etre valide ou publie avant signature');
  }
  if (signatoryName.length > 120) {
    errors.push('Nom signataire trop long');
  }
  if (stampLabel.length < 2 || stampLabel.length > 80) {
    errors.push('Libelle cachet invalide');
  }

  return {
    errors,
    payload: {
      signatoryName,
      stampLabel,
    },
  };
}

function buildNotificationId(prefix) {
  return `${prefix}-${String(notificationSequence++).padStart(7, '0')}`;
}

function trimNotificationCollections() {
  if (notificationDeliveryJobs.length > NOTIFICATION_DELIVERY_LIMIT) {
    notificationDeliveryJobs.length = NOTIFICATION_DELIVERY_LIMIT;
  }
  if (notificationInboxItems.length > NOTIFICATION_INBOX_LIMIT) {
    notificationInboxItems.length = NOTIFICATION_INBOX_LIMIT;
  }
}

function buildNotificationInboxFromJob(job, createdAt) {
  return {
    id: buildNotificationId('NTF'),
    deliveryId: String(job.id || ''),
    recipientUsername: String(job.recipientUsername || '').trim().toLowerCase(),
    title: String(job.title || '').trim(),
    message: String(job.message || '').trim(),
    category: String(job.category || 'Document').trim(),
    reference: String(job.reference || '').trim().toUpperCase(),
    metadata: normalizeAuditMetadata(job.metadata),
    createdAt,
    readAt: '',
    isRead: false,
  };
}

function queueNotificationDelivery(payload) {
  const recipientUsername = String(payload?.recipientUsername || '').trim().toLowerCase();
  if (!recipientUsername) {
    return null;
  }

  const nowIso = new Date().toISOString();
  const job = {
    id: buildNotificationId('NTF-JOB'),
    recipientUsername,
    title: String(payload?.title || '').trim() || 'Notification document',
    message: String(payload?.message || '').trim(),
    category: String(payload?.category || 'Document').trim(),
    reference: String(payload?.reference || '').trim().toUpperCase(),
    metadata: normalizeAuditMetadata(payload?.metadata),
    createdAt: nowIso,
    updatedAt: nowIso,
    sentAt: '',
    failedAt: '',
    status: 'PENDING',
    attempts: 0,
    maxAttempts: NOTIFICATION_MAX_ATTEMPTS,
    lastError: '',
    nextAttemptAt: nowIso,
  };

  notificationDeliveryJobs.unshift(job);
  trimNotificationCollections();
  return job;
}

function processNotificationDeliveries(referenceTime = Date.now()) {
  for (const job of notificationDeliveryJobs) {
    const currentStatus = String(job.status || '');
    if (currentStatus === 'SENT' || currentStatus === 'FAILED') {
      continue;
    }

    const nextAttemptTimestamp = Date.parse(String(job.nextAttemptAt || ''));
    if (!Number.isFinite(nextAttemptTimestamp) || nextAttemptTimestamp > referenceTime) {
      continue;
    }

    job.attempts = Number(job.attempts || 0) + 1;
    job.updatedAt = new Date(referenceTime).toISOString();
    const recipient = findPortalUserByUsername(job.recipientUsername);
    if (recipient) {
      const sentAt = new Date(referenceTime).toISOString();
      job.status = 'SENT';
      job.sentAt = sentAt;
      job.lastError = '';
      notificationInboxItems.unshift(buildNotificationInboxFromJob(job, sentAt));
      trimNotificationCollections();
      continue;
    }

    job.lastError = 'Destinataire notification introuvable';
    if (job.attempts >= Number(job.maxAttempts || NOTIFICATION_MAX_ATTEMPTS)) {
      job.status = 'FAILED';
      job.failedAt = new Date(referenceTime).toISOString();
      continue;
    }

    const retryIndex = Math.max(0, Math.min(NOTIFICATION_RETRY_DELAYS_MS.length - 1, job.attempts));
    const retryDelayMs = NOTIFICATION_RETRY_DELAYS_MS[retryIndex];
    job.status = 'RETRY';
    job.nextAttemptAt = new Date(referenceTime + retryDelayMs).toISOString();
  }
}

function queueDocumentNotification(payload) {
  const job = queueNotificationDelivery(payload);
  processNotificationDeliveries();
  return job;
}

function processDocumentDispatchReminders(referenceTime = Date.now()) {
  const nowIso = new Date(referenceTime).toISOString();
  for (const dispatch of documentDispatches) {
    const deliveryStatus = normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne');
    if (deliveryStatus === 'Accuse reception') {
      continue;
    }

    if (String(dispatch.reminderSentAt || '').trim()) {
      continue;
    }

    const reminderTimestamp = Date.parse(String(dispatch.reminderAt || '').trim());
    if (!Number.isFinite(reminderTimestamp) || reminderTimestamp > referenceTime) {
      continue;
    }

    const reference = String(dispatch.reference || '').trim().toUpperCase();
    if (!reference) {
      continue;
    }

    const recipientUsername = String(dispatch.recipientUsername || '').trim().toLowerCase();
    if (recipientUsername) {
      queueDocumentNotification({
        recipientUsername,
        title: `Rappel document: ${reference}`,
        message: `Le document ${reference} est en attente de votre lecture ou accuse de reception.`,
        category: 'Document',
        reference,
        metadata: {
          action: 'REMINDER',
        },
      });
    }

    const managerUsername = String(dispatch.assignedBy || '').trim().toLowerCase();
    if (managerUsername && managerUsername !== recipientUsername) {
      queueDocumentNotification({
        recipientUsername: managerUsername,
        title: `Relance automatique: ${reference}`,
        message: `Le document ${reference} n est pas encore accuse reception par ${recipientUsername || 'le destinataire'}.`,
        category: 'Document',
        reference,
        metadata: {
          action: 'REMINDER_MANAGER',
          recipientUsername,
        },
      });
    }

    dispatch.reminderSentAt = nowIso;
  }
}

function parseBooleanFlag(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  const normalized = normalizeText(value);
  if (!normalized) {
    return fallback;
  }
  if (['true', '1', 'yes', 'oui', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'non', 'off'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function toDateTimestamp(value) {
  const parsed = Date.parse(String(value || '').trim());
  return Number.isNaN(parsed) ? NaN : parsed;
}

function hoursBetween(fromTimestamp, toTimestamp) {
  if (!Number.isFinite(fromTimestamp) || !Number.isFinite(toTimestamp)) {
    return null;
  }
  return Math.round(((toTimestamp - fromTimestamp) / (60 * 60 * 1000)) * 100) / 100;
}

function listDocumentOverdueItems(referenceTime = Date.now()) {
  const items = [];

  for (const dispatch of documentDispatches) {
    const deliveryStatus = normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne');
    if (deliveryStatus === 'Accuse reception') {
      continue;
    }

    const dueTimestamp = toDateTimestamp(dispatch.assignmentDueAt);
    if (!Number.isFinite(dueTimestamp) || dueTimestamp > referenceTime) {
      continue;
    }

    const reference = String(dispatch.reference || '').trim().toUpperCase();
    const document = findLibraryDocument(reference);
    if (!document) {
      continue;
    }

    const overdueHours = Math.max(0, Math.round(((referenceTime - dueTimestamp) / (60 * 60 * 1000)) * 100) / 100);
    items.push({
      reference,
      title: String(document.title || '').trim(),
      type: String(document.type || '').trim(),
      status: normalizeDocumentStatus(document.status, 'Brouillon'),
      deliveryStatus,
      recipientUsername: String(dispatch.recipientUsername || '').trim().toLowerCase(),
      assignedEmployeeName: String(dispatch.employeeName || document.employeeName || '').trim(),
      assignedAt: String(dispatch.assignedAt || '').trim(),
      assignmentDueAt: String(dispatch.assignmentDueAt || '').trim(),
      reminderAt: String(dispatch.reminderAt || '').trim(),
      signedBy: String(document.signedBy || '').trim(),
      verificationCode: String(document.verificationCode || '').trim(),
      overdueHours,
      overdueDays: Math.round((overdueHours / 24) * 100) / 100,
    });
  }

  items.sort((left, right) => right.overdueHours - left.overdueHours);
  return items;
}

function computeDocumentAnalytics(referenceTime = Date.now()) {
  const docs = documentsLibrary.map((item) => toDispatchedDocument(item));
  const totalDocuments = docs.length;
  const signedDocuments = docs.filter((item) => isDocumentSigned(item)).length;
  const assignedDocuments = docs.filter((item) => String(item.assignedAt || '').trim()).length;
  const readDocuments = docs.filter((item) => normalizeDocumentDeliveryStatus(item.deliveryStatus) === 'Lu').length;
  const acknowledgedDocuments = docs.filter((item) => normalizeDocumentDeliveryStatus(item.deliveryStatus) === 'Accuse reception').length;
  const pendingAcknowledgements = Math.max(0, assignedDocuments - acknowledgedDocuments);

  const overdueItems = listDocumentOverdueItems(referenceTime);
  const overdueDocuments = overdueItems.length;

  const statusBuckets = new Map();
  const typeBuckets = new Map();
  for (const item of docs) {
    const statusKey = normalizeDocumentStatus(item.status, 'Brouillon');
    statusBuckets.set(statusKey, (statusBuckets.get(statusKey) || 0) + 1);
    const typeKey = String(item.type || 'Autre').trim() || 'Autre';
    typeBuckets.set(typeKey, (typeBuckets.get(typeKey) || 0) + 1);
  }

  const statusBreakdown = Array.from(statusBuckets.entries()).map(([label, count]) => ({ label, count }));
  statusBreakdown.sort((left, right) => right.count - left.count);

  const typeBreakdown = Array.from(typeBuckets.entries()).map(([label, count]) => ({ label, count }));
  typeBreakdown.sort((left, right) => right.count - left.count);

  const ackLatencies = [];
  const readLatencies = [];
  let dueInNext48h = 0;
  for (const dispatch of documentDispatches) {
    const assignedTimestamp = toDateTimestamp(dispatch.assignedAt);
    const readTimestamp = toDateTimestamp(dispatch.readAt);
    const ackTimestamp = toDateTimestamp(dispatch.acknowledgedAt);
    const dueTimestamp = toDateTimestamp(dispatch.assignmentDueAt);

    if (Number.isFinite(assignedTimestamp) && Number.isFinite(readTimestamp)) {
      const readDelay = hoursBetween(assignedTimestamp, readTimestamp);
      if (readDelay !== null && readDelay >= 0) {
        readLatencies.push(readDelay);
      }
    }

    if (Number.isFinite(assignedTimestamp) && Number.isFinite(ackTimestamp)) {
      const ackDelay = hoursBetween(assignedTimestamp, ackTimestamp);
      if (ackDelay !== null && ackDelay >= 0) {
        ackLatencies.push(ackDelay);
      }
    }

    if (
      Number.isFinite(dueTimestamp) &&
      dueTimestamp >= referenceTime &&
      dueTimestamp <= referenceTime + 48 * 60 * 60 * 1000 &&
      normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne') !== 'Accuse reception'
    ) {
      dueInNext48h += 1;
    }
  }

  const averageAckHours = ackLatencies.length
    ? Math.round((ackLatencies.reduce((sum, value) => sum + value, 0) / ackLatencies.length) * 100) / 100
    : 0;
  const averageReadHours = readLatencies.length
    ? Math.round((readLatencies.reduce((sum, value) => sum + value, 0) / readLatencies.length) * 100) / 100
    : 0;

  const notificationJobsTotal = notificationDeliveryJobs.length;
  const notificationJobsSent = notificationDeliveryJobs.filter((job) => String(job.status || '') === 'SENT').length;
  const notificationJobsRetry = notificationDeliveryJobs.filter((job) => String(job.status || '') === 'RETRY').length;
  const notificationJobsFailed = notificationDeliveryJobs.filter((job) => String(job.status || '') === 'FAILED').length;
  const unreadNotifications = notificationInboxItems.filter((item) => !item.isRead).length;

  const acknowledgementRate = assignedDocuments > 0 ? Math.round((acknowledgedDocuments / assignedDocuments) * 10000) / 100 : 0;
  const signatureRate = totalDocuments > 0 ? Math.round((signedDocuments / totalDocuments) * 10000) / 100 : 0;

  return {
    generatedAt: new Date(referenceTime).toISOString(),
    totals: {
      totalDocuments,
      signedDocuments,
      assignedDocuments,
      readDocuments,
      acknowledgedDocuments,
      pendingAcknowledgements,
      overdueDocuments,
      dueInNext48h,
    },
    rates: {
      acknowledgementRate,
      signatureRate,
    },
    sla: {
      averageAckHours,
      averageReadHours,
    },
    notifications: {
      unreadNotifications,
      notificationJobsTotal,
      notificationJobsSent,
      notificationJobsRetry,
      notificationJobsFailed,
    },
    statusBreakdown,
    typeBreakdown: typeBreakdown.slice(0, 8),
    overduePreview: overdueItems.slice(0, 20),
  };
}

function removeByReferenceInPlace(items, getReference, references) {
  if (!Array.isArray(items) || !(references instanceof Set) || references.size === 0) {
    return 0;
  }

  let removed = 0;
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const currentReference = String(getReference(items[index]) || '').trim().toUpperCase();
    if (!currentReference || !references.has(currentReference)) {
      continue;
    }
    items.splice(index, 1);
    removed += 1;
  }
  return removed;
}

function validateDocumentArchiveCyclePayload(body) {
  const rawOlderThanDays = Number(body.olderThanDays ?? body.older_than_days ?? DOCUMENT_ARCHIVE_DEFAULT_DAYS);
  const olderThanDays = toSafeInteger(rawOlderThanDays, DOCUMENT_ARCHIVE_DEFAULT_DAYS, 1, 3650);
  const dryRun = parseBooleanFlag(body.dryRun ?? body.dry_run, true);
  const onlyAcknowledged = parseBooleanFlag(body.onlyAcknowledged ?? body.only_acknowledged, true);
  const includeUnassigned = parseBooleanFlag(body.includeUnassigned ?? body.include_unassigned, false);

  return {
    errors: [],
    payload: {
      olderThanDays,
      dryRun,
      onlyAcknowledged,
      includeUnassigned,
    },
  };
}

function runDocumentArchiveCycle(body, actorUsername) {
  const validation = validateDocumentArchiveCyclePayload(body || {});
  if (validation.errors.length > 0) {
    return {
      errors: validation.errors,
      result: null,
    };
  }

  const payload = validation.payload;
  const referenceTime = Date.now();
  const thresholdTimestamp = referenceTime - payload.olderThanDays * 24 * 60 * 60 * 1000;
  const nowIso = new Date(referenceTime).toISOString();
  const candidates = [];
  let archivedCount = 0;

  for (const document of documentsLibrary) {
    const currentStatus = normalizeDocumentStatus(document.status, 'Brouillon');
    if (currentStatus !== 'Publie') {
      continue;
    }

    const dispatch = findDocumentDispatch(document.reference);
    const dispatchStatus = dispatch ? normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne') : 'Non assigne';
    if (payload.onlyAcknowledged && dispatchStatus !== 'Accuse reception') {
      continue;
    }
    if (!payload.includeUnassigned && !dispatch) {
      continue;
    }

    const sourceTimestamp = dispatch?.acknowledgedAt || document.signedAt || document.updatedAt || document.issuedAt;
    const parsedTimestamp = toDateTimestamp(sourceTimestamp);
    if (!Number.isFinite(parsedTimestamp) || parsedTimestamp > thresholdTimestamp) {
      continue;
    }

    const ageDays = Math.round(((referenceTime - parsedTimestamp) / (24 * 60 * 60 * 1000)) * 100) / 100;
    candidates.push({
      reference: String(document.reference || '').trim().toUpperCase(),
      title: String(document.title || '').trim(),
      status: currentStatus,
      deliveryStatus: dispatchStatus,
      ageDays,
      eligibleFrom: new Date(parsedTimestamp).toISOString(),
    });

    if (payload.dryRun) {
      continue;
    }

    if (!isValidDocumentStatusTransition(currentStatus, 'Archive')) {
      continue;
    }

    document.status = 'Archive';
    document.updatedAt = nowIso;
    archivedCount += 1;

    addDocumentAuditLog({
      reference: document.reference,
      action: DOCUMENT_AUDIT_ACTIONS.STATUS_CHANGED,
      actor: actorUsername,
      statusBefore: currentStatus,
      statusAfter: 'Archive',
      detail: `Archivage automatique (seuil ${payload.olderThanDays} jours)`,
    });
  }

  return {
    errors: [],
    result: {
      generatedAt: new Date(referenceTime).toISOString(),
      dryRun: payload.dryRun,
      criteria: {
        olderThanDays: payload.olderThanDays,
        onlyAcknowledged: payload.onlyAcknowledged,
        includeUnassigned: payload.includeUnassigned,
      },
      candidatesCount: candidates.length,
      archivedCount,
      candidates: candidates.slice(0, 100),
    },
  };
}

function validateDocumentPurgePayload(body) {
  const rawRetentionDays = Number(body.retentionDays ?? body.retention_days ?? DOCUMENT_PURGE_DEFAULT_RETENTION_DAYS);
  const retentionDays = toSafeInteger(rawRetentionDays, DOCUMENT_PURGE_DEFAULT_RETENTION_DAYS, 30, 3650);
  const dryRun = parseBooleanFlag(body.dryRun ?? body.dry_run, true);
  const includeNotifications = parseBooleanFlag(body.includeNotifications ?? body.include_notifications, true);

  return {
    errors: [],
    payload: {
      retentionDays,
      dryRun,
      includeNotifications,
    },
  };
}

function runDocumentArchivePurge(body, actorUsername) {
  const validation = validateDocumentPurgePayload(body || {});
  if (validation.errors.length > 0) {
    return {
      errors: validation.errors,
      result: null,
    };
  }

  const payload = validation.payload;
  const referenceTime = Date.now();
  const cutoffTimestamp = referenceTime - payload.retentionDays * 24 * 60 * 60 * 1000;
  const referencesToPurge = new Set();

  for (const document of documentsLibrary) {
    const status = normalizeDocumentStatus(document.status, 'Brouillon');
    if (status !== 'Archive') {
      continue;
    }
    const updatedTimestamp = toDateTimestamp(document.updatedAt || document.issuedAt);
    if (!Number.isFinite(updatedTimestamp) || updatedTimestamp > cutoffTimestamp) {
      continue;
    }
    const reference = String(document.reference || '').trim().toUpperCase();
    if (reference) {
      referencesToPurge.add(reference);
    }
  }

  const candidateReferences = Array.from(referencesToPurge.values()).sort();
  if (payload.dryRun) {
    return {
      errors: [],
      result: {
        generatedAt: new Date(referenceTime).toISOString(),
        dryRun: true,
        criteria: {
          retentionDays: payload.retentionDays,
          includeNotifications: payload.includeNotifications,
        },
        candidatesCount: candidateReferences.length,
        purged: {
          documents: 0,
          dispatches: 0,
          auditLogs: 0,
          notificationsInbox: 0,
          notificationsJobs: 0,
        },
        references: candidateReferences.slice(0, 200),
      },
    };
  }

  const purgedDocuments = removeByReferenceInPlace(documentsLibrary, (item) => item.reference, referencesToPurge);
  const purgedDispatches = removeByReferenceInPlace(documentDispatches, (item) => item.reference, referencesToPurge);
  const purgedAuditLogs = removeByReferenceInPlace(documentAuditLogs, (item) => item.reference, referencesToPurge);
  let purgedNotificationsInbox = 0;
  let purgedNotificationsJobs = 0;

  if (payload.includeNotifications) {
    purgedNotificationsInbox = removeByReferenceInPlace(notificationInboxItems, (item) => item.reference, referencesToPurge);
    purgedNotificationsJobs = removeByReferenceInPlace(notificationDeliveryJobs, (item) => item.reference, referencesToPurge);
  }

  const nowIso = new Date(referenceTime).toISOString();
  adminAuditLogs.unshift({
    date: nowIso,
    user: actorUsername,
    action: 'DOCUMENT_PURGE',
    target: `${purgedDocuments} documents`,
  });
  if (adminAuditLogs.length > 500) {
    adminAuditLogs.length = 500;
  }

  return {
    errors: [],
    result: {
      generatedAt: nowIso,
      dryRun: false,
      criteria: {
        retentionDays: payload.retentionDays,
        includeNotifications: payload.includeNotifications,
      },
      candidatesCount: candidateReferences.length,
      purged: {
        documents: purgedDocuments,
        dispatches: purgedDispatches,
        auditLogs: purgedAuditLogs,
        notificationsInbox: purgedNotificationsInbox,
        notificationsJobs: purgedNotificationsJobs,
      },
      references: candidateReferences.slice(0, 200),
    },
  };
}

function findWorkflowDefinitionByCode(code) {
  return workflowDefinitions.find((item) => item.code === code);
}

function findWorkflowDefinitionByName(name) {
  const expected = normalizeText(name);
  return workflowDefinitions.find((item) => normalizeText(item.name) === expected);
}

function resolveWorkflowDefinition(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return null;
  }

  const byCode = findWorkflowDefinitionByCode(raw.toUpperCase());
  if (byCode) {
    return byCode;
  }

  return findWorkflowDefinitionByName(raw);
}

function buildWorkflowDefinitionCode(usedFor) {
  const base = String(usedFor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 10) || 'CUSTOM';

  let candidate = `WF-${base}`;
  let suffix = 2;
  while (findWorkflowDefinitionByCode(candidate)) {
    candidate = `WF-${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function normalizeWorkflowDefinitionStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'inactif') return 'Inactif';
  if (normalized === 'archive' || normalized === 'archivé' || normalized === 'archivee' || normalized === 'archivée') {
    return 'Archive';
  }
  return 'Actif';
}

function validateWorkflowDefinitionCreatePayload(body) {
  const errors = [];

  const code = String(body.code || '').trim().toUpperCase();
  const name = String(body.name || body.label || '').trim();
  const usedFor = String(body.usedFor || body.used_for || '').trim();
  const stepsRaw = Number(body.steps ?? body.stepsCount ?? body.steps_count ?? 0);
  const slaTargetRaw = Number(body.slaTargetHours ?? body.sla_target_hours ?? 0);
  const steps = Number.isFinite(stepsRaw) ? Math.max(1, Math.min(12, Math.round(stepsRaw))) : 0;
  const slaTargetHours = Number.isFinite(slaTargetRaw) ? Math.max(1, Math.min(720, Math.round(slaTargetRaw))) : 0;
  const status = normalizeWorkflowDefinitionStatus(body.status || 'Actif');
  const autoEscalation = body.autoEscalation === false || String(body.autoEscalation || '').toLowerCase() === 'false'
    ? false
    : body.auto_escalation === false || String(body.auto_escalation || '').toLowerCase() === 'false'
      ? false
      : true;

  if (code && !/^[A-Z0-9-]{3,40}$/.test(code)) {
    errors.push('Code workflow invalide');
  }
  if (code && findWorkflowDefinitionByCode(code)) {
    errors.push('Code workflow deja existant');
  }
  if (name.length < 2) {
    errors.push('Nom workflow requis');
  }
  if (name && findWorkflowDefinitionByName(name)) {
    errors.push('Un workflow avec ce nom existe deja');
  }
  if (usedFor.length < 2) {
    errors.push('Usage workflow requis');
  }
  if (!Number.isFinite(stepsRaw) || stepsRaw < 1 || stepsRaw > 12) {
    errors.push('Nombre etapes workflow invalide');
  }
  if (!Number.isFinite(slaTargetRaw) || slaTargetRaw < 1 || slaTargetRaw > 720) {
    errors.push('SLA cible workflow invalide');
  }

  return {
    errors,
    payload: {
      code: code || null,
      name,
      steps: steps || 1,
      usedFor,
      status,
      slaTargetHours: slaTargetHours || 48,
      autoEscalation,
    },
  };
}

function buildWorkflowInstanceId() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^WFI-${year}-(\\d+)$`);
  const maxExisting = workflowInstances.reduce((max, item) => {
    const match = regex.exec(String(item.id || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `WFI-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeWorkflowInstancePriority(value) {
  const normalized = normalizeText(value);
  if (normalized === 'basse') return 'Basse';
  if (normalized === 'haute') return 'Haute';
  if (normalized === 'critique') return 'Critique';
  return 'Normale';
}

function normalizeWorkflowInstanceStatus(value) {
  const normalized = normalizeText(value).replace(/\s+/g, '_');
  if (normalized === 'en_cours') return 'EN_COURS';
  if (normalized === 'approuve' || normalized === 'approuvé') return 'APPROUVE';
  if (normalized === 'rejete' || normalized === 'rejeté' || normalized === 'refuse' || normalized === 'refusé') {
    return 'REJETE';
  }
  if (normalized === 'escalade' || normalized === 'escaladé') return 'ESCALADE';
  if (normalized === 'en_retard') return 'EN_RETARD';
  return 'EN_ATTENTE';
}

function validateWorkflowInstanceCreatePayload(body) {
  const errors = [];

  const id = String(body.id || body.instanceId || body.instance_id || '').trim().toUpperCase();
  const definitionInput = String(body.definition || body.definitionName || body.definition_name || '').trim();
  const definition = resolveWorkflowDefinition(definitionInput);
  const requester = String(body.requester || body.requesterName || body.requester_name || '').trim();
  const dueOnInput = String(body.dueOn || body.due_on || '').trim();
  const priority = normalizeWorkflowInstancePriority(body.priority || 'Normale');
  const owner = String(body.owner || body.ownerName || body.owner_name || '').trim() || 'Responsable RH';
  const status = normalizeWorkflowInstanceStatus(body.status || 'EN_ATTENTE');

  const stepsDefault = definition ? Math.max(1, Math.round(Number(definition.steps || 1))) : 3;
  const stepsTotalRaw = Number(body.stepsTotal ?? body.steps_total ?? stepsDefault);
  const stepsCompletedRaw = Number(body.stepsCompleted ?? body.steps_completed ?? 0);
  const escalationLevelRaw = Number(body.escalationLevel ?? body.escalation_level ?? 0);

  let stepsTotal = Number.isFinite(stepsTotalRaw) ? Math.max(1, Math.min(12, Math.round(stepsTotalRaw))) : 0;
  let stepsCompleted = Number.isFinite(stepsCompletedRaw) ? Math.max(0, Math.round(stepsCompletedRaw)) : 0;
  let escalationLevel = Number.isFinite(escalationLevelRaw) ? Math.max(0, Math.min(3, Math.round(escalationLevelRaw))) : 0;

  const defaultSla = definition ? Math.max(1, Math.round(Number(definition.slaTargetHours || 48))) : 48;
  const dueOnRaw = dueOnInput || hoursFromNow(defaultSla);
  const dueOnTimestamp = Date.parse(dueOnRaw);
  const dueOn = Number.isNaN(dueOnTimestamp) ? hoursFromNow(defaultSla) : new Date(dueOnTimestamp).toISOString();

  if (id && !/^[A-Z0-9-]{3,40}$/.test(id)) {
    errors.push('ID instance workflow invalide');
  }
  if (id && findWorkflowInstance(id)) {
    errors.push('ID instance workflow deja existant');
  }
  if (!definition) {
    errors.push('Workflow definition introuvable');
  }
  if (requester.length < 2) {
    errors.push('Demandeur requis');
  }
  if (Number.isNaN(dueOnTimestamp) && dueOnInput) {
    errors.push('Date echeance invalide');
  }
  if (!Number.isFinite(stepsTotalRaw) || stepsTotalRaw < 1 || stepsTotalRaw > 12) {
    errors.push('Nombre etapes total invalide');
  }
  if (!Number.isFinite(stepsCompletedRaw) || stepsCompletedRaw < 0) {
    errors.push('Nombre etapes completees invalide');
  }
  if (!Number.isFinite(escalationLevelRaw) || escalationLevelRaw < 0 || escalationLevelRaw > 3) {
    errors.push('Niveau escalade invalide');
  }

  if (stepsCompleted > stepsTotal) {
    errors.push('Etapes completees ne peuvent pas depasser etapes total');
    stepsCompleted = Math.min(stepsCompleted, stepsTotal || 1);
  }

  if (status === 'APPROUVE') {
    stepsCompleted = stepsTotal;
  }
  if (status === 'ESCALADE' && escalationLevel === 0) {
    escalationLevel = 1;
  }

  const currentStepRaw = String(body.currentStep || body.current_step || '').trim();
  let currentStep = currentStepRaw;
  if (!currentStep) {
    if (status === 'APPROUVE') currentStep = 'Termine';
    else if (status === 'REJETE') currentStep = 'Cloture';
    else if (status === 'ESCALADE') currentStep = stepByEscalationLevel(escalationLevel || 1);
    else currentStep = `Validation niveau ${Math.max(1, Math.min((stepsTotal || 1), (stepsCompleted || 0) + 1))}`;
  }

  return {
    errors,
    payload: {
      id: id || null,
      definition: definition ? definition.name : definitionInput,
      requester,
      dueOn,
      priority,
      owner,
      stepsTotal: stepsTotal || 1,
      stepsCompleted: Math.max(0, Math.min(stepsCompleted, stepsTotal || 1)),
      escalationLevel,
      status,
      currentStep,
    },
  };
}

function findAdminUser(username) {
  const expected = normalizeText(username);
  return adminUsers.find((item) => normalizeText(item.username) === expected);
}

function normalizeAdminUserStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'inactif') return 'Inactif';
  if (normalized === 'bloque' || normalized === 'bloqué') return 'Bloque';
  return 'Actif';
}

function validateAdminUserCreatePayload(body) {
  const errors = [];

  const username = String(body.username || body.login || body.email || '').trim().toLowerCase();
  const fullName = String(body.fullName || body.full_name || '').trim();
  const role = String(body.role || body.roleName || body.role_name || '').trim();
  const direction = String(body.direction || body.directionName || body.direction_name || '').trim();
  const status = normalizeAdminUserStatus(body.status || 'Actif');

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
    errors.push('Username/email utilisateur invalide');
  }
  if (username && findAdminUser(username)) {
    errors.push('Utilisateur deja existant');
  }
  if (fullName.length < 3) {
    errors.push('Nom utilisateur requis');
  }
  if (role.length < 2) {
    errors.push('Role utilisateur requis');
  }
  if (direction.length < 2) {
    errors.push('Direction utilisateur requise');
  }

  return {
    errors,
    payload: {
      username,
      fullName,
      role,
      direction,
      status,
    },
  };
}

function findAdminRole(name) {
  const expected = normalizeText(name);
  return adminRoles.find((item) => normalizeText(item.name) === expected);
}

function validateAdminRoleCreatePayload(body) {
  const errors = [];

  const name = String(body.name || body.code || '').trim();
  const description = String(body.description || '').trim();
  const permissionsRaw = Number(body.permissions ?? body.permissionsCount ?? body.permissions_count ?? 0);
  const permissions = Number.isFinite(permissionsRaw) ? Math.max(1, Math.min(200, Math.round(permissionsRaw))) : 0;

  if (!/^[a-z0-9_-]{3,40}$/i.test(name)) {
    errors.push('Nom role invalide');
  }
  if (name && findAdminRole(name)) {
    errors.push('Role deja existant');
  }
  if (description.length < 5) {
    errors.push('Description role requise');
  }
  if (!Number.isFinite(permissionsRaw) || permissionsRaw < 1 || permissionsRaw > 200) {
    errors.push('Nombre permissions role invalide');
  }

  return {
    errors,
    payload: {
      name,
      description,
      permissions: permissions || 1,
    },
  };
}

function findPersonnelDossier(reference) {
  const expected = normalizeText(reference);
  return personnelDossiers.find((item) => normalizeText(item.reference) === expected);
}

function buildPersonnelDossierReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^DOS-${year}-(\\d+)$`);
  const maxExisting = personnelDossiers.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `DOS-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizePersonnelDossierStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'archive' || normalized === 'archivé' || normalized === 'archivee') return 'Archive';
  if (normalized === 'en_revue' || normalized === 'revue') return 'En revue';
  return 'Actif';
}

function validatePersonnelDossierCreatePayload(body) {
  const errors = [];
  const reference = String(body.reference || body.dossierRef || body.dossier_ref || '').trim().toUpperCase();
  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const type = String(body.type || body.dossierType || body.dossier_type || '').trim();
  const status = normalizePersonnelDossierStatus(body.status || 'Actif');
  const updatedAtInput = String(body.updatedAt || body.updated_at || '').trim();
  const parsedUpdatedAt = Date.parse(updatedAtInput);
  const updatedAt = !updatedAtInput
    ? new Date().toISOString()
    : Number.isNaN(parsedUpdatedAt)
      ? updatedAtInput
      : new Date(parsedUpdatedAt).toISOString();

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference dossier invalide');
  }
  if (reference && findPersonnelDossier(reference)) {
    errors.push('Reference dossier deja existante');
  }
  if (agent.length < 2) {
    errors.push('Agent dossier requis');
  }
  if (type.length < 2) {
    errors.push('Type dossier requis');
  }
  if (updatedAtInput && Number.isNaN(parsedUpdatedAt)) {
    errors.push('Date mise a jour dossier invalide');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      agent,
      type,
      status,
      updatedAt,
    },
  };
}

function findPersonnelAffectation(reference) {
  const expected = normalizeText(reference);
  return personnelAffectations.find((item) => normalizeText(item.reference) === expected);
}

function buildPersonnelAffectationReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^AFF-${year}-(\\d+)$`);
  const maxExisting = personnelAffectations.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `AFF-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizePersonnelAffectationStatus(value) {
  const normalized = normalizeText(value);
  if (normalized === 'en_cours') return 'En cours';
  if (normalized === 'effective' || normalized === 'effectif') return 'Effective';
  if (normalized === 'annulee' || normalized === 'annulé' || normalized === 'annule') return 'Annulee';
  return 'Planifiee';
}

function validatePersonnelAffectationCreatePayload(body) {
  const errors = [];
  const reference = String(body.reference || body.assignmentRef || body.assignment_ref || '').trim().toUpperCase();
  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const fromUnit = String(body.fromUnit || body.from_unit || '').trim();
  const toUnit = String(body.toUnit || body.to_unit || '').trim();
  const effectiveDateInput = String(body.effectiveDate || body.effective_date || '').trim();
  const parsedEffectiveDate = Date.parse(effectiveDateInput);
  const effectiveDate = Number.isNaN(parsedEffectiveDate)
    ? effectiveDateInput
    : new Date(parsedEffectiveDate).toISOString().slice(0, 10);
  const status = normalizePersonnelAffectationStatus(body.status || 'Planifiee');

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference affectation invalide');
  }
  if (reference && findPersonnelAffectation(reference)) {
    errors.push('Reference affectation deja existante');
  }
  if (agent.length < 2) {
    errors.push('Agent affectation requis');
  }
  if (fromUnit.length < 2) {
    errors.push('Structure source requise');
  }
  if (toUnit.length < 2) {
    errors.push('Structure cible requise');
  }
  if (fromUnit && toUnit && normalizeText(fromUnit) === normalizeText(toUnit)) {
    errors.push('Structure source et cible doivent etre differentes');
  }
  if (!effectiveDateInput || Number.isNaN(parsedEffectiveDate)) {
    errors.push('Date effective affectation invalide');
  }

  if (agent && effectiveDate && !Number.isNaN(parsedEffectiveDate)) {
    const normalizedAgent = normalizeText(agent);
    const conflict = personnelAffectations.some((item) => {
      const sameAgent = normalizeText(item.agent) === normalizedAgent;
      const sameDate = String(item.effectiveDate || '').slice(0, 10) === effectiveDate;
      const notCanceled = normalizeText(item.status) !== 'annulee';
      return sameAgent && sameDate && notCanceled;
    });
    if (conflict) {
      errors.push('Conflit: une affectation existe deja pour cet agent a la meme date effective');
    }
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      agent,
      fromUnit,
      toUnit,
      effectiveDate,
      status,
    },
  };
}

function findPersonnelMatriculeAudit(reference) {
  const expected = normalizeText(reference);
  return personnelMatriculeSuggestionAudit.find((item) => normalizeText(item.reference) === expected);
}

function buildPersonnelMatriculeAuditReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^MAT-AUD-${year}-(\\d+)$`);
  const maxExisting = personnelMatriculeSuggestionAudit.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `MAT-AUD-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
}

function normalizeMatriculeSuggestionBasedOn(value) {
  const normalized = normalizeText(value);
  if (normalized === 'direction+unite' || normalized === 'direction_unite') {
    return 'Direction+Unite';
  }
  if (normalized === 'direction') {
    return 'Direction';
  }
  return 'Global';
}

function validatePersonnelMatriculeAuditCreatePayload(body, currentUser) {
  const errors = [];
  const reference = String(body.reference || '').trim().toUpperCase();
  const createdAtInput = String(body.createdAt || body.created_at || '').trim();
  const parsedCreatedAt = Date.parse(createdAtInput);
  const createdAt = !createdAtInput
    ? new Date().toISOString()
    : Number.isNaN(parsedCreatedAt)
      ? createdAtInput
      : new Date(parsedCreatedAt).toISOString();
  const username = String(body.username || currentUser?.username || 'system').trim();
  const previousMatricule = String(body.previousMatricule || body.previous_matricule || '').trim();
  const suggestedMatricule = String(body.suggestedMatricule || body.suggested_matricule || '').trim();
  const direction = String(body.direction || '').trim();
  const unit = String(body.unit || '').trim();
  const scopeLabel = String(body.scopeLabel || body.scope_label || 'Global').trim() || 'Global';
  const basedOn = normalizeMatriculeSuggestionBasedOn(body.basedOn || body.based_on || 'Global');
  const reason = String(body.reason || 'generation').trim() || 'generation';

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference audit matricule invalide');
  }
  if (reference && findPersonnelMatriculeAudit(reference)) {
    errors.push('Reference audit matricule deja existante');
  }
  if (!suggestedMatricule || !/^PRM-\d{4,8}$/i.test(suggestedMatricule)) {
    errors.push('Matricule suggere invalide');
  }
  if (previousMatricule && !/^PRM-\d{4,8}$/i.test(previousMatricule)) {
    errors.push('Matricule precedent invalide');
  }
  if (!username) {
    errors.push('Utilisateur audit requis');
  }
  if (createdAtInput && Number.isNaN(parsedCreatedAt)) {
    errors.push('Date audit matricule invalide');
  }
  if (reason.length < 3) {
    errors.push('Motif audit matricule requis');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      createdAt,
      username,
      previousMatricule,
      suggestedMatricule,
      direction,
      unit,
      scopeLabel,
      basedOn,
      reason,
    },
  };
}

function buildAgentAuditReference() {
  const year = new Date().getFullYear();
  const regex = new RegExp(`^AG-AUD-${year}-(\\d+)$`);
  const maxExisting = personnelAgentAuditTrail.reduce((max, item) => {
    const match = regex.exec(String(item.reference || ''));
    if (!match) return max;
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `AG-AUD-${year}-${String(maxExisting + 1).padStart(4, '0')}`;
}

function normalizeAgentAuditSource(value) {
  const normalized = normalizeText(value);
  if (normalized === 'merge') return 'merge';
  if (normalized === 'system') return 'system';
  return 'update';
}

function buildAgentAuditSnapshot(agent) {
  return {
    matricule: String(agent?.matricule || '').trim(),
    fullName: String(agent?.fullName || '').trim(),
    direction: String(agent?.direction || '').trim(),
    unit: String(agent?.unit || '').trim(),
    position: String(agent?.position || '').trim(),
    status: String(agent?.status || '').trim(),
    manager: String(agent?.manager || '').trim(),
    email: String(agent?.email || '').trim(),
    phone: String(agent?.phone || '').trim(),
    identityNumber: String(agent?.identity?.identityNumber || '').trim(),
    contractType: String(agent?.administrative?.contractType || '').trim(),
  };
}

function computeAgentAuditChanges(beforeSnapshot, afterSnapshot) {
  const fields = [
    ['matricule', 'Matricule'],
    ['fullName', 'Nom complet'],
    ['direction', 'Direction'],
    ['unit', 'Unite'],
    ['position', 'Poste'],
    ['status', 'Statut'],
    ['manager', 'Manager'],
    ['email', 'Email'],
    ['phone', 'Telephone'],
    ['identityNumber', "Numero piece d'identite"],
    ['contractType', 'Type contrat'],
  ];

  return fields
    .map(([field, label]) => ({
      field,
      label,
      before: String(beforeSnapshot?.[field] || '').trim(),
      after: String(afterSnapshot?.[field] || '').trim(),
    }))
    .filter((item) => item.before !== item.after);
}

function appendAgentAuditEvent(input) {
  const changes = Array.isArray(input?.changes)
    ? input.changes
        .map((change) => ({
          field: String(change?.field || '').trim(),
          label: String(change?.label || '').trim(),
          before: String(change?.before || '').trim(),
          after: String(change?.after || '').trim(),
        }))
        .filter((change) => change.field || change.before || change.after)
    : [];

  if (!changes.length) {
    return null;
  }

  const created = {
    reference: String(input?.reference || '').trim().toUpperCase() || buildAgentAuditReference(),
    agentId: String(input?.agentId || '').trim(),
    agentLabel: String(input?.agentLabel || input?.agentId || '').trim(),
    changedAt: String(input?.changedAt || new Date().toISOString()).trim(),
    changedBy: String(input?.changedBy || 'system').trim() || 'system',
    source: normalizeAgentAuditSource(input?.source || 'update'),
    reason: String(input?.reason || 'mise_a_jour_fiche').trim() || 'mise_a_jour_fiche',
    changes,
  };

  if (!created.agentId || !created.agentLabel) {
    return null;
  }

  personnelAgentAuditTrail.push(created);
  return created;
}

function listAgentAuditTrail(agentId, url) {
  const expectedAgentId = normalizeText(agentId);
  let items = personnelAgentAuditTrail.filter((item) => normalizeText(item.agentId) === expectedAgentId);

  items = applyStringFilter(items, url, 'changedBy', 'changedBy');
  items = applyStringFilter(items, url, 'source', 'source');
  items = applyStringFilter(items, url, 'reason', 'reason');

  const fieldFilter = normalizeText(url.searchParams.get('field'));
  if (fieldFilter) {
    items = items.filter((item) => {
      const changes = Array.isArray(item.changes) ? item.changes : [];
      return changes.some((change) => {
        return (
          normalizeText(change.field).includes(fieldFilter) ||
          normalizeText(change.label).includes(fieldFilter)
        );
      });
    });
  }

  const withChangesText = items.map((item) => ({
    ...item,
    changesText: (Array.isArray(item.changes) ? item.changes : [])
      .map((change) => `${change.field} ${change.label} ${change.before} ${change.after}`)
      .join(' '),
  }));

  const filtered = applyCollectionQuery(withChangesText, url, {
    searchFields: ['reference', 'changedBy', 'source', 'reason', 'changedAt', 'changesText'],
    defaultSortBy: 'changedAt',
    defaultSortOrder: 'desc',
  });

  return filtered.map((item) => {
    const { changesText, ...clean } = item;
    return clean;
  });
}

function normalizeAgentDocumentsPayload(rawDocuments) {
  if (!Array.isArray(rawDocuments)) {
    return [];
  }

  return rawDocuments
    .map((item) => {
      const type = String(item?.type || item?.category || '').trim();
      const reference = String(item?.reference || item?.ref || '').trim();
      const status = String(item?.status || 'Valide').trim() || 'Valide';
      const fileName = String(item?.fileName || item?.file_name || '').trim();
      const fileDataUrl = String(
        item?.fileDataUrl || item?.file_data_url || item?.dataUrl || item?.data_url || item?.url || ''
      ).trim();
      const required = Boolean(item?.required);
      return {
        type,
        reference,
        status,
        fileName,
        fileDataUrl,
        required,
      };
    })
    .filter((item) => item.type && item.reference);
}

function normalizeAgentEducationsPayload(rawEducations) {
  if (!Array.isArray(rawEducations)) {
    return [];
  }

  return rawEducations
    .map((item) => ({
      degree: String(item?.degree || item?.diploma || '').trim(),
      field: String(item?.field || item?.speciality || item?.specialty || '').trim(),
      institution: String(item?.institution || item?.school || '').trim(),
      graduationYear: String(item?.graduationYear || item?.graduation_year || item?.year || '').trim(),
    }))
    .filter((item) => item.degree || item.field || item.institution || item.graduationYear);
}

function normalizeAgentCareerEventsPayload(rawEvents) {
  if (!Array.isArray(rawEvents)) {
    return [];
  }

  return rawEvents
    .map((item) => ({
      title: String(item?.title || item?.label || '').trim(),
      description: String(item?.description || item?.detail || '').trim(),
      date: String(item?.date || item?.eventDate || item?.event_date || '').trim(),
    }))
    .filter((item) => item.title || item.description || item.date);
}

function normalizeAgentIdentityPayload(rawIdentity) {
  const identity = rawIdentity && typeof rawIdentity === 'object' ? rawIdentity : {};
  return {
    identityType: String(identity.identityType || identity.identity_type || '').trim(),
    identityNumber: String(identity.identityNumber || identity.identity_number || '').trim(),
    birthDate: String(identity.birthDate || identity.birth_date || '').trim(),
    birthPlace: String(identity.birthPlace || identity.birth_place || '').trim(),
    nationality: String(identity.nationality || '').trim(),
  };
}

function normalizeAgentAdministrativePayload(rawAdministrative) {
  const administrative = rawAdministrative && typeof rawAdministrative === 'object' ? rawAdministrative : {};
  return {
    hireDate: String(administrative.hireDate || administrative.hire_date || '').trim(),
    contractType: String(administrative.contractType || administrative.contract_type || '').trim(),
    address: String(administrative.address || '').trim(),
    emergencyContactName: String(
      administrative.emergencyContactName || administrative.emergency_contact_name || ''
    ).trim(),
    emergencyContactPhone: String(
      administrative.emergencyContactPhone || administrative.emergency_contact_phone || ''
    ).trim(),
  };
}

function validateAgentCreatePayload(body) {
  const errors = [];
  const fullName = String(body.fullName || '').trim();
  const direction = String(body.direction || '').trim();
  const position = String(body.position || '').trim();
  const status = String(body.status || 'Actif').trim();
  const manager = String(body.manager || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const matricule = String(body.matricule || '').trim();
  const unit = String(body.unit || body.direction || '').trim();
  const photoUrl = String(body.photoUrl || body.photo_url || '').trim();
  const isDraft = Boolean(body.isDraft || normalizeText(status) === 'brouillon');
  const documents = normalizeAgentDocumentsPayload(body.documents);
  const educations = normalizeAgentEducationsPayload(body.educations);
  const identity = normalizeAgentIdentityPayload(body.identity);
  const administrative = normalizeAgentAdministrativePayload(body.administrative);

  const requiredDocumentTypes = [
    "Pièce d'identité (CNI/Passeport)",
    'CV',
    'Diplôme principal',
    'Acte/Arrêté de nomination',
    'Contrat',
  ];

  if (fullName.length < 3) {
    errors.push('Nom complet requis (3 caracteres minimum)');
  }
  if (!direction && !isDraft) {
    errors.push('Direction requise');
  }
  if (!position && !isDraft) {
    errors.push('Poste requis');
  }
  if (!status && !isDraft) {
    errors.push('Statut requis');
  }
  if (!manager && !isDraft) {
    errors.push('Manager requis');
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email invalide');
  }
  if (phone && !/^[+\d\s().-]{7,20}$/.test(phone)) {
    errors.push('Telephone invalide');
  }
  const parsedBirthDate = identity.birthDate ? Date.parse(identity.birthDate) : Number.NaN;
  const parsedHireDate = administrative.hireDate ? Date.parse(administrative.hireDate) : Number.NaN;
  if (identity.birthDate && Number.isNaN(parsedBirthDate)) {
    errors.push('Date de naissance invalide');
  }
  if (administrative.hireDate && Number.isNaN(parsedHireDate)) {
    errors.push('Date de recrutement invalide');
  }
  if (!Number.isNaN(parsedBirthDate) && !Number.isNaN(parsedHireDate)) {
    if (parsedHireDate < parsedBirthDate) {
      errors.push('Date de recrutement incoherente (anterieure a la date de naissance)');
    } else {
      const ageAtHire = (parsedHireDate - parsedBirthDate) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageAtHire < 16) {
        errors.push('Date de recrutement incoherente (age inferieur a 16 ans)');
      }
    }
  }
  if (matricule && agents.some((agent) => normalizeText(agent.matricule) === normalizeText(matricule))) {
    errors.push('Matricule deja existant');
  }
  if (email && agents.some((agent) => normalizeText(agent.email || '') === normalizeText(email))) {
    errors.push('Email deja utilise par un autre agent');
  }
  if (
    identity.identityNumber &&
    agents.some(
      (agent) =>
        normalizeText(agent.identity?.identityNumber || '') === normalizeText(identity.identityNumber)
    )
  ) {
    errors.push("Numero de piece d'identite deja existant");
  }

  if (!isDraft) {
    if (!photoUrl) {
      errors.push("Photo d'identite obligatoire");
    }
    if (!identity.identityNumber) {
      errors.push("Numero de piece d'identite obligatoire");
    }
    if (educations.length === 0) {
      errors.push('Au moins un diplome doit etre renseigne');
    }

    const documentsByType = new Map(documents.map((doc) => [normalizeText(doc.type), doc]));
    requiredDocumentTypes.forEach((type) => {
      const expected = normalizeText(type);
      const match = documentsByType.get(expected);
      if (!match) {
        errors.push(`Document obligatoire manquant: ${type}`);
        return;
      }

      if (!String(match.reference || '').trim()) {
        errors.push(`Reference manquante pour: ${type}`);
      }

      if (!String(match.fileDataUrl || '').trim()) {
        errors.push(`Fichier obligatoire manquant pour: ${type}`);
      }
    });
  }

  return {
    errors,
    payload: {
      matricule,
      fullName,
      direction,
      unit,
      position,
      status: isDraft ? 'Brouillon' : status || 'Actif',
      manager,
      email,
      phone,
      photoUrl,
      identity,
      administrative,
      educations,
      documents,
      isDraft,
    },
  };
}

function validateAgentUpdatePayload(body, currentAgent) {
  const errors = [];
  const safeBody = body && typeof body === 'object' ? body : {};
  const has = (key) => Object.prototype.hasOwnProperty.call(safeBody, key);
  const hasPhoto = has('photoUrl') || has('photo_url');

  const fullName = has('fullName') ? String(safeBody.fullName || '').trim() : String(currentAgent.fullName || '').trim();
  const direction = has('direction') ? String(safeBody.direction || '').trim() : String(currentAgent.direction || '').trim();
  const unit = has('unit') ? String(safeBody.unit || '').trim() : String(currentAgent.unit || '').trim();
  const position = has('position') ? String(safeBody.position || '').trim() : String(currentAgent.position || '').trim();
  const status = has('status') ? String(safeBody.status || '').trim() : String(currentAgent.status || '').trim();
  const manager = has('manager') ? String(safeBody.manager || '').trim() : String(currentAgent.manager || '').trim();
  const email = has('email') ? String(safeBody.email || '').trim() : String(currentAgent.email || '').trim();
  const phone = has('phone') ? String(safeBody.phone || '').trim() : String(currentAgent.phone || '').trim();
  const matricule = has('matricule')
    ? String(safeBody.matricule || '').trim()
    : String(currentAgent.matricule || '').trim();
  const photoUrl = hasPhoto
    ? String(safeBody.photoUrl || safeBody.photo_url || '').trim()
    : String(currentAgent.photoUrl || '').trim();

  const identity = has('identity')
    ? normalizeAgentIdentityPayload({ ...(currentAgent.identity || {}), ...(safeBody.identity || {}) })
    : normalizeAgentIdentityPayload(currentAgent.identity);

  const administrative = has('administrative')
    ? normalizeAgentAdministrativePayload({
        ...(currentAgent.administrative || {}),
        ...(safeBody.administrative || {}),
      })
    : normalizeAgentAdministrativePayload(currentAgent.administrative);

  const educations = has('educations')
    ? normalizeAgentEducationsPayload(safeBody.educations)
    : normalizeAgentEducationsPayload(currentAgent.educations);

  const documents = has('documents')
    ? normalizeAgentDocumentsPayload(safeBody.documents)
    : normalizeAgentDocumentsPayload(currentAgent.documents);

  const careerEvents = has('careerEvents') || has('career_events')
    ? normalizeAgentCareerEventsPayload(safeBody.careerEvents || safeBody.career_events)
    : normalizeAgentCareerEventsPayload(currentAgent.careerEvents);

  if (has('fullName') && fullName.length < 3) {
    errors.push('Nom complet requis (3 caracteres minimum)');
  }
  if (has('direction') && !direction) {
    errors.push('Direction invalide');
  }
  if (has('position') && !position) {
    errors.push('Poste invalide');
  }
  if (has('status') && !status) {
    errors.push('Statut invalide');
  }
  if (has('manager') && !manager) {
    errors.push('Manager invalide');
  }
  if (has('email') && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email invalide');
  }
  if (has('phone') && phone && !/^[+\d\s().-]{7,20}$/.test(phone)) {
    errors.push('Telephone invalide');
  }
  const parsedBirthDate = identity.birthDate ? Date.parse(identity.birthDate) : Number.NaN;
  const parsedHireDate = administrative.hireDate ? Date.parse(administrative.hireDate) : Number.NaN;
  if (has('identity') && identity.birthDate && Number.isNaN(parsedBirthDate)) {
    errors.push('Date de naissance invalide');
  }
  if (has('administrative') && administrative.hireDate && Number.isNaN(parsedHireDate)) {
    errors.push('Date de recrutement invalide');
  }
  if (!Number.isNaN(parsedBirthDate) && !Number.isNaN(parsedHireDate)) {
    if (parsedHireDate < parsedBirthDate) {
      errors.push('Date de recrutement incoherente (anterieure a la date de naissance)');
    } else {
      const ageAtHire = (parsedHireDate - parsedBirthDate) / (365.25 * 24 * 60 * 60 * 1000);
      if (ageAtHire < 16) {
        errors.push('Date de recrutement incoherente (age inferieur a 16 ans)');
      }
    }
  }
  if (hasPhoto && !photoUrl) {
    errors.push("Photo d'identite invalide");
  }
  if (
    has('matricule') &&
    matricule &&
    agents.some(
      (agent) => agent.id !== currentAgent.id && normalizeText(agent.matricule) === normalizeText(matricule)
    )
  ) {
    errors.push('Matricule deja existant');
  }
  if (
    email &&
    agents.some(
      (agent) => agent.id !== currentAgent.id && normalizeText(agent.email || '') === normalizeText(email)
    )
  ) {
    errors.push('Email deja utilise par un autre agent');
  }
  if (
    identity.identityNumber &&
    agents.some(
      (agent) =>
        agent.id !== currentAgent.id &&
        normalizeText(agent.identity?.identityNumber || '') === normalizeText(identity.identityNumber)
    )
  ) {
    errors.push("Numero de piece d'identite deja existant");
  }

  return {
    errors,
    payload: {
      matricule,
      fullName,
      direction,
      unit,
      position,
      status,
      manager,
      email,
      phone,
      photoUrl,
      identity,
      administrative,
      educations,
      careerEvents,
      documents,
    },
  };
}

function findWorkflowInstance(id) {
  return workflowInstances.find((instance) => instance.id === id);
}

function isTerminalWorkflowStatus(status) {
  return status === 'APPROUVE' || status === 'REJETE';
}

function toSafeInteger(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const rounded = Math.round(parsed);
  return Math.max(min, Math.min(max, rounded));
}

function normalizeSlaForInstance(instance, referenceTimestamp = Date.now()) {
  if (isTerminalWorkflowStatus(instance.status)) {
    instance.slaState = 'OK';
    return instance;
  }

  const dueTimestamp = Date.parse(instance.dueOn);
  if (Number.isNaN(dueTimestamp)) {
    instance.slaState = 'OK';
    return instance;
  }

  const diff = dueTimestamp - referenceTimestamp;
  if (diff < 0) {
    if (instance.status !== 'ESCALADE') {
      instance.status = 'EN_RETARD';
    }
    instance.slaState = 'BREACHED';
    return instance;
  }

  if (diff <= 24 * 60 * 60 * 1000) {
    instance.slaState = 'WARNING';
    return instance;
  }

  instance.slaState = 'OK';
  return instance;
}

function normalizeAllWorkflowSla(referenceTimestamp = Date.now()) {
  workflowInstances.forEach((instance) => normalizeSlaForInstance(instance, referenceTimestamp));
}

function appendWorkflowTimeline(instance, actor, action, note) {
  const date = new Date().toISOString();
  instance.lastUpdateOn = date;
  instance.timeline = [
    ...(Array.isArray(instance.timeline) ? instance.timeline : []),
    {
      date,
      actor,
      action,
      note,
    },
  ];
}

function applyWorkflowAction(instance, action, note, actor = 'Responsable RH') {
  if (isTerminalWorkflowStatus(instance.status)) {
    throw new Error("Action impossible sur une instance terminee");
  }

  if (action === 'APPROUVER') {
    instance.stepsCompleted = Math.min(
      Number(instance.stepsCompleted || 0) + 1,
      Number(instance.stepsTotal || 1)
    );
    if (instance.stepsCompleted >= Number(instance.stepsTotal || 1)) {
      instance.status = 'APPROUVE';
      instance.currentStep = 'Termine';
    } else {
      instance.status = 'EN_COURS';
      instance.currentStep = `Validation niveau ${instance.stepsCompleted + 1}`;
    }
  } else if (action === 'REJETER') {
    instance.status = 'REJETE';
    instance.currentStep = 'Cloture';
  } else if (action === 'ESCALADER') {
    const nextLevel = toSafeInteger(Number(instance.escalationLevel || 0) + 1, 1, 1, 3);
    applyEscalationLevel(instance, nextLevel, note || `Escalade ${escalationLabel(nextLevel)}`, actor);
    return instance;
  } else {
    throw new Error('Action workflow invalide');
  }

  appendWorkflowTimeline(instance, actor, action, note || '');
  normalizeSlaForInstance(instance);
  return instance;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function serializeAutomationState() {
  return {
    enabled: !!workflowAutomationState.enabled,
    intervalSeconds: workflowAutomationState.intervalSeconds,
    lastRunAt: workflowAutomationState.lastRunAt,
    totalCycles: workflowAutomationState.totalCycles,
    escalationsExecuted: workflowAutomationState.escalationsExecuted,
    notificationsSent: workflowAutomationState.notificationsSent,
    channels: deepClone(workflowAutomationState.channels),
  };
}

function serializeAutomationPolicy() {
  return deepClone(workflowAutomationPolicy);
}

function ownerByEscalationLevel(level, policy = workflowAutomationPolicy) {
  if (level >= 3) {
    return policy.owners.comex;
  }
  if (level === 2) {
    return policy.owners.n2;
  }
  if (level === 1) {
    return policy.owners.n1;
  }
  return 'Responsable RH';
}

function stepByEscalationLevel(level) {
  if (level >= 3) {
    return 'Escalade COMEX';
  }
  if (level === 2) {
    return 'Escalade niveau 2';
  }
  if (level === 1) {
    return 'Escalade niveau 1';
  }
  return 'Validation niveau 1';
}

function escalationLabel(level) {
  if (level >= 3) return 'COMEX';
  if (level === 2) return 'N2';
  if (level === 1) return 'N1';
  return 'N0';
}

function computeWorkflowRiskScore(instance, now, policy = workflowAutomationPolicy) {
  const scoreWeights = policy.weights;
  let score = 0;

  if (instance.priority === 'Critique') {
    score += scoreWeights.priorityCritique;
  } else if (instance.priority === 'Haute') {
    score += scoreWeights.priorityHaute;
  } else if (instance.priority === 'Normale') {
    score += Math.round(scoreWeights.priorityHaute / 2);
  } else {
    score += Math.round(scoreWeights.priorityHaute / 4);
  }

  if (instance.slaState === 'BREACHED') {
    score += scoreWeights.slaBreached;
  } else if (instance.slaState === 'WARNING') {
    score += scoreWeights.slaWarning;
  }

  const dueTimestamp = Date.parse(instance.dueOn);
  if (!Number.isNaN(dueTimestamp)) {
    const hoursToDue = (dueTimestamp - now) / (1000 * 60 * 60);
    if (hoursToDue < 0) {
      score += scoreWeights.overdueHours + Math.min(15, Math.abs(Math.round(hoursToDue)));
    } else if (hoursToDue <= 6) {
      score += Math.round(scoreWeights.overdueHours / 2);
    } else if (hoursToDue <= 24) {
      score += Math.round(scoreWeights.overdueHours / 3);
    }
  }

  const createdTimestamp = Date.parse(instance.createdOn);
  if (!Number.isNaN(createdTimestamp)) {
    const ageHours = (now - createdTimestamp) / (1000 * 60 * 60);
    if (ageHours >= 72) {
      score += scoreWeights.agingHours + Math.round(scoreWeights.agingHours / 2);
    } else if (ageHours >= 36) {
      score += scoreWeights.agingHours;
    }
  }

  const escalationLevel = toSafeInteger(instance.escalationLevel || 0, 0, 0, 5);
  if (escalationLevel > 0) {
    score += escalationLevel * scoreWeights.escalationLevel;
  }

  const remainingSteps = Math.max(
    0,
    toSafeInteger(instance.stepsTotal || 1, 1, 1, 12) - toSafeInteger(instance.stepsCompleted || 0, 0, 0, 12)
  );
  if (remainingSteps >= 3) {
    score += scoreWeights.remainingSteps;
  } else if (remainingSteps === 2) {
    score += Math.round(scoreWeights.remainingSteps / 2);
  }

  return toSafeInteger(score, 0, 0, 100);
}

function targetEscalationLevelFromScore(score, policy = workflowAutomationPolicy) {
  const thresholds = policy.thresholds;
  if (score >= thresholds.comex) {
    return 3;
  }
  if (score >= thresholds.n2) {
    return 2;
  }
  if (score >= thresholds.n1) {
    return 1;
  }
  return 0;
}

function shouldNotifyByScore(score, policy = workflowAutomationPolicy) {
  return score >= policy.thresholds.notify;
}

function applyEscalationLevel(instance, targetLevel, note, actor = 'Responsable RH') {
  const level = toSafeInteger(targetLevel, 1, 1, 3);
  instance.status = 'ESCALADE';
  instance.escalationLevel = level;
  instance.owner = ownerByEscalationLevel(level);
  instance.currentStep = stepByEscalationLevel(level);
  appendWorkflowTimeline(instance, actor, 'ESCALADER', note || `Escalade ${escalationLabel(level)}`);
  normalizeSlaForInstance(instance);
}

function pushWorkflowAutomationEvent(level, title, message, options = {}) {
  const event = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    date: new Date().toISOString(),
    level,
    title,
    message,
    instanceId: options.instanceId || undefined,
    action: options.action || undefined,
    channel: options.channel || undefined,
    trigger: options.trigger || undefined,
  };

  workflowAutomationEvents.unshift(event);
  if (workflowAutomationEvents.length > WORKFLOW_EVENT_HISTORY_LIMIT) {
    workflowAutomationEvents.splice(WORKFLOW_EVENT_HISTORY_LIMIT);
  }
  return event;
}

function getEnabledNotificationChannels() {
  const channels = [];
  if (workflowAutomationState.channels.email.enabled) {
    channels.push('EMAIL');
  }
  if (workflowAutomationState.channels.teams.enabled) {
    channels.push('TEAMS');
  }
  return channels;
}

function shouldAutoEscalateInstance(instance, targetLevel) {
  if (isTerminalWorkflowStatus(instance.status)) {
    return false;
  }

  const currentLevel = toSafeInteger(instance.escalationLevel || 0, 0, 0, 3);
  return targetLevel > currentLevel;
}

function shouldNotifyInstance(instance, score, policy = workflowAutomationPolicy) {
  if (isTerminalWorkflowStatus(instance.status)) {
    return false;
  }
  return shouldNotifyByScore(score, policy) || instance.slaState === 'BREACHED' || instance.status === 'EN_RETARD';
}

function hasEscalationCooldown(instanceId, now) {
  const previous = workflowEscalationCooldownByInstance.get(instanceId) || 0;
  return now - previous < ESCALATION_COOLDOWN_MS;
}

function hasNotificationCooldown(channel, instanceId, now) {
  const key = `${channel}:${instanceId}`;
  const previous = workflowNotificationCooldownByKey.get(key) || 0;
  return now - previous < NOTIFICATION_COOLDOWN_MS;
}

function markEscalationCooldown(instanceId, now) {
  workflowEscalationCooldownByInstance.set(instanceId, now);
}

function markNotificationCooldown(channel, instanceId, now) {
  const key = `${channel}:${instanceId}`;
  workflowNotificationCooldownByKey.set(key, now);
}

function runWorkflowAutomationCycle(trigger = 'manual') {
  const now = Date.now();
  const cycleEvents = [];

  normalizeAllWorkflowSla(now);

  let escalated = 0;
  let notified = 0;

  for (const instance of workflowInstances) {
    const score = computeWorkflowRiskScore(instance, now);
    const targetLevel = targetEscalationLevelFromScore(score);

    if (shouldAutoEscalateInstance(instance, targetLevel) && !hasEscalationCooldown(instance.id, now)) {
      try {
        applyEscalationLevel(
          instance,
          targetLevel,
          `Auto-escalade ${escalationLabel(targetLevel)} (score ${score}, ${trigger})`,
          'Moteur workflow serveur'
        );

        markEscalationCooldown(instance.id, now);
        escalated += 1;
        workflowAutomationState.escalationsExecuted += 1;

        cycleEvents.push(
          pushWorkflowAutomationEvent(
            'CRITICAL',
            'Auto-escalade executee',
            `${instance.id} escalade ${escalationLabel(targetLevel)} automatiquement (score ${score})`,
            {
              instanceId: instance.id,
              action: 'ESCALADER',
              trigger,
            }
          )
        );
      } catch (error) {
        cycleEvents.push(
          pushWorkflowAutomationEvent(
            'WARNING',
            'Auto-escalade echouee',
            `${instance.id}: ${error instanceof Error ? error.message : String(error)}`,
            {
              instanceId: instance.id,
              trigger,
            }
          )
        );
      }
    }

    if (shouldNotifyInstance(instance, score)) {
      const channels = getEnabledNotificationChannels();
      for (const channel of channels) {
        if (hasNotificationCooldown(channel, instance.id, now)) {
          continue;
        }

        markNotificationCooldown(channel, instance.id, now);
        notified += 1;
        workflowAutomationState.notificationsSent += 1;

        cycleEvents.push(
          pushWorkflowAutomationEvent(
            channel === 'EMAIL' ? 'WARNING' : 'INFO',
            'Notification externe envoyee',
            `${instance.id} notifie sur ${channel} (score ${score})`,
            {
              instanceId: instance.id,
              channel,
              trigger,
            }
          )
        );
      }
    }
  }

  if (!cycleEvents.length) {
    cycleEvents.push(
      pushWorkflowAutomationEvent('SUCCESS', 'Cycle termine', 'Aucune action automatique necessaire', {
        trigger,
      })
    );
  }

  workflowAutomationState.lastRunAt = new Date(now).toISOString();
  workflowAutomationState.totalCycles += 1;

  return {
    processed: workflowInstances.length,
    escalated,
    notified,
    events: cycleEvents,
    trigger,
    state: serializeAutomationState(),
  };
}

function restartWorkflowAutomationTimer() {
  if (workflowAutomationTimer) {
    clearInterval(workflowAutomationTimer);
    workflowAutomationTimer = null;
  }

  if (!workflowAutomationState.enabled) {
    return;
  }

  const intervalMs = Math.max(15_000, workflowAutomationState.intervalSeconds * 1000);
  workflowAutomationTimer = setInterval(() => {
    try {
      runWorkflowAutomationCycle('scheduler');
    } catch (error) {
      pushWorkflowAutomationEvent(
        'WARNING',
        'Cycle planifie en erreur',
        error instanceof Error ? error.message : String(error),
        { trigger: 'scheduler' }
      );
    }
  }, intervalMs);
}

function updateWorkflowAutomationStatus(payload) {
  const previousEnabled = workflowAutomationState.enabled;
  const previousInterval = workflowAutomationState.intervalSeconds;

  if (typeof payload.enabled === 'boolean') {
    workflowAutomationState.enabled = payload.enabled;
  }

  if (payload.intervalSeconds !== undefined) {
    workflowAutomationState.intervalSeconds = toSafeInteger(payload.intervalSeconds, 45, 15, 600);
  }

  restartWorkflowAutomationTimer();

  if (previousEnabled !== workflowAutomationState.enabled || previousInterval !== workflowAutomationState.intervalSeconds) {
    const stateLabel = workflowAutomationState.enabled ? 'activee' : 'desactivee';
    pushWorkflowAutomationEvent(
      'INFO',
      'Configuration automation modifiee',
      `Auto-escalade ${stateLabel}, intervalle ${workflowAutomationState.intervalSeconds}s`,
      { trigger: 'config' }
    );
  }

  return serializeAutomationState();
}

function sanitizeRecipients(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0)
    .slice(0, 20);
}

function updateWorkflowAutomationChannels(payload) {
  if (payload && typeof payload === 'object') {
    if (payload.email && typeof payload.email === 'object') {
      if (typeof payload.email.enabled === 'boolean') {
        workflowAutomationState.channels.email.enabled = payload.email.enabled;
      }
      if (payload.email.recipients !== undefined) {
        const recipients = sanitizeRecipients(payload.email.recipients);
        workflowAutomationState.channels.email.recipients = recipients;
      }
    }

    if (payload.teams && typeof payload.teams === 'object') {
      if (typeof payload.teams.enabled === 'boolean') {
        workflowAutomationState.channels.teams.enabled = payload.teams.enabled;
      }
      if (payload.teams.webhookUrl !== undefined) {
        workflowAutomationState.channels.teams.webhookUrl = String(payload.teams.webhookUrl || '').trim();
      }
      if (payload.teams.channelName !== undefined) {
        workflowAutomationState.channels.teams.channelName = String(payload.teams.channelName || '').trim();
      }
    }
  }

  pushWorkflowAutomationEvent(
    'INFO',
    'Canaux de notification mis a jour',
    'La configuration email/teams a ete enregistree',
    { trigger: 'config' }
  );

  return serializeAutomationState();
}

function applyAutomationPolicyPatch(targetPolicy, payload) {
  if (!payload || typeof payload !== 'object') {
    return targetPolicy;
  }

  if (payload.weights && typeof payload.weights === 'object') {
    targetPolicy.weights.priorityCritique = toSafeInteger(
      payload.weights.priorityCritique,
      targetPolicy.weights.priorityCritique,
      0,
      100
    );
    targetPolicy.weights.priorityHaute = toSafeInteger(
      payload.weights.priorityHaute,
      targetPolicy.weights.priorityHaute,
      0,
      100
    );
    targetPolicy.weights.slaBreached = toSafeInteger(
      payload.weights.slaBreached,
      targetPolicy.weights.slaBreached,
      0,
      100
    );
    targetPolicy.weights.slaWarning = toSafeInteger(
      payload.weights.slaWarning,
      targetPolicy.weights.slaWarning,
      0,
      100
    );
    targetPolicy.weights.overdueHours = toSafeInteger(
      payload.weights.overdueHours,
      targetPolicy.weights.overdueHours,
      0,
      100
    );
    targetPolicy.weights.agingHours = toSafeInteger(
      payload.weights.agingHours,
      targetPolicy.weights.agingHours,
      0,
      100
    );
    targetPolicy.weights.escalationLevel = toSafeInteger(
      payload.weights.escalationLevel,
      targetPolicy.weights.escalationLevel,
      0,
      100
    );
    targetPolicy.weights.remainingSteps = toSafeInteger(
      payload.weights.remainingSteps,
      targetPolicy.weights.remainingSteps,
      0,
      100
    );
  }

  if (payload.thresholds && typeof payload.thresholds === 'object') {
    targetPolicy.thresholds.notify = toSafeInteger(payload.thresholds.notify, targetPolicy.thresholds.notify, 0, 100);
    targetPolicy.thresholds.n1 = toSafeInteger(payload.thresholds.n1, targetPolicy.thresholds.n1, 0, 100);
    targetPolicy.thresholds.n2 = toSafeInteger(payload.thresholds.n2, targetPolicy.thresholds.n2, 0, 100);
    targetPolicy.thresholds.comex = toSafeInteger(payload.thresholds.comex, targetPolicy.thresholds.comex, 0, 100);

    if (targetPolicy.thresholds.n1 < targetPolicy.thresholds.notify) {
      targetPolicy.thresholds.n1 = targetPolicy.thresholds.notify;
    }
    if (targetPolicy.thresholds.n2 < targetPolicy.thresholds.n1) {
      targetPolicy.thresholds.n2 = targetPolicy.thresholds.n1;
    }
    if (targetPolicy.thresholds.comex < targetPolicy.thresholds.n2) {
      targetPolicy.thresholds.comex = targetPolicy.thresholds.n2;
    }
  }

  if (payload.owners && typeof payload.owners === 'object') {
    if (payload.owners.n1 !== undefined) {
      targetPolicy.owners.n1 = String(payload.owners.n1 || '').trim() || targetPolicy.owners.n1;
    }
    if (payload.owners.n2 !== undefined) {
      targetPolicy.owners.n2 = String(payload.owners.n2 || '').trim() || targetPolicy.owners.n2;
    }
    if (payload.owners.comex !== undefined) {
      targetPolicy.owners.comex = String(payload.owners.comex || '').trim() || targetPolicy.owners.comex;
    }
  }

  return targetPolicy;
}

function buildSimulationPolicy(payloadPolicy) {
  const simulatedPolicy = deepClone(workflowAutomationPolicy);
  applyAutomationPolicyPatch(simulatedPolicy, payloadPolicy);
  return simulatedPolicy;
}

function simulateWorkflowAutomation(payload) {
  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const horizonHours = toSafeInteger(safePayload.horizonHours, 24, 1, 168);
  const policy = buildSimulationPolicy(safePayload.policy);
  const now = Date.now();
  const projectedTimestamp = now + horizonHours * 60 * 60 * 1000;

  const items = workflowInstances
    .map((instance) => {
      const currentState = deepClone(instance);
      const projectedState = deepClone(instance);

      normalizeSlaForInstance(currentState, now);
      normalizeSlaForInstance(projectedState, projectedTimestamp);

      const scoreNow = computeWorkflowRiskScore(currentState, now, policy);
      const scoreProjected = computeWorkflowRiskScore(projectedState, projectedTimestamp, policy);

      const currentEscalationLevel = toSafeInteger(instance.escalationLevel || 0, 0, 0, 3);
      const projectedEscalationLevel = targetEscalationLevelFromScore(scoreProjected, policy);
      const shouldEscalate = !isTerminalWorkflowStatus(projectedState.status) && projectedEscalationLevel > currentEscalationLevel;
      const shouldNotify = shouldNotifyInstance(projectedState, scoreProjected, policy);

      const dueTimestamp = Date.parse(instance.dueOn);
      const dueInHours =
        Number.isNaN(dueTimestamp) ? null : Math.round((((dueTimestamp - projectedTimestamp) / (60 * 60 * 1000)) * 10)) / 10;

      return {
        instanceId: String(instance.id || ''),
        definition: String(instance.definition || ''),
        requester: String(instance.requester || ''),
        priority: String(instance.priority || 'Normale'),
        currentStatus: String(currentState.status || 'EN_ATTENTE'),
        projectedStatus: String(projectedState.status || currentState.status || 'EN_ATTENTE'),
        currentEscalationLevel,
        projectedEscalationLevel,
        projectedEscalationLabel: escalationLabel(projectedEscalationLevel),
        scoreNow,
        scoreProjected,
        scoreDelta: scoreProjected - scoreNow,
        shouldEscalate,
        shouldNotify,
        dueInHours,
        projectedOwner: shouldEscalate
          ? ownerByEscalationLevel(projectedEscalationLevel, policy)
          : String(projectedState.owner || instance.owner || ''),
        projectedStep: shouldEscalate ? stepByEscalationLevel(projectedEscalationLevel) : String(projectedState.currentStep || ''),
      };
    })
    .sort((left, right) => {
      const scoreDiff = right.scoreProjected - left.scoreProjected;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      const leftDue = left.dueInHours === null ? Number.POSITIVE_INFINITY : left.dueInHours;
      const rightDue = right.dueInHours === null ? Number.POSITIVE_INFINITY : right.dueInHours;
      return leftDue - rightDue;
    });

  const escalationCandidates = items.filter((item) => item.shouldEscalate);

  return {
    generatedAt: new Date(now).toISOString(),
    horizonHours,
    policy: deepClone(policy),
    summary: {
      processed: items.length,
      escalationsPlanned: escalationCandidates.length,
      notificationsPlanned: items.filter((item) => item.shouldNotify).length,
      criticalItems: items.filter((item) => item.scoreProjected >= policy.thresholds.n2).length,
      targetN1: escalationCandidates.filter((item) => item.projectedEscalationLevel === 1).length,
      targetN2: escalationCandidates.filter((item) => item.projectedEscalationLevel === 2).length,
      targetComex: escalationCandidates.filter((item) => item.projectedEscalationLevel >= 3).length,
    },
    items,
  };
}

function updateWorkflowAutomationPolicy(payload) {
  applyAutomationPolicyPatch(workflowAutomationPolicy, payload);

  pushWorkflowAutomationEvent(
    'INFO',
    'Matrice de priorisation mise a jour',
    'Regles de score et seuils d escalade enregistres',
    { trigger: 'config' }
  );

  return serializeAutomationPolicy();
}

normalizeAllWorkflowSla();
pushWorkflowAutomationEvent('INFO', 'Moteur workflow initialise', 'Scheduler backend pret', { trigger: 'system' });
restartWorkflowAutomationTimer();

function resolveFrontendFilePath(requestPath) {
  let decodedPath = '/';
  try {
    decodedPath = decodeURIComponent(requestPath || '/');
  } catch {
    return null;
  }

  const normalizedPath = decodedPath === '/' ? '/index.html' : decodedPath;
  const absolutePath = pathModule.resolve(FRONTEND_DIST_DIR, `.${normalizedPath}`);
  if (!absolutePath.startsWith(FRONTEND_DIST_DIR)) {
    return null;
  }

  return absolutePath;
}

function frontendContentTypeFor(filePath) {
  return STATIC_MIME_BY_EXTENSION[pathModule.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function serveFrontendFile(req, res, filePath, cacheControl) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }

  res.writeHead(200, {
    'Content-Type': frontendContentTypeFor(filePath),
    'Content-Length': stats.size,
    'Cache-Control': cacheControl,
  });

  if ((req.method || 'GET') === 'HEAD') {
    res.end();
    return true;
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    if (!res.headersSent) {
      sendApiError(res, 500, 'FRONTEND_READ_ERROR', 'Lecture frontend impossible');
      return;
    }
    res.end();
  });
  stream.pipe(res);
  return true;
}

function serveFrontendRequest(req, res, requestPath) {
  if (!fs.existsSync(FRONTEND_INDEX_PATH)) {
    return false;
  }

  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }

  const directFile = resolveFrontendFilePath(requestPath);
  if (directFile && fs.existsSync(directFile) && fs.statSync(directFile).isFile()) {
    const cacheControl = directFile === FRONTEND_INDEX_PATH ? 'no-store' : 'public, max-age=3600';
    return serveFrontendFile(req, res, directFile, cacheControl);
  }

  if (pathModule.extname(requestPath || '').length > 0) {
    return false;
  }

  return serveFrontendFile(req, res, FRONTEND_INDEX_PATH, 'no-store');
}

const server = http.createServer(async (req, res) => {
  const method = req.method || 'GET';
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = normalizePath(url.pathname);
  const routePath = normalizeRouteMatchPath(url.pathname);
  const incomingRequestId = Array.isArray(req.headers['x-correlation-id'])
    ? req.headers['x-correlation-id'][0]
    : req.headers['x-correlation-id'];
  const requestId = String(incomingRequestId || '').trim() || nowToken('req');
  res.setHeader('X-Correlation-Id', requestId);

  if (method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (path === '/health') {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (!path.startsWith('/api/v1')) {
    if (serveFrontendRequest(req, res, path)) {
      return;
    }
    sendApiError(res, 404, 'NOT_FOUND', 'Not Found');
    return;
  }

  try {
    if (method === 'POST' && path === '/api/v1/auth/login') {
      const body = await readJsonBody(req);
      const username = String(body.username || body.email || '').trim();
      const password = String(body.password || '').trim();
      const user = users.find((u) => u.username === username && u.password === password);

      if (!user) {
        sendApiError(res, 401, 'AUTH_INVALID_CREDENTIALS', 'Identifiants invalides');
        return;
      }

      const session = issueSession(user);
      sendJson(res, 200, buildAuthResponse(session));
      return;
    }

    if (method === 'POST' && path === '/api/v1/auth/refresh') {
      const body = await readJsonBody(req);
      const refreshToken = String(body.refreshToken || '').trim();
      if (!refreshToken) {
        sendApiError(res, 401, 'AUTH_REFRESH_TOKEN_MISSING', 'Refresh token manquant');
        return;
      }

      purgeExpiredSessions();
      const refreshSession = refreshSessions.get(refreshToken);
      if (!refreshSession) {
        sendApiError(res, 401, 'AUTH_REFRESH_TOKEN_INVALID', 'Refresh token invalide');
        return;
      }

      if (Number(refreshSession.expiresAt || 0) <= Date.now()) {
        refreshSessions.delete(refreshToken);
        if (refreshSession.accessToken) {
          accessSessions.delete(refreshSession.accessToken);
        }
        sendApiError(res, 401, 'AUTH_REFRESH_TOKEN_EXPIRED', 'Refresh token expire');
        return;
      }

      refreshSessions.delete(refreshToken);
      if (refreshSession.accessToken) {
        accessSessions.delete(refreshSession.accessToken);
      }
      const session = issueSession(refreshSession);
      sendJson(res, 200, buildAuthResponse(session));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/v1/public/uploads/')) {
      let requestedName = '';
      try {
        requestedName = decodeURIComponent(path.slice('/api/v1/public/uploads/'.length));
      } catch {
        sendApiError(res, 400, 'UPLOAD_FILE_NAME_INVALID', 'Nom de fichier invalide');
        return;
      }
      const safeFileName = pathModule.basename(requestedName);
      if (!safeFileName || safeFileName !== requestedName) {
        sendApiError(res, 400, 'UPLOAD_FILE_NAME_INVALID', 'Nom de fichier invalide');
        return;
      }

      const absolutePath = pathModule.join(PERSONNEL_UPLOAD_DIR, safeFileName);
      if (!fs.existsSync(absolutePath)) {
        sendApiError(res, 404, 'UPLOAD_FILE_NOT_FOUND', 'Fichier introuvable');
        return;
      }

      const stats = fs.statSync(absolutePath);
      if (!stats.isFile()) {
        sendApiError(res, 404, 'UPLOAD_FILE_NOT_FOUND', 'Fichier introuvable');
        return;
      }

      const extension = pathModule.extname(safeFileName).toLowerCase();
      const mimeType = UPLOAD_MIME_BY_EXTENSION[extension] || 'application/octet-stream';
      const dispositionRaw = normalizeText(url.searchParams.get('disposition') || '');
      const contentDisposition = dispositionRaw === 'inline' ? 'inline' : 'attachment';
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': stats.size,
        'Content-Disposition': `${contentDisposition}; filename="${safeFileName}"`,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Correlation-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
        'Access-Control-Expose-Headers': 'X-Correlation-Id',
      });

      const stream = fs.createReadStream(absolutePath);
      stream.on('error', () => {
        if (!res.headersSent) {
          sendApiError(res, 500, 'UPLOAD_READ_ERROR', 'Lecture fichier impossible');
          return;
        }
        res.end();
      });
      stream.pipe(res);
      return;
    }

    const authContext = authenticateRequest(req, res);
    if (!authContext) {
      return;
    }
    const currentUser = authContext.session;
    processDocumentDispatchReminders();
    processNotificationDeliveries();
    const accessRequirements = resolveRouteAccessRequirements(method, path);
    if (accessRequirements && !ensureAccess(res, currentUser, accessRequirements)) {
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/uploads') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const contentType = Array.isArray(req.headers['content-type'])
        ? req.headers['content-type'][0]
        : req.headers['content-type'];
      if (!String(contentType || '').toLowerCase().includes('multipart/form-data')) {
        sendApiError(res, 415, 'UPLOAD_CONTENT_TYPE_INVALID', 'Content-Type multipart/form-data attendu');
        return;
      }

      let rawBody;
      try {
        rawBody = await readRawBody(req, MAX_UPLOAD_BYTES + 1024 * 1024);
      } catch (error) {
        const isTooLarge = error instanceof Error && error.message === 'Body too large';
        sendApiError(
          res,
          isTooLarge ? 413 : 400,
          isTooLarge ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_BODY_INVALID',
          isTooLarge ? 'Fichier trop volumineux' : 'Body upload invalide'
        );
        return;
      }

      let uploadedFile;
      try {
        uploadedFile = parseMultipartFile(rawBody, contentType);
      } catch (error) {
        sendApiError(
          res,
          400,
          'UPLOAD_MULTIPART_INVALID',
          error instanceof Error ? error.message : 'Multipart invalide'
        );
        return;
      }

      if (uploadedFile.fieldName !== 'file') {
        sendApiError(res, 400, 'UPLOAD_FIELD_INVALID', 'Champ fichier invalide');
        return;
      }

      if (!uploadedFile.data || uploadedFile.data.length === 0) {
        sendApiError(res, 400, 'UPLOAD_EMPTY_FILE', 'Fichier vide');
        return;
      }

      if (uploadedFile.data.length > MAX_UPLOAD_BYTES) {
        sendApiError(res, 413, 'UPLOAD_TOO_LARGE', 'Fichier trop volumineux');
        return;
      }

      const sanitizedFileName = sanitizeUploadFileName(uploadedFile.fileName);
      const extension = resolveUploadExtension(sanitizedFileName, uploadedFile.mimeType);
      if (!extension || !ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
        sendApiError(
          res,
          400,
          'UPLOAD_EXTENSION_INVALID',
          `Type de fichier non supporte. Extensions: ${Array.from(ALLOWED_UPLOAD_EXTENSIONS).join(', ')}`
        );
        return;
      }

      const mimeType = resolveUploadMimeType(uploadedFile.mimeType, extension);
      if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) {
        sendApiError(res, 400, 'UPLOAD_MIME_TYPE_INVALID', 'Mime type non supporte');
        return;
      }

      const uploadId = nowToken('upl');
      const storedFileName = `${uploadId}${extension}`;
      const targetPath = pathModule.join(PERSONNEL_UPLOAD_DIR, storedFileName);
      fs.writeFileSync(targetPath, uploadedFile.data);

      sendJson(res, 201, {
        id: uploadId,
        fileName: sanitizedFileName,
        mimeType,
        size: uploadedFile.data.length,
        url: `/api/v1/public/uploads/${encodeURIComponent(storedFileName)}`,
        uploadedAt: new Date().toISOString(),
      });
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/uploads') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const contentType = Array.isArray(req.headers['content-type'])
        ? req.headers['content-type'][0]
        : req.headers['content-type'];
      if (!String(contentType || '').toLowerCase().includes('multipart/form-data')) {
        sendApiError(res, 415, 'UPLOAD_CONTENT_TYPE_INVALID', 'Content-Type multipart/form-data attendu');
        return;
      }

      let rawBody;
      try {
        rawBody = await readRawBody(req, MAX_UPLOAD_BYTES + 1024 * 1024);
      } catch (error) {
        const isTooLarge = error instanceof Error && error.message === 'Body too large';
        sendApiError(
          res,
          isTooLarge ? 413 : 400,
          isTooLarge ? 'UPLOAD_TOO_LARGE' : 'UPLOAD_BODY_INVALID',
          isTooLarge ? 'Fichier trop volumineux' : 'Body upload invalide'
        );
        return;
      }

      let uploadedFile;
      try {
        uploadedFile = parseMultipartFile(rawBody, contentType);
      } catch (error) {
        sendApiError(
          res,
          400,
          'UPLOAD_MULTIPART_INVALID',
          error instanceof Error ? error.message : 'Multipart invalide'
        );
        return;
      }

      if (uploadedFile.fieldName !== 'file') {
        sendApiError(res, 400, 'UPLOAD_FIELD_INVALID', 'Champ fichier invalide');
        return;
      }

      if (!uploadedFile.data || uploadedFile.data.length === 0) {
        sendApiError(res, 400, 'UPLOAD_EMPTY_FILE', 'Fichier vide');
        return;
      }

      if (uploadedFile.data.length > MAX_UPLOAD_BYTES) {
        sendApiError(res, 413, 'UPLOAD_TOO_LARGE', 'Fichier trop volumineux');
        return;
      }

      const sanitizedFileName = sanitizeUploadFileName(uploadedFile.fileName);
      const extension = resolveUploadExtension(sanitizedFileName, uploadedFile.mimeType);
      if (!extension || !ALLOWED_UPLOAD_EXTENSIONS.has(extension)) {
        sendApiError(
          res,
          400,
          'UPLOAD_EXTENSION_INVALID',
          `Type de fichier non supporte. Extensions: ${Array.from(ALLOWED_UPLOAD_EXTENSIONS).join(', ')}`
        );
        return;
      }

      const mimeType = resolveUploadMimeType(uploadedFile.mimeType, extension);
      if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) {
        sendApiError(res, 400, 'UPLOAD_MIME_TYPE_INVALID', 'Mime type non supporte');
        return;
      }

      const uploadId = nowToken('upl');
      const storedFileName = `${uploadId}${extension}`;
      const targetPath = pathModule.join(PERSONNEL_UPLOAD_DIR, storedFileName);
      fs.writeFileSync(targetPath, uploadedFile.data);

      sendJson(res, 201, {
        id: uploadId,
        fileName: sanitizedFileName,
        mimeType,
        size: uploadedFile.data.length,
        url: `/api/v1/public/uploads/${encodeURIComponent(storedFileName)}`,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/dashboard/summary') {
      sendJson(res, 200, {
        headcount: 128,
        active: 117,
        absences: 11,
        vacancies: 6,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/dashboard/pending-requests') {
      sendJson(res, 200, [
        {
          reference: 'REQ-2026-001',
          agent: 'Aminata Diallo',
          type: 'Conge annuel',
          unit: 'Gestion administrative',
          submittedAt: '2026-03-20',
          status: 'En attente',
        },
      ]);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents') {
      let items = agents.map((a) => ({
        id: a.id,
        matricule: a.matricule,
        fullName: a.fullName,
        direction: a.direction,
        unit: a.unit || '',
        position: a.position,
        status: a.status,
        manager: a.manager,
        contractType: String(a.administrative?.contractType || '').trim(),
        photoUrl: a.photoUrl,
      }));
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'direction', 'direction');
      items = applyStringFilter(items, url, 'unit', 'unit');
      items = applyStringFilter(items, url, 'manager', 'manager');
      items = applyStringFilter(items, url, 'position', 'position');
      items = applyStringFilter(items, url, 'contractType', 'contractType');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'matricule', 'fullName', 'direction', 'unit', 'position', 'status', 'manager', 'contractType'],
        defaultSortBy: 'fullName',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/agents') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateAgentCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees agent invalides', validation.errors);
        return;
      }

      const nextIdNumber = agents.length + 1;
      let id = `PRM-${String(nextIdNumber).padStart(4, '0')}`;
      while (findAgent(id)) {
        id = `PRM-${String(Number(id.split('-').pop() || nextIdNumber) + 1).padStart(4, '0')}`;
      }

      const requestedMatricule = String(validation.payload.matricule || '').trim();
      const created = {
        id,
        matricule: requestedMatricule || id,
        fullName: validation.payload.fullName,
        direction: validation.payload.direction,
        unit: validation.payload.unit,
        position: validation.payload.position,
        status: validation.payload.status,
        manager: validation.payload.manager,
        email: validation.payload.email,
        phone: validation.payload.phone,
        photoUrl: validation.payload.photoUrl || './assets/images/faces/profile.jpg',
        identity: validation.payload.identity,
        administrative: validation.payload.administrative,
        educations: validation.payload.educations,
        careerEvents: [],
        documents: validation.payload.documents,
      };
      agents.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'PUT' && path.startsWith('/api/v1/personnel/agents/')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const id = path.split('/').pop();
      const agent = findAgent(id);
      if (!agent) {
        sendApiError(res, 404, 'AGENT_NOT_FOUND', 'Agent introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateAgentUpdatePayload(body || {}, agent);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees agent invalides', validation.errors);
        return;
      }

      const beforeSnapshot = buildAgentAuditSnapshot(agent);
      const updatedAt = new Date().toISOString();
      const auditReason = String(body?.auditReason || body?.audit_reason || '').trim() || 'mise_a_jour_fiche';

      Object.assign(agent, {
        matricule: validation.payload.matricule || agent.id,
        fullName: validation.payload.fullName,
        direction: validation.payload.direction,
        unit: validation.payload.unit || validation.payload.direction,
        position: validation.payload.position,
        status: validation.payload.status || 'Actif',
        manager: validation.payload.manager,
        email: validation.payload.email,
        phone: validation.payload.phone,
        photoUrl: validation.payload.photoUrl || './assets/images/faces/profile.jpg',
        identity: validation.payload.identity,
        administrative: validation.payload.administrative,
        educations: validation.payload.educations,
        careerEvents: validation.payload.careerEvents,
        documents: validation.payload.documents,
      });

      appendAgentAuditEvent({
        agentId: agent.id,
        agentLabel: agent.fullName,
        changedAt: updatedAt,
        changedBy: String(currentUser?.username || 'system').trim() || 'system',
        source: 'update',
        reason: auditReason,
        changes: computeAgentAuditChanges(beforeSnapshot, buildAgentAuditSnapshot(agent)),
      });

      sendJson(res, 200, agent);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents/duplicate-index') {
      const items = agents.map((agent) => ({
        id: String(agent.id || '').trim(),
        fullName: String(agent.fullName || '').trim(),
        matricule: String(agent.matricule || '').trim(),
        email: String(agent.email || '').trim(),
        identityNumber: String(agent.identity?.identityNumber || '').trim(),
      }));
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents/duplicate-cases') {
      let items = buildAgentDuplicateCases();
      items = applyStringFilter(items, url, 'duplicateField', 'duplicateField');
      const minCountRaw = Number(url.searchParams.get('minCount') || 2);
      const minCount = Number.isFinite(minCountRaw) ? Math.max(2, Math.round(minCountRaw)) : 2;
      items = items.filter((item) => Number(item.impactedCount || 0) >= minCount);
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'duplicateField', 'duplicateValue'],
        defaultSortBy: 'confidenceScore',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/agents/merge') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateAgentMergePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees fusion agent invalides', validation.errors);
        return;
      }

      const merged = executeAgentMerge(validation.payload, currentUser);
      sendJson(res, 200, merged);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents/matricule-suggestion') {
      const direction = String(url.searchParams.get('direction') || '').trim();
      const unit = String(url.searchParams.get('unit') || '').trim();
      const suggestion = buildAgentMatriculeSuggestion(direction, unit);
      sendJson(res, 200, suggestion);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/agents/matricule-suggestion-audit') {
      let items = [...personnelMatriculeSuggestionAudit];
      items = applyStringFilter(items, url, 'username', 'username');
      items = applyStringFilter(items, url, 'reason', 'reason');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'username',
          'previousMatricule',
          'suggestedMatricule',
          'scopeLabel',
          'basedOn',
          'reason',
          'createdAt',
        ],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/agents/matricule-suggestion-audit') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validatePersonnelMatriculeAuditCreatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees audit matricule invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildPersonnelMatriculeAuditReference(),
        createdAt: validation.payload.createdAt,
        username: validation.payload.username,
        previousMatricule: validation.payload.previousMatricule,
        suggestedMatricule: validation.payload.suggestedMatricule,
        direction: validation.payload.direction,
        unit: validation.payload.unit,
        scopeLabel: validation.payload.scopeLabel,
        basedOn: validation.payload.basedOn,
        reason: validation.payload.reason,
      };
      personnelMatriculeSuggestionAudit.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && /^\/api\/v1\/personnel\/agents\/[^/]+\/audit-trail$/.test(path)) {
      const segments = path.split('/');
      const id = String(segments[5] || '').trim();
      const agent = findAgent(id);
      if (!agent) {
        sendApiError(res, 404, 'AGENT_NOT_FOUND', 'Agent introuvable');
        return;
      }
      sendJson(res, 200, listAgentAuditTrail(id, url));
      return;
    }

    if (method === 'GET' && path.startsWith('/api/v1/personnel/agents/')) {
      const id = path.split('/').pop();
      const agent = findAgent(id);
      if (!agent) {
        sendApiError(res, 404, 'AGENT_NOT_FOUND', 'Agent introuvable');
        return;
      }
      sendJson(res, 200, agent);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/dossiers') {
      let items = [...personnelDossiers];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'agent', 'type', 'status', 'updatedAt'],
        defaultSortBy: 'updatedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/dossiers') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validatePersonnelDossierCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees dossier personnel invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildPersonnelDossierReference(),
        agent: validation.payload.agent,
        type: validation.payload.type,
        status: validation.payload.status,
        updatedAt: validation.payload.updatedAt,
      };
      personnelDossiers.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/personnel/affectations') {
      let items = [...personnelAffectations];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyStringFilter(items, url, 'fromUnit', 'fromUnit');
      items = applyStringFilter(items, url, 'toUnit', 'toUnit');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'agent', 'fromUnit', 'toUnit', 'effectiveDate', 'status'],
        defaultSortBy: 'effectiveDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/personnel/affectations') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validatePersonnelAffectationCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees affectation personnel invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildPersonnelAffectationReference(),
        agent: validation.payload.agent,
        fromUnit: validation.payload.fromUnit,
        toUnit: validation.payload.toUnit,
        effectiveDate: validation.payload.effectiveDate,
        status: validation.payload.status,
      };
      personnelAffectations.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/workflows/definitions') {
      sendJson(res, 200, workflowDefinitions);
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/definitions') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateWorkflowDefinitionCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees workflow invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildWorkflowDefinitionCode(validation.payload.usedFor),
        name: validation.payload.name,
        steps: validation.payload.steps,
        usedFor: validation.payload.usedFor,
        status: validation.payload.status,
        slaTargetHours: validation.payload.slaTargetHours,
        autoEscalation: validation.payload.autoEscalation,
      };
      workflowDefinitions.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/workflows/instances') {
      normalizeAllWorkflowSla();
      sendJson(res, 200, workflowInstances);
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/instances') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateWorkflowInstanceCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees instance workflow invalides', validation.errors);
        return;
      }

      const nowIso = new Date().toISOString();
      const created = {
        id: validation.payload.id || buildWorkflowInstanceId(),
        definition: validation.payload.definition,
        requester: validation.payload.requester,
        createdOn: nowIso,
        currentStep: validation.payload.currentStep,
        status: validation.payload.status,
        priority: validation.payload.priority,
        dueOn: validation.payload.dueOn,
        owner: validation.payload.owner,
        stepsTotal: validation.payload.stepsTotal,
        stepsCompleted: validation.payload.stepsCompleted,
        escalationLevel: validation.payload.escalationLevel,
        lastUpdateOn: nowIso,
        timeline: [
          {
            date: nowIso,
            actor: String(currentUser.fullName || currentUser.username || 'Responsable RH'),
            action: 'CREATION',
            note: '',
          },
        ],
      };
      normalizeSlaForInstance(created);
      workflowInstances.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/workflows/instances/') && path.endsWith('/actions')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager'])) {
        return;
      }

      const segments = path.split('/');
      const workflowId = segments[segments.length - 2];
      const workflowInstance = findWorkflowInstance(workflowId);
      if (!workflowInstance) {
        sendApiError(res, 404, 'WORKFLOW_INSTANCE_NOT_FOUND', 'Instance workflow introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const action = String(body.action || '').toUpperCase();
      const note = String(body.note || '');

      try {
        applyWorkflowAction(
          workflowInstance,
          action,
          note,
          String(currentUser.fullName || currentUser.username || 'Responsable RH')
        );
      } catch (error) {
        sendApiError(
          res,
          400,
          'WORKFLOW_ACTION_INVALID',
          error instanceof Error ? error.message : String(error)
        );
        return;
      }

      sendJson(res, 200, workflowInstance);
      return;
    }

    if (method === 'GET' && path === '/api/v1/workflows/automation/status') {
      sendJson(res, 200, serializeAutomationState());
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/status') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const nextState = updateWorkflowAutomationStatus(body || {});
      sendJson(res, 200, nextState);
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/channels') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const nextState = updateWorkflowAutomationChannels(body || {});
      sendJson(res, 200, nextState);
      return;
    }

    if (method === 'GET' && path === '/api/v1/workflows/automation/policy') {
      sendJson(res, 200, serializeAutomationPolicy());
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/policy') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const nextPolicy = updateWorkflowAutomationPolicy(body || {});
      sendJson(res, 200, nextPolicy);
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/simulate') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const simulation = simulateWorkflowAutomation(body || {});
      sendJson(res, 200, simulation);
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/run-cycle') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const result = runWorkflowAutomationCycle('manual');
      sendJson(res, 200, result);
      return;
    }

    if (method === 'GET' && path === '/api/v1/workflows/automation/events') {
      const requestedLimit = Number(url.searchParams.get('limit') || 40);
      const limit = toSafeInteger(requestedLimit, 40, 1, 200);
      sendJson(res, 200, workflowAutomationEvents.slice(0, limit));
      return;
    }

    if (method === 'POST' && path === '/api/v1/workflows/automation/events/clear') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      workflowAutomationEvents.splice(0, workflowAutomationEvents.length);
      sendJson(res, 200, { cleared: true });
      return;
    }

    if (method === 'GET' && path === '/api/v1/leave/requests') {
      let items = [...leaveRequests];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'agent', 'type', 'status'],
        defaultSortBy: 'startDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/leave/requests') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager', 'agent'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateLeaveRequestCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees demande absence invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildLeaveRequestReference(),
        agent: validation.payload.agent,
        type: validation.payload.type,
        startDate: validation.payload.startDate,
        endDate: validation.payload.endDate,
        status: validation.payload.status,
      };
      leaveRequests.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/leave/balances') {
      let items = [...leaveBalances];
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyCollectionQuery(items, url, {
        searchFields: ['type'],
        defaultSortBy: 'type',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/leave/balances') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateLeaveBalanceCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees solde conge invalides', validation.errors);
        return;
      }

      const existing = findLeaveBalance(validation.payload.type);
      if (existing) {
        existing.allocated = validation.payload.allocated;
        existing.consumed = validation.payload.consumed;
        existing.remaining = validation.payload.remaining;
        sendJson(res, 200, existing);
        return;
      }

      const created = {
        type: validation.payload.type,
        allocated: validation.payload.allocated,
        consumed: validation.payload.consumed,
        remaining: validation.payload.remaining,
      };
      leaveBalances.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/leave/events') {
      const items = applyCollectionQuery([...leaveEvents], url, {
        searchFields: ['title', 'start', 'end', 'className'],
        defaultSortBy: 'start',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/leave/events') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateLeaveEventCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees evenement absence invalides', validation.errors);
        return;
      }

      const created = {
        title: validation.payload.title,
        start: validation.payload.start,
        end: validation.payload.end || undefined,
        className: validation.payload.className,
      };
      leaveEvents.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/organization/units') {
      let items = [...orgUnits];
      items = applyStringFilter(items, url, 'parentId', 'parentId');
      items = applyStringFilter(items, url, 'head', 'head');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'name', 'head', 'headTitle'],
        defaultSortBy: 'name',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/organization/units') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateOrgUnitCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees unite invalides', validation.errors);
        return;
      }

      const created = {
        id: buildOrgUnitId(validation.payload.name),
        name: validation.payload.name,
        parentId: validation.payload.parentId,
        head: validation.payload.head || undefined,
        headTitle: validation.payload.headTitle || undefined,
        staffCount: validation.payload.staffCount,
      };
      orgUnits.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'PUT' && path.startsWith('/api/v1/organization/units/')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const unitId = String(path.split('/').pop() || '').trim();
      const unit = findOrgUnit(unitId);
      if (!unit) {
        sendApiError(res, 404, 'ORG_UNIT_NOT_FOUND', 'Unite introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateOrgUnitUpdatePayload(body || {}, unit);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees unite invalides', validation.errors);
        return;
      }

      Object.assign(unit, {
        name: validation.payload.name,
        parentId: validation.payload.parentId,
        head: validation.payload.head || undefined,
        headTitle: validation.payload.headTitle || undefined,
        staffCount: validation.payload.staffCount,
      });

      sendJson(res, 200, unit);
      return;
    }

    if (method === 'GET' && path === '/api/v1/organization/positions/budgeted') {
      let items = [...budgetedPositions];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'structure', 'structure');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'structure', 'title', 'grade', 'status', 'holder'],
        defaultSortBy: 'code',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/organization/positions/budgeted') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateBudgetedPositionCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees poste budgetaire invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildBudgetedPositionCode(validation.payload.structure),
        structure: validation.payload.structure,
        title: validation.payload.title,
        grade: validation.payload.grade,
        status: validation.payload.status,
        holder: validation.payload.holder || '',
      };
      budgetedPositions.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/organization/positions/vacant') {
      let items = [...vacantPositions];
      items = applyStringFilter(items, url, 'priority', 'priority');
      items = applyStringFilter(items, url, 'structure', 'structure');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'structure', 'title', 'grade', 'priority'],
        defaultSortBy: 'openedOn',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/organization/positions/vacant') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateVacantPositionCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees poste vacant invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildVacantPositionCode(),
        structure: validation.payload.structure,
        title: validation.payload.title,
        grade: validation.payload.grade,
        openedOn: validation.payload.openedOn,
        priority: validation.payload.priority,
      };
      vacantPositions.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/applications') {
      let items = [...recruitmentApplications];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'campaign', 'campaign');
      items = applyStringFilter(items, url, 'position', 'position');
      items = applyStringFilter(items, url, 'source', 'source');
      items = applyRecruitmentReceivedOnRangeFilter(items, url);
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'candidate',
          'candidateEmail',
          'candidatePhone',
          'identityNumber',
          'position',
          'campaign',
          'source',
          'status',
        ],
        defaultSortBy: 'receivedOn',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/application-scores') {
      const includeStatuses = String(url.searchParams.get('includeStatuses') || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      let items = buildRecruitmentApplicationScores({
        campaign: url.searchParams.get('campaign') || '',
        position: url.searchParams.get('position') || '',
        includeStatuses: includeStatuses.length > 0 ? includeStatuses : undefined,
      });
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'candidate', 'position', 'campaign', 'status'],
        defaultSortBy: 'totalScore',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, {
        policyUpdatedAt: recruitmentScoringPolicy.updatedAt,
        criteria: recruitmentScoringPolicy.criteria,
        items,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/scoring-policy') {
      sendJson(res, 200, {
        ...recruitmentScoringPolicy,
      });
      return;
    }

    if (method === 'PUT' && path === '/api/v1/recruitment/scoring-policy') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentScoringPolicyUpdatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Politique scoring invalide', validation.errors);
        return;
      }

      recruitmentScoringPolicy.criteria = validation.payload.criteria;
      recruitmentScoringPolicy.updatedAt = validation.payload.updatedAt;
      recruitmentScoringPolicy.updatedBy = validation.payload.updatedBy;

      appendRecruitmentAuditLog({
        action: 'APPLICATION_STATUS_UPDATED',
        entityType: 'Application',
        entityId: 'SCORING-POLICY',
        actor: validation.payload.updatedBy,
        outcome: 'SUCCESS',
        detail: 'Mise a jour regles scoring candidat',
        createdAt: validation.payload.updatedAt,
      });
      sendJson(res, 200, {
        ...recruitmentScoringPolicy,
      });
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/shortlists/suggest') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const suggestion = buildRecruitmentShortlistSuggestions(body || {});
      const items = suggestion.suggested.map((entry) => {
        const validation = getRecruitmentShortlistValidation(entry.reference);
        return {
          ...entry,
          validationStatus: validation ? validation.decision : 'PENDING',
          validatedAt: validation?.validatedAt,
          validatedBy: validation?.validatedBy,
          validationNote: validation?.note,
        };
      });
      sendJson(res, 200, {
        ...suggestion,
        suggested: items,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/shortlists/validations') {
      let items = [...recruitmentShortlistValidations];
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'decision', 'validatedBy', 'note'],
        defaultSortBy: 'validatedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/shortlists/') && path.endsWith('/validate')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }
      const reference = String(rawReference || '').trim().toUpperCase();
      if (!reference) {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentShortlistValidationPayload(body || {}, reference, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Validation shortlist invalide', validation.errors);
        return;
      }

      const saved = upsertRecruitmentShortlistValidation(validation.payload);
      if (!saved) {
        sendApiError(res, 500, 'SHORTLIST_VALIDATION_SAVE_FAILED', 'Impossible de sauvegarder la validation shortlist');
        return;
      }
      appendRecruitmentAuditLog({
        action: 'APPLICATION_STATUS_UPDATED',
        entityType: 'Application',
        entityId: saved.reference,
        actor: saved.validatedBy,
        outcome: 'SUCCESS',
        detail: `Validation shortlist ${saved.decision}`,
        createdAt: saved.validatedAt,
      });
      sendJson(res, 200, saved);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/applications/duplicates') {
      let items = buildRecruitmentDuplicateCases();
      items = applyStringFilter(items, url, 'matchType', 'matchType');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'matchType', 'matchValue', 'matchLabel'],
        defaultSortBy: 'count',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/applications/duplicates/links') {
      let items = [...recruitmentDuplicateLinks];
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'primaryReference', 'secondaryReference', 'mode', 'reason', 'linkedBy'],
        defaultSortBy: 'linkedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/applications/duplicates/link') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentDuplicateLinkPayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Operation dedoublonnage invalide', validation.errors);
        return;
      }

      const resolved = resolveRecruitmentDuplicateLink(validation.payload);
      if (!resolved) {
        sendApiError(res, 404, 'RECRUITMENT_APPLICATION_NOT_FOUND', 'Candidature introuvable pour operation dedoublonnage');
        return;
      }

      appendRecruitmentAuditLog({
        action: 'APPLICATION_STATUS_UPDATED',
        entityType: 'Application',
        entityId: `${resolved.link.primaryReference}|${resolved.link.secondaryReference}`,
        actor: resolved.link.linkedBy,
        outcome: 'SUCCESS',
        detail: resolved.link.mode === 'merge'
          ? `Fusion profils ${resolved.link.secondaryReference} -> ${resolved.link.primaryReference}`
          : `Liaison profils ${resolved.link.primaryReference} <-> ${resolved.link.secondaryReference}`,
        createdAt: resolved.link.linkedAt,
      });

      sendJson(res, 200, resolved);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/interview-question-bank') {
      let items = listRecruitmentInterviewQuestionTemplates({
        position: url.searchParams.get('position') || '',
        q: url.searchParams.get('q') || '',
        latestOnly: url.searchParams.get('latestOnly') || url.searchParams.get('latest_only') || '',
      });
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'position', 'createdBy', 'questions'],
        defaultSortBy: 'updatedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/interview-question-bank') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentQuestionTemplatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Template questions entretien invalide', validation.errors);
        return;
      }
      recruitmentInterviewQuestionBank.push(validation.payload);
      sendJson(res, 201, validation.payload);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/interview-question-bank/import') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const format = normalizeText(body?.format || body?.type || 'json');
      let entries = [];
      if (format === 'csv') {
        entries = parseRecruitmentQuestionBankCsvRows(body?.content || body?.csv || '');
      } else {
        const rows = Array.isArray(body?.items)
          ? body.items
          : Array.isArray(body?.templates)
            ? body.templates
            : [];
        entries = rows.map((item) => ({
          position: String(item?.position || '').trim(),
          questions: normalizeRecruitmentQuestionList(item?.questions || item?.questionList || item?.content || []),
        }));
      }

      const created = [];
      const errors = [];
      entries.forEach((entry, index) => {
        const validation = validateRecruitmentQuestionTemplatePayload(entry, currentUser);
        if (validation.errors.length > 0) {
          errors.push(`Ligne ${index + 1}: ${validation.errors.join(', ')}`);
          return;
        }
        recruitmentInterviewQuestionBank.push(validation.payload);
        created.push(validation.payload);
      });

      if (created.length === 0 && errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Import questions entretien invalide', errors);
        return;
      }

      sendJson(res, 201, {
        importedCount: created.length,
        errors,
        items: created,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/interview-question-bank/export') {
      const format = normalizeText(url.searchParams.get('format') || 'json');
      const items = listRecruitmentInterviewQuestionTemplates({
        position: url.searchParams.get('position') || '',
        q: url.searchParams.get('q') || '',
        latestOnly: url.searchParams.get('latestOnly') || url.searchParams.get('latest_only') || '',
      });

      if (format === 'csv') {
        sendJson(res, 200, {
          format: 'csv',
          content: buildRecruitmentQuestionBankCsvExport(items),
          itemsCount: items.length,
          exportedAt: new Date().toISOString(),
        });
        return;
      }

      sendJson(res, 200, {
        format: 'json',
        content: JSON.stringify(items, null, 2),
        itemsCount: items.length,
        exportedAt: new Date().toISOString(),
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/notifications') {
      let items = buildRecruitmentNotificationsJournal();
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyStringFilter(items, url, 'severity', 'severity');
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'reference', 'reference');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'id',
          'type',
          'severity',
          'status',
          'channel',
          'recipient',
          'reference',
          'candidate',
          'campaign',
          'message',
          'trigger',
        ],
        defaultSortBy: 'sentAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/audit-logs') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      let items = [...recruitmentAuditLogs];
      items = applyStringFilter(items, url, 'action', 'action');
      items = applyStringFilter(items, url, 'actor', 'actor');
      items = applyStringFilter(items, url, 'entityType', 'entityType');
      items = applyStringFilter(items, url, 'outcome', 'outcome');
      items = applyStringFilter(items, url, 'reference', 'entityId');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'action', 'entityType', 'entityId', 'actor', 'outcome', 'detail'],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/applications') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentApplicationCreatePayload(body || {});
      if (validation.errors.length > 0) {
        const isDuplicate = validation.errors.some((entry) =>
          String(entry || '').toLowerCase().includes('doublon potentiel')
        );
        sendApiError(
          res,
          isDuplicate ? 409 : 400,
          isDuplicate ? 'RECRUITMENT_APPLICATION_DUPLICATE' : 'VALIDATION',
          isDuplicate ? 'Doublon candidature detecte' : 'Donnees candidature invalides',
          isDuplicate
            ? {
                errors: validation.errors,
                duplicateMatches: validation.payload.duplicateMatches || [],
              }
            : validation.errors
        );
        return;
      }

      const created = {
        reference: validation.payload.reference || buildRecruitmentApplicationReference(),
        candidate: validation.payload.candidate,
        candidateEmail: validation.payload.candidateEmail || undefined,
        candidatePhone: validation.payload.candidatePhone || undefined,
        identityNumber: validation.payload.identityNumber || undefined,
        position: validation.payload.position,
        campaign: validation.payload.campaign,
        source: validation.payload.source,
        status: validation.payload.status,
        receivedOn: validation.payload.receivedOn,
        experienceYears: validation.payload.experienceYears,
        skillsMatch: validation.payload.skillsMatch,
        educationLevel: validation.payload.educationLevel,
        interviewAverage: validation.payload.interviewAverage,
        testScore: validation.payload.testScore,
        statusHistory: buildRecruitmentInitialStatusHistory(
          validation.payload.status,
          validation.payload.receivedOn,
          String(currentUser?.username || 'system').trim() || 'system'
        ),
        comments: [],
        attachments: validation.payload.attachments,
      };
      recruitmentApplications.push(created);
      appendRecruitmentAuditLog({
        action: 'APPLICATION_CREATED',
        entityType: 'Application',
        entityId: created.reference,
        actor: String(currentUser?.username || 'system').trim() || 'system',
        outcome: 'SUCCESS',
        detail: `Creation candidature ${created.reference}`,
        createdAt: new Date().toISOString(),
      });
      sendJson(res, 201, created);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/applications/') && path.endsWith('/comments')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }

      const reference = String(rawReference || '').trim().toUpperCase();
      if (!reference) {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }

      const application = findRecruitmentApplication(reference);
      if (!application) {
        sendApiError(res, 404, 'RECRUITMENT_APPLICATION_NOT_FOUND', 'Candidature introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentApplicationCommentCreatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Commentaire candidature invalide', validation.errors);
        return;
      }

      application.comments = normalizeRecruitmentApplicationComments(application.comments, application.reference);
      application.comments.push({
        id: buildRecruitmentApplicationCommentId(application.reference, application.comments),
        author: validation.payload.author,
        message: validation.payload.message,
        createdAt: new Date().toISOString(),
      });
      appendRecruitmentAuditLog({
        action: 'APPLICATION_COMMENT_ADDED',
        entityType: 'Application',
        entityId: application.reference,
        actor: validation.payload.author,
        outcome: 'SUCCESS',
        detail: `Commentaire ajoute sur ${application.reference}`,
        createdAt: new Date().toISOString(),
      });

      sendJson(res, 201, application);
      return;
    }

    if (method === 'PUT' && path.startsWith('/api/v1/recruitment/applications/') && path.endsWith('/status')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }

      const reference = String(rawReference || '').trim().toUpperCase();
      if (!reference) {
        sendApiError(res, 400, 'RECRUITMENT_APPLICATION_REFERENCE_INVALID', 'Reference candidature invalide');
        return;
      }

      const application = findRecruitmentApplication(reference);
      if (!application) {
        sendApiError(res, 404, 'RECRUITMENT_APPLICATION_NOT_FOUND', 'Candidature introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentApplicationStatusUpdatePayload(body || {}, application, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Transition candidature invalide', validation.errors);
        return;
      }

      const previousStatus = application.status;
      application.status = validation.payload.status;
      application.statusHistory = normalizeRecruitmentStatusHistory(
        application.statusHistory,
        previousStatus,
        application.receivedOn
      );
      application.statusHistory.push({
        fromStatus: previousStatus,
        toStatus: validation.payload.status,
        changedAt: new Date().toISOString(),
        changedBy: validation.payload.changedBy,
        note: validation.payload.note || undefined,
      });
      appendRecruitmentAuditLog({
        action: 'APPLICATION_STATUS_UPDATED',
        entityType: 'Application',
        entityId: application.reference,
        actor: validation.payload.changedBy,
        outcome: 'SUCCESS',
        detail: `Transition ${previousStatus} -> ${validation.payload.status}`,
        createdAt: new Date().toISOString(),
      });

      sendJson(res, 200, application);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/campaigns') {
      let items = [...recruitmentCampaigns];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'department', 'department');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'title', 'department', 'status', 'needPosition', 'needOwner'],
        defaultSortBy: 'startDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/campaigns') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentCampaignCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees campagne invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildRecruitmentCampaignCode(validation.payload.department),
        title: validation.payload.title,
        department: validation.payload.department,
        openings: validation.payload.openings,
        startDate: validation.payload.startDate,
        endDate: validation.payload.endDate,
        needPosition: validation.payload.needPosition,
        needQuota: validation.payload.needQuota,
        needDeadline: validation.payload.needDeadline,
        needOwner: validation.payload.needOwner,
        status: validation.payload.status,
      };
      recruitmentCampaigns.push(created);
      appendRecruitmentAuditLog({
        action: 'CAMPAIGN_CREATED',
        entityType: 'Campaign',
        entityId: created.code,
        actor: String(currentUser?.username || validation.payload.needOwner || 'system').trim() || 'system',
        outcome: 'SUCCESS',
        detail: `Creation campagne ${created.code}`,
        createdAt: new Date().toISOString(),
      });
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/onboarding') {
      let items = recruitmentOnboarding.map((item) => normalizeRecruitmentOnboardingRecord(item));
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'agent',
          'position',
          'status',
          'templateId',
          'applicationReference',
          'blockedTasksCount',
          'escalatedTasksCount',
        ],
        defaultSortBy: 'startDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/onboarding') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateRecruitmentOnboardingCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees integration invalides', validation.errors);
        return;
      }

      const created = {
        agent: validation.payload.agent,
        position: validation.payload.position,
        startDate: validation.payload.startDate,
        checklist: validation.payload.checklist,
        checklistTasks: validation.payload.checklistTasks,
        progress: validation.payload.progress,
        templateId: validation.payload.templateId || undefined,
        history: validation.payload.history,
        blockedTasksCount: validation.payload.blockedTasksCount,
        escalatedTasksCount: validation.payload.escalatedTasksCount,
        status: validation.payload.status,
        applicationReference: validation.payload.applicationReference || undefined,
      };
      const normalizedCreated = normalizeRecruitmentOnboardingRecord(created);
      recruitmentOnboarding.push(normalizedCreated);
      appendRecruitmentAuditLog({
        action: 'ONBOARDING_CREATED',
        entityType: 'Onboarding',
        entityId: String(normalizedCreated.applicationReference || '').trim().toUpperCase()
          || `${normalizedCreated.agent}-${normalizedCreated.position}-${normalizedCreated.startDate}`,
        actor: String(currentUser?.username || 'rh.operations').trim() || 'rh.operations',
        outcome: 'SUCCESS',
        detail: `Creation parcours integration ${normalizedCreated.agent}`,
        createdAt: new Date().toISOString(),
      });
      sendJson(res, 201, normalizedCreated);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/interviews') {
      let items = recruitmentInterviewSchedules.map((item) => normalizeRecruitmentInterviewSchedule(item));
      items = applyStringFilter(items, url, 'applicationReference', 'applicationReference');
      items = applyStringFilter(items, url, 'campaign', 'campaign');
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'applicationReference', 'candidate', 'position', 'campaign', 'status', 'location'],
        defaultSortBy: 'slotStart',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/interviews') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentInterviewCreatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Planification entretien invalide', validation.errors);
        return;
      }
      const created = normalizeRecruitmentInterviewSchedule(validation.payload);
      recruitmentInterviewSchedules.push(created);
      appendRecruitmentAuditLog({
        action: 'APPLICATION_STATUS_UPDATED',
        entityType: 'Application',
        entityId: created.applicationReference,
        actor: String(currentUser?.username || 'system').trim() || 'system',
        outcome: 'SUCCESS',
        detail: `Planification entretien ${created.id}`,
        createdAt: new Date().toISOString(),
      });
      sendJson(res, 201, created);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/interviews/') && path.endsWith('/reschedule')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const segments = path.split('/');
      let interviewId = '';
      try {
        interviewId = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_INTERVIEW_ID_INVALID', 'Reference entretien invalide');
        return;
      }
      const interview = findRecruitmentInterview(interviewId);
      if (!interview) {
        sendApiError(res, 404, 'RECRUITMENT_INTERVIEW_NOT_FOUND', 'Entretien introuvable');
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentInterviewReschedulePayload(body || {}, interview, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Replanification entretien invalide', validation.errors);
        return;
      }
      interview.slotStart = validation.payload.slotStart;
      interview.slotEnd = validation.payload.slotEnd;
      interview.location = validation.payload.location;
      interview.interviewers = validation.payload.interviewers;
      interview.status = 'Replanifie';
      interview.history = normalizeRecruitmentInterviewHistory(interview.history || []);
      interview.history.unshift({
        type: 'Replanification',
        detail: validation.payload.reason,
        at: new Date().toISOString(),
        actor: validation.payload.actor,
      });
      sendJson(res, 200, normalizeRecruitmentInterviewSchedule(interview));
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/interviews/') && path.endsWith('/evaluations')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const segments = path.split('/');
      let interviewId = '';
      try {
        interviewId = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_INTERVIEW_ID_INVALID', 'Reference entretien invalide');
        return;
      }
      const interview = findRecruitmentInterview(interviewId);
      if (!interview) {
        sendApiError(res, 404, 'RECRUITMENT_INTERVIEW_NOT_FOUND', 'Entretien introuvable');
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentInterviewEvaluationPayload(body || {}, interview, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Evaluation entretien invalide', validation.errors);
        return;
      }
      interview.evaluations = normalizeRecruitmentInterviewEvaluations(interview.evaluations || []);
      const existingIndex = interview.evaluations.findIndex(
        (item) => String(item.interviewer || '').trim() === validation.payload.interviewer
      );
      if (existingIndex >= 0) {
        interview.evaluations[existingIndex] = validation.payload;
      } else {
        interview.evaluations.push(validation.payload);
      }
      interview.consolidation = buildRecruitmentInterviewConsolidation(interview.evaluations);
      if (interview.evaluations.length >= interview.interviewers.length) {
        interview.status = 'Termine';
      }
      appendRecruitmentAuditLog({
        action: 'APPLICATION_COMMENT_ADDED',
        entityType: 'Application',
        entityId: interview.applicationReference,
        actor: validation.payload.interviewer,
        outcome: 'SUCCESS',
        detail: `Evaluation entretien ${interview.id}`,
        createdAt: validation.payload.submittedAt,
      });
      sendJson(res, 201, normalizeRecruitmentInterviewSchedule(interview));
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/campaigns/workload-forecast') {
      const items = buildRecruitmentInterviewWorkloadForecast();
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        items,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/campaigns/budgets') {
      const items = buildRecruitmentCampaignBudgetAnalytics();
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        items,
      });
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/campaigns/budgets') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentCampaignBudgetPayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Budget campagne invalide', validation.errors);
        return;
      }
      const index = recruitmentCampaignBudgets.findIndex(
        (item) => item.campaignCode === validation.payload.campaignCode
      );
      if (index >= 0) {
        recruitmentCampaignBudgets[index] = validation.payload;
      } else {
        recruitmentCampaignBudgets.push(validation.payload);
      }
      sendJson(res, 201, validation.payload);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/onboarding/306090') {
      let items = buildRecruitmentOnboarding306090Milestones();
      items = applyCollectionQuery(items, url, {
        searchFields: ['applicationReference', 'agent', 'position', 'startDate'],
        defaultSortBy: 'startDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/onboarding/') && path.endsWith('/306090-feedback')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const segments = path.split('/');
      let reference = '';
      try {
        reference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_ONBOARDING_REFERENCE_INVALID', 'Reference onboarding invalide');
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentOnboardingMilestoneFeedbackPayload(body || {}, reference, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Feedback 30/60/90 invalide', validation.errors);
        return;
      }
      recruitmentOnboardingMilestoneFeedback.push(validation.payload);
      sendJson(res, 201, validation.payload);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/onboarding/success-scores') {
      const scores = buildRecruitmentOnboardingSuccessScores();
      const thresholds = {
        warning: 75,
        critical: 60,
      };
      sendJson(res, 200, {
        generatedAt: new Date().toISOString(),
        thresholds,
        items: scores,
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/onboarding/sync-logs') {
      let items = [...recruitmentOnboardingSyncLogs];
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'applicationReference', 'agent', 'position', 'status', 'detail'],
        defaultSortBy: 'syncedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/recruitment/onboarding/') && path.endsWith('/sync')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const segments = path.split('/');
      let reference = '';
      try {
        reference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'RECRUITMENT_ONBOARDING_REFERENCE_INVALID', 'Reference onboarding invalide');
        return;
      }
      const result = runRecruitmentOnboardingSync(reference, currentUser);
      if (result.error) {
        sendApiError(res, 404, 'RECRUITMENT_ONBOARDING_NOT_FOUND', result.error);
        return;
      }
      sendJson(res, 201, result.log);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/rules') {
      let items = [...recruitmentRuleEngineRules];
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'name', 'event', 'condition', 'action'],
        defaultSortBy: 'updatedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/rules') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const body = await readJsonBody(req);
      const validation = validateRecruitmentRulePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Regle recrutement invalide', validation.errors);
        return;
      }
      recruitmentRuleEngineRules.push(validation.payload);
      sendJson(res, 201, validation.payload);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/rules/simulate') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const body = await readJsonBody(req);
      const simulation = simulateRecruitmentRuleExecution(body || {});
      simulation.matches.forEach((match) => {
        appendRecruitmentRuleExecution({
          ruleId: match.ruleId,
          ruleName: match.ruleName,
          event: simulation.event,
          outcome: 'SIMULATED',
          detail: match.reason,
          executedAt: simulation.simulatedAt,
        });
      });
      sendJson(res, 200, simulation);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/rules/executions') {
      let items = [...recruitmentRuleExecutions];
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'ruleId', 'ruleName', 'event', 'outcome', 'detail'],
        defaultSortBy: 'executedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/control-tower') {
      const controlTower = buildRecruitmentControlTowerView({
        campaign: url.searchParams.get('campaign') || '',
        status: url.searchParams.get('status') || '',
        q: url.searchParams.get('q') || '',
      });
      sendJson(res, 200, controlTower);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/executive-dashboard') {
      const dashboard = buildRecruitmentExecutiveDashboard();
      sendJson(res, 200, dashboard);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/executive-dashboard/export') {
      const format = normalizeText(url.searchParams.get('format') || 'csv') === 'pdf' ? 'pdf' : 'csv';
      const dashboard = buildRecruitmentExecutiveDashboard();
      if (format === 'pdf') {
        sendJson(res, 200, {
          format: 'pdf',
          content: `EXECUTIVE DASHBOARD RECRUTEMENT\nGeneratedAt=${dashboard.generatedAt}\nTotal=${dashboard.kpis.totalApplications}\nRetained=${dashboard.kpis.retained}\nConversion=${dashboard.kpis.conversionInterviewToRetained}%`,
        });
        return;
      }
      const rows = ['campaignCode;campaignTitle;total;retained;rejected;conversion'];
      dashboard.byCampaign.forEach((entry) => {
        rows.push(`${entry.campaignCode};${entry.campaignTitle};${entry.total};${entry.retained};${entry.rejected};${entry.conversion}`);
      });
      sendJson(res, 200, {
        format: 'csv',
        content: rows.join('\n'),
      });
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/bi-export') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      const format = normalizeText(url.searchParams.get('format') || 'json') === 'csv' ? 'csv' : 'json';
      const payload = buildRecruitmentBiExportPayload();
      const recordsCount = Object.values(payload.datasets).reduce((sum, dataset) => {
        return sum + (Array.isArray(dataset) ? dataset.length : 0);
      }, 0);
      appendRecruitmentBiExportLog({
        requestedBy: String(currentUser?.username || 'system').trim() || 'system',
        format,
        records: recordsCount,
        status: 'SUCCESS',
      });
      if (format === 'csv') {
        const rows = ['dataset;records'];
        Object.entries(payload.datasets).forEach(([key, dataset]) => {
          rows.push(`${key};${Array.isArray(dataset) ? dataset.length : 0}`);
        });
        sendJson(res, 200, {
          format,
          exportedAt: payload.exportedAt,
          schemaVersion: payload.schemaVersion,
          content: rows.join('\n'),
        });
        return;
      }
      sendJson(res, 200, payload);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/bi-export/logs') {
      let items = [...recruitmentBiExportLogs];
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'requestedBy', 'format', 'status'],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/observability') {
      const snapshot = buildRecruitmentObservabilitySnapshot();
      sendJson(res, 200, snapshot);
      return;
    }

    if (method === 'POST' && path === '/api/v1/recruitment/observability/events') {
      const body = await readJsonBody(req);
      const severityRaw = normalizeText(body?.severity || 'info');
      const severity = severityRaw === 'critical' || severityRaw === 'critique'
        ? 'critical'
        : severityRaw === 'warning' || severityRaw === 'alerte'
          ? 'warning'
          : 'info';
      const event = {
        id: `REC-OBS-EVT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.toUpperCase(),
        source: String(body?.source || 'frontend').trim() || 'frontend',
        message: String(body?.message || 'event').trim() || 'event',
        severity,
        createdAt: new Date().toISOString(),
      };
      recruitmentObservabilityEvents.push(event);
      sendJson(res, 201, event);
      return;
    }

    if (method === 'GET' && path === '/api/v1/careers/movements') {
      let items = [...careerMovements];
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'agent', 'type', 'from', 'to', 'status'],
        defaultSortBy: 'effectiveDate',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/careers/movements') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateCareerMovementCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees mouvement carriere invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildCareerMovementReference(),
        agent: validation.payload.agent,
        type: validation.payload.type,
        from: validation.payload.from,
        to: validation.payload.to,
        effectiveDate: validation.payload.effectiveDate,
        status: validation.payload.status,
      };
      careerMovements.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/performance/campaigns') {
      let items = [...performanceCampaigns];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'population', 'population');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'title', 'period', 'population', 'status'],
        defaultSortBy: 'code',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/performance/campaigns') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validatePerformanceCampaignCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees campagne evaluation invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildPerformanceCampaignCode(),
        title: validation.payload.title,
        period: validation.payload.period,
        population: validation.payload.population,
        status: validation.payload.status,
      };
      performanceCampaigns.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/performance/results') {
      let items = [...performanceResults];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'direction', 'direction');
      items = applyCollectionQuery(items, url, {
        searchFields: ['agent', 'direction', 'status'],
        defaultSortBy: 'finalScore',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/performance/results') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validatePerformanceResultCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees resultat evaluation invalides', validation.errors);
        return;
      }

      if (validation.payload.existing) {
        validation.payload.existing.managerScore = validation.payload.managerScore;
        validation.payload.existing.selfScore = validation.payload.selfScore;
        validation.payload.existing.finalScore = validation.payload.finalScore;
        validation.payload.existing.status = validation.payload.status;
        sendJson(res, 200, validation.payload.existing);
        return;
      }

      const created = {
        agent: validation.payload.agent,
        direction: validation.payload.direction,
        managerScore: validation.payload.managerScore,
        selfScore: validation.payload.selfScore,
        finalScore: validation.payload.finalScore,
        status: validation.payload.status,
      };
      performanceResults.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/training/sessions') {
      let items = [...trainingSessions];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'location', 'location');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'title', 'dates', 'location', 'status'],
        defaultSortBy: 'code',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/training/sessions') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateTrainingSessionCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees session formation invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildTrainingSessionCode(),
        title: validation.payload.title,
        dates: validation.payload.dates,
        location: validation.payload.location,
        seats: validation.payload.seats,
        enrolled: validation.payload.enrolled,
        status: validation.payload.status,
      };
      trainingSessions.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/training/catalog') {
      let items = [...trainingCatalog];
      items = applyStringFilter(items, url, 'domain', 'domain');
      items = applyStringFilter(items, url, 'modality', 'modality');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'title', 'duration', 'modality', 'domain'],
        defaultSortBy: 'code',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/training/catalog') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateTrainingCourseCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees catalogue formation invalides', validation.errors);
        return;
      }

      const created = {
        code: validation.payload.code || buildTrainingCourseCode(),
        title: validation.payload.title,
        duration: validation.payload.duration,
        modality: validation.payload.modality,
        domain: validation.payload.domain,
      };
      trainingCatalog.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/training/requests') {
      let items = [...trainingEnrollmentRequests];
      const isAgentOnly = hasAnyRole(currentUser, ['agent']) && !hasAnyRole(currentUser, ['manager', 'hr_manager', 'super_admin']);
      if (isAgentOnly) {
        const currentUsername = String(currentUser.username || '').trim().toLowerCase();
        items = items.filter((item) => String(item.applicantUsername || '').trim().toLowerCase() === currentUsername);
      }

      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'sessionCode', 'sessionCode');
      items = applyStringFilter(items, url, 'applicantUsername', 'applicantUsername');
      items = applyStringFilter(items, url, 'applicant', 'applicantName');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'sessionCode',
          'sessionTitle',
          'sessionDates',
          'sessionLocation',
          'applicantName',
          'applicantUsername',
          'motivation',
          'status',
          'createdAt',
          'decidedBy',
          'decisionComment',
        ],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/training/requests') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager', 'agent'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateTrainingEnrollmentRequestCreatePayload(body || {}, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees demande formation invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildTrainingEnrollmentRequestReference(),
        sessionCode: validation.payload.sessionCode,
        sessionTitle: validation.payload.sessionTitle,
        sessionDates: validation.payload.sessionDates,
        sessionLocation: validation.payload.sessionLocation,
        applicantName: validation.payload.applicantName,
        applicantUsername: validation.payload.applicantUsername,
        motivation: validation.payload.motivation,
        status: validation.payload.status,
        createdAt: validation.payload.createdAt,
        decidedAt: '',
        decidedBy: '',
        decisionComment: '',
      };
      trainingEnrollmentRequests.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/training/requests/') && path.endsWith('/decision')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager', 'manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'TRAINING_REQUEST_INVALID', 'Reference demande formation invalide');
        return;
      }

      const reference = String(rawReference || '').trim().toUpperCase();
      if (!reference) {
        sendApiError(res, 400, 'TRAINING_REQUEST_INVALID', 'Reference demande formation invalide');
        return;
      }

      const requestIndex = findTrainingEnrollmentRequestIndex(reference);
      if (requestIndex < 0) {
        sendApiError(res, 404, 'TRAINING_REQUEST_NOT_FOUND', 'Demande formation introuvable');
        return;
      }

      const currentRequest = trainingEnrollmentRequests[requestIndex];
      const body = await readJsonBody(req);
      const validation = validateTrainingEnrollmentDecisionPayload(body || {}, currentRequest, currentUser);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Decision demande formation invalide', validation.errors);
        return;
      }

      const nextStatus = validation.payload.action === 'REJETER' ? 'Rejetee' : 'Validee';
      currentRequest.status = nextStatus;
      currentRequest.decidedAt = validation.payload.decidedAt;
      currentRequest.decidedBy = validation.payload.decidedBy;
      currentRequest.decisionComment = validation.payload.reason || '';

      if (nextStatus === 'Validee') {
        const session = findTrainingSession(currentRequest.sessionCode);
        if (session) {
          const seats = Number(session.seats || 0);
          const enrolled = Number(session.enrolled || 0);
          session.enrolled = Math.min(seats, Math.max(0, enrolled + 1));
          if (session.enrolled >= seats) {
            session.status = 'Complete';
          }
        }
      }

      sendJson(res, 200, currentRequest);
      return;
    }

    if (method === 'GET' && path === '/api/v1/discipline/cases') {
      let items = [...disciplineCases];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'agent', 'infraction', 'status', 'sanction'],
        defaultSortBy: 'openedOn',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/discipline/cases') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateDisciplineCaseCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees dossier disciplinaire invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildDisciplineCaseReference(),
        agent: validation.payload.agent,
        infraction: validation.payload.infraction,
        openedOn: validation.payload.openedOn,
        status: validation.payload.status,
        sanction: validation.payload.sanction || '',
      };
      disciplineCases.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/notifications/inbox') {
      const username = String(currentUser.username || '').trim().toLowerCase();
      let items = notificationInboxItems.filter((item) => String(item.recipientUsername || '').trim().toLowerCase() === username);
      const unreadOnly = normalizeText(url.searchParams.get('unreadOnly'));
      if (unreadOnly === 'true' || unreadOnly === '1' || unreadOnly === 'yes') {
        items = items.filter((item) => !item.isRead);
      }

      items = applyStringFilter(items, url, 'category', 'category');
      items = applyCollectionQuery(items, url, {
        searchFields: ['title', 'message', 'category', 'reference', 'createdAt'],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/notifications/inbox/') && path.endsWith('/read')) {
      const segments = path.split('/');
      let rawNotificationId = '';
      try {
        rawNotificationId = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'NOTIFICATION_ID_INVALID', 'Identifiant notification invalide');
        return;
      }

      const normalizedId = String(rawNotificationId || '').trim();
      const username = String(currentUser.username || '').trim().toLowerCase();
      const index = notificationInboxItems.findIndex((item) => String(item.id || '').trim() === normalizedId);
      if (index < 0) {
        sendApiError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notification introuvable');
        return;
      }

      const currentNotification = notificationInboxItems[index];
      if (String(currentNotification.recipientUsername || '').trim().toLowerCase() !== username) {
        sendApiError(res, 403, 'NOTIFICATION_FORBIDDEN', 'Notification non attribuee a cet utilisateur');
        return;
      }

      if (!currentNotification.isRead) {
        currentNotification.isRead = true;
        currentNotification.readAt = new Date().toISOString();
      }
      sendJson(res, 200, currentNotification);
      return;
    }

    if (method === 'GET' && path === '/api/v1/notifications/delivery-jobs') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      let items = [...notificationDeliveryJobs];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'recipientUsername', 'recipientUsername');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'recipientUsername', 'title', 'message', 'category', 'reference', 'status', 'lastError'],
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/notifications/process') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }
      processNotificationDeliveries();
      sendJson(res, 200, { processedAt: new Date().toISOString(), jobs: notificationDeliveryJobs.length });
      return;
    }

    if (method === 'GET' && routePath === '/api/v1/documents/audit-logs') {
      let items = [...documentAuditLogs];
      items = applyStringFilter(items, url, 'reference', 'reference');
      items = applyStringFilter(items, url, 'action', 'action');
      items = applyStringFilter(items, url, 'actor', 'actor');
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'action', 'actor', 'detail', 'statusBefore', 'statusAfter', 'happenedAt'],
        defaultSortBy: 'happenedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'GET' && routePath === '/api/v1/documents/analytics') {
      const report = computeDocumentAnalytics();
      sendJson(res, 200, report);
      return;
    }

    if (method === 'GET' && routePath === '/api/v1/documents/overdue') {
      let items = listDocumentOverdueItems();
      items = applyStringFilter(items, url, 'recipientUsername', 'recipientUsername');
      items = applyStringFilter(items, url, 'deliveryStatus', 'deliveryStatus');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'title',
          'type',
          'status',
          'deliveryStatus',
          'recipientUsername',
          'assignedEmployeeName',
          'verificationCode',
        ],
        defaultSortBy: 'overdueHours',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && routePath === '/api/v1/documents/archive-run') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const actorUsername = String(currentUser.username || '').trim().toLowerCase();
      const outcome = runDocumentArchiveCycle(body || {}, actorUsername);
      if (outcome.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees archivage invalides', outcome.errors);
        return;
      }

      sendJson(res, 200, outcome.result);
      return;
    }

    if (method === 'POST' && routePath === '/api/v1/documents/purge-archives') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const actorUsername = String(currentUser.username || '').trim().toLowerCase();
      const outcome = runDocumentArchivePurge(body || {}, actorUsername);
      if (outcome.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees purge invalides', outcome.errors);
        return;
      }

      sendJson(res, 200, outcome.result);
      return;
    }

    if (method === 'GET' && path === '/api/v1/documents/inbox') {
      const username = String(currentUser.username || '').trim().toLowerCase();
      let items = documentDispatches
        .filter((dispatch) => String(dispatch.recipientUsername || '').trim().toLowerCase() === username)
        .map((dispatch) => findLibraryDocument(dispatch.reference))
        .filter((item) => !!item)
        .map((item) => toDispatchedDocument(item));

      items = applyStringFilter(items, url, 'deliveryStatus', 'deliveryStatus');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'title',
          'type',
          'employeeName',
          'employeeId',
          'assignedEmployeeName',
          'assignedEmployeeId',
          'recipientUsername',
          'deliveryStatus',
          'assignedAt',
          'assignedBy',
          'assignmentDueAt',
          'reminderAt',
          'signedBy',
          'verificationCode',
        ],
        defaultSortBy: 'assignedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/documents/inbox/') && path.endsWith('/read')) {
      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'DOCUMENT_REFERENCE_INVALID', 'Reference document invalide');
        return;
      }

      const dispatchIndex = findDocumentDispatchIndex(rawReference);
      if (dispatchIndex < 0) {
        sendApiError(res, 404, 'DOCUMENT_DISPATCH_NOT_FOUND', 'Document assigne introuvable');
        return;
      }

      const dispatch = documentDispatches[dispatchIndex];
      const expectedRecipient = String(dispatch.recipientUsername || '').trim().toLowerCase();
      const currentUsername = String(currentUser.username || '').trim().toLowerCase();
      if (!expectedRecipient || expectedRecipient !== currentUsername) {
        sendApiError(res, 403, 'DOCUMENT_DISPATCH_FORBIDDEN', 'Document non attribue a cet employe');
        return;
      }

      const currentDocument = findLibraryDocument(rawReference);
      if (!currentDocument) {
        sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
        return;
      }

      const nowIso = new Date().toISOString();
      const previousDeliveryStatus = normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne');
      if (normalizeText(dispatch.deliveryStatus || '') === 'assigne') {
        dispatch.deliveryStatus = 'Lu';
        dispatch.readAt = nowIso;
        addDocumentAuditLog({
          reference: currentDocument.reference,
          action: DOCUMENT_AUDIT_ACTIONS.READ,
          actor: currentUsername,
          statusBefore: previousDeliveryStatus,
          statusAfter: 'Lu',
          detail: 'Document marque comme lu par le destinataire',
          metadata: {
            recipientUsername: expectedRecipient,
          },
        });

        const managerUsername = String(dispatch.assignedBy || '').trim().toLowerCase();
        if (managerUsername && managerUsername !== currentUsername) {
          queueDocumentNotification({
            recipientUsername: managerUsername,
            title: `Document lu: ${currentDocument.reference}`,
            message: `${expectedRecipient} a marque le document ${currentDocument.reference} comme lu.`,
            category: 'Document',
            reference: currentDocument.reference,
            metadata: {
              action: 'READ',
              recipientUsername: expectedRecipient,
            },
          });
        }
      }

      sendJson(res, 200, toDispatchedDocument(currentDocument));
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/documents/inbox/') && path.endsWith('/acknowledge')) {
      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'DOCUMENT_REFERENCE_INVALID', 'Reference document invalide');
        return;
      }

      const dispatchIndex = findDocumentDispatchIndex(rawReference);
      if (dispatchIndex < 0) {
        sendApiError(res, 404, 'DOCUMENT_DISPATCH_NOT_FOUND', 'Document assigne introuvable');
        return;
      }

      const dispatch = documentDispatches[dispatchIndex];
      const expectedRecipient = String(dispatch.recipientUsername || '').trim().toLowerCase();
      const currentUsername = String(currentUser.username || '').trim().toLowerCase();
      if (!expectedRecipient || expectedRecipient !== currentUsername) {
        sendApiError(res, 403, 'DOCUMENT_DISPATCH_FORBIDDEN', 'Document non attribue a cet employe');
        return;
      }

      const currentDocument = findLibraryDocument(rawReference);
      if (!currentDocument) {
        sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateDocumentAcknowledgePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees accuse reception invalides', validation.errors);
        return;
      }

      const nowIso = new Date().toISOString();
      const previousDeliveryStatus = normalizeDocumentDeliveryStatus(dispatch.deliveryStatus || 'Assigne');
      dispatch.deliveryStatus = 'Accuse reception';
      if (!dispatch.readAt) {
        dispatch.readAt = nowIso;
      }
      dispatch.acknowledgedAt = nowIso;
      dispatch.acknowledgedBy = currentUsername;
      if (validation.payload.note) {
        dispatch.note = validation.payload.note;
      }

      addDocumentAuditLog({
        reference: currentDocument.reference,
        action: DOCUMENT_AUDIT_ACTIONS.ACKNOWLEDGED,
        actor: currentUsername,
        statusBefore: previousDeliveryStatus,
        statusAfter: 'Accuse reception',
        detail: 'Accuse de reception confirme par le destinataire',
        metadata: {
          recipientUsername: expectedRecipient,
        },
      });

      const managerUsername = String(dispatch.assignedBy || '').trim().toLowerCase();
      if (managerUsername && managerUsername !== currentUsername) {
        queueDocumentNotification({
          recipientUsername: managerUsername,
          title: `Accuse reception: ${currentDocument.reference}`,
          message: `${expectedRecipient} a confirme la reception du document ${currentDocument.reference}.`,
          category: 'Document',
          reference: currentDocument.reference,
          metadata: {
            action: 'ACKNOWLEDGE',
            recipientUsername: expectedRecipient,
          },
        });
      }

      sendJson(res, 200, toDispatchedDocument(currentDocument));
      return;
    }

    if (method === 'GET' && path === '/api/v1/documents/library') {
      let items = documentsLibrary.map((item) => toDispatchedDocument(item));
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'type', 'type');
      items = applyStringFilter(items, url, 'owner', 'owner');
      items = applyStringFilter(items, url, 'deliveryStatus', 'deliveryStatus');
      items = applyCollectionQuery(items, url, {
        searchFields: [
          'reference',
          'title',
          'type',
          'owner',
          'status',
          'employeeName',
          'employeeId',
          'direction',
          'unit',
          'issuedAt',
          'startDate',
          'endDate',
          'approver',
          'missionDestination',
          'missionPurpose',
          'absenceReason',
          'notes',
          'assignedEmployeeName',
          'assignedEmployeeId',
          'recipientUsername',
          'deliveryStatus',
          'assignedAt',
          'assignedBy',
          'assignmentDueAt',
          'reminderAt',
          'signedAt',
          'signedBy',
          'stampLabel',
          'verificationCode',
        ],
        defaultSortBy: 'updatedAt',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/documents/library') {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateLibraryDocumentCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees document invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildLibraryDocumentReference(),
        title: validation.payload.title,
        type: validation.payload.type,
        owner: validation.payload.owner,
        updatedAt: validation.payload.updatedAt,
        status: validation.payload.status,
        employeeName: validation.payload.employeeName,
        employeeId: validation.payload.employeeId,
        direction: validation.payload.direction,
        unit: validation.payload.unit,
        issuedAt: validation.payload.issuedAt,
        startDate: validation.payload.startDate,
        endDate: validation.payload.endDate,
        approver: validation.payload.approver,
        missionDestination: validation.payload.missionDestination,
        missionPurpose: validation.payload.missionPurpose,
        absenceReason: validation.payload.absenceReason,
        notes: validation.payload.notes,
        signedAt: '',
        signedBy: '',
        stampLabel: '',
        signatureHash: '',
        verificationCode: '',
      };
      documentsLibrary.push(created);
      addDocumentAuditLog({
        reference: created.reference,
        action: DOCUMENT_AUDIT_ACTIONS.CREATED,
        actor: String(currentUser.username || '').trim().toLowerCase(),
        statusAfter: created.status,
        detail: `Document cree (${created.type})`,
        metadata: {
          owner: created.owner,
          employeeId: created.employeeId || '',
        },
      });
      sendJson(res, 201, toDispatchedDocument(created));
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/documents/library/') && path.endsWith('/sign')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'DOCUMENT_REFERENCE_INVALID', 'Reference document invalide');
        return;
      }

      const documentIndex = findLibraryDocumentIndex(rawReference);
      if (documentIndex === -1) {
        sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
        return;
      }

      const currentDocument = documentsLibrary[documentIndex];
      const body = await readJsonBody(req);
      const validation = validateDocumentSignPayload(body || {}, currentDocument);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees signature invalides', validation.errors);
        return;
      }

      const actorUsername = String(currentUser.username || '').trim().toLowerCase();
      const nowIso = new Date().toISOString();
      const signatory = validation.payload.signatoryName || actorUsername;
      currentDocument.signedAt = nowIso;
      currentDocument.signedBy = signatory;
      currentDocument.stampLabel = validation.payload.stampLabel;
      currentDocument.signatureHash = computeDocumentSignatureHash(currentDocument, signatory, nowIso);
      currentDocument.verificationCode = buildDocumentVerificationCode(currentDocument.reference, nowIso);
      currentDocument.updatedAt = nowIso;

      addDocumentAuditLog({
        reference: currentDocument.reference,
        action: DOCUMENT_AUDIT_ACTIONS.SIGNED,
        actor: actorUsername,
        statusBefore: currentDocument.status,
        statusAfter: currentDocument.status,
        detail: 'Document signe et cachete',
        metadata: {
          signedBy: currentDocument.signedBy,
          verificationCode: currentDocument.verificationCode,
        },
      });

      const currentDispatch = findDocumentDispatch(currentDocument.reference);
      if (currentDispatch && currentDispatch.recipientUsername) {
        queueDocumentNotification({
          recipientUsername: String(currentDispatch.recipientUsername || '').trim().toLowerCase(),
          title: `Document signe: ${currentDocument.reference}`,
          message: `Le document ${currentDocument.reference} a ete signe et cachete. Vous pouvez le consulter dans votre espace agent.`,
          category: 'Document',
          reference: currentDocument.reference,
          metadata: {
            action: 'SIGN',
            signedBy: currentDocument.signedBy,
          },
        });
      }

      sendJson(res, 200, toDispatchedDocument(currentDocument));
      return;
    }

    if (method === 'POST' && path.startsWith('/api/v1/documents/library/') && path.endsWith('/assign')) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 2] || '');
      } catch {
        sendApiError(res, 400, 'DOCUMENT_REFERENCE_INVALID', 'Reference document invalide');
        return;
      }

      const documentIndex = findLibraryDocumentIndex(rawReference);
      if (documentIndex === -1) {
        sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
        return;
      }

      const currentDocument = documentsLibrary[documentIndex];
      const body = await readJsonBody(req);
      const validation = validateDocumentAssignPayload(body || {}, currentDocument);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees assignation invalides', validation.errors);
        return;
      }

      const nowIso = new Date().toISOString();
      const actorUsername = String(currentUser.username || '').trim().toLowerCase();
      const previousStatus = normalizeDocumentStatus(currentDocument.status, 'Brouillon');
      const existingDispatchIndex = findDocumentDispatchIndex(currentDocument.reference);
      const previousDispatch = existingDispatchIndex >= 0 ? documentDispatches[existingDispatchIndex] : null;
      const previousDeliveryStatus = previousDispatch
        ? normalizeDocumentDeliveryStatus(previousDispatch.deliveryStatus || 'Assigne')
        : 'Non assigne';
      const previousRecipientUsername = String(previousDispatch?.recipientUsername || '').trim().toLowerCase();
      const dispatch = {
        reference: currentDocument.reference,
        employeeId: validation.payload.employeeId,
        employeeName: validation.payload.employeeName,
        recipientUsername: validation.payload.recipientUsername,
        note: validation.payload.note,
        deliveryStatus: 'Assigne',
        assignedAt: nowIso,
        assignedBy: actorUsername,
        assignmentDueAt: validation.payload.assignmentDueAt,
        reminderAt: validation.payload.reminderAt,
        reminderSentAt: '',
        readAt: '',
        acknowledgedAt: '',
        acknowledgedBy: '',
      };

      if (existingDispatchIndex >= 0) {
        documentDispatches[existingDispatchIndex] = dispatch;
      } else {
        documentDispatches.push(dispatch);
      }

      if (previousStatus === 'Valide' && isValidDocumentStatusTransition(previousStatus, 'Publie')) {
        currentDocument.status = 'Publie';
      }
      currentDocument.updatedAt = nowIso;

      if (currentDocument.status !== previousStatus) {
        addDocumentAuditLog({
          reference: currentDocument.reference,
          action: DOCUMENT_AUDIT_ACTIONS.STATUS_CHANGED,
          actor: actorUsername,
          statusBefore: previousStatus,
          statusAfter: currentDocument.status,
          detail: `Transition automatique ${previousStatus} -> ${currentDocument.status} lors de l assignation`,
        });
      }

      addDocumentAuditLog({
        reference: currentDocument.reference,
        action: DOCUMENT_AUDIT_ACTIONS.ASSIGNED,
        actor: actorUsername,
        statusBefore: previousDeliveryStatus,
        statusAfter: 'Assigne',
        detail: 'Document assigne a un employe',
        metadata: {
          employeeId: validation.payload.employeeId,
          employeeName: validation.payload.employeeName,
          recipientUsername: validation.payload.recipientUsername,
          forceReassign: validation.payload.forceReassign ? 'true' : 'false',
          assignmentDueAt: validation.payload.assignmentDueAt,
          reminderAt: validation.payload.reminderAt,
        },
      });

      if (
        validation.payload.forceReassign &&
        previousRecipientUsername &&
        previousRecipientUsername !== validation.payload.recipientUsername
      ) {
        queueDocumentNotification({
          recipientUsername: previousRecipientUsername,
          title: `Reaffectation document: ${currentDocument.reference}`,
          message: `Le document ${currentDocument.reference} a ete reaffecte a un autre employe.`,
          category: 'Document',
          reference: currentDocument.reference,
          metadata: {
            action: 'REASSIGN',
          },
        });
      }

      queueDocumentNotification({
        recipientUsername: validation.payload.recipientUsername,
        title: `Nouveau document assigne: ${currentDocument.reference}`,
        message: `Le document ${currentDocument.reference} vous a ete assigne. Date limite: ${validation.payload.assignmentDueAt || 'non definie'}.`,
        category: 'Document',
        reference: currentDocument.reference,
        metadata: {
          action: 'ASSIGN',
          assignedBy: actorUsername,
          assignmentDueAt: validation.payload.assignmentDueAt,
        },
      });

      sendJson(res, 200, toDispatchedDocument(currentDocument));
      return;
    }

    if (
      method === 'PUT' &&
      path.startsWith('/api/v1/documents/library/') &&
      !path.endsWith('/assign')
    ) {
      if (!ensureRoles(res, currentUser, ['super_admin', 'hr_manager'])) {
        return;
      }

      const segments = path.split('/');
      let rawReference = '';
      try {
        rawReference = decodeURIComponent(segments[segments.length - 1] || '');
      } catch {
        sendApiError(res, 400, 'DOCUMENT_REFERENCE_INVALID', 'Reference document invalide');
        return;
      }
      const index = findLibraryDocumentIndex(rawReference);
      if (index === -1) {
        sendApiError(res, 404, 'DOCUMENT_NOT_FOUND', 'Document introuvable');
        return;
      }

      const body = await readJsonBody(req);
      const currentDocument = documentsLibrary[index];
      const validation = validateLibraryDocumentUpdatePayload(body || {}, currentDocument);
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees document invalides', validation.errors);
        return;
      }

      const actorUsername = String(currentUser.username || '').trim().toLowerCase();
      const previousStatus = normalizeDocumentStatus(currentDocument.status, 'Brouillon');
      Object.assign(currentDocument, {
        title: validation.payload.title,
        type: validation.payload.type,
        owner: validation.payload.owner,
        updatedAt: validation.payload.updatedAt,
        status: validation.payload.status,
        employeeName: validation.payload.employeeName,
        employeeId: validation.payload.employeeId,
        direction: validation.payload.direction,
        unit: validation.payload.unit,
        issuedAt: validation.payload.issuedAt,
        startDate: validation.payload.startDate,
        endDate: validation.payload.endDate,
        approver: validation.payload.approver,
        missionDestination: validation.payload.missionDestination,
        missionPurpose: validation.payload.missionPurpose,
        absenceReason: validation.payload.absenceReason,
        notes: validation.payload.notes,
      });

      const nextStatus = normalizeDocumentStatus(currentDocument.status, 'Brouillon');
      const isStatusTransition = previousStatus !== nextStatus;
      addDocumentAuditLog({
        reference: currentDocument.reference,
        action: isStatusTransition ? DOCUMENT_AUDIT_ACTIONS.STATUS_CHANGED : DOCUMENT_AUDIT_ACTIONS.UPDATED,
        actor: actorUsername,
        statusBefore: previousStatus,
        statusAfter: nextStatus,
        detail: isStatusTransition
          ? `Transition manuelle ${previousStatus} -> ${nextStatus}`
          : 'Mise a jour des metadonnees du document',
      });

      sendJson(res, 200, toDispatchedDocument(currentDocument));
      return;
    }

    if (method === 'GET' && path === '/api/v1/admin/users') {
      if (!ensureRoles(res, currentUser, ['super_admin'])) {
        return;
      }

      let items = [...adminUsers];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'role', 'role');
      items = applyStringFilter(items, url, 'direction', 'direction');
      items = applyCollectionQuery(items, url, {
        searchFields: ['username', 'fullName', 'role', 'direction', 'status'],
        defaultSortBy: 'username',
        defaultSortOrder: 'asc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/admin/users') {
      if (!ensureRoles(res, currentUser, ['super_admin'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateAdminUserCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees utilisateur invalides', validation.errors);
        return;
      }

      const created = {
        username: validation.payload.username,
        fullName: validation.payload.fullName,
        role: validation.payload.role,
        direction: validation.payload.direction,
        status: validation.payload.status,
      };
      adminUsers.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/admin/roles') {
      if (!ensureRoles(res, currentUser, ['super_admin'])) {
        return;
      }

      const items = applyCollectionQuery([...adminRoles], url, {
        searchFields: ['name', 'description'],
        defaultSortBy: 'permissions',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    if (method === 'POST' && path === '/api/v1/admin/roles') {
      if (!ensureRoles(res, currentUser, ['super_admin'])) {
        return;
      }

      const body = await readJsonBody(req);
      const validation = validateAdminRoleCreatePayload(body || {});
      if (validation.errors.length > 0) {
        sendApiError(res, 400, 'VALIDATION', 'Donnees role invalides', validation.errors);
        return;
      }

      const created = {
        name: validation.payload.name,
        description: validation.payload.description,
        permissions: validation.payload.permissions,
      };
      adminRoles.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/admin/audit-logs') {
      if (!ensureRoles(res, currentUser, ['super_admin'])) {
        return;
      }

      let items = [...adminAuditLogs];
      items = applyStringFilter(items, url, 'user', 'user');
      items = applyStringFilter(items, url, 'action', 'action');
      items = applyCollectionQuery(items, url, {
        searchFields: ['date', 'user', 'action', 'target'],
        defaultSortBy: 'date',
        defaultSortOrder: 'desc',
      });
      sendJson(res, 200, items);
      return;
    }

    sendApiError(res, 404, 'ENDPOINT_NOT_IMPLEMENTED', `Endpoint non implemente: ${method} ${path}`);
  } catch (error) {
    sendApiError(
      res,
      500,
      'INTERNAL_ERROR',
      'Erreur mock backend',
      error instanceof Error ? error.message : String(error)
    );
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[mock-api] listening on http://${HOST}:${PORT}`);
});
