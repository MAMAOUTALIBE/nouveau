import { Routes } from '@angular/router';

export const LEAVE_ROUTES: Routes = [
  {
    path: 'demandes',
    loadComponent: () => import('./leave').then((m) => m.LeavePage),
    data: { parentTitle: 'Absences', childTitle: 'Demandes', leaveTab: 'requests' },
  },
  {
    path: 'calendrier',
    loadComponent: () => import('./leave').then((m) => m.LeavePage),
    data: { parentTitle: 'Absences', childTitle: 'Calendrier', leaveTab: 'calendar' },
  },
  {
    path: 'soldes',
    loadComponent: () => import('./leave').then((m) => m.LeavePage),
    data: { parentTitle: 'Absences', childTitle: 'Soldes', leaveTab: 'balances' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'demandes' },
];
