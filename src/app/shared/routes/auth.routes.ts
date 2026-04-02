import { Routes } from '@angular/router';

export const authen: Routes = [
  {
    path: 'auth/login',
    loadComponent: () => import('../../authentication/login/login').then((m) => m.Login),
    title: 'Connexion',
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('../pages/not-found/not-found-page').then((m) => m.NotFoundPage),
    title: 'Page introuvable',
  },
  {
    path: 'erreur-serveur',
    loadComponent: () =>
      import('../pages/server-error/server-error-page').then((m) => m.ServerErrorPage),
    title: 'Erreur serveur',
  },
  {
    path: 'service-indisponible',
    loadComponent: () =>
      import('../pages/service-unavailable/service-unavailable-page').then((m) => m.ServiceUnavailablePage),
    title: 'Service indisponible',
  },
  { path: 'auth', pathMatch: 'full', redirectTo: 'auth/login' },
];
