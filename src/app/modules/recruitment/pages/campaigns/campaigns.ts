import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  Campaign,
  CreateCampaignPayload,
  RecruitmentService
} from '../../recruitment.service';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './campaigns.html',
})
export class CampaignsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  items: Campaign[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Direction', 'Ouvertures', 'Début', 'Fin', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    department: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    openings: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    status: ['Planifiee', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadCampaigns();
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

  saveCampaign(): void {
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

    const payload: CreateCampaignPayload = {
      code: this.form.value.code?.trim() || undefined,
      title: this.form.value.title?.trim() || '',
      department: this.form.value.department?.trim() || '',
      openings: Number(this.form.value.openings ?? 1),
      startDate,
      endDate,
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

  private loadCampaigns(): void {
    this.recruitmentService.getCampaigns().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((c) => [
            c.code,
            c.title,
            c.department,
            c.openings,
            c.startDate,
            c.endDate,
            c.status,
          ]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Recrutement', {
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
      department: '',
      openings: 1,
      startDate: '',
      endDate: '',
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
}
