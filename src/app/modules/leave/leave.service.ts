import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

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
  constructor(private apiClient: ApiClientService) {}

  getRequests(): Observable<LeaveRequest[]> {
    return this.apiClient.get<LeaveRequestDto[]>(API_ENDPOINTS.leave.requests).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')),
          agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
          type: toStringValue(readField(dto, ['type', 'leaveType', 'leave_type'], '')),
          startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')),
          endDate: toStringValue(readField(dto, ['endDate', 'end_date'], '')),
          status: toStringValue(readField(dto, ['status'], '')),
        }))
      )
    );
  }

  getBalances(): Observable<LeaveBalance[]> {
    return this.apiClient.get<LeaveBalanceDto[]>(API_ENDPOINTS.leave.balances).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          type: toStringValue(readField(dto, ['type', 'leaveType', 'leave_type'], '')),
          allocated: toNumberValue(readField(dto, ['allocated', 'allocatedDays', 'allocated_days'], 0)),
          consumed: toNumberValue(readField(dto, ['consumed', 'consumedDays', 'consumed_days'], 0)),
          remaining: toNumberValue(readField(dto, ['remaining', 'remainingDays', 'remaining_days'], 0)),
        }))
      )
    );
  }

  getEvents(): Observable<LeaveEvent[]> {
    return this.apiClient.get<LeaveEventDto[]>(API_ENDPOINTS.leave.events).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          title: toStringValue(readField(dto, ['title', 'label'], '')),
          start: toStringValue(readField(dto, ['start', 'startDate', 'start_date'], '')),
          end: readField(dto, ['end', 'endDate', 'end_date'], undefined),
          className: readField(dto, ['className', 'class_name', 'colorClass'], undefined),
        }))
      )
    );
  }
}
