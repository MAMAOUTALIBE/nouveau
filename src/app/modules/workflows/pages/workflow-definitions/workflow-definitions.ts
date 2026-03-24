import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CreateWorkflowDefinitionPayload,
  WorkflowDefinition,
  WorkflowsService
} from '../../workflows.service';

@Component({
  selector: 'app-workflow-definitions',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './workflow-definitions.html',
})
export class WorkflowDefinitionsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private workflowsService = inject(WorkflowsService);
  private toastr = inject(ToastrService);

  items: WorkflowDefinition[] = [];
  showCreateForm = false;
  submitting = false;

  gridConfig = {
    columns: ['Code', 'Nom', 'Étapes', 'Usage', 'SLA (h)', 'Escalade auto', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    code: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    usedFor: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    steps: [3, [Validators.required, Validators.min(1), Validators.max(12)]],
    slaTargetHours: [48, [Validators.required, Validators.min(1), Validators.max(720)]],
    autoEscalation: [true],
    status: ['Actif', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadDefinitions();
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

  saveDefinition(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateWorkflowDefinitionPayload = {
      code: this.form.value.code?.trim() || undefined,
      name: this.form.value.name?.trim() || '',
      usedFor: this.form.value.usedFor?.trim() || '',
      steps: Number(this.form.value.steps ?? 1),
      slaTargetHours: Number(this.form.value.slaTargetHours ?? 48),
      autoEscalation: this.form.value.autoEscalation !== false,
      status: this.form.value.status?.trim() || 'Actif',
    };

    this.submitting = true;
    this.workflowsService
      .createDefinition(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Workflow cree avec succes', 'Workflows', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadDefinitions();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Workflows', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadDefinitions(): void {
    this.workflowsService.getDefinitions().subscribe({
      next: (items) => {
        this.items = items;
        this.gridConfig = {
          ...this.gridConfig,
          data: items.map((d) => [
            d.code,
            d.name,
            d.steps,
            d.usedFor,
            d.slaTargetHours,
            d.autoEscalation ? 'Oui' : 'Non',
            d.status,
          ]),
        };
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.gridConfig = { ...this.gridConfig, data: [] };
        this.toastr.error(this.resolveError(error), 'Workflows', {
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
      name: '',
      usedFor: '',
      steps: 3,
      slaTargetHours: 48,
      autoEscalation: true,
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
