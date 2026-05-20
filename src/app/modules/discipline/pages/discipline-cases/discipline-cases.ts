import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  DISCIPLINE_APPEAL_STATUS_OPTIONS,
  DISCIPLINE_CATEGORY_OPTIONS,
  DISCIPLINE_CONFIDENTIALITY_OPTIONS,
  DISCIPLINE_MEDIATION_STATUS_OPTIONS,
  DISCIPLINE_SANCTION_OPTIONS,
  DISCIPLINE_SEVERITY_OPTIONS,
  DISCIPLINE_WORKFLOW_STEPS,
  CreateDisciplineCasePayload,
  DisciplineCase,
  DisciplineStats,
  DisciplineService
} from '../../discipline.service';

@Component({
  selector: 'app-discipline-cases',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './discipline-cases.html',
  styleUrl: './discipline-cases.scss',
})
export class DisciplineCasesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly disciplineService = inject(DisciplineService);
  private readonly toastr = inject(ToastrService);

  readonly workflowSteps = DISCIPLINE_WORKFLOW_STEPS;
  readonly severityOptions = DISCIPLINE_SEVERITY_OPTIONS;
  readonly categoryOptions = DISCIPLINE_CATEGORY_OPTIONS;
  readonly sanctionOptions = DISCIPLINE_SANCTION_OPTIONS;
  readonly mediationStatusOptions = DISCIPLINE_MEDIATION_STATUS_OPTIONS;
  readonly appealStatusOptions = DISCIPLINE_APPEAL_STATUS_OPTIONS;
  readonly confidentialityOptions = DISCIPLINE_CONFIDENTIALITY_OPTIONS;

  loading = false;
  showCreateForm = false;
  submitting = false;
  savingSelection = false;

  items: DisciplineCase[] = [];
  filteredItems: DisciplineCase[] = [];
  selectedCase: DisciplineCase | null = null;
  directionOptions: string[] = [];
  busyReferences = new Set<string>();

  stats: DisciplineStats = {
    total: 0,
    ouverts: 0,
    mediation: 0,
    sanctionsActives: 0,
    radiations: 0,
    recoursOuverts: 0,
    critiques: 0,
  };

  form = this.fb.nonNullable.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    category: ['Conflit interpersonnel', [Validators.required]],
    severity: ['Moyen', [Validators.required]],
    incidentOn: [this.todayIso(), [Validators.required]],
    openedOn: [this.todayIso(), [Validators.required]],
    status: ['Signale', [Validators.required]],
    mediationRequired: [true],
    confidentialLevel: ['Normal', [Validators.required]],
    infraction: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(180)]],
    summary: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(600)]],
  });

  filtersForm = this.fb.nonNullable.group({
    q: [''],
    status: ['Tous'],
    severity: ['Tous'],
    direction: ['Tous'],
    category: ['Tous'],
    radiation: ['Tous'],
    activeOnly: [true],
  });

  detailForm = this.fb.nonNullable.group({
    status: ['Signale', [Validators.required]],
    mediationStatus: ['Non requise', [Validators.required]],
    appealStatus: ['Aucun', [Validators.required]],
    sanctionType: [''],
    sanctionDurationDays: [0],
    sanctionStartOn: [''],
    sanctionEndOn: [''],
    decisionBy: [''],
    decisionOn: [''],
    summary: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(600)]],
    radiation: [false],
  });

  ngOnInit(): void {
    this.filtersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.applyFilters());

    this.loadCases();
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

  detailFieldError(fieldName: string): string | null {
    const control = this.detailForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
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

  saveCase(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: CreateDisciplineCasePayload = {
      reference: raw.reference.trim() || undefined,
      agent: raw.agent.trim(),
      direction: raw.direction.trim(),
      category: raw.category,
      severity: raw.severity,
      infraction: raw.infraction.trim(),
      incidentOn: raw.incidentOn,
      openedOn: raw.openedOn,
      status: raw.status,
      mediationRequired: raw.mediationRequired,
      confidentialLevel: raw.confidentialLevel,
      summary: raw.summary.trim(),
    };

    this.submitting = true;
    this.disciplineService
      .createCase(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (created) => {
          this.toastr.success('Dossier disciplinaire cree avec succes', 'Discipline', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.upsertCase(created);
          this.selectCase(created);
          this.refreshDerivedViews();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  selectCase(item: DisciplineCase): void {
    this.selectedCase = item;
    this.detailForm.patchValue({
      status: item.status,
      mediationStatus: item.mediationStatus,
      appealStatus: item.appealStatus,
      sanctionType: item.sanctionType || '',
      sanctionDurationDays: item.sanctionDurationDays || 0,
      sanctionStartOn: item.sanctionStartOn || '',
      sanctionEndOn: item.sanctionEndOn || '',
      decisionBy: item.decisionBy || '',
      decisionOn: item.decisionOn || '',
      summary: item.summary,
      radiation: item.radiation,
    });
    this.cdr.detectChanges();
  }

  saveSelectedCase(): void {
    if (!this.selectedCase || this.savingSelection) {
      return;
    }
    if (this.detailForm.invalid) {
      this.detailForm.markAllAsTouched();
      return;
    }

    const raw = this.detailForm.getRawValue();
    this.savingSelection = true;
    this.disciplineService
      .updateCase(this.selectedCase.reference, {
        status: raw.status,
        mediationStatus: raw.mediationStatus,
        appealStatus: raw.appealStatus,
        sanctionType: raw.sanctionType || undefined,
        sanctionDurationDays: raw.sanctionDurationDays > 0 ? raw.sanctionDurationDays : undefined,
        sanctionStartOn: raw.sanctionStartOn || undefined,
        sanctionEndOn: raw.sanctionEndOn || undefined,
        decisionBy: raw.decisionBy || undefined,
        decisionOn: raw.decisionOn || undefined,
        summary: raw.summary,
        radiation: raw.radiation,
      })
      .pipe(finalize(() => (this.savingSelection = false)))
      .subscribe({
        next: (updated) => {
          this.upsertCase(updated);
          this.selectCase(updated);
          this.refreshDerivedViews();
          this.toastr.success('Dossier mis a jour', 'Discipline', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  runAdvance(item: DisciplineCase): void {
    if (this.isBusy(item.reference)) {
      return;
    }

    this.setBusy(item.reference, true);
    this.disciplineService
      .advanceCase(item.reference)
      .pipe(finalize(() => this.setBusy(item.reference, false)))
      .subscribe({
        next: (updated) => {
          if (!updated) {
            this.toastr.warning('Dossier introuvable', 'Discipline', {
              timeOut: 2200,
              positionClass: 'toast-top-right',
            });
            return;
          }
          this.upsertCase(updated);
          if (this.selectedCase?.reference === updated.reference) {
            this.selectCase(updated);
          }
          this.refreshDerivedViews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  runRecommendedSanction(item: DisciplineCase): void {
    if (this.isBusy(item.reference)) {
      return;
    }

    this.setBusy(item.reference, true);
    this.disciplineService
      .applyRecommendedSanction(item.reference)
      .pipe(finalize(() => this.setBusy(item.reference, false)))
      .subscribe({
        next: (updated) => {
          if (!updated) return;
          this.upsertCase(updated);
          if (this.selectedCase?.reference === updated.reference) {
            this.selectCase(updated);
          }
          this.refreshDerivedViews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  closeCase(item: DisciplineCase): void {
    if (this.isBusy(item.reference) || item.status === 'Cloturee') {
      return;
    }
    this.setBusy(item.reference, true);
    this.disciplineService
      .updateCase(item.reference, { status: 'Cloturee' })
      .pipe(finalize(() => this.setBusy(item.reference, false)))
      .subscribe({
        next: (updated) => {
          this.upsertCase(updated);
          if (this.selectedCase?.reference === updated.reference) {
            this.selectCase(updated);
          }
          this.refreshDerivedViews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  clearSelection(): void {
    this.selectedCase = null;
    this.detailForm.reset({
      status: 'Signale',
      mediationStatus: 'Non requise',
      appealStatus: 'Aucun',
      sanctionType: '',
      sanctionDurationDays: 0,
      sanctionStartOn: '',
      sanctionEndOn: '',
      decisionBy: '',
      decisionOn: '',
      summary: '',
      radiation: false,
    });
  }

  resetFilters(): void {
    this.filtersForm.reset({
      q: '',
      status: 'Tous',
      severity: 'Tous',
      direction: 'Tous',
      category: 'Tous',
      radiation: 'Tous',
      activeOnly: true,
    });
  }

  workflowClass(item: DisciplineCase, step: string): string {
    const itemIndex = this.workflowSteps.indexOf(item.status);
    const stepIndex = this.workflowSteps.indexOf(step as (typeof DISCIPLINE_WORKFLOW_STEPS)[number]);
    if (stepIndex < 0 || itemIndex < 0) return 'workflow-step';
    if (stepIndex < itemIndex) return 'workflow-step done';
    if (stepIndex === itemIndex) return 'workflow-step current';
    return 'workflow-step';
  }

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'Signale':
      case 'Qualification':
        return 'bg-primary-transparent text-primary';
      case 'Mediation':
        return 'bg-info-transparent text-info';
      case 'Enquete':
      case 'Commission':
        return 'bg-warning-transparent text-warning';
      case 'Decision':
      case 'Execution':
        return 'bg-danger-transparent text-danger';
      case 'Cloturee':
        return 'bg-success-transparent text-success';
      default:
        return 'bg-light text-dark';
    }
  }

  severityBadgeClass(severity: string): string {
    switch (severity) {
      case 'Critique':
        return 'bg-danger-transparent text-danger';
      case 'Eleve':
        return 'bg-warning-transparent text-warning';
      case 'Moyen':
        return 'bg-info-transparent text-info';
      case 'Faible':
        return 'bg-success-transparent text-success';
      default:
        return 'bg-light text-dark';
    }
  }

  radiationLabel(item: DisciplineCase): string {
    return item.radiation ? 'Oui' : 'Non';
  }

  sanctionLabel(item: DisciplineCase): string {
    return item.sanction || item.sanctionType || '-';
  }

  isBusy(reference: string): boolean {
    return this.busyReferences.has(reference);
  }

  private loadCases(): void {
    this.loading = true;
    this.disciplineService
      .getCases({ limit: 2000, sortBy: 'openedOn', sortOrder: 'desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (items) => {
          this.items = [...items];
          this.refreshDerivedViews();
          this.syncSelectedCase();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.filteredItems = [];
          this.stats = this.disciplineService.computeStats([]);
          this.toastr.error(this.resolveError(error), 'Discipline', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private refreshDerivedViews(): void {
    this.applyFilters();
    this.stats = this.disciplineService.computeStats(this.items);
    this.directionOptions = Array.from(
      new Set(this.items.map((item) => item.direction).filter((item) => !!item))
    ).sort((a, b) => a.localeCompare(b));
  }

  private applyFilters(): void {
    const { q, status, severity, direction, category, radiation, activeOnly } = this.filtersForm.getRawValue();
    const search = q.trim().toLowerCase();

    this.filteredItems = this.items.filter((item) => {
      if (activeOnly && item.status === 'Cloturee') return false;
      if (status !== 'Tous' && item.status !== status) return false;
      if (severity !== 'Tous' && item.severity !== severity) return false;
      if (direction !== 'Tous' && item.direction !== direction) return false;
      if (category !== 'Tous' && item.category !== category) return false;
      if (radiation === 'Oui' && !item.radiation) return false;
      if (radiation === 'Non' && item.radiation) return false;

      if (!search) return true;
      const target = [
        item.reference,
        item.agent,
        item.direction,
        item.category,
        item.severity,
        item.infraction,
        item.summary,
        item.status,
        item.appealStatus,
        item.mediationStatus,
        item.sanction || item.sanctionType || '',
      ]
        .join(' ')
        .toLowerCase();
      return target.includes(search);
    });

    this.filteredItems.sort((left, right) => {
      const rightDate = new Date(right.openedOn).getTime();
      const leftDate = new Date(left.openedOn).getTime();
      return rightDate - leftDate;
    });
  }

  private syncSelectedCase(): void {
    if (!this.selectedCase) {
      return;
    }
    const refreshed = this.items.find((item) => item.reference === this.selectedCase?.reference);
    if (!refreshed) {
      this.clearSelection();
      return;
    }
    this.selectCase(refreshed);
  }

  private setBusy(reference: string, busy: boolean): void {
    if (busy) {
      this.busyReferences.add(reference);
      return;
    }
    this.busyReferences.delete(reference);
  }

  private upsertCase(item: DisciplineCase): void {
    const index = this.items.findIndex((entry) => entry.reference === item.reference);
    if (index >= 0) {
      this.items[index] = item;
      return;
    }
    this.items.unshift(item);
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      agent: '',
      direction: '',
      category: 'Conflit interpersonnel',
      severity: 'Moyen',
      incidentOn: this.todayIso(),
      openedOn: this.todayIso(),
      status: 'Signale',
      mediationRequired: true,
      confidentialLevel: 'Normal',
      infraction: '',
      summary: '',
    });
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
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
}
