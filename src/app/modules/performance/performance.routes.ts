import { Routes } from '@angular/router';

export const PERFORMANCE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'campagnes',
    pathMatch: 'full',
  },
  {
    path: 'campagnes',
    loadComponent: () => import('./performance').then((m) => m.PerformancePage),
    data: { parentTitle: 'Pilotage', childTitle: 'Évaluation', perfTab: 'campaigns' },
  },
  {
    path: 'resultats',
    loadComponent: () => import('./performance').then((m) => m.PerformancePage),
    data: { parentTitle: 'Pilotage', childTitle: 'Résultats', perfTab: 'results' },
  },
];
