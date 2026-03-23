import { HttpContextToken, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { normalizeHttpError } from '../errors/api-error';

export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((error: unknown) => {
      const apiError = normalizeHttpError(error);
      if (!req.context.get(SKIP_ERROR_TOAST) && apiError.status !== 401) {
        const message = apiError.userMessage;
        toastr.error(message, 'Primature RH', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
        });
      }

      return throwError(() => error);
    })
  );
};
