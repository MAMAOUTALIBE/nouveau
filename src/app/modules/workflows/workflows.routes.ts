import { Routes } from '@angular/router';

export const WORKFLOWS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'definitions',
    pathMatch: 'full',
  },
  {
    path: 'definitions',
    loadComponent: () =>
      import('./pages/workflow-definitions/workflow-definitions').then((m) => m.WorkflowDefinitionsPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Workflows' },
  },
  {
    path: 'instances',
    loadComponent: () =>
      import('./pages/workflow-instances/workflow-instances').then((m) => m.WorkflowInstancesPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Instances' },
  },
];
