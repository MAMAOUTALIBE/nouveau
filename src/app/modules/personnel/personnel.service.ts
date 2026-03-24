import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
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
  required?: boolean;
  fileName?: string;
  fileDataUrl?: string;
}

export interface AgentEducation {
  degree: string;
  field: string;
  institution: string;
  graduationYear: string;
}

export interface AgentIdentityInfo {
  identityType: string;
  identityNumber: string;
  birthDate: string;
  birthPlace: string;
  nationality: string;
}

export interface AgentAdministrativeInfo {
  hireDate: string;
  contractType: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface AgentDetail {
  id: string;
  matricule: string;
  fullName: string;
  direction: string;
  position: string;
  unit: string;
  status: string;
  manager: string;
  email: string;
  phone: string;
  photoUrl: string;
  identity: AgentIdentityInfo;
  administrative: AgentAdministrativeInfo;
  educations: AgentEducation[];
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
  photoUrl?: string;
  identity?: Partial<AgentIdentityInfo>;
  administrative?: Partial<AgentAdministrativeInfo>;
  educations?: AgentEducation[];
  documents?: AgentDocument[];
  isDraft?: boolean;
}

export interface PersonnelUploadedFile {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface AgentListQuery extends CollectionQueryOptions {
  direction?: string;
  status?: string;
}

export interface PersonnelDossier {
  reference: string;
  agent: string;
  type: string;
  status: string;
  updatedAt: string;
}

export interface CreatePersonnelDossierPayload {
  reference?: string;
  agent: string;
  type: string;
  status?: string;
  updatedAt?: string;
}

export interface PersonnelAffectation {
  reference: string;
  agent: string;
  fromUnit: string;
  toUnit: string;
  effectiveDate: string;
  status: string;
}

export interface CreatePersonnelAffectationPayload {
  reference?: string;
  agent: string;
  fromUnit: string;
  toUnit: string;
  effectiveDate: string;
  status?: string;
}

export interface PersonnelDossiersQuery extends CollectionQueryOptions {
  status?: string;
  type?: string;
  agent?: string;
}

export interface PersonnelAffectationsQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
  fromUnit?: string;
  toUnit?: string;
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
  required?: boolean;
  fileName?: string;
  file_name?: string;
  fileDataUrl?: string;
  file_data_url?: string;
  dataUrl?: string;
  data_url?: string;
  url?: string;
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
  direction?: string;
  directionName?: string;
  direction_name?: string;
  status?: string;
  manager?: string;
  managerName?: string;
  manager_name?: string;
  photoUrl?: string;
  photo_url?: string;
  identity?: Partial<AgentIdentityInfo>;
  administrative?: Partial<AgentAdministrativeInfo>;
  educations?: Partial<AgentEducation>[];
  educationHistory?: Partial<AgentEducation>[];
  education_history?: Partial<AgentEducation>[];
  careerEvents?: AgentCareerEventDto[];
  career_events?: AgentCareerEventDto[];
  documents?: AgentDocumentDto[];
}

interface PersonnelDossierDto {
  reference?: string;
  dossierRef?: string;
  dossier_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  type?: string;
  dossierType?: string;
  dossier_type?: string;
  status?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface PersonnelAffectationDto {
  reference?: string;
  assignmentRef?: string;
  assignment_ref?: string;
  agent?: string;
  agentName?: string;
  agent_name?: string;
  fromUnit?: string;
  from_unit?: string;
  toUnit?: string;
  to_unit?: string;
  effectiveDate?: string;
  effective_date?: string;
  status?: string;
}

interface LocalAgentRecord extends AgentDetail {
  direction: string;
  status: string;
  manager: string;
}

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly localStorageKey = 'rh_dev_agents';
  private readonly localDossiersKey = 'rh_dev_personnel_dossiers';
  private readonly localAffectationsKey = 'rh_dev_personnel_affectations';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getAgents(query?: AgentListQuery): Observable<AgentListItem[]> {
    const params = buildCollectionQueryParams(query, {
      direction: query?.direction,
      status: query?.status,
    });

    return this.apiClient
      .get<unknown>(
        API_ENDPOINTS.personnel.agents,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((payload) => normalizeAgentListPayload(payload)),
        map((items) => this.mergeWithLocalFallback(mapAgentListDtos(items), this.readLocalAgentList())),
        map((items) => this.applyLocalAgentQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalAgentQuery(this.readLocalAgentList(), query));
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

  uploadAgentFile(file: File): Observable<PersonnelUploadedFile> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    return this.apiClient.post<PersonnelUploadedFile, FormData>(API_ENDPOINTS.personnel.upload, formData);
  }

  getDossiers(query?: PersonnelDossiersQuery): Observable<PersonnelDossier[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      type: query?.type,
      agent: query?.agent,
    });

    return this.apiClient
      .get<PersonnelDossierDto[]>(
        API_ENDPOINTS.personnel.dossiers,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapDossiers(items)),
        map((items) => this.mergeByKey(items, this.readLocalDossiers(), (item) => item.reference)),
        map((items) => this.applyLocalDossiersQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalDossiersQuery(this.readLocalDossiers(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createDossier(payload: CreatePersonnelDossierPayload): Observable<PersonnelDossier> {
    const normalizedPayload = this.normalizeCreateDossierPayload(payload);

    return this.apiClient
      .post<PersonnelDossierDto, CreatePersonnelDossierPayload>(
        API_ENDPOINTS.personnel.dossiers,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeDossier(dto)),
        map((item) => {
          if (item.reference && item.agent && item.type && item.updatedAt) {
            return item;
          }
          return this.appendLocalDossier(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalDossier(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getAffectations(query?: PersonnelAffectationsQuery): Observable<PersonnelAffectation[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
      fromUnit: query?.fromUnit,
      toUnit: query?.toUnit,
    });

    return this.apiClient
      .get<PersonnelAffectationDto[]>(
        API_ENDPOINTS.personnel.affectations,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapAffectations(items)),
        map((items) => this.mergeByKey(items, this.readLocalAffectations(), (item) => item.reference)),
        map((items) => this.applyLocalAffectationsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalAffectationsQuery(this.readLocalAffectations(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createAffectation(payload: CreatePersonnelAffectationPayload): Observable<PersonnelAffectation> {
    const normalizedPayload = this.normalizeCreateAffectationPayload(payload);

    return this.apiClient
      .post<PersonnelAffectationDto, CreatePersonnelAffectationPayload>(
        API_ENDPOINTS.personnel.affectations,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeAffectation(dto)),
        map((item) => {
          if (item.reference && item.agent && item.fromUnit && item.toUnit && item.effectiveDate) {
            return item;
          }
          return this.appendLocalAffectation(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalAffectation(normalizedPayload));
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

  private mergeByKey<T>(apiItems: T[], localItems: T[], getKey: (item: T) => string): T[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byKey = new Map<string, T>();
    apiItems.forEach((item) => byKey.set(getKey(item), item));
    localItems.forEach((item) => byKey.set(getKey(item), item));
    return Array.from(byKey.values());
  }

  private applyLocalAgentQuery(items: AgentListItem[], query?: AgentListQuery): AgentListItem[] {
    let next = [...items];
    const direction = (query?.direction || '').trim().toLowerCase();
    const status = (query?.status || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (direction) {
      next = next.filter((item) => item.direction.toLowerCase().includes(direction));
    }

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }

    if (search) {
      next = next.filter((item) => {
        return (
          item.id.toLowerCase().includes(search) ||
          item.matricule.toLowerCase().includes(search) ||
          item.fullName.toLowerCase().includes(search) ||
          item.direction.toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.manager.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'fullName').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readAgentField(left, sortBy).toLowerCase();
      const rightValue = this.readAgentField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private toPositiveInt(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback;
    }
    const rounded = Math.round(value);
    return rounded > 0 ? rounded : fallback;
  }

  private readAgentField(agent: AgentListItem, key: string): string {
    switch (key) {
      case 'id':
        return agent.id;
      case 'matricule':
        return agent.matricule;
      case 'direction':
        return agent.direction;
      case 'position':
        return agent.position;
      case 'status':
        return agent.status;
      case 'manager':
        return agent.manager;
      case 'fullName':
      default:
        return agent.fullName;
    }
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

  private mapDossiers(items: PersonnelDossierDto[]): PersonnelDossier[] {
    return (items || [])
      .map((dto) => this.normalizeDossier(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.updatedAt);
  }

  private normalizeDossier(dto: PersonnelDossierDto): PersonnelDossier {
    return {
      reference: toStringValue(readField(dto, ['reference', 'dossierRef', 'dossier_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      type: toStringValue(readField(dto, ['type', 'dossierType', 'dossier_type'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Actif')).trim() || 'Actif',
      updatedAt: toStringValue(readField(dto, ['updatedAt', 'updated_at'], '')).trim(),
    };
  }

  private normalizeCreateDossierPayload(payload: CreatePersonnelDossierPayload): CreatePersonnelDossierPayload {
    const rawUpdatedAt = String(payload.updatedAt || '').trim();
    const parsed = Date.parse(rawUpdatedAt);

    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      type: String(payload.type || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      updatedAt: !rawUpdatedAt
        ? new Date().toISOString()
        : Number.isNaN(parsed)
          ? rawUpdatedAt
          : new Date(parsed).toISOString(),
    };
  }

  private applyLocalDossiersQuery(items: PersonnelDossier[], query?: PersonnelDossiersQuery): PersonnelDossier[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const type = (query?.type || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (type) {
      next = next.filter((item) => item.type.toLowerCase().includes(type));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.type.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.updatedAt.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'updatedAt').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readDossierField(left, sortBy).toLowerCase();
      const rightValue = this.readDossierField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readDossierField(item: PersonnelDossier, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'type':
        return item.type;
      case 'status':
        return item.status;
      case 'updatedAt':
      default:
        return item.updatedAt;
    }
  }

  private appendLocalDossier(payload: CreatePersonnelDossierPayload): PersonnelDossier {
    const current = this.readLocalDossiers();
    const created: PersonnelDossier = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateDossierReference(current),
      agent: String(payload.agent || '').trim(),
      type: String(payload.type || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      updatedAt: String(payload.updatedAt || new Date().toISOString()).trim(),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalDossiers(deduped);
    return created;
  }

  private generateDossierReference(existing: PersonnelDossier[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^DOS-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `DOS-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalDossiers(): PersonnelDossier[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localDossiersKey);
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
          const record = item as Partial<PersonnelDossier>;
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            type: String(record.type || '').trim(),
            status: String(record.status || 'Actif').trim() || 'Actif',
            updatedAt: String(record.updatedAt || '').trim(),
          } as PersonnelDossier;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.type && !!item.updatedAt);
    } catch {
      return [];
    }
  }

  private writeLocalDossiers(items: PersonnelDossier[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localDossiersKey, JSON.stringify(items));
  }

  private mapAffectations(items: PersonnelAffectationDto[]): PersonnelAffectation[] {
    return (items || [])
      .map((dto) => this.normalizeAffectation(dto))
      .filter((item) => !!item.reference && !!item.agent && !!item.fromUnit && !!item.toUnit && !!item.effectiveDate);
  }

  private normalizeAffectation(dto: PersonnelAffectationDto): PersonnelAffectation {
    return {
      reference: toStringValue(readField(dto, ['reference', 'assignmentRef', 'assignment_ref'], '')).trim(),
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      fromUnit: toStringValue(readField(dto, ['fromUnit', 'from_unit'], '')).trim(),
      toUnit: toStringValue(readField(dto, ['toUnit', 'to_unit'], '')).trim(),
      effectiveDate: toStringValue(readField(dto, ['effectiveDate', 'effective_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Planifiee')).trim() || 'Planifiee',
    };
  }

  private normalizeCreateAffectationPayload(payload: CreatePersonnelAffectationPayload): CreatePersonnelAffectationPayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      agent: String(payload.agent || '').trim(),
      fromUnit: String(payload.fromUnit || '').trim(),
      toUnit: String(payload.toUnit || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
  }

  private applyLocalAffectationsQuery(items: PersonnelAffectation[], query?: PersonnelAffectationsQuery): PersonnelAffectation[] {
    let next = [...items];

    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const fromUnit = (query?.fromUnit || '').trim().toLowerCase();
    const toUnit = (query?.toUnit || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (fromUnit) {
      next = next.filter((item) => item.fromUnit.toLowerCase().includes(fromUnit));
    }
    if (toUnit) {
      next = next.filter((item) => item.toUnit.toLowerCase().includes(toUnit));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.agent.toLowerCase().includes(search) ||
          item.fromUnit.toLowerCase().includes(search) ||
          item.toUnit.toLowerCase().includes(search) ||
          item.effectiveDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'effectiveDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readAffectationField(left, sortBy).toLowerCase();
      const rightValue = this.readAffectationField(right, sortBy).toLowerCase();
      if (leftValue === rightValue) return 0;
      if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toPositiveInt(query?.limit, 200);
    const page = this.toPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readAffectationField(item: PersonnelAffectation, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'agent':
        return item.agent;
      case 'fromUnit':
        return item.fromUnit;
      case 'toUnit':
        return item.toUnit;
      case 'status':
        return item.status;
      case 'effectiveDate':
      default:
        return item.effectiveDate;
    }
  }

  private appendLocalAffectation(payload: CreatePersonnelAffectationPayload): PersonnelAffectation {
    const current = this.readLocalAffectations();
    const created: PersonnelAffectation = {
      reference: this.normalizeOptionalText(payload.reference) || this.generateAffectationReference(current),
      agent: String(payload.agent || '').trim(),
      fromUnit: String(payload.fromUnit || '').trim(),
      toUnit: String(payload.toUnit || '').trim(),
      effectiveDate: String(payload.effectiveDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalAffectations(deduped);
    return created;
  }

  private generateAffectationReference(existing: PersonnelAffectation[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^AFF-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `AFF-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalAffectations(): PersonnelAffectation[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localAffectationsKey);
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
          const record = item as Partial<PersonnelAffectation>;
          return {
            reference: String(record.reference || '').trim(),
            agent: String(record.agent || '').trim(),
            fromUnit: String(record.fromUnit || '').trim(),
            toUnit: String(record.toUnit || '').trim(),
            effectiveDate: String(record.effectiveDate || '').trim(),
            status: String(record.status || 'Planifiee').trim() || 'Planifiee',
          } as PersonnelAffectation;
        })
        .filter((item) => !!item.reference && !!item.agent && !!item.fromUnit && !!item.toUnit && !!item.effectiveDate);
    } catch {
      return [];
    }
  }

  private writeLocalAffectations(items: PersonnelAffectation[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localAffectationsKey, JSON.stringify(items));
  }

  private appendLocalAgent(payload: CreateAgentPayload): LocalAgentRecord {
    const records = this.readLocalAgentRecords();
    const id = this.generateAgentId();
    const matricule = payload.matricule?.trim() || this.generateMatricule();
    const identity = normalizeIdentityInfo(payload.identity);
    const administrative = normalizeAdministrativeInfo(payload.administrative);
    const educations = normalizeEducations(payload.educations);
    const documents = mapAgentDocuments((payload.documents || []) as AgentDocumentDto[]);
    const record: LocalAgentRecord = {
      id,
      matricule,
      fullName: payload.fullName.trim(),
      direction: payload.direction.trim(),
      unit: (payload.unit || payload.direction).trim(),
      position: payload.position.trim(),
      status: payload.isDraft ? 'Brouillon' : payload.status.trim(),
      manager: payload.manager.trim(),
      email: (payload.email || '').trim(),
      phone: (payload.phone || '').trim(),
      photoUrl: (payload.photoUrl || '').trim() || './assets/images/faces/profile.jpg',
      identity,
      administrative,
      educations,
      careerEvents: [],
      documents,
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
      identity: normalizeIdentityInfo(record.identity),
      administrative: normalizeAdministrativeInfo(record.administrative),
      educations: normalizeEducations(record.educations),
      careerEvents: Array.isArray(record.careerEvents) ? record.careerEvents : [],
      documents: mapAgentDocuments(Array.isArray(record.documents) ? record.documents : []),
    };
  }

  private toDetail(record: LocalAgentRecord): AgentDetail {
    return {
      id: record.id,
      matricule: record.matricule,
      fullName: record.fullName,
      direction: record.direction,
      position: record.position,
      unit: record.unit,
      status: record.status,
      manager: record.manager,
      email: record.email,
      phone: record.phone,
      photoUrl: record.photoUrl,
      identity: normalizeIdentityInfo(record.identity),
      administrative: normalizeAdministrativeInfo(record.administrative),
      educations: normalizeEducations(record.educations),
      careerEvents: record.careerEvents || [],
      documents: mapAgentDocuments(record.documents || []),
    };
  }

  private generateAgentId(): string {
    return `local-${Date.now()}`;
  }

  private generateMatricule(): string {
    const suffix = `${Date.now()}`.slice(-6);
    return `PRM-${suffix}`;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
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
    required: Boolean(readField(doc, ['required'], false)),
    fileName: toStringValue(readField(doc, ['fileName', 'file_name'], '')),
    fileDataUrl: toStringValue(
      readField(doc, ['fileDataUrl', 'file_data_url', 'dataUrl', 'data_url', 'url'], ''),
      ''
    ),
  }));
}

function normalizeIdentityInfo(raw: any): AgentIdentityInfo {
  return {
    identityType: toStringValue(readField(raw, ['identityType', 'identity_type', 'type'], ''), ''),
    identityNumber: toStringValue(readField(raw, ['identityNumber', 'identity_number', 'number'], ''), ''),
    birthDate: toStringValue(readField(raw, ['birthDate', 'birth_date'], ''), ''),
    birthPlace: toStringValue(readField(raw, ['birthPlace', 'birth_place'], ''), ''),
    nationality: toStringValue(readField(raw, ['nationality'], ''), ''),
  };
}

function normalizeAdministrativeInfo(raw: any): AgentAdministrativeInfo {
  return {
    hireDate: toStringValue(readField(raw, ['hireDate', 'hire_date'], ''), ''),
    contractType: toStringValue(readField(raw, ['contractType', 'contract_type'], ''), ''),
    address: toStringValue(readField(raw, ['address'], ''), ''),
    emergencyContactName: toStringValue(readField(raw, ['emergencyContactName', 'emergency_contact_name'], ''), ''),
    emergencyContactPhone: toStringValue(
      readField(raw, ['emergencyContactPhone', 'emergency_contact_phone'], ''),
      ''
    ),
  };
}

function normalizeEducations(raw: any): AgentEducation[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => ({
      degree: toStringValue(readField(item, ['degree', 'diploma'], ''), ''),
      field: toStringValue(readField(item, ['field', 'speciality', 'specialty'], ''), ''),
      institution: toStringValue(readField(item, ['institution', 'school'], ''), ''),
      graduationYear: toStringValue(readField(item, ['graduationYear', 'graduation_year', 'year'], ''), ''),
    }))
    .filter((item) => item.degree || item.institution || item.field || item.graduationYear);
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

function normalizeAgentListPayload(payload: unknown): AgentListItemDto[] {
  let raw = payload as any;

  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (Array.isArray(raw)) {
    return raw as AgentListItemDto[];
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const nested = readField(raw as Record<string, unknown>, ['items', 'data', 'results', 'records'], []);
  return Array.isArray(nested) ? (nested as AgentListItemDto[]) : [];
}

function mapAgentDetailDto(dto: AgentDetailDto, fallbackId = ''): AgentDetail {
  return {
    id: toStringValue(readField(dto, ['id', 'matricule', 'employeeId', 'employee_id'], fallbackId)),
    matricule: toStringValue(readField(dto, ['matricule', 'employeeId', 'employee_id'], '')),
    fullName: toStringValue(readField(dto, ['fullName', 'full_name'], '')),
    direction: toStringValue(readField(dto, ['direction', 'directionName', 'direction_name'], '')),
    position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')),
    unit: toStringValue(readField(dto, ['unit', 'unitName', 'unit_name'], '')),
    status: toStringValue(readField(dto, ['status'], '')),
    manager: toStringValue(readField(dto, ['manager', 'managerName', 'manager_name'], '')),
    email: toStringValue(readField(dto, ['email'], '')),
    phone: toStringValue(readField(dto, ['phone', 'mobile'], '')),
    photoUrl: toStringValue(readField(dto, ['photoUrl', 'photo_url'], './assets/images/faces/profile.jpg')),
    identity: normalizeIdentityInfo(readField(dto, ['identity'], {})),
    administrative: normalizeAdministrativeInfo(readField(dto, ['administrative'], {})),
    educations: normalizeEducations(
      readField(dto, ['educations', 'educationHistory', 'education_history'], [])
    ),
    careerEvents: mapAgentCareerEvents(readField(dto, ['careerEvents', 'career_events'], [])),
    documents: mapAgentDocuments(readField(dto, ['documents'], [])),
  };
}
