import { Routes } from '@angular/router';

export const content: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('../../modules/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'personnel',
    loadChildren: () =>
      import('../../modules/personnel/personnel.routes').then((m) => m.PERSONNEL_ROUTES),
  },
  {
    path: 'organisation',
    loadChildren: () =>
      import('../../modules/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
  },
  {
    path: 'recrutement',
    loadChildren: () =>
      import('../../modules/recruitment/recruitment.routes').then((m) => m.RECRUITMENT_ROUTES),
  },
  {
    path: 'carriere',
    loadChildren: () =>
      import('../../modules/careers/careers.routes').then((m) => m.CAREERS_ROUTES),
  },
  {
    path: 'absences',
    loadChildren: () =>
      import('../../modules/leave/leave.routes').then((m) => m.LEAVE_ROUTES),
  },
  {
    path: 'evaluation',
    loadChildren: () =>
      import('../../modules/performance/performance.routes').then((m) => m.PERFORMANCE_ROUTES),
  },
  {
    path: 'formation',
    loadChildren: () =>
      import('../../modules/training/training.routes').then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'discipline',
    loadChildren: () =>
      import('../../modules/discipline/discipline.routes').then((m) => m.DISCIPLINE_ROUTES),
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('../../modules/documents/documents.routes').then((m) => m.DOCUMENTS_ROUTES),
  },
  {
    path: 'workflows',
    loadChildren: () =>
      import('../../modules/workflows/workflows.routes').then((m) => m.WORKFLOWS_ROUTES),
  },
  {
    path: 'rapports',
    loadChildren: () =>
      import('../../modules/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'portail-agent',
    loadComponent: () =>
      import('../../modules/self-service/agent-portal').then((m) => m.AgentPortalPage),
    data: { parentTitle: 'Portails', childTitle: 'Portail agent' },
  },
  {
    path: 'portail-manager',
    loadComponent: () =>
      import('../../modules/self-service/manager-portal').then((m) => m.ManagerPortalPage),
    data: { parentTitle: 'Portails', childTitle: 'Portail manager' },
  },
  {
    path: 'administration',
    loadChildren: () =>
      import('../../modules/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];

