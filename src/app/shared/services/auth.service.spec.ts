import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('logs in and stores only UX metadata (no JWT in localStorage)', async () => {
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');

    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'user@gouv.local', password: 'secret' });
    // Mode prod cookie-only : `tokens` à null, mais on garde body username
    // pour exercer l'extraction de méta-données.
    req.flush({
      tokens: null,
      username: 'user@gouv.local',
      expiresIn: 1800,
      refreshExpiresIn: 86400,
    });

    await expect(loginPromise).resolves.toEqual({ token: '' });
    // Le token JWT lui-même ne doit JAMAIS être en localStorage.
    expect(localStorage.getItem('rh_token')).toBeNull();
    expect(localStorage.getItem('rh_refresh_token')).toBeNull();
    // Méta-données UX OK.
    expect(localStorage.getItem('rh_username')).toBe('user@gouv.local');
    expect(Number(localStorage.getItem('rh_token_expires_at'))).toBeGreaterThan(Date.now());
    expect(Number(localStorage.getItem('rh_refresh_token_expires_at'))).toBeGreaterThan(Date.now());
    expect(service.showLoader).toBe(false);
    // isAuthenticated$ doit passer à true sans token visible côté JS.
    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(true);
  });

  it('does not call localStorage.setItem("rh_token", ...) on login', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    req.flush({ tokens: null, username: 'user@gouv.local' });
    await loginPromise;

    // Aucune écriture du token brut.
    const tokenWrites = setItemSpy.mock.calls.filter(([key]) => key === 'rh_token' || key === 'rh_refresh_token');
    expect(tokenWrites).toEqual([]);
  });

  it('still ingests tokens from body in dev mode (compat) without writing them to localStorage', async () => {
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    // Mode dev (jwt_return_token_in_body=True) : body contient les tokens.
    req.flush({
      tokens: { access_token: 'access-token', refresh_token: 'refresh-token' },
      username: 'user@gouv.local',
    });

    await expect(loginPromise).resolves.toEqual({ token: 'access-token' });
    // Toujours pas de token persisté dans localStorage.
    expect(localStorage.getItem('rh_token')).toBeNull();
    expect(localStorage.getItem('rh_refresh_token')).toBeNull();
    expect(localStorage.getItem('rh_username')).toBe('user@gouv.local');
  });

  it('rejects login when API is unreachable and development fallback is disabled', async () => {
    const loginPromise = service.loginWithEmail('spruko@admin.com', 'sprukoadmin');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    req.error(new ProgressEvent('NetworkError'), { status: 0, statusText: 'Unknown Error' });

    await expect(loginPromise).rejects.toThrow('Serveur API indisponible');
    expect(localStorage.getItem('rh_token')).toBeNull();
    expect(localStorage.getItem('rh_username')).toBeNull();
  });

  it('refreshes session via cookie (no body required)', async () => {
    localStorage.setItem('rh_username', 'user@gouv.local');

    const refreshPromise = service.refreshToken();
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.refresh}`);
    expect(req.request.method).toBe('POST');
    // Body vide : le cookie rh_refresh httpOnly (path-scoped) sert au backend.
    expect(req.request.body).toEqual({});
    req.flush({ tokens: null, username: 'user@gouv.local' });

    await expect(refreshPromise).resolves.toBe(true);
    expect(localStorage.getItem('rh_token')).toBeNull();
    expect(localStorage.getItem('rh_refresh_token')).toBeNull();
    expect(Number(localStorage.getItem('rh_token_expires_at'))).toBeGreaterThan(Date.now());
  });

  it('clears UX metadata and calls /auth/logout on logout', () => {
    localStorage.setItem('rh_username', 'user');
    localStorage.setItem('rh_token_expires_at', String(Date.now() + 10000));
    localStorage.setItem('rh_refresh_token_expires_at', String(Date.now() + 20000));

    service.logout();

    // Appel HTTP vers /auth/logout (backend efface les cookies).
    const req = httpMock.expectOne(`${environment.api.baseUrl}/auth/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(localStorage.getItem('rh_username')).toBeNull();
    expect(localStorage.getItem('rh_token_expires_at')).toBeNull();
    expect(localStorage.getItem('rh_refresh_token_expires_at')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('returns false and clears session when access expiration is past', () => {
    localStorage.setItem('rh_username', 'user@gouv.local');
    localStorage.setItem('rh_token_expires_at', String(Date.now() - 10_000));

    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('rh_username')).toBeNull();
  });

  it('returns true when username metadata exists and expiration is in the future', () => {
    localStorage.setItem('rh_username', 'user@gouv.local');
    localStorage.setItem('rh_token_expires_at', String(Date.now() + 60_000));

    expect(service.isAuthenticated()).toBe(true);
  });

  it('exposes isAuthenticated$ that flips to false on logout', async () => {
    localStorage.setItem('rh_username', 'user@gouv.local');
    // Force la réévaluation via storeSession (chemin nominal côté login).
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    req.flush({ tokens: null, username: 'user@gouv.local' });
    await loginPromise;

    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(true);

    service.logout();
    const logoutReq = httpMock.expectOne(`${environment.api.baseUrl}/auth/logout`);
    logoutReq.flush(null, { status: 204, statusText: 'No Content' });

    await expect(firstValueFrom(service.isAuthenticated$)).resolves.toBe(false);
  });
});
