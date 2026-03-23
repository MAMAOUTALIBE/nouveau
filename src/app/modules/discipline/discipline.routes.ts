import { Routes } from '@angular/router';

export const DISCIPLINE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dossiers',
    pathMatch: 'full',
  },
  {
    path: 'dossiers',
    loadComponent: () =>
      import('./pages/discipline-cases/discipline-cases').then((m) => m.DisciplineCasesPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Discipline' },
  },
];
