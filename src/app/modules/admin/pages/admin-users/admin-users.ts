import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  AdminService,
  AdminUser,
  CreateAdminUserPayload
} from '../../admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './admin-users.html',
})
export class AdminUsersPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private adminService = inject(AdminService);
  private toastr = inject(ToastrService);

  items: AdminUser[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Utilisateur', 'Nom', 'Rôle', 'Direction', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    username: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    role: ['manager', [Validators.required]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    status: ['Actif', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['email']) return 'Email invalide';
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

  saveUser(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateAdminUserPayload = {
      username: this.form.value.username?.trim().toLowerCase() || '',
      fullName: this.form.value.fullName?.trim() || '',
      role: this.form.value.role?.trim() || 'manager',
      direction: this.form.value.direction?.trim() || '',
      status: this.form.value.status?.trim() || 'Actif',
    };

    this.submitting = true;
    this.adminService
      .createUser(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Utilisateur cree avec succes', 'Administration', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadUsers();
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

  private loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((u) => [u.username, u.fullName, u.role, u.direction, u.status]),
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
      username: '',
      fullName: '',
      role: 'manager',
      direction: '',
      status: 'Actif',
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
