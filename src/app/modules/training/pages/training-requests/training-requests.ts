import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import { TrainingEnrollmentRequest, TrainingService, TrainingSession } from '../../training.service';

type TrainingRequestStatus = '' | 'Soumise' | 'Validee' | 'Rejetee';

@Component({
  selector: 'app-training-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training-requests.html',
})
export class TrainingRequestsPage implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private trainingService = inject(TrainingService);
  private accessControl = inject(AccessControlService);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  items: TrainingEnrollmentRequest[] = [];
  sessions: TrainingSession[] = [];
  isLoading = false;
  isSessionsLoading = false;
  updatingReference = '';
  decisionNotes: Record<string, string> = {};
  sessionOptions: Array<{ code: string; label: string }> = [];

  filters: {
    q: string;
    status: TrainingRequestStatus;
    sessionCode: string;
  } = {
    q: '',
    status: '',
    sessionCode: '',
  };

  readonly statusOptions: TrainingRequestStatus[] = ['', 'Soumise', 'Validee', 'Rejetee'];

  ngOnInit(): void {
    this.loadSessions();
    this.hydrateFiltersFromRoute();
  }

  get canManage(): boolean {
    return this.accessControl.hasPermission(APP_PERMISSIONS.trainingManage);
  }

  get totalRequests(): number {
    return this.items.length;
  }

  get pendingRequests(): number {
    return this.items.filter((item) => this.isPendingRequest(item)).length;
  }

  get approvedRequests(): number {
    return this.items.filter((item) => this.normalizeStatus(item.status) === 'validee').length;
  }

  get rejectedRequests(): number {
    return this.items.filter((item) => this.normalizeStatus(item.status) === 'rejetee').length;
  }

  /**
   * Recalcule les options du filtre « session ». À n'appeler qu'au chargement
   * des données : en getter, il recréait des objets à chaque cycle de détection
   * de changement, ce qui faisait boucler `*ngFor` à l'infini (RuntimeError
   * NG0103 — la vue ne se stabilisait jamais).
   */
  private rebuildSessionOptions(): void {
    const source = this.sessions.length
      ? this.sessions.map((session) => ({
          code: session.code,
          label: `${session.code} - ${session.title}`,
        }))
      : this.items.map((item) => ({
          code: item.sessionCode,
          label: `${item.sessionCode} - ${item.sessionTitle}`,
        }));

    const unique = new Map<string, string>();
    source.forEach((item) => {
      if (!item.code) {
        return;
      }
      unique.set(item.code, item.label);
    });

    this.sessionOptions = Array.from(unique.entries())
      .map(([code, label]) => ({ code, label }))
      .sort((left, right) => left.label.localeCompare(right.label, 'fr'));
  }

  get hasActiveFilters(): boolean {
    return !!(this.filters.q || this.filters.status || this.filters.sessionCode);
  }

  applyFilters(): void {
    this.updateRouteFilters();
  }

  resetFilters(): void {
    this.filters = {
      q: '',
      status: '',
      sessionCode: '',
    };
    this.updateRouteFilters();
  }

  refresh(): void {
    this.loadRequests();
    this.loadSessions();
  }

  exportRequests(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `training-requests-${this.exportDateSuffix()}.csv`,
      headers: [
        'Reference',
        'Session',
        'Intitule session',
        'Dates session',
        'Lieu',
        'Agent',
        'Username',
        'Motivation',
        'Statut',
        'Soumise le',
        'Decidee le',
        'Decidee par',
        'Commentaire decision',
      ],
      rows: this.items.map((item) => [
        item.reference,
        item.sessionCode,
        item.sessionTitle,
        item.sessionDates,
        item.sessionLocation,
        item.applicantName,
        item.applicantUsername,
        item.motivation,
        item.status,
        item.createdAt,
        item.decidedAt,
        item.decidedBy,
        item.decisionComment,
      ]),
      delimiter: ';',
    });
  }

  approveRequest(request: TrainingEnrollmentRequest): void {
    this.decideRequest(request, 'APPROUVER');
  }

  rejectRequest(request: TrainingEnrollmentRequest): void {
    this.decideRequest(request, 'REJETER');
  }

  statusBadgeClass(status: string): string {
    const normalized = this.normalizeStatus(status);
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

  isPendingRequest(request: TrainingEnrollmentRequest): boolean {
    return this.normalizeStatus(request.status) === 'soumise';
  }

  trackByReference(_index: number, item: TrainingEnrollmentRequest): string {
    return item.reference;
  }

  private loadRequests(): void {
    this.isLoading = true;
    this.trainingService
      .getRequests({
        page: 1,
        limit: 200,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: this.normalizeFilter(this.filters.q),
        status: this.normalizeFilter(this.filters.status),
        sessionCode: this.normalizeFilter(this.filters.sessionCode),
      })
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (items) => {
          this.items = items;
          this.rebuildSessionOptions();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadSessions(): void {
    this.isSessionsLoading = true;
    this.trainingService
      .getSessions({
        page: 1,
        limit: 200,
        sortBy: 'title',
        sortOrder: 'asc',
      })
      .pipe(
        finalize(() => {
          this.isSessionsLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (items) => {
          this.sessions = items;
          this.rebuildSessionOptions();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.sessions = [];
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private hydrateFiltersFromRoute(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.filters = {
        q: String(params.get('q') || '').trim(),
        status: this.normalizeStatusFilter(params.get('status')),
        sessionCode: String(params.get('sessionCode') || '').trim().toUpperCase(),
      };
      this.loadRequests();
      this.cdr.detectChanges();
    });
  }

  private updateRouteFilters(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: this.normalizeFilter(this.filters.q) ?? null,
        status: this.normalizeFilter(this.filters.status) ?? null,
        sessionCode: this.normalizeFilter(this.filters.sessionCode)?.toUpperCase() ?? null,
      },
      replaceUrl: true,
    });
  }

  private decideRequest(request: TrainingEnrollmentRequest, action: 'APPROUVER' | 'REJETER'): void {
    if (!this.canManage || !request || !this.isPendingRequest(request) || this.updatingReference) {
      return;
    }

    const reason = String(this.decisionNotes[request.reference] || '').trim();
    if (action === 'REJETER' && reason.length < 3) {
      this.toastr.error('Saisissez un motif de rejet (minimum 3 caracteres)', 'Formation', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.updatingReference = request.reference;
    this.trainingService
      .decideRequest(request.reference, {
        action,
        reason: reason || undefined,
      })
      .pipe(
        finalize(() => {
          this.updatingReference = '';
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          delete this.decisionNotes[request.reference];
          this.toastr.success(
            action === 'APPROUVER' ? 'Demande de formation validee' : 'Demande de formation rejetee',
            'Formation',
            {
              timeOut: 2300,
              positionClass: 'toast-top-right',
            }
          );
          this.loadRequests();
          this.loadSessions();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Formation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private normalizeFilter(value: string): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private normalizeStatus(status: string): string {
    return String(status || '').trim().toLowerCase();
  }

  private normalizeStatusFilter(status: string | null): TrainingRequestStatus {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'soumise') return 'Soumise';
    if (normalized === 'validee') return 'Validee';
    if (normalized === 'rejetee') return 'Rejetee';
    return '';
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
