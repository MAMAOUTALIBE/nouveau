import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreateOnboardingPayload,
  OnboardingItem,
  RecruitmentService
} from '../../recruitment.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './onboarding.html',
})
export class OnboardingPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  items: OnboardingItem[] = [];
  showCreateForm = false;
  submitting = false;

  form = this.fb.group({
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    startDate: ['', [Validators.required]],
    checklistText: ['', [Validators.maxLength(1200)]],
    status: ['Planifie', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadOnboarding();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
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

  saveOnboarding(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const checklist = String(this.form.value.checklistText || '')
      .split(/[\n;,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload: CreateOnboardingPayload = {
      agent: this.form.value.agent?.trim() || '',
      position: this.form.value.position?.trim() || '',
      startDate: this.form.value.startDate || '',
      checklist,
      status: this.form.value.status?.trim() || 'Planifie',
    };

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

  private resetForm(): void {
    this.form.reset({
      agent: '',
      position: '',
      startDate: '',
      checklistText: '',
      status: 'Planifie',
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
