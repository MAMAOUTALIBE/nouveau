import { Routes } from '@angular/router';

export const uielementsRoutingModule: Routes = [
  {
    path: 'ui-elements', children: [
      {
        path: 'alerts',
        loadComponent: () => import('./alerts/alerts').then((m) => m.Alerts),
        title: 'Nowa - Alerts',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Alerts' }
      },
      {
        path: 'breadcrumb',
        loadComponent: () => import('./breadcrumbs/breadcrumbs').then((m) => m.Breadcrumbs),
        title: 'Nowa - Breadcrumbs',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Breadcrumbs' }
      },
      {
        path: 'buttons',
        loadComponent: () => import('./buttons/buttons').then((m) => m.Buttons),
        title: 'Nowa - Buttons',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Buttons' }
      },
      {
        path: 'badge',
        loadComponent: () => import('./badge/badge').then(
          (m) => m.Badge
        ),
        title: 'Nowa - Badge',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Badge' }
      },
      {
        path: 'cards',
        loadComponent: () => import('./cards/cards').then((m) => m.Cards),
        title: 'Nowa - cards',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'cards' }
      },
      {
        path: 'button-group',
        loadComponent: () => import('./button-group/button-group').then(
          (m) => m.ButtonGroup
        ),
        title: 'Nowa - Button Group',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Button Group' }
      },
      {
        path: 'dropdowns',
        loadComponent: () => import('./dropdown/dropdown').then((m) => m.Dropdown),
        title: 'Nowa - Dropdowns',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Dropdowns' }
      },
      {
        path: 'images&figures',
        loadComponent: () => import('./images-figures/images-figures').then((m) => m.ImagesFigures),
        title: 'Nowa - Images & Figures',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Images & Figures' }
      },
      {
        path: 'list-group',
        loadComponent: () => import('./list-group/list-group').then((m) => m.ListGroup),
        title: 'Nowa - List group',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'List Group' }
      },
      {
        path: 'nav-tabs',
        loadComponent: () => import('./nav-tabs/nav-tabs').then((m) => m.NavTabs),
        title: 'Nowa - Nav & Tabs',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Nav & Tabs' }
      },
      {
        path: 'media-object',
        loadComponent: () => import('./media-object/media-object').then((m) => m.MediaObject),
        title: 'Nowa - Media Object',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Media Object' }
      },
      {
        path: 'pagination',
        loadComponent: () => import('./pagination/pagination').then((m) => m.Pagination),
        title: 'Nowa - Pagination',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Pagination' }
      },
      {
        path: 'popovers',
        loadComponent: () => import('./popovers/popovers').then((m) => m.Popovers),
        title: 'Nowa - Popovers',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Popovers' }
      },
      {
        path: 'toasts',
        loadComponent: () => import('./toasts/toasts').then((m) => m.Toasts),
        title: 'Nowa - Toasts',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Toasts' }
      },
      {
        path: 'progress',
        loadComponent: () => import('./progress/progress').then((m) => m.Progress),
        title: 'Nowa - Progress',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Progress' }
      },
      {
        path: 'spinners',
        loadComponent: () => import('./spinners/spinners').then((m) => m.Spinners),
        title: 'Nowa - Spinners',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Spinners' }
      },
      {
        path: 'tags',
        loadComponent: () => import('./tags/tags').then((m) => m.Tags),
        title: 'Nowa - tags',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Tags' }
      },
      {
        path: 'toasts',
        loadComponent: () => import('./toasts/toasts').then((m) => m.Toasts),
        title: 'Nowa - Toasts',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Toasts' }
      },
      {
        path: 'tooltips',
        loadComponent: () => import('./tooltips/tooltips').then((m) => m.Tooltips),
        title: 'Nowa - Tooltips',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Tooltips' }
      },
      {
        path: 'typography',
        loadComponent: () => import('./typography/typography').then((m) => m.Typography),
        title: 'Nowa - Typography',
        data: { parentTitle: 'Elements', subParentTitle: '', childTitle: 'Typography' }
      },
    ]
  }
];
