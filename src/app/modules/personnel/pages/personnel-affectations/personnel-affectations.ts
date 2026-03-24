import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  CreatePersonnelAffectationPayload,
  PersonnelAffectation,
  PersonnelService,
} from '../../personnel.service';

@Component({
  selector: 'app-personnel-affectations',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './personnel-affectations.html',
})
export class PersonnelAffectationsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private personnelService = inject(PersonnelService);
  private toastr = inject(ToastrService);

  items: PersonnelAffectation[] = [];
  showCreateForm = false;
  isLoading = false;
  submitting = false;

  gridConfig = {
    columns: ['Reference', 'Agent', 'Structure source', 'Structure cible', 'Date effective', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    fromUnit: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    toUnit: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    effectiveDate: ['', [Validators.required]],
    status: ['Planifiee', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadItems();
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

  saveAffectation(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const fromUnit = this.form.value.fromUnit?.trim() || '';
    const toUnit = this.form.value.toUnit?.trim() || '';
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
      this.toastr.error('La structure source et la structure cible doivent etre differentes', 'Personnel', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const effectiveDate = this.form.value.effectiveDate || '';
    const parsed = Date.parse(effectiveDate);
    if (Number.isNaN(parsed)) {
      this.toastr.error('Date effective invalide', 'Personnel', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreatePersonnelAffectationPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agent: this.form.value.agent?.trim() || '',
      fromUnit,
      toUnit,
      effectiveDate: new Date(parsed).toISOString().slice(0, 10),
      status: this.form.value.status?.trim() || 'Planifiee',
    };

    this.submitting = true;
    this.personnelService
      .createAffectation(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Affectation enregistree avec succes', 'Personnel', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadItems();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Personnel', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportItems(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `personnel-affectations-${this.exportDateSuffix()}.csv`,
      headers: ['Reference', 'Agent', 'Source', 'Cible', 'DateEffective', 'Statut'],
      rows: this.items.map((item) => [
        item.reference,
        item.agent,
        item.fromUnit,
        item.toUnit,
        item.effectiveDate,
        item.status,
      ]),
      delimiter: ';',
    });
  }

  private loadItems(): void {
    this.isLoading = true;
    this.personnelService
      .getAffectations({
        page: 1,
        limit: 200,
        sortBy: 'effectiveDate',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.gridConfig = {
            ...this.gridConfig,
            data: items.map((item) => [
              item.reference,
              item.agent,
              item.fromUnit,
              item.toUnit,
              item.effectiveDate,
              item.status,
            ]),
          };
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.gridConfig = { ...this.gridConfig, data: [] };
          this.toastr.error(this.resolveError(error), 'Personnel', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      agent: '',
      fromUnit: '',
      toUnit: '',
      effectiveDate: '',
      status: 'Planifiee',
    });
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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
