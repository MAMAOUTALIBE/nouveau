import { Routes } from '@angular/router';

// Le composant OrganizationPage rend déjà son propre en-tête (card-header
// avec onglets Organigramme / Postes budgétaires / Postes vacants) ; on
// masque donc l'app-page-header global pour éviter la redondance visuelle
// et gagner de l'espace vertical (cf. pattern personnel/agent-list).
export const ORGANIZATION_ROUTES: Routes = [
  {
    path: 'organigramme',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: {
      parentTitle: 'Organisation',
      childTitle: 'Organigramme',
      orgTab: 'organigramme',
      hidePageHeader: true,
    },
  },
  {
    path: 'postes-budgetaires',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: {
      parentTitle: 'Organisation',
      childTitle: 'Postes budgétaires',
      orgTab: 'budgetaires',
      hidePageHeader: true,
    },
  },
  {
    path: 'postes-vacants',
    loadComponent: () => import('./organization').then((m) => m.OrganizationPage),
    data: {
      parentTitle: 'Organisation',
      childTitle: 'Postes vacants',
      orgTab: 'vacants',
      hidePageHeader: true,
    },
  },
  { path: '', pathMatch: 'full', redirectTo: 'organigramme' },
];
