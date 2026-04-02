import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  CreateTrainingCoursePayload,
  TrainingCourse,
  TrainingService
} from '../../training.service';

@Component({
  selector: 'app-training-catalog',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './training-catalog.html',
})
export class TrainingCatalogPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private trainingService = inject(TrainingService);
  private toastr = inject(ToastrService);

  items: TrainingCourse[] = [];
  showCreateForm = false;
  submitting = false;
  isLoading = false;

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Durée', 'Modalité', 'Domaine'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    duration: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    modality: ['Presentiel', [Validators.required]],
    domain: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  filterForm = this.fb.group({
    q: [''],
    modality: [''],
    domain: [''],
  });

  readonly modalityOptions = ['', 'Presentiel', 'Distanciel', 'Hybride'];

  ngOnInit(): void {
    this.loadCatalog();
  }

  get totalCourses(): number {
    return this.items.length;
  }

  get classroomCourses(): number {
    return this.items.filter((item) => this.normalizeValue(item.modality) === 'presentiel').length;
  }

  get remoteCourses(): number {
    return this.items.filter((item) => this.normalizeValue(item.modality) === 'distanciel').length;
  }

  get hybridCourses(): number {
    return this.items.filter((item) => this.normalizeValue(item.modality) === 'hybride').length;
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

  applyFilters(): void {
    this.loadCatalog();
  }

  resetFilters(): void {
    this.filterForm.reset({
      q: '',
      modality: '',
      domain: '',
    });
    this.loadCatalog();
  }

  refresh(): void {
    this.loadCatalog();
  }

  exportCatalog(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `training-catalog-${this.exportDateSuffix()}.csv`,
      headers: ['Code', 'Intitule', 'Duree', 'Modalite', 'Domaine'],
      rows: this.items.map((item) => [item.code, item.title, item.duration, item.modality, item.domain]),
      delimiter: ';',
    });
  }

  saveCourse(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateTrainingCoursePayload = {
      code: this.form.value.code?.trim() || undefined,
      title: this.form.value.title?.trim() || '',
      duration: this.form.value.duration?.trim() || '',
      modality: this.form.value.modality?.trim() || 'Presentiel',
      domain: this.form.value.domain?.trim() || '',
    };

    this.submitting = true;
    this.trainingService
      .createCourse(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Formation ajoutee au catalogue avec succes', 'Formation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadCatalog();
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

  private loadCatalog(): void {
    const filters = this.filterForm.getRawValue();
    this.isLoading = true;
    this.trainingService
      .getCatalog({
        page: 1,
        limit: 200,
        sortBy: 'title',
        sortOrder: 'asc',
        q: this.normalizeFilter(filters.q),
        modality: this.normalizeFilter(filters.modality),
        domain: this.normalizeFilter(filters.domain),
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
            data: items.map((c) => [c.code, c.title, c.duration, c.modality, c.domain]),
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

  private resetForm(): void {
    this.form.reset({
      code: '',
      title: '',
      duration: '',
      modality: 'Presentiel',
      domain: '',
    });
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private normalizeFilter(value: string | null | undefined): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private normalizeValue(value: string): string {
    return String(value || '').trim().toLowerCase();
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
