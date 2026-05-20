import { Routes } from '@angular/router';

import { content } from './shared/routes/content.routes';

import { authen } from './shared/routes/auth.routes';
import { ContentLayout } from './shared/layouts/content-layout/content-layout';
import { AuthenticationLayout } from './shared/layouts/authentication-layout/authentication-layout';
import { authGuard } from './core/guards/auth.guard';
import { LEGAL_ROUTES } from './legal/legal.routes';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    // Pages légales (mentions, CGU, confidentialité, cookies, accessibilité,
    // security.txt) : volontairement publiques, sans guard d'authentification.
    // Conforme loi 037/AN/2016, RGAA et RFC 9116. Voir src/app/legal/.
    ...LEGAL_ROUTES,
    { path: '', component: ContentLayout, canActivate: [authGuard], children: content },
    { path: '', component: AuthenticationLayout, children: authen },
    { path: '**', redirectTo: 'not-found' },
];
