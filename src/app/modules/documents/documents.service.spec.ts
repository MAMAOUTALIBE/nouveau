import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DocumentsService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(DocumentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads unified document types with filters', async () => {
    const responsePromise = firstValueFrom(
      service.getDocumentTypes({
        moduleScope: 'PERSONNEL',
        active: true,
        page: 1,
        limit: 50,
        sortBy: 'label',
        sortOrder: 'asc',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.documents.types}` &&
        request.params.get('moduleScope') === 'PERSONNEL' &&
        request.params.get('active') === 'true' &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '50' &&
        request.params.get('sortBy') === 'label' &&
        request.params.get('sortOrder') === 'asc'
      );
    });

    req.flush([
      {
        id: 'DTYPE-CONTRAT-TRAVAIL',
        code: 'CONTRAT_TRAVAIL',
        label: 'Contrat',
        module_scope: 'PERSONNEL',
        owner_entity_type: 'EMPLOYEE',
        requires_expiry: true,
        requires_signature: true,
        requires_dispatch: false,
        is_sensitive: true,
        default_validity_days: 1095,
        retention_days: 3650,
        is_active: true,
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'DTYPE-CONTRAT-TRAVAIL',
        code: 'CONTRAT_TRAVAIL',
        label: 'Contrat',
        moduleScope: 'PERSONNEL',
        ownerEntityType: 'EMPLOYEE',
        requiresExpiry: true,
        requiresSignature: true,
        requiresDispatch: false,
        isSensitive: true,
        defaultValidityDays: 1095,
        retentionDays: 3650,
        isActive: true,
      },
    ]);
  });

  it('loads document requirements from snake_case payload', async () => {
    const responsePromise = firstValueFrom(
      service.getDocumentRequirements({
        scope: 'CONTRACT_TYPE',
        documentTypeCode: 'CONTRAT_TRAVAIL',
        contractType: 'Contractuel',
      })
    );

    const req = httpMock.expectOne((request) => {
      return (
        request.url === `${environment.api.baseUrl}${API_ENDPOINTS.documents.requirements}` &&
        request.params.get('scope') === 'CONTRACT_TYPE' &&
        request.params.get('documentTypeCode') === 'CONTRAT_TRAVAIL' &&
        request.params.get('contractType') === 'Contractuel'
      );
    });

    req.flush([
      {
        id: 'DREQ-CONTRAT-CONTRACTUEL',
        requirement_code: 'REQ_CONTRAT_TRAVAIL_CONTRACTUEL',
        document_type_code: 'CONTRAT_TRAVAIL',
        document_type_label: 'Contrat',
        requirement_scope: 'CONTRACT_TYPE',
        contract_type: 'Contractuel',
        is_mandatory: true,
        warning_offset_days: 30,
        due_offset_days: 7,
        is_active: true,
      },
    ]);

    await expect(responsePromise).resolves.toEqual([
      {
        id: 'DREQ-CONTRAT-CONTRACTUEL',
        requirementCode: 'REQ_CONTRAT_TRAVAIL_CONTRACTUEL',
        documentTypeCode: 'CONTRAT_TRAVAIL',
        documentTypeLabel: 'Contrat',
        requirementScope: 'CONTRACT_TYPE',
        contractType: 'Contractuel',
        isMandatory: true,
        warningOffsetDays: 30,
        dueOffsetDays: 7,
        isActive: true,
      },
    ]);
  });

  it('maps document analysis runs and extracted fields', async () => {
    const responsePromise = firstValueFrom(service.getDocumentAnalysis('DOC-2026-001'));
    const req = httpMock.expectOne(
      `${environment.api.baseUrl}${API_ENDPOINTS.documents.analysis('DOC-2026-001')}`
    );

    req.flush({
      runs: [
        {
          id: 'DOC-ANL-000001',
          reference: 'DOC-2026-001',
          document_id: 'DOC-2026-001',
          document_version_id: 'DOC-2026-001',
          pipeline_stage: 'FULL',
          analysis_status: 'REVIEW_REQUIRED',
          provider_name: 'mock-ocr',
          model_name: 'mock-classifier-v1',
          classified_document_type: 'CONTRAT_TRAVAIL',
          confidence_score: 92.4,
          summary_text: 'Analyse terminee',
          fields: [
            {
              field_name: 'expires_on',
              field_label: "Date d'expiration",
              field_type: 'DATE',
              field_value_date: '2026-05-15',
              normalized_value: '2026-05-15',
              confidence_score: 88,
              source_page: 1,
              is_validated: false,
            },
          ],
          started_at: '2026-04-20T08:44:00.000Z',
          completed_at: '2026-04-20T08:45:00.000Z',
          created_at: '2026-04-20T08:44:00.000Z',
          updated_at: '2026-04-20T08:45:00.000Z',
        },
      ],
    });

    await expect(responsePromise).resolves.toEqual({
      runs: [
        {
          id: 'DOC-ANL-000001',
          reference: 'DOC-2026-001',
          documentId: 'DOC-2026-001',
          documentVersionId: 'DOC-2026-001',
          pipelineStage: 'FULL',
          analysisStatus: 'REVIEW_REQUIRED',
          providerName: 'mock-ocr',
          modelName: 'mock-classifier-v1',
          classifiedDocumentType: 'CONTRAT_TRAVAIL',
          confidenceScore: 92.4,
          summaryText: 'Analyse terminee',
          errorCode: '',
          errorMessage: '',
          fields: [
            {
              fieldName: 'expires_on',
              fieldLabel: "Date d'expiration",
              fieldType: 'DATE',
              fieldValueText: '',
              fieldValueDate: '2026-05-15',
              fieldValueNumber: null,
              fieldValueBoolean: null,
              normalizedValue: '2026-05-15',
              confidenceScore: 88,
              sourcePage: 1,
              isValidated: false,
            },
          ],
          startedAt: '2026-04-20T08:44:00.000Z',
          completedAt: '2026-04-20T08:45:00.000Z',
          createdAt: '2026-04-20T08:44:00.000Z',
          updatedAt: '2026-04-20T08:45:00.000Z',
        },
      ],
    });
  });

  it('patches one extracted analysis field', async () => {
    const responsePromise = firstValueFrom(
      service.updateDocumentAnalysisField('DOC-2026-001', 'DOC-ANL-000001', 'expires_on', {
        fieldValueDate: '2026-05-20',
        normalizedValue: '2026-05-20',
        isValidated: true,
      })
    );

    const req = httpMock.expectOne(
      `${environment.api.baseUrl}${API_ENDPOINTS.documents.analysisField('DOC-2026-001', 'DOC-ANL-000001', 'expires_on')}`
    );
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({
      fieldValueText: undefined,
      fieldValueDate: '2026-05-20',
      fieldValueNumber: null,
      fieldValueBoolean: null,
      normalizedValue: '2026-05-20',
      isValidated: true,
    });

    req.flush({
      id: 'DOC-ANL-000001',
      reference: 'DOC-2026-001',
      document_id: 'DOC-2026-001',
      document_version_id: 'DOC-2026-001',
      pipeline_stage: 'FULL',
      analysis_status: 'COMPLETED',
      fields: [
        {
          field_name: 'expires_on',
          field_type: 'DATE',
          field_value_date: '2026-05-20',
          normalized_value: '2026-05-20',
          is_validated: true,
        },
      ],
    });

    await expect(responsePromise).resolves.toMatchObject({
      id: 'DOC-ANL-000001',
      analysisStatus: 'COMPLETED',
      fields: [
        {
          fieldName: 'expires_on',
          fieldValueDate: '2026-05-20',
          normalizedValue: '2026-05-20',
          isValidated: true,
        },
      ],
    });
  });
});
