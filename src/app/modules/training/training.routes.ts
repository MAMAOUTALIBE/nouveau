import { Routes } from '@angular/router';

export const TRAINING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'sessions',
    pathMatch: 'full',
  },
  {
    path: 'sessions',
    loadComponent: () => import('./training').then((m) => m.TrainingPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Formation', trainingTab: 'sessions' },
  },
  {
    path: 'catalogue',
    loadComponent: () => import('./training').then((m) => m.TrainingPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Catalogue', trainingTab: 'catalog' },
  },
  {
    path: 'demandes',
    loadComponent: () => import('./training').then((m) => m.TrainingPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Demandes', trainingTab: 'requests' },
  },
];
