import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: 'organigramme',
    loadComponent: () =>
      import('./pages/org-chart/org-chart').then((m) => m.OrgChartPage),
    data: { parentTitle: 'Organisation', childTitle: 'Organigramme' },
  },
  {
    path: 'postes-budgetaires',
    loadComponent: () =>
      import('./pages/budgeted-positions/budgeted-positions').then((m) => m.BudgetedPositionsPage),
    data: { parentTitle: 'Organisation', childTitle: 'Postes budgétaires' },
  },
  {
    path: 'postes-vacants',
    loadComponent: () =>
      import('./pages/vacant-positions/vacant-positions').then((m) => m.VacantPositionsPage),
    data: { parentTitle: 'Organisation', childTitle: 'Postes vacants' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'organigramme' },
];
