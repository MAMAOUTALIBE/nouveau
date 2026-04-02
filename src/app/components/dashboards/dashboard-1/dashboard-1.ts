import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApexOptions } from 'ng-apexcharts';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import {
  DashboardPendingRequest,
  DashboardService,
  DashboardSummary,
} from '../../../modules/dashboard/services/dashboard.service';
import { LeaveBalance, LeaveRequest, LeaveService } from '../../../modules/leave/leave.service';
import {
  AgentListItem,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
} from '../../../modules/personnel/personnel.service';
import {
  Application,
  Campaign,
  OnboardingItem,
  RecruitmentService,
} from '../../../modules/recruitment/recruitment.service';
import {
  BudgetedPosition,
  OrganizationService,
  VacantPosition,
} from '../../../modules/organization/organization.service';
import { AuthService } from '../../../shared/services/auth.service';

interface DashboardMetric {
  title: string;
  value: string;
  subtitle: string;
  detail: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
}

interface DashboardActionItem {
  title: string;
  description: string;
  status: string;
  dateLabel: string;
  dateValue: string;
}

interface DashboardBalanceProgress {
  type: string;
  allocated: number;
  consumed: number;
  remaining: number;
  percent: number;
  barClass: string;
}

interface DashboardTimelineItem {
  title: string;
  description: string;
  status: string;
  dateLabel: string;
  dateValue: string;
}

interface DashboardRecruitmentKpis {
  conversionRate: number;
  averageStageDelayDays: number;
  activeCampaignCount: number;
  retainedCount: number;
  totalApplications: number;
}

@Component({
  selector: 'app-dashboard-1',
  imports: [CommonModule, RouterLink, SpkApexcharts],
  templateUrl: './dashboard-1.html',
  styleUrl: './dashboard-1.scss',
})
export class Dashboard1 implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly personnelService = inject(PersonnelService);
  private readonly leaveService = inject(LeaveService);
  private readonly organizationService = inject(OrganizationService);
  private readonly recruitmentService = inject(RecruitmentService);

  readonly monthLabels = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

  loading = true;
  errorMessage = '';
  userDisplayName = '';
  activityRate = 0;

  summary: DashboardSummary = {
    headcount: 0,
    active: 0,
    absences: 0,
    vacancies: 0,
  };

  metrics: DashboardMetric[] = [];
  pendingRequests: DashboardPendingRequest[] = [];
  recentAgents: AgentListItem[] = [];
  actionItems: DashboardActionItem[] = [];
  leaveBalanceProgress: DashboardBalanceProgress[] = [];
  priorityVacancies: VacantPosition[] = [];
  timelineItems: DashboardTimelineItem[] = [];
  campaignItems: Campaign[] = [];
  recruitmentKpis: DashboardRecruitmentKpis = {
    conversionRate: 0,
    averageStageDelayDays: 0,
    activeCampaignCount: 0,
    retainedCount: 0,
    totalApplications: 0,
  };

  activityRateChart: ApexOptions = this.buildActivityRateChart(0);
  monthlyFlowChart: ApexOptions = this.buildMonthlyFlowChart(
    new Array(12).fill(0),
    new Array(12).fill(0),
    new Array(12).fill(0)
  );

  ngOnInit(): void {
    this.userDisplayName = this.resolveDisplayName(this.authService.currentUserName());
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      summary: this.safeStream(this.dashboardService.getSummary(), this.summary),
      pendingRequests: this.safeStream(this.dashboardService.getPendingRequests(), [] as DashboardPendingRequest[]),
      agents: this.safeStream(
        this.personnelService.getAgents({ limit: 8, sortBy: 'id', sortOrder: 'desc' }),
        [] as AgentListItem[]
      ),
      dossiers: this.safeStream(
        this.personnelService.getDossiers({ limit: 80, sortBy: 'updatedAt', sortOrder: 'desc' }),
        [] as PersonnelDossier[]
      ),
      affectations: this.safeStream(
        this.personnelService.getAffectations({ limit: 80, sortBy: 'effectiveDate', sortOrder: 'desc' }),
        [] as PersonnelAffectation[]
      ),
      leaveRequests: this.safeStream(
        this.leaveService.getRequests({ limit: 200, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as LeaveRequest[]
      ),
      leaveBalances: this.safeStream(this.leaveService.getBalances({ limit: 50 }), [] as LeaveBalance[]),
      budgetedPositions: this.safeStream(
        this.organizationService.getBudgetedPositions({ limit: 200, sortBy: 'code', sortOrder: 'asc' }),
        [] as BudgetedPosition[]
      ),
      vacantPositions: this.safeStream(
        this.organizationService.getVacantPositions({ limit: 200, sortBy: 'openedOn', sortOrder: 'desc' }),
        [] as VacantPosition[]
      ),
      applications: this.safeStream(
        this.recruitmentService.getApplications({ limit: 200, sortBy: 'receivedOn', sortOrder: 'desc' }),
        [] as Application[]
      ),
      campaigns: this.safeStream(
        this.recruitmentService.getCampaigns({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as Campaign[]
      ),
      onboarding: this.safeStream(
        this.recruitmentService.getOnboarding({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as OnboardingItem[]
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.summary = result.summary;
          this.pendingRequests = result.pendingRequests;
          this.recentAgents = [...result.agents].slice(0, 6);
          this.priorityVacancies = this.sortVacancies(result.vacantPositions).slice(0, 6);
          this.campaignItems = this.sortCampaigns(result.campaigns).slice(0, 6);

          this.activityRate = this.calculatePercent(this.summary.active, this.summary.headcount);
          this.activityRateChart = this.buildActivityRateChart(this.activityRate);
          this.monthlyFlowChart = this.buildMonthlyFlowChart(
            this.countByMonth(result.leaveRequests.map((item) => item.startDate)),
            this.countByMonth(result.dossiers.map((item) => item.updatedAt)),
            this.countByMonth(result.applications.map((item) => item.receivedOn))
          );

          this.metrics = this.buildMetrics(
            result.leaveRequests,
            result.vacantPositions,
            result.budgetedPositions,
            result.campaigns,
            result.applications
          );
          this.recruitmentKpis = this.buildRecruitmentKpis(result.applications, result.campaigns);
          this.leaveBalanceProgress = this.buildLeaveBalanceProgress(result.leaveBalances);
          this.actionItems = this.buildActionItems(result.pendingRequests, result.onboarding);
          this.timelineItems = this.buildTimelineItems(
            result.dossiers,
            result.affectations,
            result.leaveRequests,
            result.applications
          );

          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Impossible de charger le tableau de bord pour le moment. Veuillez reessayer.';
        },
      });
  }

  private buildMetrics(
    leaveRequests: LeaveRequest[],
    vacantPositions: VacantPosition[],
    budgetedPositions: BudgetedPosition[],
    campaigns: Campaign[],
    applications: Application[]
  ): DashboardMetric[] {
    const activeRate = this.calculatePercent(this.summary.active, this.summary.headcount);
    const approvedLeaveCount = leaveRequests.filter((item) =>
      this.normalizeText(item.status).includes('approuve')
    ).length;
    const highPriorityVacancyCount = vacantPositions.filter((item) =>
      this.normalizeText(item.priority).includes('haute')
    ).length;
    const openedBudgetedCount = budgetedPositions.filter((item) =>
      this.normalizeText(item.status).includes('ouvert')
    ).length;
    const activeCampaignCount = campaigns.filter((item) => this.isActiveCampaign(item.status)).length;

    return [
      {
        title: 'Effectif total',
        value: this.formatNumber(this.summary.headcount),
        subtitle: 'Agents actifs',
        detail: `${this.formatNumber(this.summary.active)} (${this.formatPercent(activeRate)})`,
        icon: 'users',
        color: 'primary',
      },
      {
        title: 'Absences en cours',
        value: this.formatNumber(this.summary.absences),
        subtitle: 'Demandes approuvees',
        detail: this.formatNumber(approvedLeaveCount),
        icon: 'calendar',
        color: 'warning',
      },
      {
        title: 'Postes vacants',
        value: this.formatNumber(this.summary.vacancies || vacantPositions.length),
        subtitle: 'Priorite haute',
        detail: this.formatNumber(highPriorityVacancyCount),
        icon: 'briefcase',
        color: 'danger',
      },
      {
        title: 'Recrutements',
        value: this.formatNumber(applications.length),
        subtitle: 'Campagnes actives / Postes ouverts',
        detail: `${this.formatNumber(activeCampaignCount)} / ${this.formatNumber(openedBudgetedCount)}`,
        icon: 'user-plus',
        color: 'success',
      },
    ];
  }

  private buildRecruitmentKpis(
    applications: Application[],
    campaigns: Campaign[]
  ): DashboardRecruitmentKpis {
    const totalApplications = applications.length;
    const retainedCount = applications.filter((item) =>
      this.normalizeText(item.status).includes('retenu')
    ).length;
    const conversionRate = this.calculatePercent(retainedCount, totalApplications);
    const stageDelays = applications
      .map((item) => this.computeApplicationStageDelayDays(item))
      .filter((value) => value > 0);
    const averageStageDelayDays =
      stageDelays.length > 0
        ? stageDelays.reduce((sum, value) => sum + value, 0) / stageDelays.length
        : 0;
    const activeCampaignCount = campaigns.filter((item) => this.isActiveCampaign(item.status)).length;

    return {
      conversionRate,
      averageStageDelayDays,
      activeCampaignCount,
      retainedCount,
      totalApplications,
    };
  }

  private computeApplicationStageDelayDays(application: Application): number {
    const history = Array.isArray(application.statusHistory) ? [...application.statusHistory] : [];
    if (history.length < 2) {
      return 0;
    }

    history.sort((left, right) => this.parseDate(left.changedAt) - this.parseDate(right.changedAt));
    const firstTimestamp = this.parseDate(history[0]?.changedAt || '');
    const lastTimestamp = this.parseDate(history[history.length - 1]?.changedAt || '');
    if (firstTimestamp <= 0 || lastTimestamp <= 0 || lastTimestamp <= firstTimestamp) {
      return 0;
    }

    return (lastTimestamp - firstTimestamp) / 86400000;
  }

  private buildLeaveBalanceProgress(items: LeaveBalance[]): DashboardBalanceProgress[] {
    const palette = ['bg-primary', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger', 'bg-secondary'];
    return items.map((item, index) => ({
      type: item.type,
      allocated: item.allocated,
      consumed: item.consumed,
      remaining: item.remaining,
      percent: this.calculatePercent(item.consumed, item.allocated),
      barClass: palette[index % palette.length],
    }));
  }

  private buildActionItems(
    pendingRequests: DashboardPendingRequest[],
    onboarding: OnboardingItem[]
  ): DashboardActionItem[] {
    const fromPending = pendingRequests.map((request) => ({
      title: request.type,
      description: `${request.agent} - ${request.unit}`,
      status: request.status,
      dateLabel: this.toRelativeLabel(request.submittedAt),
      dateValue: request.submittedAt,
    }));

    const fromOnboarding = onboarding.map((item) => ({
      title: `Integration - ${item.agent}`,
      description: item.position,
      status: item.status,
      dateLabel: this.toRelativeLabel(item.startDate),
      dateValue: item.startDate,
    }));

    return [...fromPending, ...fromOnboarding]
      .sort((left, right) => this.parseDate(right.dateValue) - this.parseDate(left.dateValue))
      .slice(0, 8);
  }

  private buildTimelineItems(
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[],
    leaveRequests: LeaveRequest[],
    applications: Application[]
  ): DashboardTimelineItem[] {
    const items: DashboardTimelineItem[] = [
      ...dossiers.map((item) => ({
        title: 'Mise a jour dossier',
        description: `${item.reference} - ${item.agent} (${item.type})`,
        status: item.status,
        dateLabel: this.formatDateLabel(item.updatedAt),
        dateValue: item.updatedAt,
      })),
      ...affectations.map((item) => ({
        title: 'Affectation',
        description: `${item.agent} - ${item.fromUnit} vers ${item.toUnit}`,
        status: item.status,
        dateLabel: this.formatDateLabel(item.effectiveDate),
        dateValue: item.effectiveDate,
      })),
      ...leaveRequests.map((item) => ({
        title: 'Demande absence',
        description: `${item.reference} - ${item.agent} (${item.type})`,
        status: item.status,
        dateLabel: this.formatDateLabel(item.startDate),
        dateValue: item.startDate,
      })),
      ...applications.map((item) => ({
        title: 'Nouvelle candidature',
        description: `${item.reference} - ${item.candidate} (${item.position})`,
        status: item.status,
        dateLabel: this.formatDateLabel(item.receivedOn),
        dateValue: item.receivedOn,
      })),
    ];

    return items
      .sort((left, right) => this.parseDate(right.dateValue) - this.parseDate(left.dateValue))
      .slice(0, 10);
  }

  private sortVacancies(items: VacantPosition[]): VacantPosition[] {
    const priorityWeight: Record<string, number> = { haute: 0, normale: 1, basse: 2 };
    return [...items].sort((left, right) => {
      const leftWeight = priorityWeight[this.normalizeText(left.priority)] ?? 99;
      const rightWeight = priorityWeight[this.normalizeText(right.priority)] ?? 99;
      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }
      return this.parseDate(right.openedOn) - this.parseDate(left.openedOn);
    });
  }

  private sortCampaigns(items: Campaign[]): Campaign[] {
    return [...items].sort((left, right) => {
      const leftActive = this.isActiveCampaign(left.status) ? 0 : 1;
      const rightActive = this.isActiveCampaign(right.status) ? 0 : 1;
      if (leftActive !== rightActive) {
        return leftActive - rightActive;
      }
      return this.parseDate(right.startDate) - this.parseDate(left.startDate);
    });
  }

  private countByMonth(rawDates: string[]): number[] {
    const currentYearCounts = new Array(12).fill(0);
    const allYearCounts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    for (const rawDate of rawDates) {
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        continue;
      }
      allYearCounts[parsed.getMonth()] += 1;
      if (parsed.getFullYear() === currentYear) {
        currentYearCounts[parsed.getMonth()] += 1;
      }
    }

    return currentYearCounts.some((value) => value > 0) ? currentYearCounts : allYearCounts;
  }

  private buildActivityRateChart(rate: number): ApexOptions {
    return {
      series: [Number(rate.toFixed(1))],
      chart: {
        type: 'radialBar',
        height: 132,
        width: 132,
        sparkline: { enabled: true },
      },
      stroke: { lineCap: 'round' },
      labels: ['Taux activite'],
      colors: ['#38cab3'],
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 270,
          hollow: {
            size: '68%',
            background: '#fff',
          },
          track: {
            background: 'rgba(119, 119, 142, 0.15)',
          },
          dataLabels: {
            name: { show: false },
            value: {
              show: false,
              offsetY: 4,
              fontSize: '18px',
              fontWeight: 700,
              formatter: (value) => `${Math.round(value)}%`,
            },
          },
        },
      },
    };
  }

  private buildMonthlyFlowChart(
    leaveSeries: number[],
    dossierSeries: number[],
    applicationSeries: number[]
  ): ApexOptions {
    return {
      series: [
        { name: 'Demandes absences', data: leaveSeries },
        { name: 'Dossiers MAJ', data: dossierSeries },
        { name: 'Candidatures', data: applicationSeries },
      ],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: true },
      },
      colors: ['#38cab3', '#e4e7ed', '#f7b731'],
      grid: {
        borderColor: '#f2f6f7',
      },
      plotOptions: {
        bar: {
          colors: {
            ranges: [
              {
                from: -100,
                to: -46,
                color: '#ebeff5',
              },
              {
                from: -45,
                to: 0,
                color: '#ebeff5',
              },
            ],
          },
          columnWidth: '40%',
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 4,
        colors: ['transparent'],
      },
      xaxis: {
        type: 'category',
        categories: this.monthLabels,
        axisBorder: {
          show: true,
          color: 'rgba(119, 119, 142, 0.05)',
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          borderType: 'solid',
          color: 'rgba(119, 119, 142, 0.05)',
          offsetX: 0,
          offsetY: 0,
        },
      },
      yaxis: {
        title: {
          text: 'Volume',
          style: {
            color: '#adb5be',
            fontSize: '14px',
            fontFamily: 'poppins, sans-serif',
            fontWeight: 600,
            cssClass: 'apexcharts-yaxis-label',
          },
        },
        labels: {
          formatter: (value: number) => value.toFixed(0),
        },
      },
      legend: {
        show: true,
        position: 'top',
      },
      tooltip: {
        y: {
          formatter: (value) => `${Math.round(value)} element(s)`,
        },
      },
    };
  }

  formatDateLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value || '-';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  }

  toRelativeLabel(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '-';
    }

    const current = new Date();
    current.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);

    const differenceDays = Math.round((parsed.getTime() - current.getTime()) / 86400000);
    if (differenceDays === 0) {
      return "Aujourd'hui";
    }
    if (differenceDays > 0) {
      return `Dans ${differenceDays} j`;
    }
    return `Il y a ${Math.abs(differenceDays)} j`;
  }

  getStatusBadgeClass(status: string): string {
    const normalized = this.normalizeText(status);
    if (normalized.includes('attente') || normalized.includes('pending')) {
      return 'bg-warning-transparent text-warning';
    }
    if (
      normalized.includes('approuve') ||
      normalized.includes('actif') ||
      normalized.includes('effective') ||
      normalized.includes('ouvert') ||
      normalized.includes('en cours') ||
      normalized.includes('active')
    ) {
      return 'bg-success-transparent text-success';
    }
    if (normalized.includes('rejete') || normalized.includes('basse')) {
      return 'bg-danger-transparent text-danger';
    }
    return 'bg-info-transparent text-info';
  }

  getAgentInitials(fullName: string): string {
    const normalized = String(fullName || '').trim();
    if (!normalized) {
      return '--';
    }
    const parts = normalized.split(/\s+/).slice(0, 2);
    return parts.map((item) => item[0]?.toUpperCase() || '').join('');
  }

  private resolveDisplayName(rawName: string | null): string {
    const normalized = String(rawName || '').trim();
    if (!normalized) {
      return 'Utilisateur';
    }

    const fromEmail = normalized.includes('@') ? normalized.split('@')[0] : normalized;
    if (this.normalizeText(fromEmail) === 'spruko') {
      return 'DRH';
    }
    const readable = fromEmail.replace(/[._-]+/g, ' ').trim();
    return readable
      .split(/\s+/)
      .filter((part) => !!part)
      .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private isActiveCampaign(status: string): boolean {
    const normalized = this.normalizeText(status);
    return normalized.includes('active') || normalized.includes('ouverte') || normalized.includes('ouvert');
  }

  private calculatePercent(numerator: number, denominator: number): number {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
      return 0;
    }
    return (numerator / denominator) * 100;
  }

  private formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-FR').format(value || 0);
  }

  private normalizeText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private parseDate(value: string): number {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private safeStream<T>(stream: Observable<T>, fallback: T): Observable<T> {
    return stream.pipe(catchError(() => of(fallback)));
  }
}
