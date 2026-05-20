import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  Application,
  ApplicationAttachmentEntry,
  RecruitmentApplicationScoreEntry,
  RecruitmentApplicationScoreDetail,
  RecruitmentScoringPolicy,
  RecruitmentScoringCriterion,
  RecruitmentShortlistSuggestion,
  RecruitmentShortlistValidationEntry,
  RecruitmentDuplicateCase,
  RecruitmentDuplicateLink,
  RecruitmentInterviewQuestionTemplate,
  RecruitmentInterviewQuestionImportResult,
  RecruitmentInterviewQuestionExportResult,
  RecruitmentInterviewSchedule,
  RecruitmentAuditLogEntry,
  ApplicationCommentEntry,
  ApplicationStatusHistoryEntry,
  Campaign,
  CreateApplicationPayload,
  RECRUITMENT_APPLICATION_STATUSES,
  RECRUITMENT_APPLICATION_SOURCES,
  RecruitmentApplicationStatus,
  RecruitmentApplicationSource,
  RecruitmentNotificationEntry,
  RecruitmentService
} from '../../recruitment.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './applications.html',
})
export class ApplicationsPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accessControl = inject(AccessControlService);
  private recruitmentService = inject(RecruitmentService);
  private toastr = inject(ToastrService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly statusOptions = [...RECRUITMENT_APPLICATION_STATUSES];
  readonly filterStatusOptions = ['all', ...RECRUITMENT_APPLICATION_STATUSES];
  readonly sourceOptions = [...RECRUITMENT_APPLICATION_SOURCES];
  readonly filterSourceOptions = ['all', ...RECRUITMENT_APPLICATION_SOURCES];
  readonly statusFlow: Record<RecruitmentApplicationStatus, RecruitmentApplicationStatus | null> = {
    Nouveau: 'Preselection',
    Preselection: 'Entretien',
    Entretien: 'Retenu',
    Retenu: null,
    Rejete: null,
  };

  items: Application[] = [];
  campaignOptions: string[] = [];
  createAttachments: ApplicationAttachmentEntry[] = [];
  showCreateForm = false;
  submittingCreate = false;
  uploadingAttachments = 0;
  updatingReference: string | null = null;
  historyExpandedReferences = new Set<string>();
  selectedReference: string | null = null;
  commentDraft = '';
  submittingComment = false;

  selectedStatus = 'all';
  selectedCampaign = 'all';
  selectedSource = 'all';
  positionFilter = '';
  receivedFrom = '';
  receivedTo = '';
  searchTerm = '';
  sourceStats: Array<{ source: RecruitmentApplicationSource; count: number; ratio: number }> = [];
  notifications: RecruitmentNotificationEntry[] = [];
  auditLogs: RecruitmentAuditLogEntry[] = [];
  scoringPolicy: RecruitmentScoringPolicy | null = null;
  scoringCriteriaDraft: RecruitmentScoringCriterion[] = [];
  applicationScores: RecruitmentApplicationScoreEntry[] = [];
  scoreSummary = {
    average: 0,
    topScore: 0,
    eligible: 0,
  };
  shortlistTopN = 5;
  shortlistSuggestions: RecruitmentShortlistSuggestion[] = [];
  shortlistValidations: RecruitmentShortlistValidationEntry[] = [];
  shortlistSavingReferences = new Set<string>();
  duplicateCases: RecruitmentDuplicateCase[] = [];
  duplicateLinks: RecruitmentDuplicateLink[] = [];
  duplicateProcessingCaseId: string | null = null;
  questionTemplates: RecruitmentInterviewQuestionTemplate[] = [];
  questionTemplatePosition = '';
  questionTemplateQuestions = '';
  questionTemplateImportFormat: 'csv' | 'json' = 'json';
  questionTemplateImportContent = '';
  questionBankBusy = false;
  interviews: RecruitmentInterviewSchedule[] = [];
  showInterviewCreateForm = false;
  submittingInterview = false;
  selectedInterviewIdForReschedule: string | null = null;
  submittingInterviewReschedule = false;
  selectedInterviewIdForEvaluation: string | null = null;
  submittingInterviewEvaluation = false;
  notificationSummary = {
    interviewReminders: 0,
    validationReminders: 0,
    slaAlerts: 0,
    critical: 0,
  };
  auditSummary = {
    createdApplications: 0,
    statusUpdates: 0,
    onboardingCreates: 0,
    campaignCreates: 0,
  };
  private readonly allowedAttachmentExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
  private readonly maxAttachmentBytes = 15 * 1024 * 1024;

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    candidate: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    candidateEmail: ['', [Validators.email, Validators.maxLength(160)]],
    candidatePhone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+ ()-]*$/)]],
    identityNumber: ['', [Validators.maxLength(64), Validators.pattern(/^[A-Za-z0-9-]*$/)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    campaign: ['', [Validators.required, Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]+$/)]],
    source: [RECRUITMENT_APPLICATION_SOURCES[0], [Validators.required]],
    status: ['Nouveau', [Validators.required]],
    receivedOn: ['', [Validators.required]],
    allowDuplicate: [false],
  });

  interviewForm = this.fb.group({
    applicationReference: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
    slotStart: ['', [Validators.required]],
    slotEnd: ['', [Validators.required]],
    interviewersText: ['', [Validators.required, Validators.minLength(2)]],
    location: ['Salle RH-01', [Validators.maxLength(160)]],
  });

  interviewRescheduleForm = this.fb.group({
    slotStart: ['', [Validators.required]],
    slotEnd: ['', [Validators.required]],
    interviewersText: ['', [Validators.required, Validators.minLength(2)]],
    location: ['', [Validators.maxLength(160)]],
    reason: ['Replanification manuelle', [Validators.maxLength(200)]],
  });

  interviewEvaluationForm = this.fb.group({
    interviewer: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    technicalScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    communicationScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    cultureFitScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    recommendation: ['Go', [Validators.required]],
    comment: ['', [Validators.maxLength(400)]],
  });

  ngOnInit(): void {
    this.loadCampaignOptions();
    this.loadApplications();
    this.loadNotifications();
    this.loadAuditLogs();
    this.loadScoringPolicy();
    this.loadApplicationScores();
    this.loadShortlistSuggestions();
    this.loadShortlistValidations();
    this.loadDuplicateCases();
    this.loadDuplicateLinks();
    this.loadQuestionBank();
    this.loadInterviews();
    this.hydrateFocusReferenceFromRoute();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
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

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.applyFilters();
    }, 250);
  }

  applyFilters(): void {
    if (this.receivedFrom && this.receivedTo) {
      const fromTimestamp = Date.parse(this.receivedFrom);
      const toTimestamp = Date.parse(this.receivedTo);
      if (!Number.isNaN(fromTimestamp) && !Number.isNaN(toTimestamp) && toTimestamp < fromTimestamp) {
        this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Recrutement', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
        return;
      }
    }
    this.loadApplications();
  }

  resetFilters(): void {
    this.selectedStatus = 'all';
    this.selectedCampaign = 'all';
    this.selectedSource = 'all';
    this.positionFilter = '';
    this.receivedFrom = '';
    this.receivedTo = '';
    this.searchTerm = '';
    this.loadApplications();
  }

  toggleCreateForm(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
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

  saveApplication(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.form.invalid || this.submittingCreate) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.uploadingAttachments > 0) {
      this.toastr.warning('Patientez: televersement des pieces jointes en cours', 'Recrutement', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateApplicationPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      candidate: this.form.value.candidate?.trim() || '',
      candidateEmail: this.form.value.candidateEmail?.trim() || undefined,
      candidatePhone: this.form.value.candidatePhone?.trim() || undefined,
      identityNumber: this.form.value.identityNumber?.trim() || undefined,
      position: this.form.value.position?.trim() || '',
      campaign: this.form.value.campaign?.trim().toUpperCase() || '',
      source: this.form.value.source?.trim() || RECRUITMENT_APPLICATION_SOURCES[0],
      status: this.form.value.status?.trim() || 'Nouveau',
      receivedOn: this.form.value.receivedOn || '',
      allowDuplicate: !!this.form.value.allowDuplicate,
      attachments: [...this.createAttachments],
    };

    this.submittingCreate = true;
    this.recruitmentService
      .createApplication(payload)
      .pipe(finalize(() => (this.submittingCreate = false)))
      .subscribe({
        next: (created) => {
          this.toastr.success('Candidature creee avec succes', 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.selectedReference = created.reference;
          this.loadApplications(created.reference);
          this.loadApplicationScores();
          this.loadShortlistSuggestions();
          this.loadDuplicateCases();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportApplications(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }

    if (!this.items.length) {
      this.toastr.info('Aucune candidature a exporter', 'Recrutement', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    downloadCsv({
      filename: `recrutement-candidatures-${this.exportDateSuffix()}.csv`,
      headers: ['Reference', 'Candidat', 'Poste', 'Campagne', 'Source', 'Statut', 'Recu le'],
      rows: this.items.map((item) => [
        item.reference,
        item.candidate,
        item.position,
        item.campaign,
        item.source,
        item.status,
        item.receivedOn,
      ]),
      delimiter: ';',
    });

    this.toastr.success('Export CSV genere', 'Recrutement', {
      timeOut: 2200,
      positionClass: 'toast-top-right',
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

  previewAttachmentUrl(attachment: ApplicationAttachmentEntry): string {
    return this.attachmentUrlWithDisposition(attachment, 'inline');
  }

  downloadAttachmentUrl(attachment: ApplicationAttachmentEntry): string {
    return this.attachmentUrlWithDisposition(attachment, 'attachment');
  }

  previewAttachment(attachment: ApplicationAttachmentEntry): void {
    const fileName = String(attachment.fileName || 'piece-jointe').trim() || 'piece-jointe';
    const normalizedUrl = String(attachment.url || '').trim();
    if (!normalizedUrl) {
      return;
    }

    if (normalizedUrl.startsWith('blob:')) {
      const popup = window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      if (!popup) {
        this.downloadObjectUrl(normalizedUrl, fileName);
      }
      return;
    }

    this.recruitmentService.downloadAttachment(normalizedUrl).subscribe({
      next: (blob) => {
        if (!this.openBlobPreview(blob)) {
          this.downloadBlob(blob, fileName);
        }
      },
      error: () => {
        this.toastr.error('Téléchargement impossible pour le moment', 'Recrutement', {
          timeOut: 2800,
          positionClass: 'toast-top-right',
        });
      },
    });
  }

  downloadAttachment(attachment: ApplicationAttachmentEntry): void {
    const fileName = String(attachment.fileName || 'piece-jointe').trim() || 'piece-jointe';
    const normalizedUrl = String(attachment.url || '').trim();
    if (!normalizedUrl) {
      return;
    }

    if (normalizedUrl.startsWith('blob:')) {
      this.downloadObjectUrl(normalizedUrl, fileName);
      return;
    }

    this.recruitmentService.downloadAttachment(normalizedUrl).subscribe({
      next: (blob) => this.downloadBlob(blob, fileName),
      error: () => {
        this.toastr.error('Téléchargement impossible pour le moment', 'Recrutement', {
          timeOut: 2800,
          positionClass: 'toast-top-right',
        });
      },
    });
  }

  openDetails(item: Application): void {
    this.selectedReference = item.reference;
    this.commentDraft = '';
  }

  closeDetails(): void {
    this.selectedReference = null;
    this.commentDraft = '';
  }

  interviewStatusBadgeClass(status: RecruitmentInterviewSchedule['status']): string {
    if (status === 'Termine') return 'bg-success-transparent text-success';
    if (status === 'Replanifie') return 'bg-warning-transparent text-warning';
    if (status === 'Annule') return 'bg-danger-transparent text-danger';
    return 'bg-primary-transparent text-primary';
  }

  interviewRecommendationBadgeClass(
    recommendation: RecruitmentInterviewSchedule['consolidation']['recommendation']
  ): string {
    if (recommendation === 'Go') return 'bg-success-transparent text-success';
    if (recommendation === 'No-Go') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  openInterviewCreateForm(reference?: string): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.showInterviewCreateForm = true;
    this.interviewForm.patchValue({
      applicationReference: String(reference || '').trim().toUpperCase(),
    });
  }

  cancelInterviewCreate(): void {
    this.showInterviewCreateForm = false;
    this.interviewForm.reset({
      applicationReference: '',
      slotStart: '',
      slotEnd: '',
      interviewersText: '',
      location: 'Salle RH-01',
    });
  }

  saveInterview(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.interviewForm.invalid || this.submittingInterview) {
      this.interviewForm.markAllAsTouched();
      return;
    }
    const slotStart = String(this.interviewForm.value.slotStart || '').trim();
    const slotEnd = String(this.interviewForm.value.slotEnd || '').trim();
    const startTs = Date.parse(slotStart);
    const endTs = Date.parse(slotEnd);
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
      this.toastr.error('Creneau entretien invalide', 'Recrutement', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }
    const interviewers = this.parseInterviewers(this.interviewForm.value.interviewersText || '');
    if (interviewers.length === 0) {
      this.toastr.error('Au moins un interviewer est requis', 'Recrutement', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.submittingInterview = true;
    this.recruitmentService
      .createInterview({
        applicationReference: String(this.interviewForm.value.applicationReference || '').trim().toUpperCase(),
        slotStart,
        slotEnd,
        interviewers,
        location: String(this.interviewForm.value.location || '').trim() || 'A definir',
      })
      .pipe(finalize(() => (this.submittingInterview = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Entretien planifie', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.cancelInterviewCreate();
          this.loadInterviews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  openInterviewReschedule(interview: RecruitmentInterviewSchedule): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.selectedInterviewIdForReschedule = interview.id;
    this.interviewRescheduleForm.patchValue({
      slotStart: this.toDateTimeLocalValue(interview.slotStart),
      slotEnd: this.toDateTimeLocalValue(interview.slotEnd),
      interviewersText: interview.interviewers.join(', '),
      location: interview.location,
      reason: 'Replanification manuelle',
    });
  }

  cancelInterviewReschedule(): void {
    this.selectedInterviewIdForReschedule = null;
    this.interviewRescheduleForm.reset({
      slotStart: '',
      slotEnd: '',
      interviewersText: '',
      location: '',
      reason: 'Replanification manuelle',
    });
  }

  saveInterviewReschedule(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (!this.selectedInterviewIdForReschedule) {
      return;
    }
    if (this.interviewRescheduleForm.invalid || this.submittingInterviewReschedule) {
      this.interviewRescheduleForm.markAllAsTouched();
      return;
    }
    const slotStart = String(this.interviewRescheduleForm.value.slotStart || '').trim();
    const slotEnd = String(this.interviewRescheduleForm.value.slotEnd || '').trim();
    const startTs = Date.parse(slotStart);
    const endTs = Date.parse(slotEnd);
    if (Number.isNaN(startTs) || Number.isNaN(endTs) || endTs <= startTs) {
      this.toastr.error('Nouveau creneau invalide', 'Recrutement', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }
    const interviewers = this.parseInterviewers(this.interviewRescheduleForm.value.interviewersText || '');
    if (interviewers.length === 0) {
      this.toastr.error('Panel interviewers requis', 'Recrutement', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.submittingInterviewReschedule = true;
    this.recruitmentService
      .rescheduleInterview(this.selectedInterviewIdForReschedule, {
        slotStart,
        slotEnd,
        interviewers,
        location: String(this.interviewRescheduleForm.value.location || '').trim() || undefined,
        reason: String(this.interviewRescheduleForm.value.reason || '').trim() || undefined,
      })
      .pipe(finalize(() => (this.submittingInterviewReschedule = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Entretien replanifie', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.cancelInterviewReschedule();
          this.loadInterviews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  openInterviewEvaluation(interview: RecruitmentInterviewSchedule): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.selectedInterviewIdForEvaluation = interview.id;
    this.interviewEvaluationForm.patchValue({
      interviewer: interview.interviewers[0] || '',
      technicalScore: 70,
      communicationScore: 70,
      cultureFitScore: 70,
      recommendation: 'Go',
      comment: '',
    });
  }

  cancelInterviewEvaluation(): void {
    this.selectedInterviewIdForEvaluation = null;
    this.interviewEvaluationForm.reset({
      interviewer: '',
      technicalScore: 70,
      communicationScore: 70,
      cultureFitScore: 70,
      recommendation: 'Go',
      comment: '',
    });
  }

  saveInterviewEvaluation(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (!this.selectedInterviewIdForEvaluation) {
      return;
    }
    if (this.interviewEvaluationForm.invalid || this.submittingInterviewEvaluation) {
      this.interviewEvaluationForm.markAllAsTouched();
      return;
    }
    this.submittingInterviewEvaluation = true;
    this.recruitmentService
      .addInterviewEvaluation(this.selectedInterviewIdForEvaluation, {
        interviewer: String(this.interviewEvaluationForm.value.interviewer || '').trim(),
        technicalScore: Number(this.interviewEvaluationForm.value.technicalScore ?? 0),
        communicationScore: Number(this.interviewEvaluationForm.value.communicationScore ?? 0),
        cultureFitScore: Number(this.interviewEvaluationForm.value.cultureFitScore ?? 0),
        recommendation: this.interviewEvaluationForm.value.recommendation === 'No-Go' ? 'No-Go' : 'Go',
        comment: String(this.interviewEvaluationForm.value.comment || '').trim() || undefined,
      })
      .pipe(finalize(() => (this.submittingInterviewEvaluation = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Evaluation enregistree', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.cancelInterviewEvaluation();
          this.loadInterviews();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  get selectedApplication(): Application | null {
    if (!this.selectedReference) {
      return null;
    }
    return this.items.find((item) => item.reference === this.selectedReference) || null;
  }

  canSubmitComment(): boolean {
    return !!this.selectedApplication && !!this.commentDraft.trim() && !this.submittingComment;
  }

  addComment(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const selected = this.selectedApplication;
    if (!selected || this.submittingComment) {
      return;
    }

    const message = this.commentDraft.trim();
    if (message.length < 2) {
      this.toastr.error('Commentaire requis (2 caracteres minimum)', 'Recrutement', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.submittingComment = true;
    this.recruitmentService
      .addApplicationComment(selected.reference, { message })
      .pipe(finalize(() => (this.submittingComment = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Commentaire ajoute', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
          this.commentDraft = '';
          this.loadApplications(selected.reference);
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  trackByReference(_index: number, item: Application): string {
    return item.reference;
  }

  statusBadgeClass(status: RecruitmentApplicationStatus): string {
    switch (status) {
      case 'Nouveau':
        return 'bg-primary';
      case 'Preselection':
        return 'bg-info';
      case 'Entretien':
        return 'bg-warning';
      case 'Retenu':
        return 'bg-success';
      case 'Rejete':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  nextStatusFor(item: Application): RecruitmentApplicationStatus | null {
    return this.statusFlow[item.status];
  }

  canAdvance(item: Application): boolean {
    return !!this.nextStatusFor(item);
  }

  canReject(item: Application): boolean {
    return item.status !== 'Rejete' && item.status !== 'Retenu';
  }

  canLaunchOnboarding(item: Application): boolean {
    return item.status === 'Retenu';
  }

  isUpdating(reference: string): boolean {
    return this.updatingReference === reference;
  }

  advance(item: Application): void {
    const nextStatus = this.nextStatusFor(item);
    if (!nextStatus || this.isUpdating(item.reference)) {
      return;
    }
    this.updateStatus(item, nextStatus, 'Progression dans le pipeline');
  }

  reject(item: Application): void {
    if (!this.canReject(item) || this.isUpdating(item.reference)) {
      return;
    }
    this.updateStatus(item, 'Rejete', 'Candidature rejetee');
  }

  launchOnboarding(item: Application): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (!this.canLaunchOnboarding(item)) {
      return;
    }

    this.router.navigate(['/recrutement/integration'], {
      queryParams: {
        applicationRef: item.reference,
        candidate: item.candidate,
        position: item.position,
      },
    });
  }

  toggleHistory(reference: string): void {
    if (this.historyExpandedReferences.has(reference)) {
      this.historyExpandedReferences.delete(reference);
    } else {
      this.historyExpandedReferences.add(reference);
    }
  }

  isHistoryExpanded(reference: string): boolean {
    return this.historyExpandedReferences.has(reference);
  }

  historyOf(item: Application): ApplicationStatusHistoryEntry[] {
    return [...(item.statusHistory || [])].sort((left, right) => {
      const leftTs = Date.parse(left.changedAt);
      const rightTs = Date.parse(right.changedAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return rightTs - leftTs;
      }
      return right.changedAt.localeCompare(left.changedAt);
    });
  }

  commentsOf(item: Application): ApplicationCommentEntry[] {
    return [...(item.comments || [])].sort((left, right) => {
      const leftTs = Date.parse(left.createdAt);
      const rightTs = Date.parse(right.createdAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return rightTs - leftTs;
      }
      return right.createdAt.localeCompare(left.createdAt);
    });
  }

  attachmentsOf(item: Application): ApplicationAttachmentEntry[] {
    return [...(item.attachments || [])].sort((left, right) => {
      const leftTs = Date.parse(left.uploadedAt);
      const rightTs = Date.parse(right.uploadedAt);
      if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
        return rightTs - leftTs;
      }
      return right.uploadedAt.localeCompare(left.uploadedAt);
    });
  }

  statusActionLabel(item: Application): string {
    const nextStatus = this.nextStatusFor(item);
    return nextStatus ? `Passer a ${nextStatus}` : 'Flux termine';
  }

  canManageRecruitment(): boolean {
    return this.accessControl.hasPermission(APP_PERMISSIONS.recruitmentManage);
  }

  notificationTypeBadgeClass(type: RecruitmentNotificationEntry['type']): string {
    if (type === 'Alerte SLA candidature') return 'bg-danger-transparent text-danger';
    if (type === 'Relance validation') return 'bg-warning-transparent text-warning';
    return 'bg-info-transparent text-info';
  }

  notificationSeverityBadgeClass(severity: RecruitmentNotificationEntry['severity']): string {
    if (severity === 'Critique') return 'bg-danger-transparent text-danger';
    if (severity === 'Alerte') return 'bg-warning-transparent text-warning';
    return 'bg-info-transparent text-info';
  }

  notificationStatusBadgeClass(status: RecruitmentNotificationEntry['status']): string {
    if (status === 'Envoyee') return 'bg-success-transparent text-success';
    if (status === 'Echec') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  auditActionLabel(action: RecruitmentAuditLogEntry['action']): string {
    if (action === 'APPLICATION_CREATED') return 'Creation candidature';
    if (action === 'APPLICATION_STATUS_UPDATED') return 'Changement statut';
    if (action === 'APPLICATION_COMMENT_ADDED') return 'Commentaire candidature';
    if (action === 'CAMPAIGN_CREATED') return 'Creation campagne';
    if (action === 'ONBOARDING_CREATED') return 'Creation integration';
    if (action === 'NOTIFICATION_SENT') return 'Notification envoyee';
    return action;
  }

  auditOutcomeBadgeClass(outcome: RecruitmentAuditLogEntry['outcome']): string {
    if (outcome === 'SUCCESS') return 'bg-success-transparent text-success';
    if (outcome === 'DENIED') return 'bg-warning-transparent text-warning';
    return 'bg-danger-transparent text-danger';
  }

  scoreBadgeClass(score: number): string {
    if (score >= 80) return 'bg-success-transparent text-success';
    if (score >= 65) return 'bg-info-transparent text-info';
    if (score >= 50) return 'bg-warning-transparent text-warning';
    return 'bg-danger-transparent text-danger';
  }

  shortlistStatusBadgeClass(status: RecruitmentShortlistSuggestion['validationStatus']): string {
    if (status === 'VALIDATED') return 'bg-success-transparent text-success';
    if (status === 'REJECTED') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  onScoringWeightChange(index: number, value: string): void {
    const weight = Math.max(1, Math.min(100, Math.round(Number(value) || 0)));
    if (!Number.isFinite(weight) || index < 0 || index >= this.scoringCriteriaDraft.length) {
      return;
    }
    this.scoringCriteriaDraft[index] = {
      ...this.scoringCriteriaDraft[index],
      weight,
    };
  }

  saveScoringPolicy(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.scoringCriteriaDraft.length === 0) {
      return;
    }
    this.recruitmentService
      .updateScoringPolicy(this.scoringCriteriaDraft)
      .subscribe({
        next: (policy) => {
          this.scoringPolicy = policy;
          this.scoringCriteriaDraft = policy.criteria.map((entry) => ({ ...entry }));
          this.loadApplicationScores();
          this.loadShortlistSuggestions();
          this.toastr.success('Regles de scoring mises a jour', 'Recrutement', {
            timeOut: 2400,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  setShortlistTopN(value: number): void {
    const next = Math.max(1, Math.min(30, Math.round(value || 5)));
    this.shortlistTopN = next;
    this.loadShortlistSuggestions();
  }

  validateShortlistSuggestion(item: RecruitmentShortlistSuggestion, decision: 'VALIDATED' | 'REJECTED'): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (this.shortlistSavingReferences.has(item.reference)) {
      return;
    }
    this.shortlistSavingReferences.add(item.reference);
    this.recruitmentService
      .validateShortlistEntry(item.reference, {
        decision,
        note: decision === 'REJECTED' ? 'Rejete apres revue manuelle' : 'Valide apres revue manuelle',
      })
      .pipe(finalize(() => this.shortlistSavingReferences.delete(item.reference)))
      .subscribe({
        next: () => {
          this.loadShortlistValidations();
          this.loadShortlistSuggestions();
          this.toastr.success(`Validation shortlist: ${decision}`, 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  canDispatchShortlist(): boolean {
    if (this.shortlistSuggestions.length === 0) {
      return false;
    }
    return this.shortlistSuggestions.every((item) => item.validationStatus === 'VALIDATED');
  }

  dispatchShortlist(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    if (!this.canDispatchShortlist()) {
      this.toastr.warning('Validation manuelle obligatoire avant envoi shortlist', 'Recrutement', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.toastr.success('Shortlist envoyee apres validation manuelle', 'Recrutement', {
      timeOut: 2500,
      positionClass: 'toast-top-right',
    });
  }

  processDuplicateCase(caseItem: RecruitmentDuplicateCase, mode: 'link' | 'merge'): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const [primary, secondary] = caseItem.applications;
    if (!primary?.reference || !secondary?.reference) {
      return;
    }
    if (this.duplicateProcessingCaseId === caseItem.id) {
      return;
    }
    this.duplicateProcessingCaseId = caseItem.id;
    this.recruitmentService
      .linkDuplicateProfiles({
        primaryReference: primary.reference,
        secondaryReference: secondary.reference,
        mode,
        reason: mode === 'merge'
          ? `Fusion ${secondary.reference} vers ${primary.reference}`
          : `Liaison ${primary.reference} / ${secondary.reference}`,
      })
      .pipe(finalize(() => (this.duplicateProcessingCaseId = null)))
      .subscribe({
        next: () => {
          this.loadApplications(primary.reference);
          this.loadDuplicateCases();
          this.loadDuplicateLinks();
          this.toastr.success(
            mode === 'merge' ? 'Fusion de profils realisee' : 'Liaison de profils enregistree',
            'Recrutement',
            {
              timeOut: 2500,
              positionClass: 'toast-top-right',
            }
          );
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  createQuestionTemplate(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const position = this.questionTemplatePosition.trim();
    const questions = this.questionTemplateQuestions
      .split(/\r?\n/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    if (position.length < 2 || questions.length === 0) {
      this.toastr.error('Poste et questions requis pour creer un template', 'Recrutement', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.questionBankBusy = true;
    this.recruitmentService
      .createInterviewQuestionTemplate({ position, questions })
      .pipe(finalize(() => (this.questionBankBusy = false)))
      .subscribe({
        next: () => {
          this.questionTemplatePosition = '';
          this.questionTemplateQuestions = '';
          this.loadQuestionBank();
          this.toastr.success('Template de questions cree', 'Recrutement', {
            timeOut: 2300,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  importQuestionBank(): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    const content = this.questionTemplateImportContent.trim();
    if (!content) {
      this.toastr.warning('Contenu import requis', 'Recrutement', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.questionBankBusy = true;
    this.recruitmentService
      .importInterviewQuestionBank({
        format: this.questionTemplateImportFormat,
        content,
      })
      .pipe(finalize(() => (this.questionBankBusy = false)))
      .subscribe({
        next: (result: RecruitmentInterviewQuestionImportResult) => {
          this.loadQuestionBank();
          this.toastr.success(
            `Import termine: ${result.importedCount} template(s)`,
            'Recrutement',
            {
              timeOut: 2600,
              positionClass: 'toast-top-right',
            }
          );
          if (result.errors.length > 0) {
            this.toastr.warning(result.errors.join(' | '), 'Recrutement', {
              timeOut: 4200,
              positionClass: 'toast-top-right',
            });
          }
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  exportQuestionBank(format: 'csv' | 'json'): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }

    this.recruitmentService
      .exportInterviewQuestionBank({ format })
      .subscribe({
        next: (result: RecruitmentInterviewQuestionExportResult) => {
          const extension = result.format === 'csv' ? 'csv' : 'json';
          this.downloadTextFile(
            `recrutement-question-bank-${this.exportDateSuffix()}.${extension}`,
            result.content,
            result.format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8'
          );
          this.toastr.success('Export question bank genere', 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadApplications(focusReference?: string): void {
    this.recruitmentService
      .getApplications({
        q: this.searchTerm || undefined,
        status: this.selectedStatus === 'all' ? undefined : this.selectedStatus,
        campaign: this.selectedCampaign === 'all' ? undefined : this.selectedCampaign,
        source: this.selectedSource === 'all' ? undefined : this.selectedSource,
        position: this.positionFilter.trim() || undefined,
        receivedFrom: this.receivedFrom || undefined,
        receivedTo: this.receivedTo || undefined,
        page: 1,
        limit: 300,
        sortBy: 'receivedOn',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.items = items;
          this.recomputeSourceStats(items);
          this.loadNotifications();
          this.loadAuditLogs();
          this.loadApplicationScores();
          this.loadShortlistSuggestions();
          this.loadDuplicateCases();
          this.loadDuplicateLinks();
          if (focusReference) {
            this.selectedReference = focusReference;
          }
          if (this.selectedReference && !this.items.some((item) => item.reference === this.selectedReference)) {
            this.selectedReference = null;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.items = [];
          this.sourceStats = [];
          this.notifications = [];
          this.auditLogs = [];
          this.notificationSummary = {
            interviewReminders: 0,
            validationReminders: 0,
            slaAlerts: 0,
            critical: 0,
          };
          this.auditSummary = {
            createdApplications: 0,
            statusUpdates: 0,
            onboardingCreates: 0,
            campaignCreates: 0,
          };
          this.applicationScores = [];
          this.shortlistSuggestions = [];
          this.duplicateCases = [];
          this.duplicateLinks = [];
          this.selectedReference = null;
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
      });
  }

  private loadNotifications(): void {
    this.recruitmentService
      .getNotifications({
        page: 1,
        limit: 40,
        sortBy: 'sentAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.notifications = items;
          this.recomputeNotificationSummary(items);
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications = [];
          this.recomputeNotificationSummary([]);
          this.cdr.detectChanges();
        },
      });
  }

  private loadAuditLogs(): void {
    if (!this.canManageRecruitment()) {
      this.auditLogs = [];
      this.recomputeAuditSummary([]);
      return;
    }

    this.recruitmentService
      .getAuditLogs({
        page: 1,
        limit: 80,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.auditLogs = items;
          this.recomputeAuditSummary(items);
          this.cdr.detectChanges();
        },
        error: () => {
          this.auditLogs = [];
          this.recomputeAuditSummary([]);
          this.cdr.detectChanges();
        },
      });
  }

  private loadScoringPolicy(): void {
    this.recruitmentService.getScoringPolicy().subscribe({
      next: (policy) => {
        this.scoringPolicy = policy;
        this.scoringCriteriaDraft = policy.criteria.map((entry) => ({ ...entry }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.scoringPolicy = null;
        this.scoringCriteriaDraft = [];
        this.cdr.detectChanges();
      },
    });
  }

  private loadApplicationScores(): void {
    this.recruitmentService
      .getApplicationScores({
        limit: 120,
        page: 1,
        sortBy: 'totalScore',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (response) => {
          this.applicationScores = response.items;
          this.recomputeScoreSummary(response.items);
          this.cdr.detectChanges();
        },
        error: () => {
          this.applicationScores = [];
          this.recomputeScoreSummary([]);
          this.cdr.detectChanges();
        },
      });
  }

  private loadShortlistSuggestions(): void {
    this.recruitmentService
      .suggestShortlist({
        topN: this.shortlistTopN,
        includeStatuses: ['Nouveau', 'Preselection', 'Entretien'],
      })
      .subscribe({
        next: (response) => {
          this.shortlistSuggestions = response.suggested;
          this.cdr.detectChanges();
        },
        error: () => {
          this.shortlistSuggestions = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadShortlistValidations(): void {
    this.recruitmentService
      .getShortlistValidations({
        page: 1,
        limit: 100,
        sortBy: 'validatedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.shortlistValidations = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.shortlistValidations = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadDuplicateCases(): void {
    this.recruitmentService
      .getDuplicateCases({
        page: 1,
        limit: 80,
        sortBy: 'count',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.duplicateCases = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.duplicateCases = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadDuplicateLinks(): void {
    this.recruitmentService
      .getDuplicateLinks({
        page: 1,
        limit: 80,
        sortBy: 'linkedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.duplicateLinks = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.duplicateLinks = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadQuestionBank(): void {
    this.recruitmentService
      .getInterviewQuestionBank({
        latestOnly: false,
        page: 1,
        limit: 200,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.questionTemplates = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.questionTemplates = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadInterviews(): void {
    this.recruitmentService
      .getInterviews({
        page: 1,
        limit: 300,
        sortBy: 'slotStart',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.interviews = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.interviews = [];
          this.cdr.detectChanges();
        },
      });
  }

  private hydrateFocusReferenceFromRoute(): void {
    this.route.queryParamMap.subscribe((params) => {
      const focusRef = String(params.get('focusRef') || '').trim().toUpperCase();
      if (!focusRef) {
        return;
      }
      this.selectedReference = focusRef;
      this.loadApplications(focusRef);
    });
  }

  private loadCampaignOptions(): void {
    this.recruitmentService
      .getCampaigns({
        page: 1,
        limit: 300,
        sortBy: 'startDate',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (campaigns) => {
          this.campaignOptions = Array.from(
            new Set(
              campaigns
                .map((item: Campaign) => String(item.code || '').trim())
                .filter((code) => !!code)
            )
          );
          this.cdr.detectChanges();
        },
        error: () => {
          this.campaignOptions = [];
        },
      });
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      candidate: '',
      candidateEmail: '',
      candidatePhone: '',
      identityNumber: '',
      position: '',
      campaign: '',
      source: RECRUITMENT_APPLICATION_SOURCES[0],
      status: 'Nouveau',
      receivedOn: '',
      allowDuplicate: false,
    });
    this.createAttachments = [];
  }

  private recomputeSourceStats(items: Application[]): void {
    const total = items.length;
    if (total === 0) {
      this.sourceStats = [];
      return;
    }

    const counts = new Map<RecruitmentApplicationSource, number>();
    this.sourceOptions.forEach((source) => counts.set(source, 0));

    for (const item of items) {
      const source = item.source;
      const current = counts.get(source) || 0;
      counts.set(source, current + 1);
    }

    this.sourceStats = this.sourceOptions
      .map((source) => {
        const count = counts.get(source) || 0;
        const ratio = Math.round((count / total) * 1000) / 10;
        return { source, count, ratio };
      })
      .filter((entry) => entry.count > 0);
  }

  private recomputeNotificationSummary(items: RecruitmentNotificationEntry[]): void {
    let interviewReminders = 0;
    let validationReminders = 0;
    let slaAlerts = 0;
    let critical = 0;

    items.forEach((item) => {
      if (item.type === 'Relance entretien') interviewReminders += 1;
      if (item.type === 'Relance validation') validationReminders += 1;
      if (item.type === 'Alerte SLA candidature') slaAlerts += 1;
      if (item.severity === 'Critique') critical += 1;
    });

    this.notificationSummary = {
      interviewReminders,
      validationReminders,
      slaAlerts,
      critical,
    };
  }

  private recomputeAuditSummary(items: RecruitmentAuditLogEntry[]): void {
    let createdApplications = 0;
    let statusUpdates = 0;
    let onboardingCreates = 0;
    let campaignCreates = 0;

    items.forEach((item) => {
      if (item.action === 'APPLICATION_CREATED') createdApplications += 1;
      if (item.action === 'APPLICATION_STATUS_UPDATED') statusUpdates += 1;
      if (item.action === 'ONBOARDING_CREATED') onboardingCreates += 1;
      if (item.action === 'CAMPAIGN_CREATED') campaignCreates += 1;
    });

    this.auditSummary = {
      createdApplications,
      statusUpdates,
      onboardingCreates,
      campaignCreates,
    };
  }

  private recomputeScoreSummary(items: RecruitmentApplicationScoreEntry[]): void {
    if (items.length === 0) {
      this.scoreSummary = {
        average: 0,
        topScore: 0,
        eligible: 0,
      };
      return;
    }
    const total = items.reduce((sum, item) => sum + item.totalScore, 0);
    const topScore = items.reduce((max, item) => Math.max(max, item.totalScore), 0);
    const eligible = items.filter((item) => item.totalScore >= 65).length;
    this.scoreSummary = {
      average: Math.round((total / items.length) * 10) / 10,
      topScore,
      eligible,
    };
  }

  private updateStatus(
    item: Application,
    status: RecruitmentApplicationStatus,
    note: string
  ): void {
    if (!this.canManageRecruitment()) {
      this.notifyMissingManagePermission();
      return;
    }
    this.updatingReference = item.reference;
    this.recruitmentService
      .updateApplicationStatus(item.reference, {
        status,
        note,
      })
      .pipe(finalize(() => (this.updatingReference = null)))
      .subscribe({
        next: () => {
          this.toastr.success(`Statut mis a jour: ${status}`, 'Recrutement', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.loadApplications(item.reference);
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private notifyMissingManagePermission(): void {
    this.toastr.warning('Permission recrutement:manage requise', 'Recrutement', {
      timeOut: 2600,
      positionClass: 'toast-top-right',
    });
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

  private parseInterviewers(value: string): string[] {
    return Array.from(
      new Set(
        String(value || '')
          .split(/[,\n;]+/)
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0)
      )
    );
  }

  private toDateTimeLocalValue(value: string): string {
    const parsed = Date.parse(String(value || '').trim());
    if (Number.isNaN(parsed)) {
      return '';
    }
    const date = new Date(parsed);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private uploadCreateAttachment(file: File): void {
    if (!this.isAllowedAttachment(file)) {
      this.toastr.error('Type de fichier non supporte (pdf, png, jpg, jpeg, webp)', 'Recrutement', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }
    if (file.size > this.maxAttachmentBytes) {
      this.toastr.error('Fichier trop volumineux (15 Mo max)', 'Recrutement', {
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
          if (!uploaded.url) {
            this.toastr.error('URL de piece jointe invalide', 'Recrutement', {
              timeOut: 3000,
              positionClass: 'toast-top-right',
            });
            return;
          }
          const alreadyExists = this.createAttachments.some(
            (item) => item.fileName === uploaded.fileName && item.url === uploaded.url
          );
          if (!alreadyExists) {
            this.createAttachments = [...this.createAttachments, uploaded];
          }
          this.toastr.success(`Piece jointe televersee: ${uploaded.fileName}`, 'Recrutement', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Recrutement', {
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

  private openBlobPreview(blob: Blob): boolean {
    const objectUrl = URL.createObjectURL(blob);
    const popup = window.open(objectUrl, '_blank', 'noopener,noreferrer,width=980,height=760');
    const opened = !!popup;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), opened ? 60_000 : 2_000);
    return opened;
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    this.downloadObjectUrl(objectUrl, fileName);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
  }

  private downloadObjectUrl(url: string, fileName: string): void {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }

  private attachmentUrlWithDisposition(
    attachment: ApplicationAttachmentEntry,
    disposition: 'inline' | 'attachment'
  ): string {
    const normalizedUrl = String(attachment.url || '').trim();
    if (!normalizedUrl || normalizedUrl.startsWith('blob:')) {
      return normalizedUrl;
    }
    const separator = normalizedUrl.includes('?') ? '&' : '?';
    return `${normalizedUrl}${separator}disposition=${disposition}`;
  }

  private downloadTextFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const href = typeof URL !== 'undefined' ? URL.createObjectURL(blob) : '';
    if (!href) {
      return;
    }
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(href);
  }
}
