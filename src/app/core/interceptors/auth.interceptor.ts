import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/services/auth.service';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { catchError, from, switchMap, throwError } from 'rxjs';

/**
 * Intercepteur d'authentification post-migration cookie httpOnly.
 *
 * Le cookie `rh_access` est désormais envoyé automatiquement par le navigateur
 * grâce à `credentialsInterceptor` (qui pose `withCredentials: true`). On
 * n'ajoute donc plus aucun header `Authorization: Bearer ...`.
 *
 * Le rôle restant de cet intercepteur :
 * - Sur 401, tenter un refresh via `authService.refreshToken()` (qui s'appuie
 *   sur le cookie `rh_refresh` path-scoped) puis rejouer la requête initiale.
 * - Si pas de session (jamais loggué) ou refresh KO, déconnecter l'utilisateur.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const toastr = inject(ToastrService);
  const isAuthRequest = isAuthenticationRequest(req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthRequest) {
        if (!authService.hasSession()) {
          toastr.warning('Authentification requise. Veuillez vous reconnecter.', 'DRH', {
            timeOut: 4000,
            positionClass: 'toast-top-right',
          });
          authService.logout();
          return throwError(() => error);
        }

        return from(authService.refreshToken()).pipe(
          switchMap(() => next(req)),
          catchError((err) => {
            toastr.error('Session expiree. Veuillez vous reconnecter.', 'DRH', {
              timeOut: 4000,
              positionClass: 'toast-top-right',
            });
            authService.logout();
            return throwError(() => err);
          })
        );
      }
      return throwError(() => error);
    })
  );
};

function isAuthenticationRequest(url: string): boolean {
  return url.includes(API_ENDPOINTS.auth.login) || url.includes(API_ENDPOINTS.auth.refresh);
}
