import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toStringValue } from '../../core/utils/dto.utils';

export interface DisciplineCase {
  reference: string;
  agent: string;
  infraction: string;
  openedOn: string;
  status: string;
  sanction?: string;
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
  constructor(private apiClient: ApiClientService) {}

  getCases(): Observable<DisciplineCase[]> {
    return this.apiClient
      .get<DisciplineCaseDto[]>(API_ENDPOINTS.discipline.cases)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            reference: toStringValue(readField(dto, ['reference', 'caseRef', 'case_ref'], '')),
            agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
            infraction: toStringValue(readField(dto, ['infraction', 'reason'], '')),
            openedOn: toStringValue(readField(dto, ['openedOn', 'opened_on'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
            sanction: readField(dto, ['sanction'], undefined),
          }))
        )
      );
  }
}
