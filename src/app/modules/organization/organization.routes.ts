import { Routes } from '@angular/router';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: 'organigramme',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: { parentTitle: 'Organisation', childTitle: 'Organigramme', orgTab: 'organigramme' },
  },
  {
    path: 'postes-budgetaires',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: { parentTitle: 'Organisation', childTitle: 'Postes budgétaires', orgTab: 'budgetaires' },
  },
  {
    path: 'postes-vacants',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: { parentTitle: 'Organisation', childTitle: 'Postes vacants', orgTab: 'vacants' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'organigramme' },
];
