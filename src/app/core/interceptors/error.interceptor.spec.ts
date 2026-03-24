import { HttpClient, HttpContext, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKIP_ERROR_TOAST, SKIP_FATAL_REDIRECT, errorInterceptor } from './error.interceptor';
import { LAST_HEALTHY_ROUTE_KEY } from '../recovery/route-recovery';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  const toastrMock = {
    error: vi.fn<(message: string, title?: string, options?: unknown) => void>(),
  };

  const routerMock = {
    url: '/dashboard',
    navigate: vi.fn<(commands: unknown[]) => Promise<boolean>>(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    routerMock.url = '/dashboard';
    routerMock.navigate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: toastrMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('shows toast on non-401 API error', async () => {
    const requestPromise = firstValueFrom(http.get('/api/v1/personnel/agents'));
    const req = httpMock.expectOne('/api/v1/personnel/agents');
    req.flush({ message: 'Payload invalide' }, { status: 400, statusText: 'Bad Request' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(toastrMock.error).toHaveBeenCalledTimes(1);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('does not show toast for 401', async () => {
    const requestPromise = firstValueFrom(http.get('/api/v1/personnel/agents'));
    const req = httpMock.expectOne('/api/v1/personnel/agents');
    req.flush({ message: 'Session expiree' }, { status: 401, statusText: 'Unauthorized' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(toastrMock.error).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('redirects to server error page on 5xx API errors', async () => {
    const requestPromise = firstValueFrom(http.get('/api/v1/dashboard/summary'));
    const req = httpMock.expectOne('/api/v1/dashboard/summary');
    req.flush({ message: 'Erreur serveur' }, { status: 500, statusText: 'Server Error' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/erreur-serveur'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
  });

  it('redirects to service unavailable page on 503 API errors', async () => {
    const requestPromise = firstValueFrom(http.get('/api/v1/dashboard/summary'));
    const req = httpMock.expectOne('/api/v1/dashboard/summary');
    req.flush({ message: 'Service indisponible' }, { status: 503, statusText: 'Service Unavailable' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/service-indisponible'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
  });

  it('does not redirect to server error on auth endpoints', async () => {
    const requestPromise = firstValueFrom(http.post('/api/v1/auth/login', { username: 'x', password: 'y' }));
    const req = httpMock.expectOne('/api/v1/auth/login');
    req.flush({ message: 'Erreur serveur' }, { status: 500, statusText: 'Server Error' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('honors SKIP_FATAL_REDIRECT context token', async () => {
    const context = new HttpContext().set(SKIP_FATAL_REDIRECT, true).set(SKIP_ERROR_TOAST, true);
    const requestPromise = firstValueFrom(http.get('/api/v1/dashboard/summary', { context }));
    const req = httpMock.expectOne('/api/v1/dashboard/summary');
    req.flush({ message: 'Erreur serveur' }, { status: 500, statusText: 'Server Error' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(toastrMock.error).not.toHaveBeenCalled();
  });

  it('uses last healthy route when redirecting from another error page', async () => {
    localStorage.setItem(LAST_HEALTHY_ROUTE_KEY, '/workflows?view=inbox');
    routerMock.url = '/erreur-serveur';

    const requestPromise = firstValueFrom(http.get('/api/v1/dashboard/summary'));
    const req = httpMock.expectOne('/api/v1/dashboard/summary');
    req.flush({ message: 'Service indisponible' }, { status: 503, statusText: 'Service Unavailable' });

    await expect(requestPromise).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(routerMock.navigate).toHaveBeenCalledWith(
      ['/service-indisponible'],
      { queryParams: { returnUrl: '/workflows?view=inbox' } }
    );
  });
});
