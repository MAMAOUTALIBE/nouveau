import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { PersonnelService } from './personnel.service';

describe('PersonnelService', () => {
  let service: PersonnelService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PersonnelService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PersonnelService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps agent list from snake_case DTO', async () => {
    const responsePromise = firstValueFrom(service.getAgents());
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '200'
      );
    });
    req.flush([
      {
        employee_id: 'PRM-0001',
        full_name: 'Aminata Diallo',
        direction_name: 'Direction RH',
        position_title: 'Chef de service',
        status: 'Actif',
        manager_name: 'Seydou Traore',
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'PRM-0001',
        matricule: 'PRM-0001',
        fullName: 'Aminata Diallo',
        direction: 'Direction RH',
        position: 'Chef de service',
        status: 'Actif',
        manager: 'Seydou Traore',
      },
    ]);
  });

  it('supports wrapped list payload in data envelope', async () => {
    const responsePromise = firstValueFrom(service.getAgents());
    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}`;
    });

    req.flush({
      data: [
        {
          id: 'PRM-1001',
          matricule: 'PRM-1001',
          fullName: 'Diallo Moussa',
          direction: 'Direction Administrative',
          position: 'Charge administratif',
          status: 'Actif',
          manager: 'Directeur Administratif',
        },
      ],
    });

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'PRM-1001',
        matricule: 'PRM-1001',
        fullName: 'Diallo Moussa',
        direction: 'Direction Administrative',
        position: 'Charge administratif',
        status: 'Actif',
        manager: 'Directeur Administratif',
      },
    ]);
  });

  it('supports JSON string payload for agent list', async () => {
    const responsePromise = firstValueFrom(service.getAgents());
    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}`;
    });

    req.flush(
      JSON.stringify([
        {
          id: 'PRM-1002',
          matricule: 'PRM-1002',
          full_name: 'Camara Aissatou',
          direction_name: 'Direction RH',
          position_title: 'Analyste RH',
          status: 'Actif',
          manager_name: 'Chef Service RH',
        },
      ])
    );

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'PRM-1002',
        matricule: 'PRM-1002',
        fullName: 'Camara Aissatou',
        direction: 'Direction RH',
        position: 'Analyste RH',
        status: 'Actif',
        manager: 'Chef Service RH',
      },
    ]);
  });

  it('passes server filters on getAgents()', async () => {
    const responsePromise = firstValueFrom(
      service.getAgents({
        q: 'Diallo',
        direction: 'Direction RH',
        status: 'Actif',
        page: 2,
        limit: 25,
        sortBy: 'fullName',
        sortOrder: 'desc',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}` &&
        request.params.get('q') === 'Diallo' &&
        request.params.get('direction') === 'Direction RH' &&
        request.params.get('status') === 'Actif' &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '25' &&
        request.params.get('sortBy') === 'fullName' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush([]);
    await expect(responsePromise).resolves.toEqual([]);
  });

  it('maps agent detail with nested arrays', async () => {
    const responsePromise = firstValueFrom(service.getAgentById('PRM-0001'));
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDetail('PRM-0001')}`);
    req.flush({
      employee_id: 'PRM-0001',
      full_name: 'Aminata Diallo',
      position_title: 'Chef de service',
      unit_name: 'Direction RH',
      email: 'aminata@primature.local',
      mobile: '+22300000000',
      photo_url: '/assets/avatar.png',
      career_events: [{ label: 'Promotion', detail: 'Nomination', event_date: '2026-01-01' }],
      documents: [{ category: 'Arrete', ref: 'ARR-001', status: 'Valide' }],
    });

    await expect(responsePromise).resolves.toEqual({
      id: 'PRM-0001',
      matricule: 'PRM-0001',
      fullName: 'Aminata Diallo',
      position: 'Chef de service',
      unit: 'Direction RH',
      email: 'aminata@primature.local',
      phone: '+22300000000',
      photoUrl: '/assets/avatar.png',
      careerEvents: [{ title: 'Promotion', description: 'Nomination', date: '2026-01-01' }],
      documents: [{ type: 'Arrete', reference: 'ARR-001', status: 'Valide' }],
    });
  });
});
