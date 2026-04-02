import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreateVacantPositionPayload,
  OrganizationService,
  VacantPosition
} from '../../organization.service';

@Component({
  selector: 'app-vacant-positions',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './vacant-positions.html',
})
export class VacantPositionsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private organizationService = inject(OrganizationService);
  private toastr = inject(ToastrService);

  items: VacantPosition[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Code', 'Structure', 'Intitulé', 'Grade', 'Ouvert depuis', 'Priorité'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    structure: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    grade: ['', [Validators.required, Validators.maxLength(20)]],
    openedOn: ['', [Validators.required]],
    priority: ['Normale', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadPositions();
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

  savePosition(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateVacantPositionPayload = {
      code: this.form.value.code?.trim() || undefined,
      structure: this.form.value.structure?.trim() || '',
      title: this.form.value.title?.trim() || '',
      grade: this.form.value.grade?.trim() || '',
      openedOn: this.form.value.openedOn || '',
      priority: (this.form.value.priority as 'Haute' | 'Normale' | 'Basse') || 'Normale',
    };

    this.submitting = true;
    this.organizationService
      .createVacantPosition(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Poste vacant publie avec succes', 'Organisation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadPositions();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Organisation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadPositions(): void {
    this.organizationService.getVacantPositions().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((p) => [
            p.code,
            p.structure,
            p.title,
            p.grade,
            p.openedOn,
            p.priority,
          ]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Organisation', {
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
      structure: '',
      title: '',
      grade: '',
      openedOn: '',
      priority: 'Normale',
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

    return "Operation impossible pour le moment";
  }
}
