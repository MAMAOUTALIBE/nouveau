import { HttpClient, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { credentialsInterceptor } from './credentials.interceptor';
import { environment } from '../../../environments/environment';

describe('credentialsInterceptor', () => {
  function runInterceptor(url: string): HttpRequest<unknown> {
    let captured: HttpRequest<unknown> | undefined;
    const next: HttpHandlerFn = (req) => {
      captured = req;
      return of(new HttpResponse({ status: 200 }));
    };
    const req = new HttpRequest('GET', url);
    // L'intercepteur fonctionnel n'a pas besoin d'injection ici (pas d'inject()).
    credentialsInterceptor(req, next).subscribe();
    if (!captured) {
      throw new Error('next handler was not called');
    }
    return captured;
  }

  it('clones internal API requests with withCredentials: true (baseUrl prefix)', () => {
    const captured = runInterceptor(`${environment.api.baseUrl}/personnel/agents`);
    expect(captured.withCredentials).toBe(true);
  });

  it('clones relative /api/... requests with withCredentials: true', () => {
    const captured = runInterceptor('/api/v1/dashboard/summary');
    expect(captured.withCredentials).toBe(true);
  });

  it('leaves external URLs untouched (no withCredentials)', () => {
    const captured = runInterceptor('https://firestore.googleapis.com/v1/projects/foo');
    expect(captured.withCredentials).toBe(false);
  });

  it('leaves unrelated absolute URLs untouched', () => {
    const captured = runInterceptor('https://example.com/public-data.json');
    expect(captured.withCredentials).toBe(false);
  });

  it('integrates with provideHttpClient(withInterceptors([...]))', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    const http = TestBed.inject(HttpClient);
    const httpMock = TestBed.inject(HttpTestingController);

    http.get('/api/v1/test-endpoint').subscribe();
    const req = httpMock.expectOne('/api/v1/test-endpoint');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
    httpMock.verify();
  });
});
