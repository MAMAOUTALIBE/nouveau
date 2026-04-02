import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import {
  DashboardService,
  DashboardSummary,
} from '../../../modules/dashboard/services/dashboard.service';
import { LeaveBalance, LeaveRequest, LeaveService } from '../../../modules/leave/leave.service';
import { BudgetedPosition, OrganizationService, VacantPosition } from '../../../modules/organization/organization.service';
import { AgentListItem, PersonnelService } from '../../../modules/personnel/personnel.service';
import {
  Application,
  Campaign,
  OnboardingItem,
  RecruitmentService,
} from '../../../modules/recruitment/recruitment.service';
import { AuthService } from '../../../shared/services/auth.service';

interface Dashboard3MetricCard {
  title: string;
  value: string;
  subtitle: string;
  detail: string;
  icon: string;
  iconBg: string;
  badgeClass: string;
}

interface Dashboard3Initiative {
  title: string;
  value: string;
  percent: string;
  lastMonthLabel: string;
  daysAgo: string;
  trend: 'up' | 'down';
}

interface Dashboard3TimelineItem {
  name: string;
  description: string;
  date: string;
  iconClass: string;
  iconState: string;
}

interface Dashboard3TaskItem {
  label: string;
  checked: boolean;
  badgeText?: string;
  badgeColor?: string;
}

interface Dashboard3StructureItem {
  structure: string;
  value: string;
  percentage: string;
  trendIcon: string;
  trendColor: string;
  progressBarColor: string;
  progressWidth: string;
  progressStriped: string;
}

@Component({
  selector: 'app-dashboard-3',
  imports: [CommonModule, RouterLink, NgApexchartsModule, SpkApexcharts],
  templateUrl: './dashboard-3.html',
  styleUrl: './dashboard-3.scss',
})
export class Dashboard3 implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(DashboardService);
  private readonly personnelService = inject(PersonnelService);
  private readonly leaveService = inject(LeaveService);
  private readonly organizationService = inject(OrganizationService);
  private readonly recruitmentService = inject(RecruitmentService);

  loading = true;
  errorMessage = '';
  userDisplayName = 'Utilisateur';
  activityRate = 0;

  cards: Dashboard3MetricCard[] = [];
  recentAgents: AgentListItem[] = [];
  strategicInitiatives: Dashboard3Initiative[] = [];
  timelineEvents: Dashboard3TimelineItem[] = [];
  checklistItems: Dashboard3TaskItem[] = [];
  structureItems: Dashboard3StructureItem[] = [];
  campaignRows = signal<Campaign[]>([]);
  searchTerm = signal('');

  filteredCampaigns = computed(() => {
    const query = this.normalizeText(this.searchTerm());
    if (!query) {
      return this.campaignRows();
    }

    return this.campaignRows().filter((campaign) =>
      [campaign.code, campaign.title, campaign.department, campaign.status]
        .some((value) => this.normalizeText(value).includes(query))
    );
  });

  structureBalanceChart: ApexOptions = this.buildStructureBalanceChart([], [], []);
  weeklyPilotageChart: ApexOptions = this.buildWeeklyPilotageChart([], [], []);

  ngOnInit(): void {
    this.userDisplayName = this.resolveDisplayName(this.authService.currentUserName());
    this.loadDashboard();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(String(target?.value || ''));
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

  getStatusBadgeClass(status: string): string {
    const normalized = this.normalizeText(status);
    if (normalized.includes('attente') || normalized.includes('pending')) {
      return 'bg-warning-transparent text-warning';
    }
    if (
      normalized.includes('active') ||
      normalized.includes('actif') ||
      normalized.includes('ouverte') ||
      normalized.includes('ouvert') ||
      normalized.includes('approuve')
    ) {
      return 'bg-success-transparent text-success';
    }
    if (normalized.includes('bloque') || normalized.includes('rejete') || normalized.includes('basse')) {
      return 'bg-danger-transparent text-danger';
    }
    return 'bg-info-transparent text-info';
  }

  getAgentInitials(fullName: string): string {
    const normalized = String(fullName || '').trim();
    if (!normalized) {
      return '--';
    }
    return normalized
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  private loadDashboard(): void {
    const emptySummary: DashboardSummary = {
      headcount: 0,
      active: 0,
      absences: 0,
      vacancies: 0,
    };

    forkJoin({
      summary: this.safeStream(this.dashboardService.getSummary(), emptySummary),
      agents: this.safeStream(
        this.personnelService.getAgents({ limit: 8, sortBy: 'id', sortOrder: 'desc' }),
        [] as AgentListItem[]
      ),
      leaveBalances: this.safeStream(this.leaveService.getBalances({ limit: 50 }), [] as LeaveBalance[]),
      leaveRequests: this.safeStream(
        this.leaveService.getRequests({ limit: 200, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as LeaveRequest[]
      ),
      budgetedPositions: this.safeStream(
        this.organizationService.getBudgetedPositions({ limit: 200, sortBy: 'code', sortOrder: 'asc' }),
        [] as BudgetedPosition[]
      ),
      vacancies: this.safeStream(
        this.organizationService.getVacantPositions({ limit: 200, sortBy: 'openedOn', sortOrder: 'desc' }),
        [] as VacantPosition[]
      ),
      campaigns: this.safeStream(
        this.recruitmentService.getCampaigns({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as Campaign[]
      ),
      applications: this.safeStream(
        this.recruitmentService.getApplications({ limit: 200, sortBy: 'receivedOn', sortOrder: 'desc' }),
        [] as Application[]
      ),
      onboarding: this.safeStream(
        this.recruitmentService.getOnboarding({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as OnboardingItem[]
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.activityRate = this.calculatePercent(result.summary.active, result.summary.headcount);
          this.cards = this.buildMetricCards(
            result.summary,
            result.budgetedPositions,
            result.vacancies,
            result.campaigns,
            result.applications
          );
          this.recentAgents = [...result.agents].slice(0, 6);
          this.strategicInitiatives = this.buildStrategicInitiatives(result.campaigns, result.vacancies);
          this.timelineEvents = this.buildTimelineEvents(
            result.vacancies,
            result.campaigns,
            result.applications,
            result.onboarding
          );
          this.checklistItems = this.buildChecklistItems(
            result.vacancies,
            result.campaigns,
            result.applications,
            result.leaveBalances
          );
          this.structureItems = this.buildStructureItems(result.vacancies);
          this.campaignRows.set(this.sortCampaigns(result.campaigns).slice(0, 12));
          this.structureBalanceChart = this.buildTopStructureChart(result.budgetedPositions, result.vacancies);
          this.weeklyPilotageChart = this.buildWeeklyPilotageChart(
            this.countLastSevenDays(result.applications.map((item) => item.receivedOn)),
            this.countLastSevenDays(result.onboarding.map((item) => item.startDate)),
            this.countLastSevenDays(result.leaveRequests.map((item) => item.startDate))
          );
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Impossible de charger la vue pilotage pour le moment.';
        },
      });
  }

  private buildMetricCards(
    summary: DashboardSummary,
    budgetedPositions: BudgetedPosition[],
    vacancies: VacantPosition[],
    campaigns: Campaign[],
    applications: Application[]
  ): Dashboard3MetricCard[] {
    const activeCampaigns = campaigns.filter((item) => this.isActiveCampaign(item.status)).length;
    const occupiedPositions = budgetedPositions.filter((item) => !this.normalizeText(item.status).includes('ouvert')).length;
    const coverageRate = this.calculatePercent(occupiedPositions, budgetedPositions.length);

    return [
      {
        title: 'Effectif total',
        value: this.formatNumber(summary.headcount),
        subtitle: 'Agents actifs',
        detail: this.formatNumber(summary.active),
        icon: 'users',
        iconBg: 'primary',
        badgeClass: 'bg-primary-transparent text-primary',
      },
      {
        title: 'Taux activite',
        value: `${Math.round(this.activityRate)}%`,
        subtitle: 'Absences en cours',
        detail: this.formatNumber(summary.absences),
        icon: 'activity',
        iconBg: 'success',
        badgeClass: 'bg-success-transparent text-success',
      },
      {
        title: 'Campagnes actives',
        value: this.formatNumber(activeCampaigns),
        subtitle: 'Candidatures recues',
        detail: this.formatNumber(applications.length),
        icon: 'briefcase',
        iconBg: 'info',
        badgeClass: 'bg-info-transparent text-info',
      },
      {
        title: 'Couverture postes',
        value: `${Math.round(coverageRate)}%`,
        subtitle: 'Postes vacants',
        detail: this.formatNumber(vacancies.length),
        icon: 'layers',
        iconBg: 'warning',
        badgeClass: 'bg-warning-transparent text-warning',
      },
    ];
  }

  private buildStrategicInitiatives(
    campaigns: Campaign[],
    vacancies: VacantPosition[]
  ): Dashboard3Initiative[] {
    const vacancyByStructure = this.groupVacanciesByStructure(vacancies);

    return this.sortCampaigns(campaigns)
      .slice(0, 4)
      .map((campaign) => ({
        title: campaign.title,
        value: `${campaign.openings} postes`,
        percent: `${vacancyByStructure.get(campaign.department) || 0} vacants`,
        lastMonthLabel: campaign.department,
        daysAgo: `Echeance ${this.formatDateLabel(campaign.endDate)}`,
        trend: this.isActiveCampaign(campaign.status) ? 'up' : 'down',
      }));
  }

  private buildTimelineEvents(
    vacancies: VacantPosition[],
    campaigns: Campaign[],
    applications: Application[],
    onboarding: OnboardingItem[]
  ): Dashboard3TimelineItem[] {
    const items = [
      ...vacancies.map((item) => ({
        name: 'Poste vacant',
        description: `${item.title} - ${item.structure}`,
        date: item.openedOn,
        iconClass: 'bg-danger-transparent text-danger timeline-badge',
        iconState: 'briefcase',
      })),
      ...campaigns.map((item) => ({
        name: 'Campagne',
        description: `${item.title} - ${item.department}`,
        date: item.startDate,
        iconClass: 'bg-primary-transparent text-primary timeline-badge',
        iconState: 'flag',
      })),
      ...applications.map((item) => ({
        name: 'Candidature',
        description: `${item.candidate} - ${item.position}`,
        date: item.receivedOn,
        iconClass: 'bg-info-transparent text-info timeline-badge',
        iconState: 'user',
      })),
      ...onboarding.map((item) => ({
        name: 'Integration',
        description: `${item.agent} - ${item.position}`,
        date: item.startDate,
        iconClass: 'bg-success-transparent text-success timeline-badge',
        iconState: 'check',
      })),
    ];

    return items
      .sort((left, right) => this.parseDate(right.date) - this.parseDate(left.date))
      .slice(0, 6)
      .map((item) => ({
        ...item,
        date: this.formatDateLabel(item.date),
      }));
  }

  private buildChecklistItems(
    vacancies: VacantPosition[],
    campaigns: Campaign[],
    applications: Application[],
    leaveBalances: LeaveBalance[]
  ): Dashboard3TaskItem[] {
    const criticalVacancies = vacancies.filter((item) => this.normalizeText(item.priority).includes('haute')).length;
    const activeCampaigns = campaigns.filter((item) => this.isActiveCampaign(item.status)).length;
    const retainedApplications = applications.filter((item) =>
      this.normalizeText(item.status).includes('retenu')
    ).length;
    const constrainedBalances = leaveBalances.filter((item) => item.remaining <= Math.max(2, item.allocated * 0.15)).length;

    return [
      {
        label: `${this.formatNumber(criticalVacancies)} postes a arbitrer en priorite haute`,
        checked: criticalVacancies === 0,
        badgeText: 'Organisation',
        badgeColor: 'danger-transparent',
      },
      {
        label: `${this.formatNumber(activeCampaigns)} campagnes a tenir jusqu'au closing`,
        checked: activeCampaigns > 0,
        badgeText: 'Recrutement',
        badgeColor: 'primary-transparent',
      },
      {
        label: `${this.formatNumber(retainedApplications)} candidatures retenues a convertir`,
        checked: retainedApplications > 0,
        badgeText: 'Pipeline',
        badgeColor: 'success-transparent',
      },
      {
        label: `${this.formatNumber(constrainedBalances)} soldes de conges sous surveillance`,
        checked: constrainedBalances === 0,
        badgeText: 'Absences',
        badgeColor: 'warning-transparent',
      },
    ];
  }

  private buildStructureItems(vacancies: VacantPosition[]): Dashboard3StructureItem[] {
    const groups = this.groupVacanciesByStructure(vacancies);
    const total = Math.max(vacancies.length, 1);

    return [...groups.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([structure, count], index) => ({
        structure,
        value: this.formatNumber(count),
        percentage: `${Math.round(this.calculatePercent(count, total))}%`,
        trendIcon: 'bx bx-trending-up',
        trendColor: 'text-danger',
        progressBarColor: ['bg-danger', 'bg-warning', 'bg-primary', 'bg-info', 'bg-success'][index % 5],
        progressWidth: `${Math.max(8, Math.round(this.calculatePercent(count, total)))}%`,
        progressStriped: 'progress-bar-striped',
      }));
  }

  private buildTopStructureChart(
    budgetedPositions: BudgetedPosition[],
    vacancies: VacantPosition[]
  ): ApexOptions {
    const structureOrder = new Map<string, number>();

    for (const item of budgetedPositions) {
      structureOrder.set(item.structure, (structureOrder.get(item.structure) || 0) + 1);
    }
    for (const item of vacancies) {
      structureOrder.set(item.structure, (structureOrder.get(item.structure) || 0) + 1);
    }

    const categories = [...structureOrder.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([structure]) => structure);

    const occupiedSeries = categories.map((structure) =>
      budgetedPositions.filter(
        (item) =>
          item.structure === structure &&
          !this.normalizeText(item.status).includes('ouvert')
      ).length
    );
    const vacantSeries = categories.map((structure) =>
      vacancies.filter((item) => item.structure === structure).length
    );

    return this.buildStructureBalanceChart(categories, occupiedSeries, vacantSeries);
  }

  private buildStructureBalanceChart(
    categories: string[],
    occupiedSeries: number[],
    vacantSeries: number[]
  ): ApexOptions {
    return {
      series: [
        { name: 'Postes pourvus', data: occupiedSeries },
        { name: 'Postes vacants', data: vacantSeries },
      ],
      chart: {
        type: 'bar',
        height: 345,
        stacked: true,
        toolbar: { show: false },
      },
      colors: ['var(--primary-color)', '#f74f75'],
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '36%',
        },
      },
      dataLabels: { enabled: false },
      legend: { show: true, position: 'top' },
      grid: { borderColor: '#f2f6f7' },
      xaxis: {
        categories,
        axisBorder: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
        axisTicks: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
      },
      yaxis: {
        title: {
          text: 'Postes',
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
    };
  }

  private buildWeeklyPilotageChart(
    applicationsSeries: number[],
    onboardingSeries: number[],
    leaveSeries: number[]
  ): ApexOptions {
    return {
      series: [
        { name: 'Candidatures', data: applicationsSeries },
        { name: 'Integrations', data: onboardingSeries },
        { name: 'Absences', data: leaveSeries },
      ],
      chart: {
        type: 'bar',
        stacked: true,
        height: 338,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '30%',
        },
      },
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      colors: ['var(--primary-color)', '#38cab3', '#f7b731'],
      grid: { borderColor: '#eff2f6' },
      xaxis: {
        categories: this.lastSevenDayLabels(),
        axisBorder: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
        axisTicks: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
      },
      legend: {
        position: 'top',
      },
      yaxis: {
        labels: {
          formatter: (value: number) => value.toFixed(0),
        },
      },
    };
  }

  private countLastSevenDays(rawDates: string[]): number[] {
    const keys = this.lastSevenDayKeys();
    const buckets = new Map<string, number>(keys.map((key) => [key, 0]));

    for (const rawDate of rawDates) {
      const parsed = new Date(rawDate);
      if (Number.isNaN(parsed.getTime())) {
        continue;
      }
      const key = this.toDateKey(parsed);
      if (buckets.has(key)) {
        buckets.set(key, (buckets.get(key) || 0) + 1);
      }
    }

    return keys.map((key) => buckets.get(key) || 0);
  }

  private lastSevenDayLabels(): string[] {
    const formatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
    const labels: string[] = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - index);
      labels.push(formatter.format(current));
    }

    return labels;
  }

  private lastSevenDayKeys(): string[] {
    const keys: string[] = [];
    const today = new Date();

    for (let index = 6; index >= 0; index -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - index);
      keys.push(this.toDateKey(current));
    }

    return keys;
  }

  private toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private groupVacanciesByStructure(vacancies: VacantPosition[]): Map<string, number> {
    return vacancies.reduce((map, item) => {
      map.set(item.structure, (map.get(item.structure) || 0) + 1);
      return map;
    }, new Map<string, number>());
  }

  private sortCampaigns(campaigns: Campaign[]): Campaign[] {
    return [...campaigns].sort((left, right) => {
      const leftActive = this.isActiveCampaign(left.status) ? 0 : 1;
      const rightActive = this.isActiveCampaign(right.status) ? 0 : 1;
      if (leftActive !== rightActive) {
        return leftActive - rightActive;
      }
      return this.parseDate(right.startDate) - this.parseDate(left.startDate);
    });
  }

  private isActiveCampaign(status: string): boolean {
    const normalized = this.normalizeText(status);
    return normalized.includes('active') || normalized.includes('ouverte') || normalized.includes('ouvert');
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

    return fromEmail
      .replace(/[._-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((part) => !!part)
      .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private calculatePercent(numerator: number, denominator: number): number {
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
      return 0;
    }
    return (numerator / denominator) * 100;
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
