import {  Routes } from '@angular/router';

export const utilitiesRoutingModule: Routes = [
  {
    path: 'utilities', children: [{
      path: 'avatars',
      loadComponent: () => import('./avatars/avatars').then((m) => m.Avatars),
      title: 'Nowa - Avatars',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Avatars' }
    },
    {
      path: 'borders',
      loadComponent: () => import('./borders/borders').then(   (m) => m.Borders ),
      title: 'Nowa - Borders',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Borders' }
    },
    {
      path: 'break-point',
      loadComponent: () => import('./break-point/break-point').then(   (m) => m.BreakPoint ),
      title: 'Nowa - Breakpoints',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'BREAKPOINTS' }
    },
    {
      path: 'colors',
      loadComponent: () =>  import('./colors/colors').then(    (m) => m.Colors  ),
      title: 'Nowa - Colors',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Colors' }
    },
    {
      path: 'columns',
      loadComponent: () =>  import('./columns/columns').then((m) => m.Columns),
      title: 'Nowa - Columns',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Columns' }
    },
    {
      path: 'flex',
      loadComponent: () =>  import('./flex/flex').then((m) => m.Flex),
      title: 'Nowa - Flex',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Flex' }
    },
    {
      path: 'gutters',
      loadComponent: () =>  import('./gutter/gutter').then((m) => m.Gutter),
      title: 'Nowa - Gutters',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Gutters' }
    },
    {
      path: 'helpers',
      loadComponent: () =>  import('./helper/helper').then((m) => m.Helper),
      title: 'Nowa - Helpers',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Helpers' }
    },
    {
      path: 'position',
      loadComponent: () =>  import('./position/position').then((m) => m.Position),
      title: 'Nowa - Position',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Position' }
    },
    {
      path: 'additional-content',
      loadComponent: () =>  import('./additional-content/additional-content').then((m) => m.AdditionalContent),
      title: 'Nowa - Additional-content',
       data: { parentTitle: 'Utilities', subParentTitle: '', childTitle: 'Additional content' }
    },


    ]
  }
];
