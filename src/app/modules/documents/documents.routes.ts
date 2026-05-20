import { Routes } from '@angular/router';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bibliotheque',
    pathMatch: 'full',
  },
  {
    path: 'bibliotheque',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/document-library/document-library').then((m) => m.DocumentLibraryPage),
    data: {
      parentTitle: 'Pilotage',
      childTitle: 'Documents',
      requiredAllPermissions: [APP_PERMISSIONS.documentsManage],
    },
  },
];
