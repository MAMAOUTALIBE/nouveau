import { HttpClient, HttpContext, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, TimeoutError, catchError, map, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SKIP_ERROR_TOAST } from '../interceptors/error.interceptor';

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

interface ApiEnvelope<T> {
  data: T;
}

interface RequestOptions {
  skipErrorToast?: boolean;
  timeoutMs?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private http = inject(HttpClient);

  get<T>(path: string, params?: QueryParams, options?: RequestOptions): Observable<T> {
    return this.withResilience(
      this.http.get<T | ApiEnvelope<T>>(this.buildUrl(path), {
        params: this.toHttpParams(params),
        context: this.buildContext(options),
      }),
      options?.timeoutMs
    )
      .pipe(map((response) => this.unwrap(response)));
  }

  post<TResponse, TBody>(path: string, body: TBody, options?: RequestOptions): Observable<TResponse> {
    return this.withResilience(
      this.http.post<TResponse | ApiEnvelope<TResponse>>(this.buildUrl(path), body, {
        context: this.buildContext(options),
      }),
      options?.timeoutMs
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
    if (!options?.skipErrorToast) {
      return undefined;
    }

    return new HttpContext().set(SKIP_ERROR_TOAST, true);
  }

  private withResilience<T>(stream: Observable<T>, timeoutOverrideMs?: number): Observable<T> {
    const timeoutMs = this.resolveTimeout(timeoutOverrideMs);
    return stream.pipe(
      timeout({ each: timeoutMs }),
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
}
