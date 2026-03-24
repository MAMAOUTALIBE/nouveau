import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import { CreateLeaveRequestPayload, LeaveRequest, LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GridJsAngularComponent],
  templateUrl: './leave-requests.html',
})
export class LeaveRequestsPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private leaveService = inject(LeaveService);
  private toastr = inject(ToastrService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'En attente', label: 'En attente' },
    { value: 'En cours', label: 'En cours' },
    { value: 'Approuve', label: 'Approuve' },
    { value: 'Rejete', label: 'Rejete' },
  ];

  typeOptions = [
    { value: 'all', label: 'Tous les types' },
    { value: 'Conge annuel', label: 'Conge annuel' },
    { value: 'Maladie', label: 'Maladie' },
    { value: 'Mission', label: 'Mission' },
    { value: 'Conge maternité', label: 'Conge maternite' },
    { value: 'Conge sans solde', label: 'Conge sans solde' },
  ];

  selectedStatus = 'all';
  selectedType = 'all';
  searchTerm = '';
  isLoading = false;
  showCreateForm = false;
  submitting = false;
  currentRequests: LeaveRequest[] = [];

  gridConfig = {
    columns: ['Référence', 'Agent', 'Type', 'Début', 'Fin', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    type: ['Conge annuel', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['En attente', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  onFilterChange(): void {
    this.loadRequests();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadRequests();
    }, 250);
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

  saveRequest(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const startDate = this.form.value.startDate || '';
    const endDate = this.form.value.endDate || '';
    const startTimestamp = Date.parse(startDate);
    const endTimestamp = Date.parse(endDate);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Absences', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateLeaveRequestPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agent: this.form.value.agent?.trim() || '',
      type: this.form.value.type?.trim() || '',
      startDate,
      endDate,
      status: this.form.value.status?.trim() || 'En attente',
    };

    this.submitting = true;
    this.leaveService
      .createRequest(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Demande d absence creee avec succes', 'Absences', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadRequests();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Absences', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadRequests(): void {
    this.isLoading = true;
    this.leaveService
      .getRequests({
        q: this.searchTerm,
        status: this.selectedStatus === 'all' ? undefined : this.selectedStatus,
        type: this.selectedType === 'all' ? undefined : this.selectedType,
        page: 1,
        limit: 200,
        sortBy: 'startDate',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (rows) => {
          this.currentRequests = rows;
          this.gridConfig = {
            ...this.gridConfig,
            data: rows.map((r) => [r.reference, r.agent, r.type, r.startDate, r.endDate, r.status]),
          };
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.currentRequests = [];
          this.gridConfig = { ...this.gridConfig, data: [] };
          this.toastr.error(this.resolveError(error), 'Absences', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  exportRequests(): void {
    if (!this.currentRequests.length) {
      return;
    }

    downloadCsv({
      filename: `absences-${this.exportDateSuffix()}.csv`,
      headers: ['Reference', 'Agent', 'Type', 'Debut', 'Fin', 'Statut'],
      rows: this.currentRequests.map((request) => [
        request.reference,
        request.agent,
        request.type,
        request.startDate,
        request.endDate,
        request.status,
      ]),
      delimiter: ';',
    });
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      agent: '',
      type: 'Conge annuel',
      startDate: '',
      endDate: '',
      status: 'En attente',
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
}
