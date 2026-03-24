import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CareerMove, CareersService, CreateCareerMovePayload } from '../../careers.service';

@Component({
  selector: 'app-secondments',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './secondments.html',
})
export class SecondmentsPage implements OnInit {
  private readonly moveType: CareerMove['type'] = 'Détachement';
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private careersService = inject(CareersService);
  private toastr = inject(ToastrService);

  items: CareerMove[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Référence', 'Agent', 'Origine', 'Accueil', 'Date effet', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    from: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(120)]],
    to: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(120)]],
    effectiveDate: ['', [Validators.required]],
    status: ['En attente', [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
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

  saveMove(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateCareerMovePayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agent: this.form.value.agent?.trim() || '',
      type: this.moveType,
      from: this.form.value.from?.trim() || undefined,
      to: this.form.value.to?.trim() || '',
      effectiveDate: this.form.value.effectiveDate || '',
      status: this.form.value.status || 'En attente',
    };

    this.submitting = true;
    this.careersService
      .createMove(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Detachement enregistre avec succes', 'Carriere', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.load();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Carriere', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private load(): void {
    this.careersService.getMovesByType(this.moveType).subscribe({
      next: (items: CareerMove[]) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((m) => [m.reference, m.agent, m.from || '—', m.to, m.effectiveDate, m.status]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Carriere', {
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
      from: '',
      to: '',
      effectiveDate: '',
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
