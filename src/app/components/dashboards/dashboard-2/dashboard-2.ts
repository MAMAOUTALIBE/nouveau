import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import {
  DashboardPendingRequest,
  DashboardService,
  DashboardSummary,
} from '../../../modules/dashboard/services/dashboard.service';
import { LeaveRequest, LeaveService } from '../../../modules/leave/leave.service';
import {
  AgentListItem,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
} from '../../../modules/personnel/personnel.service';
import {
  Application,
  OnboardingItem,
  RecruitmentService,
} from '../../../modules/recruitment/recruitment.service';
import { OrganizationService, VacantPosition } from '../../../modules/organization/organization.service';
import { AuthService } from '../../../shared/services/auth.service';

interface Dashboard2MetricCard {
  title: string;
  value: string;
  badge: string;
  badgeClass: string;
  icon: string;
  iconBg: string;
}

interface Dashboard2TimelineItem {
  name: string;
  description: string;
  date: string;
  iconClass: string;
  iconState: string;
}

interface Dashboard2StatusItem {
  label: string;
  value: string;
  percentage: string;
  trendIcon: string;
  trendColor: string;
  progressBarColor: string;
  progressWidth: string;
}

interface Dashboard2TaskItem {
  label: string;
  checked: boolean;
  badgeText?: string;
  badgeColor?: string;
}

interface Dashboard2FlowItem {
  name: string;
  date: string;
  status: string;
  amount: string;
  amountClass: string;
  bgClass: string;
  textClass: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard-2',
  imports: [CommonModule, RouterLink, NgApexchartsModule, SpkApexcharts],
  templateUrl: './dashboard-2.html',
  styleUrl: './dashboard-2.scss',
})
export class Dashboard2 implements OnInit {
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

  cards: Dashboard2MetricCard[] = [];
  timelineEvents: Dashboard2TimelineItem[] = [];
  workflowStatusItems: Dashboard2StatusItem[] = [];
  checklistItems: Dashboard2TaskItem[] = [];
  recentFlows: Dashboard2FlowItem[] = [];
  recentAgents: AgentListItem[] = [];
  queueRows = signal<DashboardPendingRequest[]>([]);
  searchTerm = signal('');

  filteredRows = computed(() => {
    const query = this.normalizeText(this.searchTerm());
    if (!query) {
      return this.queueRows();
    }

    return this.queueRows().filter((row) =>
      [row.reference, row.agent, row.type, row.unit, row.status]
        .some((value) => this.normalizeText(value).includes(query))
    );
  });

  operationsTrendChart: ApexOptions = this.buildOperationsTrendChart([], [], []);
  weeklyLoadChart: ApexOptions = this.buildWeeklyLoadChart([], [], []);
  serviceMixChart: ApexOptions = this.buildServiceMixChart([0, 0, 0, 0]);

  ngOnInit(): void {
    this.userDisplayName = this.resolveDisplayName(this.authService.currentUserName());
    this.loadDashboard();
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    this.searchTerm.set(String(target?.value || ''));
  }

  getStatusBadgeClass(status: string): string {
    const normalized = this.normalizeText(status);
    if (normalized.includes('attente') || normalized.includes('pending')) {
      return 'bg-warning-transparent text-warning';
    }
    if (
      normalized.includes('approuve') ||
      normalized.includes('actif') ||
      normalized.includes('termine') ||
      normalized.includes('effectif') ||
      normalized.includes('en cours')
    ) {
      return 'bg-success-transparent text-success';
    }
    if (normalized.includes('rejete') || normalized.includes('bloque')) {
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

  private loadDashboard(): void {
    const emptySummary: DashboardSummary = {
      headcount: 0,
      active: 0,
      absences: 0,
      vacancies: 0,
      departures: 0,
    };

    forkJoin({
      summary: this.safeStream(this.dashboardService.getSummary(), emptySummary),
      pendingRequests: this.safeStream(this.dashboardService.getPendingRequests(), [] as DashboardPendingRequest[]),
      dossiers: this.safeStream(
        this.personnelService.getDossiers({ limit: 120, sortBy: 'updatedAt', sortOrder: 'desc' }),
        [] as PersonnelDossier[]
      ),
      affectations: this.safeStream(
        this.personnelService.getAffectations({ limit: 120, sortBy: 'effectiveDate', sortOrder: 'desc' }),
        [] as PersonnelAffectation[]
      ),
      leaveRequests: this.safeStream(
        this.leaveService.getRequests({ limit: 200, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as LeaveRequest[]
      ),
      applications: this.safeStream(
        this.recruitmentService.getApplications({ limit: 200, sortBy: 'receivedOn', sortOrder: 'desc' }),
        [] as Application[]
      ),
      onboarding: this.safeStream(
        this.recruitmentService.getOnboarding({ limit: 100, sortBy: 'startDate', sortOrder: 'desc' }),
        [] as OnboardingItem[]
      ),
      agents: this.safeStream(
        this.personnelService.getAgents({ limit: 8, sortBy: 'id', sortOrder: 'desc' }),
        [] as AgentListItem[]
      ),
      vacancies: this.safeStream(
        this.organizationService.getVacantPositions({ limit: 100, sortBy: 'openedOn', sortOrder: 'desc' }),
        [] as VacantPosition[]
      ),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.cards = this.buildMetricCards(
            result.summary,
            result.pendingRequests,
            result.dossiers,
            result.onboarding,
            result.vacancies
          );
          this.timelineEvents = this.buildTimelineEvents(
            result.pendingRequests,
            result.affectations,
            result.onboarding,
            result.applications
          );
          this.workflowStatusItems = this.buildWorkflowStatusItems(
            result.pendingRequests,
            result.dossiers,
            result.affectations,
            result.onboarding
          );
          this.checklistItems = this.buildChecklistItems(
            result.pendingRequests,
            result.leaveRequests,
            result.onboarding,
            result.vacancies
          );
          this.recentFlows = this.buildRecentFlows(
            result.pendingRequests,
            result.dossiers,
            result.affectations,
            result.onboarding
          );
          this.recentAgents = [...result.agents].slice(0, 6);
          this.queueRows.set([...result.pendingRequests].slice(0, 12));
          this.operationsTrendChart = this.buildOperationsTrendChart(
            this.countByMonth(result.pendingRequests.map((item) => item.submittedAt)),
            this.countByMonth(result.dossiers.map((item) => item.updatedAt)),
            this.countByMonth(result.applications.map((item) => item.receivedOn))
          );
          this.weeklyLoadChart = this.buildWeeklyLoadChart(
            this.countLastSevenDays(result.leaveRequests.map((item) => item.startDate)),
            this.countLastSevenDays(result.affectations.map((item) => item.effectiveDate)),
            this.countLastSevenDays(result.onboarding.map((item) => item.startDate))
          );
          this.serviceMixChart = this.buildServiceMixChart([
            result.pendingRequests.length,
            result.leaveRequests.length,
            result.affectations.length,
            result.onboarding.length,
          ]);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Impossible de charger la vue operationnelle pour le moment.';
        },
      });
  }

  private buildMetricCards(
    summary: DashboardSummary,
    pendingRequests: DashboardPendingRequest[],
    dossiers: PersonnelDossier[],
    onboarding: OnboardingItem[],
    vacancies: VacantPosition[]
  ): Dashboard2MetricCard[] {
    const onboardingInProgress = onboarding.filter((item) =>
      this.normalizeText(item.status).includes('cours') || this.normalizeText(item.status).includes('planifie')
    ).length;
    const criticalVacancies = vacancies.filter((item) => this.normalizeText(item.priority).includes('haute')).length;

    return [
      {
        title: 'Demandes a arbitrer',
        value: this.formatNumber(pendingRequests.length),
        badge: `${this.formatNumber(summary.absences)} absences en cours`,
        badgeClass: 'bg-warning-transparent text-warning',
        icon: 'clipboard',
        iconBg: 'warning',
      },
      {
        title: 'Dossiers admin',
        value: this.formatNumber(dossiers.length),
        badge: 'Flux dossiers a jour',
        badgeClass: 'bg-primary-transparent text-primary',
        icon: 'file-text',
        iconBg: 'primary',
      },
      {
        title: 'Integrations actives',
        value: this.formatNumber(onboardingInProgress),
        badge: `${this.formatNumber(onboarding.length)} parcours suivis`,
        badgeClass: 'bg-success-transparent text-success',
        icon: 'user-plus',
        iconBg: 'success',
      },
      {
        title: 'Postes critiques',
        value: this.formatNumber(criticalVacancies),
        badge: `${this.formatNumber(vacancies.length)} postes vacants`,
        badgeClass: 'bg-danger-transparent text-danger',
        icon: 'briefcase',
        iconBg: 'danger',
      },
    ];
  }

  private buildTimelineEvents(
    pendingRequests: DashboardPendingRequest[],
    affectations: PersonnelAffectation[],
    onboarding: OnboardingItem[],
    applications: Application[]
  ): Dashboard2TimelineItem[] {
    const items = [
      ...pendingRequests.map((item) => ({
        name: item.type,
        description: `${item.agent} - ${item.unit}`,
        date: item.submittedAt,
        iconClass: 'bg-warning-transparent text-warning timeline-badge',
        iconState: 'clock',
      })),
      ...affectations.map((item) => ({
        name: 'Affectation',
        description: `${item.agent} : ${item.fromUnit} vers ${item.toUnit}`,
        date: item.effectiveDate,
        iconClass: 'bg-primary-transparent text-primary timeline-badge',
        iconState: 'shuffle',
      })),
      ...onboarding.map((item) => ({
        name: 'Integration',
        description: `${item.agent} - ${item.position}`,
        date: item.startDate,
        iconClass: 'bg-success-transparent text-success timeline-badge',
        iconState: 'check',
      })),
      ...applications.map((item) => ({
        name: 'Candidature',
        description: `${item.candidate} - ${item.position}`,
        date: item.receivedOn,
        iconClass: 'bg-info-transparent text-info timeline-badge',
        iconState: 'user',
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

  private buildWorkflowStatusItems(
    pendingRequests: DashboardPendingRequest[],
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[],
    onboarding: OnboardingItem[]
  ): Dashboard2StatusItem[] {
    const values = [
      { label: 'Validation des demandes', count: pendingRequests.length, color: 'bg-warning', trendColor: 'text-warning', trendIcon: 'bx bx-time' },
      { label: 'Mises a jour dossiers', count: dossiers.length, color: 'bg-primary', trendColor: 'text-primary', trendIcon: 'bx bx-folder' },
      { label: 'Mobilites planifiees', count: affectations.length, color: 'bg-info', trendColor: 'text-info', trendIcon: 'bx bx-transfer' },
      { label: 'Parcours integration', count: onboarding.length, color: 'bg-success', trendColor: 'text-success', trendIcon: 'bx bx-check-circle' },
    ];
    const total = values.reduce((sum, item) => sum + item.count, 0);

    return values.map((item) => ({
      label: item.label,
      value: this.formatNumber(item.count),
      percentage: `${Math.round(this.calculatePercent(item.count, total))}%`,
      trendIcon: item.trendIcon,
      trendColor: item.trendColor,
      progressBarColor: item.color,
      progressWidth: `${Math.max(8, Math.round(this.calculatePercent(item.count, total)))}%`,
    }));
  }

  private buildChecklistItems(
    pendingRequests: DashboardPendingRequest[],
    leaveRequests: LeaveRequest[],
    onboarding: OnboardingItem[],
    vacancies: VacantPosition[]
  ): Dashboard2TaskItem[] {
    const approvedLeaves = leaveRequests.filter((item) =>
      this.normalizeText(item.status).includes('approuve')
    ).length;
    const blockedOnboarding = onboarding.filter((item) =>
      this.normalizeText(item.status).includes('bloque')
    ).length;
    const criticalVacancies = vacancies.filter((item) =>
      this.normalizeText(item.priority).includes('haute')
    ).length;

    return [
      {
        label: `${this.formatNumber(pendingRequests.length)} validations manager a traiter`,
        checked: pendingRequests.length === 0,
        badgeText: "Aujourd'hui",
        badgeColor: 'warning-transparent',
      },
      {
        label: `${this.formatNumber(approvedLeaves)} demandes d'absence deja securisees`,
        checked: approvedLeaves > 0,
        badgeText: 'Cette semaine',
        badgeColor: 'success-transparent',
      },
      {
        label: `${this.formatNumber(blockedOnboarding)} integrations a debloquer`,
        checked: blockedOnboarding === 0,
        badgeText: 'RH + managers',
        badgeColor: 'danger-transparent',
      },
      {
        label: `${this.formatNumber(criticalVacancies)} postes critiques a publier`,
        checked: criticalVacancies === 0,
        badgeText: 'Priorite haute',
        badgeColor: 'primary-transparent',
      },
    ];
  }

  private buildRecentFlows(
    pendingRequests: DashboardPendingRequest[],
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[],
    onboarding: OnboardingItem[]
  ): Dashboard2FlowItem[] {
    const items = [
      ...pendingRequests.map((item) => ({
        name: item.type,
        date: item.submittedAt,
        status: item.status,
        amount: item.agent,
        amountClass: 'text-dark',
        bgClass: 'bg-warning-transparent',
        textClass: 'text-warning',
        icon: 'fe fe-clock',
      })),
      ...dossiers.map((item) => ({
        name: item.type,
        date: item.updatedAt,
        status: item.status,
        amount: item.agent,
        amountClass: 'text-dark',
        bgClass: 'bg-primary-transparent',
        textClass: 'text-primary',
        icon: 'fe fe-file-text',
      })),
      ...affectations.map((item) => ({
        name: 'Affectation',
        date: item.effectiveDate,
        status: item.status,
        amount: item.agent,
        amountClass: 'text-dark',
        bgClass: 'bg-info-transparent',
        textClass: 'text-info',
        icon: 'fe fe-repeat',
      })),
      ...onboarding.map((item) => ({
        name: 'Integration',
        date: item.startDate,
        status: item.status,
        amount: item.agent,
        amountClass: 'text-dark',
        bgClass: 'bg-success-transparent',
        textClass: 'text-success',
        icon: 'fe fe-user-plus',
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

  private buildOperationsTrendChart(
    pendingSeries: number[],
    dossierSeries: number[],
    applicationSeries: number[]
  ): ApexOptions {
    return {
      series: [
        { name: 'Demandes', data: pendingSeries },
        { name: 'Dossiers', data: dossierSeries },
        { name: 'Candidatures', data: applicationSeries },
      ],
      chart: {
        height: 280,
        type: 'line',
        zoom: { enabled: false },
        toolbar: { show: false },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      grid: { borderColor: '#f2f6f7' },
      colors: ['var(--primary-color)', '#38cab3', '#f7b731'],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
      },
      xaxis: {
        categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'],
        axisBorder: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
        axisTicks: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
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
    };
  }

  private buildWeeklyLoadChart(
    leaveSeries: number[],
    affectationSeries: number[],
    onboardingSeries: number[]
  ): ApexOptions {
    const labels = this.lastSevenDayLabels();
    return {
      series: [
        { name: 'Absences', data: leaveSeries },
        { name: 'Affectations', data: affectationSeries },
        { name: 'Integrations', data: onboardingSeries },
      ],
      chart: {
        height: 260,
        type: 'bar',
        stacked: true,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '28%',
        },
      },
      dataLabels: { enabled: false },
      colors: ['var(--primary-color)', '#38cab3', '#f7b731'],
      grid: { borderColor: '#f2f6f7' },
      legend: { position: 'top' },
      xaxis: {
        categories: labels,
        axisBorder: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
        axisTicks: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => value.toFixed(0),
        },
      },
    };
  }

  private buildServiceMixChart(series: number[]): ApexOptions {
    return {
      series: [{ name: 'Flux', data: series }],
      chart: {
        height: 260,
        type: 'bar',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '42%',
          distributed: true,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      colors: ['#6259ca', '#38cab3', '#f7b731', '#f74f75'],
      xaxis: {
        categories: ['Demandes', 'Conges', 'Mobilites', 'Integration'],
        axisBorder: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
        axisTicks: { show: true, color: 'rgba(119, 119, 142, 0.05)' },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => value.toFixed(0),
        },
      },
      grid: { borderColor: '#f2f6f7' },
    };
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
