import { Routes } from '@angular/router';

export const MODERNIZATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/modernization-dashboard/modernization-dashboard').then(
        (m) => m.ModernizationDashboardPage
      ),
    data: {
      parentTitle: 'Pilotage',
      childTitle: 'Modernisation RH',
    },
    title: 'RH-ADMIN - Modernisation RH',
  },
];
