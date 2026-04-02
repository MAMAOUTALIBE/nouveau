import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import {
  CreateOnboardingPayload,
  CreateRecruitmentOnboardingMilestoneFeedbackPayload,
  OnboardingChecklistProgress,
  OnboardingChecklistTask,
  OnboardingHistoryEvent,
  OnboardingItem,
  OnboardingTaskStatus,
  RecruitmentOnboarding306090Item,
  RecruitmentOnboardingMilestone,
  RecruitmentOnboardingSuccessScoreEntry,
  RecruitmentOnboardingSyncLogEntry,
  RecruitmentService
} from '../../recruitment.service';

interface OnboardingTemplateTask {
  label: string;
  assignedTo: string;
}

interface OnboardingTemplate {
  id: string;
  label: string;
  keywords: string[];
  tasks: OnboardingTemplateTask[];
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './onboarding.html',
})
export class OnboardingPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private accessControl = inject(AccessControlService);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  items: OnboardingItem[] = [];
  milestones306090: RecruitmentOnboarding306090Item[] = [];
  successScores: RecruitmentOnboardingSuccessScoreEntry[] = [];
  successThresholds = {
    warning: 75,
    critical: 60,
  };
  warningThreshold = 75;
  criticalThreshold = 60;
  syncLogs: RecruitmentOnboardingSyncLogEntry[] = [];
  syncingReferences = new Set<string>();
  milestoneFeedbackSubmitting = false;
  selectedMilestoneFeedbackReference: string | null = null;
  showCreateForm = false;
  submitting = false;
  detectedTemplateLabel = '';

  readonly onboardingTemplates: OnboardingTemplate[] = [
    {
      id: 'ONB-TPL-REC-ANALYSTE',
      label: 'Template Analyste Recrutement',
      keywords: ['analyste recrutement', 'recrutement'],
      tasks: [
        { label: 'Contrat signe', assignedTo: 'RH Admin' },
        { label: 'Badge cree', assignedTo: 'Services Generaux' },
        { label: 'Compte SI active', assignedTo: 'IT Support' },
        { label: 'Formation ATS et process recrutement', assignedTo: 'Manager Recrutement' },
      ],
    },
    {
      id: 'ONB-TPL-PAIE-GEST',
      label: 'Template Gestionnaire Paie',
      keywords: ['gestionnaire paie', 'paie'],
      tasks: [
        { label: 'Contrat signe', assignedTo: 'RH Admin' },
        { label: 'Badge cree', assignedTo: 'Services Generaux' },
        { label: 'Compte SI active', assignedTo: 'IT Support' },
        { label: 'Acces outils paie valide', assignedTo: 'Manager Paie' },
        { label: 'Formation procedure paie', assignedTo: 'Manager Paie' },
      ],
    },
    {
      id: 'ONB-TPL-RH-ASSIST',
      label: 'Template Assistant RH',
      keywords: ['assistant rh', 'rh'],
      tasks: [
        { label: 'Contrat signe', assignedTo: 'RH Admin' },
        { label: 'Badge cree', assignedTo: 'Services Generaux' },
        { label: 'Compte SI active', assignedTo: 'IT Support' },
        { label: 'Formation dossiers personnel', assignedTo: 'Responsable RH' },
      ],
    },
  ];

  form = this.fb.group({
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    startDate: ['', [Validators.required]],
    checklistText: ['', [Validators.maxLength(1200)]],
    templateId: ['', [Validators.maxLength(80)]],
    applicationReference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    status: ['Planifie', [Validators.required]],
  });

  milestoneFeedbackForm = this.fb.group({
    applicationReference: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    day: [30, [Validators.required]],
    authorRole: ['manager', [Validators.required]],
    score: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    comment: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(400)]],
  });

  ngOnInit(): void {
    this.loadOnboarding();
    this.loadMilestones306090();
    this.loadOnboardingSuccessScores();
    this.loadOnboardingSyncLogs();
    this.hydrateCreateFormFromRoute();
    this.refreshDetectedTemplateLabel();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
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

  saveOnboarding(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const rawChecklist = String(this.form.value.checklistText || '')
      .split(/[\n;,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const position = this.form.value.position?.trim() || '';
    const template = this.resolveTemplate(position, this.form.value.templateId || '');
    const checklist = rawChecklist.length > 0
      ? rawChecklist
      : (template?.tasks || []).map((task) => task.label);
    const status = this.form.value.status?.trim() || 'Planifie';
    const startDate = this.form.value.startDate || '';
    const checklistTasks = this.buildChecklistTasksPayload(
      checklist,
      template,
      status,
      startDate
    );

    const payload: CreateOnboardingPayload = {
      agent: this.form.value.agent?.trim() || '',
      position,
      startDate,
      checklist: checklistTasks.map((task) => task.label),
      checklistTasks,
      templateId: template?.id || this.form.value.templateId?.trim() || undefined,
      applicationReference: this.form.value.applicationReference?.trim().toUpperCase() || undefined,
      status,
    };

    if (this.hasDuplicateOnboarding(payload.agent, payload.position, payload.startDate)) {
      this.toastr.error('Un parcours existe deja pour cet agent, poste et date', 'Recrutement', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.submitting = true;
    this.recruitmentService
      .createOnboarding(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Parcours d integration cree avec succes', 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadOnboarding();
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

  openMilestoneFeedbackForm(reference: string, day: 30 | 60 | 90 = 30): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.selectedMilestoneFeedbackReference = reference;
    this.milestoneFeedbackForm.patchValue({
      applicationReference: reference,
      day,
      authorRole: 'manager',
      score: 70,
      comment: '',
    });
  }

  closeMilestoneFeedbackForm(): void {
    this.selectedMilestoneFeedbackReference = null;
    this.milestoneFeedbackForm.reset({
      applicationReference: '',
      day: 30,
      authorRole: 'manager',
      score: 70,
      comment: '',
    });
  }

  submitMilestoneFeedback(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.milestoneFeedbackForm.invalid || this.milestoneFeedbackSubmitting) {
      this.milestoneFeedbackForm.markAllAsTouched();
      return;
    }
    const reference = String(this.milestoneFeedbackForm.value.applicationReference || '').trim().toUpperCase();
    const payload: CreateRecruitmentOnboardingMilestoneFeedbackPayload = {
      day: this.normalizeMilestoneDay(this.milestoneFeedbackForm.value.day),
      authorRole: this.milestoneFeedbackForm.value.authorRole === 'agent' ? 'agent' : 'manager',
      score: Number(this.milestoneFeedbackForm.value.score ?? 0),
      comment: String(this.milestoneFeedbackForm.value.comment || '').trim(),
    };
    this.milestoneFeedbackSubmitting = true;
    this.recruitmentService
      .addOnboardingMilestoneFeedback(reference, payload)
      .pipe(finalize(() => (this.milestoneFeedbackSubmitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Feedback 30/60/90 enregistre', 'Recrutement', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.closeMilestoneFeedbackForm();
          this.loadMilestones306090();
          this.loadOnboardingSuccessScores();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  triggerOnboardingSync(item: OnboardingItem): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const reference = String(item.applicationReference || '').trim().toUpperCase();
    if (!reference) {
      this.toastr.warning('Reference candidature requise pour sync onboarding', 'Recrutement', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    if (this.syncingReferences.has(reference)) {
      return;
    }
    this.syncingReferences.add(reference);
    this.recruitmentService
      .runOnboardingSync(reference)
      .pipe(finalize(() => this.syncingReferences.delete(reference)))
      .subscribe({
        next: () => {
          this.toastr.success('Synchronisation onboarding RH terminee', 'Recrutement', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.loadOnboardingSyncLogs();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  isSyncing(reference?: string): boolean {
    const normalized = String(reference || '').trim().toUpperCase();
    return normalized ? this.syncingReferences.has(normalized) : false;
  }

  updateSuccessThresholds(): void {
    const warning = Math.max(50, Math.min(95, Math.round(this.warningThreshold || 75)));
    const critical = Math.max(30, Math.min(warning - 1, Math.round(this.criticalThreshold || 60)));
    this.warningThreshold = warning;
    this.criticalThreshold = critical;
  }

  successAlertBadgeClass(alert: RecruitmentOnboardingSuccessScoreEntry['alert']): string {
    if (alert === 'Critique') return 'bg-danger-transparent text-danger';
    if (alert === 'Alerte') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  computedSuccessAlert(score: number): RecruitmentOnboardingSuccessScoreEntry['alert'] {
    if (score < this.criticalThreshold) return 'Critique';
    if (score < this.warningThreshold) return 'Alerte';
    return 'OK';
  }

  milestoneStatusBadgeClass(status: RecruitmentOnboardingMilestone['status']): string {
    if (status === 'Complete') return 'bg-success-transparent text-success';
    if (status === 'En retard') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  cohortSuccessRows(): Array<{
    cohort: string;
    avgScore: number;
    total: number;
    critical: number;
  }> {
    const groups = new Map<string, { total: number; score: number; critical: number }>();
    this.successScores.forEach((item) => {
      const key = item.cohort || 'n/a';
      if (!groups.has(key)) {
        groups.set(key, { total: 0, score: 0, critical: 0 });
      }
      const bucket = groups.get(key) as { total: number; score: number; critical: number };
      bucket.total += 1;
      bucket.score += item.score;
      if (this.computedSuccessAlert(item.score) === 'Critique') {
        bucket.critical += 1;
      }
    });
    return Array.from(groups.entries())
      .map(([cohort, bucket]) => ({
        cohort,
        avgScore: bucket.total > 0 ? Math.round((bucket.score / bucket.total) * 10) / 10 : 0,
        total: bucket.total,
        critical: bucket.critical,
      }))
      .sort((left, right) => right.cohort.localeCompare(left.cohort));
  }

  feedbackCountOfMilestones(item: RecruitmentOnboarding306090Item): number {
    return item.milestones.reduce((sum, milestone) => sum + milestone.feedbacks.length, 0);
  }

  private loadOnboarding(): void {
    this.recruitmentService.getOnboarding().subscribe({
      next: (items) => {
        this.items = items;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.toastr.error(this.resolveError(error), 'Recrutement', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private loadMilestones306090(): void {
    this.recruitmentService
      .getOnboarding306090({
        page: 1,
        limit: 300,
        sortBy: 'startDate',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.milestones306090 = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.milestones306090 = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadOnboardingSuccessScores(): void {
    this.recruitmentService.getOnboardingSuccessScores().subscribe({
      next: (response) => {
        this.successThresholds = response.thresholds;
        this.warningThreshold = response.thresholds.warning;
        this.criticalThreshold = response.thresholds.critical;
        this.successScores = response.items;
        this.cdr.detectChanges();
      },
      error: () => {
        this.successScores = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadOnboardingSyncLogs(): void {
    this.recruitmentService
      .getOnboardingSyncLogs({
        page: 1,
        limit: 120,
        sortBy: 'syncedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.syncLogs = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.syncLogs = [];
          this.cdr.detectChanges();
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      agent: '',
      position: '',
      startDate: '',
      checklistText: '',
      templateId: '',
      applicationReference: '',
      status: 'Planifie',
    });
    this.detectedTemplateLabel = '';
  }

  private hydrateCreateFormFromRoute(): void {
    this.route.queryParamMap.subscribe((params) => {
      const candidate = String(params.get('candidate') || '').trim();
      const position = String(params.get('position') || '').trim();
      const applicationRef = String(params.get('applicationRef') || '').trim().toUpperCase();
      if (!candidate && !position && !applicationRef) {
        return;
      }

      const template = this.resolveTemplate(position, '');
      const defaultChecklistText = template
        ? this.buildChecklistTextFromTemplate(template)
        : 'Contrat signe\nBadge cree\nCompte SI active';

      this.showCreateForm = true;
      this.form.patchValue({
        agent: candidate || this.form.value.agent || '',
        position: position || this.form.value.position || '',
        templateId: template?.id || this.form.value.templateId || '',
        applicationReference: applicationRef || this.form.value.applicationReference || '',
        startDate: this.form.value.startDate || this.todayDateIso(),
        checklistText: this.form.value.checklistText || defaultChecklistText,
        status: this.form.value.status || 'Planifie',
      });
      this.refreshDetectedTemplateLabel();
      this.cdr.detectChanges();
    });
  }

  applyTemplateFromPosition(force = true): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const position = this.form.value.position?.trim() || '';
    const template = this.resolveTemplate(position, this.form.value.templateId || '');
    if (!template) {
      this.form.patchValue({ templateId: '' });
      this.refreshDetectedTemplateLabel();
      return;
    }

    const currentChecklist = String(this.form.value.checklistText || '').trim();
    if (!currentChecklist || force) {
      this.form.patchValue({
        checklistText: this.buildChecklistTextFromTemplate(template),
      });
    }
    this.form.patchValue({ templateId: template.id });
    this.refreshDetectedTemplateLabel();
  }

  checklistTasksOf(item: OnboardingItem): OnboardingChecklistTask[] {
    const tasks = Array.isArray(item.checklistTasks) ? item.checklistTasks : [];
    if (tasks.length > 0) {
      return tasks;
    }
    return (item.checklist || []).map((label, index) => ({
      label,
      assignedTo: 'RH Operations',
      status: this.defaultTaskStatusForOnboarding(index, item.status),
    }));
  }

  progressOf(item: OnboardingItem): OnboardingChecklistProgress {
    if (item.progress) {
      return item.progress;
    }

    const tasks = this.checklistTasksOf(item);
    const total = tasks.length;
    const completed = tasks.filter((task) => task.status === 'Termine').length;
    const inProgress = tasks.filter((task) => task.status === 'En cours').length;
    const blocked = tasks.filter((task) => task.status === 'Bloquee').length;
    const todo = Math.max(0, total - completed - inProgress - blocked);
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    let status: OnboardingChecklistProgress['status'] = 'Non demarre';
    if (total > 0 && completed === total) {
      status = 'Termine';
    } else if (blocked > 0) {
      status = 'Bloque';
    } else if (inProgress > 0 || completed > 0) {
      status = 'En cours';
    }
    return {
      total,
      completed,
      inProgress,
      blocked,
      todo,
      completionRate,
      status,
    };
  }

  taskStatusBadgeClass(status: OnboardingTaskStatus): string {
    if (status === 'Termine') return 'bg-success-transparent text-success';
    if (status === 'En cours') return 'bg-info-transparent text-info';
    if (status === 'Bloquee') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  progressStatusBadgeClass(status: OnboardingChecklistProgress['status']): string {
    if (status === 'Termine') return 'bg-success-transparent text-success';
    if (status === 'En cours') return 'bg-info-transparent text-info';
    if (status === 'Bloque') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  blockedTasksCountOf(item: OnboardingItem): number {
    if (typeof item.blockedTasksCount === 'number') {
      return item.blockedTasksCount;
    }
    return this.checklistTasksOf(item).filter((task) => task.status === 'Bloquee').length;
  }

  escalatedTasksCountOf(item: OnboardingItem): number {
    if (typeof item.escalatedTasksCount === 'number') {
      return item.escalatedTasksCount;
    }
    return this.checklistTasksOf(item).filter((task) => !!task.escalation).length;
  }

  onboardingHistoryOf(item: OnboardingItem): OnboardingHistoryEvent[] {
    const history = Array.isArray(item.history) ? item.history : [];
    return history;
  }

  historyTypeBadgeClass(type: OnboardingHistoryEvent['type']): string {
    if (type === 'Escalade auto') return 'bg-danger-transparent text-danger';
    if (type === 'Blocage') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  private hasDuplicateOnboarding(agent: string, position: string, startDate: string): boolean {
    const normalizedAgent = this.normalizeComparable(agent);
    const normalizedPosition = this.normalizeComparable(position);
    const normalizedDate = String(startDate || '').trim();
    return this.items.some((item) => {
      return (
        this.normalizeComparable(item.agent) === normalizedAgent &&
        this.normalizeComparable(item.position) === normalizedPosition &&
        String(item.startDate || '').trim() === normalizedDate
      );
    });
  }

  private normalizeComparable(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private buildChecklistTasksPayload(
    checklist: string[],
    template: OnboardingTemplate | null,
    onboardingStatus: string,
    startDate: string
  ): OnboardingChecklistTask[] {
    const templateTaskByLabel = new Map(
      (template?.tasks || []).map((task) => [this.normalizeComparable(task.label), task])
    );

    const baseChecklist = checklist.length > 0 ? checklist : ['Accueil et prise de poste'];
    return baseChecklist.map((label, index) => {
      const templateTask = templateTaskByLabel.get(this.normalizeComparable(label));
      return {
        label,
        assignedTo: templateTask?.assignedTo || 'RH Operations',
        status: this.defaultTaskStatusForOnboarding(index, onboardingStatus),
        dueDate: this.addDaysIso(startDate, index),
      };
    });
  }

  private defaultTaskStatusForOnboarding(index: number, onboardingStatus: string): OnboardingTaskStatus {
    const normalizedStatus = this.normalizeComparable(onboardingStatus);
    if (normalizedStatus === 'termine' || normalizedStatus === 'valide') {
      return 'Termine';
    }
    if (normalizedStatus === 'bloque' || normalizedStatus === 'bloquee') {
      if (index === 0) return 'Bloquee';
      return 'A faire';
    }
    if (normalizedStatus === 'en cours') {
      if (index === 0) return 'Termine';
      if (index === 1) return 'En cours';
    }
    return 'A faire';
  }

  private resolveTemplate(position: string, templateId: string): OnboardingTemplate | null {
    const normalizedTemplateId = String(templateId || '').trim().toUpperCase();
    if (normalizedTemplateId) {
      const byId = this.onboardingTemplates.find((template) => template.id.toUpperCase() === normalizedTemplateId);
      if (byId) return byId;
    }

    const normalizedPosition = this.normalizeComparable(position);
    if (!normalizedPosition) return null;

    return this.onboardingTemplates.find((template) =>
      template.keywords.some((keyword) => normalizedPosition.includes(this.normalizeComparable(keyword)))
    ) || null;
  }

  private buildChecklistTextFromTemplate(template: OnboardingTemplate): string {
    return template.tasks.map((task) => task.label).join('\n');
  }

  private addDaysIso(baseDate: string, daysToAdd: number): string | undefined {
    const parsed = Date.parse(String(baseDate || '').trim());
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    const date = new Date(parsed);
    date.setDate(date.getDate() + Math.max(0, daysToAdd));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private refreshDetectedTemplateLabel(): void {
    const template = this.resolveTemplate(
      this.form.value.position?.trim() || '',
      this.form.value.templateId || ''
    );
    this.detectedTemplateLabel = template ? template.label : '';
  }

  private todayDateIso(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private normalizeMilestoneDay(value: unknown): 30 | 60 | 90 {
    const numeric = Math.round(Number(value) || 30);
    if (numeric === 60) return 60;
    if (numeric === 90) return 90;
    return 30;
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
}
