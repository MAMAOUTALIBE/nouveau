import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { convertToParamMap, ActivatedRoute } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { ToastrService } from 'ngx-toastr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ServiceUnavailablePage } from './service-unavailable-page';

describe('ServiceUnavailablePage', () => {
  let component: ServiceUnavailablePage;
  let httpMock: HttpTestingController;

  const toastrMock = {
    warning: vi.fn(),
    success: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ returnUrl: '/dashboard' }),
            },
          },
        },
        { provide: ToastrService, useValue: toastrMock },
      ],
    });

    component = TestBed.runInInjectionContext(() => new ServiceUnavailablePage());
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
    TestBed.resetTestingModule();
  });

  it('records a failed retry attempt in history', async () => {
    const retryPromise = component.retryNow({ source: 'manual' });

    const healthReq = httpMock.expectOne('/health');
    healthReq.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const apiReq = httpMock.expectOne('/api/v1/dashboard/summary');
    apiReq.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });

    await retryPromise;

    const history = (component as unknown as { attemptHistory: Array<{ result: string; source: string; details: string }> })
      .attemptHistory;
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      result: 'ECHEC',
      source: 'MANUEL',
      details: 'Service indisponible',
    });
    expect(toastrMock.warning).toHaveBeenCalledTimes(1);
  });

  it('keeps only the 5 most recent attempts', async () => {
    for (let i = 0; i < 6; i += 1) {
      const retryPromise = component.retryNow({ source: 'manual' });

      const healthReq = httpMock.expectOne('/health');
      healthReq.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });
      await new Promise((resolve) => setTimeout(resolve, 0));

      const apiReq = httpMock.expectOne('/api/v1/dashboard/summary');
      apiReq.flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });

      await retryPromise;
    }

    const history = (component as unknown as { attemptHistory: Array<{ result: string }> }).attemptHistory;
    expect(history).toHaveLength(5);
    for (const item of history) {
      expect(item.result).toBe('ECHEC');
    }
  });
});
