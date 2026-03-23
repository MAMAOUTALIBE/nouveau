import { Routes } from '@angular/router';

export const RECRUITMENT_ROUTES: Routes = [
  {
    path: 'candidatures',
    loadComponent: () =>
      import('./pages/applications/applications').then((m) => m.ApplicationsPage),
    data: { parentTitle: 'Recrutement', childTitle: 'Candidatures' },
  },
  {
    path: 'campagnes',
    loadComponent: () =>
      import('./pages/campaigns/campaigns').then((m) => m.CampaignsPage),
    data: { parentTitle: 'Recrutement', childTitle: 'Campagnes' },
  },
  {
    path: 'integration',
    loadComponent: () =>
      import('./pages/onboarding/onboarding').then((m) => m.OnboardingPage),
    data: { parentTitle: 'Recrutement', childTitle: 'Intégration' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'candidatures' },
];
