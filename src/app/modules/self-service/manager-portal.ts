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

  isLoading = false;
  isTrainingLoading = false;
  isDocumentLoading = false;
  trainingUpdatingReference = '';
  documentUpdatingReference = '';
  instanceUpdatingId = '';
  activeTab: 'training' | 'documents' | 'workflows' = 'training';

  pendingInstances: WorkflowInstance[] = [];
  pendingTrainingRequests: TrainingEnrollmentRequest[] = [];
  pendingDocumentRequests: DocumentRequest[] = [];
  trainingDecisionNotes: Record<string, string> = {};
  documentDecisionNotes: Record<string, string> = {};
  instanceActionNotes: Record<string, string> = {};

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

  setTab(tab: 'training' | 'documents' | 'workflows'): void {
    this.activeTab = tab;
  }

  /** Nombre d'instances workflow escaladees ou en retard (KPI prioritaire). */
  get escalatedCount(): number {
    return this.pendingInstances.filter(
      (instance) => instance.status === 'ESCALADE' || instance.status === 'EN_RETARD'
    ).length;
  }

  get isBusy(): boolean {
    return this.isLoading || this.isTrainingLoading || this.isDocumentLoading;
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

  approveInstance(instance: WorkflowInstance): void {
    this.decideInstance(instance, 'APPROUVER');
  }

  rejectInstance(instance: WorkflowInstance): void {
    this.decideInstance(instance, 'REJETER');
  }

  escalateInstance(instance: WorkflowInstance): void {
    this.decideInstance(instance, 'ESCALADER');
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
          this.pendingTrainingRequests = items.filter(
            (item) => String(item.status || '').toLowerCase() === 'soumise'
          );
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
          this.pendingDocumentRequests = items.filter(
            (item) => String(item.status || '').toLowerCase() === 'soumise'
          );
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

  private decideInstance(instance: WorkflowInstance, action: WorkflowAction): void {
    if (!instance || this.instanceUpdatingId) {
      return;
    }

    const note = String(this.instanceActionNotes[instance.id] || '').trim();
    if (action === 'REJETER' && note.length < 3) {
      this.toastr.error('Saisissez un motif de rejet (minimum 3 caracteres)', 'Portail manager', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.instanceUpdatingId = instance.id;
    this.workflowsService
      .transitionInstance(instance.id, action, note)
      .pipe(finalize(() => (this.instanceUpdatingId = '')))
      .subscribe({
        next: () => {
          delete this.instanceActionNotes[instance.id];
          this.toastr.success('Action workflow enregistree avec succes', 'Portail manager', {
            timeOut: 2300,
            positionClass: 'toast-top-right',
          });
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

  private isPendingStatus(status: WorkflowStatus): boolean {
    return status === 'EN_ATTENTE' || status === 'EN_COURS' || status === 'ESCALADE';
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
