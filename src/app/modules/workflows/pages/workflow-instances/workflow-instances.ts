import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription, firstValueFrom } from 'rxjs';
import {
  CreateWorkflowInstancePayload,
  WorkflowAction,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowPriority,
  WorkflowSlaState,
  WorkflowStatus,
  WorkflowsService,
} from '../../workflows.service';
import {
  WorkflowAutomationChannels,
  WorkflowAutomationEvent,
  WorkflowAutomationEventLevel,
  WorkflowAutomationPolicy,
  WorkflowAutomationSimulationItem,
  WorkflowAutomationSimulationResult,
  WorkflowAutomationService,
  WorkflowAutomationStatus,
} from '../../workflow-automation.service';

type WorkflowStatusFilter = WorkflowStatus | 'ALL';
type WorkflowUrgency = 'CRITIQUE' | 'ELEVEE' | 'NORMALE';
type WorkflowUrgencyFilter = WorkflowUrgency | 'ALL';

interface WorkflowInsight {
  riskScore: number;
  urgency: WorkflowUrgency;
  recommendation: WorkflowAction | null;
  recommendationLabel: string;
  recommendationNote: string;
  reasons: string[];
}

@Component({
  selector: 'app-workflow-instances',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './workflow-instances.html',
  styleUrl: './workflow-instances.scss',
})
export class WorkflowInstancesPage implements OnInit, OnDestroy {
  private workflowsService = inject(WorkflowsService);
  private workflowAutomationService = inject(WorkflowAutomationService);
  private toastr = inject(ToastrService);
  private subscriptions = new Subscription();

  isLoading = false;
  instances: WorkflowInstance[] = [];
  filteredInstances: WorkflowInstance[] = [];
  workflowDefinitions: WorkflowDefinition[] = [];
  priorityQueue: WorkflowInstance[] = [];
  insightsById: Record<string, WorkflowInsight> = {};
  searchTerm = '';
  statusFilter: WorkflowStatusFilter = 'ALL';
  urgencyFilter: WorkflowUrgencyFilter = 'ALL';
  expandedInstanceId: string | null = null;
  isApplyingEmergencyPlan = false;
  isRunningAutomationCycle = false;
  automationEnabled = false;
  automationIntervalSeconds = 45;
  automationEvents: WorkflowAutomationEvent[] = [];
  automationStatus: WorkflowAutomationStatus | null = null;
  isSavingChannels = false;
  emailChannelEnabled = true;
  emailRecipients = 'drh@gouv.gn, ops.rh@gouv.gn';
  teamsChannelEnabled = false;
  teamsWebhookUrl = 'https://teams.example/webhook/rh-ops';
  teamsChannelName = 'RH-OPS';
  automationPolicy: WorkflowAutomationPolicy | null = null;
  isSavingMatrix = false;
  matrixWeightPriorityCritique = 35;
  matrixWeightPriorityHaute = 22;
  matrixWeightSlaBreached = 38;
  matrixWeightSlaWarning = 18;
  matrixWeightOverdueHours = 12;
  matrixWeightAgingHours = 10;
  matrixWeightEscalationLevel = 8;
  matrixWeightRemainingSteps = 6;
  matrixThresholdNotify = 55;
  matrixThresholdN1 = 65;
  matrixThresholdN2 = 80;
  matrixThresholdComex = 92;
  matrixOwnerN1 = 'Responsable RH';
  matrixOwnerN2 = 'Direction RH';
  matrixOwnerComex = 'COMEX RH';
  simulationHorizonHours = 24;
  simulationUseDraftPolicy = true;
  simulationBatchLimit = 3;
  isRunningSimulation = false;
  isApplyingSimulationBatch = false;
  simulationResult: WorkflowAutomationSimulationResult | null = null;
  showCreateForm = false;
  isCreatingInstance = false;
  createInstanceId = '';
  createInstanceDefinition = '';
  createInstanceRequester = '';
  createInstancePriority: WorkflowPriority = 'Normale';
  createInstanceOwner = '';
  createInstanceDueOn = '';
  createInstanceStepsTotal = 3;
  createInstanceStepsCompleted = 0;
  createInstanceStatus: WorkflowStatus = 'EN_ATTENTE';

  summary = {
    total: 0,
    inProgress: 0,
    approved: 0,
    warning: 0,
    breached: 0,
    criticalRisk: 0,
  };

  ngOnInit(): void {
    this.loadInstances();
    this.loadDefinitions();

    this.subscriptions.add(
      this.workflowAutomationService.events$.subscribe((events) => {
        this.automationEvents = events;
      })
    );

    this.subscriptions.add(
      this.workflowAutomationService.running$.subscribe((running) => {
        this.automationEnabled = running;
      })
    );

    this.subscriptions.add(
      this.workflowAutomationService.status$.subscribe((status) => {
        this.automationStatus = status;
        this.automationIntervalSeconds = status.intervalSeconds;
        this.syncChannelsFromStatus(status.channels);
      })
    );

    this.subscriptions.add(
      this.workflowAutomationService.policy$.subscribe((policy) => {
        this.automationPolicy = policy;
        this.syncMatrixFromPolicy(policy);
        this.applyFilters();
      })
    );

    void this.refreshAutomationData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  async refreshAutomationData(): Promise<void> {
    try {
      await this.workflowAutomationService.refresh(40);
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }
  }

  async toggleAutomation(): Promise<void> {
    try {
      if (this.automationEnabled) {
        await this.workflowAutomationService.startAutoEscalation(this.automationIntervalSeconds * 1000);
        this.toastr.info(`Auto-escalade activee (${this.automationIntervalSeconds}s)`, 'Workflows', {
          timeOut: 2200,
          positionClass: 'toast-top-right',
        });
        return;
      }

      await this.workflowAutomationService.stopAutoEscalation();
      this.toastr.info('Auto-escalade desactivee', 'Workflows', {
        timeOut: 1800,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      this.automationEnabled = !this.automationEnabled;
    }
  }

  async onAutomationIntervalChange(): Promise<void> {
    if (!this.automationEnabled) {
      return;
    }

    try {
      await this.workflowAutomationService.startAutoEscalation(this.automationIntervalSeconds * 1000);
      this.toastr.info(`Nouvel intervalle applique: ${this.automationIntervalSeconds}s`, 'Workflows', {
        timeOut: 1800,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }
  }

  async runAutomationCycle(): Promise<void> {
    if (this.isRunningAutomationCycle) {
      return;
    }

    this.isRunningAutomationCycle = true;
    try {
      const result = await this.workflowAutomationService.runCycle();
      this.toastr.success(
        `Cycle termine: ${result.escalated} escalade(s), ${result.notified} alerte(s)`,
        'Workflows',
        {
          timeOut: 2600,
          positionClass: 'toast-top-right',
        }
      );
      this.loadInstances();
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.isRunningAutomationCycle = false;
    }
  }

  async clearAutomationEvents(): Promise<void> {
    try {
      await this.workflowAutomationService.clearEvents();
      this.toastr.info('Journal automation vide', 'Workflows', {
        timeOut: 1600,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }
  }

  async saveNotificationChannels(): Promise<void> {
    if (this.isSavingChannels) {
      return;
    }

    this.isSavingChannels = true;
    try {
      const channels: Partial<WorkflowAutomationChannels> = {
        email: {
          enabled: this.emailChannelEnabled,
          recipients: this.parseRecipients(this.emailRecipients),
        },
        teams: {
          enabled: this.teamsChannelEnabled,
          webhookUrl: this.teamsWebhookUrl.trim(),
          channelName: this.teamsChannelName.trim(),
        },
      };

      await this.workflowAutomationService.updateChannels(channels);
      this.toastr.success('Canaux de notification enregistres', 'Workflows', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.isSavingChannels = false;
    }
  }

  async saveEscalationMatrix(): Promise<void> {
    if (this.isSavingMatrix) {
      return;
    }

    this.isSavingMatrix = true;
    try {
      await this.workflowAutomationService.updatePolicy(this.matrixPolicyDraft());

      this.toastr.success('Matrice d escalation enregistree', 'Workflows', {
        timeOut: 2300,
        positionClass: 'toast-top-right',
      });
      this.applyFilters();
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.isSavingMatrix = false;
    }
  }

  async runPredictiveSimulation(): Promise<void> {
    if (this.isRunningSimulation) {
      return;
    }

    this.isRunningSimulation = true;
    try {
      const policy = this.simulationUseDraftPolicy ? this.matrixPolicyDraft() : undefined;
      const result = await this.workflowAutomationService.simulate(this.simulationHorizonHours, policy);
      this.simulationResult = result;
      this.toastr.success(
        `Simulation ${result.horizonHours}h: ${result.summary.escalationsPlanned} escalades et ${result.summary.notificationsPlanned} notifications`,
        'Workflows',
        {
          timeOut: 2600,
          positionClass: 'toast-top-right',
        }
      );
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Workflows', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.isRunningSimulation = false;
    }
  }

  async applySimulationBatch(): Promise<void> {
    if (this.isApplyingSimulationBatch) {
      return;
    }

    const simulation = this.simulationResult;
    if (!simulation) {
      this.toastr.info('Lance une simulation avant execution batch', 'Workflows', {
        timeOut: 2100,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const limit = this.clampSimulationBatchLimit(this.simulationBatchLimit);
    const targets = simulation.items.filter((item) => item.shouldEscalate).slice(0, limit);

    if (!targets.length) {
      this.toastr.info('Aucune escalade recommandee dans la simulation', 'Workflows', {
        timeOut: 2100,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.isApplyingSimulationBatch = true;
    let success = 0;
    let failed = 0;
    let skipped = 0;

    const instancesById = new Map(this.instances.map((instance) => [instance.id, instance]));

    for (const candidate of targets) {
      const instance = instancesById.get(candidate.instanceId);
      if (!instance || !this.canEscalate(instance)) {
        skipped += 1;
        continue;
      }

      const note = `Batch predictif ${candidate.projectedEscalationLabel} (score ${candidate.scoreProjected}, horizon ${simulation.horizonHours}h)`;

      try {
        await firstValueFrom(this.workflowsService.transitionInstance(instance.id, 'ESCALADER', note));
        success += 1;
      } catch {
        failed += 1;
      }
    }

    this.isApplyingSimulationBatch = false;

    if (success > 0) {
      this.toastr.success(`${success} escalade(s) appliquee(s) en batch`, 'Workflows', {
        timeOut: 2400,
        positionClass: 'toast-top-right',
      });
    }

    if (failed > 0) {
      this.toastr.warning(`${failed} instance(s) en echec pendant le batch`, 'Workflows', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }

    if (skipped > 0) {
      this.toastr.info(`${skipped} instance(s) ignoree(s) (deja au niveau max ou terminales)`, 'Workflows', {
        timeOut: 2400,
        positionClass: 'toast-top-right',
      });
    }

    this.loadInstances();
    void this.refreshAutomationData();
  }

  automationLevelLabel(level: WorkflowAutomationEventLevel): string {
    if (level === 'CRITICAL') return 'Critique';
    if (level === 'WARNING') return 'Alerte';
    if (level === 'SUCCESS') return 'Info';
    return 'Systeme';
  }

  automationLevelClass(level: WorkflowAutomationEventLevel): string {
    if (level === 'CRITICAL') return 'bg-danger-transparent text-danger';
    if (level === 'WARNING') return 'bg-warning-transparent text-warning';
    if (level === 'SUCCESS') return 'bg-success-transparent text-success';
    return 'bg-info-transparent text-info';
  }

  automationLastRunLabel(): string {
    return this.automationStatus?.lastRunAt || '';
  }

  escalationLevelLabel(level: number): string {
    if (level >= 3) return 'COMEX';
    if (level === 2) return 'N2';
    if (level === 1) return 'N1';
    return 'N0';
  }

  escalationLevelClass(level: number): string {
    if (level >= 3) return 'bg-danger-transparent text-danger';
    if (level === 2) return 'bg-warning-transparent text-warning';
    if (level === 1) return 'bg-info-transparent text-info';
    return 'bg-secondary-transparent text-secondary';
  }

  toggleTimeline(instanceId: string): void {
    this.expandedInstanceId = this.expandedInstanceId === instanceId ? null : instanceId;
  }

  canApprove(instance: WorkflowInstance): boolean {
    return instance.status !== 'APPROUVE' && instance.status !== 'REJETE';
  }

  canReject(instance: WorkflowInstance): boolean {
    return instance.status !== 'APPROUVE' && instance.status !== 'REJETE';
  }

  canEscalate(instance: WorkflowInstance): boolean {
    return !this.isTerminal(instance.status) && this.safeEscalationLevel(instance.escalationLevel) < 3;
  }

  performAction(instance: WorkflowInstance, action: WorkflowAction, note = ''): void {
    this.workflowsService.transitionInstance(instance.id, action, note).subscribe({
      next: () => {
        this.toastr.success(`Action ${this.actionLabel(action).toLowerCase()} appliquee`, 'Workflows', {
          timeOut: 2000,
          positionClass: 'toast-top-right',
        });
        this.loadInstances();
      },
      error: (error) => {
        this.toastr.error(this.resolveError(error), 'Workflows', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
      },
    });
  }

  applyRecommendation(instance: WorkflowInstance): void {
    const insight = this.insightsById[instance.id];
    if (!insight || !insight.recommendation) {
      this.toastr.info('Aucune action recommandee pour cette instance', 'Workflows', {
        timeOut: 2000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.performAction(instance, insight.recommendation, insight.recommendationNote);
  }

  async launchEmergencyPlan(): Promise<void> {
    if (this.isApplyingEmergencyPlan) {
      return;
    }

    const targets = this.priorityQueue
      .filter((instance) => {
        const insight = this.insightsById[instance.id];
        return insight?.urgency === 'CRITIQUE' && !!insight.recommendation;
      })
      .slice(0, 3);

    if (!targets.length) {
      this.toastr.info('Aucune instance critique avec action recommandee', 'Workflows', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.isApplyingEmergencyPlan = true;
    let successCount = 0;
    let failedCount = 0;

    for (const instance of targets) {
      const insight = this.insightsById[instance.id];
      if (!insight?.recommendation) {
        continue;
      }

      try {
        await firstValueFrom(
          this.workflowsService.transitionInstance(instance.id, insight.recommendation, insight.recommendationNote)
        );
        successCount += 1;
      } catch {
        failedCount += 1;
      }
    }

    this.isApplyingEmergencyPlan = false;

    if (successCount > 0) {
      this.toastr.success(`${successCount} instance(s) traitee(s) par le plan d'urgence`, 'Workflows', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
    }

    if (failedCount > 0) {
      this.toastr.warning(`${failedCount} instance(s) en echec pendant le plan d'urgence`, 'Workflows', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }

    this.loadInstances();
  }

  actionLabel(action: WorkflowAction): string {
    if (action === 'APPROUVER') return 'APPROUVER';
    if (action === 'REJETER') return 'REJETER';
    return 'ESCALADER';
  }

  statusLabel(status: WorkflowStatus): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'En attente';
      case 'EN_COURS':
        return 'En cours';
      case 'APPROUVE':
        return 'Approuve';
      case 'REJETE':
        return 'Rejete';
      case 'ESCALADE':
        return 'Escalade';
      case 'EN_RETARD':
      default:
        return 'En retard';
    }
  }

  statusClass(status: WorkflowStatus): string {
    switch (status) {
      case 'APPROUVE':
        return 'bg-success-transparent text-success';
      case 'REJETE':
        return 'bg-danger-transparent text-danger';
      case 'ESCALADE':
        return 'bg-warning-transparent text-warning';
      case 'EN_COURS':
        return 'bg-primary-transparent text-primary';
      case 'EN_ATTENTE':
        return 'bg-info-transparent text-info';
      case 'EN_RETARD':
      default:
        return 'bg-danger-transparent text-danger';
    }
  }

  slaClass(slaState: WorkflowSlaState): string {
    if (slaState === 'OK') return 'bg-success-transparent text-success';
    if (slaState === 'WARNING') return 'bg-warning-transparent text-warning';
    return 'bg-danger-transparent text-danger';
  }

  slaLabel(slaState: WorkflowSlaState): string {
    if (slaState === 'OK') return 'Dans SLA';
    if (slaState === 'WARNING') return 'SLA proche';
    return 'SLA depasse';
  }

  priorityClass(priority: string): string {
    switch (priority) {
      case 'Critique':
        return 'bg-danger-transparent text-danger';
      case 'Haute':
        return 'bg-warning-transparent text-warning';
      case 'Basse':
        return 'bg-secondary-transparent text-secondary';
      case 'Normale':
      default:
        return 'bg-primary-transparent text-primary';
    }
  }

  urgencyLabel(urgency: WorkflowUrgency): string {
    if (urgency === 'CRITIQUE') return 'Critique';
    if (urgency === 'ELEVEE') return 'Elevee';
    return 'Normale';
  }

  urgencyClass(urgency: WorkflowUrgency): string {
    if (urgency === 'CRITIQUE') return 'bg-danger-transparent text-danger';
    if (urgency === 'ELEVEE') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  instanceUrgency(instance: WorkflowInstance): WorkflowUrgency {
    return this.insightsById[instance.id]?.urgency ?? 'NORMALE';
  }

  riskScore(instance: WorkflowInstance): number {
    return this.insightsById[instance.id]?.riskScore ?? 0;
  }

  riskScoreClass(score: number): string {
    if (score >= 80) return 'bg-danger-transparent text-danger';
    if (score >= 55) return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  recommendationLabel(instance: WorkflowInstance): string {
    return this.insightsById[instance.id]?.recommendationLabel ?? 'Suivi';
  }

  recommendationClass(instance: WorkflowInstance): string {
    const recommendation = this.insightsById[instance.id]?.recommendation;
    if (recommendation === 'APPROUVER') return 'bg-success-transparent text-success';
    if (recommendation === 'REJETER') return 'bg-danger-transparent text-danger';
    if (recommendation === 'ESCALADER') return 'bg-warning-transparent text-warning';
    return 'bg-secondary-transparent text-secondary';
  }

  recommendationReasons(instance: WorkflowInstance): string[] {
    return this.insightsById[instance.id]?.reasons ?? [];
  }

  hasRecommendation(instance: WorkflowInstance): boolean {
    return !!this.insightsById[instance.id]?.recommendation;
  }

  simulationStatusClass(status: string): string {
    const normalized = String(status || '').trim().toUpperCase();
    if (normalized === 'APPROUVE') return 'bg-success-transparent text-success';
    if (normalized === 'REJETE') return 'bg-danger-transparent text-danger';
    if (normalized === 'ESCALADE') return 'bg-warning-transparent text-warning';
    if (normalized === 'EN_RETARD') return 'bg-danger-transparent text-danger';
    if (normalized === 'EN_COURS') return 'bg-primary-transparent text-primary';
    return 'bg-info-transparent text-info';
  }

  simulationDeltaClass(delta: number): string {
    if (delta >= 20) return 'text-danger fw-semibold';
    if (delta >= 10) return 'text-warning fw-semibold';
    if (delta > 0) return 'text-primary fw-semibold';
    if (delta < 0) return 'text-success fw-semibold';
    return 'text-muted';
  }

  simulationDueLabel(hours: number | null): string {
    if (hours === null) {
      return 'N/A';
    }
    if (hours < 0) {
      return `${Math.abs(hours).toFixed(1)}h retard`;
    }
    return `${hours.toFixed(1)}h`;
  }

  simulationCandidates(): WorkflowAutomationSimulationItem[] {
    return (this.simulationResult?.items ?? []).filter((item) => item.shouldEscalate);
  }

  exportSimulationCsv(): void {
    const simulation = this.simulationResult;
    if (!simulation) {
      this.toastr.info('Aucune simulation a exporter', 'Workflows', {
        timeOut: 1800,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const headers = [
      'instanceId',
      'definition',
      'requester',
      'priority',
      'currentStatus',
      'projectedStatus',
      'currentEscalationLevel',
      'projectedEscalationLevel',
      'scoreNow',
      'scoreProjected',
      'scoreDelta',
      'dueInHours',
      'shouldEscalate',
      'shouldNotify',
      'projectedOwner',
      'projectedStep',
    ];

    const escapeCsv = (value: string | number | boolean | null): string => {
      const raw = value === null ? '' : String(value);
      return `"${raw.replace(/"/g, '""')}"`;
    };

    const rows = simulation.items.map((item) =>
      [
        item.instanceId,
        item.definition,
        item.requester,
        item.priority,
        item.currentStatus,
        item.projectedStatus,
        item.currentEscalationLevel,
        item.projectedEscalationLevel,
        item.scoreNow,
        item.scoreProjected,
        item.scoreDelta,
        item.dueInHours,
        item.shouldEscalate,
        item.shouldNotify,
        item.projectedOwner,
        item.projectedStep,
      ]
        .map((cell) => escapeCsv(cell))
        .join(',')
    );

    const csv = `${headers.join(',')}\n${rows.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `simulation-workflow-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);

    this.toastr.success('Simulation exportee en CSV', 'Workflows', {
      timeOut: 1800,
      positionClass: 'toast-top-right',
    });
  }

  trackBySimulationInstanceId(_index: number, item: WorkflowAutomationSimulationItem): string {
    return item.instanceId;
  }

  trackByInstanceId(_index: number, item: WorkflowInstance): string {
    return item.id;
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.initializeCreateForm();
      return;
    }
    this.resetCreateForm();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetCreateForm();
  }

  onCreateDefinitionChange(): void {
    const selected = this.selectedDefinition();
    if (!selected) {
      return;
    }

    const steps = Number(selected.steps || 3);
    this.createInstanceStepsTotal = Number.isFinite(steps) && steps > 0 ? Math.round(steps) : 3;
    this.createInstanceStepsCompleted = 0;

    if (!this.createInstanceDueOn) {
      const dueDate = new Date(Date.now() + Math.max(1, Number(selected.slaTargetHours || 48)) * 60 * 60 * 1000);
      this.createInstanceDueOn = this.toLocalDateTimeInputValue(dueDate);
    }
  }

  saveNewInstance(): void {
    if (this.isCreatingInstance) {
      return;
    }

    const definition = this.createInstanceDefinition.trim();
    const requester = this.createInstanceRequester.trim();
    const dueOnRaw = this.createInstanceDueOn.trim();
    const parsedDueOn = Date.parse(dueOnRaw);
    const stepsTotal = Number(this.createInstanceStepsTotal);
    const stepsCompleted = Number(this.createInstanceStepsCompleted);

    if (!definition || !requester) {
      this.toastr.error('Workflow et demandeur sont obligatoires', 'Workflows', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!dueOnRaw || Number.isNaN(parsedDueOn)) {
      this.toastr.error('Date echeance invalide', 'Workflows', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!Number.isFinite(stepsTotal) || stepsTotal < 1 || stepsTotal > 12) {
      this.toastr.error('Nombre d etapes invalide (1 a 12)', 'Workflows', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!Number.isFinite(stepsCompleted) || stepsCompleted < 0 || stepsCompleted > stepsTotal) {
      this.toastr.error('Etapes completees invalides', 'Workflows', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateWorkflowInstancePayload = {
      id: this.createInstanceId.trim() || undefined,
      definition,
      requester,
      dueOn: new Date(parsedDueOn).toISOString(),
      priority: this.createInstancePriority,
      owner: this.createInstanceOwner.trim() || undefined,
      stepsTotal: Math.round(stepsTotal),
      stepsCompleted: Math.round(stepsCompleted),
      status: this.createInstanceStatus,
    };

    this.isCreatingInstance = true;
    this.workflowsService.createInstance(payload).subscribe({
      next: () => {
        this.toastr.success('Instance workflow creee avec succes', 'Workflows', {
          timeOut: 2200,
          positionClass: 'toast-top-right',
        });
        this.showCreateForm = false;
        this.resetCreateForm();
        this.loadInstances();
        void this.refreshAutomationData();
        this.isCreatingInstance = false;
      },
      error: (error) => {
        this.toastr.error(this.resolveError(error), 'Workflows', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
        this.isCreatingInstance = false;
      },
    });
  }

  loadInstances(): void {
    this.isLoading = true;
    this.workflowsService.getInstances().subscribe({
      next: (instances) => {
        this.instances = [...instances].sort((left, right) => right.createdOn.localeCompare(left.createdOn));
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Impossible de charger les instances de workflow', 'Workflows', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
        this.instances = [];
        this.applyFilters();
        this.isLoading = false;
      },
    });
  }

  private loadDefinitions(): void {
    this.workflowsService.getDefinitions().subscribe({
      next: (definitions) => {
        this.workflowDefinitions = [...definitions].sort((left, right) => left.name.localeCompare(right.name));
        if (!this.createInstanceDefinition && this.workflowDefinitions.length > 0) {
          this.createInstanceDefinition = this.workflowDefinitions[0].code;
          this.onCreateDefinitionChange();
        }
      },
      error: () => {
        this.workflowDefinitions = [];
      },
    });
  }

  private applyFilters(): void {
    const query = this.searchTerm.trim().toLowerCase();
    const instanceRows = this.instances.map((instance) => {
      const insight = this.buildInsight(instance);
      return { instance, insight };
    });

    this.insightsById = Object.fromEntries(
      instanceRows.map(({ instance, insight }) => [instance.id, insight] as const)
    );

    const filteredRows = instanceRows.filter(({ instance, insight }) => {
      const statusOk = this.statusFilter === 'ALL' || instance.status === this.statusFilter;
      if (!statusOk) {
        return false;
      }

      const urgencyOk = this.urgencyFilter === 'ALL' || insight.urgency === this.urgencyFilter;
      if (!urgencyOk) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        instance.id,
        instance.definition,
        instance.requester,
        instance.owner,
        instance.currentStep,
        instance.status,
        instance.priority,
        insight.recommendationLabel,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });

    this.filteredInstances = filteredRows.map(({ instance }) => instance);
    this.priorityQueue = [...filteredRows]
      .sort((left, right) => {
        const scoreDiff = right.insight.riskScore - left.insight.riskScore;
        if (scoreDiff !== 0) {
          return scoreDiff;
        }
        return Date.parse(left.instance.dueOn) - Date.parse(right.instance.dueOn);
      })
      .slice(0, 5)
      .map(({ instance }) => instance);

    this.computeSummary();
  }

  private computeSummary(): void {
    this.summary = {
      total: this.filteredInstances.length,
      inProgress: this.filteredInstances.filter((item) => item.status === 'EN_COURS' || item.status === 'EN_ATTENTE')
        .length,
      approved: this.filteredInstances.filter((item) => item.status === 'APPROUVE').length,
      warning: this.filteredInstances.filter((item) => item.slaState === 'WARNING').length,
      breached: this.filteredInstances.filter((item) => item.slaState === 'BREACHED').length,
      criticalRisk: this.filteredInstances.filter((item) => this.insightsById[item.id]?.urgency === 'CRITIQUE').length,
    };
  }

  private buildInsight(instance: WorkflowInstance): WorkflowInsight {
    const policy = this.currentPolicy();
    const reasons: string[] = [];
    const riskScore = this.computePolicyRiskScore(instance, policy, reasons);
    const targetLevel = this.targetEscalationLevelFromScore(riskScore, policy);
    const urgency: WorkflowUrgency =
      riskScore >= policy.thresholds.n2 ? 'CRITIQUE' : riskScore >= policy.thresholds.notify ? 'ELEVEE' : 'NORMALE';
    const recommendation = this.pickRecommendation(instance, riskScore, targetLevel, policy);
    const escalationHint = recommendation === 'ESCALADER' ? ` ${this.escalationLevelLabel(targetLevel)}` : '';

    if (!reasons.length) {
      reasons.push('Flux stable');
    }

    return {
      riskScore,
      urgency,
      recommendation,
      recommendationLabel: recommendation ? `${this.actionLabel(recommendation)}${escalationHint}` : 'Suivi',
      recommendationNote: recommendation
        ? `Plan intelligent ${urgency} (score ${riskScore}, cible ${this.escalationLevelLabel(targetLevel)})`
        : '',
      reasons,
    };
  }

  private pickRecommendation(
    instance: WorkflowInstance,
    riskScore: number,
    targetLevel: number,
    policy: WorkflowAutomationPolicy
  ): WorkflowAction | null {
    if (this.isTerminal(instance.status)) {
      return null;
    }

    const currentLevel = this.safeEscalationLevel(instance.escalationLevel);
    if (targetLevel > currentLevel && this.canEscalate(instance)) {
      return 'ESCALADER';
    }

    const remainingSteps = Math.max(0, instance.stepsTotal - instance.stepsCompleted);
    if (remainingSteps <= 1 && this.canApprove(instance) && riskScore < policy.thresholds.n2) {
      return 'APPROUVER';
    }

    if (riskScore >= policy.thresholds.comex && this.canEscalate(instance)) {
      return 'ESCALADER';
    }

    return null;
  }

  private computePolicyRiskScore(
    instance: WorkflowInstance,
    policy: WorkflowAutomationPolicy,
    reasons: string[]
  ): number {
    const weights = policy.weights;
    let riskScore = 0;

    if (instance.priority === 'Critique') {
      riskScore += weights.priorityCritique;
      reasons.push('Priorite critique');
    } else if (instance.priority === 'Haute') {
      riskScore += weights.priorityHaute;
      reasons.push('Priorite haute');
    } else if (instance.priority === 'Normale') {
      riskScore += Math.round(weights.priorityHaute / 2);
    } else {
      riskScore += Math.round(weights.priorityHaute / 4);
    }

    if (instance.slaState === 'BREACHED') {
      riskScore += weights.slaBreached;
      reasons.push('SLA depasse');
    } else if (instance.slaState === 'WARNING') {
      riskScore += weights.slaWarning;
      reasons.push('SLA proche');
    }

    const hoursToDue = this.hoursToDue(instance.dueOn);
    if (hoursToDue < 0) {
      riskScore += weights.overdueHours + Math.min(15, Math.abs(Math.round(hoursToDue)));
      reasons.push('Echeance depassee');
    } else if (hoursToDue <= 6) {
      riskScore += Math.round(weights.overdueHours / 2);
      reasons.push('Echeance sous 6h');
    } else if (hoursToDue <= 24) {
      riskScore += Math.round(weights.overdueHours / 3);
    }

    const ageHours = this.hoursSince(instance.createdOn);
    if (ageHours >= 72) {
      riskScore += weights.agingHours + Math.round(weights.agingHours / 2);
      reasons.push('Instance ancienne (+72h)');
    } else if (ageHours >= 36) {
      riskScore += weights.agingHours;
      reasons.push('Instance persistante (+36h)');
    }

    const escalationLevel = this.safeEscalationLevel(instance.escalationLevel);
    if (escalationLevel > 0) {
      riskScore += escalationLevel * weights.escalationLevel;
      reasons.push(`Escalade ${this.escalationLevelLabel(escalationLevel)}`);
    }

    const remainingSteps = Math.max(0, instance.stepsTotal - instance.stepsCompleted);
    if (remainingSteps >= 3) {
      riskScore += weights.remainingSteps;
      reasons.push('Plusieurs etapes restantes');
    } else if (remainingSteps === 2) {
      riskScore += Math.round(weights.remainingSteps / 2);
    }

    return this.clampMatrixValue(riskScore);
  }

  private targetEscalationLevelFromScore(score: number, policy: WorkflowAutomationPolicy): number {
    if (score >= policy.thresholds.comex) return 3;
    if (score >= policy.thresholds.n2) return 2;
    if (score >= policy.thresholds.n1) return 1;
    return 0;
  }

  private isTerminal(status: WorkflowStatus): boolean {
    return status === 'APPROUVE' || status === 'REJETE';
  }

  private hoursToDue(isoDate: string): number {
    const due = Date.parse(isoDate);
    if (Number.isNaN(due)) {
      return Number.POSITIVE_INFINITY;
    }
    return (due - Date.now()) / (1000 * 60 * 60);
  }

  private hoursSince(isoDate: string): number {
    const created = Date.parse(isoDate);
    if (Number.isNaN(created)) {
      return 0;
    }
    return (Date.now() - created) / (1000 * 60 * 60);
  }

  private matrixPolicyDraft(): WorkflowAutomationPolicy {
    const notify = this.clampMatrixValue(this.matrixThresholdNotify);
    const n1 = Math.max(notify, this.clampMatrixValue(this.matrixThresholdN1));
    const n2 = Math.max(n1, this.clampMatrixValue(this.matrixThresholdN2));
    const comex = Math.max(n2, this.clampMatrixValue(this.matrixThresholdComex));

    return {
      weights: {
        priorityCritique: this.clampMatrixValue(this.matrixWeightPriorityCritique),
        priorityHaute: this.clampMatrixValue(this.matrixWeightPriorityHaute),
        slaBreached: this.clampMatrixValue(this.matrixWeightSlaBreached),
        slaWarning: this.clampMatrixValue(this.matrixWeightSlaWarning),
        overdueHours: this.clampMatrixValue(this.matrixWeightOverdueHours),
        agingHours: this.clampMatrixValue(this.matrixWeightAgingHours),
        escalationLevel: this.clampMatrixValue(this.matrixWeightEscalationLevel),
        remainingSteps: this.clampMatrixValue(this.matrixWeightRemainingSteps),
      },
      thresholds: {
        notify,
        n1,
        n2,
        comex,
      },
      owners: {
        n1: this.matrixOwnerN1.trim() || 'Responsable RH',
        n2: this.matrixOwnerN2.trim() || 'Direction RH',
        comex: this.matrixOwnerComex.trim() || 'COMEX RH',
      },
    };
  }

  private currentPolicy(): WorkflowAutomationPolicy {
    return this.automationPolicy ?? this.matrixPolicyDraft();
  }

  private safeEscalationLevel(level: number): number {
    const numeric = Number(level);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(3, Math.round(numeric)));
  }

  private clampMatrixValue(value: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  }

  private clampSimulationBatchLimit(value: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 3;
    }
    return Math.max(1, Math.min(10, Math.round(numeric)));
  }

  private syncChannelsFromStatus(channels: WorkflowAutomationChannels): void {
    this.emailChannelEnabled = channels.email.enabled;
    this.emailRecipients = channels.email.recipients.join(', ');
    this.teamsChannelEnabled = channels.teams.enabled;
    this.teamsWebhookUrl = channels.teams.webhookUrl;
    this.teamsChannelName = channels.teams.channelName;
  }

  private syncMatrixFromPolicy(policy: WorkflowAutomationPolicy): void {
    this.matrixWeightPriorityCritique = policy.weights.priorityCritique;
    this.matrixWeightPriorityHaute = policy.weights.priorityHaute;
    this.matrixWeightSlaBreached = policy.weights.slaBreached;
    this.matrixWeightSlaWarning = policy.weights.slaWarning;
    this.matrixWeightOverdueHours = policy.weights.overdueHours;
    this.matrixWeightAgingHours = policy.weights.agingHours;
    this.matrixWeightEscalationLevel = policy.weights.escalationLevel;
    this.matrixWeightRemainingSteps = policy.weights.remainingSteps;

    this.matrixThresholdNotify = policy.thresholds.notify;
    this.matrixThresholdN1 = policy.thresholds.n1;
    this.matrixThresholdN2 = policy.thresholds.n2;
    this.matrixThresholdComex = policy.thresholds.comex;

    this.matrixOwnerN1 = policy.owners.n1;
    this.matrixOwnerN2 = policy.owners.n2;
    this.matrixOwnerComex = policy.owners.comex;
  }

  private parseRecipients(value: string): string[] {
    return value
      .split(/[,\n;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => !!entry)
      .slice(0, 20);
  }

  private resolveError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Action workflow impossible';
  }

  private initializeCreateForm(): void {
    if (!this.createInstanceDefinition && this.workflowDefinitions.length > 0) {
      this.createInstanceDefinition = this.workflowDefinitions[0].code;
    }
    this.onCreateDefinitionChange();
    if (!this.createInstanceDueOn) {
      this.createInstanceDueOn = this.toLocalDateTimeInputValue(new Date(Date.now() + 48 * 60 * 60 * 1000));
    }
  }

  private resetCreateForm(): void {
    this.createInstanceId = '';
    this.createInstanceRequester = '';
    this.createInstancePriority = 'Normale';
    this.createInstanceOwner = '';
    this.createInstanceDueOn = '';
    this.createInstanceStepsTotal = 3;
    this.createInstanceStepsCompleted = 0;
    this.createInstanceStatus = 'EN_ATTENTE';
  }

  private selectedDefinition(): WorkflowDefinition | undefined {
    const selected = this.createInstanceDefinition.trim().toLowerCase();
    if (!selected) {
      return undefined;
    }
    return this.workflowDefinitions.find(
      (item) => item.code.toLowerCase() === selected || item.name.toLowerCase() === selected
    );
  }

  private toLocalDateTimeInputValue(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hour}:${minute}`;
  }
}
