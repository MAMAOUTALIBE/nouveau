import {  Routes } from '@angular/router';

export const iconsRoutingModule: Routes = [
  {
    path: '', children: [{
      path: 'icons',
      loadComponent: () => import('./icons/icons').then((m) => m.Icons),
      title: 'Nowa - Icons',
      data: { parentTitle: 'Icons', subParentTitle: '', childTitle: 'Icons' }
    },
    ]
  }
];
