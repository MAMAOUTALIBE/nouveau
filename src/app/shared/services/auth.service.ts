import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
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
  scopes?: string[];
  authorities?: string[];
  access?: {
    roles?: string[];
    permissions?: string[];
    scopes?: string[];
    expiresIn?: number | string;
    expires_in?: number | string;
    expiresAt?: number | string;
  };
  // Backend Python (FastAPI) — enveloppe { user, tokens }
  tokens?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    access_expires_at?: string;
    refresh_expires_at?: string;
  } | null;
  user?: {
    username?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
    scopes?: string[];
    authorities?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private accessControl = inject(AccessControlService);
  private readonly usernameStorageKey = 'rh_username';
  private readonly tokenExpiresAtStorageKey = 'rh_token_expires_at';
  private readonly refreshExpiresAtStorageKey = 'rh_refresh_token_expires_at';
  private readonly defaultAccessTokenTtlMs = 30 * 60 * 1000;
  private readonly defaultRefreshTokenTtlMs = 24 * 60 * 60 * 1000;
  /**
   * Dev-only : conserve en mémoire le token renvoyé dans le body (mode
   * `jwt_return_token_in_body=True`) — uniquement pour faciliter le debug ou
   * exercices E2E. Jamais persisté côté localStorage.
   */
  private inMemoryDevAccessToken: string | null = null;
  public showLoader = false;

  /**
   * État de session côté UI. Hydraté au bootstrap par la présence du méta
   * username (cookie httpOnly invisible côté JS). Bascule à `false` lors de
   * `logout()` ou d'un 401 non récupérable.
   */
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasSession());
  readonly isAuthenticated$: Observable<boolean> = this.isAuthenticatedSubject.asObservable();

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

        // En mode cookie-only (prod), `tokens` est `null` et il n'y a pas de
        // token dans le body. La session est uniquement portée par les cookies
        // httpOnly. En dev (jwt_return_token_in_body=True), on peut récupérer
        // le token pour faciliter le debug en mémoire (jamais en localStorage).
        const token = this.extractAccessToken(response);
        const username = response.username || response.user?.username || response.user?.email || email;
        const roles = this.extractRoles(response, username);
        const permissions = this.extractPermissions(response);
        const scopes = this.extractScopes(response);
        const expirations = this.resolveTokenExpirations(response);
        this.storeSession({
          token,
          username,
          roles,
          permissions,
          scopes,
          accessTokenExpiresAt: expirations.accessTokenExpiresAt,
          refreshTokenExpiresAt: expirations.refreshTokenExpiresAt,
        });
        // En cookie-only, le caller (login page) n'a pas besoin du token —
        // l'authentification est portée par les cookies. On renvoie une chaîne
        // vide pour conserver la signature publique, sans exposer rien de
        // sensible.
        return { token: token ?? '' };
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

  /**
   * Demande un nouveau couple de tokens au backend. Le refresh token est lu
   * côté serveur via le cookie httpOnly `rh_refresh` (path-scoped sur
   * `/api/v1/auth/refresh`). Aucun body n'est nécessaire : il est envoyé vide.
   *
   * @returns `true` si refresh ok, lève sinon (utilisé par l'intercepteur 401).
   */
  refreshToken(): Promise<boolean> {
    // Dev fallback : on n'a jamais pu joindre le backend → on régénère un
    // pseudo-état pour conserver la session locale, sans toucher au cookie.
    if (this.inMemoryDevAccessToken?.startsWith('dev-fallback-')) {
      const refreshed = this.generateDevToken();
      const currentAccess = this.accessControl.snapshot();
      const now = Date.now();
      this.storeSession({
        token: refreshed,
        username:
          localStorage.getItem(this.usernameStorageKey) || environment.auth?.devFallback?.username,
        roles: currentAccess.roles,
        permissions: currentAccess.permissions,
        scopes: currentAccess.scopes,
        accessTokenExpiresAt: now + this.defaultAccessTokenTtlMs,
        refreshTokenExpiresAt: now + this.defaultRefreshTokenTtlMs,
      });
      return Promise.resolve(true);
    }

    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return firstValueFrom(
      // Body vide : le cookie rh_refresh est envoyé automatiquement
      // grâce à `withCredentials: true` (credentialsInterceptor).
      this.http.post<AuthResponse>(this.buildUrl(API_ENDPOINTS.auth.refresh), {}, { context })
    )
      .then((response) => {
        const token = this.extractAccessToken(response);
        const username =
          localStorage.getItem(this.usernameStorageKey) ||
          response.username ||
          response.user?.username ||
          '';
        const currentAccess = this.accessControl.snapshot();
        const roles = this.extractRoles(response, username);
        const responsePermissions = this.extractPermissions(response);
        const responseScopes = this.extractScopes(response);
        const permissions = responsePermissions.length ? responsePermissions : currentAccess.permissions;
        const scopes = responseScopes.length ? responseScopes : currentAccess.scopes;
        const expirations = this.resolveTokenExpirations(response);
        this.storeSession({
          token,
          username,
          roles,
          permissions,
          scopes,
          accessTokenExpiresAt: expirations.accessTokenExpiresAt,
          refreshTokenExpiresAt: expirations.refreshTokenExpiresAt,
        });
        return true;
      })
      .catch((error) => {
        if (this.canUseDevelopmentFallback() && this.isNetworkOrServerUnavailable(error)) {
          const fallbackToken = this.generateDevToken();
          const currentAccess = this.accessControl.snapshot();
          const now = Date.now();
          this.storeSession({
            token: fallbackToken,
            username:
              localStorage.getItem(this.usernameStorageKey) ||
              environment.auth?.devFallback?.username,
            roles: currentAccess.roles,
            permissions: currentAccess.permissions,
            scopes: currentAccess.scopes,
            accessTokenExpiresAt: now + this.defaultAccessTokenTtlMs,
            refreshTokenExpiresAt: now + this.defaultRefreshTokenTtlMs,
          });
          return true;
        }
        throw this.toAuthError(error);
      });
  }

  /**
   * Déconnecte l'utilisateur :
   * 1. Appelle `POST /auth/logout` — le backend efface les cookies httpOnly.
   * 2. Nettoie les méta-données locales (username, exp, roles).
   * 3. Notifie les abonnés `isAuthenticated$` et redirige vers /auth/login.
   *
   * On ne propage pas les erreurs HTTP : un échec réseau ne doit pas
   * empêcher la déconnexion locale (sinon l'utilisateur reste "bloqué"
   * avec un état partiel).
   */
  logout(): void {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    // Fire & forget : on n'attend pas le serveur pour nettoyer côté client.
    this.http
      .post(this.buildUrl('/auth/logout'), {}, { context })
      .subscribe({ next: () => undefined, error: () => undefined });
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Indique si une session UI est probablement active.
   *
   * Comme le cookie d'accès est httpOnly (invisible côté JS), on s'appuie sur
   * la présence du méta-username + l'absence d'expiration dépassée pour la
   * fenêtre access. C'est une heuristique optimiste : la véritable
   * autorisation est validée par le backend à chaque requête, et un 401
   * déclenche le refresh / logout via `authInterceptor`.
   */
  isAuthenticated(): boolean {
    if (!this.hasSession()) {
      return false;
    }

    if (this.isAccessTokenExpired()) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Variante "non destructive" de `isAuthenticated()` : utilisée par
   * l'intercepteur 401 pour décider s'il vaut la peine de tenter un refresh.
   */
  hasSession(): boolean {
    return !!localStorage.getItem(this.usernameStorageKey);
  }

  currentUserName(): string | null {
    return localStorage.getItem(this.usernameStorageKey);
  }

  private storeSession(session: {
    token: string | null;
    username?: string;
    roles?: string[];
    permissions?: string[];
    scopes?: string[];
    accessTokenExpiresAt?: number;
    refreshTokenExpiresAt?: number;
  }): void {
    // Pas de localStorage.setItem('rh_token', ...) : le token JWT est dans
    // un cookie httpOnly, invisible côté JS — c'est la cible de la migration.
    // On garde uniquement les méta-données UX (username, exp) en localStorage.
    if (session.token) {
      this.inMemoryDevAccessToken = session.token;
    }
    if (session.username) {
      localStorage.setItem(this.usernameStorageKey, session.username);
    }
    this.accessControl.applyAccess({
      roles: session.roles,
      permissions: session.permissions,
      scopes: session.scopes,
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

    this.isAuthenticatedSubject.next(true);
  }

  private clearSession(): void {
    this.inMemoryDevAccessToken = null;
    localStorage.removeItem(this.usernameStorageKey);
    localStorage.removeItem(this.tokenExpiresAtStorageKey);
    localStorage.removeItem(this.refreshExpiresAtStorageKey);
    this.accessControl.clearAccess();
    this.isAuthenticatedSubject.next(false);
  }

  private extractAccessToken(response: AuthResponse): string | null {
    return response.accessToken || response.token || response.tokens?.access_token || null;
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
      username: fallbackUser,
      roles,
      permissions: [],
      scopes: [],
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

  private extractScopes(response: AuthResponse): string[] {
    return this.uniqueStrings([
      ...this.toStringArray(response.scopes),
      ...this.toStringArray(response.user?.scopes),
      ...this.toStringArray(response.access?.scopes),
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
        [response.expiresAt, response.access?.expiresAt, response.tokens?.access_expires_at],
        [response.expiresIn, response.expires_in, response.access?.expiresIn, response.access?.expires_in],
        now + this.defaultAccessTokenTtlMs
      ),
      refreshTokenExpiresAt: this.resolveAbsoluteExpiry(
        [response.refreshExpiresAt, response.tokens?.refresh_expires_at],
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
