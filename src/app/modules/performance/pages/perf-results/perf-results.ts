import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreatePerfResultPayload,
  PerfResult,
  PerformanceService
} from '../../performance.service';

@Component({
  selector: 'app-perf-results',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './perf-results.html',
})
export class PerfResultsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private performanceService = inject(PerformanceService);
  private toastr = inject(ToastrService);

  items: PerfResult[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Agent', 'Direction', 'Auto-éval', 'Manager', 'Score final', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    selfScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    managerScore: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    finalScore: [''],
    status: ['En revue', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadResults();
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

  saveResult(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const selfScore = Number(this.form.value.selfScore ?? 0);
    const managerScore = Number(this.form.value.managerScore ?? 0);
    const finalScoreRaw = String(this.form.value.finalScore || '').trim();
    const finalScore = finalScoreRaw.length ? Number(finalScoreRaw) : Math.round((selfScore + managerScore) / 2);

    if (!Number.isFinite(finalScore) || finalScore < 0 || finalScore > 100) {
      this.toastr.error('Score final invalide (0 a 100)', 'Evaluation', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreatePerfResultPayload = {
      agent: this.form.value.agent?.trim() || '',
      direction: this.form.value.direction?.trim() || '',
      selfScore,
      managerScore,
      finalScore,
      status: this.form.value.status?.trim() || 'En revue',
    };

    this.submitting = true;
    this.performanceService
      .createResult(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Resultat evaluation enregistre avec succes', 'Evaluation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadResults();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Evaluation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadResults(): void {
    this.performanceService.getResults().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((r) => [
            r.agent,
            r.direction,
            r.selfScore,
            r.managerScore,
            r.finalScore,
            r.status,
          ]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Evaluation', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      agent: '',
      direction: '',
      selfScore: 0,
      managerScore: 0,
      finalScore: '',
      status: 'En revue',
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
