import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
  head?: string;
  headTitle?: string;
  staffCount: number;
}

export interface BudgetedPosition {
  code: string;
  structure: string;
  title: string;
  grade: string;
  status: 'Occupé' | 'Ouvert';
  holder?: string;
}

export interface VacantPosition {
  code: string;
  structure: string;
  title: string;
  grade: string;
  openedOn: string;
  priority: 'Haute' | 'Normale' | 'Basse';
}

interface OrgUnitDto {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  parentId?: string;
  parent_id?: string;
  head?: string;
  manager?: string;
  headTitle?: string;
  head_title?: string;
  managerTitle?: string;
  manager_title?: string;
  staffCount?: number | string;
  staff_count?: number | string;
  agentsCount?: number | string;
  agents_count?: number | string;
}

interface BudgetedPositionDto {
  code?: string;
  structure?: string;
  structureName?: string;
  structure_name?: string;
  title?: string;
  label?: string;
  grade?: string;
  status?: 'Occupé' | 'Ouvert' | string;
  holder?: string;
  holderName?: string;
  holder_name?: string;
}

interface VacantPositionDto {
  code?: string;
  structure?: string;
  structureName?: string;
  structure_name?: string;
  title?: string;
  label?: string;
  grade?: string;
  openedOn?: string;
  opened_on?: string;
  openDate?: string;
  open_date?: string;
  priority?: 'Haute' | 'Normale' | 'Basse' | string;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  constructor(private apiClient: ApiClientService) {}

  getOrgUnits(): Observable<OrgUnit[]> {
    return this.apiClient.get<OrgUnitDto[]>(API_ENDPOINTS.organization.units).pipe(
      catchError(() => of([])),
      map((items) =>
        items.map((dto) => ({
          id: toStringValue(readField(dto, ['id', 'code'], '')),
          name: toStringValue(readField(dto, ['name', 'label'], '')),
          parentId: readField(dto, ['parentId', 'parent_id'], undefined),
          head: readField(dto, ['head', 'manager'], undefined),
          headTitle: readField(dto, ['headTitle', 'head_title', 'managerTitle', 'manager_title'], undefined),
          staffCount: toNumberValue(readField(dto, ['staffCount', 'staff_count', 'agentsCount', 'agents_count'], 0)),
        }))
      )
    );
  }

  getBudgetedPositions(): Observable<BudgetedPosition[]> {
    return this.apiClient
      .get<BudgetedPositionDto[]>(API_ENDPOINTS.organization.budgetedPositions)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            structure: toStringValue(readField(dto, ['structure', 'structureName', 'structure_name'], '')),
            title: toStringValue(readField(dto, ['title', 'label'], '')),
            grade: toStringValue(readField(dto, ['grade'], '')),
            status: readField(dto, ['status'], 'Ouvert') as 'Occupé' | 'Ouvert',
            holder: readField(dto, ['holder', 'holderName', 'holder_name'], undefined),
          }))
        )
      );
  }

  getVacantPositions(): Observable<VacantPosition[]> {
    return this.apiClient
      .get<VacantPositionDto[]>(API_ENDPOINTS.organization.vacantPositions)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            structure: toStringValue(readField(dto, ['structure', 'structureName', 'structure_name'], '')),
            title: toStringValue(readField(dto, ['title', 'label'], '')),
            grade: toStringValue(readField(dto, ['grade'], '')),
            openedOn: toStringValue(readField(dto, ['openedOn', 'opened_on', 'openDate', 'open_date'], '')),
            priority: readField(dto, ['priority'], 'Normale') as 'Haute' | 'Normale' | 'Basse',
          }))
        )
      );
  }
}
