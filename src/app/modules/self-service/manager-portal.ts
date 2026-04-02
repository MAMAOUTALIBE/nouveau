import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../core/utils/csv-export.utils';
import { DocumentRequest, DocumentsService } from '../documents/documents.service';
import { TrainingEnrollmentRequest, TrainingService } from '../training/training.service';
import { WorkflowAction, WorkflowInstance, WorkflowStatus, WorkflowsService } from '../workflows/workflows.service';

@Component({
  selector: 'app-manager-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manager-portal.html',
})
export class ManagerPortalPage implements OnInit {
  private workflowsService = inject(WorkflowsService);
  private trainingService = inject(TrainingService);
  private documentsService = inject(DocumentsService);
  private toastr = inject(ToastrService);

  showActionForm = false;
  isLoading = false;
  isTrainingLoading = false;
  isDocumentLoading = false;
  submitting = false;
  trainingUpdatingReference = '';
  documentUpdatingReference = '';

  quick = [
    { label: 'Valider formations', desc: 'Demandes a arbitrer', cta: 'Traiter' },
    { label: 'Valider documents', desc: 'Demandes de l equipe', cta: 'Traiter' },
    { label: 'Rafraichir le portail', desc: 'Mettre a jour les files', cta: 'Actualiser' },
  ];

  pendingInstances: WorkflowInstance[] = [];
  pendingTrainingRequests: TrainingEnrollmentRequest[] = [];
  pendingDocumentRequests: DocumentRequest[] = [];
  selectedInstanceId = '';
  selectedAction: WorkflowAction = 'APPROUVER';
  actionNote = '';
  trainingDecisionNotes: Record<string, string> = {};
  documentDecisionNotes: Record<string, string> = {};

  ngOnInit(): void {
    this.loadPendingInstances();
    this.loadPendingTrainingRequests();
    this.loadPendingDocumentRequests();
  }

  refresh(): void {
    this.loadPendingInstances();
    this.loadPendingTrainingRequests();
    this.loadPendingDocumentRequests();
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

  trainingStatusBadgeClass(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'soumise') {
      return 'bg-warning-transparent';
    }
    if (normalized === 'validee') {
      return 'bg-success-transparent';
    }
    if (normalized === 'rejetee') {
      return 'bg-danger-transparent';
    }
    return 'bg-primary-transparent';
  }

  documentStatusBadgeClass(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'soumise') {
      return 'bg-warning-transparent';
    }
    if (normalized === 'validee') {
      return 'bg-success-transparent';
    }
    if (normalized === 'rejetee') {
      return 'bg-danger-transparent';
    }
    return 'bg-primary-transparent';
  }

  approveTraining(request: TrainingEnrollmentRequest): void {
    this.decideTrainingRequest(request, 'APPROUVER');
  }

  rejectTraining(request: TrainingEnrollmentRequest): void {
    this.decideTrainingRequest(request, 'REJETER');
  }

  approveDocumentRequest(request: DocumentRequest): void {
    this.decideDocumentRequest(request, 'APPROUVER');
  }

  rejectDocumentRequest(request: DocumentRequest): void {
    this.decideDocumentRequest(request, 'REJETER');
  }

  runQuickAction(index: number): void {
    if (index === 0) {
      const target = document.getElementById('manager-training-requests');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    if (index === 1) {
      const target = document.getElementById('manager-document-requests');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    this.refresh();
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

  private loadPendingTrainingRequests(): void {
    this.isTrainingLoading = true;
    this.trainingService
      .getRequests({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isTrainingLoading = false)))
      .subscribe({
        next: (items) => {
          this.pendingTrainingRequests = items.filter((item) => String(item.status || '').toLowerCase() === 'soumise');
        },
        error: (error) => {
          this.pendingTrainingRequests = [];
          this.toastr.error(this.resolveError(error), 'Portail manager', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadPendingDocumentRequests(): void {
    this.isDocumentLoading = true;
    this.documentsService
      .getDocumentRequests({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isDocumentLoading = false)))
      .subscribe({
        next: (items) => {
          this.pendingDocumentRequests = items.filter((item) => String(item.status || '').toLowerCase() === 'soumise');
        },
        error: (error) => {
          this.pendingDocumentRequests = [];
          this.toastr.error(this.resolveError(error), 'Portail manager', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private decideTrainingRequest(request: TrainingEnrollmentRequest, action: 'APPROUVER' | 'REJETER'): void {
    if (!request || this.trainingUpdatingReference) {
      return;
    }

    const reason = String(this.trainingDecisionNotes[request.reference] || '').trim();
    if (action === 'REJETER' && reason.length < 3) {
      this.toastr.error('Saisissez un motif de rejet (minimum 3 caracteres)', 'Portail manager', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.trainingUpdatingReference = request.reference;
    this.trainingService
      .decideRequest(request.reference, {
        action,
        reason: reason || undefined,
      })
      .pipe(finalize(() => (this.trainingUpdatingReference = '')))
      .subscribe({
        next: () => {
          delete this.trainingDecisionNotes[request.reference];
          this.toastr.success(
            action === 'APPROUVER' ? 'Demande de formation validee' : 'Demande de formation rejetee',
            'Portail manager',
            {
              timeOut: 2300,
              positionClass: 'toast-top-right',
            }
          );
          this.loadPendingTrainingRequests();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Portail manager', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private decideDocumentRequest(request: DocumentRequest, action: 'APPROUVER' | 'REJETER'): void {
    if (!request || this.documentUpdatingReference) {
      return;
    }

    const reason = String(this.documentDecisionNotes[request.reference] || '').trim();
    if (action === 'REJETER' && reason.length < 3) {
      this.toastr.error('Saisissez un motif de rejet (minimum 3 caracteres)', 'Portail manager', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.documentUpdatingReference = request.reference;
    this.documentsService
      .decideDocumentRequest(request.reference, {
        action,
        reason: reason || undefined,
      })
      .pipe(finalize(() => (this.documentUpdatingReference = '')))
      .subscribe({
        next: () => {
          delete this.documentDecisionNotes[request.reference];
          this.toastr.success(
            action === 'APPROUVER' ? 'Demande de document validee' : 'Demande de document rejetee',
            'Portail manager',
            {
              timeOut: 2300,
              positionClass: 'toast-top-right',
            }
          );
          this.loadPendingDocumentRequests();
        },
        error: (error) => {
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
