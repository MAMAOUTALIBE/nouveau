import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { readField, toNumberValue, toStringValue } from '../../core/utils/dto.utils';
import { environment } from '../../../environments/environment';

export type WorkflowPriority = 'Basse' | 'Normale' | 'Haute' | 'Critique';
export type WorkflowSlaState = 'OK' | 'WARNING' | 'BREACHED';
export type WorkflowStatus = 'EN_ATTENTE' | 'EN_COURS' | 'APPROUVE' | 'REJETE' | 'ESCALADE' | 'EN_RETARD';
export type WorkflowAction = 'APPROUVER' | 'REJETER' | 'ESCALADER';

export interface WorkflowDefinition {
  code: string;
  name: string;
  steps: number;
  usedFor: string;
  status: string;
  slaTargetHours: number;
  autoEscalation: boolean;
}

export interface WorkflowTimelineEvent {
  date: string;
  actor: string;
  action: string;
  note: string;
}

export interface WorkflowInstance {
  id: string;
  definition: string;
  requester: string;
  createdOn: string;
  currentStep: string;
  status: WorkflowStatus;
  priority: WorkflowPriority;
  dueOn: string;
  owner: string;
  stepsTotal: number;
  stepsCompleted: number;
  escalationLevel: number;
  lastUpdateOn: string;
  timeline: WorkflowTimelineEvent[];
  slaState: WorkflowSlaState;
}

export interface CreateWorkflowDefinitionPayload {
  code?: string;
  name: string;
  steps: number;
  usedFor: string;
  status?: string;
  slaTargetHours: number;
  autoEscalation?: boolean;
}

export interface CreateWorkflowInstancePayload {
  id?: string;
  definition: string;
  requester: string;
  dueOn?: string;
  priority?: WorkflowPriority;
  owner?: string;
  stepsTotal?: number;
  stepsCompleted?: number;
  status?: WorkflowStatus;
  currentStep?: string;
  escalationLevel?: number;
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
  slaTargetHours?: number | string;
  sla_target_hours?: number | string;
  autoEscalation?: boolean;
  auto_escalation?: boolean;
}

interface WorkflowTimelineEventDto {
  date?: string;
  actor?: string;
  action?: string;
  note?: string;
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
  priority?: string;
  dueOn?: string;
  due_on?: string;
  owner?: string;
  ownerName?: string;
  owner_name?: string;
  stepsTotal?: number | string;
  steps_total?: number | string;
  stepsCompleted?: number | string;
  steps_completed?: number | string;
  escalationLevel?: number | string;
  escalation_level?: number | string;
  lastUpdateOn?: string;
  last_update_on?: string;
  timeline?: WorkflowTimelineEventDto[];
}

@Injectable({ providedIn: 'root' })
export class WorkflowsService {
  private readonly localDefinitionsKey = 'rh_workflow_definitions';
  private readonly localStorageKey = 'rh_workflow_instances';
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;

  constructor(private apiClient: ApiClientService) {
    this.ensureFallbackSeed();
  }

  getDefinitions(): Observable<WorkflowDefinition[]> {
    return this.apiClient
      .get<WorkflowDefinitionDto[]>(
        API_ENDPOINTS.workflows.definitions,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => items.map((dto) => this.mapDefinition(dto))),
        map((items) => items.filter((item) => !!item.code && !!item.name)),
        map((apiItems) => this.mergeByKey(apiItems, this.readLocalDefinitions(), (item) => item.code)),
        map((items) => (items.length ? items : this.readLocalDefinitions())),
        catchError((error) => {
          if (this.shouldUseFallback(error)) {
            return of(this.readLocalDefinitions());
          }
          return throwError(() => error);
        })
      );
  }

  createDefinition(payload: CreateWorkflowDefinitionPayload): Observable<WorkflowDefinition> {
    const normalizedPayload = this.normalizeCreateDefinitionPayload(payload);

    return this.apiClient
      .post<WorkflowDefinitionDto, CreateWorkflowDefinitionPayload>(
        API_ENDPOINTS.workflows.definitions,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.mapDefinition(dto)),
        map((item) => {
          if (item.code && item.name) {
            this.writeDefinitionToLocal(item);
            return item;
          }
          return this.appendLocalDefinition(normalizedPayload);
        }),
        catchError((error) => {
          if (this.shouldUseFallback(error)) {
            return of(this.appendLocalDefinition(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  getInstances(): Observable<WorkflowInstance[]> {
    return this.apiClient
      .get<WorkflowInstanceDto[]>(
        API_ENDPOINTS.workflows.instances,
        undefined,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => items.map((dto) => this.mapInstance(dto))),
        map((apiInstances) => this.mergeWithLocalFallback(apiInstances, this.readLocalInstances())),
        map((instances) => (instances.length ? instances : this.readLocalInstances())),
        map((instances) => this.computeSla(instances)),
        catchError((error) => {
          if (this.shouldUseFallback(error)) {
            return of(this.computeSla(this.readLocalInstances()));
          }
          return throwError(() => error);
        })
      );
  }

  createInstance(payload: CreateWorkflowInstancePayload): Observable<WorkflowInstance> {
    const normalizedPayload = this.normalizeCreateInstancePayload(payload);

    return this.apiClient
      .post<WorkflowInstanceDto, CreateWorkflowInstancePayload>(
        API_ENDPOINTS.workflows.instances,
        normalizedPayload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.mapInstance(dto)),
        map((instance) => this.persistRemoteInstance(instance)),
        map((instance) => this.computeSla([instance])[0]),
        catchError((error) => {
          if (this.shouldUseFallback(error)) {
            return of(this.appendLocalInstance(normalizedPayload));
          }
          return throwError(() => error);
        })
      );
  }

  transitionInstance(instanceId: string, action: WorkflowAction, note = ''): Observable<WorkflowInstance> {
    const payload = { action, note };
    return this.apiClient
      .post<WorkflowInstanceDto, { action: WorkflowAction; note: string }>(
        API_ENDPOINTS.workflows.instanceAction(instanceId),
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.mapInstance(dto)),
        map((instance) => this.persistRemoteInstance(instance)),
        map((instance) => this.computeSla([instance])[0]),
        catchError((error) => {
          if (this.shouldUseFallback(error)) {
            return of(this.applyLocalTransition(instanceId, action, note));
          }
          return throwError(() => error);
        })
      );
  }

  private persistRemoteInstance(instance: WorkflowInstance): WorkflowInstance {
    const current = this.readLocalInstances();
    const byId = new Map(current.map((item) => [item.id, item]));
    byId.set(instance.id, instance);
    const merged = Array.from(byId.values());
    this.writeLocalInstances(merged);
    return instance;
  }

  private writeDefinitionToLocal(item: WorkflowDefinition): void {
    const current = this.readLocalDefinitions();
    const byCode = new Map(current.map((entry) => [entry.code, entry]));
    byCode.set(item.code, item);
    this.writeLocalDefinitions(Array.from(byCode.values()));
  }

  private normalizeCreateDefinitionPayload(payload: CreateWorkflowDefinitionPayload): CreateWorkflowDefinitionPayload {
    const steps = this.toStrictPositiveInt(payload.steps, 1);
    const slaTargetHours = this.toStrictPositiveInt(payload.slaTargetHours, 48);
    return {
      code: this.normalizeOptionalText(payload.code)?.toUpperCase(),
      name: String(payload.name || '').trim(),
      steps,
      usedFor: String(payload.usedFor || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      slaTargetHours,
      autoEscalation: payload.autoEscalation !== false,
    };
  }

  private appendLocalDefinition(payload: CreateWorkflowDefinitionPayload): WorkflowDefinition {
    const current = this.readLocalDefinitions();
    const created: WorkflowDefinition = {
      code: this.normalizeOptionalText(payload.code) || this.generateDefinitionCode(current, payload.usedFor),
      name: String(payload.name || '').trim(),
      steps: this.toStrictPositiveInt(payload.steps, 1),
      usedFor: String(payload.usedFor || '').trim(),
      status: this.normalizeOptionalText(payload.status) || 'Actif',
      slaTargetHours: this.toStrictPositiveInt(payload.slaTargetHours, 48),
      autoEscalation: payload.autoEscalation !== false,
    };

    const deduped = current.filter((item) => item.code !== created.code);
    deduped.push(created);
    this.writeLocalDefinitions(deduped);
    return created;
  }

  private generateDefinitionCode(existing: WorkflowDefinition[], usedFor: string): string {
    const base = String(usedFor || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 10) || 'CUSTOM';

    let candidate = `WF-${base}`;
    let suffix = 2;
    while (existing.some((item) => item.code === candidate)) {
      candidate = `WF-${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private normalizeCreateInstancePayload(payload: CreateWorkflowInstancePayload): CreateWorkflowInstancePayload {
    const definitionInput = String(payload.definition || '').trim();
    const definition = this.resolveDefinitionName(definitionInput);
    const definitionSla = this.resolveDefinitionSlaHours(definitionInput);
    const defaultSteps = this.resolveDefinitionSteps(definitionInput);
    const stepsTotal = this.toStrictPositiveInt(payload.stepsTotal, defaultSteps);
    let stepsCompleted = this.toNonNegativeInt(payload.stepsCompleted, 0);
    if (stepsCompleted > stepsTotal) {
      stepsCompleted = stepsTotal;
    }

    let status = this.normalizeStatus(String(payload.status || 'EN_ATTENTE'));
    if (status === 'APPROUVE') {
      stepsCompleted = stepsTotal;
    }
    let escalationLevel = Math.min(3, this.toNonNegativeInt(payload.escalationLevel, 0));
    if (status === 'ESCALADE' && escalationLevel === 0) {
      escalationLevel = 1;
    }

    return {
      id: this.normalizeOptionalText(payload.id)?.toUpperCase(),
      definition,
      requester: String(payload.requester || '').trim(),
      dueOn: this.toIsoDateOrFallback(payload.dueOn, hoursFromNow(definitionSla)),
      priority: this.normalizePriority(String(payload.priority || 'Normale')),
      owner: this.normalizeOptionalText(payload.owner) || 'Responsable RH',
      stepsTotal,
      stepsCompleted,
      status,
      currentStep: this.normalizeOptionalText(payload.currentStep)
        || this.defaultCurrentStep(status, stepsCompleted, escalationLevel),
      escalationLevel,
    };
  }

  private appendLocalInstance(payload: CreateWorkflowInstancePayload): WorkflowInstance {
    const normalized = this.normalizeCreateInstancePayload(payload);
    const current = this.readLocalInstances();
    const nowIso = new Date().toISOString();

    const created: WorkflowInstance = {
      id: normalized.id || this.generateInstanceId(current),
      definition: String(normalized.definition || '').trim(),
      requester: String(normalized.requester || '').trim(),
      createdOn: nowIso,
      currentStep: String(normalized.currentStep || '').trim() || 'Validation niveau 1',
      status: this.normalizeStatus(String(normalized.status || 'EN_ATTENTE')),
      priority: this.normalizePriority(String(normalized.priority || 'Normale')),
      dueOn: this.toIsoDateOrFallback(normalized.dueOn, hoursFromNow(48)),
      owner: String(normalized.owner || 'Responsable RH').trim() || 'Responsable RH',
      stepsTotal: this.toStrictPositiveInt(normalized.stepsTotal, 1),
      stepsCompleted: Math.min(
        this.toNonNegativeInt(normalized.stepsCompleted, 0),
        this.toStrictPositiveInt(normalized.stepsTotal, 1)
      ),
      escalationLevel: Math.min(3, this.toNonNegativeInt(normalized.escalationLevel, 0)),
      lastUpdateOn: nowIso,
      timeline: [
        {
          date: nowIso,
          actor: 'Systeme',
          action: 'CREATION',
          note: '',
        },
      ],
      slaState: 'OK',
    };

    if (created.status === 'APPROUVE') {
      created.stepsCompleted = created.stepsTotal;
      created.currentStep = 'Termine';
    }
    if (created.status === 'REJETE') {
      created.currentStep = 'Cloture';
    }
    if (created.status === 'ESCALADE' && created.escalationLevel === 0) {
      created.escalationLevel = 1;
      created.currentStep = this.defaultCurrentStep(created.status, created.stepsCompleted, created.escalationLevel);
    }

    const deduped = current.filter((item) => item.id !== created.id);
    deduped.push(created);
    this.writeLocalInstances(deduped);
    return this.computeSla([created])[0];
  }

  private generateInstanceId(existing: WorkflowInstance[]): string {
    const year = new Date().getFullYear();
    const regex = new RegExp(`^WFI-${year}-(\\d+)$`);
    const maxExisting = existing.reduce((max, item) => {
      const match = regex.exec(item.id);
      if (!match) return max;
      const value = Number(match[1]);
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
    return `WFI-${year}-${String(maxExisting + 1).padStart(3, '0')}`;
  }

  private resolveDefinitionName(input: string): string {
    const normalizedInput = input.trim();
    if (!normalizedInput) {
      return '';
    }
    const expected = normalizedInput.toLowerCase();
    const definitions = this.readLocalDefinitions();
    const match = definitions.find(
      (item) => item.code.toLowerCase() === expected || item.name.toLowerCase() === expected
    );
    return match?.name || normalizedInput;
  }

  private resolveDefinitionSteps(input: string): number {
    const normalizedInput = input.trim().toLowerCase();
    if (!normalizedInput) {
      return 3;
    }
    const definitions = this.readLocalDefinitions();
    const match = definitions.find(
      (item) => item.code.toLowerCase() === normalizedInput || item.name.toLowerCase() === normalizedInput
    );
    const steps = Number(match?.steps || 3);
    return Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 3;
  }

  private resolveDefinitionSlaHours(input: string): number {
    const normalizedInput = input.trim().toLowerCase();
    if (!normalizedInput) {
      return 48;
    }
    const definitions = this.readLocalDefinitions();
    const match = definitions.find(
      (item) => item.code.toLowerCase() === normalizedInput || item.name.toLowerCase() === normalizedInput
    );
    const hours = Number(match?.slaTargetHours || 48);
    return Number.isFinite(hours) && hours > 0 ? Math.round(hours) : 48;
  }

  private defaultCurrentStep(status: WorkflowStatus, stepsCompleted: number, escalationLevel: number): string {
    if (status === 'APPROUVE') {
      return 'Termine';
    }
    if (status === 'REJETE') {
      return 'Cloture';
    }
    if (status === 'ESCALADE') {
      if (escalationLevel >= 3) return 'Escalade COMEX';
      if (escalationLevel === 2) return 'Escalade niveau 2';
      return 'Escalade niveau 1';
    }
    return `Validation niveau ${Math.max(1, stepsCompleted + 1)}`;
  }

  private applyLocalTransition(instanceId: string, action: WorkflowAction, note: string): WorkflowInstance {
    const current = this.readLocalInstances();
    const index = current.findIndex((item) => item.id === instanceId);
    if (index === -1) {
      throw new Error(`Instance introuvable: ${instanceId}`);
    }

    const target = { ...current[index] };
    if (this.isTerminal(target.status)) {
      throw new Error("Impossible d'agir sur une instance terminee");
    }

    switch (action) {
      case 'APPROUVER':
        target.stepsCompleted = Math.min(target.stepsCompleted + 1, target.stepsTotal);
        if (target.stepsCompleted >= target.stepsTotal) {
          target.status = 'APPROUVE';
          target.currentStep = 'Termine';
        } else {
          target.status = 'EN_COURS';
          target.currentStep = `Validation niveau ${target.stepsCompleted + 1}`;
        }
        break;
      case 'REJETER':
        target.status = 'REJETE';
        target.currentStep = 'Cloture';
        break;
      case 'ESCALADER':
        target.status = 'ESCALADE';
        target.escalationLevel += 1;
        target.owner = 'Comite RH';
        target.currentStep = 'Escalade comite';
        break;
      default:
        break;
    }

    target.lastUpdateOn = new Date().toISOString();
    target.timeline = [
      ...(target.timeline || []),
      {
        date: target.lastUpdateOn,
        actor: 'Responsable RH',
        action,
        note: note || '',
      },
    ];

    current[index] = target;
    this.writeLocalInstances(current);
    return this.computeSla([target])[0];
  }

  private isTerminal(status: WorkflowStatus): boolean {
    return status === 'APPROUVE' || status === 'REJETE';
  }

  private shouldUseFallback(error: unknown): boolean {
    if (!this.fallbackEnabled) {
      return false;
    }
    if (!(error instanceof HttpErrorResponse)) {
      return false;
    }
    return error.status === 0 || error.status >= 500 || error.status === 404;
  }

  private mapDefinition(dto: WorkflowDefinitionDto): WorkflowDefinition {
    return {
      code: toStringValue(readField(dto, ['code'], '')),
      name: toStringValue(readField(dto, ['name', 'label'], '')),
      steps: toNumberValue(readField(dto, ['steps', 'stepsCount', 'steps_count'], 0)),
      usedFor: toStringValue(readField(dto, ['usedFor', 'used_for'], '')),
      status: toStringValue(readField(dto, ['status'], '')),
      slaTargetHours: toNumberValue(readField(dto, ['slaTargetHours', 'sla_target_hours'], 48)),
      autoEscalation: Boolean(readField(dto, ['autoEscalation', 'auto_escalation'], true)),
    };
  }

  private mapInstance(dto: WorkflowInstanceDto): WorkflowInstance {
    const status = this.normalizeStatus(toStringValue(readField(dto, ['status'], 'EN_ATTENTE')));
    const priority = this.normalizePriority(toStringValue(readField(dto, ['priority'], 'Normale')));
    const timeline = Array.isArray(dto.timeline)
      ? dto.timeline.map((entry) => ({
          date: toStringValue(readField(entry, ['date'], new Date().toISOString())),
          actor: toStringValue(readField(entry, ['actor'], 'Systeme')),
          action: toStringValue(readField(entry, ['action'], 'CREATION')),
          note: toStringValue(readField(entry, ['note'], '')),
        }))
      : [];

    const instance: WorkflowInstance = {
      id: toStringValue(readField(dto, ['id', 'instanceId', 'instance_id'], '')),
      definition: toStringValue(readField(dto, ['definition', 'definitionName', 'definition_name'], '')),
      requester: toStringValue(readField(dto, ['requester', 'requesterName', 'requester_name'], '')),
      createdOn: toStringValue(readField(dto, ['createdOn', 'created_on'], new Date().toISOString())),
      currentStep: toStringValue(readField(dto, ['currentStep', 'current_step'], 'Validation niveau 1')),
      status,
      priority,
      dueOn: toStringValue(readField(dto, ['dueOn', 'due_on'], hoursFromNow(48))),
      owner: toStringValue(readField(dto, ['owner', 'ownerName', 'owner_name'], 'Chef de service RH')),
      stepsTotal: Math.max(1, toNumberValue(readField(dto, ['stepsTotal', 'steps_total'], 3))),
      stepsCompleted: Math.max(0, toNumberValue(readField(dto, ['stepsCompleted', 'steps_completed'], 0))),
      escalationLevel: Math.max(0, toNumberValue(readField(dto, ['escalationLevel', 'escalation_level'], 0))),
      lastUpdateOn: toStringValue(readField(dto, ['lastUpdateOn', 'last_update_on'], new Date().toISOString())),
      timeline,
      slaState: 'OK',
    };

    return instance;
  }

  private normalizeStatus(raw: string): WorkflowStatus {
    const upper = raw.trim().toUpperCase();
    switch (upper) {
      case 'EN_COURS':
      case 'APPROUVE':
      case 'REJETE':
      case 'ESCALADE':
      case 'EN_RETARD':
        return upper;
      case 'EN_ATTENTE':
      default:
        return 'EN_ATTENTE';
    }
  }

  private normalizePriority(raw: string): WorkflowPriority {
    const normalized = raw.trim().toLowerCase();
    if (normalized === 'critique') return 'Critique';
    if (normalized === 'haute') return 'Haute';
    if (normalized === 'basse') return 'Basse';
    return 'Normale';
  }

  private mergeWithLocalFallback(apiInstances: WorkflowInstance[], localInstances: WorkflowInstance[]): WorkflowInstance[] {
    return this.mergeByKey(apiInstances, localInstances, (item) => item.id);
  }

  private computeSla(instances: WorkflowInstance[]): WorkflowInstance[] {
    const now = Date.now();
    return instances.map((instance) => {
      if (this.isTerminal(instance.status)) {
        return { ...instance, slaState: 'OK' };
      }

      const dueTimestamp = Date.parse(instance.dueOn);
      if (Number.isNaN(dueTimestamp)) {
        return { ...instance, slaState: 'OK' };
      }

      const diff = dueTimestamp - now;
      if (diff < 0) {
        return {
          ...instance,
          status: instance.status === 'APPROUVE' || instance.status === 'REJETE' ? instance.status : 'EN_RETARD',
          slaState: 'BREACHED',
        };
      }

      if (diff <= 1000 * 60 * 60 * 24) {
        return { ...instance, slaState: 'WARNING' };
      }

      return { ...instance, slaState: 'OK' };
    });
  }

  private readLocalDefinitions(): WorkflowDefinition[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = localStorage.getItem(this.localDefinitionsKey);
    if (!raw) {
      return this.fallbackDefinitions();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return this.fallbackDefinitions();
      }

      return parsed
        .map((entry) => this.mapDefinition(entry as WorkflowDefinitionDto))
        .filter((entry) => !!entry.code && !!entry.name);
    } catch {
      return this.fallbackDefinitions();
    }
  }

  private writeLocalDefinitions(items: WorkflowDefinition[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    localStorage.setItem(this.localDefinitionsKey, JSON.stringify(items));
  }

  private readLocalInstances(): WorkflowInstance[] {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return [];
    }

    const raw = localStorage.getItem(this.localStorageKey);
    if (!raw) {
      return this.fallbackInstances();
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return this.fallbackInstances();
      }

      return parsed
        .map((entry) => this.mapInstance(entry as WorkflowInstanceDto))
        .filter((entry) => !!entry.id);
    } catch {
      return this.fallbackInstances();
    }
  }

  private writeLocalInstances(items: WorkflowInstance[]): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }
    localStorage.setItem(this.localStorageKey, JSON.stringify(items));
  }

  private ensureFallbackSeed(): void {
    if (!this.fallbackEnabled || !this.hasLocalStorage()) {
      return;
    }

    if (!localStorage.getItem(this.localDefinitionsKey)) {
      this.writeLocalDefinitions(this.fallbackDefinitions());
    }

    if (!localStorage.getItem(this.localStorageKey)) {
      this.writeLocalInstances(this.fallbackInstances());
    }
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

  private hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toStrictPositiveInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded > 0 ? rounded : fallback;
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded >= 0 ? rounded : fallback;
  }

  private toIsoDateOrFallback(value: unknown, fallback: string): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return fallback;
    }
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      return fallback;
    }
    return new Date(parsed).toISOString();
  }

  private fallbackDefinitions(): WorkflowDefinition[] {
    return [
      {
        code: 'WF-CONGE',
        name: 'Validation conges annuels',
        steps: 3,
        usedFor: 'Absences',
        status: 'Actif',
        slaTargetHours: 48,
        autoEscalation: true,
      },
      {
        code: 'WF-RECRUT',
        name: 'Circuit de recrutement',
        steps: 4,
        usedFor: 'Recrutement',
        status: 'Actif',
        slaTargetHours: 72,
        autoEscalation: true,
      },
      {
        code: 'WF-DISC',
        name: 'Instruction disciplinaire',
        steps: 5,
        usedFor: 'Discipline',
        status: 'Actif',
        slaTargetHours: 96,
        autoEscalation: false,
      },
    ];
  }

  private fallbackInstances(): WorkflowInstance[] {
    return this.computeSla([
      {
        id: 'WFI-2026-001',
        definition: 'Validation conges annuels',
        requester: 'Aminata Diallo',
        createdOn: hoursFromNow(-24),
        currentStep: 'Validation niveau 2',
        status: 'EN_COURS',
        priority: 'Normale',
        dueOn: hoursFromNow(18),
        owner: 'Directeur RH',
        stepsTotal: 3,
        stepsCompleted: 1,
        escalationLevel: 0,
        lastUpdateOn: hoursFromNow(-2),
        timeline: [
          { date: hoursFromNow(-24), actor: 'Systeme', action: 'CREATION', note: '' },
          { date: hoursFromNow(-6), actor: 'Chef service', action: 'APPROUVER', note: 'Conforme' },
        ],
        slaState: 'OK',
      },
      {
        id: 'WFI-2026-002',
        definition: 'Circuit de recrutement',
        requester: 'Mamadou Camara',
        createdOn: hoursFromNow(-48),
        currentStep: 'Validation niveau 1',
        status: 'EN_ATTENTE',
        priority: 'Haute',
        dueOn: hoursFromNow(-3),
        owner: 'Responsable recrutement',
        stepsTotal: 4,
        stepsCompleted: 0,
        escalationLevel: 1,
        lastUpdateOn: hoursFromNow(-4),
        timeline: [{ date: hoursFromNow(-48), actor: 'Systeme', action: 'CREATION', note: '' }],
        slaState: 'OK',
      },
      {
        id: 'WFI-2026-003',
        definition: 'Instruction disciplinaire',
        requester: 'Ibrahima Conde',
        createdOn: hoursFromNow(-10),
        currentStep: 'Validation niveau 1',
        status: 'EN_ATTENTE',
        priority: 'Critique',
        dueOn: hoursFromNow(6),
        owner: 'Cellule juridique',
        stepsTotal: 5,
        stepsCompleted: 0,
        escalationLevel: 0,
        lastUpdateOn: hoursFromNow(-1),
        timeline: [{ date: hoursFromNow(-10), actor: 'Systeme', action: 'CREATION', note: '' }],
        slaState: 'OK',
      },
      {
        id: 'WFI-2026-004',
        definition: 'Validation conges annuels',
        requester: 'Saran Bah',
        createdOn: hoursFromNow(-72),
        currentStep: 'Termine',
        status: 'APPROUVE',
        priority: 'Basse',
        dueOn: hoursFromNow(-24),
        owner: 'Directeur RH',
        stepsTotal: 3,
        stepsCompleted: 3,
        escalationLevel: 0,
        lastUpdateOn: hoursFromNow(-20),
        timeline: [
          { date: hoursFromNow(-72), actor: 'Systeme', action: 'CREATION', note: '' },
          { date: hoursFromNow(-20), actor: 'Directeur RH', action: 'APPROUVER', note: 'Valide' },
        ],
        slaState: 'OK',
      },
    ]);
  }
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
