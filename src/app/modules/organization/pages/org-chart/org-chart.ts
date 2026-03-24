import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { CreateOrgUnitPayload, OrgUnit, OrganizationService } from '../../organization.service';

interface OrgNode {
  unit: OrgUnit;
  children: OrgNode[];
}

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './org-chart.html',
})
export class OrgChartPage implements OnInit {
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private toastr = inject(ToastrService);

  units: OrgUnit[] = [];
  roots: OrgNode[] = [];
  showCreateForm = false;
  submitting = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    parentId: [''],
    head: ['', [Validators.maxLength(120)]],
    headTitle: ['', [Validators.maxLength(120)]],
    staffCount: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
  });

  ngOnInit(): void {
    this.loadUnits();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'Valeur minimale: 0';
    if (control.errors['max']) return `Valeur maximale: ${control.errors['max'].max}`;
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  saveUnit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateOrgUnitPayload = {
      name: this.form.value.name?.trim() || '',
      parentId: this.form.value.parentId?.trim() || undefined,
      head: this.form.value.head?.trim() || undefined,
      headTitle: this.form.value.headTitle?.trim() || undefined,
      staffCount: Number(this.form.value.staffCount ?? 0),
    };

    this.submitting = true;
    this.organizationService
      .createOrgUnit(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Unite ajoutee avec succes', 'Organisation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadUnits();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Organisation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private buildTree(units: OrgUnit[]): OrgNode[] {
    const map = new Map<string, OrgNode>();
    units.forEach((u) => map.set(u.id, { unit: u, children: [] }));

    const roots: OrgNode[] = [];
    map.forEach((node) => {
      if (node.unit.parentId && map.has(node.unit.parentId)) {
        map.get(node.unit.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private loadUnits(): void {
    this.organizationService.getOrgUnits().subscribe({
      next: (units) => {
        this.units = units;
        this.roots = this.buildTree(units);
      },
      error: (error) => {
        this.units = [];
        this.roots = [];
        this.toastr.error(this.resolveError(error), 'Organisation', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
      },
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      parentId: '',
      head: '',
      headTitle: '',
      staffCount: 0,
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
