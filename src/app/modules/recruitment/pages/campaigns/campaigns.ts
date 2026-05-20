import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  RECRUITMENT_CAMPAIGN_GRID_COLUMNS,
  buildRecruitmentCampaignGridRows,
} from './campaigns-grid.utils';
import {
  Application,
  Campaign,
  CreateCampaignPayload,
  RecruitmentBiExportLogEntry,
  RecruitmentCampaignBudgetAnalyticsEntry,
  RecruitmentControlTowerItem,
  RecruitmentControlTowerResponse,
  RecruitmentExecutiveDashboardResponse,
  RecruitmentObservabilitySnapshot,
  RecruitmentApplicationStatus,
  RecruitmentRuleEngineRule,
  RecruitmentRuleEngineSimulationResult,
  RecruitmentRuleExecutionEntry,
  RecruitmentWorkloadForecastEntry,
  RecruitmentService
} from '../../recruitment.service';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './campaigns.html',
})
export class CampaignsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private accessControl = inject(AccessControlService);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  items: Campaign[] = [];
  applications: Application[] = [];
  showCreateForm = false;
  submitting = false;
  selectedFunnelCampaign = 'all';
  funnelCampaignOptions: string[] = [];
  funnelVolumes: Array<{
    status: RecruitmentApplicationStatus;
    count: number;
    ratio: number;
    badgeClass: string;
    barClass: string;
  }> = [];
  funnelConversions: Array<{
    from: RecruitmentApplicationStatus;
    to: RecruitmentApplicationStatus;
    countFrom: number;
    countTo: number;
    rate: number;
  }> = [];
  funnelScopeTotal = 0;
  operationalKpis = {
    averageProcessingDays: 0,
    processedCount: 0,
    retainedCount: 0,
    rejectedCount: 0,
    retainedRate: 0,
    rejectedRate: 0,
  };
  weeklyVolumes: Array<{
    weekKey: string;
    label: string;
    count: number;
    width: number;
  }> = [];
  workloadGeneratedAt = '';
  workloadForecast: RecruitmentWorkloadForecastEntry[] = [];
  budgetsGeneratedAt = '';
  campaignBudgetItems: RecruitmentCampaignBudgetAnalyticsEntry[] = [];
  selectedBudgetCampaignCode = '';
  budgetSubmitting = false;
  controlTower: RecruitmentControlTowerResponse = {
    summary: {
      totalApplications: 0,
      interviewsPlanned: 0,
      onboardingActive: 0,
      retained: 0,
    },
    items: [],
  };
  controlTowerCampaign = '';
  controlTowerStatus = '';
  controlTowerSearch = '';
  executiveDashboard: RecruitmentExecutiveDashboardResponse | null = null;
  executiveExporting = false;
  ruleEngineRules: RecruitmentRuleEngineRule[] = [];
  ruleExecutions: RecruitmentRuleExecutionEntry[] = [];
  ruleSimulation: RecruitmentRuleEngineSimulationResult | null = null;
  ruleSubmitting = false;
  ruleSimulating = false;
  biExportLogs: RecruitmentBiExportLogEntry[] = [];
  biExporting = false;
  observability: RecruitmentObservabilitySnapshot | null = null;
  observabilityEventSubmitting = false;

  private readonly funnelStages: RecruitmentApplicationStatus[] = [
    'Nouveau',
    'Preselection',
    'Entretien',
    'Retenu',
    'Rejete',
  ];

  private readonly funnelTransitions: Array<{
    from: RecruitmentApplicationStatus;
    to: RecruitmentApplicationStatus;
  }> = [
    { from: 'Nouveau', to: 'Preselection' },
    { from: 'Preselection', to: 'Entretien' },
    { from: 'Entretien', to: 'Retenu' },
  ];

  private readonly campaignGridColumns = [...RECRUITMENT_CAMPAIGN_GRID_COLUMNS];

  gridConfig = this.buildCampaignGridConfig([]);

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    department: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    openings: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    needPosition: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    needQuota: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    needDeadline: ['', [Validators.required]],
    needOwner: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    status: ['Planifiee', [Validators.required]],
  });

  budgetForm = this.fb.group({
    campaignCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    budgetAmount: [0, [Validators.required, Validators.min(0)]],
    expensesAmount: [0, [Validators.required, Validators.min(0)]],
    currency: ['GNF', [Validators.required, Validators.maxLength(8)]],
  });

  ruleForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    event: ['application_status_changed', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    condition: ['status == "Entretien"', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    action: ['notify_manager', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    enabled: [true],
  });

  ruleSimulationForm = this.fb.group({
    event: ['application_status_changed', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    context: ['{"status":"Entretien","campaign":"CMP-PAIE-Q2"}', [Validators.maxLength(2000)]],
  });

  observabilityEventForm = this.fb.group({
    source: ['frontend', [Validators.required, Validators.maxLength(80)]],
    severity: ['warning', [Validators.required]],
    message: ['Control tower refresh event', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadApplications();
    this.loadWorkloadForecast();
    this.loadCampaignBudgets();
    this.loadControlTower();
    this.loadExecutiveDashboard();
    this.loadRuleEngineRules();
    this.loadRuleExecutions();
    this.loadBiExportLogs();
    this.loadObservabilitySnapshot();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return `Valeur minimale: ${control.errors['min'].min}`;
    if (control.errors['max']) return `Valeur maximale: ${control.errors['max'].max}`;
    if (control.errors['pattern']) return 'Format invalide (A-Z, 0-9, -)';
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
    this.cdr.detectChanges();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveCampaign(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const startDate = this.form.value.startDate || '';
    const endDate = this.form.value.endDate || '';
    const startTimestamp = Date.parse(startDate);
    const endTimestamp = Date.parse(endDate);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Recrutement', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }
    const needDeadline = this.form.value.needDeadline || '';
    const needDeadlineTimestamp = Date.parse(needDeadline);
    if (
      Number.isNaN(needDeadlineTimestamp) ||
      needDeadlineTimestamp < startTimestamp ||
      needDeadlineTimestamp > endTimestamp
    ) {
      this.toastr.error('Le delai besoin doit etre compris entre date debut et date fin', 'Recrutement', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateCampaignPayload = {
      code: this.form.value.code?.trim() || undefined,
      title: this.form.value.title?.trim() || '',
      department: this.form.value.department?.trim() || '',
      openings: Number(this.form.value.openings ?? 1),
      startDate,
      endDate,
      needPosition: this.form.value.needPosition?.trim() || '',
      needQuota: Number(this.form.value.needQuota ?? 1),
      needDeadline,
      needOwner: this.form.value.needOwner?.trim() || '',
      status: this.form.value.status?.trim() || 'Planifiee',
    };

    this.submitting = true;
    this.recruitmentService
      .createCampaign(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Campagne creee avec succes', 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadCampaigns();
          this.loadApplications();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportCampaigns(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }

    if (!this.items.length) {
      this.toastr.info('Aucune campagne a exporter', 'Recrutement', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    downloadCsv({
      filename: `recrutement-campagnes-${this.exportDateSuffix()}.csv`,
      headers: ['Code', 'Intitule', 'Direction', 'Ouvertures', 'Debut', 'Fin', 'Besoin Poste', 'Quota Besoin', 'Delai Besoin', 'Owner Besoin', 'Statut'],
      rows: this.items.map((item) => [
        item.code,
        item.title,
        item.department,
        item.openings,
        item.startDate,
        item.endDate,
        item.needPosition,
        item.needQuota,
        item.needDeadline,
        item.needOwner,
        item.status,
      ]),
      delimiter: ';',
    });

    this.toastr.success('Export CSV genere', 'Recrutement', {
      timeOut: 2200,
      positionClass: 'toast-top-right',
    });
  }

  funnelScopeLabel(): string {
    return this.selectedFunnelCampaign === 'all'
      ? 'Global (toutes campagnes)'
      : this.selectedFunnelCampaign;
  }

  onFunnelCampaignChange(value: string): void {
    const normalized = String(value || '').trim();
    this.selectedFunnelCampaign = normalized || 'all';
    this.recomputeFunnel();
  }

  workloadAlertBadgeClass(alert: RecruitmentWorkloadForecastEntry['alert']): string {
    if (alert === 'Surcharge') return 'bg-danger-transparent text-danger';
    if (alert === 'Sous-charge') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  budgetVarianceBadgeClass(variance: number): string {
    if (variance < 0) return 'bg-danger-transparent text-danger';
    if (variance === 0) return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  pickBudgetCampaign(code: string): void {
    const selected = this.campaignBudgetItems.find((item) => item.campaignCode === code);
    if (!selected) {
      return;
    }
    this.selectedBudgetCampaignCode = code;
    this.budgetForm.patchValue({
      campaignCode: selected.campaignCode,
      budgetAmount: selected.budgetAmount,
      expensesAmount: selected.expensesAmount,
      currency: selected.currency || 'GNF',
    });
  }

  saveCampaignBudget(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.budgetForm.invalid || this.budgetSubmitting) {
      this.budgetForm.markAllAsTouched();
      return;
    }
    const payload = {
      campaignCode: String(this.budgetForm.value.campaignCode || '').trim().toUpperCase(),
      budgetAmount: Number(this.budgetForm.value.budgetAmount ?? 0),
      expensesAmount: Number(this.budgetForm.value.expensesAmount ?? 0),
      currency: String(this.budgetForm.value.currency || 'GNF').trim().toUpperCase(),
    };
    if (payload.expensesAmount > payload.budgetAmount) {
      this.toastr.error('Depenses superieures au budget', 'Recrutement', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.budgetSubmitting = true;
    this.recruitmentService
      .upsertCampaignBudget(payload)
      .pipe(finalize(() => (this.budgetSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Budget campagne enregistre', 'Recrutement', {
            timeOut: 2300,
            positionClass: 'toast-top-right',
          });
          this.loadCampaignBudgets();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  refreshControlTower(): void {
    this.loadControlTower();
  }

  openControlTowerApplication(item: RecruitmentControlTowerItem): void {
    this.router.navigate(['/recrutement/candidatures'], {
      queryParams: { focusRef: item.reference },
    });
  }

  createRule(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.ruleForm.invalid || this.ruleSubmitting) {
      this.ruleForm.markAllAsTouched();
      return;
    }
    this.ruleSubmitting = true;
    this.recruitmentService
      .createRuleEngineRule({
        name: String(this.ruleForm.value.name || '').trim(),
        event: String(this.ruleForm.value.event || '').trim(),
        condition: String(this.ruleForm.value.condition || '').trim(),
        action: String(this.ruleForm.value.action || '').trim(),
        enabled: !!this.ruleForm.value.enabled,
      })
      .pipe(finalize(() => (this.ruleSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Regle no-code creee', 'Recrutement', {
            timeOut: 2300,
            positionClass: 'toast-top-right',
          });
          this.loadRuleEngineRules();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  simulateRule(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.ruleSimulationForm.invalid || this.ruleSimulating) {
      this.ruleSimulationForm.markAllAsTouched();
      return;
    }
    const event = String(this.ruleSimulationForm.value.event || '').trim();
    const contextText = String(this.ruleSimulationForm.value.context || '').trim();
    let context: Record<string, unknown> = {};
    if (contextText) {
      try {
        const parsed = JSON.parse(contextText) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          context = parsed as Record<string, unknown>;
        }
      } catch {
        this.toastr.error('Contexte simulation invalide (JSON)', 'Recrutement', {
          timeOut: 3200,
          positionClass: 'toast-top-right',
        });
        return;
      }
    }
    this.ruleSimulating = true;
    this.recruitmentService
      .simulateRuleEngine({ event, context })
      .pipe(finalize(() => (this.ruleSimulating = false)))
      .subscribe({
        next: (result) => {
          this.ruleSimulation = result;
          this.loadRuleExecutions();
          this.toastr.success(`Simulation terminee: ${result.matches.length} match(s)`, 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportExecutiveDashboard(format: 'csv' | 'pdf'): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }

    this.executiveExporting = true;
    this.recruitmentService
      .exportExecutiveDashboard(format)
      .pipe(finalize(() => (this.executiveExporting = false)))
      .subscribe({
        next: (result) => {
          const extension = result.format === 'pdf' ? 'txt' : 'csv';
          this.downloadTextFile(
            `recrutement-direction-${this.exportDateSuffix()}.${extension}`,
            result.content,
            result.format === 'pdf' ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8'
          );
          this.toastr.success(`Export direction ${result.format.toUpperCase()} genere`, 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportBi(format: 'json' | 'csv'): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.biExporting = true;
    this.recruitmentService
      .exportBiData(format)
      .pipe(finalize(() => (this.biExporting = false)))
      .subscribe({
        next: (payload) => {
          if ('datasets' in payload) {
            this.downloadTextFile(
              `recrutement-bi-${this.exportDateSuffix()}.json`,
              JSON.stringify(payload, null, 2),
              'application/json;charset=utf-8'
            );
          } else {
            this.downloadTextFile(
              `recrutement-bi-${this.exportDateSuffix()}.csv`,
              payload.content,
              'text/csv;charset=utf-8'
            );
          }
          this.loadBiExportLogs();
          this.toastr.success(`Export BI ${format.toUpperCase()} genere`, 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  pushObservabilityEvent(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }

    if (this.observabilityEventForm.invalid || this.observabilityEventSubmitting) {
      this.observabilityEventForm.markAllAsTouched();
      return;
    }
    this.observabilityEventSubmitting = true;
    this.recruitmentService
      .pushObservabilityEvent({
        source: String(this.observabilityEventForm.value.source || '').trim(),
        severity: this.observabilityEventForm.value.severity === 'critical'
          ? 'critical'
          : this.observabilityEventForm.value.severity === 'warning'
            ? 'warning'
            : 'info',
        message: String(this.observabilityEventForm.value.message || '').trim(),
      })
      .pipe(finalize(() => (this.observabilityEventSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Evenement observabilite enregistre', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.loadObservabilitySnapshot();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadCampaigns(): void {
    this.recruitmentService.getCampaigns().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = this.buildCampaignGridConfig(buildRecruitmentCampaignGridRows(items));
        this.syncFunnelCampaignOptions();
        this.recomputeFunnel();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = this.buildCampaignGridConfig([]);
        this.toastr.error(this.resolveError(error), 'Recrutement', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private buildCampaignGridConfig(data: (string | number)[][]): {
    columns: string[];
    search: boolean;
    sort: boolean;
    pagination: { limit: number };
    data: (string | number)[][];
  } {
    return {
      columns: [...this.campaignGridColumns],
      search: true,
      sort: true,
      pagination: { limit: 10 },
      data,
    };
  }

  private loadApplications(): void {
    this.recruitmentService
      .getApplications({
        page: 1,
        limit: 1000,
        sortBy: 'receivedOn',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.applications = items;
          this.syncFunnelCampaignOptions();
          this.recomputeFunnel();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.applications = [];
          this.funnelVolumes = [];
          this.funnelConversions = [];
          this.funnelScopeTotal = 0;
          this.operationalKpis = {
            averageProcessingDays: 0,
            processedCount: 0,
            retainedCount: 0,
            rejectedCount: 0,
            retainedRate: 0,
            rejectedRate: 0,
          };
          this.weeklyVolumes = [];
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadWorkloadForecast(): void {
    this.recruitmentService.getCampaignWorkloadForecast().subscribe({
      next: (response) => {
        this.workloadGeneratedAt = response.generatedAt;
        this.workloadForecast = response.items;
        this.cdr.detectChanges();
      },
      error: () => {
        this.workloadGeneratedAt = '';
        this.workloadForecast = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadCampaignBudgets(): void {
    this.recruitmentService.getCampaignBudgets().subscribe({
      next: (response) => {
        this.budgetsGeneratedAt = response.generatedAt;
        this.campaignBudgetItems = response.items;
        if (!this.selectedBudgetCampaignCode && response.items.length > 0) {
          this.pickBudgetCampaign(response.items[0].campaignCode);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.budgetsGeneratedAt = '';
        this.campaignBudgetItems = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadControlTower(): void {
    this.recruitmentService
      .getControlTowerView({
        campaign: this.controlTowerCampaign || undefined,
        status: this.controlTowerStatus || undefined,
        q: this.controlTowerSearch || undefined,
        page: 1,
        limit: 200,
        sortBy: 'receivedOn',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.controlTower = response;
          this.cdr.detectChanges();
        },
        error: () => {
          this.controlTower = {
            summary: {
              totalApplications: 0,
              interviewsPlanned: 0,
              onboardingActive: 0,
              retained: 0,
            },
            items: [],
          };
          this.cdr.detectChanges();
        },
      });
  }

  private loadExecutiveDashboard(): void {
    this.recruitmentService.getExecutiveDashboard().subscribe({
      next: (response) => {
        this.executiveDashboard = response;
        this.cdr.detectChanges();
      },
      error: () => {
        this.executiveDashboard = null;
        this.cdr.detectChanges();
      },
    });
  }

  private loadRuleEngineRules(): void {
    this.recruitmentService
      .getRuleEngineRules({
        page: 1,
        limit: 80,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.ruleEngineRules = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ruleEngineRules = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadRuleExecutions(): void {
    this.recruitmentService
      .getRuleEngineExecutions({
        page: 1,
        limit: 80,
        sortBy: 'executedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.ruleExecutions = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ruleExecutions = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadBiExportLogs(): void {
    this.recruitmentService
      .getBiExportLogs({
        page: 1,
        limit: 60,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.biExportLogs = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.biExportLogs = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadObservabilitySnapshot(): void {
    this.recruitmentService.getObservabilitySnapshot().subscribe({
      next: (snapshot) => {
        this.observability = snapshot;
        this.cdr.detectChanges();
      },
      error: () => {
        this.observability = null;
        this.cdr.detectChanges();
      },
    });
  }

  private syncFunnelCampaignOptions(): void {
    const options = new Set<string>();
    for (const item of this.items) {
      const code = String(item.code || '').trim();
      if (code) {
        options.add(code);
      }
    }
    for (const application of this.applications) {
      const code = String(application.campaign || '').trim();
      if (code) {
        options.add(code);
      }
    }

    this.funnelCampaignOptions = Array.from(options).sort((left, right) => left.localeCompare(right));
    if (
      this.selectedFunnelCampaign !== 'all' &&
      !this.funnelCampaignOptions.includes(this.selectedFunnelCampaign)
    ) {
      this.selectedFunnelCampaign = 'all';
    }
  }

  private recomputeFunnel(): void {
    const scopedApplications =
      this.selectedFunnelCampaign === 'all'
        ? [...this.applications]
        : this.applications.filter((item) => item.campaign === this.selectedFunnelCampaign);

    this.funnelScopeTotal = scopedApplications.length;
    const countByStatus = new Map<RecruitmentApplicationStatus, number>();
    this.funnelStages.forEach((status) => countByStatus.set(status, 0));

    for (const application of scopedApplications) {
      const status = application.status;
      const current = countByStatus.get(status) || 0;
      countByStatus.set(status, current + 1);
    }

    this.funnelVolumes = this.funnelStages.map((status) => {
      const count = countByStatus.get(status) || 0;
      return {
        status,
        count,
        ratio: this.computePercent(count, this.funnelScopeTotal),
        badgeClass: this.funnelBadgeClass(status),
        barClass: this.funnelBarClass(status),
      };
    });

    this.funnelConversions = this.funnelTransitions.map((step) => {
      const countFrom = countByStatus.get(step.from) || 0;
      const countTo = countByStatus.get(step.to) || 0;
      return {
        from: step.from,
        to: step.to,
        countFrom,
        countTo,
        rate: this.computePercent(countTo, countFrom),
      };
    });

    this.recomputeOperationalKpis(scopedApplications, countByStatus);
  }

  private computePercent(numerator: number, denominator: number): number {
    if (!denominator || denominator <= 0) {
      return 0;
    }
    return (numerator / denominator) * 100;
  }

  private funnelBadgeClass(status: RecruitmentApplicationStatus): string {
    switch (status) {
      case 'Nouveau':
        return 'bg-primary';
      case 'Preselection':
        return 'bg-info';
      case 'Entretien':
        return 'bg-warning';
      case 'Retenu':
        return 'bg-success';
      case 'Rejete':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  private funnelBarClass(status: RecruitmentApplicationStatus): string {
    switch (status) {
      case 'Nouveau':
        return 'bg-primary';
      case 'Preselection':
        return 'bg-info';
      case 'Entretien':
        return 'bg-warning';
      case 'Retenu':
        return 'bg-success';
      case 'Rejete':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  private recomputeOperationalKpis(
    scopedApplications: Application[],
    countByStatus: Map<RecruitmentApplicationStatus, number>
  ): void {
    const retainedCount = countByStatus.get('Retenu') || 0;
    const rejectedCount = countByStatus.get('Rejete') || 0;
    const processedCount = retainedCount + rejectedCount;
    const averageProcessingDays = this.computeAverageProcessingDays(
      scopedApplications.filter((item) => item.status === 'Retenu' || item.status === 'Rejete')
    );

    this.operationalKpis = {
      averageProcessingDays,
      processedCount,
      retainedCount,
      rejectedCount,
      retainedRate: this.computePercent(retainedCount, this.funnelScopeTotal),
      rejectedRate: this.computePercent(rejectedCount, this.funnelScopeTotal),
    };
    this.weeklyVolumes = this.computeWeeklyVolumes(scopedApplications);
  }

  private computeAverageProcessingDays(items: Application[]): number {
    if (!items.length) {
      return 0;
    }

    const delays = items
      .map((item) => this.computeProcessingDelayDays(item))
      .filter((value) => Number.isFinite(value) && value >= 0);

    if (!delays.length) {
      return 0;
    }
    return delays.reduce((sum, value) => sum + value, 0) / delays.length;
  }

  private computeProcessingDelayDays(item: Application): number {
    const receivedTimestamp = this.parseTimestamp(item.receivedOn);
    if (receivedTimestamp <= 0) {
      return 0;
    }

    const history = Array.isArray(item.statusHistory) ? item.statusHistory : [];
    const lastStatusTimestamp = history.reduce((latest, entry) => {
      const value = this.parseTimestamp(entry.changedAt);
      if (value > latest) {
        return value;
      }
      return latest;
    }, 0);

    const endTimestamp = lastStatusTimestamp > 0 ? lastStatusTimestamp : receivedTimestamp;
    if (endTimestamp <= receivedTimestamp) {
      return 0;
    }
    return (endTimestamp - receivedTimestamp) / 86400000;
  }

  private computeWeeklyVolumes(items: Application[]): Array<{
    weekKey: string;
    label: string;
    count: number;
    width: number;
  }> {
    const counts = new Map<string, number>();
    for (const item of items) {
      const receivedTimestamp = this.parseTimestamp(item.receivedOn);
      if (receivedTimestamp <= 0) {
        continue;
      }
      const key = this.weekStartKey(receivedTimestamp);
      const current = counts.get(key) || 0;
      counts.set(key, current + 1);
    }

    const latestWeekKey =
      Array.from(counts.keys()).sort((left, right) => left.localeCompare(right)).pop()
      || this.weekStartKey(Date.now());

    const lastEightWeeks: string[] = [];
    let cursor = this.weekStartDate(latestWeekKey);
    for (let i = 0; i < 8; i += 1) {
      lastEightWeeks.unshift(this.dateKey(cursor));
      cursor = new Date(cursor.getTime());
      cursor.setUTCDate(cursor.getUTCDate() - 7);
    }

    const maxCount = Math.max(
      1,
      ...lastEightWeeks.map((key) => counts.get(key) || 0)
    );

    return lastEightWeeks.map((key) => {
      const count = counts.get(key) || 0;
      return {
        weekKey: key,
        label: this.weekLabel(key),
        count,
        width: this.computePercent(count, maxCount),
      };
    });
  }

  private weekStartKey(timestamp: number): string {
    const date = new Date(timestamp);
    const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const weekDay = utcDate.getUTCDay();
    const diffToMonday = (weekDay + 6) % 7;
    utcDate.setUTCDate(utcDate.getUTCDate() - diffToMonday);
    return this.dateKey(utcDate);
  }

  private weekStartDate(key: string): Date {
    const parsed = Date.parse(`${key}T00:00:00.000Z`);
    if (Number.isNaN(parsed)) {
      return new Date();
    }
    return new Date(parsed);
  }

  private weekLabel(key: string): string {
    const date = this.weekStartDate(key);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    return `Sem. ${day}/${month}`;
  }

  private dateKey(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseTimestamp(value: unknown): number {
    const parsed = Date.parse(String(value || '').trim());
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private resetForm(): void {
    this.form.reset({
      code: '',
      title: '',
      department: '',
      openings: 1,
      startDate: '',
      endDate: '',
      needPosition: '',
      needQuota: 1,
      needDeadline: '',
      needOwner: '',
      status: 'Planifiee',
    });
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (Array.isArray(error.error?.errors) && error.error.errors.length > 0) {
        return error.error.errors.join(' | ');
      }

      if (typeof error.error?.message === 'string' && error.error.message.trim()) {
        return error.error.message;
      }
    }

    return 'Operation impossible pour le moment';
  }

  canManageRecruitment(): boolean {
    return this.accessControl.hasPermission(APP_PERMISSIONS.recruitmentManage);
  }

  private notifyMissingManagePermission(): void {
    this.toastr.warning('Permission recrutement:manage requise', 'Recrutement', {
      timeOut: 2600,
      positionClass: 'toast-top-right',
    });
  }

  private downloadTextFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const href = typeof URL !== 'undefined' ? URL.createObjectURL(blob) : '';
    if (!href) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }
}
