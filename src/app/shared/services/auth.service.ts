import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { SKIP_ERROR_TOAST } from '../../core/interceptors/error.interceptor';
import { normalizeHttpError } from '../../core/errors/api-error';
import { environment } from '../../../environments/environment';

export interface UserSession {
  token: string;
  username: string;
}

export type AuthFailureCode =
  | 'API_UNREACHABLE'
  | 'INVALID_CREDENTIALS'
  | 'AUTH_SERVER_ERROR'
  | 'INVALID_AUTH_RESPONSE';

export class AuthError extends Error {
  constructor(
    public readonly code: AuthFailureCode,
    message: string
  ) {
    super(message);
  }
}

interface AuthResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  user?: {
    username?: string;
    email?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  public showLoader = false;

  async loginWithEmail(email: string, password: string): Promise<{ token: string }> {
    this.showLoader = true;
    try {
      const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
      try {
        const response = await firstValueFrom(
          this.http.post<AuthResponse>(
            this.buildUrl(API_ENDPOINTS.auth.login),
            { username: email, password },
            { context }
          )
        );

        const token = this.extractAccessToken(response);
        if (!token) {
          throw new AuthError('INVALID_AUTH_RESPONSE', 'Token absent dans la réponse de login');
        }

        const refreshToken = response.refreshToken || '';
        const username = response.username || response.user?.username || response.user?.email || email;
        this.storeSession({ token, refreshToken, username });
        return { token };
      } catch (error) {
        const fallback = this.tryDevelopmentFallback(email, password, error);
        if (fallback) {
          return fallback;
        }

        throw this.toAuthError(error);
      }
    } finally {
      this.showLoader = false;
    }
  }

  refreshToken(): Promise<string> {
    const currentToken = localStorage.getItem('rh_token');
    if (currentToken?.startsWith('dev-fallback-')) {
      const refreshed = this.generateDevToken();
      this.storeSession({
        token: refreshed,
        refreshToken: localStorage.getItem('rh_refresh_token') || `dev-refresh-${Date.now()}`,
        username: localStorage.getItem('rh_username') || environment.auth?.devFallback?.username,
      });
      return Promise.resolve(refreshed);
    }

    const refreshToken = localStorage.getItem('rh_refresh_token');
    if (!refreshToken) {
      return Promise.reject('missing refresh token');
    }

    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return firstValueFrom(
      this.http.post<AuthResponse>(
        this.buildUrl(API_ENDPOINTS.auth.refresh),
        { refreshToken },
        { context }
      )
    ).then((response) => {
      const token = this.extractAccessToken(response);
      if (!token) {
        throw new AuthError('INVALID_AUTH_RESPONSE', 'Token absent dans la réponse de refresh');
      }
      const nextRefresh = response.refreshToken || refreshToken;
      const username = localStorage.getItem('rh_username') || response.username || response.user?.username || '';
      this.storeSession({ token, refreshToken: nextRefresh, username });
      return token;
    }).catch((error) => {
      if (this.canUseDevelopmentFallback() && this.isNetworkOrServerUnavailable(error)) {
        const fallbackToken = this.generateDevToken();
        this.storeSession({
          token: fallbackToken,
          refreshToken,
          username: localStorage.getItem('rh_username') || environment.auth?.devFallback?.username,
        });
        return fallbackToken;
      }
      throw this.toAuthError(error);
    });
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('rh_token');
  }

  currentUserName(): string | null {
    return localStorage.getItem('rh_username');
  }

  private storeSession(session: { token: string; refreshToken?: string; username?: string }): void {
    localStorage.setItem('rh_token', session.token);
    if (session.refreshToken) {
      localStorage.setItem('rh_refresh_token', session.refreshToken);
    }
    if (session.username) {
      localStorage.setItem('rh_username', session.username);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_refresh_token');
    localStorage.removeItem('rh_username');
  }

  private extractAccessToken(response: AuthResponse): string | null {
    return response.accessToken || response.token || null;
  }

  private buildUrl(path: string): string {
    const base = environment.api.baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  private tryDevelopmentFallback(
    email: string,
    password: string,
    error: unknown
  ): { token: string } | null {
    if (!this.canUseDevelopmentFallback()) {
      return null;
    }

    if (!this.isNetworkOrServerUnavailable(error)) {
      return null;
    }

    const fallbackUser = environment.auth?.devFallback?.username;
    const fallbackPassword = environment.auth?.devFallback?.password;
    if (email !== fallbackUser || password !== fallbackPassword) {
      return null;
    }

    const token = this.generateDevToken();
    this.storeSession({
      token,
      refreshToken: `dev-refresh-${Date.now()}`,
      username: fallbackUser,
    });
    return { token };
  }

  private canUseDevelopmentFallback(): boolean {
    return !!environment.auth?.devFallback?.enabled;
  }

  private isNetworkOrServerUnavailable(error: unknown): boolean {
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    const normalized = normalizeHttpError(error);
    return (
      normalized.code === 'NETWORK_UNREACHABLE' ||
      normalized.code === 'TIMEOUT' ||
      normalized.code === 'SERVER' ||
      normalized.status === 404
    );
  }

  private generateDevToken(): string {
    return `dev-fallback-${Date.now()}`;
  }

  private toAuthError(error: unknown): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      const normalized = normalizeHttpError(error);
      if (normalized.code === 'NETWORK_UNREACHABLE' || normalized.code === 'TIMEOUT') {
        return new AuthError(
          'API_UNREACHABLE',
          'Serveur API indisponible. Verifiez le backend.'
        );
      }

      if (normalized.code === 'UNAUTHORIZED' || normalized.code === 'FORBIDDEN') {
        return new AuthError('INVALID_CREDENTIALS', 'Identifiants invalides.');
      }

      if (normalized.code === 'SERVER') {
        return new AuthError(
          'AUTH_SERVER_ERROR',
          "Erreur serveur pendant l'authentification."
        );
      }

      return new AuthError(
        'AUTH_SERVER_ERROR',
        `Erreur d'authentification (${normalized.status}).`
      );
    }

    if (error instanceof Error) {
      return new AuthError('AUTH_SERVER_ERROR', error.message);
    }

    return new AuthError('AUTH_SERVER_ERROR', 'Erreur d’authentification inconnue.');
  }
}
