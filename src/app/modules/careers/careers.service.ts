import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
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
  constructor(private apiClient: ApiClientService) {}

  getMovesByType(type: CareerMove['type']): Observable<CareerMove[]> {
    return this.apiClient
      .get<CareerMoveDto[]>(API_ENDPOINTS.careers.moves, { type })
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], '')),
            agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')),
            type: readField(dto, ['type', 'movementType', 'movement_type'], type) as CareerMove['type'],
            from: readField(dto, ['from', 'fromLabel', 'from_label'], undefined),
            to: toStringValue(readField(dto, ['to', 'toLabel', 'to_label'], '')),
            effectiveDate: toStringValue(readField(dto, ['effectiveDate', 'effective_date'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }
}
