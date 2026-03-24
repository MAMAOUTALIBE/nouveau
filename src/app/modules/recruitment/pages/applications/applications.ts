import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  Application,
  CreateApplicationPayload,
  RecruitmentService
} from '../../recruitment.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './applications.html',
})
export class ApplicationsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  items: Application[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Référence', 'Candidat', 'Poste', 'Campagne', 'Statut', 'Reçu le'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    candidate: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    campaign: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]+$/)]],
    status: ['Nouveau', [Validators.required]],
    receivedOn: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadApplications();
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

  saveApplication(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateApplicationPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      candidate: this.form.value.candidate?.trim() || '',
      position: this.form.value.position?.trim() || '',
      campaign: this.form.value.campaign?.trim().toUpperCase() || '',
      status: this.form.value.status?.trim() || 'Nouveau',
      receivedOn: this.form.value.receivedOn || '',
    };

    this.submitting = true;
    this.recruitmentService
      .createApplication(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Candidature creee avec succes', 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
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

  private loadApplications(): void {
    this.recruitmentService.getApplications().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((a) => [
            a.reference,
            a.candidate,
            a.position,
            a.campaign,
            a.status,
            a.receivedOn,
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
      reference: '',
      candidate: '',
      position: '',
      campaign: '',
      status: 'Nouveau',
      receivedOn: '',
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
