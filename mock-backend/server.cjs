const http = require('http');
const fs = require('fs');
const pathModule = require('path');
const { createHash } = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.MOCK_API_PORT || 8080);
const HOST = process.env.MOCK_API_HOST || '0.0.0.0';
const ACCESS_TOKEN_TTL_MS = Number(process.env.MOCK_ACCESS_TOKEN_TTL_MS || 30 * 60 * 1000);
const REFRESH_TOKEN_TTL_MS = Number(process.env.MOCK_REFRESH_TOKEN_TTL_MS || 24 * 60 * 60 * 1000);
const MAX_UPLOAD_BYTES = Number(process.env.MOCK_MAX_UPLOAD_BYTES || 15 * 1024 * 1024);
const PERSONNEL_UPLOAD_DIR = pathModule.join(__dirname, 'uploads');
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
    photoUrl: './assets/images/faces/profile.jpg',
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
    photoUrl: './assets/images/faces/profile.jpg',
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
    position: 'Analyste Recrutement',
    campaign: 'CMP-RECRUT-Q2',
    status: 'Shortlist',
    receivedOn: '2026-03-12',
  },
  {
    reference: 'APP-2026-002',
    candidate: 'Sekou Keita',
    position: 'Gestionnaire Paie',
    campaign: 'CMP-PAIE-Q2',
    status: 'Entretien',
    receivedOn: '2026-03-10',
  },
  {
    reference: 'APP-2026-003',
    candidate: 'Mariama Camara',
    position: 'Assistant RH',
    campaign: 'CMP-RH-Q1',
    status: 'Rejete',
    receivedOn: '2026-03-05',
  },
  {
    reference: 'APP-2026-004',
    candidate: 'Oumar Bah',
    position: 'Gestionnaire Paie',
    campaign: 'CMP-PAIE-Q2',
    status: 'Nouveau',
    receivedOn: '2026-03-20',
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
    status: 'Cloturee',
  },
  {
    code: 'CMP-PAIE-Q2',
    title: 'Renfort Paie T2',
    department: 'Service Paie',
    openings: 3,
    startDate: '2026-03-01',
    endDate: '2026-05-15',
    status: 'Active',
  },
  {
    code: 'CMP-RECRUT-Q2',
    title: 'Renfort Recrutement T2',
    department: 'Service Recrutement',
    openings: 2,
    startDate: '2026-03-15',
    endDate: '2026-05-30',
    status: 'Active',
  },
];

const recruitmentOnboarding = [
  {
    agent: 'Aissatou Diallo',
    position: 'Analyste Recrutement',
    startDate: '2026-04-02',
    checklist: ['Contrat signe', 'Badge cree', 'Compte SI active'],
    status: 'En cours',
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

function validateRecruitmentApplicationCreatePayload(body) {
  const errors = [];

  const reference = String(body.reference || body.requestRef || body.request_ref || '').trim().toUpperCase();
  const candidate = String(body.candidate || body.candidateName || body.candidate_name || '').trim();
  const position = String(body.position || body.positionTitle || body.position_title || '').trim();
  const campaign = String(body.campaign || body.campaignTitle || body.campaign_title || '').trim().toUpperCase();
  const statusRaw = normalizeText(body.status || 'nouveau');
  let status = 'Nouveau';
  if (statusRaw === 'shortlist') status = 'Shortlist';
  else if (statusRaw === 'entretien') status = 'Entretien';
  else if (statusRaw === 'accepte' || statusRaw === 'accepté') status = 'Accepte';
  else if (statusRaw === 'rejete' || statusRaw === 'rejeté') status = 'Rejete';
  const receivedOn = String(body.receivedOn || body.received_on || '').trim();

  if (reference && !/^[A-Z0-9-]{3,40}$/.test(reference)) {
    errors.push('Reference candidature invalide');
  }
  if (reference && findRecruitmentApplication(reference)) {
    errors.push('Reference candidature deja existante');
  }
  if (candidate.length < 2) {
    errors.push('Nom candidat requis');
  }
  if (position.length < 2) {
    errors.push('Poste requis');
  }
  if (campaign.length < 3) {
    errors.push('Campagne requise');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(receivedOn) || Number.isNaN(Date.parse(receivedOn))) {
    errors.push('Date reception invalide');
  }

  return {
    errors,
    payload: {
      reference: reference || null,
      candidate,
      position,
      campaign,
      status,
      receivedOn,
    },
  };
}

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

  return {
    errors,
    payload: {
      code: code || null,
      title,
      department,
      openings,
      startDate,
      endDate,
      status,
    },
  };
}

function findRecruitmentOnboarding(agent, position, startDate) {
  return recruitmentOnboarding.find(
    (item) =>
      normalizeText(item.agent) === normalizeText(agent) &&
      normalizeText(item.position) === normalizeText(position) &&
      String(item.startDate || '') === String(startDate || '')
  );
}

function validateRecruitmentOnboardingCreatePayload(body) {
  const errors = [];

  const agent = String(body.agent || body.agentName || body.agent_name || '').trim();
  const position = String(body.position || body.positionTitle || body.position_title || '').trim();
  const startDate = String(body.startDate || body.start_date || '').trim();
  const checklistSource = Array.isArray(body.checklist)
    ? body.checklist
    : Array.isArray(body.tasks)
      ? body.tasks
      : [];
  const checklist = checklistSource
    .map((item) => String(item || '').trim())
    .filter((item) => item.length > 0);

  const statusRaw = normalizeText(body.status || 'planifie');
  let status = 'Planifie';
  if (statusRaw === 'en cours' || statusRaw === 'en_cours') status = 'En cours';
  else if (statusRaw === 'termine') status = 'Termine';
  else if (statusRaw === 'valide') status = 'Valide';

  if (agent.length < 2) {
    errors.push('Agent requis');
  }
  if (position.length < 2) {
    errors.push('Poste requis');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || Number.isNaN(Date.parse(startDate))) {
    errors.push('Date debut integration invalide');
  }
  if (checklist.some((item) => item.length > 160)) {
    errors.push('Checklist contient une etape trop longue');
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
      status,
    },
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
  if (matricule && agents.some((agent) => normalizeText(agent.matricule) === normalizeText(matricule))) {
    errors.push('Matricule deja existant');
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
      res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': stats.size,
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
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
        position: a.position,
        status: a.status,
        manager: a.manager,
      }));
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'direction', 'direction');
      items = applyCollectionQuery(items, url, {
        searchFields: ['id', 'matricule', 'fullName', 'direction', 'position', 'status', 'manager'],
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

      sendJson(res, 200, agent);
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
      items = applyCollectionQuery(items, url, {
        searchFields: ['reference', 'candidate', 'position', 'campaign', 'status'],
        defaultSortBy: 'receivedOn',
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
        sendApiError(res, 400, 'VALIDATION', 'Donnees candidature invalides', validation.errors);
        return;
      }

      const created = {
        reference: validation.payload.reference || buildRecruitmentApplicationReference(),
        candidate: validation.payload.candidate,
        position: validation.payload.position,
        campaign: validation.payload.campaign,
        status: validation.payload.status,
        receivedOn: validation.payload.receivedOn,
      };
      recruitmentApplications.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/campaigns') {
      let items = [...recruitmentCampaigns];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'department', 'department');
      items = applyCollectionQuery(items, url, {
        searchFields: ['code', 'title', 'department', 'status'],
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
        status: validation.payload.status,
      };
      recruitmentCampaigns.push(created);
      sendJson(res, 201, created);
      return;
    }

    if (method === 'GET' && path === '/api/v1/recruitment/onboarding') {
      let items = [...recruitmentOnboarding];
      items = applyStringFilter(items, url, 'status', 'status');
      items = applyStringFilter(items, url, 'agent', 'agent');
      items = applyCollectionQuery(items, url, {
        searchFields: ['agent', 'position', 'status'],
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
        status: validation.payload.status,
      };
      recruitmentOnboarding.push(created);
      sendJson(res, 201, created);
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
