import { Routes } from '@angular/router';

export const authen: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('../../authentication/login/login').then((m) => m.Login),
    title: 'Connexion',
  },
  { path: 'auth', pathMatch: 'full', redirectTo: 'auth/login' },
];
