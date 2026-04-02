import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('../../components/dashboards/dashboard-1/dashboard-1').then((m) => m.Dashboard1),
    data: { parentTitle: 'Tableau de bord', childTitle: 'Vue generale' },
    title: 'RH-ADMIN - Tableau de bord',
  },
  {
    path: 'operations',
    loadComponent: () =>
      import('../../components/dashboards/dashboard-2/dashboard-2').then((m) => m.Dashboard2),
    data: { parentTitle: 'Tableau de bord', childTitle: 'Vue operationnelle' },
    title: 'RH-ADMIN - Dashboard operations',
  },
  {
    path: 'pilotage',
    loadComponent: () =>
      import('../../components/dashboards/dashboard-3/dashboard-3').then((m) => m.Dashboard3),
    data: { parentTitle: 'Tableau de bord', childTitle: 'Vue pilotage' },
    title: 'RH-ADMIN - Dashboard pilotage',
  },
];
