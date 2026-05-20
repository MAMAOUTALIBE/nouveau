import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  Application,
  ApplicationAttachmentEntry,
  Campaign,
  CreateApplicationPayload,
  RecruitmentApplicationStatus,
  RecruitmentService,
} from '../../recruitment.service';

type PortalStageState = 'done' | 'current' | 'pending';

interface PortalStage {
  status: RecruitmentApplicationStatus;
  label: string;
}

@Component({
  selector: 'app-candidate-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './candidate-portal.html',
})
export class CandidatePortalPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);

  campaigns: Campaign[] = [];
  applications: Application[] = [];
  trackedApplications: Application[] = [];
  createAttachments: ApplicationAttachmentEntry[] = [];
  createdApplication: Application | null = null;
  loadingCampaigns = false;
  loadingApplications = false;
  submitting = false;
  tracking = false;
  uploadingAttachments = 0;

  readonly stages: PortalStage[] = [
    { status: 'Nouveau', label: 'Depot recu' },
    { status: 'Preselection', label: 'Instruction RH' },
    { status: 'Entretien', label: 'Entretien' },
    { status: 'Retenu', label: 'Decision finale' },
  ];

  private readonly allowedAttachmentExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
  private readonly maxAttachmentBytes = 15 * 1024 * 1024;

  applicationForm = this.fb.group({
    candidate: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    candidateEmail: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    candidatePhone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+ ()-]*$/)]],
    identityNumber: ['', [Validators.maxLength(64), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
    campaign: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]+$/)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
  });

  trackingForm = this.fb.group({
    query: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
  });

  ngOnInit(): void {
    this.loadCampaigns();
    this.loadApplications();
  }

  fieldError(formName: 'application' | 'tracking', fieldName: string): string | null {
    const control = formName === 'application'
      ? this.applicationForm.get(fieldName)
      : this.trackingForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['email']) return 'Adresse e-mail invalide';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Format invalide';
    return 'Valeur invalide';
  }

  activeCampaigns(): Campaign[] {
    const active = this.campaigns.filter((campaign) => {
      const status = campaign.status.trim().toLowerCase();
      return status === 'active' || status === 'planifiee';
    });
    return active.length > 0 ? active : this.campaigns;
  }

  onCampaignChange(code: string): void {
    const normalizedCode = String(code || '').trim().toUpperCase();
    const selected = this.campaigns.find((campaign) => campaign.code === normalizedCode);
    if (!selected) {
      return;
    }
    this.applicationForm.patchValue({
      campaign: selected.code,
      position: selected.needPosition || selected.title,
    });
  }

  submitApplication(): void {
    if (this.applicationForm.invalid || this.submitting) {
      this.applicationForm.markAllAsTouched();
      return;
    }
    if (this.uploadingAttachments > 0) {
      this.toastr.warning('Televersement des pieces en cours', 'Portail candidat', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateApplicationPayload = {
      candidate: this.applicationForm.value.candidate?.trim() || '',
      candidateEmail: this.applicationForm.value.candidateEmail?.trim() || '',
      candidatePhone: this.applicationForm.value.candidatePhone?.trim() || undefined,
      identityNumber: this.applicationForm.value.identityNumber?.trim() || undefined,
      campaign: this.applicationForm.value.campaign?.trim().toUpperCase() || '',
      position: this.applicationForm.value.position?.trim() || '',
      source: 'Portail RH',
      status: 'Nouveau',
      receivedOn: this.todayDateIso(),
      allowDuplicate: false,
      attachments: [...this.createAttachments],
    };

    this.submitting = true;
    this.recruitmentService
      .createApplication(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (created) => {
          this.createdApplication = created;
          this.trackedApplications = [created];
          this.trackingForm.patchValue({ query: created.reference });
          this.toastr.success('Candidature transmise avec succes', 'Portail candidat', {
            timeOut: 2600,
            positionClass: 'toast-top-right',
          });
          this.resetApplicationForm();
          this.loadApplications();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Portail candidat', {
            timeOut: 3800,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  trackApplication(): void {
    if (this.trackingForm.invalid || this.tracking) {
      this.trackingForm.markAllAsTouched();
      return;
    }

    const query = String(this.trackingForm.value.query || '').trim();
    this.tracking = true;
    this.recruitmentService
      .getApplications({
        q: query,
        page: 1,
        limit: 20,
        sortBy: 'receivedOn',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.tracking = false)))
      .subscribe({
        next: (items) => {
          this.trackedApplications = this.filterCandidateVisibleMatches(items, query);
          if (this.trackedApplications.length === 0) {
            this.toastr.info('Aucun dossier trouve pour cette reference', 'Portail candidat', {
              timeOut: 2600,
              positionClass: 'toast-top-right',
            });
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.trackedApplications = [];
          this.toastr.error(this.resolveError(error), 'Portail candidat', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  onCreateAttachmentsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!files.length) {
      return;
    }

    for (const file of files) {
      this.uploadCreateAttachment(file);
    }
    input.value = '';
  }

  removeCreateAttachment(index: number): void {
    if (index < 0 || index >= this.createAttachments.length) {
      return;
    }
    this.createAttachments.splice(index, 1);
  }

  stageState(application: Application, stage: RecruitmentApplicationStatus): PortalStageState {
    if (application.status === 'Rejete') {
      return stage === 'Nouveau' ? 'done' : 'pending';
    }
    const currentIndex = this.stages.findIndex((item) => item.status === application.status);
    const stageIndex = this.stages.findIndex((item) => item.status === stage);
    if (stageIndex < currentIndex) return 'done';
    if (stageIndex === currentIndex) return 'current';
    return 'pending';
  }

  stageClass(application: Application, stage: RecruitmentApplicationStatus): string {
    const state = this.stageState(application, stage);
    if (state === 'done') return 'bg-success-transparent text-success';
    if (state === 'current') return 'bg-primary-transparent text-primary';
    return 'bg-light text-muted';
  }

  statusBadgeClass(status: RecruitmentApplicationStatus): string {
    if (status === 'Retenu') return 'bg-success-transparent text-success';
    if (status === 'Rejete') return 'bg-danger-transparent text-danger';
    if (status === 'Entretien') return 'bg-info-transparent text-info';
    if (status === 'Preselection') return 'bg-warning-transparent text-warning';
    return 'bg-primary-transparent text-primary';
  }

  campaignTitle(code: string): string {
    const campaign = this.campaigns.find((item) => item.code === code);
    return campaign ? campaign.title : code;
  }

  private loadCampaigns(): void {
    this.loadingCampaigns = true;
    this.recruitmentService
      .getCampaigns({
        page: 1,
        limit: 100,
        sortBy: 'startDate',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.loadingCampaigns = false)))
      .subscribe({
        next: (items) => {
          this.campaigns = items;
          const first = this.activeCampaigns()[0];
          if (first && !this.applicationForm.value.campaign) {
            this.applicationForm.patchValue({
              campaign: first.code,
              position: first.needPosition || first.title,
            });
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.campaigns = [];
          this.toastr.error(this.resolveError(error), 'Portail candidat', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadApplications(): void {
    this.loadingApplications = true;
    this.recruitmentService
      .getApplications({
        page: 1,
        limit: 200,
        sortBy: 'receivedOn',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.loadingApplications = false)))
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

  private resetApplicationForm(): void {
    const currentCampaign = this.applicationForm.value.campaign || this.activeCampaigns()[0]?.code || '';
    const selected = this.campaigns.find((campaign) => campaign.code === currentCampaign);
    this.applicationForm.reset({
      candidate: '',
      candidateEmail: '',
      candidatePhone: '',
      identityNumber: '',
      campaign: currentCampaign,
      position: selected?.needPosition || selected?.title || '',
    });
    this.createAttachments = [];
  }

  private filterCandidateVisibleMatches(items: Application[], query: string): Application[] {
    const normalizedQuery = this.normalizeComparable(query);
    return items.filter((item) => {
      const values = [
        item.reference,
        item.candidateEmail,
        item.candidatePhone,
        item.identityNumber,
      ].map((value) => this.normalizeComparable(value || ''));
      return values.some((value) => value === normalizedQuery);
    });
  }

  private uploadCreateAttachment(file: File): void {
    if (!this.isAllowedAttachment(file)) {
      this.toastr.error('Type de fichier non supporte (pdf, png, jpg, jpeg, webp)', 'Portail candidat', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    if (file.size > this.maxAttachmentBytes) {
      this.toastr.error('Fichier trop volumineux (15 Mo max)', 'Portail candidat', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.uploadingAttachments += 1;
    this.recruitmentService
      .uploadApplicationAttachment(file)
      .pipe(finalize(() => (this.uploadingAttachments = Math.max(0, this.uploadingAttachments - 1))))
      .subscribe({
        next: (uploaded) => {
          const exists = this.createAttachments.some(
            (item) => item.fileName === uploaded.fileName && item.url === uploaded.url
          );
          if (!exists) {
            this.createAttachments = [...this.createAttachments, uploaded];
          }
          this.toastr.success(`Piece jointe ajoutee: ${uploaded.fileName}`, 'Portail candidat', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Portail candidat', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private isAllowedAttachment(file: File): boolean {
    const mime = String(file.type || '').toLowerCase();
    if (mime === 'application/pdf' || mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/webp') {
      return true;
    }
    const fileName = String(file.name || '').toLowerCase();
    return Array.from(this.allowedAttachmentExtensions).some((extension) => fileName.endsWith(extension));
  }

  private normalizeComparable(value: string): string {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  private todayDateIso(): string {
    return new Date().toISOString().slice(0, 10);
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
