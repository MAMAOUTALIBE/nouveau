import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface Application {
  reference: string;
  candidate: string;
  position: string;
  campaign: string;
  status: string;
  receivedOn: string;
}

export interface Campaign {
  code: string;
  title: string;
  department: string;
  openings: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface OnboardingItem {
  agent: string;
  position: string;
  startDate: string;
  checklist: string[];
  status: string;
}

interface ApplicationDto {
  reference?: string;
  requestRef?: string;
  request_ref?: string;
  candidate?: string;
  candidateName?: string;
  candidate_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  campaign?: string;
  campaignTitle?: string;
  campaign_title?: string;
  status?: string;
  receivedOn?: string;
  received_on?: string;
}

interface CampaignDto {
  code?: string;
  title?: string;
  name?: string;
  department?: string;
  departmentName?: string;
  department_name?: string;
  openings?: number | string;
  openPositions?: number | string;
  open_positions?: number | string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  status?: string;
}

interface OnboardingDto {
  agent?: string;
  agentName?: string;
  agent_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  startDate?: string;
  start_date?: string;
  checklist?: string[];
  tasks?: string[];
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class RecruitmentService {
  constructor(private apiClient: ApiClientService) {}

  getApplications(): Observable<Application[]> {
    return this.apiClient
      .get<ApplicationDto[]>(API_ENDPOINTS.recruitment.applications)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')),
            candidate: toStringValue(readField(dto, ['candidate', 'candidateName', 'candidate_name'], '')),
            position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
            campaign: toStringValue(readField(dto, ['campaign', 'campaignTitle', 'campaign_title'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
            receivedOn: toStringValue(readField(dto, ['receivedOn', 'received_on'], '')),
          }))
        )
      );
  }

  getCampaigns(): Observable<Campaign[]> {
    return this.apiClient.get<CampaignDto[]>(API_ENDPOINTS.recruitment.campaigns).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          code: toStringValue(readField(dto, ['code'], '')),
          title: toStringValue(readField(dto, ['title', 'name'], '')),
          department: toStringValue(readField(dto, ['department', 'departmentName', 'department_name'], '')),
          openings: toNumberValue(readField(dto, ['openings', 'openPositions', 'open_positions'], 0)),
          startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')),
          endDate: toStringValue(readField(dto, ['endDate', 'end_date'], '')),
          status: toStringValue(readField(dto, ['status'], '')),
        }))
      )
    );
  }

  getOnboarding(): Observable<OnboardingItem[]> {
    return this.apiClient
      .get<OnboardingDto[]>(API_ENDPOINTS.recruitment.onboarding)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
            position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
            startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')),
            checklist: readField(dto, ['checklist', 'tasks'], []) || [],
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }
}
