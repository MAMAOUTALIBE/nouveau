import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface CareerMove {
  reference: string;
  agent: string;
  type: 'Avancement' | 'Mutation' | 'Détachement' | 'Promotion';
  from?: string;
  to: string;
  effectiveDate: string;
  status: string;
}

export interface CreateCareerMovePayload {
  reference?: string;
  agent: string;
  type: CareerMove['type'];
  from?: string;
  to: string;
  effectiveDate: string;
  status?: string;
}

export interface CareerMovesQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
}

interface CareerMoveDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  type?: 'Avancement' | 'Mutation' | 'Détachement' | 'Promotion' | string;
  movementType?: 'Avancement' | 'Mutation' | 'Détachement' | 'Promotion' | string;
  movement_type?: 'Avancement' | 'Mutation' | 'Détachement' | 'Promotion' | string;
  from?: string;
  fromLabel?: string;
  from_label?: string;
  to?: string;
  toLabel?: string;
  to_label?: string;
  effectiveDate?: string;
  effective_date?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class CareersService {
  private readonly localMovesKey = 'rh_dev_career_moves';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getMovesByType(type: CareerMove['type'], query?: CareerMovesQuery): Observable<CareerMove[]> {
    const params = buildCollectionQueryParams(query, {
      type,
      status: query?.status,
      agent: query?.agent,
    });

    return this.apiClient
      .get<CareerMoveDto[]>(
        API_ENDPOINTS.careers.moves,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapMoves(items, type)),
        map((items) => this.mergeByKey(items, this.readLocalMoves(), (item) => item.reference)),
        map((items) => this.applyLocalMovesQuery(items, type, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalMovesQuery(this.readLocalMoves(), type, query));
          }
          return throwError(() => error);
        })
      );
  }

  createMove(payload: CreateCareerMovePayload): Observable<CareerMove> {
    const normalizedPayload = this.normalizeCreatePayload(payload);

    return this.apiClient
      .post<CareerMoveDto, CreateCareerMovePayload>(
        API_ENDPOINTS.careers.moves,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeMove(dto, normalizedPayload.type)),
        map((item) => {
          if (item.reference && item.agent && item.type && item.to && item.effectiveDate) {
            return item;
          }
          return this.appendLocalMove(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalMove(normalizedPayload));
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

  private mapMoves(items: CareerMoveDto[], defaultType: CareerMove['type']): CareerMove[] {
    return items
      .map((dto) => this.normalizeMove(dto, defaultType))
      .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.to && !!item.effectiveDate);
  }

  private normalizeMove(dto: CareerMoveDto, defaultType: CareerMove['type']): CareerMove {
    return {
      reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      type: this.normalizeType(readField(dto, ['type', 'movementType', 'movement_type'], defaultType), defaultType),
      from: this.normalizeOptionalText(readField(dto, ['from', 'fromLabel', 'from_label'], undefined)),
      to: toStringValue(readField(dto, ['to', 'toLabel', 'to_label'], '')).trim(),
      effectiveDate: toStringValue(readField(dto, ['effectiveDate', 'effective_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'En attente')).trim() || 'En attente',
    };
  }

  private normalizeCreatePayload(payload: CreateCareerMovePayload): CreateCareerMovePayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      type: this.normalizeType(payload.type, 'Mutation'),
      from: this.normalizeOptionalText(payload.from),
      to: String(payload.to || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'En attente',
    };
  }

  private applyLocalMovesQuery(
    items: CareerMove[],
    type: CareerMove['type'],
    query?: CareerMovesQuery
  ): CareerMove[] {
    let next = items.filter((item) => item.type === type);

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
          item.type.toLowerCase().includes(search) ||
          (item.from || '').toLowerCase().includes(search) ||
          item.to.toLowerCase().includes(search) ||
          item.effectiveDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'effectiveDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readMoveField(left, sortBy);
      const rightValue = this.readMoveField(right, sortBy);
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

  private readMoveField(item: CareerMove, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'type':
        return item.type;
      case 'from':
        return item.from || '';
      case 'to':
        return item.to;
      case 'effectiveDate':
        return item.effectiveDate;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalMove(payload: CreateCareerMovePayload): CareerMove {
    const current = this.readLocalMoves();
    const reference = this.normalizeOptionalText(payload.reference) || this.generateMoveReference(current);
    const created: CareerMove = {
      reference,
      agent: String(payload.agent || '').trim(),
      type: this.normalizeType(payload.type, 'Mutation'),
      from: this.normalizeOptionalText(payload.from),
      to: String(payload.to || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'En attente',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalMoves(deduped);
    return created;
  }

  private generateMoveReference(existing: CareerMove[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^CAR-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `CAR-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalMoves(): CareerMove[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localMovesKey);
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
          const record = item as Partial<CareerMove>;
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            type: this.normalizeType(record.type, 'Mutation'),
            from: this.normalizeOptionalText(record.from),
            to: String(record.to || '').trim(),
            effectiveDate: String(record.effectiveDate || '').trim(),
            status: String(record.status || 'En attente').trim() || 'En attente',
          } as CareerMove;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.to && !!item.effectiveDate);
    } catch {
      return [];
    }
  }

  private writeLocalMoves(items: CareerMove[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localMovesKey, JSON.stringify(items));
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

  private normalizeType(value: unknown, fallback: CareerMove['type']): CareerMove['type'] {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'avancement') return 'Avancement';
    if (normalized === 'mutation') return 'Mutation';
    if (normalized === 'détachement' || normalized === 'detachement') return 'Détachement';
    if (normalized === 'promotion') return 'Promotion';
    return fallback;
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
