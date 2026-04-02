import { Routes } from '@angular/router';

export const tablesRoutingModule: Routes = [
  {
    path: 'tables',
    children: [
      {
        path: 'angular-tables',
        loadComponent: () => import('./angular-tables/angular-tables').then((m) => m.AngularTables),
        title: 'Nowa - Angular Material Tables',
        data: { parentTitle: 'Tables', subParentTitle: '', childTitle: 'Angular Material Tables' }
      },

      {
        path: 'grid-js-tables',
        title: 'Nowa - Grid Js Tables',
        loadComponent: () => import('./grid-js-tables/grid-js-tables').then(m => m.GridJsTables),
        data: { parentTitle: 'Tables', subParentTitle: '', childTitle: 'Grid Js Tables' }
      },
      {
        path: 'tables',
        loadComponent: () => import('./tables/tables').then((m) => m.Tables),
        title: 'Nowa - Tables',
        data: { parentTitle: 'Tables', subParentTitle: '', childTitle: 'Tables', }
      },
    ],
  },
];
