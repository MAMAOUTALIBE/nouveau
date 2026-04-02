import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { ApiClientService } from './api-client.service';

describe('ApiClientService', () => {
  let service: ApiClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiClientService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('unwraps a data envelope for get()', async () => {
    const requestPromise = firstValueFrom(service.get<{ value: number }>('/demo'));
    const req = httpMock.expectOne(`${environment.api.baseUrl}/demo`);
    req.flush({ data: { value: 42 } });

    await expect(requestPromise).resolves.toEqual({ value: 42 });
  });

  it('returns raw payload when no envelope exists', async () => {
    const requestPromise = firstValueFrom(service.get<{ value: number }>('/demo-raw'));
    const req = httpMock.expectOne(`${environment.api.baseUrl}/demo-raw`);
    req.flush({ value: 7 });

    await expect(requestPromise).resolves.toEqual({ value: 7 });
  });

  it('serializes query params on get()', async () => {
    const requestPromise = firstValueFrom(service.get<{ ok: boolean }>('/filters', { page: 2, active: true }));
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}/filters` &&
        request.params.get('page') === '2' &&
        request.params.get('active') === 'true'
      );
    });

    req.flush({ ok: true });
    await expect(requestPromise).resolves.toEqual({ ok: true });
  });

  it('retries transient 503 on get() and succeeds on next attempt', async () => {
    const requestPromise = firstValueFrom(
      service.get<{ ok: boolean }>(
        '/retry-503',
        undefined,
        { retry: { maxAttempts: 2, baseDelayMs: 0 } }
      )
    );

    const firstReq = httpMock.expectOne(`${environment.api.baseUrl}/retry-503`);
    firstReq.flush({ message: 'Service indisponible' }, { status: 503, statusText: 'Service Unavailable' });

    await new Promise((resolve) => setTimeout(resolve, 0));
    const secondReq = httpMock.expectOne(`${environment.api.baseUrl}/retry-503`);
    secondReq.flush({ ok: true });

    await expect(requestPromise).resolves.toEqual({ ok: true });
  });

  it('does not retry on non-transient get() errors', async () => {
    const requestPromise = firstValueFrom(
      service.get('/no-retry-400', undefined, { retry: { maxAttempts: 3, baseDelayMs: 0 } })
    );
    const req = httpMock.expectOne(`${environment.api.baseUrl}/no-retry-400`);
    req.flush({ message: 'Bad request' }, { status: 400, statusText: 'Bad Request' });

    await expect(requestPromise).rejects.toHaveProperty('status', 400);
    httpMock.expectNone(`${environment.api.baseUrl}/no-retry-400`);
  });

  it('does not retry post() by default', async () => {
    const requestPromise = firstValueFrom(service.post('/post-no-retry', { sample: true }));
    const req = httpMock.expectOne(`${environment.api.baseUrl}/post-no-retry`);
    req.flush({ message: 'Service indisponible' }, { status: 503, statusText: 'Service Unavailable' });

    await expect(requestPromise).rejects.toHaveProperty('status', 503);
    httpMock.expectNone(`${environment.api.baseUrl}/post-no-retry`);
  });
});
