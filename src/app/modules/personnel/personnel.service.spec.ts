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
    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}`);
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
