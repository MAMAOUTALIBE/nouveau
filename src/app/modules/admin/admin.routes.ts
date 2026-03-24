import { Routes } from '@angular/router';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'utilisateurs',
    pathMatch: 'full',
  },
  {
    path: 'utilisateurs',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/admin-users/admin-users').then((m) => m.AdminUsersPage),
    data: {
      parentTitle: 'Administration',
      childTitle: 'Utilisateurs',
      requiredAllPermissions: [APP_PERMISSIONS.adminUsersManage],
    },
  },
  {
    path: 'roles',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/admin-roles/admin-roles').then((m) => m.AdminRolesPage),
    data: {
      parentTitle: 'Administration',
      childTitle: 'Rôles',
      requiredAllPermissions: [APP_PERMISSIONS.adminRolesManage],
    },
  },
  {
    path: 'audit',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/admin-audit/admin-audit').then((m) => m.AdminAuditPage),
    data: {
      parentTitle: 'Administration',
      childTitle: 'Audit',
      requiredAnyPermissions: [APP_PERMISSIONS.adminAuditView],
    },
  },
];
