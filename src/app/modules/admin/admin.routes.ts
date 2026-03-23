import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'utilisateurs',
    pathMatch: 'full',
  },
  {
    path: 'utilisateurs',
    loadComponent: () =>
      import('./pages/admin-users/admin-users').then((m) => m.AdminUsersPage),
    data: { parentTitle: 'Administration', childTitle: 'Utilisateurs' },
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./pages/admin-roles/admin-roles').then((m) => m.AdminRolesPage),
    data: { parentTitle: 'Administration', childTitle: 'Rôles' },
  },
  {
    path: 'audit',
    loadComponent: () =>
      import('./pages/admin-audit/admin-audit').then((m) => m.AdminAuditPage),
    data: { parentTitle: 'Administration', childTitle: 'Audit' },
  },
];
