import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  AdminRole,
  AdminService,
  CreateAdminRolePayload
} from '../../admin.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './admin-roles.html',
})
export class AdminRolesPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);

  items: AdminRole[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Rôle', 'Description', 'Permissions'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40), Validators.pattern(/^[a-z0-9_-]+$/)]],
    description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    permissions: [1, [Validators.required, Validators.min(1), Validators.max(200)]],
  });

  ngOnInit(): void {
    this.loadRoles();
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
    if (control.errors['pattern']) return 'Format invalide (a-z, 0-9, _, -)';
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

  saveRole(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateAdminRolePayload = {
      name: this.form.value.name?.trim() || '',
      description: this.form.value.description?.trim() || '',
      permissions: Number(this.form.value.permissions ?? 1),
    };

    this.submitting = true;
    this.adminService
      .createRole(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Role cree avec succes', 'Administration', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadRoles();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Administration', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadRoles(): void {
    this.adminService.getRoles().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((r) => [r.name, r.description, r.permissions]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Administration', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      permissions: 1,
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
