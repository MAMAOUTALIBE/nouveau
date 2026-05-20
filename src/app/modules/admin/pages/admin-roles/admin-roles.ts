import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  AdminRole,
  AdminService,
  CreateAdminRolePayload
} from '../../admin.service';
import { APP_PERMISSIONS } from '../../../../core/security/access-control.service';

interface PermissionOption {
  key: string;
  label: string;
}

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
  deleting = false;
  editingName: string | null = null;
  permissionOptions: PermissionOption[] = Object.entries(APP_PERMISSIONS).map(
    ([, value]) => ({ key: value, label: value })
  );
  selectedPermissions = new Set<string>();
  private hasPermissionSelectionChanged = false;

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
    this.seedPermissionsSelection(1);
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
    this.editingName = null;
    this.showCreateForm = !this.showCreateForm;
    this.resetForm();
    this.cdr.detectChanges();
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.editingName = null;
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveRole(): void {
    const permissionCountRaw = this.hasPermissionSelectionChanged
      ? this.selectedPermissions.size
      : Number(this.form.value.permissions ?? 0);
    const permissionCount = Number.isFinite(permissionCountRaw)
      ? Math.round(permissionCountRaw)
      : 0;

    this.form.patchValue({ permissions: permissionCount });

    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateAdminRolePayload = {
      name: this.form.value.name?.trim() || '',
      description: this.form.value.description?.trim() || '',
      permissions: permissionCount || 1,
    };

    this.submitting = true;
    const action$ = this.editingName
      ? this.adminService.updateRole({ ...payload, name: this.editingName })
      : this.adminService.createRole(payload);

    action$
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success(this.editingName ? 'Rôle mis à jour' : 'Rôle créé', 'Administration', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.editingName = null;
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
          data: items.map((r) => [r.name, r.description, this.permissionLabel(r.permissions)]),
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

  permissionLabel(count: number): string {
    const safe = Number.isFinite(count) ? count : 0;
    return safe === 1 ? '1 permission' : `${safe} permissions`;
  }

  displayedPermissionCount(): number {
    const raw = this.hasPermissionSelectionChanged
      ? this.selectedPermissions.size
      : Number(this.form.value.permissions ?? 0);
    return Number.isFinite(raw) ? Math.round(raw) : 0;
  }

  togglePermission(option: PermissionOption, checked: boolean): void {
    this.hasPermissionSelectionChanged = true;
    if (checked) {
      this.selectedPermissions.add(option.key);
    } else {
      this.selectedPermissions.delete(option.key);
    }
    this.form.patchValue({ permissions: this.selectedPermissions.size });
  }

  startEdit(role: AdminRole): void {
    if (this.submitting) return;
    this.editingName = role.name;
    this.showCreateForm = true;
    this.form.patchValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    this.seedPermissionsSelection(role.permissions);
    this.cdr.detectChanges();
  }

  deleteRole(role: AdminRole): void {
    if (this.deleting || !confirm(`Supprimer le rôle ${role.name} ?`)) return;
    this.deleting = true;
    this.adminService
      .deleteRole(role.name)
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Rôle supprimé', 'Administration', { timeOut: 2200 });
          this.loadRoles();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Administration', { timeOut: 3500 });
        },
      });
  }

  exportCsv(): void {
    this.adminService.getRoles().subscribe({
      next: (items) => {
        downloadCsv({
          filename: 'admin-roles.csv',
          delimiter: ';',
          headers: ['name', 'description', 'permissions'],
          rows: items.map((role) => [role.name, role.description, role.permissions]),
        });
      },
      error: (error) => {
        this.toastr.error(this.resolveError(error), 'Export CSV', { timeOut: 3000 });
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      description: '',
      permissions: 1,
    });
    this.seedPermissionsSelection(1);
  }

  private seedPermissionsSelection(count: number): void {
    const safeCount = Math.max(
      0,
      Math.min(this.permissionOptions.length, Number.isFinite(count) ? Math.round(count) : 0)
    );
    this.selectedPermissions = new Set(
      this.permissionOptions.slice(0, safeCount).map((option) => option.key)
    );
    this.hasPermissionSelectionChanged = false;
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
