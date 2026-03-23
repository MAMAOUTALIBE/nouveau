import { Routes } from '@angular/router';

export const CAREERS_ROUTES: Routes = [
  {
    path: 'avancements',
    loadComponent: () =>
      import('./pages/advancements/advancements').then((m) => m.AdvancementsPage),
    data: { parentTitle: 'Carrière', childTitle: 'Avancements' },
  },
  {
    path: 'mutations',
    loadComponent: () =>
      import('./pages/transfers/transfers').then((m) => m.TransfersPage),
    data: { parentTitle: 'Carrière', childTitle: 'Mutations' },
  },
  {
    path: 'detachements',
    loadComponent: () =>
      import('./pages/secondments/secondments').then((m) => m.SecondmentsPage),
    data: { parentTitle: 'Carrière', childTitle: 'Détachements' },
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('./pages/promotions/promotions').then((m) => m.PromotionsPage),
    data: { parentTitle: 'Carrière', childTitle: 'Promotions' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'avancements' },
];
