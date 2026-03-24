import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';
import { environment } from '../../../environments/environment';

export interface OrgUnit {
  id: string;
  name: string;
  parentId?: string;
  head?: string;
  headTitle?: string;
  staffCount: number;
}

export interface CreateOrgUnitPayload {
  name: string;
  parentId?: string;
  head?: string;
  headTitle?: string;
  staffCount?: number;
}

export interface CreateBudgetedPositionPayload {
  code?: string;
  structure: string;
  title: string;
  grade: string;
  status?: 'Occupe' | 'Ouvert' | 'Occupé';
  holder?: string;
}

export interface CreateVacantPositionPayload {
  code?: string;
  structure: string;
  title: string;
  grade: string;
  openedOn: string;
  priority?: 'Haute' | 'Normale' | 'Basse';
}

export interface BudgetedPosition {
  code: string;
  structure: string;
  title: string;
  grade: string;
  status: 'Occupe' | 'Ouvert';
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

export interface OrgUnitsQuery extends CollectionQueryOptions {
  parentId?: string;
  head?: string;
}

export interface BudgetedPositionsQuery extends CollectionQueryOptions {
  status?: string;
  structure?: string;
}

export interface VacantPositionsQuery extends CollectionQueryOptions {
  priority?: string;
  structure?: string;
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
  private readonly localStorageKey = 'rh_dev_org_units';
  private readonly localBudgetedPositionsKey = 'rh_dev_budgeted_positions';
  private readonly localVacantPositionsKey = 'rh_dev_vacant_positions';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getOrgUnits(query?: OrgUnitsQuery): Observable<OrgUnit[]> {
    const params = buildCollectionQueryParams(query, {
      parentId: query?.parentId,
      head: query?.head,
    });

    return this.apiClient
      .get<OrgUnitDto[]>(
        API_ENDPOINTS.organization.units,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapOrgUnits(items)),
        map((items) => this.mergeWithLocalFallback(items, this.readLocalOrgUnits())),
        map((items) => this.applyLocalOrgUnitQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalOrgUnitQuery(this.readLocalOrgUnits(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createOrgUnit(payload: CreateOrgUnitPayload): Observable<OrgUnit> {
    const normalizedPayload = this.normalizeCreatePayload(payload);

    return this.apiClient
      .post<OrgUnitDto, CreateOrgUnitPayload>(
        API_ENDPOINTS.organization.units,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeOrgUnit(dto)),
        map((unit) => {
          if (unit.id && unit.name) {
            return unit;
          }
          return this.appendLocalOrgUnit(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalOrgUnit(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getBudgetedPositions(query?: BudgetedPositionsQuery): Observable<BudgetedPosition[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      structure: query?.structure,
    });

    return this.apiClient
      .get<BudgetedPositionDto[]>(
        API_ENDPOINTS.organization.budgetedPositions,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapBudgetedPositions(items)),
        map((items) => this.mergeByKey(items, this.readLocalBudgetedPositions(), (item) => item.code)),
        map((items) => this.applyLocalBudgetedQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalBudgetedQuery(this.readLocalBudgetedPositions(), query));
          }
          return throwError(() => error);
        })
      );
  }

  getVacantPositions(query?: VacantPositionsQuery): Observable<VacantPosition[]> {
    const params = buildCollectionQueryParams(query, {
      priority: query?.priority,
      structure: query?.structure,
    });

    return this.apiClient
      .get<VacantPositionDto[]>(
        API_ENDPOINTS.organization.vacantPositions,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapVacantPositions(items)),
        map((items) => this.mergeByKey(items, this.readLocalVacantPositions(), (item) => item.code)),
        map((items) => this.applyLocalVacantQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalVacantQuery(this.readLocalVacantPositions(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createBudgetedPosition(payload: CreateBudgetedPositionPayload): Observable<BudgetedPosition> {
    const normalizedPayload = this.normalizeCreateBudgetedPayload(payload);

    return this.apiClient
      .post<BudgetedPositionDto, CreateBudgetedPositionPayload>(
        API_ENDPOINTS.organization.budgetedPositions,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeBudgetedPosition(dto)),
        map((item) => {
          if (item.code && item.structure && item.title) {
            return item;
          }
          return this.appendLocalBudgetedPosition(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalBudgetedPosition(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  createVacantPosition(payload: CreateVacantPositionPayload): Observable<VacantPosition> {
    const normalizedPayload = this.normalizeCreateVacantPayload(payload);

    return this.apiClient
      .post<VacantPositionDto, CreateVacantPositionPayload>(
        API_ENDPOINTS.organization.vacantPositions,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeVacantPosition(dto)),
        map((item) => {
          if (item.code && item.structure && item.title) {
            return item;
          }
          return this.appendLocalVacantPosition(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalVacantPosition(normalizedPayload));
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

  private mapOrgUnits(items: OrgUnitDto[]): OrgUnit[] {
    return items
      .map((dto) => this.normalizeOrgUnit(dto))
      .filter((item) => !!item.id && !!item.name);
  }

  private normalizeOrgUnit(dto: OrgUnitDto, fallbackId = ''): OrgUnit {
    const id = toStringValue(readField(dto, ['id', 'code'], fallbackId)).trim();
    const name = toStringValue(readField(dto, ['name', 'label'], '')).trim();
    const parentId = this.normalizeOptionalText(readField(dto, ['parentId', 'parent_id'], undefined));
    const head = this.normalizeOptionalText(readField(dto, ['head', 'manager'], undefined));
    const headTitle = this.normalizeOptionalText(
      readField(dto, ['headTitle', 'head_title', 'managerTitle', 'manager_title'], undefined)
    );

    return {
      id,
      name,
      parentId,
      head,
      headTitle,
      staffCount: toNumberValue(readField(dto, ['staffCount', 'staff_count', 'agentsCount', 'agents_count'], 0)),
    };
  }

  private normalizeCreatePayload(payload: CreateOrgUnitPayload): CreateOrgUnitPayload {
    const staffCountRaw = Number(payload.staffCount ?? 0);
    const staffCount = Number.isFinite(staffCountRaw) && staffCountRaw >= 0 ? Math.round(staffCountRaw) : 0;

    return {
      name: String(payload.name || '').trim(),
      parentId: this.normalizeOptionalText(payload.parentId),
      head: this.normalizeOptionalText(payload.head),
      headTitle: this.normalizeOptionalText(payload.headTitle),
      staffCount,
    };
  }

  private mergeWithLocalFallback(apiItems: OrgUnit[], localItems: OrgUnit[]): OrgUnit[] {
    if (!this.fallbackEnabled) {
      return apiItems;
    }

    const byId = new Map<string, OrgUnit>();
    apiItems.forEach((item) => byId.set(item.id, item));
    localItems.forEach((item) => byId.set(item.id, item));
    return Array.from(byId.values());
  }

  private applyLocalOrgUnitQuery(items: OrgUnit[], query?: OrgUnitsQuery): OrgUnit[] {
    let next = [...items];
    const parentId = (query?.parentId || '').trim().toLowerCase();
    const head = (query?.head || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (parentId) {
      next = next.filter((item) => (item.parentId || '').toLowerCase().includes(parentId));
    }

    if (head) {
      next = next.filter((item) => (item.head || '').toLowerCase().includes(head));
    }

    if (search) {
      next = next.filter((item) => {
        return (
          item.id.toLowerCase().includes(search) ||
          item.name.toLowerCase().includes(search) ||
          (item.parentId || '').toLowerCase().includes(search) ||
          (item.head || '').toLowerCase().includes(search) ||
          (item.headTitle || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'name').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readOrgUnitField(left, sortBy);
      const rightValue = this.readOrgUnitField(right, sortBy);

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        if (leftValue === rightValue) return 0;
        if (leftValue < rightValue) return sortOrder === 'asc' ? -1 : 1;
        return sortOrder === 'asc' ? 1 : -1;
      }

      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readOrgUnitField(unit: OrgUnit, field: string): string | number {
    switch (field) {
      case 'id':
        return unit.id;
      case 'name':
        return unit.name;
      case 'parentId':
        return unit.parentId || '';
      case 'head':
        return unit.head || '';
      case 'headTitle':
        return unit.headTitle || '';
      case 'staffCount':
        return unit.staffCount;
      default:
        return '';
    }
  }

  private appendLocalOrgUnit(payload: CreateOrgUnitPayload): OrgUnit {
    const current = this.readLocalOrgUnits();
    const id = this.generateLocalOrgUnitId(payload.name, current);
    const created: OrgUnit = {
      id,
      name: String(payload.name || '').trim(),
      parentId: this.normalizeOptionalText(payload.parentId),
      head: this.normalizeOptionalText(payload.head),
      headTitle: this.normalizeOptionalText(payload.headTitle),
      staffCount: this.toNonNegativeInt(payload.staffCount, 0),
    };
    current.push(created);
    this.writeLocalOrgUnits(current);
    return created;
  }

  private generateLocalOrgUnitId(name: string, existing: OrgUnit[]): string {
    const normalizedName = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    const base = normalizedName || 'UNIT';

    let candidate = `ORG-${base}`;
    let suffix = 2;
    const ids = new Set(existing.map((item) => item.id));
    while (ids.has(candidate)) {
      candidate = `ORG-${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private readLocalOrgUnits(): OrgUnit[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localStorageKey);
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
          const record = item as Partial<OrgUnit>;
          return {
            id: String(record.id || '').trim(),
            name: String(record.name || '').trim(),
            parentId: this.normalizeOptionalText(record.parentId),
            head: this.normalizeOptionalText(record.head),
            headTitle: this.normalizeOptionalText(record.headTitle),
            staffCount: this.toNonNegativeInt(record.staffCount, 0),
          } as OrgUnit;
        })
        .filter((item) => !!item.id && !!item.name);
    } catch {
      return [];
    }
  }

  private writeLocalOrgUnits(items: OrgUnit[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.localStorageKey, JSON.stringify(items));
  }

  private mapBudgetedPositions(items: BudgetedPositionDto[]): BudgetedPosition[] {
    return items
      .map((dto) => this.normalizeBudgetedPosition(dto))
      .filter((item) => !!item.code && !!item.structure && !!item.title);
  }

  private normalizeBudgetedPosition(dto: BudgetedPositionDto, fallbackCode = ''): BudgetedPosition {
    const rawStatus = toStringValue(readField(dto, ['status'], 'Ouvert')).trim().toLowerCase();
    const status: 'Occupe' | 'Ouvert' = rawStatus === 'occupe' || rawStatus === 'occupé' ? 'Occupe' : 'Ouvert';
    return {
      code: toStringValue(readField(dto, ['code'], fallbackCode)).trim(),
      structure: toStringValue(readField(dto, ['structure', 'structureName', 'structure_name'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'label'], '')).trim(),
      grade: toStringValue(readField(dto, ['grade'], '')).trim(),
      status,
      holder: this.normalizeOptionalText(readField(dto, ['holder', 'holderName', 'holder_name'], undefined)),
    };
  }

  private normalizeCreateBudgetedPayload(payload: CreateBudgetedPositionPayload): CreateBudgetedPositionPayload {
    const rawStatus = String(payload.status || 'Ouvert').trim().toLowerCase();
    const status: 'Occupe' | 'Ouvert' = rawStatus === 'occupe' || rawStatus === 'occupé' ? 'Occupe' : 'Ouvert';
    return {
      code: this.normalizeOptionalText(payload.code),
      structure: String(payload.structure || '').trim(),
      title: String(payload.title || '').trim(),
      grade: String(payload.grade || '').trim(),
      status,
      holder: this.normalizeOptionalText(payload.holder),
    };
  }

  private applyLocalBudgetedQuery(items: BudgetedPosition[], query?: BudgetedPositionsQuery): BudgetedPosition[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const structure = (query?.structure || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (structure) {
      next = next.filter((item) => item.structure.toLowerCase().includes(structure));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.structure.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.grade.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          (item.holder || '').toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'code').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readBudgetedField(left, sortBy);
      const rightValue = this.readBudgetedField(right, sortBy);
      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readBudgetedField(item: BudgetedPosition, field: string): string {
    switch (field) {
      case 'code':
        return item.code;
      case 'structure':
        return item.structure;
      case 'title':
        return item.title;
      case 'grade':
        return item.grade;
      case 'status':
        return item.status;
      case 'holder':
        return item.holder || '';
      default:
        return '';
    }
  }

  private appendLocalBudgetedPosition(payload: CreateBudgetedPositionPayload): BudgetedPosition {
    const current = this.readLocalBudgetedPositions();
    const code = this.normalizeOptionalText(payload.code) || this.generateBudgetedCode(payload.structure, current);
    const created: BudgetedPosition = {
      code,
      structure: String(payload.structure || '').trim(),
      title: String(payload.title || '').trim(),
      grade: String(payload.grade || '').trim(),
      status: payload.status === 'Occupe' || payload.status === 'Occupé' ? 'Occupe' : 'Ouvert',
      holder: this.normalizeOptionalText(payload.holder),
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalBudgetedPositions(deduped);
    return created;
  }

  private generateBudgetedCode(structure: string, existing: BudgetedPosition[]): string {
    const structureCode = this.normalizeIdPart(structure).slice(0, 12) || 'ORG';
    let sequence = 1;
    const codes = new Set(existing.map((item) => item.code));
    let candidate = `PB-${structureCode}-${String(sequence).padStart(3, '0')}`;
    while (codes.has(candidate)) {
      sequence += 1;
      candidate = `PB-${structureCode}-${String(sequence).padStart(3, '0')}`;
    }
    return candidate;
  }

  private readLocalBudgetedPositions(): BudgetedPosition[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localBudgetedPositionsKey);
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
          const record = item as Partial<BudgetedPosition>;
          return {
            code: String(record.code || '').trim(),
            structure: String(record.structure || '').trim(),
            title: String(record.title || '').trim(),
            grade: String(record.grade || '').trim(),
            status: record.status === 'Occupe' ? 'Occupe' : 'Ouvert',
            holder: this.normalizeOptionalText(record.holder),
          } as BudgetedPosition;
        })
        .filter((item) => !!item.code && !!item.structure && !!item.title);
    } catch {
      return [];
    }
  }

  private writeLocalBudgetedPositions(items: BudgetedPosition[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.localBudgetedPositionsKey, JSON.stringify(items));
  }

  private mapVacantPositions(items: VacantPositionDto[]): VacantPosition[] {
    return items
      .map((dto) => this.normalizeVacantPosition(dto))
      .filter((item) => !!item.code && !!item.structure && !!item.title);
  }

  private normalizeVacantPosition(dto: VacantPositionDto, fallbackCode = ''): VacantPosition {
    const rawPriority = toStringValue(readField(dto, ['priority'], 'Normale')).trim();
    const priority = this.normalizePriority(rawPriority);
    return {
      code: toStringValue(readField(dto, ['code'], fallbackCode)).trim(),
      structure: toStringValue(readField(dto, ['structure', 'structureName', 'structure_name'], '')).trim(),
      title: toStringValue(readField(dto, ['title', 'label'], '')).trim(),
      grade: toStringValue(readField(dto, ['grade'], '')).trim(),
      openedOn: toStringValue(readField(dto, ['openedOn', 'opened_on', 'openDate', 'open_date'], '')).trim(),
      priority,
    };
  }

  private normalizeCreateVacantPayload(payload: CreateVacantPositionPayload): CreateVacantPositionPayload {
    return {
      code: this.normalizeOptionalText(payload.code),
      structure: String(payload.structure || '').trim(),
      title: String(payload.title || '').trim(),
      grade: String(payload.grade || '').trim(),
      openedOn: String(payload.openedOn || '').trim(),
      priority: this.normalizePriority(payload.priority || 'Normale'),
    };
  }

  private applyLocalVacantQuery(items: VacantPosition[], query?: VacantPositionsQuery): VacantPosition[] {
    let next = [...items];
    const priority = (query?.priority || '').trim().toLowerCase();
    const structure = (query?.structure || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (priority) {
      next = next.filter((item) => item.priority.toLowerCase().includes(priority));
    }
    if (structure) {
      next = next.filter((item) => item.structure.toLowerCase().includes(structure));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.structure.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.grade.toLowerCase().includes(search) ||
          item.openedOn.toLowerCase().includes(search) ||
          item.priority.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'openedOn').trim();
    const sortOrder = query?.sortOrder === 'desc' ? 'desc' : 'asc';
    next.sort((left, right) => {
      const leftValue = this.readVacantField(left, sortBy);
      const rightValue = this.readVacantField(right, sortBy);
      const leftText = String(leftValue).toLowerCase();
      const rightText = String(rightValue).toLowerCase();
      if (leftText === rightText) return 0;
      if (leftText < rightText) return sortOrder === 'asc' ? -1 : 1;
      return sortOrder === 'asc' ? 1 : -1;
    });

    const limit = this.toStrictPositiveInt(query?.limit, 200);
    const page = this.toStrictPositiveInt(query?.page, 1);
    const offset = (page - 1) * limit;
    return next.slice(offset, offset + limit);
  }

  private readVacantField(item: VacantPosition, field: string): string {
    switch (field) {
      case 'code':
        return item.code;
      case 'structure':
        return item.structure;
      case 'title':
        return item.title;
      case 'grade':
        return item.grade;
      case 'openedOn':
        return item.openedOn;
      case 'priority':
        return item.priority;
      default:
        return '';
    }
  }

  private appendLocalVacantPosition(payload: CreateVacantPositionPayload): VacantPosition {
    const current = this.readLocalVacantPositions();
    const code = this.normalizeOptionalText(payload.code) || this.generateVacantCode(current);
    const created: VacantPosition = {
      code,
      structure: String(payload.structure || '').trim(),
      title: String(payload.title || '').trim(),
      grade: String(payload.grade || '').trim(),
      openedOn: String(payload.openedOn || '').trim(),
      priority: this.normalizePriority(payload.priority || 'Normale'),
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalVacantPositions(deduped);
    return created;
  }

  private generateVacantCode(existing: VacantPosition[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^VAC-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `VAC-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalVacantPositions(): VacantPosition[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localVacantPositionsKey);
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
          const record = item as Partial<VacantPosition>;
          return {
            code: String(record.code || '').trim(),
            structure: String(record.structure || '').trim(),
            title: String(record.title || '').trim(),
            grade: String(record.grade || '').trim(),
            openedOn: String(record.openedOn || '').trim(),
            priority: this.normalizePriority(record.priority || 'Normale'),
          } as VacantPosition;
        })
        .filter((item) => !!item.code && !!item.structure && !!item.title);
    } catch {
      return [];
    }
  }

  private writeLocalVacantPositions(items: VacantPosition[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.localVacantPositionsKey, JSON.stringify(items));
  }

  private normalizePriority(value: unknown): 'Haute' | 'Normale' | 'Basse' {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'haute') return 'Haute';
    if (normalized === 'basse') return 'Basse';
    return 'Normale';
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

  private normalizeIdPart(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded >= 0 ? rounded : fallback;
  }

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }
}
