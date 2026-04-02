
import {  Routes } from '@angular/router';

export const mailRoutingModule: Routes = [
  {
    path: 'pages/email', children: [
      {
        path: 'chat',
        loadComponent: () => import('./chat/chat').then((m) => m.Chat),
        title: 'Nowa - Chat',
        data: { parentTitle: 'Pages', subParentTitle: 'Mail', childTitle: 'Chat' }
      },
      {
        path: 'mail',
        loadComponent: () => import('./mail/mail').then((m) => m.Mail),
        title: 'Nowa - mail',
        data: { parentTitle: 'Pages', subParentTitle: 'Mail', childTitle: 'Mail' }
      },
      {
        path: 'mail-compose',
        loadComponent: () => import('./mail-compose/mail-compose').then((m) => m.MailCompose),
        title: 'Nowa - Mail Compose',
        data: { parentTitle: 'Pages', subParentTitle: 'Mail', childTitle: 'Mail Compose' }
      },
      {
        path: 'mail-settings',
        loadComponent: () => import('./mail-settings/mail-settings').then((m) => m.MailSettings),
        title: 'Nowa - Mail Settings',
        data: { parentTitle: 'Pages', subParentTitle: 'Mail', childTitle: 'Mail Settings' }
      },
      {
        path: 'read-mail',
        loadComponent: () => import('./read-mail/read-mail').then((m) => m.ReadMail),
        title: 'Nowa - Read Mail',
        data: { parentTitle: 'Pages', subParentTitle: 'Mail', childTitle: 'Read Mail' }
      },
    ]
  }
];
