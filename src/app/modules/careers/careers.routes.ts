import { Routes } from '@angular/router';

export const CAREERS_ROUTES: Routes = [
  {
    path: 'avancements',
    loadComponent: () => import('./careers').then((m) => m.CareersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Avancements', careerTab: 'advancements' },
  },
  {
    path: 'mutations',
    loadComponent: () => import('./careers').then((m) => m.CareersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Mutations', careerTab: 'transfers' },
  },
  {
    path: 'detachements',
    loadComponent: () => import('./careers').then((m) => m.CareersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Détachements', careerTab: 'secondments' },
  },
  {
    path: 'promotions',
    loadComponent: () => import('./careers').then((m) => m.CareersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Promotions', careerTab: 'promotions' },
  },
  {
    path: 'departs',
    loadComponent: () => import('./careers').then((m) => m.CareersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Départs & Retraites', careerTab: 'departures' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'avancements' },
];
