import { HttpContextToken, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { normalizeHttpError } from '../errors/api-error';
import { API_ENDPOINTS } from '../config/api-endpoints';
import { resolveRecoveryReturnUrl } from '../recovery/route-recovery';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_FATAL_REDIRECT = new HttpContextToken<boolean>(() => false);
const SERVER_ERROR_ROUTE = '/erreur-serveur';
const SERVICE_UNAVAILABLE_ROUTE = '/service-indisponible';

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const toastr = inject(ToastrService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = normalizeHttpError(error);
      if (!req.context.get(SKIP_ERROR_TOAST) && apiError.status !== 401) {
        const message = apiError.requestId
          ? `${apiError.userMessage} (Ref: ${apiError.requestId})`
          : apiError.userMessage;
        toastr.error(message, 'Primature RH', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
        });
      }

      const targetRoute = resolveServerErrorRoute(
        req,
        apiError,
        req.context.get(SKIP_FATAL_REDIRECT),
        router.url || ''
      );
      if (targetRoute) {
        const returnUrl = resolveRecoveryReturnUrl(router.url || '', targetRoute);
        void router.navigate([targetRoute], { queryParams: { returnUrl } });
      }

      return throwError(() => error);
    })
  );
};

function resolveServerErrorRoute(
  req: HttpRequest<unknown>,
  apiError: ReturnType<typeof normalizeHttpError>,
  skipFatalRedirect: boolean,
  currentUrl: string
): string | null {
  if (skipFatalRedirect) {
    return null;
  }

  if (apiError.code !== 'SERVER' || apiError.status < 500) {
    return null;
  }

  if (!isApiRequest(req.url) || isAuthenticationRequest(req.url)) {
    return null;
  }

  const targetRoute = apiError.status === 503 ? SERVICE_UNAVAILABLE_ROUTE : SERVER_ERROR_ROUTE;
  if (currentUrl.startsWith(targetRoute)) {
    return null;
  }

  return targetRoute;
}

function isApiRequest(url: string): boolean {
  return url.includes('/api/v1');
}

function isAuthenticationRequest(url: string): boolean {
  return url.includes(API_ENDPOINTS.auth.login) || url.includes(API_ENDPOINTS.auth.refresh);
}
