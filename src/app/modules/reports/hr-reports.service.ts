import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';
import { LeaveRequest, LeaveService } from '../leave/leave.service';
import { VacantPosition, OrganizationService } from '../organization/organization.service';
import { AgentListItem, PersonnelService } from '../personnel/personnel.service';
import { Application, RecruitmentService } from '../recruitment/recruitment.service';
import { WorkflowInstance, WorkflowsService } from '../workflows/workflows.service';

export interface HrReportFilters {
  periodDays?: number;
  direction?: string;
}

export interface HrReportKpi {
  id: string;
  label: string;
  value: number;
  badge: string;
  unit?: string;
}

export interface HrDistributionItem {
  label: string;
  value: number;
  sharePercent: number;
}

export interface HrTrendPoint {
  key: string;
  label: string;
  value: number;
}

export interface HrRiskItem {
  instanceId: string;
  definition: string;
  requester: string;
  owner: string;
  status: string;
  slaState: string;
  escalationLevel: number;
  score: number;
}

export interface HrReportSnapshot {
  generatedAt: string;
  filters: {
    periodDays: number;
    direction: string | null;
  };
  kpis: HrReportKpi[];
  directionDistribution: HrDistributionItem[];
  leaveByType: HrDistributionItem[];
  workflowByStatus: HrDistributionItem[];
  leaveTrend: HrTrendPoint[];
  workflowThroughputTrend: HrTrendPoint[];
  riskItems: HrRiskItem[];
  insights: string[];
  records: {
    agents: AgentListItem[];
    leaveRequests: LeaveRequest[];
    vacancies: VacantPosition[];
    workflows: WorkflowInstance[];
    applications: Application[];
  };
}

export interface HrReportSourceData {
  agents: AgentListItem[];
  leaveRequests: LeaveRequest[];
  vacancies: VacantPosition[];
  workflows: WorkflowInstance[];
  applications: Application[];
}

interface NormalizedFilters {
  periodDays: number;
  direction: string | null;
}

const DEFAULT_PERIOD_DAYS = 90;
const DEFAULT_MONTHS = 6;
const MAX_COLLECTION_LIMIT = 1000;

@Injectable({ providedIn: 'root' })
export class HrReportsService {
  private personnelService = inject(PersonnelService);
  private leaveService = inject(LeaveService);
  private organizationService = inject(OrganizationService);
  private workflowsService = inject(WorkflowsService);
  private recruitmentService = inject(RecruitmentService);

  buildSnapshot(filters?: HrReportFilters): Observable<HrReportSnapshot> {
    const normalized = normalizeHrReportFilters(filters);

    return combineLatest({
      agents: this.personnelService
        .getAgents({
          direction: normalized.direction || undefined,
          page: 1,
          limit: MAX_COLLECTION_LIMIT,
          sortBy: 'fullName',
          sortOrder: 'asc',
        })
        .pipe(catchError(() => of([]))),
      leaveRequests: this.leaveService
        .getRequests({
          page: 1,
          limit: MAX_COLLECTION_LIMIT,
          sortBy: 'startDate',
          sortOrder: 'desc',
        })
        .pipe(catchError(() => of([]))),
      vacancies: this.organizationService
        .getVacantPositions({
          page: 1,
          limit: MAX_COLLECTION_LIMIT,
          sortBy: 'openedOn',
          sortOrder: 'desc',
        })
        .pipe(catchError(() => of([]))),
      workflows: this.workflowsService.getInstances().pipe(catchError(() => of([]))),
      applications: this.recruitmentService
        .getApplications({
          page: 1,
          limit: MAX_COLLECTION_LIMIT,
          sortBy: 'receivedOn',
          sortOrder: 'desc',
        })
        .pipe(catchError(() => of([]))),
    }).pipe(map((data) => composeHrReportSnapshot(data, normalized, new Date())));
  }
}

export function normalizeHrReportFilters(filters?: HrReportFilters): NormalizedFilters {
  const periodDays = clampPositiveInt(filters?.periodDays, 30, 365, DEFAULT_PERIOD_DAYS);
  const directionRaw = typeof filters?.direction === 'string' ? filters.direction.trim() : '';
  return {
    periodDays,
    direction: directionRaw.length ? directionRaw : null,
  };
}

export function composeHrReportSnapshot(
  source: HrReportSourceData,
  filters: NormalizedFilters,
  now: Date
): HrReportSnapshot {
  const nowTs = now.getTime();
  const periodStart = new Date(nowTs);
  periodStart.setDate(periodStart.getDate() - filters.periodDays);
  const periodStartTs = periodStart.getTime();

  const scopedAgents = source.agents.filter((agent) => {
    if (!filters.direction) return true;
    return normalizeText(agent.direction) === normalizeText(filters.direction);
  });

  const periodLeaves = source.leaveRequests.filter((request) =>
    isDateWithinRange(request.startDate, periodStartTs, nowTs)
  );
  const workflowApprovedInPeriod = source.workflows.filter(
    (instance) => instance.status === 'APPROUVE' && isDateWithinRange(instance.lastUpdateOn, periodStartTs, nowTs)
  );

  const totalAgents = scopedAgents.length;
  const activeAgents = scopedAgents.filter((agent) => isActiveAgent(agent.status)).length;
  const openLeaves = source.leaveRequests.filter((request) => isOpenLeaveRequest(request, nowTs)).length;
  const vacantPositions = source.vacancies.length;
  const workflowBreached = source.workflows.filter(
    (instance) => instance.slaState === 'BREACHED' || instance.status === 'EN_RETARD'
  ).length;
  const recruitmentPipeline = source.applications.filter((item) => isRecruitmentPipelineStatus(item.status)).length;
  const absenteeismRate = totalAgents > 0 ? roundTo((openLeaves / totalAgents) * 100, 1) : 0;

  const directionDistribution = buildDistribution(
    scopedAgents,
    (agent) => safeLabel(agent.direction, 'Non defini')
  );
  const leaveByType = buildDistribution(periodLeaves, (request) => safeLabel(request.type, 'Non defini'));
  const workflowByStatus = buildDistribution(source.workflows, (instance) => safeLabel(instance.status, 'Inconnu'));
  const leaveTrend = buildMonthlyTrend(source.leaveRequests, (item) => item.startDate, now, DEFAULT_MONTHS);
  const workflowThroughputTrend = buildMonthlyTrend(
    source.workflows.filter((item) => item.status === 'APPROUVE'),
    (item) => item.lastUpdateOn,
    now,
    DEFAULT_MONTHS
  );
  const riskItems = buildRiskItems(source.workflows);

  const insights = [
    `${workflowBreached} workflow(s) en depassement SLA`,
    `${recruitmentPipeline} candidature(s) en cours de traitement`,
    `${periodLeaves.length} demande(s) d'absence sur ${filters.periodDays} jours`,
    `${workflowApprovedInPeriod.length} workflow(s) finalise(s) sur la periode`,
  ];

  return {
    generatedAt: now.toISOString(),
    filters,
    kpis: [
      { id: 'total_agents', label: 'Effectif total', value: totalAgents, badge: 'bg-primary' },
      { id: 'active_agents', label: 'Agents actifs', value: activeAgents, badge: 'bg-success' },
      { id: 'open_leaves', label: 'Absences en cours', value: openLeaves, badge: 'bg-warning' },
      { id: 'vacant_positions', label: 'Postes vacants', value: vacantPositions, badge: 'bg-danger' },
      { id: 'workflow_breached', label: 'Workflows critiques', value: workflowBreached, badge: 'bg-danger' },
      {
        id: 'absenteeism_rate',
        label: "Taux d'absence",
        value: absenteeismRate,
        unit: '%',
        badge: 'bg-info',
      },
    ],
    directionDistribution,
    leaveByType,
    workflowByStatus,
    leaveTrend,
    workflowThroughputTrend,
    riskItems,
    insights,
    records: {
      agents: scopedAgents,
      leaveRequests: source.leaveRequests,
      vacancies: source.vacancies,
      workflows: source.workflows,
      applications: source.applications,
    },
  };
}

function buildDistribution<T>(items: T[], selector: (entry: T) => string): HrDistributionItem[] {
  const counts = new Map<string, number>();

  items.forEach((entry) => {
    const key = selector(entry);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const total = items.length || 1;
  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      sharePercent: roundTo((value / total) * 100, 1),
    }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
}

function buildMonthlyTrend<T>(
  items: T[],
  dateSelector: (entry: T) => string,
  now: Date,
  months: number
): HrTrendPoint[] {
  const safeMonths = clampPositiveInt(months, 1, 24, DEFAULT_MONTHS);
  const monthBuckets: HrTrendPoint[] = [];

  for (let cursor = safeMonths - 1; cursor >= 0; cursor--) {
    const bucketDate = new Date(now.getFullYear(), now.getMonth() - cursor, 1);
    const key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`;
    const label = bucketDate.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthBuckets.push({ key, label, value: 0 });
  }

  const lookup = new Map(monthBuckets.map((bucket) => [bucket.key, bucket]));
  items.forEach((entry) => {
    const date = new Date(dateSelector(entry));
    if (Number.isNaN(date.getTime())) {
      return;
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const bucket = lookup.get(key);
    if (bucket) {
      bucket.value += 1;
    }
  });

  return monthBuckets;
}

function buildRiskItems(instances: WorkflowInstance[]): HrRiskItem[] {
  return instances
    .map((instance) => {
      let score = 0;
      if (instance.slaState === 'BREACHED') score += 60;
      if (instance.slaState === 'WARNING') score += 25;
      if (instance.priority === 'Critique') score += 20;
      if (instance.priority === 'Haute') score += 10;
      score += instance.escalationLevel * 15;

      return {
        instanceId: instance.id,
        definition: instance.definition,
        requester: instance.requester,
        owner: instance.owner,
        status: instance.status,
        slaState: instance.slaState,
        escalationLevel: instance.escalationLevel,
        score,
      };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8);
}

function isDateWithinRange(dateRaw: string, startTs: number, endTs: number): boolean {
  const timestamp = Date.parse(dateRaw);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return timestamp >= startTs && timestamp <= endTs;
}

function isActiveAgent(status: string): boolean {
  const normalized = normalizeText(status);
  return normalized.includes('actif') && !normalized.includes('inactif');
}

function isOpenLeaveRequest(request: LeaveRequest, nowTs: number): boolean {
  const status = normalizeText(request.status);
  if (status.includes('rejete') || status.includes('approuve') || status.includes('termine')) {
    return false;
  }

  const start = Date.parse(request.startDate);
  const end = Date.parse(request.endDate);
  if (!Number.isNaN(start) && !Number.isNaN(end)) {
    return start <= nowTs && nowTs <= end;
  }

  return status.includes('attente') || status.includes('cours');
}

function isRecruitmentPipelineStatus(status: string): boolean {
  const normalized = normalizeText(status);
  if (normalized.includes('rejete') || normalized.includes('annule') || normalized.includes('cloture')) {
    return false;
  }
  return (
    normalized.includes('attente') ||
    normalized.includes('cours') ||
    normalized.includes('preselection') ||
    normalized.includes('entretien') ||
    normalized.includes('validation')
  );
}

function safeLabel(value: string, fallback: string): string {
  const text = value.trim();
  return text.length ? text : fallback;
}

function normalizeText(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function clampPositiveInt(value: unknown, min: number, max: number, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const rounded = Math.round(numeric);
  return Math.max(min, Math.min(max, rounded));
}

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
