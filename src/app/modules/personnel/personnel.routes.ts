import { Routes } from '@angular/router';

export const PERSONNEL_ROUTES: Routes = [
  {
    path: 'agents',
    loadComponent: () =>
      import('./pages/agent-list/agent-list').then((m) => m.AgentListPage),
    data: { parentTitle: 'Personnel', childTitle: 'Liste des agents' },
  },
  {
    path: 'agents/nouveau',
    loadComponent: () =>
      import('./pages/agent-create/agent-create').then((m) => m.AgentCreatePage),
    data: { parentTitle: 'Personnel', subParentTitle: 'Agents', childTitle: 'Nouvel agent' },
  },
  {
    path: 'agents/:id',
    loadComponent: () =>
      import('./pages/agent-detail/agent-detail').then((m) => m.AgentDetailPage),
    data: { parentTitle: 'Personnel', subParentTitle: 'Agents', childTitle: 'Fiche agent' },
  },
  {
    path: 'dossiers',
    loadComponent: () =>
      import('./pages/personnel-dossiers/personnel-dossiers').then((m) => m.PersonnelDossiersPage),
    data: { parentTitle: 'Personnel', childTitle: 'Dossiers administratifs' },
  },
  {
    path: 'affectations',
    loadComponent: () =>
      import('./pages/personnel-affectations/personnel-affectations').then((m) => m.PersonnelAffectationsPage),
    data: { parentTitle: 'Personnel', childTitle: 'Affectations' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'agents' },
];
