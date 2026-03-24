import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { SKIP_ERROR_TOAST } from '../../core/interceptors/error.interceptor';
import { normalizeHttpError } from '../../core/errors/api-error';
import { environment } from '../../../environments/environment';
import { AccessControlService } from '../../core/security/access-control.service';

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
  expiresIn?: number | string;
  expires_in?: number | string;
  expiresAt?: number | string;
  refreshExpiresIn?: number | string;
  refresh_expires_in?: number | string;
  refreshExpiresAt?: number | string;
  username?: string;
  roles?: string[];
  permissions?: string[];
  authorities?: string[];
  access?: {
    roles?: string[];
    permissions?: string[];
    expiresIn?: number | string;
    expires_in?: number | string;
    expiresAt?: number | string;
  };
  user?: {
    username?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    authorities?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private accessControl = inject(AccessControlService);
  private readonly tokenExpiresAtStorageKey = 'rh_token_expires_at';
  private readonly refreshExpiresAtStorageKey = 'rh_refresh_token_expires_at';
  private readonly defaultAccessTokenTtlMs = 30 * 60 * 1000;
  private readonly defaultRefreshTokenTtlMs = 24 * 60 * 60 * 1000;
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
        const roles = this.extractRoles(response, username);
        const permissions = this.extractPermissions(response);
        const expirations = this.resolveTokenExpirations(response);
        this.storeSession({
          token,
          refreshToken,
          username,
          roles,
          permissions,
          accessTokenExpiresAt: expirations.accessTokenExpiresAt,
          refreshTokenExpiresAt: expirations.refreshTokenExpiresAt,
        });
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
      const currentAccess = this.accessControl.snapshot();
      const now = Date.now();
      this.storeSession({
        token: refreshed,
        refreshToken: localStorage.getItem('rh_refresh_token') || `dev-refresh-${Date.now()}`,
        username: localStorage.getItem('rh_username') || environment.auth?.devFallback?.username,
        roles: currentAccess.roles,
        permissions: currentAccess.permissions,
        accessTokenExpiresAt: now + this.defaultAccessTokenTtlMs,
        refreshTokenExpiresAt: now + this.defaultRefreshTokenTtlMs,
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
      const currentAccess = this.accessControl.snapshot();
      const roles = this.extractRoles(response, username);
      const responsePermissions = this.extractPermissions(response);
      const permissions = responsePermissions.length ? responsePermissions : currentAccess.permissions;
      const expirations = this.resolveTokenExpirations(response);
      this.storeSession({
        token,
        refreshToken: nextRefresh,
        username,
        roles,
        permissions,
        accessTokenExpiresAt: expirations.accessTokenExpiresAt,
        refreshTokenExpiresAt: expirations.refreshTokenExpiresAt,
      });
      return token;
    }).catch((error) => {
      if (this.canUseDevelopmentFallback() && this.isNetworkOrServerUnavailable(error)) {
        const fallbackToken = this.generateDevToken();
        const currentAccess = this.accessControl.snapshot();
        const now = Date.now();
        this.storeSession({
          token: fallbackToken,
          refreshToken,
          username: localStorage.getItem('rh_username') || environment.auth?.devFallback?.username,
          roles: currentAccess.roles,
          permissions: currentAccess.permissions,
          accessTokenExpiresAt: now + this.defaultAccessTokenTtlMs,
          refreshTokenExpiresAt: now + this.defaultRefreshTokenTtlMs,
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
    const token = localStorage.getItem('rh_token');
    if (!token) {
      return false;
    }

    if (this.isAccessTokenExpired()) {
      this.clearSession();
      return false;
    }

    return true;
  }

  currentUserName(): string | null {
    return localStorage.getItem('rh_username');
  }

  private storeSession(session: {
    token: string;
    refreshToken?: string;
    username?: string;
    roles?: string[];
    permissions?: string[];
    accessTokenExpiresAt?: number;
    refreshTokenExpiresAt?: number;
  }): void {
    localStorage.setItem('rh_token', session.token);
    if (session.refreshToken) {
      localStorage.setItem('rh_refresh_token', session.refreshToken);
    }
    if (session.username) {
      localStorage.setItem('rh_username', session.username);
    }
    this.accessControl.applyAccess({
      roles: session.roles,
      permissions: session.permissions,
      username: session.username,
    });

    if (typeof session.accessTokenExpiresAt === 'number' && Number.isFinite(session.accessTokenExpiresAt)) {
      localStorage.setItem(this.tokenExpiresAtStorageKey, String(Math.round(session.accessTokenExpiresAt)));
    } else {
      localStorage.removeItem(this.tokenExpiresAtStorageKey);
    }

    if (typeof session.refreshTokenExpiresAt === 'number' && Number.isFinite(session.refreshTokenExpiresAt)) {
      localStorage.setItem(this.refreshExpiresAtStorageKey, String(Math.round(session.refreshTokenExpiresAt)));
    } else {
      localStorage.removeItem(this.refreshExpiresAtStorageKey);
    }
  }

  private clearSession(): void {
    localStorage.removeItem('rh_token');
    localStorage.removeItem('rh_refresh_token');
    localStorage.removeItem('rh_username');
    localStorage.removeItem(this.tokenExpiresAtStorageKey);
    localStorage.removeItem(this.refreshExpiresAtStorageKey);
    this.accessControl.clearAccess();
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
    const roles = this.accessControl.inferRolesFromUsername(fallbackUser || email);
    const now = Date.now();
    this.storeSession({
      token,
      refreshToken: `dev-refresh-${Date.now()}`,
      username: fallbackUser,
      roles,
      permissions: [],
      accessTokenExpiresAt: now + this.defaultAccessTokenTtlMs,
      refreshTokenExpiresAt: now + this.defaultRefreshTokenTtlMs,
    });
    return { token };
  }

  private extractRoles(response: AuthResponse, username: string): string[] {
    const roles = this.uniqueStrings([
      ...this.toStringArray(response.roles),
      ...this.toStringArray(response.user?.roles),
      ...this.toStringArray(response.authorities),
      ...this.toStringArray(response.user?.authorities),
      ...this.toStringArray(response.access?.roles),
    ]);

    if (roles.length) {
      return roles;
    }
    return this.accessControl.inferRolesFromUsername(username);
  }

  private extractPermissions(response: AuthResponse): string[] {
    return this.uniqueStrings([
      ...this.toStringArray(response.permissions),
      ...this.toStringArray(response.user?.permissions),
      ...this.toStringArray(response.access?.permissions),
    ]);
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  private uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
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

  private isAccessTokenExpired(): boolean {
    const expiresAt = this.readTimestampFromStorage(this.tokenExpiresAtStorageKey);
    if (expiresAt === null) {
      return false;
    }

    return Date.now() >= expiresAt;
  }

  private readTimestampFromStorage(key: string): number | null {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }

    return Math.round(parsed);
  }

  private resolveTokenExpirations(response: AuthResponse): {
    accessTokenExpiresAt: number;
    refreshTokenExpiresAt: number;
  } {
    const now = Date.now();
    return {
      accessTokenExpiresAt: this.resolveAbsoluteExpiry(
        [response.expiresAt, response.access?.expiresAt],
        [response.expiresIn, response.expires_in, response.access?.expiresIn, response.access?.expires_in],
        now + this.defaultAccessTokenTtlMs
      ),
      refreshTokenExpiresAt: this.resolveAbsoluteExpiry(
        [response.refreshExpiresAt],
        [response.refreshExpiresIn, response.refresh_expires_in],
        now + this.defaultRefreshTokenTtlMs
      ),
    };
  }

  private resolveAbsoluteExpiry(
    absoluteCandidates: unknown[],
    relativeSecondsCandidates: unknown[],
    fallbackTimestamp: number
  ): number {
    for (const candidate of absoluteCandidates) {
      const absolute = this.toTimestamp(candidate);
      if (absolute !== null) {
        return absolute;
      }
    }

    for (const candidate of relativeSecondsCandidates) {
      const relativeSeconds = this.toPositiveNumber(candidate);
      if (relativeSeconds !== null) {
        return Date.now() + relativeSeconds * 1000;
      }
    }

    return fallbackTimestamp;
  }

  private toPositiveNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value.trim());
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return null;
  }

  private toTimestamp(value: unknown): number | null {
    const numericValue = this.toPositiveNumber(value);
    if (numericValue !== null) {
      if (numericValue > 10_000_000_000) {
        return Math.round(numericValue);
      }
      return Math.round(numericValue * 1000);
    }

    if (typeof value === 'string') {
      const parsedDate = Date.parse(value);
      if (!Number.isNaN(parsedDate) && parsedDate > 0) {
        return parsedDate;
      }
    }

    return null;
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
