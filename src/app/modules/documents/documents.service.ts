import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface DocumentItem {
  reference: string;
  title: string;
  type: string;
  documentTypeCode?: string;
  documentTypeLabel?: string;
  owner: string;
  updatedAt: string;
  status: string;
  employeeName: string;
  employeeId: string;
  direction: string;
  unit: string;
  sourceModule?: string;
  sourceRecordId?: string;
  confidentialityLevel?: string;
  requiresAcknowledgement?: boolean;
  issuedAt: string;
  startDate: string;
  endDate: string;
  expiresOn?: string;
  approver: string;
  missionDestination: string;
  missionPurpose: string;
  absenceReason: string;
  notes: string;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  recipientUsername: string;
  assignmentNote: string;
  deliveryStatus: string;
  assignedAt: string;
  assignedBy: string;
  assignmentDueAt: string;
  reminderAt: string;
  reminderSentAt: string;
  readAt: string;
  acknowledgedAt: string;
  acknowledgedBy: string;
  signedAt: string;
  signedBy: string;
  stampLabel: string;
  signatureHash: string;
  verificationCode: string;
  analysisStatus?: string;
  lastAnalysisAt?: string;
  links?: DocumentLink[];
}

export interface DocumentLink {
  entityType: string;
  entityId: string;
  linkRole: string;
}

export interface DocumentTypeDefinition {
  id: string;
  code: string;
  label: string;
  moduleScope: string;
  ownerEntityType: string;
  requiresExpiry: boolean;
  requiresSignature: boolean;
  requiresDispatch: boolean;
  isSensitive: boolean;
  defaultValidityDays: number | null;
  retentionDays: number | null;
  isActive: boolean;
}

export interface DocumentRequirement {
  id: string;
  requirementCode: string;
  documentTypeCode: string;
  documentTypeLabel: string;
  requirementScope: string;
  contractType: string;
  isMandatory: boolean;
  warningOffsetDays: number;
  dueOffsetDays: number;
  isActive: boolean;
}

export interface DocumentProcessingQueueItem {
  reference: string;
  title: string;
  documentTypeCode: string;
  documentTypeLabel: string;
  status: string;
  analysisStatus: string;
  sourceModule: string;
  confidentialityLevel: string;
  employeeId: string;
  employeeName: string;
  requiresAcknowledgement: boolean;
  nextAction: string;
  updatedAt: string;
  lastAnalysisAt: string;
  latestRunStatus: string;
  latestConfidenceScore: number | null;
}

export interface DocumentAnalysisField {
  fieldName: string;
  fieldLabel: string;
  fieldType: string;
  fieldValueText: string;
  fieldValueDate: string;
  fieldValueNumber: number | null;
  fieldValueBoolean: boolean | null;
  normalizedValue: string;
  confidenceScore: number | null;
  sourcePage: number | null;
  isValidated: boolean;
}

export interface DocumentAnalysisRun {
  id: string;
  reference: string;
  documentId: string;
  documentVersionId: string;
  pipelineStage: string;
  analysisStatus: string;
  providerName: string;
  modelName: string;
  classifiedDocumentType: string;
  confidenceScore: number | null;
  summaryText: string;
  errorCode: string;
  errorMessage: string;
  fields: DocumentAnalysisField[];
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysisSummary {
  runs: DocumentAnalysisRun[];
}

export interface AnalyzeDocumentPayload {
  pipelineStage?: string;
  providerName?: string;
  modelName?: string;
  force?: boolean;
}

export interface UpdateDocumentAnalysisFieldPayload {
  fieldValueText?: string | null;
  fieldValueDate?: string | null;
  fieldValueNumber?: number | null;
  fieldValueBoolean?: boolean | null;
  normalizedValue?: string | null;
  isValidated?: boolean;
}

export interface CreateDocumentPayload {
  reference?: string;
  title: string;
  type: string;
  documentTypeCode?: string;
  owner: string;
  updatedAt?: string;
  status?: string;
  employeeName: string;
  employeeId?: string;
  direction?: string;
  unit?: string;
  sourceModule?: string;
  sourceRecordId?: string;
  confidentialityLevel?: string;
  requiresAcknowledgement?: boolean;
  issuedAt: string;
  startDate?: string;
  endDate?: string;
  expiresOn?: string;
  approver?: string;
  missionDestination?: string;
  missionPurpose?: string;
  absenceReason?: string;
  notes?: string;
}

export type UpdateDocumentPayload = Omit<CreateDocumentPayload, 'reference'>;

export interface DocumentsQuery extends CollectionQueryOptions {
  status?: string;
  type?: string;
  typeCode?: string;
  owner?: string;
  sourceModule?: string;
  analysisStatus?: string;
  confidentialityLevel?: string;
  linkEntityType?: string;
  linkEntityId?: string;
}

export interface DocumentInboxQuery extends CollectionQueryOptions {
  deliveryStatus?: string;
}

export interface DocumentOverdueQuery extends CollectionQueryOptions {
  recipientUsername?: string;
  deliveryStatus?: string;
}

export interface DocumentTypesQuery extends CollectionQueryOptions {
  moduleScope?: string;
  ownerEntityType?: string;
  active?: boolean;
}

export interface DocumentRequirementsQuery extends CollectionQueryOptions {
  scope?: string;
  documentTypeCode?: string;
  contractType?: string;
  active?: boolean;
}

export interface DocumentProcessingQueueQuery extends CollectionQueryOptions {
  nextAction?: string;
  status?: string;
  analysisStatus?: string;
  sourceModule?: string;
}

export interface AssignDocumentPayload {
  employeeId: string;
  employeeName?: string;
  recipientUsername?: string;
  note?: string;
  forceReassign?: boolean;
  assignmentDueAt?: string;
  reminderAt?: string;
}

export interface SignDocumentPayload {
  signatoryName?: string;
  stampLabel?: string;
}

export interface DocumentRequest {
  reference: string;
  documentType: string;
  requesterName: string;
  requesterUsername: string;
  purpose: string;
  neededBy: string;
  status: string;
  createdAt: string;
  decidedAt: string;
  decidedBy: string;
  decisionComment: string;
}

export interface CreateDocumentRequestPayload {
  reference?: string;
  documentType: string;
  requesterName: string;
  requesterUsername?: string;
  purpose: string;
  neededBy: string;
}

export interface DocumentRequestDecisionPayload {
  action: 'APPROUVER' | 'REJETER';
  reason?: string;
}

export interface DocumentRequestsQuery extends CollectionQueryOptions {
  status?: string;
  requesterUsername?: string;
  documentType?: string;
}

export interface DocumentAuditLogItem {
  id: string;
  reference: string;
  action: string;
  actor: string;
  happenedAt: string;
  statusBefore: string;
  statusAfter: string;
  detail: string;
  metadata: Record<string, string>;
}

export interface DocumentAuditQuery extends CollectionQueryOptions {
  reference?: string;
  action?: string;
  actor?: string;
}

export interface NotificationItem {
  id: string;
  deliveryId: string;
  recipientUsername: string;
  title: string;
  message: string;
  category: string;
  reference: string;
  metadata: Record<string, string>;
  createdAt: string;
  readAt: string;
  isRead: boolean;
}

export interface NotificationQuery extends CollectionQueryOptions {
  unreadOnly?: boolean;
  category?: string;
}

export interface DocumentOverdueItem {
  reference: string;
  title: string;
  type: string;
  status: string;
  deliveryStatus: string;
  recipientUsername: string;
  assignedEmployeeName: string;
  assignedAt: string;
  assignmentDueAt: string;
  reminderAt: string;
  signedBy: string;
  verificationCode: string;
  overdueHours: number;
  overdueDays: number;
}

export interface DocumentAnalyticsReport {
  generatedAt: string;
  totals: {
    totalDocuments: number;
    signedDocuments: number;
    assignedDocuments: number;
    readDocuments: number;
    acknowledgedDocuments: number;
    pendingAcknowledgements: number;
    overdueDocuments: number;
    dueInNext48h: number;
  };
  rates: {
    acknowledgementRate: number;
    signatureRate: number;
  };
  sla: {
    averageAckHours: number;
    averageReadHours: number;
  };
  notifications: {
    unreadNotifications: number;
    notificationJobsTotal: number;
    notificationJobsSent: number;
    notificationJobsRetry: number;
    notificationJobsFailed: number;
  };
  statusBreakdown: Array<{ label: string; count: number }>;
  typeBreakdown: Array<{ label: string; count: number }>;
  overduePreview: DocumentOverdueItem[];
}

export interface DocumentArchiveRunPayload {
  olderThanDays?: number;
  dryRun?: boolean;
  onlyAcknowledged?: boolean;
  includeUnassigned?: boolean;
}

export interface DocumentArchiveRunResult {
  generatedAt: string;
  dryRun: boolean;
  criteria: {
    olderThanDays: number;
    onlyAcknowledged: boolean;
    includeUnassigned: boolean;
  };
  candidatesCount: number;
  archivedCount: number;
  candidates: Array<{
    reference: string;
    title: string;
    status: string;
    deliveryStatus: string;
    ageDays: number;
    eligibleFrom: string;
  }>;
}

export interface DocumentArchivePurgePayload {
  retentionDays?: number;
  dryRun?: boolean;
  includeNotifications?: boolean;
}

export interface DocumentArchivePurgeResult {
  generatedAt: string;
  dryRun: boolean;
  criteria: {
    retentionDays: number;
    includeNotifications: boolean;
  };
  candidatesCount: number;
  purged: {
    documents: number;
    dispatches: number;
    auditLogs: number;
    notificationsInbox: number;
    notificationsJobs: number;
  };
  references: string[];
}

interface DocumentItemDto {
  reference?: string;
  docRef?: string;
  doc_ref?: string;
  title?: string;
  name?: string;
  type?: string;
  category?: string;
  documentTypeCode?: string;
  document_type_code?: string;
  documentTypeLabel?: string;
  document_type_label?: string;
  owner?: string;
  ownerName?: string;
  owner_name?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: string;
  sourceModule?: string;
  source_module?: string;
  sourceRecordId?: string;
  source_record_id?: string;
  confidentialityLevel?: string;
  confidentiality_level?: string;
  requiresAcknowledgement?: boolean;
  requires_acknowledgement?: boolean;
  employeeName?: string;
  employee_name?: string;
  employee?: string;
  agent?: string;
  employeeId?: string;
  employee_id?: string;
  matricule?: string;
  direction?: string;
  unit?: string;
  issuedAt?: string;
  issued_at?: string;
  issueDate?: string;
  issue_date?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  expiresOn?: string;
  expires_on?: string;
  approver?: string;
  validator?: string;
  missionDestination?: string;
  mission_destination?: string;
  destination?: string;
  missionPurpose?: string;
  mission_purpose?: string;
  purpose?: string;
  absenceReason?: string;
  absence_reason?: string;
  reason?: string;
  notes?: string;
  assignedEmployeeId?: string;
  assigned_employee_id?: string;
  assigneeId?: string;
  assignee_id?: string;
  assignedEmployeeName?: string;
  assigned_employee_name?: string;
  assigneeName?: string;
  assignee_name?: string;
  recipientUsername?: string;
  recipient_username?: string;
  recipient?: string;
  assignmentNote?: string;
  assignment_note?: string;
  note?: string;
  deliveryStatus?: string;
  delivery_status?: string;
  assignmentStatus?: string;
  assignment_status?: string;
  assignedAt?: string;
  assigned_at?: string;
  assignedBy?: string;
  assigned_by?: string;
  assignmentDueAt?: string;
  assignment_due_at?: string;
  dueAt?: string;
  due_at?: string;
  reminderAt?: string;
  reminder_at?: string;
  reminderSentAt?: string;
  reminder_sent_at?: string;
  readAt?: string;
  read_at?: string;
  acknowledgedAt?: string;
  acknowledged_at?: string;
  acknowledgedBy?: string;
  acknowledged_by?: string;
  signedAt?: string;
  signed_at?: string;
  signedBy?: string;
  signed_by?: string;
  signatoryName?: string;
  signatory_name?: string;
  stampLabel?: string;
  stamp_label?: string;
  signatureHash?: string;
  signature_hash?: string;
  verificationCode?: string;
  verification_code?: string;
  analysisStatus?: string;
  analysis_status?: string;
  lastAnalysisAt?: string;
  last_analysis_at?: string;
  links?: DocumentLinkDto[];
}

interface DocumentLinkDto {
  entityType?: string;
  entity_type?: string;
  entityId?: string;
  entity_id?: string;
  linkRole?: string;
  link_role?: string;
}

interface DocumentTypeDefinitionDto {
  id?: string;
  code?: string;
  label?: string;
  moduleScope?: string;
  module_scope?: string;
  ownerEntityType?: string;
  owner_entity_type?: string;
  requiresExpiry?: boolean;
  requires_expiry?: boolean;
  requiresSignature?: boolean;
  requires_signature?: boolean;
  requiresDispatch?: boolean;
  requires_dispatch?: boolean;
  isSensitive?: boolean;
  is_sensitive?: boolean;
  defaultValidityDays?: number | null;
  default_validity_days?: number | null;
  retentionDays?: number | null;
  retention_days?: number | null;
  isActive?: boolean;
  is_active?: boolean;
}

interface DocumentRequirementDto {
  id?: string;
  requirementCode?: string;
  requirement_code?: string;
  documentTypeCode?: string;
  document_type_code?: string;
  documentTypeLabel?: string;
  document_type_label?: string;
  requirementScope?: string;
  requirement_scope?: string;
  contractType?: string;
  contract_type?: string;
  isMandatory?: boolean;
  is_mandatory?: boolean;
  warningOffsetDays?: number;
  warning_offset_days?: number;
  dueOffsetDays?: number;
  due_offset_days?: number;
  isActive?: boolean;
  is_active?: boolean;
}

interface DocumentProcessingQueueItemDto {
  reference?: string;
  title?: string;
  documentTypeCode?: string;
  document_type_code?: string;
  documentTypeLabel?: string;
  document_type_label?: string;
  status?: string;
  analysisStatus?: string;
  analysis_status?: string;
  sourceModule?: string;
  source_module?: string;
  confidentialityLevel?: string;
  confidentiality_level?: string;
  employeeId?: string;
  employee_id?: string;
  employeeName?: string;
  employee_name?: string;
  requiresAcknowledgement?: boolean;
  requires_acknowledgement?: boolean;
  nextAction?: string;
  next_action?: string;
  updatedAt?: string;
  updated_at?: string;
  lastAnalysisAt?: string;
  last_analysis_at?: string;
  latestRunStatus?: string;
  latest_run_status?: string;
  latestConfidenceScore?: number | null;
  latest_confidence_score?: number | null;
}

interface DocumentAnalysisFieldDto {
  fieldName?: string;
  field_name?: string;
  fieldLabel?: string;
  field_label?: string;
  fieldType?: string;
  field_type?: string;
  fieldValueText?: string;
  field_value_text?: string;
  fieldValueDate?: string;
  field_value_date?: string;
  fieldValueNumber?: number | null;
  field_value_number?: number | null;
  fieldValueBoolean?: boolean | null;
  field_value_boolean?: boolean | null;
  normalizedValue?: string;
  normalized_value?: string;
  confidenceScore?: number | null;
  confidence_score?: number | null;
  sourcePage?: number | null;
  source_page?: number | null;
  isValidated?: boolean;
  is_validated?: boolean;
}

interface DocumentAnalysisRunDto {
  id?: string;
  reference?: string;
  documentId?: string;
  document_id?: string;
  documentVersionId?: string;
  document_version_id?: string;
  pipelineStage?: string;
  pipeline_stage?: string;
  analysisStatus?: string;
  analysis_status?: string;
  providerName?: string;
  provider_name?: string;
  modelName?: string;
  model_name?: string;
  classifiedDocumentType?: string;
  classified_document_type?: string;
  confidenceScore?: number | null;
  confidence_score?: number | null;
  summaryText?: string;
  summary_text?: string;
  errorCode?: string;
  error_code?: string;
  errorMessage?: string;
  error_message?: string;
  fields?: DocumentAnalysisFieldDto[];
  startedAt?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface DocumentAnalysisSummaryDto {
  runs?: DocumentAnalysisRunDto[];
}

interface DocumentAuditLogDto {
  id?: string;
  reference?: string;
  action?: string;
  actor?: string;
  happenedAt?: string;
  happened_at?: string;
  date?: string;
  statusBefore?: string;
  status_before?: string;
  statusAfter?: string;
  status_after?: string;
  detail?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationDto {
  id?: string;
  deliveryId?: string;
  delivery_id?: string;
  recipientUsername?: string;
  recipient_username?: string;
  title?: string;
  message?: string;
  body?: string;
  category?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  created_at?: string;
  readAt?: string;
  read_at?: string;
  isRead?: boolean;
  is_read?: boolean;
}

interface DocumentRequestDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  documentType?: string;
  document_type?: string;
  type?: string;
  requesterName?: string;
  requester_name?: string;
  requester?: string;
  employee?: string;
  agent?: string;
  requesterUsername?: string;
  requester_username?: string;
  username?: string;
  purpose?: string;
  reason?: string;
  neededBy?: string;
  needed_by?: string;
  dueDate?: string;
  due_date?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  requestedAt?: string;
  requested_at?: string;
  decidedAt?: string;
  decided_at?: string;
  decisionAt?: string;
  decision_at?: string;
  decidedBy?: string;
  decided_by?: string;
  managerDecisionBy?: string;
  manager_decision_by?: string;
  decisionComment?: string;
  decision_comment?: string;
  decisionReason?: string;
  decision_reason?: string;
  comment?: string;
  note?: string;
}

interface DocumentOverdueDto {
  reference?: string;
  title?: string;
  type?: string;
  status?: string;
  deliveryStatus?: string;
  delivery_status?: string;
  recipientUsername?: string;
  recipient_username?: string;
  assignedEmployeeName?: string;
  assigned_employee_name?: string;
  assignedAt?: string;
  assigned_at?: string;
  assignmentDueAt?: string;
  assignment_due_at?: string;
  reminderAt?: string;
  reminder_at?: string;
  signedBy?: string;
  signed_by?: string;
  verificationCode?: string;
  verification_code?: string;
  overdueHours?: number;
  overdue_hours?: number;
  overdueDays?: number;
  overdue_days?: number;
}

interface DocumentAnalyticsDto {
  generatedAt?: string;
  generated_at?: string;
  totals?: Record<string, unknown>;
  rates?: Record<string, unknown>;
  sla?: Record<string, unknown>;
  notifications?: Record<string, unknown>;
  statusBreakdown?: Array<Record<string, unknown>>;
  status_breakdown?: Array<Record<string, unknown>>;
  typeBreakdown?: Array<Record<string, unknown>>;
  type_breakdown?: Array<Record<string, unknown>>;
  overduePreview?: DocumentOverdueDto[];
  overdue_preview?: DocumentOverdueDto[];
}

interface DocumentArchiveRunDto {
  generatedAt?: string;
  generated_at?: string;
  dryRun?: boolean;
  dry_run?: boolean;
  criteria?: Record<string, unknown>;
  candidatesCount?: number;
  candidates_count?: number;
  archivedCount?: number;
  archived_count?: number;
  candidates?: Array<Record<string, unknown>>;
}

interface DocumentArchivePurgeDto {
  generatedAt?: string;
  generated_at?: string;
  dryRun?: boolean;
  dry_run?: boolean;
  criteria?: Record<string, unknown>;
  candidatesCount?: number;
  candidates_count?: number;
  purged?: Record<string, unknown>;
  references?: string[];
}

@Injectable({ providedIn: 'root' })
export class DocumentsService {
  private readonly localDocumentsKey = 'rh_dev_documents_library';
  private readonly localDocumentRequestsKey = 'rh_dev_document_requests';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getDocuments(query?: DocumentsQuery): Observable<DocumentItem[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      typeCode: query?.typeCode,
      owner: query?.owner,
      sourceModule: query?.sourceModule,
      analysisStatus: query?.analysisStatus,
      confidentialityLevel: query?.confidentialityLevel,
      linkEntityType: query?.linkEntityType,
      linkEntityId: query?.linkEntityId,
    });

    return this.apiClient
      .get<DocumentItemDto[]>(
        API_ENDPOINTS.documents.library,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDocuments(items)),
        map((items) => this.mergeByKey(items, this.readLocalDocuments(), (item) => item.reference)),
        map((items) => this.applyLocalDocumentsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalDocumentsQuery(this.readLocalDocuments(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createDocument(payload: CreateDocumentPayload): Observable<DocumentItem> {
    const normalizedPayload = this.normalizeCreateDocumentPayload(payload);

    return this.apiClient
      .post<DocumentItemDto, CreateDocumentPayload>(
        API_ENDPOINTS.documents.library,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocument(dto)),
        map((item) => {
          if (item.reference && item.title && item.type && item.owner && item.updatedAt) {
            return item;
          }
          return this.appendLocalDocument(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalDocument(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  updateDocument(reference: string, payload: UpdateDocumentPayload): Observable<DocumentItem> {
    const normalizedReference = String(reference || '').trim();
    const normalizedPayload = this.normalizeUpdateDocumentPayload(payload);

    return this.apiClient
      .put<DocumentItemDto, UpdateDocumentPayload>(
        API_ENDPOINTS.documents.item(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocument(dto)),
        map((item) => {
          if (item.reference && item.title && item.type && item.owner && item.updatedAt) {
            return item;
          }
          return this.updateLocalDocument(normalizedReference, normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.updateLocalDocument(normalizedReference, normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getDocumentTypes(query?: DocumentTypesQuery): Observable<DocumentTypeDefinition[]> {
    const params = buildCollectionQueryParams(query, {
      moduleScope: query?.moduleScope,
      ownerEntityType: query?.ownerEntityType,
      active: typeof query?.active === 'boolean' ? String(query.active) : undefined,
    });

    return this.apiClient
      .get<DocumentTypeDefinitionDto[]>(
        API_ENDPOINTS.documents.types,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeDocumentType(dto)).filter((item) => !!item.code)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  getDocumentRequirements(query?: DocumentRequirementsQuery): Observable<DocumentRequirement[]> {
    const params = buildCollectionQueryParams(query, {
      scope: query?.scope,
      documentTypeCode: query?.documentTypeCode,
      contractType: query?.contractType,
      active: typeof query?.active === 'boolean' ? String(query.active) : undefined,
    });

    return this.apiClient
      .get<DocumentRequirementDto[]>(
        API_ENDPOINTS.documents.requirements,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeDocumentRequirement(dto)).filter((item) => !!item.id)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  getDocumentProcessingQueue(query?: DocumentProcessingQueueQuery): Observable<DocumentProcessingQueueItem[]> {
    const params = buildCollectionQueryParams(query, {
      nextAction: query?.nextAction,
      status: query?.status,
      analysisStatus: query?.analysisStatus,
      sourceModule: query?.sourceModule,
    });

    return this.apiClient
      .get<DocumentProcessingQueueItemDto[]>(
        API_ENDPOINTS.documents.processingQueue,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeDocumentProcessingQueueItem(dto)).filter((item) => !!item.reference)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  getDocumentAnalysis(reference: string): Observable<DocumentAnalysisSummary> {
    const normalizedReference = String(reference || '').trim();

    return this.apiClient
      .get<DocumentAnalysisSummaryDto>(
        API_ENDPOINTS.documents.analysis(normalizedReference),
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocumentAnalysisSummary(dto || {})),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of({ runs: [] });
          }
          return throwError(() => error);
        })
      );
  }

  analyzeDocument(reference: string, payload?: AnalyzeDocumentPayload): Observable<DocumentAnalysisRun> {
    const normalizedReference = String(reference || '').trim();
    const normalizedPayload: AnalyzeDocumentPayload = {
      pipelineStage: this.normalizeOptionalText(payload?.pipelineStage),
      providerName: this.normalizeOptionalText(payload?.providerName),
      modelName: this.normalizeOptionalText(payload?.modelName),
      force: payload?.force === true,
    };

    return this.apiClient
      .post<DocumentAnalysisRunDto, AnalyzeDocumentPayload>(
        API_ENDPOINTS.documents.analyze(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocumentAnalysisRun(dto || {})));
  }

  updateDocumentAnalysisField(
    reference: string,
    runId: string,
    fieldName: string,
    payload: UpdateDocumentAnalysisFieldPayload
  ): Observable<DocumentAnalysisRun> {
    const normalizedReference = String(reference || '').trim();
    const normalizedRunId = String(runId || '').trim();
    const normalizedFieldName = String(fieldName || '').trim();
    const normalizedPayload: UpdateDocumentAnalysisFieldPayload = {
      fieldValueText: payload.fieldValueText == null ? payload.fieldValueText : String(payload.fieldValueText).trim(),
      fieldValueDate: payload.fieldValueDate == null ? payload.fieldValueDate : this.normalizeDateOnly(payload.fieldValueDate),
      fieldValueNumber:
        payload.fieldValueNumber == null || !Number.isFinite(Number(payload.fieldValueNumber))
          ? null
          : Number(payload.fieldValueNumber),
      fieldValueBoolean:
        typeof payload.fieldValueBoolean === 'boolean' ? payload.fieldValueBoolean : null,
      normalizedValue: payload.normalizedValue == null ? payload.normalizedValue : String(payload.normalizedValue).trim(),
      isValidated: typeof payload.isValidated === 'boolean' ? payload.isValidated : undefined,
    };

    return this.apiClient
      .patch<DocumentAnalysisRunDto, UpdateDocumentAnalysisFieldPayload>(
        API_ENDPOINTS.documents.analysisField(normalizedReference, normalizedRunId, normalizedFieldName),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocumentAnalysisRun(dto || {})));
  }

  assignDocument(reference: string, payload: AssignDocumentPayload): Observable<DocumentItem> {
    const normalizedReference = String(reference || '').trim();
    const normalizedPayload = this.normalizeAssignPayload(payload);

    return this.apiClient
      .post<DocumentItemDto, AssignDocumentPayload>(
        API_ENDPOINTS.documents.assign(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocument(dto)));
  }

  signDocument(reference: string, payload?: SignDocumentPayload): Observable<DocumentItem> {
    const normalizedReference = String(reference || '').trim();
    const normalizedPayload = {
      signatoryName: this.normalizeOptionalText(payload?.signatoryName),
      stampLabel: this.normalizeOptionalText(payload?.stampLabel),
    };

    return this.apiClient
      .post<DocumentItemDto, object>(
        API_ENDPOINTS.documents.sign(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocument(dto)));
  }

  getInboxDocuments(query?: DocumentInboxQuery): Observable<DocumentItem[]> {
    const params = buildCollectionQueryParams(query, {
      deliveryStatus: query?.deliveryStatus,
    });

    return this.apiClient
      .get<DocumentItemDto[]>(
        API_ENDPOINTS.documents.inbox,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDocuments(items)),
        map((items) => this.applyLocalInboxQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalInboxQuery(this.readLocalDocuments(), query));
          }
          return throwError(() => error);
        })
      );
  }

  markInboxRead(reference: string): Observable<DocumentItem> {
    const normalizedReference = String(reference || '').trim();
    return this.apiClient
      .post<DocumentItemDto, object>(
        API_ENDPOINTS.documents.inboxRead(normalizedReference),
        {},
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocument(dto)));
  }

  acknowledgeInbox(reference: string, note?: string): Observable<DocumentItem> {
    const normalizedReference = String(reference || '').trim();
    const payload = this.normalizeOptionalText(note) ? { note: String(note || '').trim() } : {};

    return this.apiClient
      .post<DocumentItemDto, object>(
        API_ENDPOINTS.documents.inboxAcknowledge(normalizedReference),
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeDocument(dto)));
  }

  getDocumentRequests(query?: DocumentRequestsQuery): Observable<DocumentRequest[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      requesterUsername: query?.requesterUsername,
      documentType: query?.documentType,
    });

    return this.apiClient
      .get<DocumentRequestDto[]>(
        API_ENDPOINTS.documents.requests,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDocumentRequests(items)),
        map((items) => this.mergeByKey(items, this.readLocalDocumentRequests(), (item) => item.reference)),
        map((items) => this.applyLocalDocumentRequestsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalDocumentRequestsQuery(this.readLocalDocumentRequests(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createDocumentRequest(payload: CreateDocumentRequestPayload): Observable<DocumentRequest> {
    const normalizedPayload = this.normalizeCreateDocumentRequestPayload(payload);

    return this.apiClient
      .post<DocumentRequestDto, CreateDocumentRequestPayload>(
        API_ENDPOINTS.documents.requests,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocumentRequest(dto)),
        map((item) => {
          if (this.isCompleteDocumentRequest(item)) {
            this.upsertLocalDocumentRequest(item);
            return item;
          }
          return this.appendLocalDocumentRequest(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalDocumentRequest(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  decideDocumentRequest(reference: string, payload: DocumentRequestDecisionPayload): Observable<DocumentRequest> {
    const normalizedReference = String(reference || '').trim();
    const normalizedPayload = this.normalizeDocumentRequestDecisionPayload(payload);

    return this.apiClient
      .post<DocumentRequestDto, DocumentRequestDecisionPayload>(
        API_ENDPOINTS.documents.requestDecision(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocumentRequest(dto)),
        map((item) => {
          if (this.isCompleteDocumentRequest(item)) {
            this.upsertLocalDocumentRequest(item);
            return item;
          }

          const localUpdated = this.updateLocalDocumentRequest(normalizedReference, normalizedPayload);
          if (localUpdated) {
            return localUpdated;
          }
          return item;
        }),
        catchError((error) => {
          if (!this.shouldUseLocalFallback(error)) {
            return throwError(() => error);
          }

          const localUpdated = this.updateLocalDocumentRequest(normalizedReference, normalizedPayload);
          if (!localUpdated) {
            return throwError(() => error);
          }
          return of(localUpdated);
        })
      );
  }

  getDocumentAuditLogs(query?: DocumentAuditQuery): Observable<DocumentAuditLogItem[]> {
    const params = buildCollectionQueryParams(query, {
      reference: query?.reference,
      action: query?.action,
      actor: query?.actor,
    });

    return this.apiClient
      .get<DocumentAuditLogDto[]>(
        API_ENDPOINTS.documents.audit,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeAuditLog(dto)).filter((item) => !!item.reference && !!item.action))
      );
  }

  getMyNotifications(query?: NotificationQuery): Observable<NotificationItem[]> {
    const params = buildCollectionQueryParams(query, {
      unreadOnly: query?.unreadOnly ? 'true' : undefined,
      category: query?.category,
    });

    return this.apiClient
      .get<NotificationDto[]>(
        API_ENDPOINTS.notifications.inbox,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeNotification(dto)))
      );
  }

  markNotificationRead(notificationId: string): Observable<NotificationItem> {
    const normalizedId = String(notificationId || '').trim();
    return this.apiClient
      .post<NotificationDto, object>(
        API_ENDPOINTS.notifications.read(normalizedId),
        {},
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeNotification(dto)));
  }

  getDocumentAnalytics(): Observable<DocumentAnalyticsReport> {
    return this.apiClient
      .get<DocumentAnalyticsDto>(
        API_ENDPOINTS.documents.analytics,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDocumentAnalytics(dto || {})),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.emptyDocumentAnalyticsReport());
          }
          return throwError(() => error);
        })
      );
  }

  getOverdueDocuments(query?: DocumentOverdueQuery): Observable<DocumentOverdueItem[]> {
    const params = buildCollectionQueryParams(query, {
      recipientUsername: query?.recipientUsername,
      deliveryStatus: query?.deliveryStatus,
    });

    return this.apiClient
      .get<DocumentOverdueDto[]>(
        API_ENDPOINTS.documents.overdue,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items : [])),
        map((items) => items.map((dto) => this.normalizeDocumentOverdue(dto))),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of([]);
          }
          return throwError(() => error);
        })
      );
  }

  runArchiveCycle(payload?: DocumentArchiveRunPayload): Observable<DocumentArchiveRunResult> {
    const normalizedPayload = {
      olderThanDays: this.toStrictPositiveInt(payload?.olderThanDays, 30),
      dryRun: payload?.dryRun !== false,
      onlyAcknowledged: payload?.onlyAcknowledged !== false,
      includeUnassigned: payload?.includeUnassigned === true,
    };

    return this.apiClient
      .post<DocumentArchiveRunDto, object>(
        API_ENDPOINTS.documents.archiveRun,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeArchiveRunResult(dto || {})));
  }

  purgeArchivedDocuments(payload?: DocumentArchivePurgePayload): Observable<DocumentArchivePurgeResult> {
    const normalizedPayload = {
      retentionDays: this.toStrictPositiveInt(payload?.retentionDays, 120),
      dryRun: payload?.dryRun !== false,
      includeNotifications: payload?.includeNotifications !== false,
    };

    return this.apiClient
      .post<DocumentArchivePurgeDto, object>(
        API_ENDPOINTS.documents.purgeArchives,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(map((dto) => this.normalizeArchivePurgeResult(dto || {})));
  }

  private shouldUseLocalFallback(error: unknown): boolean {
    if (!this.fallbackEnabled) {
      return false;
    }

    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }

    return error.status === 0 || error.status >= 500 || error.status === 404;
  }

  private mapDocuments(items: DocumentItemDto[]): DocumentItem[] {
    return items
      .map((dto) => this.normalizeDocument(dto))
      .filter((item) => !!item.reference && !!item.title && !!item.type && !!item.owner && !!item.updatedAt);
  }

  private normalizeDocument(dto: DocumentItemDto): DocumentItem {
    const reference = toStringValue(readField(dto, ['reference', 'docRef', 'doc_ref'], '')).trim();
    const title = toStringValue(readField(dto, ['title', 'name'], '')).trim();
    const type = toStringValue(readField(dto, ['type', 'category'], '')).trim();
    const owner = toStringValue(readField(dto, ['owner', 'ownerName', 'owner_name'], '')).trim();
    const updatedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
      new Date().toISOString()
    );
    const status = toStringValue(readField(dto, ['status'], 'Brouillon')).trim() || 'Brouillon';

    const employeeName =
      toStringValue(readField(dto, ['employeeName', 'employee_name', 'employee', 'agent'], '')).trim() || owner;

    const issuedAtFallback = this.toDateOnly(updatedAt);
    const assignedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['assignedAt', 'assigned_at'], '')).trim(),
      ''
    );
    const assignmentDueAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['assignmentDueAt', 'assignment_due_at', 'dueAt', 'due_at'], '')).trim(),
      ''
    );
    const reminderAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['reminderAt', 'reminder_at'], '')).trim(),
      ''
    );
    const reminderSentAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['reminderSentAt', 'reminder_sent_at'], '')).trim(),
      ''
    );
    const readAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['readAt', 'read_at'], '')).trim(),
      ''
    );
    const acknowledgedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['acknowledgedAt', 'acknowledged_at'], '')).trim(),
      ''
    );
    const signedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['signedAt', 'signed_at'], '')).trim(),
      ''
    );

    return {
      reference,
      title,
      type,
      documentTypeCode: toStringValue(readField(dto, ['documentTypeCode', 'document_type_code'], '')).trim(),
      documentTypeLabel: toStringValue(readField(dto, ['documentTypeLabel', 'document_type_label'], '')).trim(),
      owner,
      updatedAt,
      status,
      employeeName,
      employeeId: toStringValue(readField(dto, ['employeeId', 'employee_id', 'matricule'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction'], '')).trim(),
      unit: toStringValue(readField(dto, ['unit'], '')).trim(),
      sourceModule: toStringValue(readField(dto, ['sourceModule', 'source_module'], '')).trim(),
      sourceRecordId: toStringValue(readField(dto, ['sourceRecordId', 'source_record_id'], '')).trim(),
      confidentialityLevel: toStringValue(
        readField(dto, ['confidentialityLevel', 'confidentiality_level'], '')
      ).trim(),
      requiresAcknowledgement: this.toBoolean(
        readField(dto, ['requiresAcknowledgement', 'requires_acknowledgement'], false),
        false
      ),
      issuedAt:
        this.normalizeDateOnly(
          toStringValue(readField(dto, ['issuedAt', 'issued_at', 'issueDate', 'issue_date'], '')).trim()
        ) || issuedAtFallback,
      startDate: this.normalizeDateOnly(toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim()),
      endDate: this.normalizeDateOnly(toStringValue(readField(dto, ['endDate', 'end_date'], '')).trim()),
      expiresOn: this.normalizeDateOnly(toStringValue(readField(dto, ['expiresOn', 'expires_on'], '')).trim()),
      approver: toStringValue(readField(dto, ['approver', 'validator'], '')).trim(),
      missionDestination: toStringValue(
        readField(dto, ['missionDestination', 'mission_destination', 'destination'], '')
      ).trim(),
      missionPurpose: toStringValue(readField(dto, ['missionPurpose', 'mission_purpose', 'purpose'], '')).trim(),
      absenceReason: toStringValue(readField(dto, ['absenceReason', 'absence_reason', 'reason'], '')).trim(),
      notes: toStringValue(readField(dto, ['notes'], '')).trim(),
      assignedEmployeeId: toStringValue(
        readField(dto, ['assignedEmployeeId', 'assigned_employee_id', 'assigneeId', 'assignee_id'], '')
      ).trim(),
      assignedEmployeeName: toStringValue(
        readField(dto, ['assignedEmployeeName', 'assigned_employee_name', 'assigneeName', 'assignee_name'], '')
      ).trim(),
      recipientUsername: toStringValue(
        readField(dto, ['recipientUsername', 'recipient_username', 'recipient'], '')
      ).trim().toLowerCase(),
      assignmentNote: toStringValue(readField(dto, ['assignmentNote', 'assignment_note', 'note'], '')).trim(),
      deliveryStatus: this.normalizeDeliveryStatus(
        readField(dto, ['deliveryStatus', 'delivery_status', 'assignmentStatus', 'assignment_status'], ''),
        assignedAt
      ),
      assignedAt,
      assignedBy: toStringValue(readField(dto, ['assignedBy', 'assigned_by'], '')).trim().toLowerCase(),
      assignmentDueAt,
      reminderAt,
      reminderSentAt,
      readAt,
      acknowledgedAt,
      acknowledgedBy: toStringValue(readField(dto, ['acknowledgedBy', 'acknowledged_by'], '')).trim().toLowerCase(),
      signedAt,
      signedBy: toStringValue(readField(dto, ['signedBy', 'signed_by', 'signatoryName', 'signatory_name'], '')).trim(),
      stampLabel: toStringValue(readField(dto, ['stampLabel', 'stamp_label'], '')).trim(),
      signatureHash: toStringValue(readField(dto, ['signatureHash', 'signature_hash'], '')).trim(),
      verificationCode: toStringValue(readField(dto, ['verificationCode', 'verification_code'], '')).trim().toUpperCase(),
      analysisStatus: toStringValue(readField(dto, ['analysisStatus', 'analysis_status'], '')).trim(),
      lastAnalysisAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['lastAnalysisAt', 'last_analysis_at'], '')).trim(),
        ''
      ),
      links: this.normalizeDocumentLinks(readField(dto, ['links'], [])),
    };
  }

  private normalizeDocumentLinks(raw: unknown): DocumentLink[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .map((item) => {
        const dto = this.asRecord(item) as DocumentLinkDto;
        return {
          entityType: toStringValue(readField(dto, ['entityType', 'entity_type'], '')).trim(),
          entityId: toStringValue(readField(dto, ['entityId', 'entity_id'], '')).trim(),
          linkRole: toStringValue(readField(dto, ['linkRole', 'link_role'], '')).trim(),
        };
      })
      .filter((item) => !!item.entityType && !!item.entityId);
  }

  private normalizeDocumentType(dto: DocumentTypeDefinitionDto): DocumentTypeDefinition {
    const defaultValidityRaw = readField(dto, ['defaultValidityDays', 'default_validity_days'], null);
    const retentionRaw = readField(dto, ['retentionDays', 'retention_days'], null);
    const defaultValidity = defaultValidityRaw == null ? null : this.toFiniteNumber(defaultValidityRaw, 0);
    const retentionDays = retentionRaw == null ? null : this.toFiniteNumber(retentionRaw, 0);

    return {
      id: toStringValue(readField(dto, ['id'], '')).trim(),
      code: toStringValue(readField(dto, ['code'], '')).trim(),
      label: toStringValue(readField(dto, ['label'], '')).trim(),
      moduleScope: toStringValue(readField(dto, ['moduleScope', 'module_scope'], '')).trim(),
      ownerEntityType: toStringValue(readField(dto, ['ownerEntityType', 'owner_entity_type'], '')).trim(),
      requiresExpiry: this.toBoolean(readField(dto, ['requiresExpiry', 'requires_expiry'], false), false),
      requiresSignature: this.toBoolean(readField(dto, ['requiresSignature', 'requires_signature'], false), false),
      requiresDispatch: this.toBoolean(readField(dto, ['requiresDispatch', 'requires_dispatch'], false), false),
      isSensitive: this.toBoolean(readField(dto, ['isSensitive', 'is_sensitive'], false), false),
      defaultValidityDays: defaultValidity,
      retentionDays,
      isActive: this.toBoolean(readField(dto, ['isActive', 'is_active'], true), true),
    };
  }

  private normalizeDocumentRequirement(dto: DocumentRequirementDto): DocumentRequirement {
    return {
      id: toStringValue(readField(dto, ['id'], '')).trim(),
      requirementCode: toStringValue(readField(dto, ['requirementCode', 'requirement_code'], '')).trim(),
      documentTypeCode: toStringValue(readField(dto, ['documentTypeCode', 'document_type_code'], '')).trim(),
      documentTypeLabel: toStringValue(readField(dto, ['documentTypeLabel', 'document_type_label'], '')).trim(),
      requirementScope: toStringValue(readField(dto, ['requirementScope', 'requirement_scope'], '')).trim(),
      contractType: toStringValue(readField(dto, ['contractType', 'contract_type'], '')).trim(),
      isMandatory: this.toBoolean(readField(dto, ['isMandatory', 'is_mandatory'], false), false),
      warningOffsetDays: this.toFiniteNumber(readField(dto, ['warningOffsetDays', 'warning_offset_days'], 0), 0),
      dueOffsetDays: this.toFiniteNumber(readField(dto, ['dueOffsetDays', 'due_offset_days'], 0), 0),
      isActive: this.toBoolean(readField(dto, ['isActive', 'is_active'], true), true),
    };
  }

  private normalizeDocumentProcessingQueueItem(
    dto: DocumentProcessingQueueItemDto
  ): DocumentProcessingQueueItem {
    const latestConfidenceRaw = readField(dto, ['latestConfidenceScore', 'latest_confidence_score'], null);
    return {
      reference: toStringValue(readField(dto, ['reference'], '')).trim(),
      title: toStringValue(readField(dto, ['title'], '')).trim(),
      documentTypeCode: toStringValue(readField(dto, ['documentTypeCode', 'document_type_code'], '')).trim(),
      documentTypeLabel: toStringValue(readField(dto, ['documentTypeLabel', 'document_type_label'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], '')).trim(),
      analysisStatus: toStringValue(readField(dto, ['analysisStatus', 'analysis_status'], '')).trim(),
      sourceModule: toStringValue(readField(dto, ['sourceModule', 'source_module'], '')).trim(),
      confidentialityLevel: toStringValue(
        readField(dto, ['confidentialityLevel', 'confidentiality_level'], '')
      ).trim(),
      employeeId: toStringValue(readField(dto, ['employeeId', 'employee_id'], '')).trim(),
      employeeName: toStringValue(readField(dto, ['employeeName', 'employee_name'], '')).trim(),
      requiresAcknowledgement: this.toBoolean(
        readField(dto, ['requiresAcknowledgement', 'requires_acknowledgement'], false),
        false
      ),
      nextAction: toStringValue(readField(dto, ['nextAction', 'next_action'], 'NONE')).trim() || 'NONE',
      updatedAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
        new Date().toISOString()
      ),
      lastAnalysisAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['lastAnalysisAt', 'last_analysis_at'], '')).trim(),
        ''
      ),
      latestRunStatus: toStringValue(readField(dto, ['latestRunStatus', 'latest_run_status'], '')).trim(),
      latestConfidenceScore:
        latestConfidenceRaw == null ? null : this.toFiniteNumber(latestConfidenceRaw, 0),
    };
  }

  private normalizeDocumentAnalysisSummary(dto: DocumentAnalysisSummaryDto): DocumentAnalysisSummary {
    const runsRaw = readField(dto, ['runs'], []);
    const runs = Array.isArray(runsRaw)
      ? runsRaw.map((item) => this.normalizeDocumentAnalysisRun(item as DocumentAnalysisRunDto))
      : [];
    return { runs };
  }

  private normalizeDocumentAnalysisRun(dto: DocumentAnalysisRunDto): DocumentAnalysisRun {
    const fieldsRaw = readField(dto, ['fields'], []);
    return {
      id: toStringValue(readField(dto, ['id'], '')).trim(),
      reference: toStringValue(readField(dto, ['reference'], '')).trim(),
      documentId: toStringValue(readField(dto, ['documentId', 'document_id'], '')).trim(),
      documentVersionId: toStringValue(
        readField(dto, ['documentVersionId', 'document_version_id'], '')
      ).trim(),
      pipelineStage: toStringValue(readField(dto, ['pipelineStage', 'pipeline_stage'], '')).trim(),
      analysisStatus: toStringValue(readField(dto, ['analysisStatus', 'analysis_status'], '')).trim(),
      providerName: toStringValue(readField(dto, ['providerName', 'provider_name'], '')).trim(),
      modelName: toStringValue(readField(dto, ['modelName', 'model_name'], '')).trim(),
      classifiedDocumentType: toStringValue(
        readField(dto, ['classifiedDocumentType', 'classified_document_type'], '')
      ).trim(),
      confidenceScore: this.toNullableFiniteNumber(
        readField(dto, ['confidenceScore', 'confidence_score'], null)
      ),
      summaryText: toStringValue(readField(dto, ['summaryText', 'summary_text'], '')).trim(),
      errorCode: toStringValue(readField(dto, ['errorCode', 'error_code'], '')).trim(),
      errorMessage: toStringValue(readField(dto, ['errorMessage', 'error_message'], '')).trim(),
      fields: Array.isArray(fieldsRaw)
        ? fieldsRaw.map((item) => this.normalizeDocumentAnalysisField(item as DocumentAnalysisFieldDto))
        : [],
      startedAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['startedAt', 'started_at'], '')).trim(),
        ''
      ),
      completedAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['completedAt', 'completed_at'], '')).trim(),
        ''
      ),
      createdAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['createdAt', 'created_at'], '')).trim(),
        ''
      ),
      updatedAt: this.normalizeIsoDateString(
        toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
        ''
      ),
    };
  }

  private normalizeDocumentAnalysisField(dto: DocumentAnalysisFieldDto): DocumentAnalysisField {
    const fieldValueBooleanRaw = readField(dto, ['fieldValueBoolean', 'field_value_boolean'], null);
    return {
      fieldName: toStringValue(readField(dto, ['fieldName', 'field_name'], '')).trim(),
      fieldLabel: toStringValue(readField(dto, ['fieldLabel', 'field_label'], '')).trim(),
      fieldType: toStringValue(readField(dto, ['fieldType', 'field_type'], '')).trim(),
      fieldValueText: toStringValue(readField(dto, ['fieldValueText', 'field_value_text'], '')).trim(),
      fieldValueDate: this.normalizeDateOnly(
        toStringValue(readField(dto, ['fieldValueDate', 'field_value_date'], '')).trim()
      ),
      fieldValueNumber: this.toNullableFiniteNumber(
        readField(dto, ['fieldValueNumber', 'field_value_number'], null)
      ),
      fieldValueBoolean: typeof fieldValueBooleanRaw === 'boolean' ? fieldValueBooleanRaw : null,
      normalizedValue: toStringValue(readField(dto, ['normalizedValue', 'normalized_value'], '')).trim(),
      confidenceScore: this.toNullableFiniteNumber(
        readField(dto, ['confidenceScore', 'confidence_score'], null)
      ),
      sourcePage: this.toNullableFiniteNumber(readField(dto, ['sourcePage', 'source_page'], null)),
      isValidated: this.toBoolean(readField(dto, ['isValidated', 'is_validated'], false), false),
    };
  }

  private normalizeAuditLog(dto: DocumentAuditLogDto): DocumentAuditLogItem {
    const happenedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['happenedAt', 'happened_at', 'date'], '')).trim(),
      new Date().toISOString()
    );

    const metadataRaw = readField(dto, ['metadata'], {});
    const metadataSource = metadataRaw && typeof metadataRaw === 'object' && !Array.isArray(metadataRaw)
      ? (metadataRaw as Record<string, unknown>)
      : {};
    const metadata = Object.entries(metadataSource).reduce<Record<string, string>>((acc, [key, value]) => {
      const normalizedKey = String(key || '').trim();
      if (!normalizedKey) {
        return acc;
      }
      acc[normalizedKey] = String(value ?? '').trim();
      return acc;
    }, {});

    return {
      id: toStringValue(readField(dto, ['id'], '')).trim(),
      reference: toStringValue(readField(dto, ['reference'], '')).trim(),
      action: toStringValue(readField(dto, ['action'], '')).trim(),
      actor: toStringValue(readField(dto, ['actor'], '')).trim().toLowerCase(),
      happenedAt,
      statusBefore: toStringValue(readField(dto, ['statusBefore', 'status_before'], '')).trim(),
      statusAfter: toStringValue(readField(dto, ['statusAfter', 'status_after'], '')).trim(),
      detail: toStringValue(readField(dto, ['detail', 'description'], '')).trim(),
      metadata,
    };
  }

  private normalizeNotification(dto: NotificationDto): NotificationItem {
    const createdAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['createdAt', 'created_at'], '')).trim(),
      new Date().toISOString()
    );
    const readAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['readAt', 'read_at'], '')).trim(),
      ''
    );
    const metadataRaw = readField(dto, ['metadata'], {});
    const metadataSource = metadataRaw && typeof metadataRaw === 'object' && !Array.isArray(metadataRaw)
      ? (metadataRaw as Record<string, unknown>)
      : {};
    const metadata = Object.entries(metadataSource).reduce<Record<string, string>>((acc, [key, value]) => {
      const normalizedKey = String(key || '').trim();
      if (!normalizedKey) {
        return acc;
      }
      acc[normalizedKey] = String(value ?? '').trim();
      return acc;
    }, {});

    const readFlag = readField(dto, ['isRead', 'is_read'], false);
    const isRead = typeof readFlag === 'boolean' ? readFlag : String(readFlag || '').trim().toLowerCase() === 'true';

    return {
      id: toStringValue(readField(dto, ['id'], '')).trim(),
      deliveryId: toStringValue(readField(dto, ['deliveryId', 'delivery_id'], '')).trim(),
      recipientUsername: toStringValue(readField(dto, ['recipientUsername', 'recipient_username'], '')).trim().toLowerCase(),
      title: toStringValue(readField(dto, ['title'], '')).trim(),
      message: toStringValue(readField(dto, ['message', 'body'], '')).trim(),
      category: toStringValue(readField(dto, ['category'], '')).trim(),
      reference: toStringValue(readField(dto, ['reference'], '')).trim().toUpperCase(),
      metadata,
      createdAt,
      readAt,
      isRead,
    };
  }

  private mapDocumentRequests(items: DocumentRequestDto[]): DocumentRequest[] {
    return items
      .map((dto) => this.normalizeDocumentRequest(dto))
      .filter((item) => this.isCompleteDocumentRequest(item));
  }

  private normalizeDocumentRequest(dto: DocumentRequestDto): DocumentRequest {
    return {
      reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')).trim(),
      documentType: toStringValue(readField(dto, ['documentType', 'document_type', 'type'], '')).trim(),
      requesterName: toStringValue(
        readField(dto, ['requesterName', 'requester_name', 'requester', 'employee', 'agent'], '')
      ).trim(),
      requesterUsername: toStringValue(
        readField(dto, ['requesterUsername', 'requester_username', 'username'], '')
      )
        .trim()
        .toLowerCase(),
      purpose: toStringValue(readField(dto, ['purpose', 'reason'], '')).trim(),
      neededBy: toStringValue(readField(dto, ['neededBy', 'needed_by', 'dueDate', 'due_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Soumise')).trim() || 'Soumise',
      createdAt: toStringValue(readField(dto, ['createdAt', 'created_at', 'requestedAt', 'requested_at'], '')).trim(),
      decidedAt: toStringValue(readField(dto, ['decidedAt', 'decided_at', 'decisionAt', 'decision_at'], '')).trim(),
      decidedBy: toStringValue(
        readField(dto, ['decidedBy', 'decided_by', 'managerDecisionBy', 'manager_decision_by'], '')
      ).trim(),
      decisionComment: toStringValue(
        readField(
          dto,
          ['decisionComment', 'decision_comment', 'decisionReason', 'decision_reason', 'comment', 'note'],
          ''
        )
      ).trim(),
    };
  }

  private isCompleteDocumentRequest(item: DocumentRequest): boolean {
    return !!item.reference && !!item.documentType && !!item.requesterName && !!item.purpose && !!item.createdAt;
  }

  private normalizeDocumentOverdue(dto: DocumentOverdueDto): DocumentOverdueItem {
    const assignedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['assignedAt', 'assigned_at'], '')).trim(),
      ''
    );
    const assignmentDueAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['assignmentDueAt', 'assignment_due_at'], '')).trim(),
      ''
    );
    const reminderAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['reminderAt', 'reminder_at'], '')).trim(),
      ''
    );
    const overdueHoursRaw = Number(readField(dto, ['overdueHours', 'overdue_hours'], 0) as number);
    const overdueDaysRaw = Number(readField(dto, ['overdueDays', 'overdue_days'], 0) as number);

    return {
      reference: toStringValue(readField(dto, ['reference'], '')).trim().toUpperCase(),
      title: toStringValue(readField(dto, ['title'], '')).trim(),
      type: toStringValue(readField(dto, ['type'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], '')).trim(),
      deliveryStatus: toStringValue(readField(dto, ['deliveryStatus', 'delivery_status'], '')).trim(),
      recipientUsername: toStringValue(readField(dto, ['recipientUsername', 'recipient_username'], '')).trim().toLowerCase(),
      assignedEmployeeName: toStringValue(readField(dto, ['assignedEmployeeName', 'assigned_employee_name'], '')).trim(),
      assignedAt,
      assignmentDueAt,
      reminderAt,
      signedBy: toStringValue(readField(dto, ['signedBy', 'signed_by'], '')).trim(),
      verificationCode: toStringValue(readField(dto, ['verificationCode', 'verification_code'], '')).trim().toUpperCase(),
      overdueHours: Number.isFinite(overdueHoursRaw) ? overdueHoursRaw : 0,
      overdueDays: Number.isFinite(overdueDaysRaw) ? overdueDaysRaw : 0,
    };
  }

  private normalizeDocumentAnalytics(dto: DocumentAnalyticsDto): DocumentAnalyticsReport {
    const generatedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['generatedAt', 'generated_at'], '')).trim(),
      new Date().toISOString()
    );
    const totals = this.asRecord(readField(dto, ['totals'], {}));
    const rates = this.asRecord(readField(dto, ['rates'], {}));
    const sla = this.asRecord(readField(dto, ['sla'], {}));
    const notifications = this.asRecord(readField(dto, ['notifications'], {}));
    const statusBreakdownRaw = readField(dto, ['statusBreakdown', 'status_breakdown'], []);
    const typeBreakdownRaw = readField(dto, ['typeBreakdown', 'type_breakdown'], []);
    const overduePreviewRaw = readField(dto, ['overduePreview', 'overdue_preview'], []);

    const statusBreakdown = Array.isArray(statusBreakdownRaw)
      ? statusBreakdownRaw.map((entry) => {
        const row = this.asRecord(entry);
        return {
          label: String(row['label'] || '').trim(),
          count: this.toFiniteNumber(row['count'], 0),
        };
      }).filter((entry) => entry.label.length > 0)
      : [];

    const typeBreakdown = Array.isArray(typeBreakdownRaw)
      ? typeBreakdownRaw.map((entry) => {
        const row = this.asRecord(entry);
        return {
          label: String(row['label'] || '').trim(),
          count: this.toFiniteNumber(row['count'], 0),
        };
      }).filter((entry) => entry.label.length > 0)
      : [];

    const overduePreview = Array.isArray(overduePreviewRaw)
      ? overduePreviewRaw.map((entry) => this.normalizeDocumentOverdue(this.asRecord(entry) as DocumentOverdueDto))
      : [];

    return {
      generatedAt,
      totals: {
        totalDocuments: this.toFiniteNumber(totals['totalDocuments'], 0),
        signedDocuments: this.toFiniteNumber(totals['signedDocuments'], 0),
        assignedDocuments: this.toFiniteNumber(totals['assignedDocuments'], 0),
        readDocuments: this.toFiniteNumber(totals['readDocuments'], 0),
        acknowledgedDocuments: this.toFiniteNumber(totals['acknowledgedDocuments'], 0),
        pendingAcknowledgements: this.toFiniteNumber(totals['pendingAcknowledgements'], 0),
        overdueDocuments: this.toFiniteNumber(totals['overdueDocuments'], 0),
        dueInNext48h: this.toFiniteNumber(totals['dueInNext48h'], 0),
      },
      rates: {
        acknowledgementRate: this.toFiniteNumber(rates['acknowledgementRate'], 0),
        signatureRate: this.toFiniteNumber(rates['signatureRate'], 0),
      },
      sla: {
        averageAckHours: this.toFiniteNumber(sla['averageAckHours'], 0),
        averageReadHours: this.toFiniteNumber(sla['averageReadHours'], 0),
      },
      notifications: {
        unreadNotifications: this.toFiniteNumber(notifications['unreadNotifications'], 0),
        notificationJobsTotal: this.toFiniteNumber(notifications['notificationJobsTotal'], 0),
        notificationJobsSent: this.toFiniteNumber(notifications['notificationJobsSent'], 0),
        notificationJobsRetry: this.toFiniteNumber(notifications['notificationJobsRetry'], 0),
        notificationJobsFailed: this.toFiniteNumber(notifications['notificationJobsFailed'], 0),
      },
      statusBreakdown,
      typeBreakdown,
      overduePreview,
    };
  }

  private emptyDocumentAnalyticsReport(): DocumentAnalyticsReport {
    return {
      generatedAt: new Date().toISOString(),
      totals: {
        totalDocuments: 0,
        signedDocuments: 0,
        assignedDocuments: 0,
        readDocuments: 0,
        acknowledgedDocuments: 0,
        pendingAcknowledgements: 0,
        overdueDocuments: 0,
        dueInNext48h: 0,
      },
      rates: {
        acknowledgementRate: 0,
        signatureRate: 0,
      },
      sla: {
        averageAckHours: 0,
        averageReadHours: 0,
      },
      notifications: {
        unreadNotifications: 0,
        notificationJobsTotal: 0,
        notificationJobsSent: 0,
        notificationJobsRetry: 0,
        notificationJobsFailed: 0,
      },
      statusBreakdown: [],
      typeBreakdown: [],
      overduePreview: [],
    };
  }

  private normalizeArchiveRunResult(dto: DocumentArchiveRunDto): DocumentArchiveRunResult {
    const generatedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['generatedAt', 'generated_at'], '')).trim(),
      new Date().toISOString()
    );
    const criteria = this.asRecord(readField(dto, ['criteria'], {}));
    const candidatesRaw = readField(dto, ['candidates'], []);
    const candidates = Array.isArray(candidatesRaw)
      ? candidatesRaw.map((entry) => {
        const row = this.asRecord(entry);
        return {
          reference: String(row['reference'] || '').trim().toUpperCase(),
          title: String(row['title'] || '').trim(),
          status: String(row['status'] || '').trim(),
          deliveryStatus: String(row['deliveryStatus'] || '').trim(),
          ageDays: this.toFiniteNumber(row['ageDays'], 0),
          eligibleFrom: this.normalizeIsoDateString(row['eligibleFrom'], ''),
        };
      })
      : [];

    return {
      generatedAt,
      dryRun: this.toBoolean(readField(dto, ['dryRun', 'dry_run'], true), true),
      criteria: {
        olderThanDays: this.toFiniteNumber(criteria['olderThanDays'], 30),
        onlyAcknowledged: this.toBoolean(criteria['onlyAcknowledged'], true),
        includeUnassigned: this.toBoolean(criteria['includeUnassigned'], false),
      },
      candidatesCount: this.toFiniteNumber(readField(dto, ['candidatesCount', 'candidates_count'], 0), 0),
      archivedCount: this.toFiniteNumber(readField(dto, ['archivedCount', 'archived_count'], 0), 0),
      candidates,
    };
  }

  private normalizeArchivePurgeResult(dto: DocumentArchivePurgeDto): DocumentArchivePurgeResult {
    const generatedAt = this.normalizeIsoDateString(
      toStringValue(readField(dto, ['generatedAt', 'generated_at'], '')).trim(),
      new Date().toISOString()
    );
    const criteria = this.asRecord(readField(dto, ['criteria'], {}));
    const purged = this.asRecord(readField(dto, ['purged'], {}));
    const refsRaw = readField(dto, ['references'], []);
    const references = Array.isArray(refsRaw)
      ? refsRaw.map((value) => String(value || '').trim().toUpperCase()).filter((value) => value.length > 0)
      : [];

    return {
      generatedAt,
      dryRun: this.toBoolean(readField(dto, ['dryRun', 'dry_run'], true), true),
      criteria: {
        retentionDays: this.toFiniteNumber(criteria['retentionDays'], 120),
        includeNotifications: this.toBoolean(criteria['includeNotifications'], true),
      },
      candidatesCount: this.toFiniteNumber(readField(dto, ['candidatesCount', 'candidates_count'], 0), 0),
      purged: {
        documents: this.toFiniteNumber(purged['documents'], 0),
        dispatches: this.toFiniteNumber(purged['dispatches'], 0),
        auditLogs: this.toFiniteNumber(purged['auditLogs'], 0),
        notificationsInbox: this.toFiniteNumber(purged['notificationsInbox'], 0),
        notificationsJobs: this.toFiniteNumber(purged['notificationsJobs'], 0),
      },
      references,
    };
  }

  private normalizeCreateDocumentPayload(payload: CreateDocumentPayload): CreateDocumentPayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      documentTypeCode: this.normalizeOptionalText(payload.documentTypeCode)?.toUpperCase(),
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId),
      direction: this.normalizeOptionalText(payload.direction),
      unit: this.normalizeOptionalText(payload.unit),
      sourceModule: this.normalizeOptionalText(payload.sourceModule)?.toUpperCase(),
      sourceRecordId: this.normalizeOptionalText(payload.sourceRecordId),
      confidentialityLevel: this.normalizeOptionalText(payload.confidentialityLevel)?.toUpperCase(),
      requiresAcknowledgement: payload.requiresAcknowledgement === true,
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
      expiresOn: this.normalizeDateOnly(payload.expiresOn),
      approver: this.normalizeOptionalText(payload.approver),
      missionDestination: this.normalizeOptionalText(payload.missionDestination),
      missionPurpose: this.normalizeOptionalText(payload.missionPurpose),
      absenceReason: this.normalizeOptionalText(payload.absenceReason),
      notes: this.normalizeOptionalText(payload.notes),
    };
  }

  private normalizeUpdateDocumentPayload(payload: UpdateDocumentPayload): UpdateDocumentPayload {
    return {
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      documentTypeCode: this.normalizeOptionalText(payload.documentTypeCode)?.toUpperCase(),
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId),
      direction: this.normalizeOptionalText(payload.direction),
      unit: this.normalizeOptionalText(payload.unit),
      sourceModule: this.normalizeOptionalText(payload.sourceModule)?.toUpperCase(),
      sourceRecordId: this.normalizeOptionalText(payload.sourceRecordId),
      confidentialityLevel: this.normalizeOptionalText(payload.confidentialityLevel)?.toUpperCase(),
      requiresAcknowledgement: payload.requiresAcknowledgement === true,
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
      expiresOn: this.normalizeDateOnly(payload.expiresOn),
      approver: this.normalizeOptionalText(payload.approver),
      missionDestination: this.normalizeOptionalText(payload.missionDestination),
      missionPurpose: this.normalizeOptionalText(payload.missionPurpose),
      absenceReason: this.normalizeOptionalText(payload.absenceReason),
      notes: this.normalizeOptionalText(payload.notes),
    };
  }

  private normalizeCreateDocumentRequestPayload(
    payload: CreateDocumentRequestPayload
  ): CreateDocumentRequestPayload {
    const normalizedRequesterUsername =
      this.normalizeOptionalText(payload.requesterUsername)?.toLowerCase() || this.currentUsername();

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      documentType: String(payload.documentType || '').trim(),
      requesterName: String(payload.requesterName || '').trim(),
      requesterUsername: normalizedRequesterUsername || undefined,
      purpose: String(payload.purpose || '').trim(),
      neededBy: this.normalizeDateOnly(payload.neededBy),
    };
  }

  private normalizeDocumentRequestDecisionPayload(
    payload: DocumentRequestDecisionPayload
  ): DocumentRequestDecisionPayload {
    const actionRaw = String(payload.action || '').trim().toUpperCase();
    const action: 'APPROUVER' | 'REJETER' = actionRaw === 'REJETER' ? 'REJETER' : 'APPROUVER';

    return {
      action,
      reason: this.normalizeOptionalText(payload.reason),
    };
  }

  private normalizeAssignPayload(payload: AssignDocumentPayload): AssignDocumentPayload {
    return {
      employeeId: String(payload.employeeId || '').trim(),
      employeeName: this.normalizeOptionalText(payload.employeeName),
      recipientUsername: this.normalizeOptionalText(payload.recipientUsername)?.toLowerCase(),
      note: this.normalizeOptionalText(payload.note),
      forceReassign: payload.forceReassign === true,
      assignmentDueAt: this.normalizeIsoDateString(payload.assignmentDueAt, ''),
      reminderAt: this.normalizeIsoDateString(payload.reminderAt, ''),
    };
  }

  private applyLocalDocumentsQuery(items: DocumentItem[], query?: DocumentsQuery): DocumentItem[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const type = (query?.type || '').trim().toLowerCase();
    const typeCode = (query?.typeCode || '').trim().toLowerCase();
    const owner = (query?.owner || '').trim().toLowerCase();
    const sourceModule = (query?.sourceModule || '').trim().toLowerCase();
    const analysisStatus = (query?.analysisStatus || '').trim().toLowerCase();
    const confidentialityLevel = (query?.confidentialityLevel || '').trim().toLowerCase();
    const linkEntityType = (query?.linkEntityType || '').trim().toLowerCase();
    const linkEntityId = (query?.linkEntityId || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (typeCode) {
      next = next.filter((item) => String(item.documentTypeCode || '').toLowerCase().includes(typeCode));
    }
    if (owner) {
      next = next.filter((item) => item.owner.toLowerCase().includes(owner));
    }
    if (sourceModule) {
      next = next.filter((item) => String(item.sourceModule || '').toLowerCase().includes(sourceModule));
    }
    if (analysisStatus) {
      next = next.filter((item) => String(item.analysisStatus || '').toLowerCase().includes(analysisStatus));
    }
    if (confidentialityLevel) {
      next = next.filter((item) =>
        String(item.confidentialityLevel || '').toLowerCase().includes(confidentialityLevel)
      );
    }
    if (linkEntityType || linkEntityId) {
      next = next.filter((item) => {
        const links = Array.isArray(item.links) ? item.links : [];
        return links.some((link) => {
          const entityTypeMatches = !linkEntityType || link.entityType.toLowerCase().includes(linkEntityType);
          const entityIdMatches = !linkEntityId || link.entityId.toLowerCase().includes(linkEntityId);
          return entityTypeMatches && entityIdMatches;
        });
      });
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          String(item.documentTypeCode || '').toLowerCase().includes(search) ||
          String(item.documentTypeLabel || '').toLowerCase().includes(search) ||
          item.owner.toLowerCase().includes(search) ||
          item.updatedAt.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.employeeName.toLowerCase().includes(search) ||
          item.employeeId.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.unit.toLowerCase().includes(search) ||
          String(item.sourceModule || '').toLowerCase().includes(search) ||
          String(item.confidentialityLevel || '').toLowerCase().includes(search) ||
          String(item.analysisStatus || '').toLowerCase().includes(search) ||
          item.issuedAt.toLowerCase().includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.endDate.toLowerCase().includes(search) ||
          String(item.expiresOn || '').toLowerCase().includes(search) ||
          item.approver.toLowerCase().includes(search) ||
          item.missionDestination.toLowerCase().includes(search) ||
          item.missionPurpose.toLowerCase().includes(search) ||
          item.absenceReason.toLowerCase().includes(search) ||
          item.notes.toLowerCase().includes(search) ||
          item.assignedEmployeeId.toLowerCase().includes(search) ||
          item.assignedEmployeeName.toLowerCase().includes(search) ||
          item.recipientUsername.toLowerCase().includes(search) ||
          item.deliveryStatus.toLowerCase().includes(search) ||
          item.assignedBy.toLowerCase().includes(search) ||
          item.assignmentNote.toLowerCase().includes(search) ||
          item.assignmentDueAt.toLowerCase().includes(search) ||
          item.reminderAt.toLowerCase().includes(search) ||
          item.reminderSentAt.toLowerCase().includes(search) ||
          item.signedAt.toLowerCase().includes(search) ||
          item.signedBy.toLowerCase().includes(search) ||
          item.stampLabel.toLowerCase().includes(search) ||
          item.verificationCode.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'updatedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDocumentField(left, sortBy).toLowerCase();
      const rightValue = this.readDocumentField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private applyLocalInboxQuery(items: DocumentItem[], query?: DocumentInboxQuery): DocumentItem[] {
    const username = this.currentUsername();
    if (!username) {
      return [];
    }

    let next = [...items].filter((item) => item.recipientUsername.toLowerCase() === username);
    const deliveryStatus = (query?.deliveryStatus || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (deliveryStatus) {
      next = next.filter((item) => item.deliveryStatus.toLowerCase().includes(deliveryStatus));
    }

    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.employeeName.toLowerCase().includes(search) ||
          item.assignedEmployeeName.toLowerCase().includes(search) ||
          item.deliveryStatus.toLowerCase().includes(search) ||
          item.assignedAt.toLowerCase().includes(search) ||
          item.assignmentDueAt.toLowerCase().includes(search) ||
          item.reminderAt.toLowerCase().includes(search) ||
          item.signedBy.toLowerCase().includes(search) ||
          item.verificationCode.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'assignedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDocumentField(left, sortBy).toLowerCase();
      const rightValue = this.readDocumentField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private applyLocalDocumentRequestsQuery(
    items: DocumentRequest[],
    query?: DocumentRequestsQuery
  ): DocumentRequest[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const requesterUsername = (query?.requesterUsername || '').trim().toLowerCase();
    const documentType = (query?.documentType || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (requesterUsername) {
      next = next.filter((item) => item.requesterUsername.toLowerCase().includes(requesterUsername));
    }
    if (documentType) {
      next = next.filter((item) => item.documentType.toLowerCase().includes(documentType));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.documentType.toLowerCase().includes(search) ||
          item.requesterName.toLowerCase().includes(search) ||
          item.requesterUsername.toLowerCase().includes(search) ||
          item.purpose.toLowerCase().includes(search) ||
          item.neededBy.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.createdAt.toLowerCase().includes(search) ||
          item.decidedBy.toLowerCase().includes(search) ||
          item.decisionComment.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'createdAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDocumentRequestField(left, sortBy);
      const rightValue = this.readDocumentRequestField(right, sortBy);

      if (sortBy === 'createdAt' || sortBy === 'decidedAt') {
        const leftTime = Date.parse(String(leftValue || ''));
        const rightTime = Date.parse(String(rightValue || ''));
        const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
        const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;
        if (safeLeft === safeRight) return 0;
        if (safeLeft < safeRight) return sortOrder === 'asc' ? -1 : 1;
        return sortOrder === 'asc' ? 1 : -1;
      }

      const leftText = String(leftValue || '').toLowerCase();
      const rightText = String(rightValue || '').toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readDocumentField(item: DocumentItem, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'title':
        return item.title;
      case 'type':
        return item.type;
      case 'documentTypeCode':
        return item.documentTypeCode || '';
      case 'owner':
        return item.owner;
      case 'updatedAt':
        return item.updatedAt;
      case 'status':
        return item.status;
      case 'sourceModule':
        return item.sourceModule || '';
      case 'analysisStatus':
        return item.analysisStatus || '';
      case 'confidentialityLevel':
        return item.confidentialityLevel || '';
      case 'employeeName':
        return item.employeeName;
      case 'employeeId':
        return item.employeeId;
      case 'issuedAt':
        return item.issuedAt;
      case 'expiresOn':
        return item.expiresOn || '';
      case 'deliveryStatus':
        return item.deliveryStatus;
      case 'assignedAt':
        return item.assignedAt;
      case 'assignmentDueAt':
        return item.assignmentDueAt;
      case 'signedAt':
        return item.signedAt;
      default:
        return '';
    }
  }

  private readDocumentRequestField(item: DocumentRequest, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'documentType':
        return item.documentType;
      case 'requesterName':
        return item.requesterName;
      case 'requesterUsername':
        return item.requesterUsername;
      case 'purpose':
        return item.purpose;
      case 'neededBy':
        return item.neededBy;
      case 'status':
        return item.status;
      case 'createdAt':
        return item.createdAt;
      case 'decidedAt':
        return item.decidedAt;
      case 'decidedBy':
        return item.decidedBy;
      case 'decisionComment':
        return item.decisionComment;
      default:
        return '';
    }
  }

  private appendLocalDocument(payload: CreateDocumentPayload): DocumentItem {
    const current = this.readLocalDocuments();
    const created: DocumentItem = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDocumentReference(current),
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      documentTypeCode: this.normalizeOptionalText(payload.documentTypeCode)?.toUpperCase() || '',
      documentTypeLabel: '',
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId) || '',
      direction: this.normalizeOptionalText(payload.direction) || '',
      unit: this.normalizeOptionalText(payload.unit) || '',
      sourceModule: this.normalizeOptionalText(payload.sourceModule)?.toUpperCase() || '',
      sourceRecordId: this.normalizeOptionalText(payload.sourceRecordId) || '',
      confidentialityLevel: this.normalizeOptionalText(payload.confidentialityLevel)?.toUpperCase() || '',
      requiresAcknowledgement: payload.requiresAcknowledgement === true,
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
      expiresOn: this.normalizeDateOnly(payload.expiresOn),
      approver: this.normalizeOptionalText(payload.approver) || '',
      missionDestination: this.normalizeOptionalText(payload.missionDestination) || '',
      missionPurpose: this.normalizeOptionalText(payload.missionPurpose) || '',
      absenceReason: this.normalizeOptionalText(payload.absenceReason) || '',
      notes: this.normalizeOptionalText(payload.notes) || '',
      assignedEmployeeId: '',
      assignedEmployeeName: '',
      recipientUsername: '',
      assignmentNote: '',
      deliveryStatus: 'Non assigne',
      assignedAt: '',
      assignedBy: '',
      assignmentDueAt: '',
      reminderAt: '',
      reminderSentAt: '',
      readAt: '',
      acknowledgedAt: '',
      acknowledgedBy: '',
      signedAt: '',
      signedBy: '',
      stampLabel: '',
      signatureHash: '',
      verificationCode: '',
      analysisStatus: 'NOT_REQUESTED',
      lastAnalysisAt: '',
      links: [],
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalDocuments(deduped);
    return created;
  }

  private updateLocalDocument(reference: string, payload: UpdateDocumentPayload): DocumentItem {
    const normalizedReference = String(reference || '').trim();
    const current = this.readLocalDocuments();
    const index = current.findIndex((item) => item.reference === normalizedReference);

    if (index === -1) {
      const createdFromUpdate = this.appendLocalDocument({ ...payload, reference: normalizedReference });
      return createdFromUpdate;
    }

    const existing = current[index];
    const updated: DocumentItem = {
      ...existing,
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      documentTypeCode: this.normalizeOptionalText(payload.documentTypeCode)?.toUpperCase() || existing.documentTypeCode || '',
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId) || '',
      direction: this.normalizeOptionalText(payload.direction) || '',
      unit: this.normalizeOptionalText(payload.unit) || '',
      sourceModule: this.normalizeOptionalText(payload.sourceModule)?.toUpperCase() || existing.sourceModule || '',
      sourceRecordId: this.normalizeOptionalText(payload.sourceRecordId) || existing.sourceRecordId || '',
      confidentialityLevel:
        this.normalizeOptionalText(payload.confidentialityLevel)?.toUpperCase() || existing.confidentialityLevel || '',
      requiresAcknowledgement:
        typeof payload.requiresAcknowledgement === 'boolean'
          ? payload.requiresAcknowledgement
          : existing.requiresAcknowledgement || false,
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
      expiresOn: this.normalizeDateOnly(payload.expiresOn) || existing.expiresOn || '',
      approver: this.normalizeOptionalText(payload.approver) || '',
      missionDestination: this.normalizeOptionalText(payload.missionDestination) || '',
      missionPurpose: this.normalizeOptionalText(payload.missionPurpose) || '',
      absenceReason: this.normalizeOptionalText(payload.absenceReason) || '',
      notes: this.normalizeOptionalText(payload.notes) || '',
      assignedEmployeeId: existing.assignedEmployeeId || '',
      assignedEmployeeName: existing.assignedEmployeeName || '',
      recipientUsername: existing.recipientUsername || '',
      assignmentNote: existing.assignmentNote || '',
      deliveryStatus: existing.deliveryStatus || 'Non assigne',
      assignedAt: existing.assignedAt || '',
      assignedBy: existing.assignedBy || '',
      assignmentDueAt: existing.assignmentDueAt || '',
      reminderAt: existing.reminderAt || '',
      reminderSentAt: existing.reminderSentAt || '',
      readAt: existing.readAt || '',
      acknowledgedAt: existing.acknowledgedAt || '',
      acknowledgedBy: existing.acknowledgedBy || '',
      signedAt: existing.signedAt || '',
      signedBy: existing.signedBy || '',
      stampLabel: existing.stampLabel || '',
      signatureHash: existing.signatureHash || '',
      verificationCode: existing.verificationCode || '',
      analysisStatus: existing.analysisStatus || 'NOT_REQUESTED',
      lastAnalysisAt: existing.lastAnalysisAt || '',
      links: Array.isArray(existing.links) ? existing.links : [],
    };

    current[index] = updated;
    this.writeLocalDocuments(current);
    return updated;
  }

  private appendLocalDocumentRequest(payload: CreateDocumentRequestPayload): DocumentRequest {
    const current = this.readLocalDocumentRequests();
    const fallbackRequesterName = this.inferActorName();
    const normalizedRequesterName = String(payload.requesterName || '').trim() || fallbackRequesterName;
    const normalizedRequesterUsername =
      this.normalizeOptionalText(payload.requesterUsername)?.toLowerCase() || this.currentUsername();
    const createdAt = new Date().toISOString();

    const created: DocumentRequest = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDocumentRequestReference(current),
      documentType: String(payload.documentType || '').trim(),
      requesterName: normalizedRequesterName,
      requesterUsername: normalizedRequesterUsername,
      purpose: String(payload.purpose || '').trim(),
      neededBy: this.normalizeDateOnly(payload.neededBy),
      status: 'Soumise',
      createdAt,
      decidedAt: '',
      decidedBy: '',
      decisionComment: '',
    };

    this.upsertLocalDocumentRequest(created);
    return created;
  }

  private updateLocalDocumentRequest(
    reference: string,
    payload: DocumentRequestDecisionPayload
  ): DocumentRequest | null {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (!normalizedReference) {
      return null;
    }

    const current = this.readLocalDocumentRequests();
    const index = current.findIndex((item) => item.reference.toUpperCase() === normalizedReference);
    if (index < 0) {
      return null;
    }

    const previous = current[index];
    if (String(previous.status || '').trim().toLowerCase() !== 'soumise') {
      return previous;
    }

    const nextStatus = payload.action === 'REJETER' ? 'Rejetee' : 'Validee';
    const decidedAt = new Date().toISOString();
    const decidedBy = this.inferActorName() || this.currentUsername();
    const decisionComment =
      this.normalizeOptionalText(payload.reason) ||
      (nextStatus === 'Rejetee'
        ? 'Demande de document rejetee par le manager'
        : 'Demande de document validee par le manager');

    const updated: DocumentRequest = {
      ...previous,
      status: nextStatus,
      decidedAt,
      decidedBy,
      decisionComment,
    };

    const clone = [...current];
    clone[index] = updated;
    this.writeLocalDocumentRequests(clone);
    return updated;
  }

  private upsertLocalDocumentRequest(item: DocumentRequest): void {
    const current = this.readLocalDocumentRequests();
    const deduped = current.filter((entry) => entry.reference.toUpperCase() !== item.reference.toUpperCase());
    deduped.push(item);
    this.writeLocalDocumentRequests(deduped);
  }

  private generateDocumentReference(existing: DocumentItem[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DOC-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DOC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private generateDocumentRequestReference(existing: DocumentRequest[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DOC-REQ-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(String(item.reference || ''));
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DOC-REQ-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalDocuments(): DocumentItem[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localDocumentsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => {
          const record = item as Partial<DocumentItem>;
          const updatedAt = this.normalizeIsoDateString(record.updatedAt, new Date().toISOString());
          return {
            reference: String(record.reference || '').trim(),
            title: String(record.title || '').trim(),
            type: String(record.type || '').trim(),
            documentTypeCode: String(record.documentTypeCode || '').trim(),
            documentTypeLabel: String(record.documentTypeLabel || '').trim(),
            owner: String(record.owner || '').trim(),
            updatedAt,
            status: String(record.status || 'Brouillon').trim() || 'Brouillon',
            employeeName: String(record.employeeName || record.owner || '').trim(),
            employeeId: String(record.employeeId || '').trim(),
            direction: String(record.direction || '').trim(),
            unit: String(record.unit || '').trim(),
            sourceModule: String(record.sourceModule || '').trim(),
            sourceRecordId: String(record.sourceRecordId || '').trim(),
            confidentialityLevel: String(record.confidentialityLevel || '').trim(),
            requiresAcknowledgement: this.toBoolean(record.requiresAcknowledgement, false),
            issuedAt: this.normalizeDateOnly(record.issuedAt) || this.toDateOnly(updatedAt),
            startDate: this.normalizeDateOnly(record.startDate),
            endDate: this.normalizeDateOnly(record.endDate),
            expiresOn: this.normalizeDateOnly(record.expiresOn),
            approver: String(record.approver || '').trim(),
            missionDestination: String(record.missionDestination || '').trim(),
            missionPurpose: String(record.missionPurpose || '').trim(),
            absenceReason: String(record.absenceReason || '').trim(),
            notes: String(record.notes || '').trim(),
            assignedEmployeeId: String(record.assignedEmployeeId || '').trim(),
            assignedEmployeeName: String(record.assignedEmployeeName || '').trim(),
            recipientUsername: String(record.recipientUsername || '').trim().toLowerCase(),
            assignmentNote: String(record.assignmentNote || '').trim(),
            deliveryStatus: this.normalizeDeliveryStatus(record.deliveryStatus, String(record.assignedAt || '').trim()),
            assignedAt: this.normalizeIsoDateString(record.assignedAt, ''),
            assignedBy: String(record.assignedBy || '').trim().toLowerCase(),
            assignmentDueAt: this.normalizeIsoDateString(record.assignmentDueAt, ''),
            reminderAt: this.normalizeIsoDateString(record.reminderAt, ''),
            reminderSentAt: this.normalizeIsoDateString(record.reminderSentAt, ''),
            readAt: this.normalizeIsoDateString(record.readAt, ''),
            acknowledgedAt: this.normalizeIsoDateString(record.acknowledgedAt, ''),
            acknowledgedBy: String(record.acknowledgedBy || '').trim().toLowerCase(),
            signedAt: this.normalizeIsoDateString(record.signedAt, ''),
            signedBy: String(record.signedBy || '').trim(),
            stampLabel: String(record.stampLabel || '').trim(),
            signatureHash: String(record.signatureHash || '').trim(),
            verificationCode: String(record.verificationCode || '').trim().toUpperCase(),
            analysisStatus: String(record.analysisStatus || '').trim(),
            lastAnalysisAt: this.normalizeIsoDateString(record.lastAnalysisAt, ''),
            links: this.normalizeDocumentLinks(record.links),
          } as DocumentItem;
        })
        .filter((item) => !!item.reference && !!item.title && !!item.type && !!item.owner && !!item.updatedAt);
    } catch {
      return [];
    }
  }

  private writeLocalDocuments(items: DocumentItem[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localDocumentsKey, JSON.stringify(items));
  }

  private readLocalDocumentRequests(): DocumentRequest[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localDocumentRequestsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => this.normalizeDocumentRequest(item as DocumentRequestDto))
        .filter((item) => this.isCompleteDocumentRequest(item));
    } catch {
      return [];
    }
  }

  private writeLocalDocumentRequests(items: DocumentRequest[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.localDocumentRequestsKey, JSON.stringify(items));
  }

  private mergeByKey<T>(apiItems: T[], localItems: T[], getKey: (item: T) => string): T[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byKey = new Map<string, T>();
    apiItems.forEach((item) => byKey.set(getKey(item), item));
    localItems.forEach((item) => byKey.set(getKey(item), item));
    return Array.from(byKey.values());
  }

  private normalizeDeliveryStatus(value: unknown, assignedAtValue?: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.includes('ack') || normalized.includes('accuse')) {
      return 'Accuse reception';
    }
    if (normalized.includes('read') || normalized === 'lu') {
      return 'Lu';
    }
    if (normalized.includes('assign')) {
      return 'Assigne';
    }
    return String(assignedAtValue || '').trim() ? 'Assigne' : 'Non assigne';
  }

  private currentUsername(): string {
    if (!this.hasLocalStorage()) {
      return '';
    }
    return String(window.localStorage.getItem('rh_username') || '').trim().toLowerCase();
  }

  private inferActorName(): string {
    const username = this.currentUsername();
    if (!username) {
      return '';
    }

    const localPart = username.split('@')[0] || username;
    const words = localPart
      .split(/[._-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);

    return words.join(' ');
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }
    return value as Record<string, unknown>;
  }

  private toFiniteNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return parsed;
  }

  private toNullableFiniteNumber(value: unknown): number | null {
    if (value === null || value === undefined || String(value).trim() === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private toBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) {
      return fallback;
    }
    if (['true', '1', 'yes', 'oui', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'non', 'off'].includes(normalized)) {
      return false;
    }
    return fallback;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }

  private normalizeIsoDateString(value: unknown, fallbackIso: string): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return fallbackIso;
    }

    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      return fallbackIso;
    }

    return new Date(parsed).toISOString();
  }

  private normalizeDateOnly(value: unknown): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw) && !Number.isNaN(Date.parse(raw))) {
      return raw;
    }

    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      return '';
    }

    return this.toDateOnly(new Date(parsed).toISOString());
  }

  private toDateOnly(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return '';
    }
    return new Date(parsed).toISOString().slice(0, 10);
  }
}
