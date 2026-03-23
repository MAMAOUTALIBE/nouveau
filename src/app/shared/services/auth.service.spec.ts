import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('logs in and stores tokens from API response', async () => {
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');

    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'user@gouv.local', password: 'secret' });
    req.flush({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      username: 'user@gouv.local',
    });

    await expect(loginPromise).resolves.toEqual({ token: 'access-token' });
    expect(localStorage.getItem('rh_token')).toBe('access-token');
    expect(localStorage.getItem('rh_refresh_token')).toBe('refresh-token');
    expect(localStorage.getItem('rh_username')).toBe('user@gouv.local');
    expect(service.showLoader).toBe(false);
  });

  it('throws when login response has no token', async () => {
    const loginPromise = service.loginWithEmail('user@gouv.local', 'secret');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    req.flush({ username: 'user@gouv.local' });

    await expect(loginPromise).rejects.toThrow('Token absent dans la réponse de login');
    expect(service.showLoader).toBe(false);
  });

  it('uses dev fallback when API is unreachable and default credentials are provided', async () => {
    const loginPromise = service.loginWithEmail('spruko@admin.com', 'sprukoadmin');
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.login}`);
    req.error(new ProgressEvent('NetworkError'), { status: 0, statusText: 'Unknown Error' });

    const result = await loginPromise;
    expect(result.token.startsWith('dev-fallback-')).toBe(true);
    expect(localStorage.getItem('rh_token')?.startsWith('dev-fallback-')).toBe(true);
    expect(localStorage.getItem('rh_username')).toBe('spruko@admin.com');
  });

  it('refreshes token using refresh endpoint', async () => {
    localStorage.setItem('rh_refresh_token', 'refresh-token');
    localStorage.setItem('rh_username', 'user@gouv.local');

    const refreshPromise = service.refreshToken();
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.auth.refresh}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refreshToken: 'refresh-token' });
    req.flush({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' });

    await expect(refreshPromise).resolves.toBe('new-access-token');
    expect(localStorage.getItem('rh_token')).toBe('new-access-token');
    expect(localStorage.getItem('rh_refresh_token')).toBe('new-refresh-token');
  });

  it('rejects refresh when no refresh token is available', async () => {
    await expect(service.refreshToken()).rejects.toBe('missing refresh token');
  });

  it('clears session and navigates on logout', () => {
    localStorage.setItem('rh_token', 'token');
    localStorage.setItem('rh_refresh_token', 'refresh');
    localStorage.setItem('rh_username', 'user');

    service.logout();

    expect(localStorage.getItem('rh_token')).toBeNull();
    expect(localStorage.getItem('rh_refresh_token')).toBeNull();
    expect(localStorage.getItem('rh_username')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
