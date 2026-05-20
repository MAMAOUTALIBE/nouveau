import { Routes } from '@angular/router';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: 'portail-candidat',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/candidate-portal/candidate-portal').then((m) => m.CandidatePortalPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Portail candidat',
      requiredAnyPermissions: [APP_PERMISSIONS.recruitmentView],
    },
  },
  {
    path: 'candidatures',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/applications/applications').then((m) => m.ApplicationsPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Candidatures',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'campagnes',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/campaigns/campaigns').then((m) => m.CampaignsPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Campagnes',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'commissions',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/commissions/commissions').then((m) => m.RecruitmentCommissionsPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Commissions',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'integration',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/onboarding/onboarding').then((m) => m.OnboardingPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Intégration',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  { path: '', pathMatch: 'full', redirectTo: 'candidatures' },
];
