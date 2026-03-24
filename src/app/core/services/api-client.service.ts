import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, map, retry, throwError, timeout, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_TOAST, SKIP_FATAL_REDIRECT } from '../interceptors/error.interceptor';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;
type RetriableStatus = 0 | 502 | 503 | 504;

interface ApiEnvelope<T> {
  data: T;
}

interface RetryOptions {
  enabled?: boolean;
  maxAttempts?: number;
  baseDelayMs?: number;
}

interface RequestOptions {
  skipErrorToast?: boolean;
  skipFatalRedirect?: boolean;
  timeoutMs?: number;
  retry?: RetryOptions;
}

interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  baseDelayMs: number;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private http = inject(HttpClient);
  private readonly retriableStatuses: RetriableStatus[] = [0, 502, 503, 504];
  private readonly readRetryDefaults: RetryPolicy = {
    enabled: true,
    maxAttempts: 3,
    baseDelayMs: 300,
  };
  private readonly mutationRetryDefaults: RetryPolicy = {
    enabled: false,
    maxAttempts: 1,
    baseDelayMs: 0,
  };

  get<T>(path: string, params?: QueryParams, options?: RequestOptions): Observable<T> {
    return this.withResilience(
      this.http.get<T | ApiEnvelope<T>>(this.buildUrl(path), {
        params: this.toHttpParams(params),
        context: this.buildContext(options),
      }),
      options?.timeoutMs,
      this.resolveRetryPolicy(options?.retry, this.readRetryDefaults)
    )
      .pipe(map((response) => this.unwrap(response)));
  }

  post<TResponse, TBody>(path: string, body: TBody, options?: RequestOptions): Observable<TResponse> {
    return this.withResilience(
      this.http.post<TResponse | ApiEnvelope<TResponse>>(this.buildUrl(path), body, {
        context: this.buildContext(options),
      }),
      options?.timeoutMs,
      this.resolveRetryPolicy(options?.retry, this.mutationRetryDefaults)
    )
      .pipe(map((response) => this.unwrap(response)));
  }

  private unwrap<T>(response: T | ApiEnvelope<T>): T {
    if (response && typeof response === 'object' && 'data' in (response as ApiEnvelope<T>)) {
      return (response as ApiEnvelope<T>).data;
    }

    return response as T;
  }

  private buildUrl(path: string): string {
    const base = environment.api.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private toHttpParams(params?: QueryParams): HttpParams | undefined {
    if (!params) return undefined;

    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });

    return httpParams;
  }

  private buildContext(options?: RequestOptions): HttpContext | undefined {
    let context: HttpContext | undefined;

    if (options?.skipErrorToast) {
      context = (context ?? new HttpContext()).set(SKIP_ERROR_TOAST, true);
    }

    if (options?.skipFatalRedirect) {
      context = (context ?? new HttpContext()).set(SKIP_FATAL_REDIRECT, true);
    }

    return context;
  }

  private withResilience<T>(
    stream: Observable<T>,
    timeoutOverrideMs: number | undefined,
    retryPolicy: RetryPolicy
  ): Observable<T> {
    const timeoutMs = this.resolveTimeout(timeoutOverrideMs);
    let nextStream = stream.pipe(timeout({ each: timeoutMs }));

    if (retryPolicy.enabled && retryPolicy.maxAttempts > 1) {
      nextStream = nextStream.pipe(
        retry({
          count: retryPolicy.maxAttempts - 1,
          delay: (error, retryCount) => {
            if (!this.shouldRetryError(error)) {
              throw error;
            }
            const delayMs = retryPolicy.baseDelayMs * retryCount;
            return timer(delayMs);
          },
        })
      );
    }

    return nextStream.pipe(
      catchError((error: unknown) => throwError(() => this.normalizeTransportError(error, timeoutMs)))
    );
  }

  private resolveTimeout(timeoutOverrideMs?: number): number {
    const configured = timeoutOverrideMs ?? environment.api.timeoutMs;
    if (typeof configured === 'number' && configured > 0) {
      return configured;
    }
    return 15000;
  }

  private normalizeTransportError(error: unknown, timeoutMs: number): HttpErrorResponse {
    if (error instanceof HttpErrorResponse) {
      return error;
    }

    if (
      error instanceof TimeoutError ||
      (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'TimeoutError')
    ) {
      return new HttpErrorResponse({
        status: 0,
        statusText: 'Timeout',
        error: {
          code: 'TIMEOUT',
          message: `Delai depasse apres ${timeoutMs} ms`,
        },
      });
    }

    return new HttpErrorResponse({
      status: 0,
      statusText: 'NetworkError',
      error: {
        code: 'NETWORK_UNREACHABLE',
        message: 'Erreur reseau inconnue',
      },
    });
  }

  private resolveRetryPolicy(
    options: RetryOptions | undefined,
    defaults: RetryPolicy
  ): RetryPolicy {
    const enabled = options?.enabled ?? defaults.enabled;
    const maxAttemptsRaw = options?.maxAttempts ?? defaults.maxAttempts;
    const baseDelayRaw = options?.baseDelayMs ?? defaults.baseDelayMs;

    const maxAttempts = this.toBoundedInteger(maxAttemptsRaw, defaults.maxAttempts, 1, 5);
    const baseDelayMs = this.toBoundedInteger(baseDelayRaw, defaults.baseDelayMs, 0, 10_000);
    return {
      enabled,
      maxAttempts: enabled ? maxAttempts : 1,
      baseDelayMs,
    };
  }

  private shouldRetryError(error: unknown): boolean {
    if (error instanceof TimeoutError) {
      return true;
    }

    if (typeof error === 'object' && error !== null && (error as { name?: string }).name === 'TimeoutError') {
      return true;
    }

    if (error instanceof HttpErrorResponse) {
      return this.retriableStatuses.includes(error.status as RetriableStatus);
    }

    return false;
  }

  private toBoundedInteger(value: unknown, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    const rounded = Math.round(parsed);
    return Math.max(min, Math.min(max, rounded));
  }
}
