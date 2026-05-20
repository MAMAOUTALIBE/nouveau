import { Injectable, inject } from '@angular/core';
import { Observable, catchError, combineLatest, map, of } from 'rxjs';
import { LeaveRequest, LeaveService } from '../leave/leave.service';
import { VacantPosition, OrganizationService } from '../organization/organization.service';
import { AgentListItem, PersonnelService } from '../personnel/personnel.service';
import { Application, RecruitmentService } from '../recruitment/recruitment.service';
import { WorkflowInstance, WorkflowsService } from '../workflows/workflows.service';
import { DisciplineCase, DisciplineService } from '../discipline/discipline.service';

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

export interface HrTurnoverRiskItem {
  agentId: string;
  matricule: string;
  fullName: string;
  direction: string;
  unit: string;
  position: string;
  riskScore: number;
  riskLevel: 'Faible' | 'Modere' | 'Eleve' | 'Critique';
  factors: string[];
  recommendedAction: string;
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
  turnoverRiskItems: HrTurnoverRiskItem[];
  insights: string[];
  records: {
    agents: AgentListItem[];
    leaveRequests: LeaveRequest[];
    vacancies: VacantPosition[];
    workflows: WorkflowInstance[];
    applications: Application[];
    disciplineCases: DisciplineCase[];
  };
}

export interface HrReportSourceData {
  agents: AgentListItem[];
  leaveRequests: LeaveRequest[];
  vacancies: VacantPosition[];
  workflows: WorkflowInstance[];
  applications: Application[];
  disciplineCases: DisciplineCase[];
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
  private disciplineService = inject(DisciplineService);

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
      disciplineCases: this.disciplineService
        .getCases({
          page: 1,
          limit: MAX_COLLECTION_LIMIT,
          sortBy: 'openedOn',
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
  const turnoverRiskItems = buildTurnoverRiskItems(scopedAgents, source.leaveRequests, source.disciplineCases, now);
  const highTurnoverRisk = turnoverRiskItems.filter(
    (item) => item.riskLevel === 'Eleve' || item.riskLevel === 'Critique'
  ).length;

  const insights = [
    `${workflowBreached} workflow(s) en depassement SLA`,
    `${recruitmentPipeline} candidature(s) en cours de traitement`,
    `${periodLeaves.length} demande(s) d'absence sur ${filters.periodDays} jours`,
    `${workflowApprovedInPeriod.length} workflow(s) finalise(s) sur la periode`,
    `${highTurnoverRisk} agent(s) avec risque de turn-over eleve ou critique`,
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
      {
        id: 'turnover_high_risk',
        label: 'Risque turn-over',
        value: highTurnoverRisk,
        badge: highTurnoverRisk > 0 ? 'bg-danger' : 'bg-success',
      },
    ],
    directionDistribution,
    leaveByType,
    workflowByStatus,
    leaveTrend,
    workflowThroughputTrend,
    riskItems,
    turnoverRiskItems,
    insights,
    records: {
      agents: scopedAgents,
      leaveRequests: source.leaveRequests,
      vacancies: source.vacancies,
      workflows: source.workflows,
      applications: source.applications,
      disciplineCases: source.disciplineCases,
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

function buildTurnoverRiskItems(
  agents: AgentListItem[],
  leaveRequests: LeaveRequest[],
  disciplineCases: DisciplineCase[],
  now: Date
): HrTurnoverRiskItem[] {
  const nowTs = now.getTime();
  const ninetyDaysAgo = nowTs - 90 * 24 * 60 * 60 * 1000;

  return agents
    .map((agent) => {
      const factors: string[] = [];
      let score = 0;
      const status = normalizeText(agent.status);

      if (status.includes('absence')) {
        score += 18;
        factors.push('Statut en absence');
      }
      if (status.includes('inactif')) {
        score += 25;
        factors.push('Statut inactif');
      }
      if (!safeLabel(agent.manager || '', '').trim()) {
        score += 10;
        factors.push('Manager non renseigne');
      }

      const recentLeaves = leaveRequests.filter((request) => {
        const requestMeta = request as unknown as { requesterName?: string };
        const requester = normalizeText(request.agent || requestMeta.requesterName || '');
        const start = Date.parse(request.startDate);
        return (
          !Number.isNaN(start) &&
          start >= ninetyDaysAgo &&
          (requester === normalizeText(agent.fullName) || requester === normalizeText(agent.matricule))
        );
      });
      if (recentLeaves.length >= 3) {
        score += 20;
        factors.push(`${recentLeaves.length} absences recentes`);
      } else if (recentLeaves.length >= 2) {
        score += 10;
        factors.push(`${recentLeaves.length} absences recentes`);
      }

      const agentDocuments = Array.isArray(agent.documents) ? agent.documents : [];
      const expiredRequiredDocuments = agentDocuments.filter((document) => {
        const normalizedStatus = normalizeText(document.status);
        const expiry = Date.parse(document.expiresAt || '');
        return (
          document.required !== false &&
          (normalizedStatus.includes('expire') || (!Number.isNaN(expiry) && expiry < nowTs))
        );
      });
      if (expiredRequiredDocuments.length > 0) {
        score += 12;
        factors.push(`${expiredRequiredDocuments.length} piece(s) critique(s) expiree(s)`);
      }

      const contractDocument = agentDocuments.find((document) => normalizeText(document.type).includes('contrat'));
      const contractExpiry = Date.parse(contractDocument?.expiresAt || '');
      if (!Number.isNaN(contractExpiry)) {
        const daysRemaining = Math.ceil((contractExpiry - nowTs) / (24 * 60 * 60 * 1000));
        if (daysRemaining < 0) {
          score += 30;
          factors.push('Contrat expire');
        } else if (daysRemaining <= 60) {
          score += 22;
          factors.push('Contrat a renouveler sous 60 jours');
        }
      }

      const agentDisciplineCases = disciplineCases.filter(
        (item) => normalizeText(item.agent) === normalizeText(agent.fullName)
      );
      const severeCases = agentDisciplineCases.filter((item) => {
        const severity = normalizeText(item.severity);
        return severity.includes('critique') || severity.includes('eleve');
      });
      if (severeCases.length > 0) {
        score += Math.min(25, severeCases.length * 15);
        factors.push(`${severeCases.length} dossier(s) disciplinaire(s) sensible(s)`);
      }

      const hireDate = Date.parse(agent.hireDate || '');
      if (!Number.isNaN(hireDate)) {
        const daysSinceHire = Math.ceil((nowTs - hireDate) / (24 * 60 * 60 * 1000));
        if (daysSinceHire >= 0 && daysSinceHire <= 120) {
          score += 8;
          factors.push('Integration recente a suivre');
        }
      }

      const riskScore = Math.min(100, score);
      return {
        agentId: agent.id,
        matricule: agent.matricule,
        fullName: agent.fullName,
        direction: agent.direction,
        unit: agent.unit,
        position: agent.position,
        riskScore,
        riskLevel: turnoverRiskLevel(riskScore),
        factors,
        recommendedAction: turnoverRecommendedAction(riskScore, factors),
      } as HrTurnoverRiskItem;
    })
    .filter((item) => item.riskScore > 0)
    .sort((left, right) => right.riskScore - left.riskScore || left.fullName.localeCompare(right.fullName))
    .slice(0, 12);
}

function turnoverRiskLevel(score: number): HrTurnoverRiskItem['riskLevel'] {
  if (score >= 75) return 'Critique';
  if (score >= 50) return 'Eleve';
  if (score >= 25) return 'Modere';
  return 'Faible';
}

function turnoverRecommendedAction(score: number, factors: string[]): string {
  if (score >= 75) {
    return 'Entretien RH prioritaire et plan de retention individualise';
  }
  if (score >= 50) {
    return 'Entretien manager sous 7 jours et regularisation des irritants';
  }
  if (factors.some((item) => normalizeText(item).includes('contrat'))) {
    return 'Anticiper le renouvellement contractuel';
  }
  if (factors.some((item) => normalizeText(item).includes('absence'))) {
    return 'Analyser les absences recentes avec le manager';
  }
  return 'Surveillance RH mensuelle';
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
  if (
    normalized.includes('rejete') ||
    normalized.includes('annule') ||
    normalized.includes('cloture') ||
    normalized.includes('retenu') ||
    normalized.includes('accepte')
  ) {
    return false;
  }
  return (
    normalized.includes('nouveau') ||
    normalized.includes('attente') ||
    normalized.includes('cours') ||
    normalized.includes('shortlist') ||
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
