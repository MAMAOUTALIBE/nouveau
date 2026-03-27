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
  owner: string;
  updatedAt: string;
  status: string;
  employeeName: string;
  employeeId: string;
  direction: string;
  unit: string;
  issuedAt: string;
  startDate: string;
  endDate: string;
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
}

export interface CreateDocumentPayload {
  reference?: string;
  title: string;
  type: string;
  owner: string;
  updatedAt?: string;
  status?: string;
  employeeName: string;
  employeeId?: string;
  direction?: string;
  unit?: string;
  issuedAt: string;
  startDate?: string;
  endDate?: string;
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
  owner?: string;
}

export interface DocumentInboxQuery extends CollectionQueryOptions {
  deliveryStatus?: string;
}

export interface DocumentOverdueQuery extends CollectionQueryOptions {
  recipientUsername?: string;
  deliveryStatus?: string;
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
  owner?: string;
  ownerName?: string;
  owner_name?: string;
  updatedAt?: string;
  updated_at?: string;
  status?: string;
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
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getDocuments(query?: DocumentsQuery): Observable<DocumentItem[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      owner: query?.owner,
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
      owner,
      updatedAt,
      status,
      employeeName,
      employeeId: toStringValue(readField(dto, ['employeeId', 'employee_id', 'matricule'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction'], '')).trim(),
      unit: toStringValue(readField(dto, ['unit'], '')).trim(),
      issuedAt:
        this.normalizeDateOnly(
          toStringValue(readField(dto, ['issuedAt', 'issued_at', 'issueDate', 'issue_date'], '')).trim()
        ) || issuedAtFallback,
      startDate: this.normalizeDateOnly(toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim()),
      endDate: this.normalizeDateOnly(toStringValue(readField(dto, ['endDate', 'end_date'], '')).trim()),
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
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId),
      direction: this.normalizeOptionalText(payload.direction),
      unit: this.normalizeOptionalText(payload.unit),
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
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
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId),
      direction: this.normalizeOptionalText(payload.direction),
      unit: this.normalizeOptionalText(payload.unit),
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
      approver: this.normalizeOptionalText(payload.approver),
      missionDestination: this.normalizeOptionalText(payload.missionDestination),
      missionPurpose: this.normalizeOptionalText(payload.missionPurpose),
      absenceReason: this.normalizeOptionalText(payload.absenceReason),
      notes: this.normalizeOptionalText(payload.notes),
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
    const owner = (query?.owner || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (owner) {
      next = next.filter((item) => item.owner.toLowerCase().includes(owner));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.owner.toLowerCase().includes(search) ||
          item.updatedAt.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.employeeName.toLowerCase().includes(search) ||
          item.employeeId.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.unit.toLowerCase().includes(search) ||
          item.issuedAt.toLowerCase().includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.endDate.toLowerCase().includes(search) ||
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

  private readDocumentField(item: DocumentItem, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'title':
        return item.title;
      case 'type':
        return item.type;
      case 'owner':
        return item.owner;
      case 'updatedAt':
        return item.updatedAt;
      case 'status':
        return item.status;
      case 'employeeName':
        return item.employeeName;
      case 'employeeId':
        return item.employeeId;
      case 'issuedAt':
        return item.issuedAt;
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

  private appendLocalDocument(payload: CreateDocumentPayload): DocumentItem {
    const current = this.readLocalDocuments();
    const created: DocumentItem = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDocumentReference(current),
      title: String(payload.title || '').trim(),
      type: String(payload.type || '').trim(),
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId) || '',
      direction: this.normalizeOptionalText(payload.direction) || '',
      unit: this.normalizeOptionalText(payload.unit) || '',
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
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
      owner: String(payload.owner || '').trim(),
      updatedAt: this.normalizeIsoDateString(payload.updatedAt, new Date().toISOString()),
      status: this.normalizeOptionalText(payload.status) || 'Brouillon',
      employeeName: String(payload.employeeName || '').trim(),
      employeeId: this.normalizeOptionalText(payload.employeeId) || '',
      direction: this.normalizeOptionalText(payload.direction) || '',
      unit: this.normalizeOptionalText(payload.unit) || '',
      issuedAt: this.normalizeDateOnly(payload.issuedAt) || this.toDateOnly(new Date().toISOString()),
      startDate: this.normalizeDateOnly(payload.startDate),
      endDate: this.normalizeDateOnly(payload.endDate),
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
    };

    current[index] = updated;
    this.writeLocalDocuments(current);
    return updated;
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
            owner: String(record.owner || '').trim(),
            updatedAt,
            status: String(record.status || 'Brouillon').trim() || 'Brouillon',
            employeeName: String(record.employeeName || record.owner || '').trim(),
            employeeId: String(record.employeeId || '').trim(),
            direction: String(record.direction || '').trim(),
            unit: String(record.unit || '').trim(),
            issuedAt: this.normalizeDateOnly(record.issuedAt) || this.toDateOnly(updatedAt),
            startDate: this.normalizeDateOnly(record.startDate),
            endDate: this.normalizeDateOnly(record.endDate),
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
