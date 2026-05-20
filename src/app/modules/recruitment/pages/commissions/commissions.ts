import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { Application, Campaign, RecruitmentService } from '../../recruitment.service';

type CommissionStatus = 'Planifiee' | 'En deliberation' | 'PV signe' | 'Archivee';
type CommissionDecision = 'Preselectionne' | 'A revoir' | 'Non retenu';

interface CommissionMember {
  name: string;
  role: string;
}

interface CommissionCandidateReview {
  reference: string;
  candidate: string;
  position: string;
  aiScore: number;
  commissionScore: number;
  decision: CommissionDecision;
  comment: string;
}

interface RecruitmentCommission {
  id: string;
  campaignCode: string;
  campaignTitle: string;
  sessionDate: string;
  chair: string;
  members: CommissionMember[];
  status: CommissionStatus;
  pvReference: string;
  signatureStatus: 'Non signe' | 'Signe electroniquement';
  createdAt: string;
  reviews: CommissionCandidateReview[];
}

@Component({
  selector: 'app-recruitment-commissions',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './commissions.html',
})
export class RecruitmentCommissionsPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  campaigns: Campaign[] = [];
  applications: Application[] = [];
  commissions: RecruitmentCommission[] = [];
  loading = false;
  submitting = false;
  showCreateForm = false;

  private readonly storageKey = 'rh_dev_recruitment_commissions';

  form = this.fb.group({
    campaignCode: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    sessionDate: ['', [Validators.required]],
    chair: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    membersText: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(1200)]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Format invalide';
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  createCommission(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const campaignCode = String(this.form.value.campaignCode || '').trim().toUpperCase();
    const campaign = this.campaigns.find((item) => item.code === campaignCode);
    if (!campaign) {
      this.toastr.error('Campagne introuvable', 'Commissions', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const candidates = this.applications
      .filter((item) => item.campaign === campaignCode)
      .filter((item) => item.status !== 'Rejete')
      .sort((left, right) => this.computeAiScore(right) - this.computeAiScore(left))
      .slice(0, Math.max(5, campaign.openings * 3));

    if (candidates.length === 0) {
      this.toastr.warning('Aucune candidature exploitable pour cette campagne', 'Commissions', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const members = this.parseMembers(this.form.value.membersText || '');
    const now = new Date().toISOString();
    const commission: RecruitmentCommission = {
      id: this.generateCommissionId(campaignCode),
      campaignCode,
      campaignTitle: campaign.title,
      sessionDate: String(this.form.value.sessionDate || '').trim(),
      chair: String(this.form.value.chair || '').trim(),
      members,
      status: 'Planifiee',
      pvReference: '',
      signatureStatus: 'Non signe',
      createdAt: now,
      reviews: candidates.map((candidate) => {
        const aiScore = this.computeAiScore(candidate);
        return {
          reference: candidate.reference,
          candidate: candidate.candidate,
          position: candidate.position,
          aiScore,
          commissionScore: aiScore,
          decision: this.decisionFromScore(aiScore),
          comment: 'Evaluation initiale generee a partir du dossier candidat.',
        };
      }),
    };

    this.submitting = true;
    window.setTimeout(() => {
      this.commissions = [commission, ...this.commissions];
      this.persistCommissions();
      this.submitting = false;
      this.showCreateForm = false;
      this.resetForm();
      this.toastr.success('Commission planifiee avec liste de candidats', 'Commissions', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      this.cdr.detectChanges();
    }, 150);
  }

  startDeliberation(commission: RecruitmentCommission): void {
    this.updateCommission(commission.id, {
      status: 'En deliberation',
    });
  }

  updateReviewDecision(commission: RecruitmentCommission, review: CommissionCandidateReview): void {
    review.commissionScore = Math.max(0, Math.min(100, Math.round(Number(review.commissionScore) || 0)));
    review.decision = this.decisionFromScore(review.commissionScore);
    this.persistCommissions();
  }

  signMinutes(commission: RecruitmentCommission): void {
    const pvReference = commission.pvReference || `PV-${commission.id}`;
    this.updateCommission(commission.id, {
      pvReference,
      signatureStatus: 'Signe electroniquement',
      status: 'PV signe',
    });
    this.toastr.success(`Proces-verbal signe: ${pvReference}`, 'Commissions', {
      timeOut: 2600,
      positionClass: 'toast-top-right',
    });
  }

  archiveCommission(commission: RecruitmentCommission): void {
    if (commission.signatureStatus !== 'Signe electroniquement') {
      this.toastr.warning('Signature du PV requise avant archivage', 'Commissions', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.updateCommission(commission.id, {
      status: 'Archivee',
    });
  }

  shortlistCount(commission: RecruitmentCommission): number {
    return commission.reviews.filter((review) => review.decision === 'Preselectionne').length;
  }

  averageScore(commission: RecruitmentCommission): number {
    if (commission.reviews.length === 0) {
      return 0;
    }
    const total = commission.reviews.reduce((sum, review) => sum + review.commissionScore, 0);
    return Math.round((total / commission.reviews.length) * 10) / 10;
  }

  statusBadgeClass(status: CommissionStatus): string {
    if (status === 'Archivee') return 'bg-success-transparent text-success';
    if (status === 'PV signe') return 'bg-info-transparent text-info';
    if (status === 'En deliberation') return 'bg-warning-transparent text-warning';
    return 'bg-primary-transparent text-primary';
  }

  decisionBadgeClass(decision: CommissionDecision): string {
    if (decision === 'Preselectionne') return 'bg-success-transparent text-success';
    if (decision === 'A revoir') return 'bg-warning-transparent text-warning';
    return 'bg-danger-transparent text-danger';
  }

  signedCount(): number {
    return this.commissions.filter((item) => item.signatureStatus === 'Signe electroniquement').length;
  }

  archivedCount(): number {
    return this.commissions.filter((item) => item.status === 'Archivee').length;
  }

  private loadData(): void {
    this.loading = true;
    this.commissions = this.readCommissions();
    this.recruitmentService
      .getCampaigns({ page: 1, limit: 200, sortBy: 'startDate', sortOrder: 'desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (campaigns) => {
          this.campaigns = campaigns;
          const firstCampaign = campaigns[0];
          if (firstCampaign && !this.form.value.campaignCode) {
            this.form.patchValue({
              campaignCode: firstCampaign.code,
            });
          }
          this.loadApplications();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Commissions', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.loadApplications();
        },
      });
  }

  private loadApplications(): void {
    this.recruitmentService
      .getApplications({ page: 1, limit: 500, sortBy: 'receivedOn', sortOrder: 'desc' })
      .subscribe({
        next: (items) => {
          this.applications = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.applications = [];
          this.cdr.detectChanges();
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      campaignCode: this.campaigns[0]?.code || '',
      sessionDate: '',
      chair: '',
      membersText: '',
    });
  }

  private parseMembers(value: string): CommissionMember[] {
    return Array.from(
      new Set(
        String(value || '')
          .split(/[\n;,]+/)
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      )
    ).map((name, index) => ({
      name,
      role: index === 0 ? 'Rapporteur' : 'Membre',
    }));
  }

  private computeAiScore(application: Application): number {
    const experienceScore = Math.min(100, Math.round(((application.experienceYears || 0) / 10) * 100));
    const total =
      (application.skillsMatch || 0) * 0.35
      + (application.educationLevel || 0) * 0.2
      + experienceScore * 0.15
      + (application.testScore || 0) * 0.2
      + (application.interviewAverage || 0) * 0.1;
    return Math.max(0, Math.min(100, Math.round(total)));
  }

  private decisionFromScore(score: number): CommissionDecision {
    if (score >= 70) return 'Preselectionne';
    if (score >= 55) return 'A revoir';
    return 'Non retenu';
  }

  private generateCommissionId(campaignCode: string): string {
    const existing = this.commissions
      .map((item) => item.id)
      .filter((id) => id.startsWith(`COM-${campaignCode}-`));
    const next = existing.length + 1;
    return `COM-${campaignCode}-${String(next).padStart(2, '0')}`;
  }

  private updateCommission(id: string, patch: Partial<RecruitmentCommission>): void {
    this.commissions = this.commissions.map((commission) =>
      commission.id === id ? { ...commission, ...patch } : commission
    );
    this.persistCommissions();
    this.cdr.detectChanges();
  }

  private readCommissions(): RecruitmentCommission[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }
    const raw = window.localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed as RecruitmentCommission[] : [];
    } catch {
      return [];
    }
  }

  private persistCommissions(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.commissions));
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
