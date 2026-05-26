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
        hire_date: '2026-01-15',
        documents: [{ category: 'Contrat', ref: 'CTR-001', status: 'Valide', expires_at: '2026-12-31' }],
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'PRM-0001',
        matricule: 'PRM-0001',
        fullName: 'Aminata Diallo',
        direction: 'Direction RH',
        unit: '',
        position: 'Chef de service',
        status: 'Actif',
        manager: 'Seydou Traore',
        contractType: '',
        photoUrl: './assets/images/faces/profile.jpg',
        hireDate: '2026-01-15',
        documents: [
          {
            type: 'Contrat',
            reference: 'CTR-001',
            status: 'Valide',
            required: false,
            expiresAt: '2026-12-31',
            fileName: '',
            fileDataUrl: '',
          },
        ],
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
        unit: '',
        position: 'Charge administratif',
        status: 'Actif',
        manager: 'Directeur Administratif',
        contractType: '',
        photoUrl: './assets/images/faces/profile.jpg',
        hireDate: undefined,
        documents: undefined,
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
        unit: '',
        position: 'Analyste RH',
        status: 'Actif',
        manager: 'Chef Service RH',
        contractType: '',
        photoUrl: './assets/images/faces/profile.jpg',
        hireDate: undefined,
        documents: undefined,
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

  it('maps turnover risk items and forwards filters', async () => {
    const responsePromise = firstValueFrom(
      service.getTurnoverRisks({
        q: 'Aminata',
        riskLevel: 'Eleve',
        minScore: 50,
        sortBy: 'riskScore',
        sortOrder: 'desc',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.turnoverRisk}` &&
        request.params.get('q') === 'Aminata' &&
        request.params.get('riskLevel') === 'Eleve' &&
        request.params.get('minScore') === '50' &&
        request.params.get('sortBy') === 'riskScore' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush([
      {
        agent_id: 'PRM-0001',
        matricule: 'PRM-0001',
        full_name: 'Aminata Diallo',
        direction: 'Direction RH',
        unit: 'Gestion administrative',
        position: 'Chef de service',
        risk_score: 67.2,
        risk_level: 'Eleve',
        factors: ['3 absence(s) recentes', 'Contrat a renouveler sous 60 jours'],
        recommended_action: 'Entretien manager sous 7 jours',
        model_name: 'rules-v1',
        generated_at: '2026-04-28T08:00:00.000Z',
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        agentId: 'PRM-0001',
        matricule: 'PRM-0001',
        fullName: 'Aminata Diallo',
        direction: 'Direction RH',
        unit: 'Gestion administrative',
        position: 'Chef de service',
        riskScore: 67,
        riskLevel: 'Eleve',
        factors: ['3 absence(s) recentes', 'Contrat a renouveler sous 60 jours'],
        recommendedAction: 'Entretien manager sous 7 jours',
        modelName: 'rules-v1',
        generatedAt: '2026-04-28T08:00:00.000Z',
        reviewedAt: '',
        reviewDecision: '',
      },
    ]);
  });

  it('loads duplicate index for pre-submit checks', async () => {
    const responsePromise = firstValueFrom(service.getAgentDuplicateIndex());
    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDuplicateIndex}`;
    });

    req.flush([
      {
        id: 'PRM-0002',
        full_name: 'Mamadou Camara',
        matricule: 'PRM-0002',
        email: 'mamadou.camara@gouv.gn',
        identity_number: 'CNI-778899',
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'PRM-0002',
        fullName: 'Mamadou Camara',
        matricule: 'PRM-0002',
        email: 'mamadou.camara@gouv.gn',
        identityNumber: 'CNI-778899',
      },
    ]);
  });

  it('loads duplicate cases for merge assistant', async () => {
    const responsePromise = firstValueFrom(
      service.getAgentDuplicateCases({
        minCount: 2,
        page: 1,
        limit: 10,
        sortBy: 'confidenceScore',
        sortOrder: 'desc',
      })
    );
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDuplicateCases}` &&
        request.params.get('minCount') === '2' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '10' &&
        request.params.get('sortBy') === 'confidenceScore' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush([
      {
        reference: 'DUP-IDN-CNI-778899-02',
        duplicate_field: 'identityNumber',
        duplicate_value: 'CNI-778899',
        confidence_score: 99,
        impacted_count: 2,
        created_at: '2026-03-30T00:10:00.000Z',
        agents: [
          {
            id: 'PRM-0002',
            matricule: 'PRM-0002',
            full_name: 'Mamadou Camara',
            direction: 'Direction RH',
            unit: 'Gestion administrative',
            position: 'Assistant RH',
            status: 'Actif',
            manager: 'Aminata Diallo',
            email: 'mamadou.camara@gouv.gn',
            identity_number: 'CNI-778899',
            phone: '+224 620000002',
            contract_type: 'Fonctionnaire',
          },
          {
            id: 'PRM-0042',
            matricule: 'PRM-0042',
            full_name: 'Mamadou Camara',
            direction: 'Direction RH',
            unit: 'Gestion administrative',
            position: 'Assistant RH',
            status: 'Actif',
            manager: 'Aminata Diallo',
            email: 'mamadou.camara.2@gouv.gn',
            identity_number: 'CNI-778899',
            phone: '+224 620000099',
            contract_type: 'Fonctionnaire',
          },
        ],
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        reference: 'DUP-IDN-CNI-778899-02',
        duplicateField: 'identityNumber',
        duplicateValue: 'CNI-778899',
        confidenceScore: 99,
        impactedCount: 2,
        createdAt: '2026-03-30T00:10:00.000Z',
        agents: [
          {
            id: 'PRM-0002',
            matricule: 'PRM-0002',
            fullName: 'Mamadou Camara',
            direction: 'Direction RH',
            unit: 'Gestion administrative',
            position: 'Assistant RH',
            status: 'Actif',
            manager: 'Aminata Diallo',
            email: 'mamadou.camara@gouv.gn',
            identityNumber: 'CNI-778899',
            phone: '+224 620000002',
            contractType: 'Fonctionnaire',
          },
          {
            id: 'PRM-0042',
            matricule: 'PRM-0042',
            fullName: 'Mamadou Camara',
            direction: 'Direction RH',
            unit: 'Gestion administrative',
            position: 'Assistant RH',
            status: 'Actif',
            manager: 'Aminata Diallo',
            email: 'mamadou.camara.2@gouv.gn',
            identityNumber: 'CNI-778899',
            phone: '+224 620000099',
            contractType: 'Fonctionnaire',
          },
        ],
      },
    ]);
  });

  it('merges duplicate agents with field source strategy', async () => {
    const responsePromise = firstValueFrom(
      service.mergeDuplicateAgents({
        primaryAgentId: 'PRM-0002',
        secondaryAgentId: 'PRM-0042',
        reason: 'fusion_manuelle',
        fieldSources: {
          email: 'secondary',
          identityNumber: 'primary',
        },
      })
    );

    const req = httpMock.expectOne((request) => {
      return request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentMerge}`;
    });

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      primaryAgentId: 'PRM-0002',
      secondaryAgentId: 'PRM-0042',
      reason: 'fusion_manuelle',
      fieldSources: {
        email: 'secondary',
        identityNumber: 'primary',
      },
    });

    req.flush({
      reference: 'AG-MERGE-20260330001000',
      merged_at: '2026-03-30T00:10:00.000Z',
      merged_by: 'spruko@admin.com',
      primary_agent_id: 'PRM-0002',
      secondary_agent_id: 'PRM-0042',
      removed_agent_id: 'PRM-0042',
      kept_agent_id: 'PRM-0002',
      reassigned_dossiers: 1,
      reassigned_affectations: 2,
      merged_agent: {
        id: 'PRM-0002',
        matricule: 'PRM-0002',
        full_name: 'Mamadou Camara',
        direction_name: 'Direction RH',
        unit_name: 'Gestion administrative',
        position_title: 'Assistant RH',
        status: 'Actif',
        manager_name: 'Aminata Diallo',
        email: 'mamadou.camara.2@gouv.gn',
        phone: '+224 620000099',
      },
    });

    await expect(responsePromise).resolves.toMatchObject({
      reference: 'AG-MERGE-20260330001000',
      mergedAt: '2026-03-30T00:10:00.000Z',
      mergedBy: 'spruko@admin.com',
      primaryAgentId: 'PRM-0002',
      secondaryAgentId: 'PRM-0042',
      removedAgentId: 'PRM-0042',
      keptAgentId: 'PRM-0002',
      reassignedDossiers: 1,
      reassignedAffectations: 2,
      mergedAgent: {
        id: 'PRM-0002',
        email: 'mamadou.camara.2@gouv.gn',
      },
    });
  });

  it('loads matricule suggestion scoped by direction and unit', async () => {
    const responsePromise = firstValueFrom(
      service.getAgentMatriculeSuggestion({
        direction: 'Direction des Ressources Humaines',
        unit: 'Gestion administrative',
      })
    );
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentMatriculeSuggestion}` &&
        request.params.get('direction') === 'Direction des Ressources Humaines' &&
        request.params.get('unit') === 'Gestion administrative'
      );
    });

    req.flush({
      matricule: 'PRM-0041',
      scope_label: 'Direction des Ressources Humaines / Gestion administrative',
      based_on: 'Direction+Unite',
      next_number: 41,
    });

    await expect(responsePromise).resolves.toEqual({
      matricule: 'PRM-0041',
      scopeLabel: 'Direction des Ressources Humaines / Gestion administrative',
      basedOn: 'Direction+Unite',
      nextNumber: 41,
    });
  });

  it('loads matricule suggestion audit entries', async () => {
    const responsePromise = firstValueFrom(
      service.getMatriculeSuggestionAudit({ page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' })
    );
    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentMatriculeSuggestionAudit}` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '10' &&
        request.params.get('sortBy') === 'createdAt' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush([
      {
        reference: 'MAT-AUD-2026-001',
        created_at: '2026-03-29T21:40:00.000Z',
        username: 'spruko@admin.com',
        previous_matricule: 'PRM-0002',
        suggested_matricule: 'PRM-0003',
        direction: 'Direction des Ressources Humaines',
        unit: 'Gestion administrative',
        scope_label: 'Direction des Ressources Humaines / Gestion administrative',
        based_on: 'Direction+Unite',
        reason: 'regeneration_manuelle',
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        reference: 'MAT-AUD-2026-001',
        createdAt: '2026-03-29T21:40:00.000Z',
        username: 'spruko@admin.com',
        previousMatricule: 'PRM-0002',
        suggestedMatricule: 'PRM-0003',
        direction: 'Direction des Ressources Humaines',
        unit: 'Gestion administrative',
        scopeLabel: 'Direction des Ressources Humaines / Gestion administrative',
        basedOn: 'Direction+Unite',
        reason: 'regeneration_manuelle',
      },
    ]);
  });

  it('loads agent audit trail with mapping and query filters', async () => {
    const responsePromise = firstValueFrom(
      service.getAgentAuditTrail('PRM-0001', {
        q: 'telephone',
        changedBy: 'spruko',
        source: 'update',
        field: 'phone',
        page: 1,
        limit: 50,
        sortBy: 'changedAt',
        sortOrder: 'desc',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentAuditTrail('PRM-0001')}` &&
        request.params.get('q') === 'telephone' &&
        request.params.get('changedBy') === 'spruko' &&
        request.params.get('source') === 'update' &&
        request.params.get('field') === 'phone' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '50' &&
        request.params.get('sortBy') === 'changedAt' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush({
      data: [
        {
          reference: 'AG-AUD-2026-0100',
          agent_id: 'PRM-0001',
          agent_label: 'Aminata Diallo',
          changed_at: '2026-03-30T10:15:00.000Z',
          changed_by: 'spruko@admin.com',
          source: 'update',
          reason: 'correction_coordonnees',
          changes: [
            {
              field: 'phone',
              label: 'Telephone',
              before: '+224 620000000',
              after: '+224 620000001',
            },
          ],
        },
      ],
    });

    await expect(responsePromise).resolves.toEqual([
      {
        reference: 'AG-AUD-2026-0100',
        agentId: 'PRM-0001',
        agentLabel: 'Aminata Diallo',
        changedAt: '2026-03-30T10:15:00.000Z',
        changedBy: 'spruko@admin.com',
        source: 'update',
        reason: 'correction_coordonnees',
        changes: [
          {
            field: 'phone',
            label: 'Telephone',
            before: '+224 620000000',
            after: '+224 620000001',
          },
        ],
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
      documents: [{ category: 'Arrete', ref: 'ARR-001', status: 'Valide', expires_at: '2026-05-10' }],
    });

    await expect(responsePromise).resolves.toMatchObject({
      id: 'PRM-0001',
      matricule: 'PRM-0001',
      fullName: 'Aminata Diallo',
      position: 'Chef de service',
      unit: 'Direction RH',
      email: 'aminata@primature.local',
      phone: '+22300000000',
      photoUrl: '/assets/avatar.png',
      careerEvents: [{ title: 'Promotion', description: 'Nomination', date: '2026-01-01' }],
      documents: [{ type: 'Arrete', reference: 'ARR-001', status: 'Valide', expiresAt: '2026-05-10' }],
    });
  });

  it('loads document compliance summary for one agent', async () => {
    const responsePromise = firstValueFrom(service.getAgentDocumentCompliance('PRM-0001'));
    const req = httpMock.expectOne(
      `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDocumentCompliance('PRM-0001')}`
    );

    req.flush({
      employee_id: 'PRM-0001',
      summary: {
        requiredCount: 4,
        compliantCount: 2,
        missingCount: 1,
        expiredCount: 0,
        expiringSoonCount: 1,
      },
      items: [
        {
          document_type_code: 'CONTRAT_TRAVAIL',
          document_type_label: 'Contrat',
          requirement_scope: 'CONTRACT_TYPE',
          compliance_status: 'EXPIRING_SOON',
          document_reference: 'DOC-2026-001',
          expires_on: '2026-05-15',
          due_on: '2026-05-15',
        },
      ],
    });

    await expect(responsePromise).resolves.toEqual({
      employeeId: 'PRM-0001',
      summary: {
        requiredCount: 4,
        compliantCount: 2,
        missingCount: 1,
        expiredCount: 0,
        expiringSoonCount: 1,
      },
      items: [
        {
          documentTypeCode: 'CONTRAT_TRAVAIL',
          documentTypeLabel: 'Contrat',
          requirementScope: 'CONTRACT_TYPE',
          complianceStatus: 'EXPIRING_SOON',
          documentReference: 'DOC-2026-001',
          expiresOn: '2026-05-15',
          dueOn: '2026-05-15',
        },
      ],
    });
  });

  it('maps dossiers with agentId and forwards agentId filter', async () => {
    const responsePromise = firstValueFrom(
      service.getDossiers({
        agentId: 'PRM-0001',
        page: 1,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.personnel.dossiers}` &&
        request.params.get('agentId') === 'PRM-0001' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '20' &&
        request.params.get('sortBy') === 'updatedAt' &&
        request.params.get('sortOrder') === 'desc'
      );
    });

    req.flush([
      {
        reference: 'DOS-2026-001',
        agent_id: 'PRM-0001',
        agent_name: 'Aminata Diallo',
        dossier_type: 'Arrete nomination',
        status: 'Actif',
        updated_at: '2026-03-12T09:00:00.000Z',
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        reference: 'DOS-2026-001',
        agentId: 'PRM-0001',
        agent: 'Aminata Diallo',
        type: 'Arrete nomination',
        status: 'Actif',
        updatedAt: '2026-03-12T09:00:00.000Z',
      },
    ]);
  });

  it('creates affectation with agentId and maps response payload', async () => {
    const responsePromise = firstValueFrom(
      service.createAffectation({
        agentId: 'PRM-0002',
        agent: 'Mamadou Camara',
        fromUnit: 'Gestion administrative',
        toUnit: 'Service Paie',
        effectiveDate: '2026-04-01',
        status: 'Planifiee',
      })
    );

    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.personnel.affectations}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      agentId: 'PRM-0002',
      agent: 'Mamadou Camara',
      fromUnit: 'Gestion administrative',
      toUnit: 'Service Paie',
      effectiveDate: '2026-04-01',
      status: 'Planifiee',
    });

    req.flush({
      reference: 'AFF-2026-010',
      agent_id: 'PRM-0002',
      agent_name: 'Mamadou Camara',
      from_unit: 'Gestion administrative',
      to_unit: 'Service Paie',
      effective_date: '2026-04-01',
      status: 'Planifiee',
    });

    await expect(responsePromise).resolves.toEqual({
      reference: 'AFF-2026-010',
      agentId: 'PRM-0002',
      agent: 'Mamadou Camara',
      fromUnit: 'Gestion administrative',
      toUnit: 'Service Paie',
      effectiveDate: '2026-04-01',
      status: 'Planifiee',
    });
  });

  it('creates an agent via POST /personnel/agents and maps the response', async () => {
    const responsePromise = firstValueFrom(
      service.createAgent({
        fullName: 'Mariam Toure',
        direction: 'Direction RH',
        position: 'Gestionnaire',
        status: 'Actif',
        manager: 'Seydou Traore',
      })
    );

    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.personnel.agents}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      fullName: 'Mariam Toure',
      direction: 'Direction RH',
      position: 'Gestionnaire',
      status: 'Actif',
      manager: 'Seydou Traore',
    });

    req.flush({
      employee_id: 'PRM-0123',
      full_name: 'Mariam Toure',
      direction_name: 'Direction RH',
      position_title: 'Gestionnaire',
      status: 'Actif',
      manager_name: 'Seydou Traore',
    });

    await expect(responsePromise).resolves.toMatchObject({
      id: 'PRM-0123',
      matricule: 'PRM-0123',
      fullName: 'Mariam Toure',
      direction: 'Direction RH',
      position: 'Gestionnaire',
      status: 'Actif',
      manager: 'Seydou Traore',
    });
  });

  it('updates an agent via PUT /personnel/agents/:id and forwards the audit reason', async () => {
    const responsePromise = firstValueFrom(
      service.updateAgent('PRM-0001', {
        fullName: 'Aminata Diallo',
        manager: 'Nouveau Manager',
        auditReason: 'Correction nom complet',
      })
    );

    const req = httpMock.expectOne(`${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDetail('PRM-0001')}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({
      fullName: 'Aminata Diallo',
      manager: 'Nouveau Manager',
      auditReason: 'Correction nom complet',
    });

    req.flush({
      employee_id: 'PRM-0001',
      full_name: 'Aminata Diallo',
      manager_name: 'Nouveau Manager',
    });

    await expect(responsePromise).resolves.toMatchObject({
      id: 'PRM-0001',
      matricule: 'PRM-0001',
      fullName: 'Aminata Diallo',
      manager: 'Nouveau Manager',
    });
  });

  it('returns null when getAgentById hits a 404 (agent inconnu)', async () => {
    const responsePromise = firstValueFrom(service.getAgentById('UNKNOWN-9999'));
    const req = httpMock.expectOne(
      `${environment.api.baseUrl}${API_ENDPOINTS.personnel.agentDetail('UNKNOWN-9999')}`
    );
    req.flush({ detail: 'Agent not found' }, { status: 404, statusText: 'Not Found' });

    await expect(responsePromise).resolves.toBeNull();
  });
});
