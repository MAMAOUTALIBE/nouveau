import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../core/utils/csv-export.utils';
import { WorkflowAction, WorkflowInstance, WorkflowStatus, WorkflowsService } from '../workflows/workflows.service';

@Component({
  selector: 'app-manager-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-portal.html',
})
export class ManagerPortalPage implements OnInit {
  private workflowsService = inject(WorkflowsService);
  private toastr = inject(ToastrService);

  showActionForm = false;
  isLoading = false;
  submitting = false;

  quick = [
    { label: 'Valider absences', desc: 'Demandes en attente', cta: 'Traiter' },
    { label: 'Suivi performance', desc: 'Evaluations de l equipe', cta: 'Consulter' },
    { label: 'Suivi presence', desc: 'Calendrier absences', cta: 'Voir' },
  ];

  pendingInstances: WorkflowInstance[] = [];
  selectedInstanceId = '';
  selectedAction: WorkflowAction = 'APPROUVER';
  actionNote = '';

  ngOnInit(): void {
    this.loadPendingInstances();
  }

  refresh(): void {
    this.loadPendingInstances();
  }

  toggleActionForm(): void {
    this.showActionForm = !this.showActionForm;
    if (!this.showActionForm) {
      this.resetActionForm();
    }
  }

  cancelAction(): void {
    this.showActionForm = false;
    this.resetActionForm();
  }

  submitAction(): void {
    if (this.submitting) {
      return;
    }

    if (!this.selectedInstanceId) {
      this.toastr.error('Selectionnez une instance a traiter', 'Portail manager', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.submitting = true;
    this.workflowsService
      .transitionInstance(this.selectedInstanceId, this.selectedAction, this.actionNote.trim())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Action enregistree avec succes', 'Portail manager', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.showActionForm = false;
          this.resetActionForm();
          this.loadPendingInstances();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Portail manager', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportTeam(): void {
    if (!this.pendingInstances.length) {
      return;
    }

    downloadCsv({
      filename: `manager-workflows-${this.exportDateSuffix()}.csv`,
      headers: ['ID', 'Workflow', 'Demandeur', 'Etape', 'Statut', 'Priorite', 'Echeance', 'Owner'],
      rows: this.pendingInstances.map((instance) => [
        instance.id,
        instance.definition,
        instance.requester,
        instance.currentStep,
        instance.status,
        instance.priority,
        instance.dueOn,
        instance.owner,
      ]),
      delimiter: ';',
    });
  }

  statusBadgeClass(status: WorkflowStatus): string {
    switch (status) {
      case 'EN_ATTENTE':
        return 'bg-warning-transparent';
      case 'EN_COURS':
        return 'bg-info-transparent';
      case 'ESCALADE':
        return 'bg-danger-transparent';
      case 'APPROUVE':
        return 'bg-success-transparent';
      case 'REJETE':
        return 'bg-danger-transparent';
      case 'EN_RETARD':
        return 'bg-danger-transparent';
      default:
        return 'bg-primary-transparent';
    }
  }

  private loadPendingInstances(): void {
    this.isLoading = true;
    this.workflowsService
      .getInstances()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (items) => {
          this.pendingInstances = items
            .filter((instance) => this.isPendingStatus(instance.status))
            .sort((left, right) => {
              const leftDue = Date.parse(left.dueOn || '');
              const rightDue = Date.parse(right.dueOn || '');
              const safeLeft = Number.isNaN(leftDue) ? Number.MAX_SAFE_INTEGER : leftDue;
              const safeRight = Number.isNaN(rightDue) ? Number.MAX_SAFE_INTEGER : rightDue;
              return safeLeft - safeRight;
            });

          if (this.selectedInstanceId) {
            const stillPresent = this.pendingInstances.some((instance) => instance.id === this.selectedInstanceId);
            if (!stillPresent) {
              this.selectedInstanceId = this.pendingInstances[0]?.id || '';
            }
          }

          if (!this.selectedInstanceId && this.pendingInstances.length) {
            this.selectedInstanceId = this.pendingInstances[0].id;
          }
        },
        error: (error) => {
          this.pendingInstances = [];
          this.toastr.error(this.resolveError(error), 'Portail manager', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private isPendingStatus(status: WorkflowStatus): boolean {
    return status === 'EN_ATTENTE' || status === 'EN_COURS' || status === 'ESCALADE';
  }

  private resetActionForm(): void {
    this.selectedAction = 'APPROUVER';
    this.actionNote = '';
    this.selectedInstanceId = this.pendingInstances[0]?.id || '';
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
