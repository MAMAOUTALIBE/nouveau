import { HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';

const CORRELATION_HEADER = 'X-Correlation-Id';

export const requestContextInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  if (req.headers.has(CORRELATION_HEADER)) {
    return next(req);
  }

  const requestId = buildCorrelationId();
  const contextualizedRequest = req.clone({
    setHeaders: {
      [CORRELATION_HEADER]: requestId,
    },
  });

  return next(contextualizedRequest);
};

function buildCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `rh-${timestamp}-${random}`;
}
