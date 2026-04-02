import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface DisciplineCase {
  reference: string;
  agent: string;
  infraction: string;
  openedOn: string;
  status: string;
  sanction?: string;
}

export interface CreateDisciplineCasePayload {
  reference?: string;
  agent: string;
  infraction: string;
  openedOn: string;
  status?: string;
  sanction?: string;
}

export interface DisciplineCasesQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
}

interface DisciplineCaseDto {
  reference?: string;
  caseRef?: string;
  case_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  infraction?: string;
  reason?: string;
  openedOn?: string;
  opened_on?: string;
  status?: string;
  sanction?: string;
}

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  private readonly localCasesKey = 'rh_dev_discipline_cases';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getCases(query?: DisciplineCasesQuery): Observable<DisciplineCase[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
    });

    return this.apiClient
      .get<DisciplineCaseDto[]>(
        API_ENDPOINTS.discipline.cases,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCases(items)),
        map((items) => this.mergeByKey(items, this.readLocalCases(), (item) => item.reference)),
        map((items) => this.applyLocalCasesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCasesQuery(this.readLocalCases(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCase(payload: CreateDisciplineCasePayload): Observable<DisciplineCase> {
    const normalizedPayload = this.normalizeCreateCasePayload(payload);

    return this.apiClient
      .post<DisciplineCaseDto, CreateDisciplineCasePayload>(
        API_ENDPOINTS.discipline.cases,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCase(dto)),
        map((item) => {
          if (item.reference && item.agent && item.infraction && item.openedOn) {
            return item;
          }
          return this.appendLocalCase(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCase(normalizedPayload));
          }
          return throwError(() => error);
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

  private mapCases(items: DisciplineCaseDto[]): DisciplineCase[] {
    return items
      .map((dto) => this.normalizeCase(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.infraction && !!item.openedOn);
  }

  private normalizeCase(dto: DisciplineCaseDto): DisciplineCase {
    return {
      reference: toStringValue(readField(dto, ['reference', 'caseRef', 'case_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      infraction: toStringValue(readField(dto, ['infraction', 'reason'], '')).trim(),
      openedOn: toStringValue(readField(dto, ['openedOn', 'opened_on'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Ouvert')).trim() || 'Ouvert',
      sanction: this.normalizeOptionalText(readField(dto, ['sanction'], undefined)),
    };
  }

  private normalizeCreateCasePayload(payload: CreateDisciplineCasePayload): CreateDisciplineCasePayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      infraction: String(payload.infraction || '').trim(),
      openedOn: String(payload.openedOn || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Ouvert',
      sanction: this.normalizeOptionalText(payload.sanction),
    };
  }

  private applyLocalCasesQuery(items: DisciplineCase[], query?: DisciplineCasesQuery): DisciplineCase[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.infraction.toLowerCase().includes(search) ||
          item.openedOn.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          (item.sanction || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'openedOn').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readCaseField(left, sortBy).toLowerCase();
      const rightValue = this.readCaseField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readCaseField(item: DisciplineCase, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'infraction':
        return item.infraction;
      case 'openedOn':
        return item.openedOn;
      case 'status':
        return item.status;
      case 'sanction':
        return item.sanction || '';
      default:
        return '';
    }
  }

  private appendLocalCase(payload: CreateDisciplineCasePayload): DisciplineCase {
    const current = this.readLocalCases();
    const created: DisciplineCase = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateCaseReference(current),
      agent: String(payload.agent || '').trim(),
      infraction: String(payload.infraction || '').trim(),
      openedOn: String(payload.openedOn || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Ouvert',
      sanction: this.normalizeOptionalText(payload.sanction),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalCases(deduped);
    return created;
  }

  private generateCaseReference(existing: DisciplineCase[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DISC-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DISC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalCases(): DisciplineCase[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCasesKey);
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
          const record = item as Partial<DisciplineCase>;
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            infraction: String(record.infraction || '').trim(),
            openedOn: String(record.openedOn || '').trim(),
            status: String(record.status || 'Ouvert').trim() || 'Ouvert',
            sanction: this.normalizeOptionalText(record.sanction),
          } as DisciplineCase;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.infraction && !!item.openedOn);
    } catch {
      return [];
    }
  }

  private writeLocalCases(items: DisciplineCase[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCasesKey, JSON.stringify(items));
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

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }
}
