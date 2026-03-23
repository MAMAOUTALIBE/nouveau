import { Routes } from '@angular/router';

export const dashboardRoutingModule: Routes = [
  {
    path: 'dashboards', children: [
      {
        path: 'dashboard-1',
        loadComponent: () => import('./dashboard-1/dashboard-1').then((m) => m.Dashboard1),
        title: 'Nowa - dashboard-1',
         data: { parentTitle: 'Dashboard', subParentTitle: '', childTitle: 'Sales' }
      },
      {
        path: 'dashboard-2',
        loadComponent: () => import('./dashboard-2/dashboard-2').then((m) => m.Dashboard2),
        title: 'Nowa - dashboard-2',
         data: { parentTitle: 'Dashboard', subParentTitle: '', childTitle: 'Sales' }
      },
      {
        path: 'dashboard-3',
        loadComponent: () => import('./dashboard-3/dashboard-3').then((m) => m.Dashboard3),
        title: 'Nowa - dashboard-3',
         data: { parentTitle: 'Dashboard', subParentTitle: '', childTitle: 'Sales' }
      },
    ]
  }
];
