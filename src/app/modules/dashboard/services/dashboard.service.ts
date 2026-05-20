import { Injectable } from '@angular/core';
import { Observable, of, catchError, map } from 'rxjs';
import { API_ENDPOINTS } from '../../../core/config/api-endpoints';
import { ApiClientService } from '../../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../../core/utils/dto.utils';

export interface DashboardSummary {
  headcount: number;
  active: number;
  absences: number;
  vacancies: number;
  departures: number;
}

export interface DashboardPendingRequest {
  reference: string;
  agent: string;
  type: string;
  unit: string;
  submittedAt: string;
  status: string;
}

interface DashboardSummaryDto {
  headcount?: number | string;
  totalHeadcount?: number | string;
  total_headcount?: number | string;
  employees_total?: number | string;
  active?: number | string;
  activeAgents?: number | string;
  active_agents?: number | string;
  employees_active?: number | string;
  absences?: number | string;
  runningAbsences?: number | string;
  running_absences?: number | string;
  employees_on_leave?: number | string;
  vacancies?: number | string;
  vacantPositions?: number | string;
  vacant_positions?: number | string;
  positions_vacant?: number | string;
  departures?: number | string;
  departures_next_12m?: number | string;
}

interface DashboardPendingRequestDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  type?: string;
  requestType?: string;
  request_type?: string;
  unit?: string;
  organizationUnit?: string;
  organization_unit?: string;
  submittedAt?: string;
  submitted_at?: string;
  createdAt?: string;
  created_at?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private apiClient: ApiClientService) {}

  getSummary(): Observable<DashboardSummary> {
    return this.apiClient.get<DashboardSummaryDto>(API_ENDPOINTS.dashboard.summary).pipe(
      catchError(() =>
        of({
          headcount: 0,
          active: 0,
          absences: 0,
          vacancies: 0,
          departures: 0,
        })
      ),
      map(mapSummaryDto)
    );
  }

  getPendingRequests(): Observable<DashboardPendingRequest[]> {
    return this.apiClient
      .get<DashboardPendingRequestDto[]>(API_ENDPOINTS.dashboard.pendingRequests)
      .pipe(
        catchError(() => of([])),
        map(mapPendingRequestDtos)
      );
  }
}

function mapSummaryDto(dto: DashboardSummaryDto): DashboardSummary {
  return {
    headcount: toNumberValue(
      readField(dto, ['headcount', 'totalHeadcount', 'total_headcount', 'employees_total'], 0)
    ),
    active: toNumberValue(
      readField(dto, ['active', 'activeAgents', 'active_agents', 'employees_active'], 0)
    ),
    absences: toNumberValue(
      readField(dto, ['absences', 'runningAbsences', 'running_absences', 'employees_on_leave'], 0)
    ),
    vacancies: toNumberValue(
      readField(dto, ['vacancies', 'vacantPositions', 'vacant_positions', 'positions_vacant'], 0)
    ),
    departures: toNumberValue(
      readField(dto, ['departures', 'departures_next_12m', 'departuresNext12m'], 0)
    ),
  };
}

function mapPendingRequestDtos(dtos: DashboardPendingRequestDto[]): DashboardPendingRequest[] {
  return dtos.map((dto) => ({
    reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')),
    agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
    type: toStringValue(readField(dto, ['type', 'requestType', 'request_type'], '')),
    unit: toStringValue(readField(dto, ['unit', 'organizationUnit', 'organization_unit'], '')),
    submittedAt: toStringValue(readField(dto, ['submittedAt', 'submitted_at', 'createdAt', 'created_at'], '')),
    status: toStringValue(readField(dto, ['status'], '')),
  }));
}
