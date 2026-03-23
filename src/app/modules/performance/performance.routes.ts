import { Routes } from '@angular/router';

export const PERFORMANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'campagnes',
    pathMatch: 'full',
  },
  {
    path: 'campagnes',
    loadComponent: () =>
      import('./pages/perf-campaigns/perf-campaigns').then((m) => m.PerfCampaignsPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Évaluation' },
  },
  {
    path: 'resultats',
    loadComponent: () =>
      import('./pages/perf-results/perf-results').then((m) => m.PerfResultsPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Résultats' },
  },
];
