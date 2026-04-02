import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface PerfCampaign {
  code: string;
  title: string;
  period: string;
  population: string;
  status: string;
}

export interface PerfResult {
  agent: string;
  direction: string;
  managerScore: number;
  selfScore: number;
  finalScore: number;
  status: string;
}

export interface CreatePerfCampaignPayload {
  code?: string;
  title: string;
  period: string;
  population: string;
  status?: string;
}

export interface CreatePerfResultPayload {
  agent: string;
  direction: string;
  managerScore: number;
  selfScore: number;
  finalScore?: number;
  status?: string;
}

export interface PerformanceCampaignsQuery extends CollectionQueryOptions {
  status?: string;
  population?: string;
}

export interface PerformanceResultsQuery extends CollectionQueryOptions {
  status?: string;
  direction?: string;
}

interface PerfCampaignDto {
  code?: string;
  title?: string;
  name?: string;
  period?: string;
  population?: string;
  targetPopulation?: string;
  target_population?: string;
  status?: string;
}

interface PerfResultDto {
  agent?: string;
  agentName?: string;
  agent_name?: string;
  direction?: string;
  directionName?: string;
  direction_name?: string;
  managerScore?: number | string;
  manager_score?: number | string;
  selfScore?: number | string;
  self_score?: number | string;
  finalScore?: number | string;
  final_score?: number | string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class PerformanceService {
  private readonly localCampaignsKey = 'rh_dev_performance_campaigns';
  private readonly localResultsKey = 'rh_dev_performance_results';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getCampaigns(query?: PerformanceCampaignsQuery): Observable<PerfCampaign[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      population: query?.population,
    });

    return this.apiClient
      .get<PerfCampaignDto[]>(
        API_ENDPOINTS.performance.campaigns,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCampaigns(items)),
        map((items) => this.mergeByKey(items, this.readLocalCampaigns(), (item) => item.code)),
        map((items) => this.applyLocalCampaignsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCampaignsQuery(this.readLocalCampaigns(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCampaign(payload: CreatePerfCampaignPayload): Observable<PerfCampaign> {
    const normalizedPayload = this.normalizeCreateCampaignPayload(payload);

    return this.apiClient
      .post<PerfCampaignDto, CreatePerfCampaignPayload>(
        API_ENDPOINTS.performance.campaigns,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCampaign(dto)),
        map((item) => {
          if (item.code && item.title && item.period && item.population) {
            return item;
          }
          return this.appendLocalCampaign(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCampaign(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getResults(query?: PerformanceResultsQuery): Observable<PerfResult[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      direction: query?.direction,
    });

    return this.apiClient
      .get<PerfResultDto[]>(
        API_ENDPOINTS.performance.results,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapResults(items)),
        map((items) => this.mergeByKey(items, this.readLocalResults(), (item) => this.buildResultKey(item))),
        map((items) => this.applyLocalResultsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalResultsQuery(this.readLocalResults(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createResult(payload: CreatePerfResultPayload): Observable<PerfResult> {
    const normalizedPayload = this.normalizeCreateResultPayload(payload);

    return this.apiClient
      .post<PerfResultDto, CreatePerfResultPayload>(
        API_ENDPOINTS.performance.results,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeResult(dto)),
        map((item) => {
          if (item.agent && item.direction) {
            return item;
          }
          return this.appendLocalResult(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalResult(normalizedPayload));
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

  private mapCampaigns(items: PerfCampaignDto[]): PerfCampaign[] {
    return items
      .map((dto) => this.normalizeCampaign(dto))
      .filter((item) => !!item.code && !!item.title && !!item.period && !!item.population);
  }

  private normalizeCampaign(dto: PerfCampaignDto): PerfCampaign {
    return {
      code: toStringValue(readField(dto, ['code'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      period: toStringValue(readField(dto, ['period'], '')).trim(),
      population: toStringValue(readField(dto, ['population', 'targetPopulation', 'target_population'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Planifiee')).trim() || 'Planifiee',
    };
  }

  private normalizeCreateCampaignPayload(payload: CreatePerfCampaignPayload): CreatePerfCampaignPayload {
    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      period: String(payload.period || '').trim(),
      population: String(payload.population || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
  }

  private applyLocalCampaignsQuery(items: PerfCampaign[], query?: PerformanceCampaignsQuery): PerfCampaign[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const population = (query?.population || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (population) {
      next = next.filter((item) => item.population.toLowerCase().includes(population));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.period.toLowerCase().includes(search) ||
          item.population.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'code').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readCampaignField(left, sortBy);
      const rightValue = this.readCampaignField(right, sortBy);
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

  private readCampaignField(item: PerfCampaign, field: string): string {
    switch (field) {
      case 'code':
        return item.code;
      case 'title':
        return item.title;
      case 'period':
        return item.period;
      case 'population':
        return item.population;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalCampaign(payload: CreatePerfCampaignPayload): PerfCampaign {
    const current = this.readLocalCampaigns();
    const created: PerfCampaign = {
      code: this.normalizeOptionalText(payload.code) || this.generateCampaignCode(current),
      title: String(payload.title || '').trim(),
      period: String(payload.period || '').trim(),
      population: String(payload.population || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalCampaigns(deduped);
    return created;
  }

  private generateCampaignCode(existing: PerfCampaign[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^PERF-${year}-C(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `PERF-${year}-C${String(maxExisting + 1).padStart(2, '0')}`;
  }

  private readLocalCampaigns(): PerfCampaign[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCampaignsKey);
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
          const record = item as Partial<PerfCampaign>;
          return {
            code: String(record.code || '').trim(),
            title: String(record.title || '').trim(),
            period: String(record.period || '').trim(),
            population: String(record.population || '').trim(),
            status: String(record.status || 'Planifiee').trim() || 'Planifiee',
          } as PerfCampaign;
        })
        .filter((item) => !!item.code && !!item.title && !!item.period && !!item.population);
    } catch {
      return [];
    }
  }

  private writeLocalCampaigns(items: PerfCampaign[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCampaignsKey, JSON.stringify(items));
  }

  private mapResults(items: PerfResultDto[]): PerfResult[] {
    return items
      .map((dto) => this.normalizeResult(dto))
      .filter((item) => !!item.agent && !!item.direction);
  }

  private normalizeResult(dto: PerfResultDto): PerfResult {
    const managerScore = this.toScore(readField(dto, ['managerScore', 'manager_score'], 0));
    const selfScore = this.toScore(readField(dto, ['selfScore', 'self_score'], 0));
    const finalRaw = readField(dto, ['finalScore', 'final_score'], null);
    const finalScore = finalRaw === null || finalRaw === undefined
      ? Math.round((managerScore + selfScore) / 2)
      : this.toScore(finalRaw);

    return {
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')).trim(),
      managerScore,
      selfScore,
      finalScore,
      status: toStringValue(readField(dto, ['status'], 'En revue')).trim() || 'En revue',
    };
  }

  private normalizeCreateResultPayload(payload: CreatePerfResultPayload): CreatePerfResultPayload {
    const managerScore = this.toScore(payload.managerScore);
    const selfScore = this.toScore(payload.selfScore);
    const finalScore = payload.finalScore === undefined
      ? Math.round((managerScore + selfScore) / 2)
      : this.toScore(payload.finalScore);

    return {
      agent: String(payload.agent || '').trim(),
      direction: String(payload.direction || '').trim(),
      managerScore,
      selfScore,
      finalScore,
      status: this.normalizeOptionalText(payload.status) || 'En revue',
    };
  }

  private applyLocalResultsQuery(items: PerfResult[], query?: PerformanceResultsQuery): PerfResult[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const direction = (query?.direction || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (direction) {
      next = next.filter((item) => item.direction.toLowerCase().includes(direction));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.agent.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          String(item.managerScore).includes(search) ||
          String(item.selfScore).includes(search) ||
          String(item.finalScore).includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'finalScore').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readResultField(left, sortBy);
      const rightValue = this.readResultField(right, sortBy);

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

  private readResultField(item: PerfResult, field: string): string | number {
    switch (field) {
      case 'agent':
        return item.agent;
      case 'direction':
        return item.direction;
      case 'managerScore':
        return item.managerScore;
      case 'selfScore':
        return item.selfScore;
      case 'finalScore':
        return item.finalScore;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalResult(payload: CreatePerfResultPayload): PerfResult {
    const current = this.readLocalResults();
    const managerScore = this.toScore(payload.managerScore);
    const selfScore = this.toScore(payload.selfScore);
    const finalScore = payload.finalScore === undefined
      ? Math.round((managerScore + selfScore) / 2)
      : this.toScore(payload.finalScore);

    const created: PerfResult = {
      agent: String(payload.agent || '').trim(),
      direction: String(payload.direction || '').trim(),
      managerScore,
      selfScore,
      finalScore,
      status: this.normalizeOptionalText(payload.status) || 'En revue',
    };
    const createdKey = this.buildResultKey(created);
    const deduped = current.filter((item) => this.buildResultKey(item) !== createdKey);
    deduped.push(created);
    this.writeLocalResults(deduped);
    return created;
  }

  private buildResultKey(item: PerfResult): string {
    return `${item.agent}|${item.direction}`.toLowerCase();
  }

  private readLocalResults(): PerfResult[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localResultsKey);
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
          const record = item as Partial<PerfResult>;
          const managerScore = this.toScore(record.managerScore ?? 0);
          const selfScore = this.toScore(record.selfScore ?? 0);
          const finalScore = this.toScore(record.finalScore ?? Math.round((managerScore + selfScore) / 2));
          return {
            agent: String(record.agent || '').trim(),
            direction: String(record.direction || '').trim(),
            managerScore,
            selfScore,
            finalScore,
            status: String(record.status || 'En revue').trim() || 'En revue',
          } as PerfResult;
        })
        .filter((item) => !!item.agent && !!item.direction);
    } catch {
      return [];
    }
  }

  private writeLocalResults(items: PerfResult[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localResultsKey, JSON.stringify(items));
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

  private toScore(value: unknown): number {
    const parsed = toNumberValue(value, 0);
    const rounded = Math.round(parsed);
    return Math.max(0, Math.min(100, rounded));
  }
}
