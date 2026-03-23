import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toStringValue } from '../../core/utils/dto.utils';
import { environment } from '../../../environments/environment';

export interface AgentListItem {
  id: string;
  matricule: string;
  fullName: string;
  direction: string;
  position: string;
  status: string;
  manager: string;
}

export interface AgentCareerEvent {
  title: string;
  description: string;
  date: string;
}

export interface AgentDocument {
  type: string;
  reference: string;
  status: string;
}

export interface AgentDetail {
  id: string;
  matricule: string;
  fullName: string;
  position: string;
  unit: string;
  email: string;
  phone: string;
  photoUrl: string;
  careerEvents: AgentCareerEvent[];
  documents: AgentDocument[];
}

export interface CreateAgentPayload {
  matricule?: string;
  fullName: string;
  direction: string;
  unit?: string;
  position: string;
  status: string;
  manager: string;
  email?: string;
  phone?: string;
}

interface AgentListItemDto {
  id?: string;
  matricule?: string;
  employeeId?: string;
  employee_id?: string;
  fullName?: string;
  full_name?: string;
  direction?: string;
  directionName?: string;
  direction_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  status?: string;
  manager?: string;
  managerName?: string;
  manager_name?: string;
}

interface AgentCareerEventDto {
  title?: string;
  label?: string;
  description?: string;
  detail?: string;
  date?: string;
  eventDate?: string;
  event_date?: string;
}

interface AgentDocumentDto {
  type?: string;
  category?: string;
  reference?: string;
  ref?: string;
  status?: string;
}

interface AgentDetailDto {
  id?: string;
  matricule?: string;
  employeeId?: string;
  employee_id?: string;
  fullName?: string;
  full_name?: string;
  position?: string;
  positionTitle?: string;
  position_title?: string;
  unit?: string;
  unitName?: string;
  unit_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  photoUrl?: string;
  photo_url?: string;
  careerEvents?: AgentCareerEventDto[];
  career_events?: AgentCareerEventDto[];
  documents?: AgentDocumentDto[];
}

interface LocalAgentRecord extends AgentDetail {
  direction: string;
  status: string;
  manager: string;
}

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly localStorageKey = 'rh_dev_agents';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;

  constructor(private apiClient: ApiClientService) {}

  getAgents(): Observable<AgentListItem[]> {
    return this.apiClient
      .get<AgentListItemDto[]>(
        API_ENDPOINTS.personnel.agents,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mergeWithLocalFallback(mapAgentListDtos(items), this.readLocalAgentList())),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.readLocalAgentList());
          }
          return throwError(() => error);
        })
      );
  }

  getAgentById(id: string): Observable<AgentDetail | null> {
    return this.apiClient
      .get<AgentDetailDto>(
        API_ENDPOINTS.personnel.agentDetail(id),
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => mapAgentDetailDto(dto, id)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localAgent = this.readLocalAgentRecords().find((agent) => agent.id === id);
            return of(localAgent ? this.toDetail(localAgent) : null);
          }
          return of(null);
        })
      );
  }

  createAgent(payload: CreateAgentPayload): Observable<AgentDetail> {
    return this.apiClient
      .post<AgentDetailDto, CreateAgentPayload>(
        API_ENDPOINTS.personnel.agents,
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => mapAgentDetailDto(dto)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            const localRecord = this.appendLocalAgent(payload);
            return of(this.toDetail(localRecord));
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

  private mergeWithLocalFallback(apiItems: AgentListItem[], localItems: AgentListItem[]): AgentListItem[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byId = new Map<string, AgentListItem>();
    apiItems.forEach((item) => byId.set(item.id, item));
    localItems.forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  }

  private readLocalAgentList(): AgentListItem[] {
    return this.readLocalAgentRecords().map((record) => ({
      id: record.id,
      matricule: record.matricule,
      fullName: record.fullName,
      direction: record.direction,
      position: record.position,
      status: record.status,
      manager: record.manager,
    }));
  }

  private appendLocalAgent(payload: CreateAgentPayload): LocalAgentRecord {
    const records = this.readLocalAgentRecords();
    const id = this.generateAgentId();
    const matricule = payload.matricule?.trim() || this.generateMatricule();
    const record: LocalAgentRecord = {
      id,
      matricule,
      fullName: payload.fullName.trim(),
      direction: payload.direction.trim(),
      unit: (payload.unit || payload.direction).trim(),
      position: payload.position.trim(),
      status: payload.status.trim(),
      manager: payload.manager.trim(),
      email: (payload.email || '').trim(),
      phone: (payload.phone || '').trim(),
      photoUrl: './assets/images/faces/profile.jpg',
      careerEvents: [],
      documents: [],
    };

    records.push(record);
    localStorage.setItem(this.localStorageKey, JSON.stringify(records));
    return record;
  }

  private readLocalAgentRecords(): LocalAgentRecord[] {
    if (!this.fallbackEnabled) {
      return [];
    }

    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((record) => this.normalizeLocalRecord(record))
        .filter((record): record is LocalAgentRecord => !!record);
    } catch {
      return [];
    }
  }

  private normalizeLocalRecord(record: any): LocalAgentRecord | null {
    if (!record || typeof record !== 'object') {
      return null;
    }

    const id = toStringValue(record.id, '');
    if (!id) return null;

    return {
      id,
      matricule: toStringValue(record.matricule, ''),
      fullName: toStringValue(record.fullName, ''),
      direction: toStringValue(record.direction, ''),
      unit: toStringValue(record.unit, ''),
      position: toStringValue(record.position, ''),
      status: toStringValue(record.status, ''),
      manager: toStringValue(record.manager, ''),
      email: toStringValue(record.email, ''),
      phone: toStringValue(record.phone, ''),
      photoUrl: toStringValue(record.photoUrl, './assets/images/faces/profile.jpg'),
      careerEvents: Array.isArray(record.careerEvents) ? record.careerEvents : [],
      documents: Array.isArray(record.documents) ? record.documents : [],
    };
  }

  private toDetail(record: LocalAgentRecord): AgentDetail {
    return {
      id: record.id,
      matricule: record.matricule,
      fullName: record.fullName,
      position: record.position,
      unit: record.unit,
      email: record.email,
      phone: record.phone,
      photoUrl: record.photoUrl,
      careerEvents: record.careerEvents || [],
      documents: record.documents || [],
    };
  }

  private generateAgentId(): string {
    return `local-${Date.now()}`;
  }

  private generateMatricule(): string {
    const suffix = `${Date.now()}`.slice(-6);
    return `PRM-${suffix}`;
  }
}

function mapAgentCareerEvents(events: AgentCareerEventDto[]): AgentCareerEvent[] {
  return (events || []).map((event) => ({
    title: toStringValue(readField(event, ['title', 'label'], '')),
    description: toStringValue(readField(event, ['description', 'detail'], '')),
    date: toStringValue(readField(event, ['date', 'eventDate', 'event_date'], '')),
  }));
}

function mapAgentDocuments(documents: AgentDocumentDto[]): AgentDocument[] {
  return (documents || []).map((doc) => ({
    type: toStringValue(readField(doc, ['type', 'category'], '')),
    reference: toStringValue(readField(doc, ['reference', 'ref'], '')),
    status: toStringValue(readField(doc, ['status'], '')),
  }));
}

function mapAgentListDtos(items: AgentListItemDto[]): AgentListItem[] {
  return items.map((dto) => ({
    id: toStringValue(readField(dto, ['id', 'matricule', 'employeeId', 'employee_id'], '')),
    matricule: toStringValue(readField(dto, ['matricule', 'employeeId', 'employee_id'], '')),
    fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
    direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
    position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
    status: toStringValue(readField(dto, ['status'], '')),
    manager: toStringValue(readField(dto, ['manager', 'managerName', 'manager_name'], '')),
  }));
}

function mapAgentDetailDto(dto: AgentDetailDto, fallbackId = ''): AgentDetail {
  return {
    id: toStringValue(readField(dto, ['id', 'matricule', 'employeeId', 'employee_id'], fallbackId)),
    matricule: toStringValue(readField(dto, ['matricule', 'employeeId', 'employee_id'], '')),
    fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
    position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
    unit: toStringValue(readField(dto, ['unit', 'unitName', 'unit_name'], '')),
    email: toStringValue(readField(dto, ['email'], '')),
    phone: toStringValue(readField(dto, ['phone', 'mobile'], '')),
    photoUrl: toStringValue(readField(dto, ['photoUrl', 'photo_url'], './assets/images/faces/profile.jpg')),
    careerEvents: mapAgentCareerEvents(readField(dto, ['careerEvents', 'career_events'], [])),
    documents: mapAgentDocuments(readField(dto, ['documents'], [])),
  };
}
