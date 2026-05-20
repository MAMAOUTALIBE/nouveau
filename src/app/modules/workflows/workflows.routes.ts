import { Routes } from '@angular/router';
import { permissionActivateGuard } from '../../core/guards/permission.guard';
import { APP_PERMISSIONS } from '../../core/security/access-control.service';

export const WORKFLOWS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'definitions',
    pathMatch: 'full',
  },
  {
    path: 'definitions',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/workflow-definitions/workflow-definitions').then((m) => m.WorkflowDefinitionsPage),
    data: {
      parentTitle: 'Pilotage',
      childTitle: 'Workflows',
      requiredAllPermissions: [APP_PERMISSIONS.workflowsManage],
    },
  },
  {
    path: 'instances',
    canActivate: [permissionActivateGuard],
    loadComponent: () =>
      import('./pages/workflow-instances/workflow-instances').then((m) => m.WorkflowInstancesPage),
    data: {
      parentTitle: 'Pilotage',
      childTitle: 'Instances',
      requiredAllPermissions: [APP_PERMISSIONS.workflowsManage],
    },
  },
];
