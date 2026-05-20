import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GridJsAngularComponent } from 'gridjs-angular';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  AgentListItem,
  CreatePersonnelAffectationPayload,
  PersonnelAffectation,
  PersonnelService,
} from '../../personnel.service';

@Component({
  selector: 'app-personnel-affectations',
  standalone: true,
  imports: [CommonModule, GridJsAngularComponent, ReactiveFormsModule],
  templateUrl: './personnel-affectations.html',
})
export class PersonnelAffectationsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private personnelService = inject(PersonnelService);
  private toastr = inject(ToastrService);

  items: PersonnelAffectation[] = [];
  agents: AgentListItem[] = [];
  showCreateForm = false;
  isLoading = false;
  loadingAgents = false;
  submitting = false;
  agentLookupValue = '';

  gridConfig = {
    columns: ['Reference', 'Agent', 'Structure source', 'Structure cible', 'Date effective', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agentId: ['', [Validators.required]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    fromUnit: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    toUnit: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    effectiveDate: ['', [Validators.required]],
    status: ['Planifiee', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadAgents();
    this.loadItems();
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

  saveAffectation(): void {
    if (!this.form.get('agentId')?.value) {
      this.form.get('agentId')?.markAsTouched();
      return;
    }

    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const fromUnit = this.form.value.fromUnit?.trim() || '';
    const toUnit = this.form.value.toUnit?.trim() || '';
    if (fromUnit.toLowerCase() === toUnit.toLowerCase()) {
      this.toastr.error('La structure source et la structure cible doivent etre differentes', 'Personnel', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const effectiveDate = this.form.value.effectiveDate || '';
    const parsed = Date.parse(effectiveDate);
    if (Number.isNaN(parsed)) {
      this.toastr.error('Date effective invalide', 'Personnel', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreatePersonnelAffectationPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agentId: this.form.value.agentId?.trim() || undefined,
      agent: this.form.value.agent?.trim() || '',
      fromUnit,
      toUnit,
      effectiveDate: new Date(parsed).toISOString().slice(0, 10),
      status: this.form.value.status?.trim() || 'Planifiee',
    };

    this.submitting = true;
    this.personnelService
      .createAffectation(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Affectation enregistree avec succes', 'Personnel', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadItems();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Personnel', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportItems(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `personnel-affectations-${this.exportDateSuffix()}.csv`,
      headers: ['Reference', 'Agent', 'Source', 'Cible', 'DateEffective', 'Statut'],
      rows: this.items.map((item) => [
        item.reference,
        item.agent,
        item.fromUnit,
        item.toUnit,
        item.effectiveDate,
        item.status,
      ]),
      delimiter: ';',
    });
  }

  onAgentLookupInput(value: string): void {
    this.agentLookupValue = value;
    const match = this.findAgentByLookup(value);
    if (!match) {
      this.form.patchValue({ agentId: '', agent: '' }, { emitEvent: false });
      return;
    }
    this.applyAgentSelection(match);
  }

  onAgentLookupBlur(): void {
    const match = this.findAgentByLookup(this.agentLookupValue);
    if (match) {
      this.applyAgentSelection(match);
      return;
    }
    this.form.get('agentId')?.markAsTouched();
  }

  agentSelectionError(): string | null {
    const control = this.form.get('agentId');
    if (!control?.touched || control.value) {
      return null;
    }
    return 'Selectionnez un agent existant';
  }

  agentLookupLabel(agent: AgentListItem): string {
    return `${agent.fullName} (${agent.matricule})`;
  }

  selectedAgentSummary(): string {
    const selectedId = String(this.form.get('agentId')?.value || '').trim();
    if (!selectedId) {
      return '';
    }
    const selected = this.agents.find((item) => item.id === selectedId);
    if (!selected) {
      return '';
    }
    return `${selected.direction} / ${selected.unit || 'Sans unite'} - ${selected.position}`;
  }

  private loadItems(): void {
    this.isLoading = true;
    this.personnelService
      .getAffectations({
        page: 1,
        limit: 200,
        sortBy: 'effectiveDate',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (items) => {
          this.items = items;
          this.gridConfig = {
            ...this.gridConfig,
            data: items.map((item) => [
              item.reference,
              item.agent,
              item.fromUnit,
              item.toUnit,
              item.effectiveDate,
              item.status,
            ]),
          };
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.gridConfig = { ...this.gridConfig, data: [] };
          this.toastr.error(this.resolveError(error), 'Personnel', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadAgents(): void {
    this.loadingAgents = true;
    this.personnelService
      .getAgents({
        page: 1,
        limit: 500,
        sortBy: 'fullName',
        sortOrder: 'asc',
      })
      .pipe(finalize(() => (this.loadingAgents = false)))
      .subscribe({
        next: (items) => {
          this.agents = items;
        },
        error: () => {
          this.agents = [];
        },
      });
  }

  private resetForm(): void {
    this.agentLookupValue = '';
    this.form.reset({
      reference: '',
      agentId: '',
      agent: '',
      fromUnit: '',
      toUnit: '',
      effectiveDate: '',
      status: 'Planifiee',
    });
  }

  private findAgentByLookup(value: string): AgentListItem | null {
    const normalizedInput = this.normalizeText(value);
    if (!normalizedInput) {
      return null;
    }

    return (
      this.agents.find((item) => {
        return [this.agentLookupLabel(item), item.fullName, item.matricule]
          .map((candidate) => this.normalizeText(candidate))
          .some((candidate) => !!candidate && candidate === normalizedInput);
      }) || null
    );
  }

  private applyAgentSelection(agent: AgentListItem): void {
    this.agentLookupValue = this.agentLookupLabel(agent);
    this.form.patchValue(
      {
        agentId: agent.id,
        agent: agent.fullName,
      },
      { emitEvent: false }
    );
  }

  private normalizeText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
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
