import { Routes } from '@angular/router';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sessions',
    pathMatch: 'full',
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./pages/training-sessions/training-sessions').then((m) => m.TrainingSessionsPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Formation' },
  },
  {
    path: 'catalogue',
    loadComponent: () =>
      import('./pages/training-catalog/training-catalog').then((m) => m.TrainingCatalogPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Catalogue' },
  },
];
