import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  CreateTrainingSessionPayload,
  TrainingEnrollmentRequest,
  TrainingService,
  TrainingSession
} from '../../training.service';

@Component({
  selector: 'app-training-sessions',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './training-sessions.html',
})
export class TrainingSessionsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private trainingService = inject(TrainingService);
  private toastr = inject(ToastrService);

  items: TrainingSession[] = [];
  showCreateForm = false;
  submitting = false;
  isLoading = false;
  isRequestsLoading = false;
  requests: TrainingEnrollmentRequest[] = [];

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Dates', 'Lieu', 'Places', 'Inscrits', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    location: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    seats: [20, [Validators.required, Validators.min(1), Validators.max(1000)]],
    enrolled: [0, [Validators.required, Validators.min(0), Validators.max(1000)]],
    status: ['Ouverte', [Validators.required]],
  });

  filterForm = this.fb.group({
    q: [''],
    status: [''],
    location: [''],
  });

  readonly statusOptions = ['', 'Ouverte', 'Complete', 'Planifiee', 'Annulee'];

  ngOnInit(): void {
    this.loadSessions();
    this.loadRequests();
  }

  get totalSessions(): number {
    return this.items.length;
  }

  get openSessions(): number {
    return this.items.filter((item) => this.normalizeStatus(item.status) === 'ouverte').length;
  }

  get fullSessions(): number {
    return this.items.filter((item) => this.normalizeStatus(item.status) === 'complete' || item.enrolled >= item.seats)
      .length;
  }

  get availableSeats(): number {
    return this.items.reduce((total, item) => total + Math.max(item.seats - item.enrolled, 0), 0);
  }

  get totalPendingRequests(): number {
    return this.requests.filter((item) => this.normalizeRequestStatus(item.status) === 'soumise').length;
  }

  get sessionRequestSummaries(): Array<{
    session: TrainingSession;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    availableSeats: number;
    fillRate: number;
  }> {
    return this.items.map((session) => {
      const requests = this.requestsForSession(session.code);
      const pendingCount = requests.filter((item) => this.normalizeRequestStatus(item.status) === 'soumise').length;
      const approvedCount = requests.filter((item) => this.normalizeRequestStatus(item.status) === 'validee').length;
      const rejectedCount = requests.filter((item) => this.normalizeRequestStatus(item.status) === 'rejetee').length;
      const availableSeats = Math.max(session.seats - session.enrolled, 0);
      const fillRate = session.seats > 0 ? Math.round((session.enrolled / session.seats) * 100) : 0;

      return {
        session,
        pendingCount,
        approvedCount,
        rejectedCount,
        availableSeats,
        fillRate,
      };
    });
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

  applyFilters(): void {
    this.loadSessions();
  }

  resetFilters(): void {
    this.filterForm.reset({
      q: '',
      status: '',
      location: '',
    });
    this.loadSessions();
  }

  refresh(): void {
    this.loadSessions();
    this.loadRequests();
  }

  exportSessions(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `training-sessions-${this.exportDateSuffix()}.csv`,
      headers: [
        'Code',
        'Intitule',
        'Dates',
        'Lieu',
        'Places',
        'Inscrits',
        'Places disponibles',
        'Taux remplissage',
        'Demandes en attente',
        'Demandes validees',
        'Demandes rejetees',
        'Statut',
      ],
      rows: this.sessionRequestSummaries.map((summary) => [
        summary.session.code,
        summary.session.title,
        summary.session.dates,
        summary.session.location,
        summary.session.seats,
        summary.session.enrolled,
        summary.availableSeats,
        `${summary.fillRate}%`,
        summary.pendingCount,
        summary.approvedCount,
        summary.rejectedCount,
        summary.session.status,
      ]),
      delimiter: ';',
    });
  }

  statusBadgeClass(status: string): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'ouverte') {
      return 'bg-success-transparent';
    }
    if (normalized === 'complete') {
      return 'bg-danger-transparent';
    }
    if (normalized === 'planifiee') {
      return 'bg-warning-transparent';
    }
    if (normalized === 'annulee') {
      return 'bg-secondary-transparent';
    }
    return 'bg-primary-transparent';
  }

  trackBySessionCode(
    _index: number,
    item: {
      session: TrainingSession;
    }
  ): string {
    return item.session.code;
  }

  saveSession(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const startDate = this.form.value.startDate || '';
    const endDate = this.form.value.endDate || '';
    const startTimestamp = Date.parse(startDate);
    const endTimestamp = Date.parse(endDate);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Formation', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const seats = Number(this.form.value.seats ?? 0);
    const enrolled = Number(this.form.value.enrolled ?? 0);
    if (enrolled > seats) {
      this.toastr.error('Le nombre d inscrits ne peut pas depasser le nombre de places', 'Formation', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateTrainingSessionPayload = {
      code: this.form.value.code?.trim() || undefined,
      title: this.form.value.title?.trim() || '',
      dates: `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`,
      location: this.form.value.location?.trim() || '',
      seats,
      enrolled,
      status: this.form.value.status?.trim() || 'Ouverte',
    };

    this.submitting = true;
    this.trainingService
      .createSession(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Session de formation creee avec succes', 'Formation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadSessions();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadSessions(): void {
    const filters = this.filterForm.getRawValue();
    this.isLoading = true;
    this.trainingService
      .getSessions({
        page: 1,
        limit: 200,
        sortBy: 'title',
        sortOrder: 'asc',
        q: this.normalizeFilter(filters.q),
        status: this.normalizeFilter(filters.status),
        location: this.normalizeFilter(filters.location),
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (items) => {
          this.items = items;
          this.gridConfig = {
            ...this.gridConfig,
            data: items.map((s) => [
              s.code,
              s.title,
              s.dates,
              s.location,
              s.seats,
              s.enrolled,
              s.status,
            ]),
          };
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.gridConfig = { ...this.gridConfig, data: [] };
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadRequests(): void {
    this.isRequestsLoading = true;
    this.trainingService
      .getRequests({
        page: 1,
        limit: 500,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .pipe(
        finalize(() => {
          this.isRequestsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (items) => {
          this.requests = items;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.requests = [];
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      code: '',
      title: '',
      startDate: '',
      endDate: '',
      location: '',
      seats: 20,
      enrolled: 0,
      status: 'Ouverte',
    });
  }

  private formatDate(dateIso: string): string {
    const timestamp = Date.parse(dateIso);
    if (Number.isNaN(timestamp)) {
      return dateIso;
    }
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private normalizeFilter(value: string | null | undefined): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private normalizeStatus(status: string): string {
    return String(status || '').trim().toLowerCase();
  }

  private normalizeRequestStatus(status: string): string {
    return String(status || '').trim().toLowerCase();
  }

  private requestsForSession(sessionCode: string): TrainingEnrollmentRequest[] {
    const normalizedCode = String(sessionCode || '').trim().toUpperCase();
    return this.requests.filter((item) => String(item.sessionCode || '').trim().toUpperCase() === normalizedCode);
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
