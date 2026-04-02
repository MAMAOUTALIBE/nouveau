import { Routes } from '@angular/router';

export const appsRoutingModule: Routes = [
  {
    path: 'apps', children: [
      {
        path: 'fullcalender',
        loadComponent: () => import('./fullcalendar/fullcalendar').then((m) => m.Fullcalendar),
        title: 'Nowa - Full Calender',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Full Calender' }
      },
      {
        path: 'contacts',
        loadComponent: () => import('./contacts/contacts').then((m) => m.Contacts),
        title: 'Nowa - Contacts',
      },
      {
        path: 'gallery',
        loadComponent: () => import('./gallery/gallery').then((m) => m.Gallery),
        title: 'Nowa - Gallery',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Gallery' }
      },
      {
        path: 'sweetalerts',
        loadComponent: () => import('./sweet-alerts/sweet-alerts').then((m) => m.SweetAlerts),
        title: 'Nowa - Sweet Alerts',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Sweet Alerts' }

      },
      {
        path: 'notification',
        loadComponent: () => import('./notification/notification').then((m) => m.Notification),
        title: 'Nowa - Notification',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Notification' }
      },
      {
        path: 'widget-notification',
        loadComponent: () => import('./widget-notification/widget-notification').then((m) => m.WidgetNotification),
        title: 'Nowa - widget-notification',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Widget-notification' }
      },
      {
        path: 'treeview',
        loadComponent: () => import('./treeview/treeview').then((m) => m.Treeview),
        title: 'Nowa - treeview',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'Treeview' }
      },
      {
        path: 'file-manager',
        loadComponent: () => import('./file-manager/file-manager').then((m) => m.FileManager),
        title: 'Nowa - File Manager',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'File-manager' }
      },
      {
        path: 'file-manager1',
        loadComponent: () => import('./file-manager1/file-manager1').then((m) => m.FileManager1),
        title: 'Nowa - File Manager 1',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'File-manager1' }
      },
      {
        path: 'file-details',
        loadComponent: () => import('./file-details/file-details').then((m) => m.FileDetails),
        title: 'Nowa - File Details',
        data: { parentTitle: 'Apps', subParentTitle: '', childTitle: 'File-details' }
      }
    ]
  }
];
