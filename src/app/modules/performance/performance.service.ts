import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
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
  constructor(private apiClient: ApiClientService) {}

  getCampaigns(): Observable<PerfCampaign[]> {
    return this.apiClient
      .get<PerfCampaignDto[]>(API_ENDPOINTS.performance.campaigns)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            title: toStringValue(readField(dto, ['title', 'name'], '')),
            period: toStringValue(readField(dto, ['period'], '')),
            population: toStringValue(readField(dto, ['population', 'targetPopulation', 'target_population'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }

  getResults(): Observable<PerfResult[]> {
    return this.apiClient
      .get<PerfResultDto[]>(API_ENDPOINTS.performance.results)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
            direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
            managerScore: toNumberValue(readField(dto, ['managerScore', 'manager_score'], 0)),
            selfScore: toNumberValue(readField(dto, ['selfScore', 'self_score'], 0)),
            finalScore: toNumberValue(readField(dto, ['finalScore', 'final_score'], 0)),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }
}
