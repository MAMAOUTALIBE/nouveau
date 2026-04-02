import { Routes } from '@angular/router';

export const LEAVE_ROUTES: Routes = [
  {
    path: 'demandes',
    loadComponent: () =>
      import('./pages/leave-requests/leave-requests').then((m) => m.LeaveRequestsPage),
    data: { parentTitle: 'Absences', childTitle: 'Demandes' },
  },
  {
    path: 'calendrier',
    loadComponent: () =>
      import('./pages/leave-calendar/leave-calendar').then((m) => m.LeaveCalendarPage),
    data: { parentTitle: 'Absences', childTitle: 'Calendrier' },
  },
  {
    path: 'soldes',
    loadComponent: () =>
      import('./pages/leave-balances/leave-balances').then((m) => m.LeaveBalancesPage),
    data: { parentTitle: 'Absences', childTitle: 'Soldes' },
  },
  { path: '', pathMatch: 'full', redirectTo: 'demandes' },
];
