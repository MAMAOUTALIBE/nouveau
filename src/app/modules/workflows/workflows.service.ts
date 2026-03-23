import { Injectable } from '@angular/core';
import { Observable, catchError, of, map } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';

export interface WorkflowDefinition {
  code: string;
  name: string;
  steps: number;
  usedFor: string;
  status: string;
}

export interface WorkflowInstance {
  id: string;
  definition: string;
  requester: string;
  createdOn: string;
  currentStep: string;
  status: string;
}

interface WorkflowDefinitionDto {
  code?: string;
  name?: string;
  label?: string;
  steps?: number | string;
  stepsCount?: number | string;
  steps_count?: number | string;
  usedFor?: string;
  used_for?: string;
  status?: string;
}

interface WorkflowInstanceDto {
  id?: string;
  instanceId?: string;
  instance_id?: string;
  definition?: string;
  definitionName?: string;
  definition_name?: string;
  requester?: string;
  requesterName?: string;
  requester_name?: string;
  createdOn?: string;
  created_on?: string;
  currentStep?: string;
  current_step?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkflowsService {
  constructor(private apiClient: ApiClientService) {}

  getDefinitions(): Observable<WorkflowDefinition[]> {
    return this.apiClient
      .get<WorkflowDefinitionDto[]>(API_ENDPOINTS.workflows.definitions)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            code: toStringValue(readField(dto, ['code'], '')),
            name: toStringValue(readField(dto, ['name', 'label'], '')),
            steps: toNumberValue(readField(dto, ['steps', 'stepsCount', 'steps_count'], 0)),
            usedFor: toStringValue(readField(dto, ['usedFor', 'used_for'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }

  getInstances(): Observable<WorkflowInstance[]> {
    return this.apiClient
      .get<WorkflowInstanceDto[]>(API_ENDPOINTS.workflows.instances)
      .pipe(
        catchError(() => of([])),
        map((items) =>
          items.map((dto) => ({
            id: toStringValue(readField(dto, ['id', 'instanceId', 'instance_id'], '')),
            definition: toStringValue(readField(dto, ['definition', 'definitionName', 'definition_name'], '')),
            requester: toStringValue(readField(dto, ['requester', 'requesterName', 'requester_name'], '')),
            createdOn: toStringValue(readField(dto, ['createdOn', 'created_on'], '')),
            currentStep: toStringValue(readField(dto, ['currentStep', 'current_step'], '')),
            status: toStringValue(readField(dto, ['status'], '')),
          }))
        )
      );
  }
}
