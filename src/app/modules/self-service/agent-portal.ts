import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { CreateLeaveRequestPayload, LeaveRequest, LeaveService } from '../leave/leave.service';
import {
  CreateDocumentRequestPayload,
  DocumentItem,
  DocumentRequest,
  DocumentsService,
  NotificationItem,
} from '../documents/documents.service';
import { AgentDetail, AgentDocument, AgentListItem, PersonnelService } from '../personnel/personnel.service';
import {
  CreateTrainingEnrollmentRequestPayload,
  TrainingEnrollmentRequest,
  TrainingService,
  TrainingSession,
} from '../training/training.service';

type RequestCategory = 'conge' | 'formation' | 'document';

/** Ligne unifiee de la liste « Mes demandes » (conges + formations + documents). */
interface UnifiedRequest {
  category: RequestCategory;
  categoryLabel: string;
  reference: string;
  objet: string;
  date: string;
  submittedAt: string;
  status: string;
  sortTs: number;
}

@Component({
  selector: 'app-agent-portal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agent-portal.html',
})
export class AgentPortalPage implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private leaveService = inject(LeaveService);
  private documentsService = inject(DocumentsService);
  private personnelService = inject(PersonnelService);
  private trainingService = inject(TrainingService);
  private toastr = inject(ToastrService);

  showCreateForm = false;
  showTrainingCreateForm = false;
  showDocumentCreateForm = false;
  profileLoading = false;
  isLoadingRequests = false;
  isLoadingTrainingRequests = false;
  isLoadingTrainingSessions = false;
  isLoadingDocumentRequests = false;
  submitting = false;
  submittingTrainingRequest = false;
  submittingDocumentRequest = false;
  inboxLoading = false;
  inboxUpdatingReference = '';
  notificationLoading = false;
  notificationUpdatingId = '';
  activeTab: 'requests' | 'dossier' | 'inbox' = 'requests';
  requestFilter: 'all' | RequestCategory = 'all';
  agentProfile: AgentDetail | null = null;
  recentRequests: LeaveRequest[] = [];
  trainingRequests: TrainingEnrollmentRequest[] = [];
  trainingSessions: TrainingSession[] = [];
  documentRequests: DocumentRequest[] = [];
  inboxDocuments: DocumentItem[] = [];
  notifications: NotificationItem[] = [];
  readonly fallbackPhotoUrl = './assets/images/faces/profile.jpg';

  readonly documentRequestTypeOptions = [
    'Attestation de travail',
    'Attestation de salaire',
    'Attestation de presence',
    'Autorisation d absence',
    'Ordre de mission',
    'Certificat d absence',
    'Convocation a formation',
  ];

  readonly requestFilters: { key: 'all' | RequestCategory; label: string }[] = [
    { key: 'all', label: 'Tout' },
    { key: 'conge', label: 'Conges' },
    { key: 'formation', label: 'Formations' },
    { key: 'document', label: 'Documents' },
  ];

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    agent: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    type: ['Conge annuel', [Validators.required]],
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
  });

  trainingForm = this.fb.group({
    reference: ['', [Validators.maxLength(60), Validators.pattern(/^[A-Z0-9-]*$/)]],
    sessionCode: ['', [Validators.required]],
    motivation: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(600)]],
  });

  documentRequestForm = this.fb.group({
    reference: ['', [Validators.maxLength(60), Validators.pattern(/^[A-Z0-9-]*$/)]],
    documentType: ['Attestation de travail', [Validators.required]],
    neededBy: ['', [Validators.required]],
    purpose: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(600)]],
  });

  ngOnInit(): void {
    this.resetForm();
    this.resetTrainingForm();
    this.resetDocumentRequestForm();
    this.loadAgentProfile();
    this.loadRecentRequests();
    this.loadTrainingSessions();
    this.loadTrainingRequests();
    this.loadDocumentRequests();
    this.loadInboxDocuments();
    this.loadNotifications();
  }

  get profilePhotoUrl(): string {
    return this.agentProfile?.photoUrl?.trim() || this.fallbackPhotoUrl;
  }

  get profileDisplayName(): string {
    return this.resolveAgentLabel() || 'Employe';
  }

  get profileMatricule(): string {
    return this.agentProfile?.matricule?.trim() || '-';
  }

  get profileStatusLabel(): string {
    return this.agentProfile?.status?.trim() || 'Compte employe';
  }

  get profileEmail(): string {
    const profileEmail = this.agentProfile?.email?.trim();
    if (profileEmail) {
      return profileEmail;
    }

    const username = this.currentUsername();
    return username.includes('@') ? username : '-';
  }

  get profilePhone(): string {
    return this.agentProfile?.phone?.trim() || '-';
  }

  get dossierDocuments(): AgentDocument[] {
    return this.agentProfile?.documents || [];
  }

  get approvedTrainingRequests(): TrainingEnrollmentRequest[] {
    return this.trainingRequests.filter((item) => this.normalizeStatusValue(item.status) === 'validee');
  }

  get approvedTrainingCount(): number {
    return this.approvedTrainingRequests.length;
  }

  get pendingTrainingCount(): number {
    return this.trainingRequests.filter((item) => this.normalizeStatusValue(item.status) === 'soumise').length;
  }

  get totalRequestsCount(): number {
    return this.recentRequests.length + this.trainingRequests.length + this.documentRequests.length;
  }

  setTab(tab: 'requests' | 'dossier' | 'inbox'): void {
    this.activeTab = tab;
  }

  setRequestFilter(key: 'all' | RequestCategory): void {
    this.requestFilter = key;
  }

  get isLoadingAnyRequest(): boolean {
    return this.isLoadingRequests || this.isLoadingTrainingRequests || this.isLoadingDocumentRequests;
  }

  /** Fusionne conges + formations + documents en une seule liste triee. */
  get unifiedRequests(): UnifiedRequest[] {
    const conges: UnifiedRequest[] = this.recentRequests.map((item) => ({
      category: 'conge',
      categoryLabel: 'Conge',
      reference: item.reference,
      objet: item.type || 'Absence',
      date: this.formatPeriod(item.startDate, item.endDate),
      submittedAt: '',
      status: item.status,
      sortTs: Date.parse(item.startDate || '') || 0,
    }));
    const formations: UnifiedRequest[] = this.trainingRequests.map((item) => ({
      category: 'formation',
      categoryLabel: 'Formation',
      reference: item.reference,
      objet: [item.sessionCode, item.sessionTitle].filter((value) => !!value).join(' - ') || 'Formation',
      date: item.sessionDates || '-',
      submittedAt: item.createdAt || '',
      status: item.status,
      sortTs: Date.parse(item.createdAt || '') || 0,
    }));
    const documents: UnifiedRequest[] = this.documentRequests.map((item) => ({
      category: 'document',
      categoryLabel: 'Document',
      reference: item.reference,
      objet: item.documentType || 'Document',
      date: item.neededBy || '-',
      submittedAt: item.createdAt || '',
      status: item.status,
      sortTs: Date.parse(item.createdAt || '') || 0,
    }));
    return [...conges, ...formations, ...documents].sort((left, right) => right.sortTs - left.sortTs);
  }

  get filteredRequests(): UnifiedRequest[] {
    if (this.requestFilter === 'all') {
      return this.unifiedRequests;
    }
    return this.unifiedRequests.filter((item) => item.category === this.requestFilter);
  }

  requestFilterCount(key: 'all' | RequestCategory): number {
    if (key === 'all') {
      return this.unifiedRequests.length;
    }
    return this.unifiedRequests.filter((item) => item.category === key).length;
  }

  categoryBadgeClass(category: RequestCategory): string {
    if (category === 'conge') {
      return 'bg-success-transparent';
    }
    if (category === 'formation') {
      return 'bg-primary-transparent';
    }
    return 'bg-warning-transparent';
  }

  requestStatusBadgeClass(status: string): string {
    const normalized = this.normalizeStatusValue(status);
    if (normalized === 'validee' || normalized === 'approuve' || normalized === 'approuvee') {
      return 'bg-success-transparent';
    }
    if (normalized === 'rejetee' || normalized === 'rejete' || normalized === 'refusee') {
      return 'bg-danger-transparent';
    }
    if (normalized === 'soumise' || normalized.includes('attente')) {
      return 'bg-warning-transparent';
    }
    return 'bg-primary-transparent';
  }

  private formatPeriod(start: string, end: string): string {
    const startValue = String(start || '').trim();
    const endValue = String(end || '').trim();
    if (startValue && endValue) {
      return `${startValue} → ${endValue}`;
    }
    return startValue || endValue || '-';
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

  trainingFieldError(fieldName: string): string | null {
    const control = this.trainingForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['pattern']) return 'Format invalide (A-Z, 0-9, -)';
    return 'Valeur invalide';
  }

  documentRequestFieldError(fieldName: string): string | null {
    const control = this.documentRequestForm.get(fieldName);
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
    if (this.showCreateForm) {
      this.showTrainingCreateForm = false;
      this.showDocumentCreateForm = false;
    } else {
      this.resetForm();
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  toggleTrainingCreateForm(): void {
    this.showTrainingCreateForm = !this.showTrainingCreateForm;
    if (this.showTrainingCreateForm) {
      this.showCreateForm = false;
      this.showDocumentCreateForm = false;
    } else {
      this.resetTrainingForm();
    }
  }

  cancelTrainingCreate(): void {
    this.showTrainingCreateForm = false;
    this.resetTrainingForm();
  }

  toggleDocumentCreateForm(): void {
    this.showDocumentCreateForm = !this.showDocumentCreateForm;
    if (this.showDocumentCreateForm) {
      this.showCreateForm = false;
      this.showTrainingCreateForm = false;
    } else {
      this.resetDocumentRequestForm();
    }
  }

  cancelDocumentCreate(): void {
    this.showDocumentCreateForm = false;
    this.resetDocumentRequestForm();
  }

  saveRequest(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const startDate = this.form.value.startDate || '';
    const endDate = this.form.value.endDate || '';
    const startTimestamp = Date.parse(startDate);
    const endTimestamp = Date.parse(endDate);
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp) || endTimestamp < startTimestamp) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Portail employe', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateLeaveRequestPayload = {
      reference: this.form.value.reference?.trim() || undefined,
      agent: this.resolveAgentLabel() || this.form.value.agent?.trim() || '',
      type: this.form.value.type?.trim() || '',
      startDate,
      endDate,
      status: 'En attente',
    };

    this.submitting = true;
    this.leaveService
      .createRequest(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Demande enregistree avec succes', 'Portail employe', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadRecentRequests();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Operation impossible pour le moment', 'Portail employe', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  saveTrainingRequest(): void {
    if (this.trainingForm.invalid || this.submittingTrainingRequest) {
      this.trainingForm.markAllAsTouched();
      return;
    }

    const selectedSessionCode = this.trainingForm.value.sessionCode || '';
    const selectedSession = this.trainingSessions.find((item) => item.code === selectedSessionCode);
    if (!selectedSession) {
      this.toastr.error('Selectionnez une session de formation valide', 'Portail employe', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const applicantName = this.resolveAgentLabel();
    const payload: CreateTrainingEnrollmentRequestPayload = {
      reference: this.trainingForm.value.reference?.trim() || undefined,
      sessionCode: selectedSession.code,
      sessionTitle: selectedSession.title,
      sessionDates: selectedSession.dates,
      sessionLocation: selectedSession.location,
      applicantName: applicantName || 'Agent',
      applicantUsername: this.currentUsername() || undefined,
      motivation: this.trainingForm.value.motivation?.trim() || '',
    };

    this.submittingTrainingRequest = true;
    this.trainingService
      .createRequest(payload)
      .pipe(finalize(() => (this.submittingTrainingRequest = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Demande de formation enregistree', 'Portail employe', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showTrainingCreateForm = false;
          this.resetTrainingForm();
          this.loadTrainingRequests();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de soumettre la demande de formation', 'Portail employe', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  saveDocumentRequest(): void {
    if (this.documentRequestForm.invalid || this.submittingDocumentRequest) {
      this.documentRequestForm.markAllAsTouched();
      return;
    }

    const requesterName = this.resolveAgentLabel();
    const payload: CreateDocumentRequestPayload = {
      reference: this.documentRequestForm.value.reference?.trim() || undefined,
      documentType: this.documentRequestForm.value.documentType?.trim() || '',
      requesterName: requesterName || 'Agent',
      requesterUsername: this.currentUsername() || undefined,
      neededBy: this.documentRequestForm.value.neededBy || '',
      purpose: this.documentRequestForm.value.purpose?.trim() || '',
    };

    this.submittingDocumentRequest = true;
    this.documentsService
      .createDocumentRequest(payload)
      .pipe(finalize(() => (this.submittingDocumentRequest = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Demande de document enregistree', 'Portail employe', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showDocumentCreateForm = false;
          this.resetDocumentRequestForm();
          this.loadDocumentRequests();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de soumettre la demande de document', 'Portail employe', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  openInboxDocument(item: DocumentItem): void {
    if (!item) {
      return;
    }

    this.markInboxRead(item, true);
    const html = this.buildPrintableDocumentHtml(item);
    const fileName = `document-recu-${(item.reference || 'rh').toLowerCase()}`;
    this.openPrintableWindow(html, fileName);
  }

  markInboxRead(item: DocumentItem, silent = false): void {
    if (!item || this.inboxUpdatingReference) {
      return;
    }
    if (item.deliveryStatus === 'Lu' || item.deliveryStatus === 'Accuse reception') {
      return;
    }

    this.inboxUpdatingReference = item.reference;
    this.documentsService
      .markInboxRead(item.reference)
      .pipe(finalize(() => (this.inboxUpdatingReference = '')))
      .subscribe({
        next: (updated) => {
          this.replaceInboxDocument(updated);
          if (!silent) {
            this.toastr.success('Document marque comme lu', 'Portail employe', {
              timeOut: 2200,
              positionClass: 'toast-top-right',
            });
          }
          this.cdr.detectChanges();
        },
        error: () => {
          if (!silent) {
            this.toastr.error('Impossible de mettre a jour la lecture', 'Portail employe', {
              timeOut: 3200,
              positionClass: 'toast-top-right',
            });
          }
        },
      });
  }

  acknowledgeInbox(item: DocumentItem): void {
    if (!item || this.inboxUpdatingReference) {
      return;
    }
    if (item.deliveryStatus === 'Accuse reception') {
      return;
    }

    this.inboxUpdatingReference = item.reference;
    this.documentsService
      .acknowledgeInbox(item.reference)
      .pipe(finalize(() => (this.inboxUpdatingReference = '')))
      .subscribe({
        next: (updated) => {
          this.replaceInboxDocument(updated);
          this.toastr.success('Accuse de reception enregistre', 'Portail employe', {
            timeOut: 2600,
            positionClass: 'toast-top-right',
          });
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de confirmer la reception', 'Portail employe', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  canAcknowledge(item: DocumentItem): boolean {
    return !!item && item.deliveryStatus !== 'Accuse reception';
  }

  canMarkRead(item: DocumentItem): boolean {
    return !!item && item.deliveryStatus !== 'Lu' && item.deliveryStatus !== 'Accuse reception';
  }

  profileStatusBadgeClass(status: string): string {
    const normalized = this.normalizeStatusValue(status);
    if (normalized === 'actif') {
      return 'bg-success-transparent';
    }
    if (normalized.includes('absence')) {
      return 'bg-warning-transparent';
    }
    if (normalized === 'inactif') {
      return 'bg-danger-transparent';
    }
    if (normalized === 'brouillon') {
      return 'bg-info-transparent';
    }
    return 'bg-primary-transparent';
  }

  deliveryBadgeClass(item: DocumentItem): string {
    const status = String(item?.deliveryStatus || '').toLowerCase();
    if (status.includes('accuse')) {
      return 'bg-success-transparent';
    }
    if (status === 'lu') {
      return 'bg-info-transparent';
    }
    if (status === 'assigne') {
      return 'bg-warning-transparent';
    }
    return 'bg-light text-dark';
  }

  trainingStatusBadgeClass(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'validee') {
      return 'bg-success-transparent';
    }
    if (normalized === 'rejetee') {
      return 'bg-danger-transparent';
    }
    if (normalized === 'soumise') {
      return 'bg-warning-transparent';
    }
    return 'bg-primary-transparent';
  }

  documentRequestStatusBadgeClass(status: string): string {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized === 'validee') {
      return 'bg-success-transparent';
    }
    if (normalized === 'rejetee') {
      return 'bg-danger-transparent';
    }
    if (normalized === 'soumise') {
      return 'bg-warning-transparent';
    }
    return 'bg-primary-transparent';
  }

  notificationBadgeClass(item: NotificationItem): string {
    if (!item || !item.isRead) {
      return 'bg-warning-transparent';
    }
    return 'bg-success-transparent';
  }

  markNotificationRead(item: NotificationItem): void {
    if (!item || item.isRead || this.notificationUpdatingId) {
      return;
    }

    this.notificationUpdatingId = item.id;
    this.documentsService
      .markNotificationRead(item.id)
      .pipe(finalize(() => (this.notificationUpdatingId = '')))
      .subscribe({
        next: (updated) => {
          this.replaceNotification(updated);
          this.cdr.detectChanges();
        },
        error: () => {
          this.toastr.error('Impossible de marquer la notification comme lue', 'Portail employe', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadRecentRequests(): void {
    const agent = this.resolveAgentLabel();
    if (!agent) {
      this.recentRequests = [];
      this.isLoadingRequests = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoadingRequests = true;
    this.leaveService
      .getRequests({
        page: 1,
        limit: 5,
        sortBy: 'startDate',
        sortOrder: 'desc',
        agent,
      })
      .pipe(finalize(() => (this.isLoadingRequests = false)))
      .subscribe({
        next: (items) => {
          this.recentRequests = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.recentRequests = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadTrainingSessions(): void {
    this.isLoadingTrainingSessions = true;
    this.trainingService
      .getSessions({
        page: 1,
        limit: 200,
        sortBy: 'dates',
        sortOrder: 'asc',
      })
      .pipe(finalize(() => (this.isLoadingTrainingSessions = false)))
      .subscribe({
        next: (items) => {
          this.trainingSessions = items.filter((item) => String(item.status || '').toLowerCase() === 'ouverte');
          this.cdr.detectChanges();
        },
        error: () => {
          this.trainingSessions = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadTrainingRequests(): void {
    this.isLoadingTrainingRequests = true;
    const username = this.currentUsername();

    this.trainingService
      .getRequests({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        applicantUsername: username || undefined,
      })
      .pipe(finalize(() => (this.isLoadingTrainingRequests = false)))
      .subscribe({
        next: (items) => {
          this.trainingRequests = items;
          if (!this.agentProfile) {
            this.syncAgentIdentityInForms();
            this.loadRecentRequests();
            this.loadAgentProfile();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.trainingRequests = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadDocumentRequests(): void {
    this.isLoadingDocumentRequests = true;
    const username = this.currentUsername();

    this.documentsService
      .getDocumentRequests({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        requesterUsername: username || undefined,
      })
      .pipe(finalize(() => (this.isLoadingDocumentRequests = false)))
      .subscribe({
        next: (items) => {
          this.documentRequests = items;
          if (!this.agentProfile) {
            this.syncAgentIdentityInForms();
            this.loadRecentRequests();
            this.loadAgentProfile();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.documentRequests = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadInboxDocuments(): void {
    this.inboxLoading = true;
    this.documentsService
      .getInboxDocuments({
        page: 1,
        limit: 20,
        sortBy: 'assignedAt',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.inboxLoading = false)))
      .subscribe({
        next: (items) => {
          this.inboxDocuments = items;
          if (!this.agentProfile) {
            this.syncAgentIdentityInForms();
            this.loadRecentRequests();
            this.loadAgentProfile();
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.inboxDocuments = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadNotifications(): void {
    this.notificationLoading = true;
    this.documentsService
      .getMyNotifications({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.notificationLoading = false)))
      .subscribe({
        next: (items) => {
          this.notifications = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications = [];
          this.cdr.detectChanges();
        },
      });
  }

  private replaceInboxDocument(updated: DocumentItem): void {
    const index = this.inboxDocuments.findIndex((item) => item.reference === updated.reference);
    if (index < 0) {
      this.inboxDocuments = [updated, ...this.inboxDocuments];
      return;
    }

    const clone = [...this.inboxDocuments];
    clone[index] = updated;
    this.inboxDocuments = clone;
  }

  private replaceNotification(updated: NotificationItem): void {
    const index = this.notifications.findIndex((item) => item.id === updated.id);
    if (index < 0) {
      this.notifications = [updated, ...this.notifications];
      return;
    }
    const clone = [...this.notifications];
    clone[index] = updated;
    this.notifications = clone;
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      agent: this.resolveAgentLabel(),
      type: 'Conge annuel',
      startDate: '',
      endDate: '',
    });
  }

  private resetTrainingForm(): void {
    this.trainingForm.reset({
      reference: '',
      sessionCode: '',
      motivation: '',
    });
  }

  private resetDocumentRequestForm(): void {
    this.documentRequestForm.reset({
      reference: '',
      documentType: 'Attestation de travail',
      neededBy: '',
      purpose: '',
    });
  }

  private loadAgentProfile(): void {
    if (this.profileLoading || this.agentProfile) {
      return;
    }

    const lookupLabels = this.lookupAgentLabels();
    const username = this.currentUsername();
    if (!lookupLabels.length && !username) {
      return;
    }

    this.profileLoading = true;
    this.personnelService
      .getAgents({
        page: 1,
        limit: 400,
        sortBy: 'fullName',
        sortOrder: 'asc',
      })
      .pipe(
        map((items) => this.findBestAgentMatch(items)),
        switchMap((match) => (match?.id ? this.personnelService.getAgentById(match.id) : of(null))),
        catchError(() => of(null)),
        finalize(() => (this.profileLoading = false))
      )
      .subscribe((agent) => {
        this.agentProfile = agent;
        this.syncAgentIdentityInForms();
        this.loadRecentRequests();
        this.cdr.detectChanges();
      });
  }

  private findBestAgentMatch(items: AgentListItem[]): AgentListItem | null {
    const labels = this.lookupAgentLabels()
      .map((value) => this.normalizeForMatch(value))
      .filter((value) => value.length > 0);

    if (!labels.length) {
      return null;
    }

    const exactMatch = items.find((item) => {
      const fullName = this.normalizeForMatch(item.fullName);
      const matricule = this.normalizeForMatch(item.matricule);
      return labels.some((label) => label === fullName || label === matricule);
    });
    if (exactMatch) {
      return exactMatch;
    }

    return (
      items.find((item) => {
        const fullName = this.normalizeForMatch(item.fullName);
        return labels.some((label) => fullName.includes(label) || label.includes(fullName));
      }) || null
    );
  }

  private lookupAgentLabels(): string[] {
    const values = [
      this.inferAgentLabel(),
      ...this.trainingRequests.map((item) => item.applicantName),
      ...this.documentRequests.map((item) => item.requesterName),
      ...this.inboxDocuments.map((item) => item.assignedEmployeeName || item.employeeName || item.owner),
    ];

    return Array.from(
      new Set(
        values
          .map((value) => String(value || '').trim())
          .filter((value) => value.length > 0)
      )
    );
  }

  private syncAgentIdentityInForms(): void {
    const agentLabel = this.resolveAgentLabel();
    if (!agentLabel) {
      return;
    }

    if (this.form.value.agent !== agentLabel) {
      this.form.patchValue({ agent: agentLabel }, { emitEvent: false });
    }
  }

  private resolveAgentLabel(): string {
    const candidates = [
      this.agentProfile?.fullName,
      ...this.trainingRequests.map((item) => item.applicantName),
      ...this.documentRequests.map((item) => item.requesterName),
      ...this.inboxDocuments.map((item) => item.assignedEmployeeName || item.employeeName || item.owner),
      this.inferAgentLabel(),
    ];

    return (
      candidates
        .map((value) => String(value || '').trim())
        .find((value) => value.length > 0) || ''
    );
  }

  private normalizeForMatch(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private normalizeStatusValue(value: string): string {
    return this.normalizeForMatch(value);
  }

  private inferAgentLabel(): string {
    const username = this.currentUsername();
    if (!username) {
      return '';
    }

    const localPart = username.split('@')[0] || username;
    const words = localPart
      .split(/[._-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);

    return words.join(' ');
  }

  private currentUsername(): string {
    return String(localStorage.getItem('rh_username') || '').trim().toLowerCase();
  }

  private openPrintableWindow(html: string, fileName: string): void {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const popup = window.open(objectUrl, '_blank', 'noopener,noreferrer,width=980,height=760');

    if (!popup) {
      URL.revokeObjectURL(objectUrl);
      this.downloadBlob(blob, `${fileName}.html`);
      this.toastr.warning('Popup bloquee. Document telecharge: ouvre-le puis imprime en PDF.', 'Portail employe', {
        timeOut: 3600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const triggerPrint = () => {
      try {
        popup.focus();
        popup.print();
      } catch {
        // Ignore browser print restrictions.
      }
    };

    popup.addEventListener('load', () => {
      window.setTimeout(() => {
        triggerPrint();
        URL.revokeObjectURL(objectUrl);
      }, 320);
    });

    window.setTimeout(() => {
      if (!popup.closed) {
        triggerPrint();
      }
      URL.revokeObjectURL(objectUrl);
    }, 1300);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  private buildPrintableDocumentHtml(item: DocumentItem): string {
    const generatedAt = new Date().toLocaleString('fr-FR');
    const title = this.escapeHtml(item.title || item.type);
    const reference = this.escapeHtml(item.reference || '-');
    const owner = this.escapeHtml(item.owner || '-');
    const status = this.escapeHtml(item.status || '-');
    const deliveryStatus = this.escapeHtml(item.deliveryStatus || '-');
    const assignedAt = this.escapeHtml(item.assignedAt || '-');
    const assignmentDueAt = this.escapeHtml(item.assignmentDueAt || '-');
    const assignedBy = this.escapeHtml(item.assignedBy || '-');
    const employeeName = this.escapeHtml(item.employeeName || '-');
    const employeeId = this.escapeHtml(item.employeeId || '-');
    const direction = this.escapeHtml(item.direction || '-');
    const unit = this.escapeHtml(item.unit || '-');
    const period = this.escapeHtml(
      item.startDate && item.endDate ? `${item.startDate} -> ${item.endDate}` : item.issuedAt || '-'
    );
    const notes = this.escapeHtml(item.notes || '-');
    const signedAt = this.escapeHtml(item.signedAt || '-');
    const signedBy = this.escapeHtml(item.signedBy || '-');
    const stampLabel = this.escapeHtml(item.stampLabel || '-');
    const verificationCode = this.escapeHtml(item.verificationCode || '-');
    const generated = this.escapeHtml(generatedAt);

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: "Times New Roman", serif; margin: 18px; color: #111827; }
    .box { border: 1px solid #d1d5db; padding: 16px; }
    h1 { text-align: center; font-size: 20px; margin: 8px 0 16px; text-transform: uppercase; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; }
    th { width: 34%; background: #f8fafc; }
    .note { margin-top: 16px; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="box">
    <h1>${title}</h1>
    <div class="meta">
      <div><strong>Reference:</strong> ${reference}</div>
      <div><strong>Service:</strong> ${owner}</div>
      <div><strong>Statut:</strong> ${status}</div>
    </div>
    <table>
      <tr><th>Employe</th><td>${employeeName}</td></tr>
      <tr><th>Matricule</th><td>${employeeId}</td></tr>
      <tr><th>Direction / Unite</th><td>${direction} / ${unit}</td></tr>
      <tr><th>Periode / Emission</th><td>${period}</td></tr>
      <tr><th>Transmission</th><td>${deliveryStatus}</td></tr>
      <tr><th>Date assignation</th><td>${assignedAt}</td></tr>
      <tr><th>Date limite reception</th><td>${assignmentDueAt}</td></tr>
      <tr><th>Assigne par</th><td>${assignedBy}</td></tr>
      <tr><th>Signe le</th><td>${signedAt}</td></tr>
      <tr><th>Signataire</th><td>${signedBy}</td></tr>
      <tr><th>Cachet</th><td>${stampLabel}</td></tr>
      <tr><th>Code verification</th><td>${verificationCode}</td></tr>
      <tr><th>Observations</th><td>${notes}</td></tr>
    </table>
    <div class="note">Document consulte depuis le Portail employe. Genere le ${generated}.</div>
  </div>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return String(value || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
