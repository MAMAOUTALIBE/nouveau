import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/hr-dashboard/hr-dashboard').then((m) => m.HrDashboardPage),
    data: { parentTitle: 'Tableau de bord', childTitle: 'RH' },
    title: 'Dashboard RH',
  },
];
