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
    loadComponent: () => import('./recruitment').then((m) => m.RecruitmentPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Candidatures',
      recruitmentTab: 'applications',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'campagnes',
    canActivate: [permissionActivateGuard],
    loadComponent: () => import('./recruitment').then((m) => m.RecruitmentPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Campagnes',
      recruitmentTab: 'campaigns',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'commissions',
    canActivate: [permissionActivateGuard],
    loadComponent: () => import('./recruitment').then((m) => m.RecruitmentPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Commissions',
      recruitmentTab: 'commissions',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  {
    path: 'integration',
    canActivate: [permissionActivateGuard],
    loadComponent: () => import('./recruitment').then((m) => m.RecruitmentPage),
    data: {
      parentTitle: 'Recrutement',
      childTitle: 'Intégration',
      recruitmentTab: 'onboarding',
      requiredAllPermissions: [APP_PERMISSIONS.recruitmentManage],
    },
  },
  { path: '', pathMatch: 'full', redirectTo: 'candidatures' },
];
