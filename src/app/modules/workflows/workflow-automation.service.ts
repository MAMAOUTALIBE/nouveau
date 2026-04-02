import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, firstValueFrom, map, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_ENDPOINTS } from '../../core/config/api-endpoints';
import { ApiClientService } from '../../core/services/api-client.service';
import { WorkflowAction } from './workflows.service';

export type WorkflowAutomationEventLevel = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface WorkflowAutomationEvent {
  id: string;
  date: string;
  level: WorkflowAutomationEventLevel;
  title: string;
  message: string;
  instanceId?: string;
  action?: WorkflowAction;
  channel?: string;
  trigger?: string;
}

export interface WorkflowAutomationEmailChannel {
  enabled: boolean;
  recipients: string[];
}

export interface WorkflowAutomationTeamsChannel {
  enabled: boolean;
  webhookUrl: string;
  channelName: string;
}

export interface WorkflowAutomationChannels {
  email: WorkflowAutomationEmailChannel;
  teams: WorkflowAutomationTeamsChannel;
}

export interface WorkflowAutomationStatus {
  enabled: boolean;
  intervalSeconds: number;
  lastRunAt: string | null;
  totalCycles: number;
  escalationsExecuted: number;
  notificationsSent: number;
  channels: WorkflowAutomationChannels;
}

export interface WorkflowAutomationPolicyWeights {
  priorityCritique: number;
  priorityHaute: number;
  slaBreached: number;
  slaWarning: number;
  overdueHours: number;
  agingHours: number;
  escalationLevel: number;
  remainingSteps: number;
}

export interface WorkflowAutomationPolicyThresholds {
  notify: number;
  n1: number;
  n2: number;
  comex: number;
}

export interface WorkflowAutomationPolicyOwners {
  n1: string;
  n2: string;
  comex: string;
}

export interface WorkflowAutomationPolicy {
  weights: WorkflowAutomationPolicyWeights;
  thresholds: WorkflowAutomationPolicyThresholds;
  owners: WorkflowAutomationPolicyOwners;
}

export interface WorkflowAutomationResult {
  processed: number;
  escalated: number;
  notified: number;
  events: WorkflowAutomationEvent[];
  trigger: string;
  state: WorkflowAutomationStatus;
}

export interface WorkflowAutomationSimulationItem {
  instanceId: string;
  definition: string;
  requester: string;
  priority: string;
  currentStatus: string;
  projectedStatus: string;
  currentEscalationLevel: number;
  projectedEscalationLevel: number;
  projectedEscalationLabel: string;
  scoreNow: number;
  scoreProjected: number;
  scoreDelta: number;
  shouldEscalate: boolean;
  shouldNotify: boolean;
  dueInHours: number | null;
  projectedOwner: string;
  projectedStep: string;
}

export interface WorkflowAutomationSimulationSummary {
  processed: number;
  escalationsPlanned: number;
  notificationsPlanned: number;
  criticalItems: number;
  targetN1: number;
  targetN2: number;
  targetComex: number;
}

export interface WorkflowAutomationSimulationResult {
  generatedAt: string;
  horizonHours: number;
  policy: WorkflowAutomationPolicy;
  summary: WorkflowAutomationSimulationSummary;
  items: WorkflowAutomationSimulationItem[];
}

interface WorkflowAutomationStatusDto {
  enabled?: boolean;
  intervalSeconds?: number | string;
  lastRunAt?: string | null;
  totalCycles?: number | string;
  escalationsExecuted?: number | string;
  notificationsSent?: number | string;
  channels?: {
    email?: {
      enabled?: boolean;
      recipients?: unknown;
    };
    teams?: {
      enabled?: boolean;
      webhookUrl?: string;
      channelName?: string;
    };
  };
}

interface WorkflowAutomationEventDto {
  id?: string;
  date?: string;
  level?: string;
  title?: string;
  message?: string;
  instanceId?: string;
  action?: WorkflowAction;
  channel?: string;
  trigger?: string;
}

interface WorkflowAutomationRunCycleDto {
  processed?: number | string;
  escalated?: number | string;
  notified?: number | string;
  trigger?: string;
  events?: WorkflowAutomationEventDto[];
  state?: WorkflowAutomationStatusDto;
}

interface WorkflowAutomationPolicyDto {
  weights?: {
    priorityCritique?: number | string;
    priorityHaute?: number | string;
    slaBreached?: number | string;
    slaWarning?: number | string;
    overdueHours?: number | string;
    agingHours?: number | string;
    escalationLevel?: number | string;
    remainingSteps?: number | string;
  };
  thresholds?: {
    notify?: number | string;
    n1?: number | string;
    n2?: number | string;
    comex?: number | string;
  };
  owners?: {
    n1?: string;
    n2?: string;
    comex?: string;
  };
}

interface WorkflowAutomationSimulationDto {
  generatedAt?: string;
  horizonHours?: number | string;
  policy?: WorkflowAutomationPolicyDto;
  summary?: {
    processed?: number | string;
    escalationsPlanned?: number | string;
    notificationsPlanned?: number | string;
    criticalItems?: number | string;
    targetN1?: number | string;
    targetN2?: number | string;
    targetComex?: number | string;
  };
  items?: WorkflowAutomationSimulationItemDto[];
}

interface WorkflowAutomationSimulationItemDto {
  instanceId?: string;
  definition?: string;
  requester?: string;
  priority?: string;
  currentStatus?: string;
  projectedStatus?: string;
  currentEscalationLevel?: number | string;
  projectedEscalationLevel?: number | string;
  projectedEscalationLabel?: string;
  scoreNow?: number | string;
  scoreProjected?: number | string;
  scoreDelta?: number | string;
  shouldEscalate?: boolean;
  shouldNotify?: boolean;
  dueInHours?: number | string | null;
  projectedOwner?: string;
  projectedStep?: string;
}

@Injectable({ providedIn: 'root' })
export class WorkflowAutomationService {
  private readonly fallbackEnabled = !!environment.auth?.devFallback?.enabled;
  private readonly eventHistoryLimit = 80;

  private readonly eventsSubject = new BehaviorSubject<WorkflowAutomationEvent[]>([]);
  private readonly runningSubject = new BehaviorSubject<boolean>(false);
  private readonly statusSubject = new BehaviorSubject<WorkflowAutomationStatus>(this.defaultStatus());
  private readonly policySubject = new BehaviorSubject<WorkflowAutomationPolicy>(this.defaultPolicy());

  private fallbackStatus = this.defaultStatus();
  private fallbackEvents: WorkflowAutomationEvent[] = [];
  private fallbackPolicy = this.defaultPolicy();

  constructor(private apiClient: ApiClientService) {
    void this.refresh();
  }

  get events$(): Observable<WorkflowAutomationEvent[]> {
    return this.eventsSubject.asObservable();
  }

  get running$(): Observable<boolean> {
    return this.runningSubject.asObservable();
  }

  get status$(): Observable<WorkflowAutomationStatus> {
    return this.statusSubject.asObservable();
  }

  get policy$(): Observable<WorkflowAutomationPolicy> {
    return this.policySubject.asObservable();
  }

  async refresh(limit = 40): Promise<void> {
    const [status, events, policy] = await Promise.all([
      firstValueFrom(this.fetchStatus$()),
      firstValueFrom(this.fetchEvents$(limit)),
      firstValueFrom(this.fetchPolicy$()),
    ]);

    this.applyStatus(status);
    this.applyEvents(events);
    this.applyPolicy(policy);
  }

  async startAutoEscalation(intervalMs = 45_000): Promise<void> {
    const intervalSeconds = this.clampInt(Math.round(intervalMs / 1000), 15, 600, 45);
    const status = await firstValueFrom(this.updateStatus$({ enabled: true, intervalSeconds }));
    this.applyStatus(status);

    const events = await firstValueFrom(this.fetchEvents$());
    this.applyEvents(events);
  }

  async stopAutoEscalation(): Promise<void> {
    const status = await firstValueFrom(this.updateStatus$({ enabled: false }));
    this.applyStatus(status);

    const events = await firstValueFrom(this.fetchEvents$());
    this.applyEvents(events);
  }

  async runCycle(): Promise<WorkflowAutomationResult> {
    const result = await firstValueFrom(
      this.apiClient
        .post<WorkflowAutomationRunCycleDto, Record<string, never>>(
          API_ENDPOINTS.workflows.automationRunCycle,
          {},
          { skipErrorToast: this.fallbackEnabled }
        )
        .pipe(
          map((dto) => this.mapRunCycle(dto)),
          catchError((error) => {
            if (!this.fallbackEnabled) {
              return throwError(() => error);
            }
            return of(this.runFallbackCycle());
          })
        )
    );

    this.applyStatus(result.state);

    const events = await firstValueFrom(this.fetchEvents$());
    this.applyEvents(events);

    return result;
  }

  async updateChannels(channels: Partial<WorkflowAutomationChannels>): Promise<WorkflowAutomationStatus> {
    const status = await firstValueFrom(
      this.apiClient
        .post<WorkflowAutomationStatusDto, Partial<WorkflowAutomationChannels>>(
          API_ENDPOINTS.workflows.automationChannels,
          channels,
          { skipErrorToast: this.fallbackEnabled }
        )
        .pipe(
          map((dto) => this.mapStatus(dto)),
          catchError((error) => {
            if (!this.fallbackEnabled) {
              return throwError(() => error);
            }
            const nextStatus = this.applyFallbackChannels(channels);
            return of(nextStatus);
          })
        )
    );

    this.applyStatus(status);

    const events = await firstValueFrom(this.fetchEvents$());
    this.applyEvents(events);

    return status;
  }

  async updatePolicy(policy: Partial<WorkflowAutomationPolicy>): Promise<WorkflowAutomationPolicy> {
    const nextPolicy = await firstValueFrom(
      this.apiClient
        .post<WorkflowAutomationPolicyDto, Partial<WorkflowAutomationPolicy>>(
          API_ENDPOINTS.workflows.automationPolicy,
          policy,
          { skipErrorToast: this.fallbackEnabled }
        )
        .pipe(
          map((dto) => this.mapPolicy(dto)),
          catchError((error) => {
            if (!this.fallbackEnabled) {
              return throwError(() => error);
            }
            const fallback = this.applyFallbackPolicy(policy);
            return of(fallback);
          })
        )
    );

    this.applyPolicy(nextPolicy);

    const events = await firstValueFrom(this.fetchEvents$());
    this.applyEvents(events);

    return nextPolicy;
  }

  async simulate(
    horizonHours = 24,
    policy?: Partial<WorkflowAutomationPolicy>
  ): Promise<WorkflowAutomationSimulationResult> {
    const safeHorizon = this.clampInt(horizonHours, 1, 168, 24);

    return await firstValueFrom(
      this.apiClient
        .post<WorkflowAutomationSimulationDto, { horizonHours: number; policy?: Partial<WorkflowAutomationPolicy> }>(
          API_ENDPOINTS.workflows.automationSimulate,
          { horizonHours: safeHorizon, policy },
          { skipErrorToast: this.fallbackEnabled }
        )
        .pipe(
          map((dto) => this.mapSimulation(dto, safeHorizon)),
          catchError((error) => {
            if (!this.fallbackEnabled) {
              return throwError(() => error);
            }
            return of(this.fallbackSimulation(safeHorizon, policy));
          })
        )
    );
  }

  async clearEvents(): Promise<void> {
    await firstValueFrom(
      this.apiClient
        .post<{ cleared?: boolean }, Record<string, never>>(
          API_ENDPOINTS.workflows.automationEventsClear,
          {},
          { skipErrorToast: this.fallbackEnabled }
        )
        .pipe(
          catchError((error) => {
            if (!this.fallbackEnabled) {
              return throwError(() => error);
            }
            this.fallbackEvents = [];
            return of({ cleared: true });
          })
        )
    );

    this.applyEvents([]);
  }

  private fetchStatus$(): Observable<WorkflowAutomationStatus> {
    return this.apiClient
      .get<WorkflowAutomationStatusDto>(API_ENDPOINTS.workflows.automationStatus, undefined, {
        skipErrorToast: this.fallbackEnabled,
      })
      .pipe(
        map((dto) => this.mapStatus(dto)),
        catchError((error) => {
          if (!this.fallbackEnabled) {
            return throwError(() => error);
          }
          return of(this.cloneStatus(this.fallbackStatus));
        })
      );
  }

  private fetchEvents$(limit = 40): Observable<WorkflowAutomationEvent[]> {
    return this.apiClient
      .get<WorkflowAutomationEventDto[]>(
        API_ENDPOINTS.workflows.automationEvents,
        { limit },
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((items) => (Array.isArray(items) ? items.map((item) => this.mapEvent(item)) : [])),
        map((events) => events.slice(0, this.eventHistoryLimit)),
        catchError((error) => {
          if (!this.fallbackEnabled) {
            return throwError(() => error);
          }
          return of(this.fallbackEvents.slice(0, this.eventHistoryLimit));
        })
      );
  }

  private fetchPolicy$(): Observable<WorkflowAutomationPolicy> {
    return this.apiClient
      .get<WorkflowAutomationPolicyDto>(API_ENDPOINTS.workflows.automationPolicy, undefined, {
        skipErrorToast: this.fallbackEnabled,
      })
      .pipe(
        map((dto) => this.mapPolicy(dto)),
        catchError((error) => {
          if (!this.fallbackEnabled) {
            return throwError(() => error);
          }
          return of(this.clonePolicy(this.fallbackPolicy));
        })
      );
  }

  private updateStatus$(payload: { enabled?: boolean; intervalSeconds?: number }): Observable<WorkflowAutomationStatus> {
    return this.apiClient
      .post<WorkflowAutomationStatusDto, { enabled?: boolean; intervalSeconds?: number }>(
        API_ENDPOINTS.workflows.automationStatus,
        payload,
        { skipErrorToast: this.fallbackEnabled }
      )
      .pipe(
        map((dto) => this.mapStatus(dto)),
        catchError((error) => {
          if (!this.fallbackEnabled) {
            return throwError(() => error);
          }
          const nextStatus = this.applyFallbackStatus(payload);
          return of(nextStatus);
        })
      );
  }

  private mapStatus(dto: WorkflowAutomationStatusDto | null | undefined): WorkflowAutomationStatus {
    const status = this.defaultStatus();

    if (!dto || typeof dto !== 'object') {
      return status;
    }

    const emailRecipientsRaw = dto.channels?.email?.recipients;
    const emailRecipients = this.normalizeRecipients(emailRecipientsRaw);
    const emailRecipientsProvided = Array.isArray(emailRecipientsRaw);

    return {
      enabled: typeof dto.enabled === 'boolean' ? dto.enabled : status.enabled,
      intervalSeconds: this.clampInt(dto.intervalSeconds, 15, 600, status.intervalSeconds),
      lastRunAt: typeof dto.lastRunAt === 'string' && dto.lastRunAt.trim().length ? dto.lastRunAt : null,
      totalCycles: this.toNumber(dto.totalCycles, 0),
      escalationsExecuted: this.toNumber(dto.escalationsExecuted, 0),
      notificationsSent: this.toNumber(dto.notificationsSent, 0),
      channels: {
        email: {
          enabled:
            typeof dto.channels?.email?.enabled === 'boolean'
              ? dto.channels.email.enabled
              : status.channels.email.enabled,
          recipients: emailRecipientsProvided ? emailRecipients : [...status.channels.email.recipients],
        },
        teams: {
          enabled:
            typeof dto.channels?.teams?.enabled === 'boolean'
              ? dto.channels.teams.enabled
              : status.channels.teams.enabled,
          webhookUrl:
            typeof dto.channels?.teams?.webhookUrl === 'string'
              ? dto.channels.teams.webhookUrl
              : status.channels.teams.webhookUrl,
          channelName:
            typeof dto.channels?.teams?.channelName === 'string'
              ? dto.channels.teams.channelName
              : status.channels.teams.channelName,
        },
      },
    };
  }

  private mapEvent(dto: WorkflowAutomationEventDto | null | undefined): WorkflowAutomationEvent {
    const levelRaw = String(dto?.level || 'INFO').toUpperCase();
    const level: WorkflowAutomationEventLevel =
      levelRaw === 'CRITICAL' || levelRaw === 'WARNING' || levelRaw === 'SUCCESS' ? levelRaw : 'INFO';

    return {
      id: typeof dto?.id === 'string' && dto.id.trim().length ? dto.id : this.newEventId(),
      date: typeof dto?.date === 'string' && dto.date.trim().length ? dto.date : new Date().toISOString(),
      level,
      title: typeof dto?.title === 'string' && dto.title.trim().length ? dto.title : 'Automation',
      message: typeof dto?.message === 'string' && dto.message.trim().length ? dto.message : 'Evenement workflow',
      instanceId: typeof dto?.instanceId === 'string' ? dto.instanceId : undefined,
      action: dto?.action,
      channel: typeof dto?.channel === 'string' ? dto.channel : undefined,
      trigger: typeof dto?.trigger === 'string' ? dto.trigger : undefined,
    };
  }

  private mapRunCycle(dto: WorkflowAutomationRunCycleDto | null | undefined): WorkflowAutomationResult {
    const resultState = this.mapStatus(dto?.state);
    const events = Array.isArray(dto?.events) ? dto.events.map((entry) => this.mapEvent(entry)) : [];

    return {
      processed: this.toNumber(dto?.processed, 0),
      escalated: this.toNumber(dto?.escalated, 0),
      notified: this.toNumber(dto?.notified, 0),
      trigger: typeof dto?.trigger === 'string' ? dto.trigger : 'manual',
      events,
      state: resultState,
    };
  }

  private mapSimulation(
    dto: WorkflowAutomationSimulationDto | null | undefined,
    fallbackHorizonHours: number
  ): WorkflowAutomationSimulationResult {
    const policy = this.mapPolicy(dto?.policy);
    const summary = dto?.summary;
    const itemsRaw = Array.isArray(dto?.items) ? dto.items : [];

    return {
      generatedAt:
        typeof dto?.generatedAt === 'string' && dto.generatedAt.trim().length ? dto.generatedAt : new Date().toISOString(),
      horizonHours: this.clampInt(dto?.horizonHours, 1, 168, fallbackHorizonHours),
      policy,
      summary: {
        processed: this.toNumber(summary?.processed, itemsRaw.length),
        escalationsPlanned: this.toNumber(summary?.escalationsPlanned, 0),
        notificationsPlanned: this.toNumber(summary?.notificationsPlanned, 0),
        criticalItems: this.toNumber(summary?.criticalItems, 0),
        targetN1: this.toNumber(summary?.targetN1, 0),
        targetN2: this.toNumber(summary?.targetN2, 0),
        targetComex: this.toNumber(summary?.targetComex, 0),
      },
      items: itemsRaw.map((item) => this.mapSimulationItem(item)),
    };
  }

  private mapSimulationItem(dto: WorkflowAutomationSimulationItemDto | null | undefined): WorkflowAutomationSimulationItem {
    const dueRaw = dto?.dueInHours;
    const dueParsed = dueRaw === null ? null : Number(dueRaw);
    const dueInHours = dueParsed === null || !Number.isFinite(dueParsed) ? null : Math.round(dueParsed * 10) / 10;

    return {
      instanceId: typeof dto?.instanceId === 'string' ? dto.instanceId : '',
      definition: typeof dto?.definition === 'string' ? dto.definition : '',
      requester: typeof dto?.requester === 'string' ? dto.requester : '',
      priority: typeof dto?.priority === 'string' ? dto.priority : 'Normale',
      currentStatus: typeof dto?.currentStatus === 'string' ? dto.currentStatus : 'EN_ATTENTE',
      projectedStatus: typeof dto?.projectedStatus === 'string' ? dto.projectedStatus : 'EN_ATTENTE',
      currentEscalationLevel: this.clampInt(dto?.currentEscalationLevel, 0, 3, 0),
      projectedEscalationLevel: this.clampInt(dto?.projectedEscalationLevel, 0, 3, 0),
      projectedEscalationLabel:
        typeof dto?.projectedEscalationLabel === 'string' && dto.projectedEscalationLabel.trim().length
          ? dto.projectedEscalationLabel
          : 'N0',
      scoreNow: this.clampInt(dto?.scoreNow, 0, 100, 0),
      scoreProjected: this.clampInt(dto?.scoreProjected, 0, 100, 0),
      scoreDelta: this.toSignedNumber(dto?.scoreDelta, 0),
      shouldEscalate: !!dto?.shouldEscalate,
      shouldNotify: !!dto?.shouldNotify,
      dueInHours,
      projectedOwner: typeof dto?.projectedOwner === 'string' ? dto.projectedOwner : '',
      projectedStep: typeof dto?.projectedStep === 'string' ? dto.projectedStep : '',
    };
  }

  private mapPolicy(dto: WorkflowAutomationPolicyDto | null | undefined): WorkflowAutomationPolicy {
    const fallback = this.defaultPolicy();

    if (!dto || typeof dto !== 'object') {
      return fallback;
    }

    const notify = this.clampInt(dto.thresholds?.notify, 0, 100, fallback.thresholds.notify);
    const n1Raw = this.clampInt(dto.thresholds?.n1, 0, 100, fallback.thresholds.n1);
    const n2Raw = this.clampInt(dto.thresholds?.n2, 0, 100, fallback.thresholds.n2);
    const comexRaw = this.clampInt(dto.thresholds?.comex, 0, 100, fallback.thresholds.comex);

    const n1 = Math.max(notify, n1Raw);
    const n2 = Math.max(n1, n2Raw);
    const comex = Math.max(n2, comexRaw);

    return {
      weights: {
        priorityCritique: this.clampInt(
          dto.weights?.priorityCritique,
          0,
          100,
          fallback.weights.priorityCritique
        ),
        priorityHaute: this.clampInt(dto.weights?.priorityHaute, 0, 100, fallback.weights.priorityHaute),
        slaBreached: this.clampInt(dto.weights?.slaBreached, 0, 100, fallback.weights.slaBreached),
        slaWarning: this.clampInt(dto.weights?.slaWarning, 0, 100, fallback.weights.slaWarning),
        overdueHours: this.clampInt(dto.weights?.overdueHours, 0, 100, fallback.weights.overdueHours),
        agingHours: this.clampInt(dto.weights?.agingHours, 0, 100, fallback.weights.agingHours),
        escalationLevel: this.clampInt(dto.weights?.escalationLevel, 0, 100, fallback.weights.escalationLevel),
        remainingSteps: this.clampInt(dto.weights?.remainingSteps, 0, 100, fallback.weights.remainingSteps),
      },
      thresholds: {
        notify,
        n1,
        n2,
        comex,
      },
      owners: {
        n1: this.readOwner(dto.owners?.n1, fallback.owners.n1),
        n2: this.readOwner(dto.owners?.n2, fallback.owners.n2),
        comex: this.readOwner(dto.owners?.comex, fallback.owners.comex),
      },
    };
  }

  private applyStatus(status: WorkflowAutomationStatus): void {
    const copy = this.cloneStatus(status);
    this.statusSubject.next(copy);
    this.runningSubject.next(copy.enabled);
    this.fallbackStatus = this.cloneStatus(copy);
  }

  private applyPolicy(policy: WorkflowAutomationPolicy): void {
    const copy = this.clonePolicy(policy);
    this.policySubject.next(copy);
    this.fallbackPolicy = this.clonePolicy(copy);
  }

  private applyEvents(events: WorkflowAutomationEvent[]): void {
    const normalized = [...events].slice(0, this.eventHistoryLimit);
    this.eventsSubject.next(normalized);
    this.fallbackEvents = [...normalized];
  }

  private runFallbackCycle(): WorkflowAutomationResult {
    const now = new Date().toISOString();
    this.fallbackStatus.lastRunAt = now;
    this.fallbackStatus.totalCycles += 1;

    const event: WorkflowAutomationEvent = {
      id: this.newEventId(),
      date: now,
      level: 'INFO',
      title: 'Cycle local',
      message: 'Cycle execute en mode fallback local',
      trigger: 'fallback',
    };

    this.fallbackEvents = [event, ...this.fallbackEvents].slice(0, this.eventHistoryLimit);

    return {
      processed: 0,
      escalated: 0,
      notified: 0,
      trigger: 'fallback',
      events: [event],
      state: this.cloneStatus(this.fallbackStatus),
    };
  }

  private fallbackSimulation(
    horizonHours: number,
    policy?: Partial<WorkflowAutomationPolicy>
  ): WorkflowAutomationSimulationResult {
    const nextPolicy = policy ? this.applyFallbackPolicy(policy) : this.clonePolicy(this.fallbackPolicy);

    return {
      generatedAt: new Date().toISOString(),
      horizonHours,
      policy: this.clonePolicy(nextPolicy),
      summary: {
        processed: 0,
        escalationsPlanned: 0,
        notificationsPlanned: 0,
        criticalItems: 0,
        targetN1: 0,
        targetN2: 0,
        targetComex: 0,
      },
      items: [],
    };
  }

  private applyFallbackStatus(payload: { enabled?: boolean; intervalSeconds?: number }): WorkflowAutomationStatus {
    if (typeof payload.enabled === 'boolean') {
      this.fallbackStatus.enabled = payload.enabled;
    }
    if (typeof payload.intervalSeconds === 'number') {
      this.fallbackStatus.intervalSeconds = this.clampInt(payload.intervalSeconds, 15, 600, 45);
    }

    const fallbackEvent: WorkflowAutomationEvent = {
      id: this.newEventId(),
      date: new Date().toISOString(),
      level: 'INFO',
      title: 'Configuration locale',
      message: `Auto-escalade ${this.fallbackStatus.enabled ? 'activee' : 'desactivee'} en fallback`,
      trigger: 'fallback',
    };
    this.fallbackEvents = [fallbackEvent, ...this.fallbackEvents].slice(0, this.eventHistoryLimit);

    return this.cloneStatus(this.fallbackStatus);
  }

  private applyFallbackChannels(channels: Partial<WorkflowAutomationChannels>): WorkflowAutomationStatus {
    if (channels.email) {
      if (typeof channels.email.enabled === 'boolean') {
        this.fallbackStatus.channels.email.enabled = channels.email.enabled;
      }
      if (Array.isArray(channels.email.recipients)) {
        this.fallbackStatus.channels.email.recipients = this.normalizeRecipients(channels.email.recipients);
      }
    }

    if (channels.teams) {
      if (typeof channels.teams.enabled === 'boolean') {
        this.fallbackStatus.channels.teams.enabled = channels.teams.enabled;
      }
      if (typeof channels.teams.webhookUrl === 'string') {
        this.fallbackStatus.channels.teams.webhookUrl = channels.teams.webhookUrl;
      }
      if (typeof channels.teams.channelName === 'string') {
        this.fallbackStatus.channels.teams.channelName = channels.teams.channelName;
      }
    }

    const fallbackEvent: WorkflowAutomationEvent = {
      id: this.newEventId(),
      date: new Date().toISOString(),
      level: 'INFO',
      title: 'Canaux locaux',
      message: 'Canaux de notification enregistres en fallback local',
      trigger: 'fallback',
    };
    this.fallbackEvents = [fallbackEvent, ...this.fallbackEvents].slice(0, this.eventHistoryLimit);

    return this.cloneStatus(this.fallbackStatus);
  }

  private applyFallbackPolicy(policy: Partial<WorkflowAutomationPolicy>): WorkflowAutomationPolicy {
    if (policy.weights) {
      this.fallbackPolicy.weights.priorityCritique = this.clampInt(
        policy.weights.priorityCritique,
        0,
        100,
        this.fallbackPolicy.weights.priorityCritique
      );
      this.fallbackPolicy.weights.priorityHaute = this.clampInt(
        policy.weights.priorityHaute,
        0,
        100,
        this.fallbackPolicy.weights.priorityHaute
      );
      this.fallbackPolicy.weights.slaBreached = this.clampInt(
        policy.weights.slaBreached,
        0,
        100,
        this.fallbackPolicy.weights.slaBreached
      );
      this.fallbackPolicy.weights.slaWarning = this.clampInt(
        policy.weights.slaWarning,
        0,
        100,
        this.fallbackPolicy.weights.slaWarning
      );
      this.fallbackPolicy.weights.overdueHours = this.clampInt(
        policy.weights.overdueHours,
        0,
        100,
        this.fallbackPolicy.weights.overdueHours
      );
      this.fallbackPolicy.weights.agingHours = this.clampInt(
        policy.weights.agingHours,
        0,
        100,
        this.fallbackPolicy.weights.agingHours
      );
      this.fallbackPolicy.weights.escalationLevel = this.clampInt(
        policy.weights.escalationLevel,
        0,
        100,
        this.fallbackPolicy.weights.escalationLevel
      );
      this.fallbackPolicy.weights.remainingSteps = this.clampInt(
        policy.weights.remainingSteps,
        0,
        100,
        this.fallbackPolicy.weights.remainingSteps
      );
    }

    if (policy.thresholds) {
      const notify = this.clampInt(policy.thresholds.notify, 0, 100, this.fallbackPolicy.thresholds.notify);
      const n1 = this.clampInt(policy.thresholds.n1, 0, 100, this.fallbackPolicy.thresholds.n1);
      const n2 = this.clampInt(policy.thresholds.n2, 0, 100, this.fallbackPolicy.thresholds.n2);
      const comex = this.clampInt(policy.thresholds.comex, 0, 100, this.fallbackPolicy.thresholds.comex);

      this.fallbackPolicy.thresholds.notify = notify;
      this.fallbackPolicy.thresholds.n1 = Math.max(notify, n1);
      this.fallbackPolicy.thresholds.n2 = Math.max(this.fallbackPolicy.thresholds.n1, n2);
      this.fallbackPolicy.thresholds.comex = Math.max(this.fallbackPolicy.thresholds.n2, comex);
    }

    if (policy.owners) {
      this.fallbackPolicy.owners.n1 = this.readOwner(policy.owners.n1, this.fallbackPolicy.owners.n1);
      this.fallbackPolicy.owners.n2 = this.readOwner(policy.owners.n2, this.fallbackPolicy.owners.n2);
      this.fallbackPolicy.owners.comex = this.readOwner(policy.owners.comex, this.fallbackPolicy.owners.comex);
    }

    const fallbackEvent: WorkflowAutomationEvent = {
      id: this.newEventId(),
      date: new Date().toISOString(),
      level: 'INFO',
      title: 'Matrice locale',
      message: 'Matrice de priorisation enregistree en fallback local',
      trigger: 'fallback',
    };
    this.fallbackEvents = [fallbackEvent, ...this.fallbackEvents].slice(0, this.eventHistoryLimit);

    return this.clonePolicy(this.fallbackPolicy);
  }

  private normalizeRecipients(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .map((entry) => String(entry || '').trim())
      .filter((entry) => entry.length > 0)
      .slice(0, 20);
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(0, Math.round(parsed));
  }

  private toSignedNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.round(parsed);
  }

  private clampInt(value: unknown, min: number, max: number, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(parsed)));
  }

  private cloneStatus(status: WorkflowAutomationStatus): WorkflowAutomationStatus {
    return {
      ...status,
      channels: {
        email: {
          enabled: status.channels.email.enabled,
          recipients: [...status.channels.email.recipients],
        },
        teams: {
          enabled: status.channels.teams.enabled,
          webhookUrl: status.channels.teams.webhookUrl,
          channelName: status.channels.teams.channelName,
        },
      },
    };
  }

  private clonePolicy(policy: WorkflowAutomationPolicy): WorkflowAutomationPolicy {
    return {
      weights: { ...policy.weights },
      thresholds: { ...policy.thresholds },
      owners: { ...policy.owners },
    };
  }

  private defaultStatus(): WorkflowAutomationStatus {
    return {
      enabled: false,
      intervalSeconds: 45,
      lastRunAt: null,
      totalCycles: 0,
      escalationsExecuted: 0,
      notificationsSent: 0,
      channels: {
        email: {
          enabled: true,
          recipients: ['drh@gouv.gn', 'ops.rh@gouv.gn'],
        },
        teams: {
          enabled: false,
          webhookUrl: 'https://teams.example/webhook/rh-ops',
          channelName: 'RH-OPS',
        },
      },
    };
  }

  private defaultPolicy(): WorkflowAutomationPolicy {
    return {
      weights: {
        priorityCritique: 35,
        priorityHaute: 22,
        slaBreached: 38,
        slaWarning: 18,
        overdueHours: 12,
        agingHours: 10,
        escalationLevel: 8,
        remainingSteps: 6,
      },
      thresholds: {
        notify: 55,
        n1: 65,
        n2: 80,
        comex: 92,
      },
      owners: {
        n1: 'Responsable RH',
        n2: 'Direction RH',
        comex: 'COMEX RH',
      },
    };
  }

  private readOwner(value: unknown, fallback: string): string {
    if (typeof value !== 'string') {
      return fallback;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }

  private newEventId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }
}
