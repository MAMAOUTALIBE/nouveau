import { Routes } from '@angular/router';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';
import { permissionMatchGuard } from '../../core/guards/permission.guard';

export const content: Routes = [
  {
    path: 'dashboard',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.dashboardView] },
    loadChildren: () =>
      import('../../modules/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'personnel',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.personnelView] },
    loadChildren: () =>
      import('../../modules/personnel/personnel.routes').then((m) => m.PERSONNEL_ROUTES),
  },
  {
    path: 'organisation',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.organizationView] },
    loadChildren: () =>
      import('../../modules/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
  },
  {
    path: 'recrutement',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.recruitmentView] },
    loadChildren: () =>
      import('../../modules/recruitment/recruitment.routes').then((m) => m.RECRUITMENT_ROUTES),
  },
  {
    path: 'carriere',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.careersView] },
    loadChildren: () =>
      import('../../modules/careers/careers.routes').then((m) => m.CAREERS_ROUTES),
  },
  {
    path: 'absences',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.leaveView] },
    loadChildren: () =>
      import('../../modules/leave/leave.routes').then((m) => m.LEAVE_ROUTES),
  },
  {
    path: 'evaluation',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.performanceView] },
    loadChildren: () =>
      import('../../modules/performance/performance.routes').then((m) => m.PERFORMANCE_ROUTES),
  },
  {
    path: 'formation',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.trainingView] },
    loadChildren: () =>
      import('../../modules/training/training.routes').then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'discipline',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.disciplineView] },
    loadChildren: () =>
      import('../../modules/discipline/discipline.routes').then((m) => m.DISCIPLINE_ROUTES),
  },
  {
    path: 'documents',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.documentsView] },
    loadChildren: () =>
      import('../../modules/documents/documents.routes').then((m) => m.DOCUMENTS_ROUTES),
  },
  {
    path: 'workflows',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.workflowsView] },
    loadChildren: () =>
      import('../../modules/workflows/workflows.routes').then((m) => m.WORKFLOWS_ROUTES),
  },
  {
    path: 'rapports',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.reportsView] },
    loadChildren: () =>
      import('../../modules/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'portail-agent',
    canMatch: [permissionMatchGuard],
    data: {
      requiredAnyPermissions: [APP_PERMISSIONS.portalAgent],
      parentTitle: 'Portails',
      childTitle: 'Portail agent',
    },
    loadComponent: () =>
      import('../../modules/self-service/agent-portal').then((m) => m.AgentPortalPage),
  },
  {
    path: 'portail-manager',
    canMatch: [permissionMatchGuard],
    data: {
      requiredAnyPermissions: [APP_PERMISSIONS.portalManager],
      parentTitle: 'Portails',
      childTitle: 'Portail manager',
    },
    loadComponent: () =>
      import('../../modules/self-service/manager-portal').then((m) => m.ManagerPortalPage),
  },
  {
    path: 'administration',
    canMatch: [permissionMatchGuard],
    data: { requiredAnyPermissions: [APP_PERMISSIONS.adminView] },
    loadChildren: () =>
      import('../../modules/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'acces-refuse',
    loadComponent: () =>
      import('../pages/forbidden/forbidden-page').then((m) => m.ForbiddenPage),
    data: {
      parentTitle: 'Securite',
      childTitle: 'Acces refuse',
    },
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
];

