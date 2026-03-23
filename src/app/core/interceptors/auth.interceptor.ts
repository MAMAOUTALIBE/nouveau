import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../shared/services/auth.service';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const toastr = inject(ToastrService);
  const token = localStorage.getItem('rh_token');
  const isAuthRequest = isAuthenticationRequest(req.url);

  const authReq = token && !isAuthRequest ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && token && !isAuthRequest) {
        return from(authService.refreshToken()).pipe(
          switchMap((newToken) => {
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retryReq);
          }),
          catchError((err) => {
            toastr.error('Session expirée. Veuillez vous reconnecter.', 'Primature RH', {
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
