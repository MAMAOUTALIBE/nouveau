import { Routes } from '@angular/router';

/**
 * Routes des **pages légales publiques** (mentions légales, CGU,
 * confidentialité, cookies, accessibilité, security.txt).
 *
 * Volontairement **hors `permissionMatchGuard`** : ces pages doivent rester
 * accessibles sans authentification, conformément à la pratique service
 * public (loi 037/AN/2016, RGAA, security.txt RFC 9116).
 */
export const LEGAL_ROUTES: Routes = [
  {
    path: 'mentions-legales',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'mentions-legales' },
    title: 'Mentions légales',
  },
  {
    path: 'cgu',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'cgu' },
    title: "Conditions générales d'utilisation",
  },
  {
    path: 'confidentialite',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'confidentialite' },
    title: 'Politique de confidentialité',
  },
  {
    path: 'cookies',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'cookies' },
    title: 'Politique cookies',
  },
  {
    path: 'preferences-cookies',
    loadComponent: () => import('./cookie-preferences-page').then((m) => m.CookiePreferencesPage),
    title: 'Préférences cookies',
  },
  {
    path: 'accessibilite',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'accessibilite' },
    title: 'Déclaration d’accessibilité',
  },
  {
    path: 'security',
    loadComponent: () => import('./legal-page').then((m) => m.LegalPage),
    data: { slug: 'security' },
    title: 'Politique de divulgation responsable',
  },
];
