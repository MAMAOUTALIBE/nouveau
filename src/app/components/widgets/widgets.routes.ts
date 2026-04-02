import {  Routes } from '@angular/router';

export const widgetsRoutingModule: Routes = [
  {
    path: '', children: [{
      path: 'widgets',
      loadComponent: () => import('./widgets/widgets').then((m) => m.Widgets),
      title: 'Nowa - Widgets',
      data: { parentTitle: '', subParentTitle: '', childTitle: 'Widgets' }
    },
    ]
  }
];
