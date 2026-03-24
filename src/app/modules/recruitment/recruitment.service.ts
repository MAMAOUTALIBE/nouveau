import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { CollectionQueryOptions, buildCollectionQueryParams } from '../../core/utils/collection-query.utils';
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

export interface CreateApplicationPayload {
  reference?: string;
  candidate: string;
  position: string;
  campaign: string;
  status?: string;
  receivedOn: string;
}

export interface CreateCampaignPayload {
  code?: string;
  title: string;
  department: string;
  openings: number;
  startDate: string;
  endDate: string;
  status?: string;
}

export interface CreateOnboardingPayload {
  agent: string;
  position: string;
  startDate: string;
  checklist?: string[];
  status?: string;
}

export interface RecruitmentApplicationsQuery extends CollectionQueryOptions {
  status?: string;
  campaign?: string;
  position?: string;
}

export interface RecruitmentCampaignsQuery extends CollectionQueryOptions {
  status?: string;
  department?: string;
}

export interface RecruitmentOnboardingQuery extends CollectionQueryOptions {
  status?: string;
  agent?: string;
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
  private readonly localApplicationsKey = 'rh_dev_recruitment_applications';
  private readonly localCampaignsKey = 'rh_dev_recruitment_campaigns';
  private readonly localOnboardingKey = 'rh_dev_recruitment_onboarding';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly apiClient = inject(ApiClientService);

  getApplications(query?: RecruitmentApplicationsQuery): Observable<Application[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      campaign: query?.campaign,
      position: query?.position,
    });

    return this.apiClient
      .get<ApplicationDto[]>(
        API_ENDPOINTS.recruitment.applications,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapApplications(items)),
        map((items) => this.mergeByKey(items, this.readLocalApplications(), (item) => item.reference)),
        map((items) => this.applyLocalApplicationsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalApplicationsQuery(this.readLocalApplications(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createApplication(payload: CreateApplicationPayload): Observable<Application> {
    const normalizedPayload = this.normalizeCreateApplicationPayload(payload);

    return this.apiClient
      .post<ApplicationDto, CreateApplicationPayload>(
        API_ENDPOINTS.recruitment.applications,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeApplication(dto)),
        map((item) => {
          if (item.reference && item.candidate && item.position) {
            return item;
          }
          return this.appendLocalApplication(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalApplication(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getCampaigns(query?: RecruitmentCampaignsQuery): Observable<Campaign[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      department: query?.department,
    });

    return this.apiClient
      .get<CampaignDto[]>(
        API_ENDPOINTS.recruitment.campaigns,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapCampaigns(items)),
        map((items) => this.mergeByKey(items, this.readLocalCampaigns(), (item) => item.code)),
        map((items) => this.applyLocalCampaignsQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalCampaignsQuery(this.readLocalCampaigns(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createCampaign(payload: CreateCampaignPayload): Observable<Campaign> {
    const normalizedPayload = this.normalizeCreateCampaignPayload(payload);

    return this.apiClient
      .post<CampaignDto, CreateCampaignPayload>(
        API_ENDPOINTS.recruitment.campaigns,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeCampaign(dto)),
        map((item) => {
          if (item.code && item.title && item.department) {
            return item;
          }
          return this.appendLocalCampaign(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalCampaign(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getOnboarding(query?: RecruitmentOnboardingQuery): Observable<OnboardingItem[]> {
    const params = buildCollectionQueryParams(query, {
      status: query?.status,
      agent: query?.agent,
    });

    return this.apiClient
      .get<OnboardingDto[]>(
        API_ENDPOINTS.recruitment.onboarding,
        params,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => this.mapOnboarding(items)),
        map((items) => this.mergeByKey(items, this.readLocalOnboarding(), (item) => this.buildOnboardingKey(item))),
        map((items) => this.applyLocalOnboardingQuery(items, query)),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.applyLocalOnboardingQuery(this.readLocalOnboarding(), query));
          }
          return throwError(() => error);
        })
      );
  }

  createOnboarding(payload: CreateOnboardingPayload): Observable<OnboardingItem> {
    const normalizedPayload = this.normalizeCreateOnboardingPayload(payload);

    return this.apiClient
      .post<OnboardingDto, CreateOnboardingPayload>(
        API_ENDPOINTS.recruitment.onboarding,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.normalizeOnboarding(dto)),
        map((item) => {
          if (item.agent && item.position && item.startDate) {
            return item;
          }
          return this.appendLocalOnboarding(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseLocalFallback(error)) {
            return of(this.appendLocalOnboarding(normalizedPayload));
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

  private mapApplications(items: ApplicationDto[]): Application[] {
    return items
      .map((dto) => this.normalizeApplication(dto))
      .filter((item) => !!item.reference && !!item.candidate && !!item.position);
  }

  private normalizeApplication(dto: ApplicationDto, fallbackReference = ''): Application {
    return {
      reference: toStringValue(readField(dto, ['reference', 'requestRef', 'request_ref'], fallbackReference)).trim(),
      candidate: toStringValue(readField(dto, ['candidate', 'candidateName', 'candidate_name'], '')).trim(),
      position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')).trim(),
      campaign: toStringValue(readField(dto, ['campaign', 'campaignTitle', 'campaign_title'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Nouveau')).trim() || 'Nouveau',
      receivedOn: toStringValue(readField(dto, ['receivedOn', 'received_on'], '')).trim(),
    };
  }

  private normalizeCreateApplicationPayload(payload: CreateApplicationPayload): CreateApplicationPayload {
    return {
      reference: this.normalizeOptionalText(payload.reference)?.toUpperCase(),
      candidate: String(payload.candidate || '').trim(),
      position: String(payload.position || '').trim(),
      campaign: String(payload.campaign || '').trim().toUpperCase(),
      status: this.normalizeOptionalText(payload.status) || 'Nouveau',
      receivedOn: String(payload.receivedOn || '').trim(),
    };
  }

  private applyLocalApplicationsQuery(items: Application[], query?: RecruitmentApplicationsQuery): Application[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const campaign = (query?.campaign || '').trim().toLowerCase();
    const position = (query?.position || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (campaign) {
      next = next.filter((item) => item.campaign.toLowerCase().includes(campaign));
    }
    if (position) {
      next = next.filter((item) => item.position.toLowerCase().includes(position));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.reference.toLowerCase().includes(search) ||
          item.candidate.toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.campaign.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.receivedOn.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'receivedOn').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readApplicationField(left, sortBy);
      const rightValue = this.readApplicationField(right, sortBy);
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

  private readApplicationField(item: Application, field: string): string {
    switch (field) {
      case 'reference':
        return item.reference;
      case 'candidate':
        return item.candidate;
      case 'position':
        return item.position;
      case 'campaign':
        return item.campaign;
      case 'status':
        return item.status;
      case 'receivedOn':
        return item.receivedOn;
      default:
        return '';
    }
  }

  private appendLocalApplication(payload: CreateApplicationPayload): Application {
    const current = this.readLocalApplications();
    const reference = this.normalizeOptionalText(payload.reference) || this.generateApplicationReference(current);
    const created: Application = {
      reference,
      candidate: String(payload.candidate || '').trim(),
      position: String(payload.position || '').trim(),
      campaign: String(payload.campaign || '').trim().toUpperCase(),
      status: this.normalizeOptionalText(payload.status) || 'Nouveau',
      receivedOn: String(payload.receivedOn || '').trim(),
    };
    const deduped = current.filter((item) => item.reference !== created.reference);
    deduped.push(created);
    this.writeLocalApplications(deduped);
    return created;
  }

  private generateApplicationReference(existing: Application[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^APP-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.reference);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `APP-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private readLocalApplications(): Application[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localApplicationsKey);
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
          const record = item as Partial<Application>;
          return {
            reference: String(record.reference || '').trim(),
            candidate: String(record.candidate || '').trim(),
            position: String(record.position || '').trim(),
            campaign: String(record.campaign || '').trim(),
            status: String(record.status || 'Nouveau').trim() || 'Nouveau',
            receivedOn: String(record.receivedOn || '').trim(),
          } as Application;
        })
        .filter((item) => !!item.reference && !!item.candidate && !!item.position);
    } catch {
      return [];
    }
  }

  private writeLocalApplications(items: Application[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localApplicationsKey, JSON.stringify(items));
  }

  private mapCampaigns(items: CampaignDto[]): Campaign[] {
    return items
      .map((dto) => this.normalizeCampaign(dto))
      .filter((item) => !!item.code && !!item.title && !!item.department);
  }

  private normalizeCampaign(dto: CampaignDto, fallbackCode = ''): Campaign {
    return {
      code: toStringValue(readField(dto, ['code'], fallbackCode)).trim(),
      title: toStringValue(readField(dto, ['title', 'name'], '')).trim(),
      department: toStringValue(readField(dto, ['department', 'departmentName', 'department_name'], '')).trim(),
      openings: this.toNonNegativeInt(readField(dto, ['openings', 'openPositions', 'open_positions'], 0), 0),
      startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim(),
      endDate: toStringValue(readField(dto, ['endDate', 'end_date'], '')).trim(),
      status: toStringValue(readField(dto, ['status'], 'Planifiee')).trim() || 'Planifiee',
    };
  }

  private normalizeCreateCampaignPayload(payload: CreateCampaignPayload): CreateCampaignPayload {
    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      title: String(payload.title || '').trim(),
      department: String(payload.department || '').trim(),
      openings: this.toNonNegativeInt(payload.openings, 1),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
  }

  private applyLocalCampaignsQuery(items: Campaign[], query?: RecruitmentCampaignsQuery): Campaign[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const department = (query?.department || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (department) {
      next = next.filter((item) => item.department.toLowerCase().includes(department));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.code.toLowerCase().includes(search) ||
          item.title.toLowerCase().includes(search) ||
          item.department.toLowerCase().includes(search) ||
          String(item.openings).includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.endDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search)
        );
      });
    }

    const sortBy = (query?.sortBy || 'startDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readCampaignField(left, sortBy);
      const rightValue = this.readCampaignField(right, sortBy);

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

  private readCampaignField(item: Campaign, field: string): string | number {
    switch (field) {
      case 'code':
        return item.code;
      case 'title':
        return item.title;
      case 'department':
        return item.department;
      case 'openings':
        return item.openings;
      case 'startDate':
        return item.startDate;
      case 'endDate':
        return item.endDate;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalCampaign(payload: CreateCampaignPayload): Campaign {
    const current = this.readLocalCampaigns();
    const code = this.normalizeOptionalText(payload.code) || this.generateCampaignCode(payload.department, current);
    const created: Campaign = {
      code,
      title: String(payload.title || '').trim(),
      department: String(payload.department || '').trim(),
      openings: this.toNonNegativeInt(payload.openings, 1),
      startDate: String(payload.startDate || '').trim(),
      endDate: String(payload.endDate || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Planifiee',
    };
    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalCampaigns(deduped);
    return created;
  }

  private generateCampaignCode(department: string, existing: Campaign[]): string {
    const year = new Date().getFullYear();
    const departmentCode = this.normalizeIdPart(department).slice(0, 10) || 'RH';
    const prefix = `CMP-${departmentCode}-${year}`;
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.code);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `${prefix}-${String(maxExisting + 1).padStart(2, '0')}`;
  }

  private readLocalCampaigns(): Campaign[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localCampaignsKey);
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
          const record = item as Partial<Campaign>;
          return {
            code: String(record.code || '').trim(),
            title: String(record.title || '').trim(),
            department: String(record.department || '').trim(),
            openings: this.toNonNegativeInt(record.openings, 0),
            startDate: String(record.startDate || '').trim(),
            endDate: String(record.endDate || '').trim(),
            status: String(record.status || 'Planifiee').trim() || 'Planifiee',
          } as Campaign;
        })
        .filter((item) => !!item.code && !!item.title && !!item.department);
    } catch {
      return [];
    }
  }

  private writeLocalCampaigns(items: Campaign[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localCampaignsKey, JSON.stringify(items));
  }

  private mapOnboarding(items: OnboardingDto[]): OnboardingItem[] {
    return items
      .map((dto) => this.normalizeOnboarding(dto))
      .filter((item) => !!item.agent && !!item.position && !!item.startDate);
  }

  private normalizeOnboarding(dto: OnboardingDto): OnboardingItem {
    return {
      agent: toStringValue(readField(dto, ['agent', 'agentName', 'agent_name'], '')).trim(),
      position: toStringValue(readField(dto, ['position', 'positionTitle', 'position_title'], '')).trim(),
      startDate: toStringValue(readField(dto, ['startDate', 'start_date'], '')).trim(),
      checklist: this.normalizeChecklist(readField(dto, ['checklist', 'tasks'], [])),
      status: toStringValue(readField(dto, ['status'], 'Planifie')).trim() || 'Planifie',
    };
  }

  private normalizeCreateOnboardingPayload(payload: CreateOnboardingPayload): CreateOnboardingPayload {
    return {
      agent: String(payload.agent || '').trim(),
      position: String(payload.position || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      checklist: this.normalizeChecklist(payload.checklist || []),
      status: this.normalizeOptionalText(payload.status) || 'Planifie',
    };
  }

  private applyLocalOnboardingQuery(items: OnboardingItem[], query?: RecruitmentOnboardingQuery): OnboardingItem[] {
    let next = [...items];
    const status = (query?.status || '').trim().toLowerCase();
    const agent = (query?.agent || '').trim().toLowerCase();
    const search = (query?.q || '').trim().toLowerCase();

    if (status) {
      next = next.filter((item) => item.status.toLowerCase().includes(status));
    }
    if (agent) {
      next = next.filter((item) => item.agent.toLowerCase().includes(agent));
    }
    if (search) {
      next = next.filter((item) => {
        return (
          item.agent.toLowerCase().includes(search) ||
          item.position.toLowerCase().includes(search) ||
          item.startDate.toLowerCase().includes(search) ||
          item.status.toLowerCase().includes(search) ||
          item.checklist.some((step) => step.toLowerCase().includes(search))
        );
      });
    }

    const sortBy = (query?.sortBy || 'startDate').trim();
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    next.sort((left, right) => {
      const leftValue = this.readOnboardingField(left, sortBy);
      const rightValue = this.readOnboardingField(right, sortBy);
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

  private readOnboardingField(item: OnboardingItem, field: string): string {
    switch (field) {
      case 'agent':
        return item.agent;
      case 'position':
        return item.position;
      case 'startDate':
        return item.startDate;
      case 'status':
        return item.status;
      default:
        return '';
    }
  }

  private appendLocalOnboarding(payload: CreateOnboardingPayload): OnboardingItem {
    const current = this.readLocalOnboarding();
    const created: OnboardingItem = {
      agent: String(payload.agent || '').trim(),
      position: String(payload.position || '').trim(),
      startDate: String(payload.startDate || '').trim(),
      checklist: this.normalizeChecklist(payload.checklist || []),
      status: this.normalizeOptionalText(payload.status) || 'Planifie',
    };
    const createdKey = this.buildOnboardingKey(created);
    const deduped = current.filter((item) => this.buildOnboardingKey(item) !== createdKey);
    deduped.push(created);
    this.writeLocalOnboarding(deduped);
    return created;
  }

  private buildOnboardingKey(item: OnboardingItem): string {
    return `${item.agent}|${item.position}|${item.startDate}`.toLowerCase();
  }

  private readLocalOnboarding(): OnboardingItem[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = window.localStorage.getItem(this.localOnboardingKey);
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
          const record = item as Partial<OnboardingItem>;
          return {
            agent: String(record.agent || '').trim(),
            position: String(record.position || '').trim(),
            startDate: String(record.startDate || '').trim(),
            checklist: this.normalizeChecklist(record.checklist || []),
            status: String(record.status || 'Planifie').trim() || 'Planifie',
          } as OnboardingItem;
        })
        .filter((item) => !!item.agent && !!item.position && !!item.startDate);
    } catch {
      return [];
    }
  }

  private writeLocalOnboarding(items: OnboardingItem[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    window.localStorage.setItem(this.localOnboardingKey, JSON.stringify(items));
  }

  private normalizeChecklist(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => String(item || '').trim())
      .filter((item) => item.length > 0);
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
