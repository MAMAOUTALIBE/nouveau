import { Routes } from '@angular/router';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'rh',
    pathMatch: 'full',
  },
  {
    path: 'rh',
    loadComponent: () =>
      import('./pages/hr-reports/hr-reports').then((m) => m.HrReportsPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Rapports' },
  },
];
