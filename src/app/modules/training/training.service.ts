import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface TrainingSession {
  code: string;
  title: string;
  dates: string;
  location: string;
  seats: number;
  enrolled: number;
  status: string;
}

export interface TrainingCourse {
  code: string;
  title: string;
  duration: string;
  modality: string;
  domain: string;
}

export interface CreateTrainingSessionPayload {
  code?: string;
  title: string;
  dates: string;
  location: string;
  seats: number;
  enrolled?: number;
  status?: string;
}

export interface CreateTrainingCoursePayload {
  code?: string;
  title: string;
  duration: string;
  modality: string;
  domain: string;
}

export interface TrainingSessionsQuery extends CollectionQueryOptions {
  status?: string;
  location?: string;
}

export interface TrainingCatalogQuery extends CollectionQueryOptions {
  domain?: string;
  modality?: string;
}

export interface TrainingEnrollmentRequest {
  reference: string;
  sessionCode: string;
  sessionTitle: string;
  sessionDates: string;
  sessionLocation: string;
  applicantName: string;
  applicantUsername: string;
  motivation: string;
  status: string;
  createdAt: string;
  decidedAt: string;
  decidedBy: string;
  decisionComment: string;
}

export interface CreateTrainingEnrollmentRequestPayload {
  reference?: string;
  sessionCode: string;
  sessionTitle?: string;
  sessionDates?: string;
  sessionLocation?: string;
  applicantName: string;
  applicantUsername?: string;
  motivation: string;
}

export interface TrainingEnrollmentDecisionPayload {
  action: 'APPROUVER' | 'REJETER';
  reason?: string;
}

export interface TrainingEnrollmentRequestsQuery extends CollectionQueryOptions {
  status?: string;
  sessionCode?: string;
  applicantUsername?: string;
}

interface TrainingSessionDto {
  code?: string;
  title?: string;
  name?: string;
  dates?: string;
  sessionDates?: string;
  session_dates?: string;
  location?: string;
  venue?: string;
  seats?: number | string;
  seatsCount?: number | string;
  seats_count?: number | string;
  enrolled?: number | string;
  enrolledCount?: number | string;
  enrolled_count?: number | string;
  status?: string;
}

interface TrainingCourseDto {
  code?: string;
  title?: string;
  name?: string;
  duration?: string;
  modality?: string;
  mode?: string;
  domain?: string;
  category?: string;
}

interface TrainingEnrollmentRequestDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  sessionCode?: string;
  session_code?: string;
  trainingSessionCode?: string;
  training_session_code?: string;
  sessionTitle?: string;
  session_title?: string;
  title?: string;
  sessionDates?: string;
  session_dates?: string;
  dates?: string;
  sessionLocation?: string;
  session_location?: string;
  location?: string;
  applicantName?: string;
  applicant_name?: string;
  applicant?: string;
  agent?: string;
  applicantUsername?: string;
  applicant_username?: string;
  username?: string;
  motivation?: string;
  reason?: string;
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

@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly localSessionsKey = 'rh_dev_training_sessions';
  private readonly localCatalogKey = 'rh_dev_training_catalog';
  private readonly localRequestsKey = 'rh_dev_training_requests';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getSessions(query?: TrainingSessionsQuery): Observable<TrainingSession[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      location: query?.location,
    });

    return this.apiClient
      .get<TrainingSessionDto[]>(
        API_ENDPOINTS.training.sessions,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapSessions(items)),
        map((items) => this.mergeByKey(items, this.readLocalSessions(), (item) => item.code)),
        map((items) => this.applyLocalSessionsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalSessionsQuery(this.readLocalSessions(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createSession(payload: CreateTrainingSessionPayload): Observable<TrainingSession> {
    const normalizedPayload = this.normalizeCreateSessionPayload(payload);

    return this.apiClient
      .post<TrainingSessionDto, CreateTrainingSessionPayload>(
        API_ENDPOINTS.training.sessions,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeSession(dto)),
        map((item) => {
          if (item.code && item.title && item.location && item.dates) {
            return item;
          }
          return this.appendLocalSession(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalSession(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getCatalog(query?: TrainingCatalogQuery): Observable<TrainingCourse[]> {
    const params = buildCollectionQueryParams(query, {
      domain: query?.domain,
      modality: query?.modality,
    });

    return this.apiClient
      .get<TrainingCourseDto[]>(
        API_ENDPOINTS.training.catalog,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCourses(items)),
        map((items) => this.mergeByKey(items, this.readLocalCatalog(), (item) => item.code)),
        map((items) => this.applyLocalCatalogQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCatalogQuery(this.readLocalCatalog(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCourse(payload: CreateTrainingCoursePayload): Observable<TrainingCourse> {
    const normalizedPayload = this.normalizeCreateCoursePayload(payload);

    return this.apiClient
      .post<TrainingCourseDto, CreateTrainingCoursePayload>(
        API_ENDPOINTS.training.catalog,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCourse(dto)),
        map((item) => {
          if (item.code && item.title && item.duration && item.modality && item.domain) {
            return item;
          }
          return this.appendLocalCourse(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCourse(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getRequests(query?: TrainingEnrollmentRequestsQuery): Observable<TrainingEnrollmentRequest[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      sessionCode: query?.sessionCode,
      applicantUsername: query?.applicantUsername,
    });

    return this.apiClient
      .get<TrainingEnrollmentRequestDto[]>(
        API_ENDPOINTS.training.requests,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapEnrollmentRequests(items)),
        map((items) => this.mergeByKey(items, this.readLocalRequests(), (item) => item.reference)),
        map((items) => this.applyLocalRequestsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalRequestsQuery(this.readLocalRequests(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createRequest(payload: CreateTrainingEnrollmentRequestPayload): Observable<TrainingEnrollmentRequest> {
    const normalizedPayload = this.normalizeCreateRequestPayload(payload);

    return this.apiClient
      .post<TrainingEnrollmentRequestDto, CreateTrainingEnrollmentRequestPayload>(
        API_ENDPOINTS.training.requests,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeEnrollmentRequest(dto)),
        map((item) => {
          if (this.isCompleteEnrollmentRequest(item)) {
            this.upsertLocalRequest(item);
            return item;
          }
          return this.appendLocalRequest(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalRequest(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  decideRequest(reference: string, payload: TrainingEnrollmentDecisionPayload): Observable<TrainingEnrollmentRequest> {
    const normalizedPayload = this.normalizeDecisionPayload(payload);
    const normalizedReference = String(reference || '').trim();

    return this.apiClient
      .post<TrainingEnrollmentRequestDto, TrainingEnrollmentDecisionPayload>(
        API_ENDPOINTS.training.requestDecision(normalizedReference),
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeEnrollmentRequest(dto)),
        map((item) => {
          if (this.isCompleteEnrollmentRequest(item)) {
            this.upsertLocalRequest(item);
            return item;
          }
          const localUpdated = this.updateLocalRequest(normalizedReference, normalizedPayload);
          if (localUpdated) {
            return localUpdated;
          }
          return item;
        }),
        catchError((error) => {
          if (!this.shouldUseLocalFallback(error)) {
            return throwError(() => error);
          }

          const localUpdated = this.updateLocalRequest(normalizedReference, normalizedPayload);
          if (!localUpdated) {
            return throwError(() => error);
          }
          return of(localUpdated);
        })
      );
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

  private mapSessions(items: TrainingSessionDto[]): TrainingSession[] {
    return items
      .map((dto) => this.normalizeSession(dto))
      .filter((item) => !!item.code && !!item.title && !!item.location && !!item.dates);
  }

  private normalizeSession(dto: TrainingSessionDto): TrainingSession {
    const seats = this.toNonNegativeInt(readField(dto, ['seats', 'seatsCount', 'seats_count'], 0), 0);
    const enrolled = Math.min(
      this.toNonNegativeInt(readField(dto, ['enrolled', 'enrolledCount', 'enrolled_count'], 0), 0),
      seats
    );

    return {
      code: toStringValue(readField(dto, ['code'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      dates: toStringValue(readField(dto, ['dates', 'sessionDates', 'session_dates'], '')).trim(),
      location: toStringValue(readField(dto, ['location', 'venue'], '')).trim(),
      seats,
      enrolled,
      status: toStringValue(readField(dto, ['status'], 'Ouverte')).trim() || 'Ouverte',
    };
  }

  private normalizeCreateSessionPayload(payload: CreateTrainingSessionPayload): CreateTrainingSessionPayload {
    const seats = Math.max(1, this.toNonNegativeInt(payload.seats, 1));
    const enrolled = Math.min(this.toNonNegativeInt(payload.enrolled, 0), seats);

    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      dates: String(payload.dates || '').trim(),
      location: String(payload.location || '').trim(),
      seats,
      enrolled,
      status: this.normalizeOptionalText(payload.status) || 'Ouverte',
    };
  }

  private applyLocalSessionsQuery(items: TrainingSession[], query?: TrainingSessionsQuery): TrainingSession[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const location = (query?.location || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (location) {
      next = next.filter((item) => item.location.toLowerCase().includes(location));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.dates.toLowerCase().includes(search) ||
          item.location.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          String(item.seats).includes(search) ||
          String(item.enrolled).includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'code').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readSessionField(left, sortBy);
      const rightValue = this.readSessionField(right, sortBy);

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        if (leftValue === rightValue) return 0;
        if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
        return sortOrder === 'asc' ? 1 : -1;
      }

      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readSessionField(item: TrainingSession, field: string): string | number {
    switch (field) {
      case 'code':
        return item.code;
      case 'title':
        return item.title;
      case 'dates':
        return item.dates;
      case 'location':
        return item.location;
      case 'seats':
        return item.seats;
      case 'enrolled':
        return item.enrolled;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalSession(payload: CreateTrainingSessionPayload): TrainingSession {
    const current = this.readLocalSessions();
    const seats = Math.max(1, this.toNonNegativeInt(payload.seats, 1));
    const enrolled = Math.min(this.toNonNegativeInt(payload.enrolled, 0), seats);

    const created: TrainingSession = {
      code: this.normalizeOptionalText(payload.code) || this.generateSessionCode(current),
      title: String(payload.title || '').trim(),
      dates: String(payload.dates || '').trim(),
      location: String(payload.location || '').trim(),
      seats,
      enrolled,
      status: this.normalizeOptionalText(payload.status) || 'Ouverte',
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalSessions(deduped);
    return created;
  }

  private generateSessionCode(existing: TrainingSession[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^TRN-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `TRN-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalSessions(): TrainingSession[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localSessionsKey);
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
          const record = item as Partial<TrainingSession>;
          const seats = Math.max(1, this.toNonNegativeInt(record.seats, 1));
          const enrolled = Math.min(this.toNonNegativeInt(record.enrolled, 0), seats);
          return {
            code: String(record.code || '').trim(),
            title: String(record.title || '').trim(),
            dates: String(record.dates || '').trim(),
            location: String(record.location || '').trim(),
            seats,
            enrolled,
            status: String(record.status || 'Ouverte').trim() || 'Ouverte',
          } as TrainingSession;
        })
        .filter((item) => !!item.code && !!item.title && !!item.location && !!item.dates);
    } catch {
      return [];
    }
  }

  private writeLocalSessions(items: TrainingSession[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localSessionsKey, JSON.stringify(items));
  }

  private mapCourses(items: TrainingCourseDto[]): TrainingCourse[] {
    return items
      .map((dto) => this.normalizeCourse(dto))
      .filter((item) => !!item.code && !!item.title && !!item.duration && !!item.modality && !!item.domain);
  }

  private normalizeCourse(dto: TrainingCourseDto): TrainingCourse {
    return {
      code: toStringValue(readField(dto, ['code'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      duration: toStringValue(readField(dto, ['duration'], '')).trim(),
      modality: toStringValue(readField(dto, ['modality', 'mode'], '')).trim(),
      domain: toStringValue(readField(dto, ['domain', 'category'], '')).trim(),
    };
  }

  private normalizeCreateCoursePayload(payload: CreateTrainingCoursePayload): CreateTrainingCoursePayload {
    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      duration: String(payload.duration || '').trim(),
      modality: String(payload.modality || '').trim(),
      domain: String(payload.domain || '').trim(),
    };
  }

  private applyLocalCatalogQuery(items: TrainingCourse[], query?: TrainingCatalogQuery): TrainingCourse[] {
    let next = [...items];

    const domain = (query?.domain || '').trim().toLowerCase();
    const modality = (query?.modality || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (domain) {
      next = next.filter((item) => item.domain.toLowerCase().includes(domain));
    }
    if (modality) {
      next = next.filter((item) => item.modality.toLowerCase().includes(modality));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.duration.toLowerCase().includes(search) ||
          item.modality.toLowerCase().includes(search) ||
          item.domain.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'code').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readCourseField(left, sortBy);
      const rightValue = this.readCourseField(right, sortBy);
      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readCourseField(item: TrainingCourse, field: string): string {
    switch (field) {
      case 'code':
        return item.code;
      case 'title':
        return item.title;
      case 'duration':
        return item.duration;
      case 'modality':
        return item.modality;
      case 'domain':
        return item.domain;
      default:
        return '';
    }
  }

  private appendLocalCourse(payload: CreateTrainingCoursePayload): TrainingCourse {
    const current = this.readLocalCatalog();
    const created: TrainingCourse = {
      code: this.normalizeOptionalText(payload.code) || this.generateCourseCode(current),
      title: String(payload.title || '').trim(),
      duration: String(payload.duration || '').trim(),
      modality: String(payload.modality || '').trim(),
      domain: String(payload.domain || '').trim(),
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalCatalog(deduped);
    return created;
  }

  private generateCourseCode(existing: TrainingCourse[]): string {
    const regex = /^CAT-(\d+)$/;
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `CAT-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalCatalog(): TrainingCourse[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCatalogKey);
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
          const record = item as Partial<TrainingCourse>;
          return {
            code: String(record.code || '').trim(),
            title: String(record.title || '').trim(),
            duration: String(record.duration || '').trim(),
            modality: String(record.modality || '').trim(),
            domain: String(record.domain || '').trim(),
          } as TrainingCourse;
        })
        .filter((item) => !!item.code && !!item.title && !!item.duration && !!item.modality && !!item.domain);
    } catch {
      return [];
    }
  }

  private writeLocalCatalog(items: TrainingCourse[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCatalogKey, JSON.stringify(items));
  }

  private mapEnrollmentRequests(items: TrainingEnrollmentRequestDto[]): TrainingEnrollmentRequest[] {
    return items
      .map((dto) => this.normalizeEnrollmentRequest(dto))
      .filter((item) => this.isCompleteEnrollmentRequest(item));
  }

  private normalizeEnrollmentRequest(dto: TrainingEnrollmentRequestDto): TrainingEnrollmentRequest {
    return {
      reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')).trim(),
      sessionCode: toStringValue(
        readField(dto, ['sessionCode', 'session_code', 'trainingSessionCode', 'training_session_code'], '')
      )
        .trim()
        .toUpperCase(),
      sessionTitle: toStringValue(readField(dto, ['sessionTitle', 'session_title', 'title'], '')).trim(),
      sessionDates: toStringValue(readField(dto, ['sessionDates', 'session_dates', 'dates'], '')).trim(),
      sessionLocation: toStringValue(readField(dto, ['sessionLocation', 'session_location', 'location'], '')).trim(),
      applicantName: toStringValue(readField(dto, ['applicantName', 'applicant_name', 'applicant', 'agent'], '')).trim(),
      applicantUsername: toStringValue(readField(dto, ['applicantUsername', 'applicant_username', 'username'], ''))
        .trim()
        .toLowerCase(),
      motivation: toStringValue(readField(dto, ['motivation', 'reason'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Soumise')).trim() || 'Soumise',
      createdAt: toStringValue(readField(dto, ['createdAt', 'created_at', 'requestedAt', 'requested_at'], '')).trim(),
      decidedAt: toStringValue(readField(dto, ['decidedAt', 'decided_at', 'decisionAt', 'decision_at'], '')).trim(),
      decidedBy: toStringValue(readField(dto, ['decidedBy', 'decided_by', 'managerDecisionBy', 'manager_decision_by'], ''))
        .trim(),
      decisionComment: toStringValue(
        readField(
          dto,
          ['decisionComment', 'decision_comment', 'decisionReason', 'decision_reason', 'comment', 'note'],
          ''
        )
      ).trim(),
    };
  }

  private isCompleteEnrollmentRequest(item: TrainingEnrollmentRequest): boolean {
    return !!item.reference && !!item.sessionCode && !!item.sessionTitle && !!item.applicantName && !!item.createdAt;
  }

  private normalizeCreateRequestPayload(
    payload: CreateTrainingEnrollmentRequestPayload
  ): CreateTrainingEnrollmentRequestPayload {
    const normalizedApplicantUsername = this.normalizeOptionalText(payload.applicantUsername)?.toLowerCase() || this.currentUsername();

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      sessionCode: String(payload.sessionCode || '')
        .trim()
        .toUpperCase(),
      sessionTitle: String(payload.sessionTitle || '').trim(),
      sessionDates: String(payload.sessionDates || '').trim(),
      sessionLocation: String(payload.sessionLocation || '').trim(),
      applicantName: String(payload.applicantName || '').trim(),
      applicantUsername: normalizedApplicantUsername || undefined,
      motivation: String(payload.motivation || '').trim(),
    };
  }

  private normalizeDecisionPayload(payload: TrainingEnrollmentDecisionPayload): TrainingEnrollmentDecisionPayload {
    const actionRaw = String(payload.action || '').trim().toUpperCase();
    const action: 'APPROUVER' | 'REJETER' = actionRaw === 'REJETER' ? 'REJETER' : 'APPROUVER';

    return {
      action,
      reason: this.normalizeOptionalText(payload.reason),
    };
  }

  private applyLocalRequestsQuery(
    items: TrainingEnrollmentRequest[],
    query?: TrainingEnrollmentRequestsQuery
  ): TrainingEnrollmentRequest[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const sessionCode = (query?.sessionCode || '').trim().toLowerCase();
    const applicantUsername = (query?.applicantUsername || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (sessionCode) {
      next = next.filter((item) => item.sessionCode.toLowerCase().includes(sessionCode));
    }
    if (applicantUsername) {
      next = next.filter((item) => item.applicantUsername.toLowerCase().includes(applicantUsername));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.sessionCode.toLowerCase().includes(search) ||
          item.sessionTitle.toLowerCase().includes(search) ||
          item.sessionDates.toLowerCase().includes(search) ||
          item.sessionLocation.toLowerCase().includes(search) ||
          item.applicantName.toLowerCase().includes(search) ||
          item.applicantUsername.toLowerCase().includes(search) ||
          item.motivation.toLowerCase().includes(search) ||
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
      const leftValue = this.readEnrollmentRequestField(left, sortBy);
      const rightValue = this.readEnrollmentRequestField(right, sortBy);

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

  private readEnrollmentRequestField(item: TrainingEnrollmentRequest, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'sessionCode':
        return item.sessionCode;
      case 'sessionTitle':
        return item.sessionTitle;
      case 'sessionDates':
        return item.sessionDates;
      case 'sessionLocation':
        return item.sessionLocation;
      case 'applicantName':
        return item.applicantName;
      case 'applicantUsername':
        return item.applicantUsername;
      case 'motivation':
        return item.motivation;
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

  private appendLocalRequest(payload: CreateTrainingEnrollmentRequestPayload): TrainingEnrollmentRequest {
    const current = this.readLocalRequests();
    const fallbackApplicantName = this.inferActorName();
    const normalizedApplicantName = String(payload.applicantName || '').trim() || fallbackApplicantName;
    const normalizedApplicantUsername =
      this.normalizeOptionalText(payload.applicantUsername)?.toLowerCase() || this.currentUsername();
    const createdAt = new Date().toISOString();

    const created: TrainingEnrollmentRequest = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateRequestReference(current),
      sessionCode: String(payload.sessionCode || '')
        .trim()
        .toUpperCase(),
      sessionTitle: String(payload.sessionTitle || '').trim() || `Session ${String(payload.sessionCode || '').trim()}`,
      sessionDates: String(payload.sessionDates || '').trim(),
      sessionLocation: String(payload.sessionLocation || '').trim(),
      applicantName: normalizedApplicantName,
      applicantUsername: normalizedApplicantUsername,
      motivation: String(payload.motivation || '').trim(),
      status: 'Soumise',
      createdAt,
      decidedAt: '',
      decidedBy: '',
      decisionComment: '',
    };

    this.upsertLocalRequest(created);
    return created;
  }

  private updateLocalRequest(
    reference: string,
    payload: TrainingEnrollmentDecisionPayload
  ): TrainingEnrollmentRequest | null {
    const normalizedReference = String(reference || '').trim().toUpperCase();
    if (!normalizedReference) {
      return null;
    }

    const current = this.readLocalRequests();
    const index = current.findIndex((item) => item.reference.toUpperCase() === normalizedReference);
    if (index < 0) {
      return null;
    }

    const previous = current[index];
    const previousStatus = String(previous.status || '').trim().toLowerCase();
    if (previousStatus !== 'soumise') {
      return previous;
    }

    const nextStatus = payload.action === 'REJETER' ? 'Rejetee' : 'Validee';
    const decidedAt = new Date().toISOString();
    const decidedBy = this.inferActorName() || this.currentUsername();
    const decisionComment =
      this.normalizeOptionalText(payload.reason) ||
      (nextStatus === 'Rejetee' ? 'Demande rejetee par le manager' : 'Demande validee par le manager');

    const updated: TrainingEnrollmentRequest = {
      ...previous,
      status: nextStatus,
      decidedAt,
      decidedBy,
      decisionComment,
    };

    const clone = [...current];
    clone[index] = updated;
    this.writeLocalRequests(clone);

    if (nextStatus === 'Validee') {
      this.incrementLocalSessionEnrolled(updated.sessionCode);
    }

    return updated;
  }

  private upsertLocalRequest(item: TrainingEnrollmentRequest): void {
    const current = this.readLocalRequests();
    const deduped = current.filter((entry) => entry.reference.toUpperCase() !== item.reference.toUpperCase());
    deduped.push(item);
    this.writeLocalRequests(deduped);
  }

  private generateRequestReference(existing: TrainingEnrollmentRequest[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^TRN-REQ-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(String(item.reference || ''));
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `TRN-REQ-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalRequests(): TrainingEnrollmentRequest[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localRequestsKey);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .map((item) => this.normalizeEnrollmentRequest(item as TrainingEnrollmentRequestDto))
        .filter((item) => this.isCompleteEnrollmentRequest(item));
    } catch {
      return [];
    }
  }

  private writeLocalRequests(items: TrainingEnrollmentRequest[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.localRequestsKey, JSON.stringify(items));
  }

  private currentUsername(): string {
    if (!this.hasLocalStorage()) {
      return '';
    }

    return String(window.localStorage.getItem('rh_username') || '').trim().toLowerCase();
  }

  private incrementLocalSessionEnrolled(sessionCode: string): void {
    const normalizedCode = String(sessionCode || '').trim().toUpperCase();
    if (!normalizedCode) {
      return;
    }

    const sessions = this.readLocalSessions();
    const index = sessions.findIndex((item) => item.code.toUpperCase() === normalizedCode);
    if (index < 0) {
      return;
    }

    const current = sessions[index];
    const seats = this.toStrictPositiveInt(current.seats, 1);
    const enrolled = Math.min(seats, this.toNonNegativeInt(current.enrolled, 0) + 1);
    const updated: TrainingSession = {
      ...current,
      seats,
      enrolled,
      status: enrolled >= seats ? 'Complete' : current.status,
    };

    const clone = [...sessions];
    clone[index] = updated;
    this.writeLocalSessions(clone);
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

  private mergeByKey<T>(apiItems: T[], localItems: T[], getKey: (item: T) => string): T[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byKey = new Map<string, T>();
    apiItems.forEach((item) => byKey.set(getKey(item), item));
    localItems.forEach((item) => byKey.set(getKey(item), item));
    return Array.from(byKey.values());
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded >= 0 ? rounded : fallback;
  }

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }
}
