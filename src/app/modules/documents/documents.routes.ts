import { Routes } from '@angular/router';

export const DOCUMENTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'bibliotheque',
    pathMatch: 'full',
  },
  {
    path: 'bibliotheque',
    loadComponent: () =>
      import('./pages/document-library/document-library').then((m) => m.DocumentLibraryPage),
    data: { parentTitle: 'Pilotage', childTitle: 'Documents' },
  },
];
