import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface LeaveRequest {
  reference: string;
  agent: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface LeaveBalance {
  type: string;
  allocated: number;
  consumed: number;
  remaining: number;
}

export interface LeaveEvent {
  title: string;
  start: string;
  end?: string;
  className?: string;
}

export interface CreateLeaveRequestPayload {
  reference?: string;
  agent: string;
  type: string;
  startDate: string;
  endDate: string;
  status?: string;
}

export interface CreateLeaveBalancePayload {
  type: string;
  allocated: number;
  consumed: number;
}

export interface CreateLeaveEventPayload {
  title: string;
  start: string;
  end?: string;
  className?: string;
}

export interface LeaveRequestQuery extends CollectionQueryOptions {
  status?: string;
  type?: string;
  agent?: string;
}

export interface LeaveBalanceQuery extends CollectionQueryOptions {
  type?: string;
}

interface LeaveRequestDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  type?: string;
  leaveType?: string;
  leave_type?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
}

interface LeaveBalanceDto {
  type?: string;
  leaveType?: string;
  leave_type?: string;
  allocated?: number | string;
  allocatedDays?: number | string;
  allocated_days?: number | string;
  consumed?: number | string;
  consumedDays?: number | string;
  consumed_days?: number | string;
  remaining?: number | string;
  remainingDays?: number | string;
  remaining_days?: number | string;
}

interface LeaveEventDto {
  title?: string;
  label?: string;
  start?: string;
  startDate?: string;
  start_date?: string;
  end?: string;
  endDate?: string;
  end_date?: string;
  className?: string;
  class_name?: string;
  colorClass?: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveService {
  private readonly localRequestsKey = 'rh_dev_leave_requests';
  private readonly localBalancesKey = 'rh_dev_leave_balances';
  private readonly localEventsKey = 'rh_dev_leave_events';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getRequests(query?: LeaveRequestQuery): Observable<LeaveRequest[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      agent: query?.agent,
    });

    return this.apiClient
      .get<LeaveRequestDto[]>(
        API_ENDPOINTS.leave.requests,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapRequests(items)),
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

  createRequest(payload: CreateLeaveRequestPayload): Observable<LeaveRequest> {
    const normalizedPayload = this.normalizeCreateRequestPayload(payload);

    return this.apiClient
      .post<LeaveRequestDto, CreateLeaveRequestPayload>(
        API_ENDPOINTS.leave.requests,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeRequest(dto)),
        map((item) => {
          if (item.reference && item.agent && item.type && item.startDate && item.endDate) {
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

  getBalances(query?: LeaveBalanceQuery): Observable<LeaveBalance[]> {
    const params = buildCollectionQueryParams(query, {
      type: query?.type,
    });

    return this.apiClient
      .get<LeaveBalanceDto[]>(
        API_ENDPOINTS.leave.balances,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapBalances(items)),
        map((items) => this.mergeByKey(items, this.readLocalBalances(), (item) => item.type.toLowerCase())),
        map((items) => this.applyLocalBalancesQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalBalancesQuery(this.readLocalBalances(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createBalance(payload: CreateLeaveBalancePayload): Observable<LeaveBalance> {
    const normalizedPayload = this.normalizeCreateBalancePayload(payload);

    return this.apiClient
      .post<LeaveBalanceDto, CreateLeaveBalancePayload>(
        API_ENDPOINTS.leave.balances,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeBalance(dto)),
        map((item) => {
          if (item.type) {
            this.writeBalanceToLocal(item);
            return item;
          }
          return this.writeBalanceFromPayload(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.writeBalanceFromPayload(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getEvents(query?: CollectionQueryOptions): Observable<LeaveEvent[]> {
    const params = buildCollectionQueryParams(query);

    return this.apiClient
      .get<LeaveEventDto[]>(
        API_ENDPOINTS.leave.events,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapEvents(items)),
        map((items) => this.mergeByKey(items, this.readLocalEvents(), (item) => this.buildEventKey(item))),
        map((items) => this.applyLocalEventsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalEventsQuery(this.readLocalEvents(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createEvent(payload: CreateLeaveEventPayload): Observable<LeaveEvent> {
    const normalizedPayload = this.normalizeCreateEventPayload(payload);

    return this.apiClient
      .post<LeaveEventDto, CreateLeaveEventPayload>(
        API_ENDPOINTS.leave.events,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeEvent(dto)),
        map((item) => {
          if (item.title && item.start) {
            this.writeEventToLocal(item);
            return item;
          }
          return this.appendLocalEvent(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalEvent(normalizedPayload));
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

  private mapRequests(items: LeaveRequestDto[]): LeaveRequest[] {
    return items
      .map((dto) => this.normalizeRequest(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.startDate && !!item.endDate);
  }

  private normalizeRequest(dto: LeaveRequestDto): LeaveRequest {
    return {
      reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      type: toStringValue(readField(dto, ['type', 'leaveType', 'leave_type'], '')).trim(),
      startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim(),
      endDate: toStringValue(readField(dto, ['endDate', 'end_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'En attente')).trim() || 'En attente',
    };
  }

  private normalizeCreateRequestPayload(payload: CreateLeaveRequestPayload): CreateLeaveRequestPayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      type: String(payload.type || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'En attente',
    };
  }

  private applyLocalRequestsQuery(items: LeaveRequest[], query?: LeaveRequestQuery): LeaveRequest[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const type = (query?.type || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
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
          item.startDate.toLowerCase().includes(search) ||
          item.endDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'startDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readRequestField(left, sortBy);
      const rightValue = this.readRequestField(right, sortBy);
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

  private readRequestField(item: LeaveRequest, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'type':
        return item.type;
      case 'startDate':
        return item.startDate;
      case 'endDate':
        return item.endDate;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalRequest(payload: CreateLeaveRequestPayload): LeaveRequest {
    const current = this.readLocalRequests();
    const created: LeaveRequest = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateLeaveReference(current),
      agent: String(payload.agent || '').trim(),
      type: String(payload.type || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'En attente',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalRequests(deduped);
    return created;
  }

  private generateLeaveReference(existing: LeaveRequest[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^ABS-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `ABS-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalRequests(): LeaveRequest[] {
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
        .map((item) => {
          const record = item as Partial<LeaveRequest>;
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            type: String(record.type || '').trim(),
            startDate: String(record.startDate || '').trim(),
            endDate: String(record.endDate || '').trim(),
            status: String(record.status || 'En attente').trim() || 'En attente',
          } as LeaveRequest;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.startDate && !!item.endDate);
    } catch {
      return [];
    }
  }

  private writeLocalRequests(items: LeaveRequest[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localRequestsKey, JSON.stringify(items));
  }

  private mapBalances(items: LeaveBalanceDto[]): LeaveBalance[] {
    return items
      .map((dto) => this.normalizeBalance(dto))
      .filter((item) => !!item.type);
  }

  private normalizeBalance(dto: LeaveBalanceDto): LeaveBalance {
    const allocated = this.toNonNegativeInt(readField(dto, ['allocated', 'allocatedDays', 'allocated_days'], 0), 0);
    const consumedRaw = this.toNonNegativeInt(readField(dto, ['consumed', 'consumedDays', 'consumed_days'], 0), 0);
    const consumed = Math.min(consumedRaw, allocated);
    const remaining = this.toNonNegativeInt(
      readField(dto, ['remaining', 'remainingDays', 'remaining_days'], allocated - consumed),
      allocated - consumed
    );

    return {
      type: toStringValue(readField(dto, ['type', 'leaveType', 'leave_type'], '')).trim(),
      allocated,
      consumed,
      remaining,
    };
  }

  private normalizeCreateBalancePayload(payload: CreateLeaveBalancePayload): CreateLeaveBalancePayload {
    const allocated = this.toNonNegativeInt(payload.allocated, 0);
    const consumed = Math.min(this.toNonNegativeInt(payload.consumed, 0), allocated);
    return {
      type: String(payload.type || '').trim(),
      allocated,
      consumed,
    };
  }

  private applyLocalBalancesQuery(items: LeaveBalance[], query?: LeaveBalanceQuery): LeaveBalance[] {
    let next = [...items];

    const type = (query?.type || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.type.toLowerCase().includes(search) ||
          String(item.allocated).includes(search) ||
          String(item.consumed).includes(search) ||
          String(item.remaining).includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'type').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readBalanceField(left, sortBy);
      const rightValue = this.readBalanceField(right, sortBy);

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

  private readBalanceField(item: LeaveBalance, field: string): string | number {
    switch (field) {
      case 'type':
        return item.type;
      case 'allocated':
        return item.allocated;
      case 'consumed':
        return item.consumed;
      case 'remaining':
        return item.remaining;
      default:
        return '';
    }
  }

  private writeBalanceFromPayload(payload: CreateLeaveBalancePayload): LeaveBalance {
    const allocated = this.toNonNegativeInt(payload.allocated, 0);
    const consumed = Math.min(this.toNonNegativeInt(payload.consumed, 0), allocated);
    const created: LeaveBalance = {
      type: String(payload.type || '').trim(),
      allocated,
      consumed,
      remaining: allocated - consumed,
    };
    this.writeBalanceToLocal(created);
    return created;
  }

  private writeBalanceToLocal(balance: LeaveBalance): void {
    const current = this.readLocalBalances();
    const targetType = balance.type.toLowerCase();
    const deduped = current.filter((item) => item.type.toLowerCase() !== targetType);
    deduped.push({
      ...balance,
      remaining: Math.max(0, balance.allocated - balance.consumed),
    });
    this.writeLocalBalances(deduped);
  }

  private readLocalBalances(): LeaveBalance[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localBalancesKey);
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
          const record = item as Partial<LeaveBalance>;
          const allocated = this.toNonNegativeInt(record.allocated, 0);
          const consumed = Math.min(this.toNonNegativeInt(record.consumed, 0), allocated);
          return {
            type: String(record.type || '').trim(),
            allocated,
            consumed,
            remaining: Math.max(0, allocated - consumed),
          } as LeaveBalance;
        })
        .filter((item) => !!item.type);
    } catch {
      return [];
    }
  }

  private writeLocalBalances(items: LeaveBalance[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localBalancesKey, JSON.stringify(items));
  }

  private mapEvents(items: LeaveEventDto[]): LeaveEvent[] {
    return items
      .map((dto) => this.normalizeEvent(dto))
      .filter((item) => !!item.title && !!item.start);
  }

  private normalizeEvent(dto: LeaveEventDto): LeaveEvent {
    return {
      title: toStringValue(readField(dto, ['title', 'label'], '')).trim(),
      start: toStringValue(readField(dto, ['start', 'startDate', 'start_date'], '')).trim(),
      end: this.normalizeOptionalText(readField(dto, ['end', 'endDate', 'end_date'], undefined)),
      className: this.normalizeOptionalText(readField(dto, ['className', 'class_name', 'colorClass'], undefined)),
    };
  }

  private normalizeCreateEventPayload(payload: CreateLeaveEventPayload): CreateLeaveEventPayload {
    return {
      title: String(payload.title || '').trim(),
      start: String(payload.start || '').trim(),
      end: this.normalizeOptionalText(payload.end),
      className: this.normalizeOptionalText(payload.className) || 'bg-primary-transparent',
    };
  }

  private applyLocalEventsQuery(items: LeaveEvent[], query?: CollectionQueryOptions): LeaveEvent[] {
    let next = [...items];
    const search = (query?.q || '').trim().toLowerCase();

    if (search) {
      next = next.filter((item) => {
        return (
          item.title.toLowerCase().includes(search) ||
          item.start.toLowerCase().includes(search) ||
          (item.end || '').toLowerCase().includes(search) ||
          (item.className || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'start').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readEventField(left, sortBy);
      const rightValue = this.readEventField(right, sortBy);
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

  private readEventField(item: LeaveEvent, field: string): string {
    switch (field) {
      case 'title':
        return item.title;
      case 'start':
        return item.start;
      case 'end':
        return item.end || '';
      case 'className':
        return item.className || '';
      default:
        return '';
    }
  }

  private appendLocalEvent(payload: CreateLeaveEventPayload): LeaveEvent {
    const current = this.readLocalEvents();
    const created: LeaveEvent = {
      title: String(payload.title || '').trim(),
      start: String(payload.start || '').trim(),
      end: this.normalizeOptionalText(payload.end),
      className: this.normalizeOptionalText(payload.className) || 'bg-primary-transparent',
    };
    const createdKey = this.buildEventKey(created);
    const deduped = current.filter((item) => this.buildEventKey(item) !== createdKey);
    deduped.push(created);
    this.writeLocalEvents(deduped);
    return created;
  }

  private writeEventToLocal(event: LeaveEvent): void {
    const current = this.readLocalEvents();
    const eventKey = this.buildEventKey(event);
    const deduped = current.filter((item) => this.buildEventKey(item) !== eventKey);
    deduped.push(event);
    this.writeLocalEvents(deduped);
  }

  private buildEventKey(item: LeaveEvent): string {
    return `${item.title}|${item.start}|${item.end || ''}`.toLowerCase();
  }

  private readLocalEvents(): LeaveEvent[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localEventsKey);
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
          const record = item as Partial<LeaveEvent>;
          return {
            title: String(record.title || '').trim(),
            start: String(record.start || '').trim(),
            end: this.normalizeOptionalText(record.end),
            className: this.normalizeOptionalText(record.className),
          } as LeaveEvent;
        })
        .filter((item) => !!item.title && !!item.start);
    } catch {
      return [];
    }
  }

  private writeLocalEvents(items: LeaveEvent[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localEventsKey, JSON.stringify(items));
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
