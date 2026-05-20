import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize, firstValueFrom, forkJoin } from 'rxjs';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import {
  DocumentAnalysisField,
  DocumentAnalysisRun,
  DocumentRequirement,
  AssignDocumentPayload,
  DocumentTypeDefinition,
  CreateDocumentRequestPayload,
  CreateDocumentPayload,
  DocumentAnalyticsReport,
  DocumentArchivePurgeResult,
  DocumentArchiveRunResult,
  DocumentAuditLogItem,
  DocumentItem,
  DocumentOverdueItem,
  DocumentProcessingQueueItem,
  DocumentRequest,
  DocumentRequestDecisionPayload,
  DocumentsService,
  NotificationItem,
  SignDocumentPayload,
  UpdateDocumentPayload,
} from '../../documents.service';

type DetailPanelRow = { label: string; value: string };
type AnalysisFieldDraft = {
  fieldValueText?: string;
  fieldValueDate?: string;
  fieldValueNumber?: string;
  fieldValueBoolean?: 'true' | 'false' | '';
  normalizedValue?: string;
  isValidated?: boolean;
};

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-library.html',
  styleUrls: ['./document-library.scss'],
})
export class DocumentLibraryPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private documentsService = inject(DocumentsService);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private accessControl = inject(AccessControlService);

  private typeSub?: Subscription;
  private inboxFilterSub?: Subscription;
  private requestFilterSub?: Subscription;
  private notificationFilterSub?: Subscription;
  private routeStateSub?: Subscription;
  private isHydratingRouteState = false;
  private lastSerializedRouteState = '';

  readonly fallbackDocumentTypeOptions = [
    'Ordre de mission',
    'Ordre de mission collectif',
    'Certificat d absence',
    'Autorisation d absence',
    'Attestation de presence',
    'Attestation de travail',
    'Attestation de salaire',
    'Demande de conge',
    'Decision de conge',
    'Decision d affectation',
    'Convocation a formation',
    'Rapport de mission',
    'Notification disciplinaire',
  ];
  documentTypeOptions = [...this.fallbackDocumentTypeOptions];
  documentTypeDefinitions: DocumentTypeDefinition[] = [];
  documentRequirements: DocumentRequirement[] = [];
  readonly statusOptions = ['Brouillon', 'En validation', 'Valide', 'Publie', 'Archive'];
  readonly sourceModuleOptionsBase = ['PERSONNEL', 'DOCUMENTS', 'LEAVE', 'DISCIPLINE', 'WORKFLOW', 'RECRUITMENT'];
  readonly analysisStatusOptionsBase = ['NOT_REQUESTED', 'REVIEW_REQUIRED', 'COMPLETED', 'FAILED'];
  readonly confidentialityLevelOptions = ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'STRICTLY_CONFIDENTIAL'];
  readonly requestStatusOptions = ['Soumise', 'Validee', 'Rejetee'];
  readonly statusTransitions: Record<string, string[]> = {
    Brouillon: ['En validation', 'Archive'],
    'En validation': ['Brouillon', 'Valide', 'Archive'],
    Valide: ['En validation', 'Publie', 'Archive'],
    Publie: ['Archive'],
    Archive: [],
  };
  readonly workspaceTabs: Array<'bibliotheque' | 'traitement' | 'inbox' | 'demandes' | 'notifications'> = [
    'bibliotheque',
    'traitement',
    'inbox',
    'demandes',
    'notifications',
  ];
  readonly readStateFilterOptions = ['Tous', 'Non lu', 'Lu', 'Accuse reception'];
  readonly pageSizeOptions = [5, 10, 20, 50];

  items: DocumentItem[] = [];
  processingQueueItems: DocumentProcessingQueueItem[] = [];
  analytics: DocumentAnalyticsReport = this.emptyAnalytics();
  overdueItems: DocumentOverdueItem[] = [];
  inboxItems: DocumentItem[] = [];
  filteredInboxItems: DocumentItem[] = [];
  pagedInboxItems: DocumentItem[] = [];
  inboxDeliveryStatusOptions: string[] = [];
  documentRequests: DocumentRequest[] = [];
  filteredDocumentRequests: DocumentRequest[] = [];
  pagedDocumentRequests: DocumentRequest[] = [];
  requestTypeOptions: string[] = [];
  notifications: NotificationItem[] = [];
  filteredNotifications: NotificationItem[] = [];
  pagedNotifications: NotificationItem[] = [];
  notificationCategoryOptions: string[] = [];
  lastArchiveRun: DocumentArchiveRunResult | null = null;
  lastPurgeRun: DocumentArchivePurgeResult | null = null;
  auditItems: DocumentAuditLogItem[] = [];
  analysisRuns: DocumentAnalysisRun[] = [];
  selectedAnalysisRunId = '';
  analysisFieldDrafts: Record<string, AnalysisFieldDraft> = {};
  showCreateForm = false;
  submitting = false;
  assigning = false;
  signing = false;
  analyzing = false;
  transitioning = false;
  auditLoading = false;
  analyticsLoading = false;
  processingQueueLoading = false;
  analysisLoading = false;
  inboxLoading = false;
  requestsLoading = false;
  notificationsLoading = false;
  requestSubmitting = false;
  requestDecisionSubmitting = false;
  maintenanceRunning = false;
  inboxUpdatingReference = '';
  notificationUpdatingId = '';
  requestDecisionReference = '';
  analysisSavingFieldKey = '';
  bulkActionRunning = false;
  bulkActionLabel = '';
  activeWorkspaceTab: 'bibliotheque' | 'traitement' | 'inbox' | 'demandes' | 'notifications' = 'bibliotheque';
  editingReference: string | null = null;
  selectedReference = '';
  inboxSelection = new Set<string>();
  requestSelection = new Set<string>();
  notificationSelection = new Set<string>();
  detailDrawerOpen = false;
  detailPanelTitle = '';
  detailPanelSubtitle = '';
  detailPanelStatus = '';
  detailPanelDescription = '';
  detailPanelRows: DetailPanelRow[] = [];
  inboxPage = 1;
  inboxTotalPages = 1;
  requestPage = 1;
  requestTotalPages = 1;
  notificationPage = 1;
  notificationTotalPages = 1;

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    type: ['Ordre de mission', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    sourceModule: ['DOCUMENTS', [Validators.required]],
    confidentialityLevel: ['INTERNAL', [Validators.required]],
    owner: ['Direction RH', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    status: ['Brouillon', [Validators.required]],
    updatedAt: [this.todayInputValue(), [Validators.required]],
    employeeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    employeeId: ['', [Validators.maxLength(40)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    unit: ['', [Validators.maxLength(120)]],
    issuedAt: [this.todayInputValue(), [Validators.required]],
    startDate: [''],
    endDate: [''],
    expiresOn: [''],
    requiresAcknowledgement: [false],
    approver: ['', [Validators.maxLength(120)]],
    missionDestination: ['', [Validators.maxLength(140)]],
    missionPurpose: ['', [Validators.maxLength(220)]],
    absenceReason: ['', [Validators.maxLength(220)]],
    notes: ['', [Validators.maxLength(600)]],
  });

  libraryFiltersForm = this.fb.group({
    q: [''],
    status: ['Tous'],
    typeCode: ['Tous'],
    sourceModule: ['Tous'],
    analysisStatus: ['Tous'],
    confidentialityLevel: ['Tous'],
  });

  assignForm = this.fb.group({
    employeeId: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    employeeName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    recipientUsername: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    note: ['', [Validators.maxLength(400)]],
    assignmentDueAt: [this.addDaysInputValue(3), [Validators.required]],
    reminderAt: [this.addDaysInputValue(2), [Validators.required]],
    forceReassign: [false],
  });

  requestForm = this.fb.group({
    documentType: ['Attestation de travail', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    purpose: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(400)]],
    neededBy: [this.addDaysInputValue(5), [Validators.required]],
  });

  inboxFiltersForm = this.fb.group({
    q: [''],
    readState: ['Tous'],
    deliveryStatus: ['Tous'],
    pageSize: [10],
  });

  requestFiltersForm = this.fb.group({
    q: [''],
    status: ['Tous'],
    documentType: ['Tous'],
    pageSize: [10],
  });

  notificationFiltersForm = this.fb.group({
    q: [''],
    readState: ['Tous'],
    category: ['Tous'],
    pageSize: [10],
  });

  ngOnInit(): void {
    this.loadDocumentReferenceData();
    this.loadDocuments();
    this.loadInboxDocuments();
    this.loadDocumentRequests();
    this.loadNotifications();
    this.applyConditionalValidators();
    this.typeSub = this.form.controls.type.valueChanges.subscribe(() => {
      this.applyConditionalValidators();
    });
    this.inboxFilterSub = this.inboxFiltersForm.valueChanges.subscribe(() => {
      this.inboxPage = 1;
      this.applyInboxFilters();
      this.syncRouteStateToUrl();
    });
    this.requestFilterSub = this.requestFiltersForm.valueChanges.subscribe(() => {
      this.requestPage = 1;
      this.applyRequestFilters();
      this.syncRouteStateToUrl();
    });
    this.notificationFilterSub = this.notificationFiltersForm.valueChanges.subscribe(() => {
      this.notificationPage = 1;
      this.applyNotificationFilters();
      this.syncRouteStateToUrl();
    });
    this.routeStateSub = this.route.queryParamMap.subscribe((params) => {
      this.applyRouteState(params);
    });
    this.hydrateStateFromRoute();
  }

  ngOnDestroy(): void {
    this.typeSub?.unsubscribe();
    this.inboxFilterSub?.unsubscribe();
    this.requestFilterSub?.unsubscribe();
    this.notificationFilterSub?.unsubscribe();
    this.routeStateSub?.unsubscribe();
  }

  get isEditMode(): boolean {
    return !!this.editingReference;
  }

  get selectedItem(): DocumentItem | null {
    const reference = this.selectedReference.trim();
    if (!reference) {
      return null;
    }
    return this.items.find((entry) => entry.reference === reference) || null;
  }

  get selectedAnalysisRun(): DocumentAnalysisRun | null {
    if (!this.analysisRuns.length) {
      return null;
    }

    if (this.selectedAnalysisRunId) {
      return this.analysisRuns.find((item) => item.id === this.selectedAnalysisRunId) || this.analysisRuns[0];
    }

    return this.analysisRuns[0];
  }

  get selectedDocumentRequirements(): DocumentRequirement[] {
    const item = this.selectedItem;
    if (!item) {
      return [];
    }

    const typeCode = this.resolveDocumentTypeCode(item);
    if (!typeCode) {
      return [];
    }

    return this.documentRequirements.filter((entry) => entry.documentTypeCode === typeCode);
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

  assignFieldError(fieldName: string): string | null {
    const control = this.assignForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['email']) return 'Email / username invalide';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Valeur invalide';
  }

  requestFieldError(fieldName: string): string | null {
    const control = this.requestForm.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    return 'Valeur invalide';
  }

  setWorkspaceTab(tab: 'bibliotheque' | 'traitement' | 'inbox' | 'demandes' | 'notifications'): void {
    this.activeWorkspaceTab = tab;
    this.closeDetailPanel();
    this.syncRouteStateToUrl();
  }

  unreadNotificationsCount(): number {
    return this.notifications.filter((item) => !item.isRead).length;
  }

  pendingRequestsCount(): number {
    return this.documentRequests.filter((item) => this.normalizeRequestStatus(item.status) === 'Soumise').length;
  }

  processingQueuePendingCount(): number {
    return this.processingQueueItems.filter((item) => String(item.nextAction || '').trim().toUpperCase() !== 'NONE').length;
  }

  applyLibraryFilters(): void {
    this.loadDocuments();
  }

  resetLibraryFilters(): void {
    this.libraryFiltersForm.reset({
      q: '',
      status: 'Tous',
      typeCode: 'Tous',
      sourceModule: 'Tous',
      analysisStatus: 'Tous',
      confidentialityLevel: 'Tous',
    });
    this.loadDocuments();
  }

  inboxSelectionCount(): number {
    return this.inboxSelection.size;
  }

  requestSelectionCount(): number {
    return this.requestSelection.size;
  }

  notificationSelectionCount(): number {
    return this.notificationSelection.size;
  }

  isInboxSelected(item: DocumentItem): boolean {
    return !!item?.reference && this.inboxSelection.has(item.reference);
  }

  isRequestSelected(item: DocumentRequest): boolean {
    return !!item?.reference && this.requestSelection.has(item.reference);
  }

  isNotificationSelected(item: NotificationItem): boolean {
    return !!item?.id && this.notificationSelection.has(item.id);
  }

  areAllInboxPageSelected(): boolean {
    if (!this.pagedInboxItems.length) {
      return false;
    }
    return this.pagedInboxItems.every((item) => this.inboxSelection.has(item.reference));
  }

  areAllRequestPageSelected(): boolean {
    if (!this.pagedDocumentRequests.length) {
      return false;
    }
    return this.pagedDocumentRequests.every((item) => this.requestSelection.has(item.reference));
  }

  areAllNotificationPageSelected(): boolean {
    if (!this.pagedNotifications.length) {
      return false;
    }
    return this.pagedNotifications.every((item) => this.notificationSelection.has(item.id));
  }

  toggleInboxSelection(item: DocumentItem, checked: boolean): void {
    if (!item?.reference) {
      return;
    }
    if (checked) {
      this.inboxSelection.add(item.reference);
      return;
    }
    this.inboxSelection.delete(item.reference);
  }

  toggleRequestSelection(item: DocumentRequest, checked: boolean): void {
    if (!item?.reference) {
      return;
    }
    if (checked) {
      this.requestSelection.add(item.reference);
      return;
    }
    this.requestSelection.delete(item.reference);
  }

  toggleNotificationSelection(item: NotificationItem, checked: boolean): void {
    if (!item?.id) {
      return;
    }
    if (checked) {
      this.notificationSelection.add(item.id);
      return;
    }
    this.notificationSelection.delete(item.id);
  }

  toggleInboxPageSelection(checked: boolean): void {
    this.pagedInboxItems.forEach((item) => this.toggleInboxSelection(item, checked));
  }

  toggleRequestPageSelection(checked: boolean): void {
    this.pagedDocumentRequests.forEach((item) => this.toggleRequestSelection(item, checked));
  }

  toggleNotificationPageSelection(checked: boolean): void {
    this.pagedNotifications.forEach((item) => this.toggleNotificationSelection(item, checked));
  }

  clearInboxSelection(): void {
    this.inboxSelection.clear();
  }

  clearRequestSelection(): void {
    this.requestSelection.clear();
  }

  clearNotificationSelection(): void {
    this.notificationSelection.clear();
  }

  async bulkMarkInboxRead(): Promise<void> {
    if (this.bulkActionRunning) {
      return;
    }

    const candidates = this.inboxItems.filter((item) => this.inboxSelection.has(item.reference) && !item.readAt);
    if (!candidates.length) {
      this.toastr.warning('Aucun document selectionne a marquer lu', 'Documents', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!window.confirm(`Marquer ${candidates.length} document(s) comme lus ?`)) {
      return;
    }

    this.startBulkAction('Marquage lecture inbox');
    const result = await this.runBulk(candidates, async (item) => {
      await firstValueFrom(this.documentsService.markInboxRead(item.reference));
    });
    this.endBulkAction();

    this.toastBulkResult(result.success, result.failure, 'document(s) inbox marques lus');
    this.clearInboxSelection();
    this.loadInboxDocuments();
  }

  async bulkAcknowledgeInbox(): Promise<void> {
    if (this.bulkActionRunning) {
      return;
    }

    const candidates = this.inboxItems.filter((item) => this.inboxSelection.has(item.reference) && !item.acknowledgedAt);
    if (!candidates.length) {
      this.toastr.warning('Aucun document selectionne a accuser', 'Documents', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!window.confirm(`Accuser reception pour ${candidates.length} document(s) ?`)) {
      return;
    }

    this.startBulkAction('Accuse reception inbox');
    const result = await this.runBulk(candidates, async (item) => {
      await firstValueFrom(
        this.documentsService.acknowledgeInbox(item.reference, 'Accuse reception confirme depuis action groupee')
      );
    });
    this.endBulkAction();

    this.toastBulkResult(result.success, result.failure, 'accuse(s) de reception envoyes');
    this.clearInboxSelection();
    this.loadInboxDocuments();
    this.loadDocuments();
  }

  async bulkDecideRequests(action: 'APPROUVER' | 'REJETER'): Promise<void> {
    if (!this.ensureManageDocuments('decider les demandes documentaires')) {
      return;
    }

    if (this.bulkActionRunning) {
      return;
    }

    const candidates = this.documentRequests.filter(
      (item) => this.requestSelection.has(item.reference) && this.normalizeRequestStatus(item.status) === 'Soumise'
    );
    if (!candidates.length) {
      this.toastr.warning('Aucune demande soumise selectionnee', 'Documents', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    let reason = '';
    if (action === 'REJETER') {
      reason = (window.prompt('Motif commun du rejet (obligatoire):', '') || '').trim();
      if (!reason) {
        this.toastr.warning('Motif obligatoire pour rejet groupe', 'Documents', {
          timeOut: 2800,
          positionClass: 'toast-top-right',
        });
        return;
      }
    } else {
      reason = (window.prompt('Commentaire commun de validation (optionnel):', '') || '').trim();
    }

    const payload: DocumentRequestDecisionPayload = {
      action,
      reason: reason || undefined,
    };

    const label = action === 'APPROUVER' ? 'Validation groupee demandes' : 'Rejet groupe demandes';
    this.startBulkAction(label);
    const result = await this.runBulk(candidates, async (item) => {
      await firstValueFrom(this.documentsService.decideDocumentRequest(item.reference, payload));
    });
    this.endBulkAction();

    const successLabel = action === 'APPROUVER' ? 'demande(s) validee(s)' : 'demande(s) rejetee(s)';
    this.toastBulkResult(result.success, result.failure, successLabel);
    this.clearRequestSelection();
    this.loadDocumentRequests();
  }

  async bulkMarkNotificationsRead(): Promise<void> {
    if (this.bulkActionRunning) {
      return;
    }

    const candidates = this.notifications.filter((item) => this.notificationSelection.has(item.id) && !item.isRead);
    if (!candidates.length) {
      this.toastr.warning('Aucune notification non lue selectionnee', 'Documents', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (!window.confirm(`Marquer ${candidates.length} notification(s) comme lues ?`)) {
      return;
    }

    this.startBulkAction('Marquage notifications');
    const result = await this.runBulk(candidates, async (item) => {
      await firstValueFrom(this.documentsService.markNotificationRead(item.id));
    });
    this.endBulkAction();

    this.toastBulkResult(result.success, result.failure, 'notification(s) marquee(s) lue(s)');
    this.clearNotificationSelection();
    this.loadNotifications();
    this.loadAnalytics();
  }

  openDocumentDetail(item: DocumentItem): void {
    this.openDetailPanel(
      `Document ${item.reference}`,
      item.title || item.type || 'Document RH',
      item.status || '-',
      [
        { label: 'Type', value: item.type },
        { label: 'Agent', value: item.employeeName || '-' },
        { label: 'Matricule', value: item.employeeId || '-' },
        { label: 'Direction', value: item.direction || '-' },
        { label: 'Destinataire', value: item.recipientUsername || '-' },
        { label: 'Transmission', value: this.deliveryStatusLabel(item) },
        { label: 'Date emission', value: this.toDateInputValue(item.issuedAt || '-') || '-' },
        { label: 'Signe le', value: this.datetimeLabel(item.signedAt || '-') || '-' },
        { label: 'Code verification', value: item.verificationCode || '-' },
      ],
      item.notes || ''
    );
  }

  openRequestDetail(item: DocumentRequest): void {
    this.openDetailPanel(
      `Demande ${item.reference}`,
      item.documentType || 'Demande document',
      this.normalizeRequestStatus(item.status),
      [
        { label: 'Demandeur', value: item.requesterName || '-' },
        { label: 'Compte', value: item.requesterUsername || '-' },
        { label: 'Echeance', value: item.neededBy || '-' },
        { label: 'Soumise le', value: this.datetimeLabel(item.createdAt || '-') || '-' },
        { label: 'Decidee par', value: item.decidedBy || '-' },
        { label: 'Date decision', value: this.datetimeLabel(item.decidedAt || '-') || '-' },
      ],
      item.purpose || ''
    );
  }

  openNotificationDetail(item: NotificationItem): void {
    this.openDetailPanel(
      `Notification ${item.id}`,
      item.title || 'Notification',
      item.isRead ? 'Lue' : 'Non lue',
      [
        { label: 'Categorie', value: item.category || '-' },
        { label: 'Reference', value: item.reference || '-' },
        { label: 'Destinataire', value: item.recipientUsername || '-' },
        { label: 'Date creation', value: this.datetimeLabel(item.createdAt || '-') || '-' },
        { label: 'Date lecture', value: this.datetimeLabel(item.readAt || '-') || '-' },
      ],
      item.message || ''
    );
  }

  closeDetailPanel(): void {
    this.detailDrawerOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (this.detailDrawerOpen) {
      this.closeDetailPanel();
    }
  }

  toggleCreateForm(): void {
    if (!this.showCreateForm && !this.ensureManageDocuments('creer ou modifier un document')) {
      return;
    }

    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.startCreate();
    } else {
      this.cancelCreate();
    }
  }

  startCreate(): void {
    if (!this.ensureManageDocuments('creer un document')) {
      return;
    }

    this.editingReference = null;
    this.resetForm();
    this.showCreateForm = true;
    this.cdr.detectChanges();
  }

  startEditSelected(): void {
    const reference = this.selectedReference.trim();
    if (!reference) {
      return;
    }

    const item = this.items.find((entry) => entry.reference === reference);
    if (!item) {
      this.toastr.error('Document introuvable', 'Documents', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.startEdit(item);
  }

  exportSelectedPdf(): void {
    const reference = this.selectedReference.trim();
    if (!reference) {
      return;
    }

    const item = this.items.find((entry) => entry.reference === reference);
    if (!item) {
      this.toastr.error('Document introuvable', 'Documents', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.exportPdf(item);
  }

  onSelectedReferenceChange(reference: string): void {
    this.selectedReference = String(reference || '').trim();
    this.syncAssignFormWithSelection();
    this.loadAuditTrail();
  }

  assignSelectedDocument(): void {
    const item = this.selectedItem;
    if (!item) {
      this.toastr.error('Selectionne un document a assigner', 'Documents', {
        timeOut: 3000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.assignDocument(item);
  }

  signSelectedDocument(): void {
    const item = this.selectedItem;
    if (!item) {
      return;
    }
    this.signDocument(item);
  }

  createDocumentRequest(): void {
    if (this.requestSubmitting) {
      return;
    }

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    const neededBy = String(this.requestForm.value.neededBy || '').trim();
    if (!this.isValidDate(neededBy)) {
      this.toastr.error('Date echeance demande invalide', 'Documents', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: CreateDocumentRequestPayload = {
      documentType: String(this.requestForm.value.documentType || '').trim(),
      requesterName: this.currentActorName(),
      requesterUsername: this.currentUsername(),
      purpose: String(this.requestForm.value.purpose || '').trim(),
      neededBy,
    };

    this.requestSubmitting = true;
    this.documentsService
      .createDocumentRequest(payload)
      .pipe(finalize(() => (this.requestSubmitting = false)))
      .subscribe({
        next: (created) => {
          this.toastr.success(`Demande ${created.reference} enregistree`, 'Documents', {
            timeOut: 2600,
            positionClass: 'toast-top-right',
          });
          this.requestForm.reset({
            documentType: 'Attestation de travail',
            purpose: '',
            neededBy: this.addDaysInputValue(5),
          });
          this.loadDocumentRequests();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3600,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  decideDocumentRequest(item: DocumentRequest, action: 'APPROUVER' | 'REJETER'): void {
    if (!this.ensureManageDocuments('decider une demande documentaire')) {
      return;
    }

    if (!item || this.requestDecisionSubmitting || this.requestDecisionReference === item.reference) {
      return;
    }

    if (this.normalizeRequestStatus(item.status) !== 'Soumise') {
      this.toastr.warning('La demande est deja decidee', 'Documents', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    let reason = '';
    if (action === 'REJETER') {
      reason = (window.prompt('Motif du rejet (obligatoire):', item.decisionComment || '') || '').trim();
      if (!reason) {
        this.toastr.warning('Le motif est obligatoire pour un rejet', 'Documents', {
          timeOut: 3200,
          positionClass: 'toast-top-right',
        });
        return;
      }
    } else {
      reason = (window.prompt('Commentaire de validation (optionnel):', item.decisionComment || '') || '').trim();
    }

    const payload: DocumentRequestDecisionPayload = {
      action,
      reason: reason || undefined,
    };

    this.requestDecisionSubmitting = true;
    this.requestDecisionReference = item.reference;
    this.documentsService
      .decideDocumentRequest(item.reference, payload)
      .pipe(finalize(() => {
        this.requestDecisionSubmitting = false;
        this.requestDecisionReference = '';
      }))
      .subscribe({
        next: (updated) => {
          this.toastr.success(`Demande ${updated.reference} ${updated.status.toLowerCase()}`, 'Documents', {
            timeOut: 2600,
            positionClass: 'toast-top-right',
          });
          this.loadDocumentRequests();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  markInboxRead(item: DocumentItem): void {
    if (!item || !item.reference || this.inboxUpdatingReference) {
      return;
    }

    if (item.readAt) {
      return;
    }

    this.inboxUpdatingReference = item.reference;
    this.documentsService
      .markInboxRead(item.reference)
      .pipe(finalize(() => (this.inboxUpdatingReference = '')))
      .subscribe({
        next: () => {
          this.loadInboxDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  acknowledgeInbox(item: DocumentItem): void {
    if (!item || !item.reference || this.inboxUpdatingReference) {
      return;
    }

    if (item.acknowledgedAt) {
      return;
    }

    this.inboxUpdatingReference = item.reference;
    this.documentsService
      .acknowledgeInbox(item.reference, 'Accuse reception confirme depuis le module Documents')
      .pipe(finalize(() => (this.inboxUpdatingReference = '')))
      .subscribe({
        next: () => {
          this.loadInboxDocuments();
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  markNotificationRead(item: NotificationItem): void {
    if (!item || !item.id || item.isRead || this.notificationUpdatingId) {
      return;
    }

    this.notificationUpdatingId = item.id;
    this.documentsService
      .markNotificationRead(item.id)
      .pipe(finalize(() => (this.notificationUpdatingId = '')))
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.loadAnalytics();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  allowedStatusTransitions(item: DocumentItem): string[] {
    const current = this.normalizeStatus(item.status);
    return this.statusTransitions[current] || [];
  }

  canTransitionToStatus(item: DocumentItem, targetStatus: string): boolean {
    if (!item || this.transitioning || this.submitting || this.assigning) {
      return false;
    }
    return this.allowedStatusTransitions(item).includes(targetStatus);
  }

  canSignDocument(item: DocumentItem): boolean {
    const status = this.normalizeStatus(item.status);
    return status === 'Valide' || status === 'Publie';
  }

  isDocumentSigned(item: DocumentItem): boolean {
    return !!(
      item &&
      String(item.signedAt || '').trim() &&
      String(item.signedBy || '').trim() &&
      String(item.signatureHash || '').trim() &&
      String(item.verificationCode || '').trim()
    );
  }

  transitionSelectedDocument(targetStatus: string): void {
    if (!this.ensureManageDocuments('changer le statut d un document')) {
      return;
    }

    const item = this.selectedItem;
    if (!item) {
      return;
    }

    if (!this.canTransitionToStatus(item, targetStatus)) {
      this.toastr.warning('Transition de statut non autorisee', 'Documents', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: UpdateDocumentPayload = {
      title: item.title,
      type: item.type,
      owner: item.owner,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
      employeeName: item.employeeName,
      employeeId: item.employeeId || undefined,
      direction: item.direction || undefined,
      unit: item.unit || undefined,
      issuedAt: item.issuedAt,
      startDate: item.startDate || undefined,
      endDate: item.endDate || undefined,
      approver: item.approver || undefined,
      missionDestination: item.missionDestination || undefined,
      missionPurpose: item.missionPurpose || undefined,
      absenceReason: item.absenceReason || undefined,
      notes: item.notes || undefined,
    };

    this.transitioning = true;
    this.documentsService
      .updateDocument(item.reference, payload)
      .pipe(finalize(() => (this.transitioning = false)))
      .subscribe({
        next: (updated) => {
          this.selectedReference = updated.reference;
          this.toastr.success(`Statut passe a ${updated.status}`, 'Documents', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3800,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  auditActionLabel(action: string): string {
    const normalized = String(action || '').trim().toUpperCase();
    switch (normalized) {
      case 'DOCUMENT_CREATED':
        return 'Creation';
      case 'DOCUMENT_UPDATED':
        return 'Mise a jour';
      case 'DOCUMENT_STATUS_CHANGED':
        return 'Transition statut';
      case 'DOCUMENT_SIGNED':
        return 'Signature/cachet';
      case 'DOCUMENT_ASSIGNED':
        return 'Assignation';
      case 'DOCUMENT_READ':
        return 'Lecture agent';
      case 'DOCUMENT_ACKNOWLEDGED':
        return 'Accuse reception';
      default:
        return action || 'Action';
    }
  }

  runArchiveSimulation(): void {
    if (!this.ensureManageDocuments('simuler un archivage')) {
      return;
    }
    this.runArchiveCycle(true);
  }

  executeArchiveRun(): void {
    if (!this.ensureManageDocuments('archiver les documents')) {
      return;
    }
    if (!window.confirm('Confirmer l archivage automatique des documents eligibles ?')) {
      return;
    }
    this.runArchiveCycle(false);
  }

  runPurgeSimulation(): void {
    if (!this.ensureManageDocuments('simuler une purge')) {
      return;
    }
    this.runArchivePurge(true);
  }

  executeArchivePurge(): void {
    if (!this.ensureManageDocuments('purger les archives documentaires')) {
      return;
    }
    if (!window.confirm('Confirmer la purge des documents archives selon la retention ?')) {
      return;
    }
    this.runArchivePurge(false);
  }

  startEdit(item: DocumentItem): void {
    if (!this.ensureManageDocuments('modifier un document')) {
      return;
    }

    this.editingReference = item.reference;
    this.showCreateForm = true;

    this.form.reset({
      reference: item.reference,
      title: item.title,
      type: item.type,
      owner: item.owner,
      status: item.status || 'Brouillon',
      updatedAt: this.toDateInputValue(item.updatedAt),
      employeeName: item.employeeName,
      employeeId: item.employeeId,
      direction: item.direction,
      unit: item.unit,
      issuedAt: this.toDateInputValue(item.issuedAt),
      startDate: this.toDateInputValue(item.startDate),
      endDate: this.toDateInputValue(item.endDate),
      approver: item.approver,
      missionDestination: item.missionDestination,
      missionPurpose: item.missionPurpose,
      absenceReason: item.absenceReason,
      notes: item.notes,
    });

    this.applyConditionalValidators();
    this.cdr.detectChanges();
  }

  exportPdf(item: DocumentItem): void {
    const fileName = `document-${(item.reference || 'rh').toLowerCase()}`;
    const pdfBlob = this.buildDocumentPdfBlob(item);
    const previewOpened = this.openPdfPreview(pdfBlob);
    this.downloadBlob(pdfBlob, `${fileName}.pdf`);

    if (!previewOpened) {
      this.toastr.warning('Apercu bloque. Le PDF est telecharge automatiquement.', 'Documents', {
        timeOut: 3600,
        positionClass: 'toast-top-right',
      });
    }
  }

  isAttestationSelected(): boolean {
    const item = this.selectedItem;
    if (!item) return false;
    const type = (item.type || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    return type.includes('attestation') || title.includes('attestation');
  }

  exportStyledAttestation(): void {
    const item = this.selectedItem;
    if (!item) {
      this.toastr.error('Selectionne un document attestation', 'Documents', { timeOut: 2800 });
      return;
    }
    const html = this.buildAttestationHtml(item);
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1200');
    if (!win) {
      this.toastr.error('Popup bloquee par le navigateur', 'Documents', { timeOut: 2800 });
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  assignDocument(item: DocumentItem): void {
    if (!this.ensureManageDocuments('assigner un document')) {
      return;
    }

    if (this.assigning) {
      return;
    }

    if (!this.canAssignDocument(item)) {
      this.toastr.warning('Le document doit etre valide ou publie avant assignation', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (this.assignForm.invalid) {
      this.assignForm.markAllAsTouched();
      return;
    }

    const assignmentDueAtInput = String(this.assignForm.value.assignmentDueAt || '').trim();
    const reminderAtInput = String(this.assignForm.value.reminderAt || '').trim();
    if (!this.isValidDate(assignmentDueAtInput) || !this.isValidDate(reminderAtInput)) {
      this.toastr.error('Dates assignation invalides', 'Documents', {
        timeOut: 3400,
        positionClass: 'toast-top-right',
      });
      return;
    }
    if (Date.parse(reminderAtInput) >= Date.parse(assignmentDueAtInput)) {
      this.toastr.error('La date de relance doit etre anterieure a la date limite', 'Documents', {
        timeOut: 3600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: AssignDocumentPayload = {
      employeeId: String(this.assignForm.value.employeeId || '').trim(),
      employeeName: String(this.assignForm.value.employeeName || '').trim(),
      recipientUsername: String(this.assignForm.value.recipientUsername || '').trim().toLowerCase(),
      note: String(this.assignForm.value.note || '').trim() || undefined,
      assignmentDueAt: this.dateInputToIsoEndOfDay(assignmentDueAtInput),
      reminderAt: this.dateInputToIsoStartOfDay(reminderAtInput),
      forceReassign: Boolean(this.assignForm.value.forceReassign),
    };

    this.assigning = true;
    this.documentsService
      .assignDocument(item.reference, payload)
      .pipe(finalize(() => (this.assigning = false)))
      .subscribe({
        next: (updatedDocument) => {
          this.toastr.success(`Document assigne a ${updatedDocument.assignedEmployeeName || payload.employeeName}`, 'Documents', {
            timeOut: 2600,
            positionClass: 'toast-top-right',
          });
          this.selectedReference = updatedDocument.reference;
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 4000,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  signDocument(item: DocumentItem): void {
    if (!this.ensureManageDocuments('signer un document')) {
      return;
    }

    if (this.signing) {
      return;
    }
    if (!this.canSignDocument(item)) {
      this.toastr.warning('Le document doit etre valide ou publie pour signature/cachet', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: SignDocumentPayload = {
      signatoryName: String(item.approver || '').trim() || undefined,
      stampLabel: 'CACHET RH PRIMATURE',
    };

    this.signing = true;
    this.documentsService
      .signDocument(item.reference, payload)
      .pipe(finalize(() => (this.signing = false)))
      .subscribe({
        next: (updatedDocument) => {
          this.selectedReference = updatedDocument.reference;
          this.toastr.success(`Document signe. Code verification: ${updatedDocument.verificationCode || '-'}`, 'Documents', {
            timeOut: 3200,
            positionClass: 'toast-top-right',
          });
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3800,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.editingReference = null;
    this.resetForm();
    this.cdr.detectChanges();
  }

  saveDocument(): void {
    if (!this.ensureManageDocuments('enregistrer un document')) {
      return;
    }

    this.applyConditionalValidators();

    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const updatedAt = String(this.form.value.updatedAt || '').trim();
    const issuedAt = String(this.form.value.issuedAt || '').trim();
    const startDate = String(this.form.value.startDate || '').trim();
    const endDate = String(this.form.value.endDate || '').trim();

    if (!this.isValidDate(updatedAt) || !this.isValidDate(issuedAt)) {
      this.toastr.error('Dates document invalides', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (startDate && !this.isValidDate(startDate)) {
      this.toastr.error('Date debut invalide', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (endDate && !this.isValidDate(endDate)) {
      this.toastr.error('Date fin invalide', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (startDate && endDate && Date.parse(endDate) < Date.parse(startDate)) {
      this.toastr.error('La date de fin doit etre superieure ou egale a la date de debut', 'Documents', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const basePayload: UpdateDocumentPayload = {
      title: this.normalizedValue('title'),
      type: this.normalizedValue('type'),
      owner: this.normalizedValue('owner'),
      status: this.normalizedValue('status') || 'Brouillon',
      updatedAt: new Date(Date.parse(updatedAt)).toISOString(),
      employeeName: this.normalizedValue('employeeName'),
      employeeId: this.normalizedValue('employeeId') || undefined,
      direction: this.normalizedValue('direction') || undefined,
      unit: this.normalizedValue('unit') || undefined,
      issuedAt,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      approver: this.normalizedValue('approver') || undefined,
      missionDestination: this.normalizedValue('missionDestination') || undefined,
      missionPurpose: this.normalizedValue('missionPurpose') || undefined,
      absenceReason: this.normalizedValue('absenceReason') || undefined,
      notes: this.normalizedValue('notes') || undefined,
    };

    this.submitting = true;

    if (this.editingReference) {
      this.documentsService
        .updateDocument(this.editingReference, basePayload)
        .pipe(finalize(() => (this.submitting = false)))
        .subscribe({
          next: () => {
            this.toastr.success('Document modifie avec succes', 'Documents', {
              timeOut: 2500,
              positionClass: 'toast-top-right',
            });
            this.showCreateForm = false;
            this.editingReference = null;
            this.resetForm();
            this.loadDocuments();
            this.cdr.detectChanges();
          },
          error: (error) => {
            this.toastr.error(this.resolveError(error), 'Documents', {
              timeOut: 3500,
              positionClass: 'toast-top-right',
            });
          },
        });
      return;
    }

    const createPayload: CreateDocumentPayload = {
      ...basePayload,
      reference: this.normalizedValue('reference') || undefined,
    };

    this.documentsService
      .createDocument(createPayload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Document enregistre avec succes', 'Documents', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadDocuments();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private loadDocumentReferenceData(): void {
    forkJoin({
      types: this.documentsService.getDocumentTypes({
        active: true,
        page: 1,
        limit: 200,
        sortBy: 'label',
        sortOrder: 'asc',
      }),
      requirements: this.documentsService.getDocumentRequirements({
        active: true,
        page: 1,
        limit: 200,
        sortBy: 'documentTypeLabel',
        sortOrder: 'asc',
      }),
    }).subscribe({
      next: ({ types, requirements }) => {
        this.documentTypeDefinitions = types;
        this.documentRequirements = requirements;

        const mergedLabels = [
          ...types.map((item) => String(item.label || '').trim()).filter((label) => !!label),
          ...this.fallbackDocumentTypeOptions,
        ];
        this.documentTypeOptions = this.extractDistinctValues(mergedLabels);

        const selectedType = String(this.form.controls.type.value || '').trim();
        if (selectedType && !this.documentTypeOptions.includes(selectedType)) {
          this.documentTypeOptions = this.extractDistinctValues([selectedType, ...this.documentTypeOptions]);
        }

        this.cdr.detectChanges();
      },
      error: () => {
        this.documentTypeDefinitions = [];
        this.documentRequirements = [];
        this.documentTypeOptions = [...this.fallbackDocumentTypeOptions];
        this.cdr.detectChanges();
      },
    });
  }

  private loadDocuments(): void {
    this.documentsService.getDocuments().subscribe({
      next: (items) => {
        this.items = items;

        if (this.selectedReference && !this.items.some((item) => item.reference === this.selectedReference)) {
          this.selectedReference = '';
        }

        this.syncAssignFormWithSelection();
        this.loadAuditTrail();
        this.loadAnalytics();

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.items = [];
        this.auditItems = [];
        this.overdueItems = [];
        this.toastr.error(this.resolveError(error), 'Documents', {
          timeOut: 3500,
          positionClass: 'toast-top-right',
        });
        this.cdr.detectChanges();
      },
      });
  }

  private resolveDocumentTypeCode(item: Pick<DocumentItem, 'documentTypeCode' | 'documentTypeLabel' | 'type'> | null): string {
    if (!item) {
      return '';
    }

    const explicitCode = String(item.documentTypeCode || '').trim();
    if (explicitCode) {
      return explicitCode;
    }

    const definition =
      this.findDocumentTypeDefinition(item.documentTypeLabel || '') ||
      this.findDocumentTypeDefinition(item.type || '');

    if (definition) {
      return definition.code;
    }

    return this.buildFallbackDocumentTypeCode(item.type || item.documentTypeLabel || '');
  }

  private findDocumentTypeDefinition(value: string): DocumentTypeDefinition | null {
    const normalized = this.normalizeDocumentTypeLookup(value);
    if (!normalized) {
      return null;
    }

    return (
      this.documentTypeDefinitions.find(
        (item) =>
          this.normalizeDocumentTypeLookup(item.code) === normalized ||
          this.normalizeDocumentTypeLookup(item.label) === normalized
      ) || null
    );
  }

  private normalizeDocumentTypeLookup(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private buildFallbackDocumentTypeCode(value: string): string {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();

    return normalized || 'GENERIC';
  }

  private resetForm(): void {
    this.form.reset({
      reference: '',
      title: '',
      type: 'Ordre de mission',
      owner: 'Direction RH',
      status: 'Brouillon',
      updatedAt: this.todayInputValue(),
      employeeName: '',
      employeeId: '',
      direction: '',
      unit: '',
      issuedAt: this.todayInputValue(),
      startDate: '',
      endDate: '',
      approver: '',
      missionDestination: '',
      missionPurpose: '',
      absenceReason: '',
      notes: '',
    });
    this.applyConditionalValidators();
  }

  private applyConditionalValidators(): void {
    const typeValue = String(this.form.controls.type.value || '').toLowerCase();
    const missionRequired = typeValue.includes('mission');
    const absenceRequired = typeValue.includes('absence');

    const missionDestination = this.form.controls.missionDestination;
    const missionPurpose = this.form.controls.missionPurpose;
    const absenceReason = this.form.controls.absenceReason;

    missionDestination.clearValidators();
    missionPurpose.clearValidators();
    absenceReason.clearValidators();

    missionDestination.addValidators([Validators.maxLength(140)]);
    missionPurpose.addValidators([Validators.maxLength(220)]);
    absenceReason.addValidators([Validators.maxLength(220)]);

    if (missionRequired) {
      missionDestination.addValidators([Validators.required, Validators.minLength(2)]);
      missionPurpose.addValidators([Validators.required, Validators.minLength(2)]);
    }

    if (absenceRequired) {
      absenceReason.addValidators([Validators.required, Validators.minLength(2)]);
    }

    missionDestination.updateValueAndValidity({ emitEvent: false });
    missionPurpose.updateValueAndValidity({ emitEvent: false });
    absenceReason.updateValueAndValidity({ emitEvent: false });
  }

  private syncAssignFormWithSelection(): void {
    const item = this.selectedItem;
    if (!item) {
      this.assignForm.reset({
        employeeId: '',
        employeeName: '',
        recipientUsername: '',
        note: '',
        assignmentDueAt: this.addDaysInputValue(3),
        reminderAt: this.addDaysInputValue(2),
        forceReassign: false,
      });
      return;
    }

    const dueDate = item.assignmentDueAt ? this.toDateInputValue(item.assignmentDueAt) : this.addDaysInputValue(3);
    const reminderDate = item.reminderAt ? this.toDateInputValue(item.reminderAt) : this.addDaysInputValue(2);

    this.assignForm.reset({
      employeeId: item.assignedEmployeeId || item.employeeId || '',
      employeeName: item.assignedEmployeeName || item.employeeName || '',
      recipientUsername: item.recipientUsername || '',
      note: item.assignmentNote || '',
      assignmentDueAt: dueDate,
      reminderAt: reminderDate,
      forceReassign: false,
    });
  }

  canAssignDocument(item: DocumentItem): boolean {
    const status = String(item.status || '').trim().toLowerCase();
    const statusAllowed = status === 'valide' || status === 'publie';
    return statusAllowed && this.isDocumentSigned(item);
  }

  canManageDocuments(): boolean {
    return this.accessControl.hasPermission(APP_PERMISSIONS.documentsManage);
  }

  deliveryStatusLabel(item: DocumentItem): string {
    const status = String(item.deliveryStatus || '').trim() || 'Non assigne';
    if (status.toLowerCase() === 'assigne' && item.assignedEmployeeName) {
      return `${status} -> ${item.assignedEmployeeName}`;
    }
    return status;
  }

  inboxStatusBadgeClass(item: DocumentItem): string {
    if (item.acknowledgedAt) {
      return 'bg-success-transparent text-success';
    }
    if (item.readAt) {
      return 'bg-info-transparent text-info';
    }
    return 'bg-warning-transparent text-warning';
  }

  inboxStatusLabel(item: DocumentItem): string {
    if (item.acknowledgedAt) return 'Accuse reception';
    if (item.readAt) return 'Lu';
    return 'Non lu';
  }

  requestStatusBadgeClass(status: string): string {
    const normalized = this.normalizeRequestStatus(status);
    if (normalized === 'Validee') return 'bg-success-transparent text-success';
    if (normalized === 'Rejetee') return 'bg-danger-transparent text-danger';
    return 'bg-warning-transparent text-warning';
  }

  isRequestPending(item: DocumentRequest): boolean {
    return this.normalizeRequestStatus(item.status) === 'Soumise';
  }

  notificationStatusBadgeClass(item: NotificationItem): string {
    return item.isRead ? 'bg-light text-dark' : 'bg-primary-transparent text-primary';
  }

  setInboxPage(page: number): void {
    this.inboxPage = page;
    this.applyInboxFilters();
    this.syncRouteStateToUrl();
  }

  setRequestPage(page: number): void {
    this.requestPage = page;
    this.applyRequestFilters();
    this.syncRouteStateToUrl();
  }

  setNotificationPage(page: number): void {
    this.notificationPage = page;
    this.applyNotificationFilters();
    this.syncRouteStateToUrl();
  }

  private applyInboxFilters(): void {
    const q = this.normalizeFilterText(this.inboxFiltersForm.value.q);
    const readState = String(this.inboxFiltersForm.value.readState || 'Tous').trim();
    const deliveryStatus = String(this.inboxFiltersForm.value.deliveryStatus || 'Tous').trim();
    const pageSize = this.resolvePageSize(this.inboxFiltersForm.value.pageSize);

    this.filteredInboxItems = this.inboxItems.filter((item) => {
      if (readState === 'Non lu' && !!item.readAt) {
        return false;
      }
      if (readState === 'Lu' && (!item.readAt || !!item.acknowledgedAt)) {
        return false;
      }
      if (readState === 'Accuse reception' && !item.acknowledgedAt) {
        return false;
      }
      if (deliveryStatus !== 'Tous' && String(item.deliveryStatus || '').trim() !== deliveryStatus) {
        return false;
      }

      if (!q) {
        return true;
      }

      const readableState = this.inboxStatusLabel(item).toLowerCase();
      return (
        item.reference.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.employeeName.toLowerCase().includes(q) ||
        item.assignedEmployeeName.toLowerCase().includes(q) ||
        item.recipientUsername.toLowerCase().includes(q) ||
        String(item.deliveryStatus || '')
          .toLowerCase()
          .includes(q) ||
        readableState.includes(q)
      );
    });

    this.inboxTotalPages = this.computeTotalPages(this.filteredInboxItems.length, pageSize);
    this.inboxPage = this.clampPage(this.inboxPage, this.inboxTotalPages);
    this.pagedInboxItems = this.paginateItems(this.filteredInboxItems, this.inboxPage, pageSize);
    this.retainInboxSelection(new Set(this.filteredInboxItems.map((item) => item.reference)));
  }

  private applyRequestFilters(): void {
    const q = this.normalizeFilterText(this.requestFiltersForm.value.q);
    const status = String(this.requestFiltersForm.value.status || 'Tous').trim();
    const documentType = String(this.requestFiltersForm.value.documentType || 'Tous').trim();
    const pageSize = this.resolvePageSize(this.requestFiltersForm.value.pageSize);

    this.filteredDocumentRequests = this.documentRequests.filter((item) => {
      const normalizedStatus = this.normalizeRequestStatus(item.status);

      if (status !== 'Tous' && normalizedStatus !== status) {
        return false;
      }
      if (documentType !== 'Tous' && String(item.documentType || '').trim() !== documentType) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        item.reference.toLowerCase().includes(q) ||
        item.documentType.toLowerCase().includes(q) ||
        item.requesterName.toLowerCase().includes(q) ||
        item.requesterUsername.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q) ||
        item.neededBy.toLowerCase().includes(q) ||
        normalizedStatus.toLowerCase().includes(q) ||
        item.decidedBy.toLowerCase().includes(q) ||
        item.decisionComment.toLowerCase().includes(q)
      );
    });

    this.requestTotalPages = this.computeTotalPages(this.filteredDocumentRequests.length, pageSize);
    this.requestPage = this.clampPage(this.requestPage, this.requestTotalPages);
    this.pagedDocumentRequests = this.paginateItems(this.filteredDocumentRequests, this.requestPage, pageSize);
    this.retainRequestSelection(new Set(this.filteredDocumentRequests.map((item) => item.reference)));
  }

  private applyNotificationFilters(): void {
    const q = this.normalizeFilterText(this.notificationFiltersForm.value.q);
    const readState = String(this.notificationFiltersForm.value.readState || 'Tous').trim();
    const category = String(this.notificationFiltersForm.value.category || 'Tous').trim();
    const pageSize = this.resolvePageSize(this.notificationFiltersForm.value.pageSize);

    this.filteredNotifications = this.notifications.filter((item) => {
      if (readState === 'Non lu' && item.isRead) {
        return false;
      }
      if ((readState === 'Lu' || readState === 'Accuse reception') && !item.isRead) {
        return false;
      }

      const itemCategory = String(item.category || '').trim();
      if (category !== 'Tous' && itemCategory !== category) {
        return false;
      }

      if (!q) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(q) ||
        item.message.toLowerCase().includes(q) ||
        itemCategory.toLowerCase().includes(q) ||
        item.reference.toLowerCase().includes(q) ||
        item.recipientUsername.toLowerCase().includes(q)
      );
    });

    this.notificationTotalPages = this.computeTotalPages(this.filteredNotifications.length, pageSize);
    this.notificationPage = this.clampPage(this.notificationPage, this.notificationTotalPages);
    this.pagedNotifications = this.paginateItems(this.filteredNotifications, this.notificationPage, pageSize);
    this.retainNotificationSelection(new Set(this.filteredNotifications.map((item) => item.id)));
  }

  private normalizeStatus(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'en validation') {
      return 'En validation';
    }
    if (normalized === 'valide') {
      return 'Valide';
    }
    if (normalized === 'publie') {
      return 'Publie';
    }
    if (normalized === 'archive') {
      return 'Archive';
    }
    return 'Brouillon';
  }

  private normalizeRequestStatus(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized.includes('valid')) return 'Validee';
    if (normalized.includes('rejet')) return 'Rejetee';
    return 'Soumise';
  }

  private updateInboxFilterOptions(): void {
    this.inboxDeliveryStatusOptions = this.extractDistinctValues(this.inboxItems.map((item) => item.deliveryStatus));
    const selectedDeliveryStatus = String(this.inboxFiltersForm.value.deliveryStatus || 'Tous').trim();
    if (selectedDeliveryStatus !== 'Tous' && !this.inboxDeliveryStatusOptions.includes(selectedDeliveryStatus)) {
      this.inboxFiltersForm.patchValue({ deliveryStatus: 'Tous' }, { emitEvent: false });
    }
  }

  private updateRequestFilterOptions(): void {
    this.requestTypeOptions = this.extractDistinctValues(this.documentRequests.map((item) => item.documentType));
    const selectedType = String(this.requestFiltersForm.value.documentType || 'Tous').trim();
    if (selectedType !== 'Tous' && !this.requestTypeOptions.includes(selectedType)) {
      this.requestFiltersForm.patchValue({ documentType: 'Tous' }, { emitEvent: false });
    }
  }

  private updateNotificationFilterOptions(): void {
    this.notificationCategoryOptions = this.extractDistinctValues(this.notifications.map((item) => item.category));
    const selectedCategory = String(this.notificationFiltersForm.value.category || 'Tous').trim();
    if (selectedCategory !== 'Tous' && !this.notificationCategoryOptions.includes(selectedCategory)) {
      this.notificationFiltersForm.patchValue({ category: 'Tous' }, { emitEvent: false });
    }
  }

  private extractDistinctValues(values: string[]): string[] {
    const seen = new Set<string>();
    values.forEach((value) => {
      const normalized = String(value || '').trim();
      if (normalized) {
        seen.add(normalized);
      }
    });
    return Array.from(seen.values());
  }

  private normalizeFilterText(value: unknown): string {
    return String(value || '').trim().toLowerCase();
  }

  private resolvePageSize(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 10;
    }
    const safe = Math.max(1, Math.floor(parsed));
    return this.pageSizeOptions.includes(safe) ? safe : 10;
  }

  private computeTotalPages(totalItems: number, pageSize: number): number {
    const safePageSize = Math.max(1, pageSize);
    return Math.max(1, Math.ceil(Math.max(0, totalItems) / safePageSize));
  }

  private clampPage(page: number, totalPages: number): number {
    const safeTotal = Math.max(1, Math.floor(totalPages || 1));
    const safePage = Math.max(1, Math.floor(page || 1));
    return Math.min(safePage, safeTotal);
  }

  private paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
    const safePageSize = Math.max(1, Math.floor(pageSize || 10));
    const safePage = Math.max(1, Math.floor(page || 1));
    const start = (safePage - 1) * safePageSize;
    return items.slice(start, start + safePageSize);
  }

  private hydrateStateFromRoute(): void {
    this.applyRouteState(this.route.snapshot.queryParamMap);
  }

  private applyRouteState(params: ParamMap): void {
    this.isHydratingRouteState = true;
    try {
      this.activeWorkspaceTab = this.parseWorkspaceTab(params.get('docTab'));

      this.inboxPage = this.parsePageParam(params.get('inboxPage'), 1);
      this.requestPage = this.parsePageParam(params.get('requestPage'), 1);
      this.notificationPage = this.parsePageParam(params.get('notifPage'), 1);

      const inboxRead = this.parseRouteOption(params.get('inboxRead'), this.readStateFilterOptions, 'Tous');
      const requestStatus = this.parseRouteOption(
        params.get('requestStatus'),
        ['Tous', ...this.requestStatusOptions],
        'Tous'
      );
      const notifRead = this.parseRouteOption(params.get('notifRead'), this.readStateFilterOptions, 'Tous');

      this.inboxFiltersForm.patchValue(
        {
          q: this.routeTextOrEmpty(params.get('inboxQ')),
          readState: inboxRead,
          deliveryStatus: this.routeTextOrDefault(params.get('inboxDelivery'), 'Tous'),
          pageSize: this.parsePageSizeParam(params.get('inboxSize')),
        },
        { emitEvent: false }
      );

      this.requestFiltersForm.patchValue(
        {
          q: this.routeTextOrEmpty(params.get('requestQ')),
          status: requestStatus,
          documentType: this.routeTextOrDefault(params.get('requestType'), 'Tous'),
          pageSize: this.parsePageSizeParam(params.get('requestSize')),
        },
        { emitEvent: false }
      );

      this.notificationFiltersForm.patchValue(
        {
          q: this.routeTextOrEmpty(params.get('notifQ')),
          readState: notifRead,
          category: this.routeTextOrDefault(params.get('notifCategory'), 'Tous'),
          pageSize: this.parsePageSizeParam(params.get('notifSize')),
        },
        { emitEvent: false }
      );
    } finally {
      this.isHydratingRouteState = false;
    }

    if (this.inboxItems.length > 0 || !this.inboxLoading) {
      this.applyInboxFilters();
    }
    if (this.documentRequests.length > 0 || !this.requestsLoading) {
      this.applyRequestFilters();
    }
    if (this.notifications.length > 0 || !this.notificationsLoading) {
      this.applyNotificationFilters();
    }
    this.lastSerializedRouteState = this.serializeRouteState(this.buildRouteQueryParams());
    this.cdr.detectChanges();
  }

  private syncRouteStateToUrl(): void {
    if (this.isHydratingRouteState) {
      return;
    }

    const queryParams = this.buildRouteQueryParams();
    const serialized = this.serializeRouteState(queryParams);
    if (serialized === this.lastSerializedRouteState) {
      return;
    }

    this.lastSerializedRouteState = serialized;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private buildRouteQueryParams(): Record<string, string | number | null> {
    const inboxQ = this.routeText(this.inboxFiltersForm.value.q);
    const inboxRead = this.routeText(this.inboxFiltersForm.value.readState);
    const inboxDelivery = this.routeText(this.inboxFiltersForm.value.deliveryStatus);
    const inboxPageSize = this.resolvePageSize(this.inboxFiltersForm.value.pageSize);

    const requestQ = this.routeText(this.requestFiltersForm.value.q);
    const requestStatus = this.routeText(this.requestFiltersForm.value.status);
    const requestType = this.routeText(this.requestFiltersForm.value.documentType);
    const requestPageSize = this.resolvePageSize(this.requestFiltersForm.value.pageSize);

    const notifQ = this.routeText(this.notificationFiltersForm.value.q);
    const notifRead = this.routeText(this.notificationFiltersForm.value.readState);
    const notifCategory = this.routeText(this.notificationFiltersForm.value.category);
    const notifPageSize = this.resolvePageSize(this.notificationFiltersForm.value.pageSize);

    return {
      docTab: this.activeWorkspaceTab === 'bibliotheque' ? null : this.activeWorkspaceTab,
      inboxQ: inboxQ ?? null,
      inboxRead: !inboxRead || inboxRead === 'Tous' ? null : inboxRead,
      inboxDelivery: !inboxDelivery || inboxDelivery === 'Tous' ? null : inboxDelivery,
      inboxPage: this.inboxPage > 1 ? this.inboxPage : null,
      inboxSize: inboxPageSize !== 10 ? inboxPageSize : null,
      requestQ: requestQ ?? null,
      requestStatus: !requestStatus || requestStatus === 'Tous' ? null : requestStatus,
      requestType: !requestType || requestType === 'Tous' ? null : requestType,
      requestPage: this.requestPage > 1 ? this.requestPage : null,
      requestSize: requestPageSize !== 10 ? requestPageSize : null,
      notifQ: notifQ ?? null,
      notifRead: !notifRead || notifRead === 'Tous' ? null : notifRead,
      notifCategory: !notifCategory || notifCategory === 'Tous' ? null : notifCategory,
      notifPage: this.notificationPage > 1 ? this.notificationPage : null,
      notifSize: notifPageSize !== 10 ? notifPageSize : null,
    };
  }

  private serializeRouteState(queryParams: Record<string, string | number | null>): string {
    return JSON.stringify(queryParams);
  }

  private parseWorkspaceTab(value: string | null): 'bibliotheque' | 'inbox' | 'demandes' | 'notifications' {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'inbox') return 'inbox';
    if (normalized === 'demandes') return 'demandes';
    if (normalized === 'notifications') return 'notifications';
    return 'bibliotheque';
  }

  private parseRouteOption(value: string | null, allowed: string[], fallback: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) {
      return fallback;
    }
    return allowed.includes(normalized) ? normalized : fallback;
  }

  private parsePageParam(value: string | null, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(1, Math.floor(parsed));
  }

  private parsePageSizeParam(value: string | null): number {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && this.pageSizeOptions.includes(Math.floor(parsed))) {
      return Math.floor(parsed);
    }
    return 10;
  }

  private routeTextOrEmpty(value: string | null): string {
    return String(value || '').trim();
  }

  private routeTextOrDefault(value: string | null, fallback: string): string {
    const normalized = String(value || '').trim();
    return normalized || fallback;
  }

  private routeText(value: unknown): string | null {
    const normalized = String(value || '').trim();
    return normalized || null;
  }

  private startBulkAction(label: string): void {
    this.bulkActionRunning = true;
    this.bulkActionLabel = label;
  }

  private endBulkAction(): void {
    this.bulkActionRunning = false;
    this.bulkActionLabel = '';
  }

  private toastBulkResult(success: number, failure: number, successLabel: string): void {
    if (success > 0) {
      this.toastr.success(`${success} ${successLabel}`, 'Documents', {
        timeOut: 2800,
        positionClass: 'toast-top-right',
      });
    }
    if (failure > 0) {
      this.toastr.error(`${failure} operation(s) en echec`, 'Documents', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
    }
  }

  private async runBulk<T>(items: T[], worker: (item: T) => Promise<unknown>): Promise<{ success: number; failure: number }> {
    let success = 0;
    let failure = 0;

    for (const item of items) {
      try {
        await worker(item);
        success += 1;
      } catch {
        failure += 1;
      }
    }

    return { success, failure };
  }

  private retainInboxSelection(allowedKeys: Set<string>): void {
    this.inboxSelection = this.retainSelection(this.inboxSelection, allowedKeys);
  }

  private retainRequestSelection(allowedKeys: Set<string>): void {
    this.requestSelection = this.retainSelection(this.requestSelection, allowedKeys);
  }

  private retainNotificationSelection(allowedKeys: Set<string>): void {
    this.notificationSelection = this.retainSelection(this.notificationSelection, allowedKeys);
  }

  private retainSelection(current: Set<string>, allowedKeys: Set<string>): Set<string> {
    const next = new Set<string>();
    current.forEach((key) => {
      if (allowedKeys.has(key)) {
        next.add(key);
      }
    });
    return next;
  }

  private openDetailPanel(
    title: string,
    subtitle: string,
    status: string,
    rows: DetailPanelRow[],
    description: string
  ): void {
    this.detailPanelTitle = this.detailOrDash(title);
    this.detailPanelSubtitle = this.detailOrDash(subtitle);
    this.detailPanelStatus = this.detailOrDash(status);
    this.detailPanelRows = rows.map((row) => ({
      label: this.detailOrDash(row.label),
      value: this.detailOrDash(row.value),
    }));
    this.detailPanelDescription = this.detailOrDash(description);
    this.detailDrawerOpen = true;
  }

  private detailOrDash(value: string): string {
    const normalized = String(value || '').trim();
    return normalized || '-';
  }

  private loadInboxDocuments(): void {
    this.inboxLoading = true;
    this.documentsService
      .getInboxDocuments({ page: 1, limit: 100, sortBy: 'assignedAt', sortOrder: 'desc' })
      .pipe(finalize(() => (this.inboxLoading = false)))
      .subscribe({
        next: (items) => {
          this.inboxItems = items;
          this.updateInboxFilterOptions();
          this.applyInboxFilters();
          this.retainInboxSelection(new Set(this.inboxItems.map((item) => item.reference)));
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
        error: () => {
          this.inboxItems = [];
          this.inboxDeliveryStatusOptions = [];
          this.filteredInboxItems = [];
          this.pagedInboxItems = [];
          this.inboxPage = 1;
          this.inboxTotalPages = 1;
          this.inboxSelection.clear();
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
      });
  }

  private loadDocumentRequests(): void {
    this.requestsLoading = true;
    this.documentsService
      .getDocumentRequests({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .pipe(finalize(() => (this.requestsLoading = false)))
      .subscribe({
        next: (items) => {
          this.documentRequests = items;
          this.updateRequestFilterOptions();
          this.applyRequestFilters();
          this.retainRequestSelection(new Set(this.documentRequests.map((item) => item.reference)));
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
        error: () => {
          this.documentRequests = [];
          this.requestTypeOptions = [];
          this.filteredDocumentRequests = [];
          this.pagedDocumentRequests = [];
          this.requestPage = 1;
          this.requestTotalPages = 1;
          this.requestSelection.clear();
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
      });
  }

  private loadNotifications(): void {
    this.notificationsLoading = true;
    this.documentsService
      .getMyNotifications({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .pipe(finalize(() => (this.notificationsLoading = false)))
      .subscribe({
        next: (items) => {
          this.notifications = items;
          this.updateNotificationFilterOptions();
          this.applyNotificationFilters();
          this.retainNotificationSelection(new Set(this.notifications.map((item) => item.id)));
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
        error: () => {
          this.notifications = [];
          this.notificationCategoryOptions = [];
          this.filteredNotifications = [];
          this.pagedNotifications = [];
          this.notificationPage = 1;
          this.notificationTotalPages = 1;
          this.notificationSelection.clear();
          this.syncRouteStateToUrl();
          this.cdr.detectChanges();
        },
      });
  }

  private loadAuditTrail(): void {
    const reference = this.selectedReference.trim();
    if (!reference) {
      this.auditLoading = false;
      this.auditItems = [];
      return;
    }

    this.auditLoading = true;
    this.documentsService
      .getDocumentAuditLogs({
        reference,
        page: 1,
        limit: 30,
        sortBy: 'happenedAt',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.auditLoading = false)))
      .subscribe({
        next: (items) => {
          this.auditItems = items;
          this.cdr.detectChanges();
        },
        error: () => {
          this.auditItems = [];
          this.cdr.detectChanges();
        },
      });
  }

  private loadAnalytics(): void {
    this.analyticsLoading = true;
    this.documentsService
      .getDocumentAnalytics()
      .pipe(finalize(() => (this.analyticsLoading = false)))
      .subscribe({
        next: (report) => {
          this.analytics = report;
          this.overdueItems = [...report.overduePreview];
          this.cdr.detectChanges();
        },
        error: () => {
          this.analytics = this.emptyAnalytics();
          this.overdueItems = [];
          this.cdr.detectChanges();
        },
      });
  }

  private runArchiveCycle(dryRun: boolean): void {
    if (!this.ensureManageDocuments('executer une operation d archivage')) {
      return;
    }

    if (this.maintenanceRunning) {
      return;
    }
    this.maintenanceRunning = true;
    this.documentsService
      .runArchiveCycle({
        olderThanDays: 30,
        dryRun,
        onlyAcknowledged: true,
        includeUnassigned: false,
      })
      .pipe(finalize(() => (this.maintenanceRunning = false)))
      .subscribe({
        next: (result) => {
          this.lastArchiveRun = result;
          const actionLabel = dryRun ? 'Simulation archivage' : 'Archivage';
          this.toastr.success(
            `${actionLabel}: ${result.candidatesCount} eligibles, ${result.archivedCount} archives`,
            'Documents',
            {
              timeOut: 3600,
              positionClass: 'toast-top-right',
            }
          );
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 4000,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private runArchivePurge(dryRun: boolean): void {
    if (!this.ensureManageDocuments('executer une operation de purge')) {
      return;
    }

    if (this.maintenanceRunning) {
      return;
    }
    this.maintenanceRunning = true;
    this.documentsService
      .purgeArchivedDocuments({
        retentionDays: 120,
        dryRun,
        includeNotifications: true,
      })
      .pipe(finalize(() => (this.maintenanceRunning = false)))
      .subscribe({
        next: (result) => {
          this.lastPurgeRun = result;
          const actionLabel = dryRun ? 'Simulation purge' : 'Purge';
          this.toastr.success(
            `${actionLabel}: ${result.candidatesCount} candidats, ${result.purged.documents} supprimes`,
            'Documents',
            {
              timeOut: 3800,
              positionClass: 'toast-top-right',
            }
          );
          this.loadDocuments();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Documents', {
            timeOut: 4000,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private emptyAnalytics(): DocumentAnalyticsReport {
    return {
      generatedAt: new Date().toISOString(),
      totals: {
        totalDocuments: 0,
        signedDocuments: 0,
        assignedDocuments: 0,
        readDocuments: 0,
        acknowledgedDocuments: 0,
        pendingAcknowledgements: 0,
        overdueDocuments: 0,
        dueInNext48h: 0,
      },
      rates: {
        acknowledgementRate: 0,
        signatureRate: 0,
      },
      sla: {
        averageAckHours: 0,
        averageReadHours: 0,
      },
      notifications: {
        unreadNotifications: 0,
        notificationJobsTotal: 0,
        notificationJobsSent: 0,
        notificationJobsRetry: 0,
        notificationJobsFailed: 0,
      },
      statusBreakdown: [],
      typeBreakdown: [],
      overduePreview: [],
    };
  }

  private periodLabel(item: DocumentItem): string {
    if (item.startDate && item.endDate) {
      return `${item.startDate} -> ${item.endDate}`;
    }
    if (item.startDate) {
      return `A partir du ${item.startDate}`;
    }
    if (item.issuedAt) {
      return `Emis le ${item.issuedAt}`;
    }
    return '-';
  }

  private datetimeLabel(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return value;
    }
    return new Date(parsed).toISOString().slice(0, 16).replace('T', ' ');
  }

  private todayInputValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private addDaysInputValue(days: number): string {
    const base = new Date();
    base.setDate(base.getDate() + Math.max(0, Math.round(days)));
    return base.toISOString().slice(0, 10);
  }

  private dateInputToIsoStartOfDay(value: string): string {
    const normalized = String(value || '').trim();
    if (!this.isValidDate(normalized)) {
      return '';
    }
    return new Date(`${normalized}T08:00:00.000Z`).toISOString();
  }

  private dateInputToIsoEndOfDay(value: string): string {
    const normalized = String(value || '').trim();
    if (!this.isValidDate(normalized)) {
      return '';
    }
    return new Date(`${normalized}T23:59:59.000Z`).toISOString();
  }

  private toDateInputValue(value: string): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return value || '';
    }
    return new Date(parsed).toISOString().slice(0, 10);
  }

  private normalizedValue(fieldName: string): string {
    return String(this.form.get(fieldName)?.value || '').trim();
  }

  private isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
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

  private ensureManageDocuments(action: string): boolean {
    if (this.canManageDocuments()) {
      return true;
    }

    this.toastr.error(`Acces refuse: droits insuffisants pour ${action}`, 'Documents', {
      timeOut: 3400,
      positionClass: 'toast-top-right',
    });
    return false;
  }

  private currentUsername(): string {
    try {
      return String(window.localStorage.getItem('rh_username') || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }

  private currentActorName(): string {
    const username = this.currentUsername();
    if (!username) {
      return 'Agent';
    }
    const localPart = username.split('@')[0] || username;
    const words = localPart
      .split(/[._-]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 0)
      .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`);
    return words.join(' ') || 'Agent';
  }

  private openPdfPreview(blob: Blob): boolean {
    const objectUrl = URL.createObjectURL(blob);
    const popup = window.open(objectUrl, '_blank', 'noopener,noreferrer,width=980,height=760');
    const opened = !!popup;
    const cleanupDelay = opened ? 60_000 : 2_000;
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), cleanupDelay);
    return opened;
  }

  private buildDocumentPdfBlob(item: DocumentItem): Blob {
    const lines = this.buildDocumentPdfLines(item);
    const pdfContent = this.buildStyledPdfDocument(lines);
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  private buildDocumentPdfLines(item: DocumentItem): string[] {
    const lines: string[] = [];
    const generatedAt = new Date().toLocaleString('fr-FR');
    const issuedAt = this.toDateInputValue(item.issuedAt || item.updatedAt || '');
    const period = this.periodLabel(item);
    const signedAt = this.datetimeLabel(item.signedAt || '') || '-';
    const signedBy = item.signedBy || '-';
    const verificationCode = item.verificationCode || '-';
    const signatureHash = item.signatureHash || '-';

    lines.push('REPUBLIQUE DE GUINEE - PRIMATURE');
    lines.push('DIRECTION DES RESSOURCES HUMAINES');
    lines.push('');
    this.appendPdfFieldLine(lines, 'Document', item.title || item.type || 'Document RH');
    this.appendPdfFieldLine(lines, 'Reference', item.reference || '-');
    this.appendPdfFieldLine(lines, 'Type', item.type || '-');
    this.appendPdfFieldLine(lines, 'Statut', item.status || 'Brouillon');
    this.appendPdfFieldLine(lines, 'Date emission', issuedAt || '-');
    this.appendPdfFieldLine(lines, 'Employe', item.employeeName || '-');
    this.appendPdfFieldLine(lines, 'Matricule', item.employeeId || '-');
    this.appendPdfFieldLine(lines, 'Direction', item.direction || '-');
    this.appendPdfFieldLine(lines, 'Unite', item.unit || '-');
    this.appendPdfFieldLine(lines, 'Periode', period);
    this.appendPdfFieldLine(lines, 'Destination mission', item.missionDestination || '-');
    this.appendPdfFieldLine(lines, 'Objet mission', item.missionPurpose || '-');
    this.appendPdfFieldLine(lines, 'Motif absence', item.absenceReason || '-');
    this.appendPdfFieldLine(lines, 'Observations', item.notes || '-');
    this.appendPdfFieldLine(lines, 'Signe le', signedAt);
    this.appendPdfFieldLine(lines, 'Signataire', signedBy);
    this.appendPdfFieldLine(lines, 'Code verification', verificationCode);
    this.appendPdfFieldLine(lines, 'Empreinte signature', signatureHash);
    this.appendPdfFieldLine(lines, 'Genere le', generatedAt);

    return lines;
  }

  private appendPdfFieldLine(lines: string[], label: string, rawValue: string): void {
    const maxLineLength = 92;
    const value = this.sanitizePdfPlainText(rawValue || '-');
    let remaining = `${this.sanitizePdfPlainText(label)}: ${value || '-'}`;

    while (remaining.length > maxLineLength) {
      let splitIndex = remaining.lastIndexOf(' ', maxLineLength);
      if (splitIndex <= 0) {
        splitIndex = maxLineLength;
      }
      lines.push(remaining.slice(0, splitIndex).trimEnd());
      remaining = `  ${remaining.slice(splitIndex).trimStart()}`;
    }

    lines.push(remaining);
  }

  private buildStyledPdfDocument(rawLines: string[]): string {
    const normalizedLines = rawLines
      .map((line) => this.sanitizePdfPlainText(line))
      .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
      .slice(0, 50);

    // Draw Guinea flag header (horizontal stripes) and a footer bar
    const drawCommands: string[] = [
      'q',
      // top stripes
      '1 0 0 rg', '0 830 595 12 re f',
      '1 0.82 0 rg', '0 818 595 12 re f',
      '0 0.55 0.25 rg', '0 806 595 12 re f',
      // footer bar
      '1 0 0 rg', '0 20 198 6 re f',
      '1 0.82 0 rg', '198 20 199 6 re f',
      '0 0.55 0.25 rg', '397 20 198 6 re f',
      'Q'
    ];

    // Text block
    const textCommands: string[] = ['BT', '/F1 11 Tf', '50 780 Td'];
    normalizedLines.forEach((line, index) => {
      if (index > 0) {
        textCommands.push('0 -15 Td');
      }
      textCommands.push(`(${this.escapePdfText(line)}) Tj`);
    });
    textCommands.push('ET');

    const stream = [...drawCommands, ...textCommands].join('\n');
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    let documentBody = '%PDF-1.4\n';
    const offsets: number[] = [0];
    for (let index = 0; index < objects.length; index += 1) {
      offsets.push(documentBody.length);
      documentBody += `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    }

    const xrefOffset = documentBody.length;
    documentBody += `xref\n0 ${objects.length + 1}\n`;
    documentBody += '0000000000 65535 f \n';
    for (let index = 1; index < offsets.length; index += 1) {
      documentBody += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    }
    documentBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return documentBody;
  }

  private buildAttestationHtml(item: DocumentItem): string {
    const safe = (v: string | null | undefined) => (v || '').trim() || '-';
    const today = new Date().toLocaleDateString('fr-FR');
    return `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Attestation - ${safe(item.employeeName)}</title>
  <style>
    body { margin:0; font-family: 'Inter', system-ui, sans-serif; background:#f3f4f6; }
    .page { width:210mm; min-height:297mm; margin:10mm auto; background:#fff; padding:24mm 22mm; box-shadow:0 0 0.5mm rgba(0,0,0,.08); color:#1f2937; }
    .header { display:flex; align-items:stretch; margin-bottom:16mm; }
    .brand { flex:1; }
    .brand h1 { margin:0 0 2mm; font-size:14pt; font-weight:700; }
    .brand h2 { margin:0 0 2mm; font-size:12pt; font-weight:600; color:#374151; }
    .brand p { margin:0; color:#6b7280; font-size:10pt; }
    .flag { width:28mm; display:flex; flex-direction:column; box-shadow:0 0 0 1px #e5e7eb inset; }
    .flag div { flex:1; }
    .flag .red { background:#d2001a; }
    .flag .yellow { background:#f1c40f; }
    .flag .green { background:#2b8c3f; }
    .title { text-align:center; letter-spacing:0.14em; font-weight:700; font-size:22pt; margin:6mm 0 3mm; }
    .subtitle { text-align:center; color:#4b5563; margin:0 0 10mm; }
    .section { margin-bottom:10mm; }
    .section h3 { font-size:11pt; letter-spacing:0.06em; text-transform:uppercase; margin:0 0 4mm; border-bottom:1px solid #e5e7eb; padding-bottom:2mm; }
    .field { display:flex; gap:8mm; margin-bottom:3mm; }
    .field label { width:38mm; color:#6b7280; font-size:10pt; }
    .field span { font-weight:600; font-size:11pt; color:#111827; }
    .body-text { line-height:1.6; font-size:11pt; color:#111827; }
    .footer { margin-top:16mm; display:flex; justify-content:space-between; align-items:center; }
    .signature { width:70mm; height:28mm; border:1px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; color:#6b7280; font-size:10pt; }
    .flag-bar { height:5px; display:flex; margin-top:12mm; }
    .flag-bar div { flex:1; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">
        <h1>République de Guinée</h1>
        <h2>Primature · Ressources Humaines</h2>
        <p>Conakry · ${today}</p>
      </div>
      <div class="flag"><div class="red"></div><div class="yellow"></div><div class="green"></div></div>
    </div>

    <div class="title">ATTESTATION DE TRAVAIL</div>
    <div class="subtitle">À qui de droit</div>

    <div class="section">
      <h3>Identité</h3>
      <div class="field"><label>Nom</label><span>${safe(item.employeeName)}</span></div>
      <div class="field"><label>Matricule</label><span>${safe(item.employeeId)}</span></div>
      <div class="field"><label>Poste</label><span>${safe(item.title || item.type)}</span></div>
      <div class="field"><label>Direction</label><span>${safe(item.direction)}</span></div>
      <div class="field"><label>Unité</label><span>${safe(item.unit)}</span></div>
    </div>

    <div class="section">
      <h3>Objet</h3>
      <p class="body-text">
        ${safe(item.notes || 'Cette attestation est délivrée pour servir et valoir ce que de droit.')}
      </p>
    </div>

    <div class="section">
      <h3>Validité</h3>
      <div class="field"><label>Émise le</label><span>${safe(this.toDateInputValue(item.issuedAt || item.updatedAt || today))}</span></div>
      <div class="field"><label>À</label><span>Conakry</span></div>
      <div class="field"><label>Référence</label><span>${safe(item.reference)}</span></div>
    </div>

    <div class="footer">
      <div class="signature">Signature & Cachet</div>
      <div style="text-align:right;color:#4b5563;font-size:10pt;">
        Contact RH · +224 · rh@example.gn
      </div>
    </div>

    <div class="flag-bar">
      <div style="background:#d2001a;"></div>
      <div style="background:#f1c40f;"></div>
      <div style="background:#2b8c3f;"></div>
    </div>
  </div>
</body>
</html>`;
  }

  private sanitizePdfPlainText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private escapePdfText(value: string): string {
    return String(value || '')
      .replaceAll('\\', '\\\\')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)');
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
    const isMission = item.type.toLowerCase().includes('mission');
    const isAbsence = item.type.toLowerCase().includes('absence');
    const period = this.periodLabel(item);

    const title = this.escapeHtml(item.title || item.type);
    const employeeName = this.escapeHtml(item.employeeName || '');
    const employeeId = this.escapeHtml(item.employeeId || '-');
    const direction = this.escapeHtml(item.direction || '-');
    const unit = this.escapeHtml(item.unit || '-');
    const owner = this.escapeHtml(item.owner || '-');
    const approver = this.escapeHtml(item.approver || 'Autorite RH');
    const reference = this.escapeHtml(item.reference);
    const issuedAt = this.escapeHtml(item.issuedAt || this.toDateInputValue(item.updatedAt));
    const status = this.escapeHtml(item.status || 'Brouillon');
    const missionDestination = this.escapeHtml(item.missionDestination || '-');
    const missionPurpose = this.escapeHtml(item.missionPurpose || '-');
    const absenceReason = this.escapeHtml(item.absenceReason || '-');
    const notes = this.escapeHtml(item.notes || '-');
    const safePeriod = this.escapeHtml(period);
    const safeGeneratedAt = this.escapeHtml(generatedAt);
    const signedAt = this.escapeHtml(this.datetimeLabel(item.signedAt || '-') || '-');
    const signedBy = this.escapeHtml(item.signedBy || '-');
    const stampLabel = this.escapeHtml(item.stampLabel || '-');
    const verificationCode = this.escapeHtml(item.verificationCode || '-');
    const signatureHash = this.escapeHtml(item.signatureHash || '-');

    const purposeBlock = isMission
      ? `
      <tr><th>Destination mission</th><td>${missionDestination}</td></tr>
      <tr><th>Objet mission</th><td>${missionPurpose}</td></tr>
      <tr><th>Periode</th><td>${safePeriod}</td></tr>`
      : isAbsence
        ? `
      <tr><th>Motif absence</th><td>${absenceReason}</td></tr>
      <tr><th>Periode</th><td>${safePeriod}</td></tr>`
        : `
      <tr><th>Periode</th><td>${safePeriod}</td></tr>
      <tr><th>Observations</th><td>${notes}</td></tr>`;

    const bodyParagraph = isMission
      ? `Le present ordre autorise ${employeeName} a effectuer la mission indiquee ci-dessus pour les besoins de service.`
      : isAbsence
        ? `Le present certificat confirme l'absence de ${employeeName} sur la periode mentionnee, conformement aux justificatifs disponibles.`
        : `Le present document administratif est etabli en faveur de ${employeeName} pour les besoins declares par le service proprietaire.`;

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { font-family: "Times New Roman", serif; margin: 0; color: #111827; font-size: 12px; line-height: 1.45; }
    .page { border: 1px solid #d1d5db; padding: 18px 20px; position: relative; min-height: 270mm; background: #fff; }
    .watermark { position: absolute; top: 46%; left: 50%; transform: translate(-50%, -50%) rotate(-23deg); color: rgba(17,24,39,.06); font-size: 56px; font-weight: 700; letter-spacing: 3px; white-space: nowrap; pointer-events: none; }
    .header { text-align: center; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 14px; }
    .country { font-size: 15px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase; }
    .ministry { font-size: 12px; text-transform: uppercase; margin-top: 3px; }
    .service { font-size: 11px; margin-top: 2px; color: #374151; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
    .badge { border: 1px solid #1f2937; padding: 3px 8px; font-weight: 700; }
    h1 { text-align: center; text-transform: uppercase; font-size: 20px; margin: 12px 0 16px; letter-spacing: .8px; }
    table { width: 100%; border-collapse: collapse; margin: 0 0 14px; }
    th, td { border: 1px solid #9ca3af; padding: 7px 8px; vertical-align: top; }
    th { width: 33%; text-align: left; background: #f3f4f6; font-weight: 700; }
    .body { margin: 16px 0; text-align: justify; }
    .footer { margin-top: 30px; display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
    .signature { width: 44%; text-align: center; }
    .signature-line { border-top: 1px solid #111827; margin-top: 42px; padding-top: 6px; font-weight: 700; }
    .stamp { width: 32%; border: 2px dashed #6b7280; border-radius: 999px; text-align: center; padding: 18px 8px; font-weight: 700; color: #374151; align-self: center; }
    .note { margin-top: 22px; font-size: 10px; color: #4b5563; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="page">
    <div class="watermark">DOCUMENT OFFICIEL</div>
    <div class="header">
      <div class="country">Republique de Guinee</div>
      <div class="ministry">Primature - Direction des Ressources Humaines</div>
      <div class="service">Service proprietaire: ${owner}</div>
    </div>

    <div class="meta">
      <div><strong>Reference:</strong> ${reference}</div>
      <div><strong>Date emission:</strong> ${issuedAt}</div>
      <div class="badge">Statut: ${status}</div>
    </div>

    <h1>${title}</h1>

    <table>
      <tr><th>Nom employe / agent</th><td>${employeeName}</td></tr>
      <tr><th>Matricule</th><td>${employeeId}</td></tr>
      <tr><th>Direction</th><td>${direction}</td></tr>
      <tr><th>Unite</th><td>${unit}</td></tr>
      ${purposeBlock}
    </table>

    <div class="body">${this.escapeHtml(bodyParagraph)}</div>

    <table>
      <tr><th>Observations</th><td>${notes}</td></tr>
      <tr><th>Signe le</th><td>${signedAt}</td></tr>
      <tr><th>Signataire</th><td>${signedBy}</td></tr>
      <tr><th>Cachet</th><td>${stampLabel}</td></tr>
      <tr><th>Code verification</th><td>${verificationCode}</td></tr>
      <tr><th>Empreinte signature</th><td>${signatureHash}</td></tr>
      <tr><th>Date de generation</th><td>${safeGeneratedAt}</td></tr>
    </table>

    <div class="footer">
      <div class="signature">
        <div>Pour validation</div>
        <div class="signature-line">${approver}</div>
      </div>
      <div class="stamp">CACHE T RH<br/>PRIMATURE</div>
    </div>

    <div class="note">Ce document est genere depuis le SIRH. Verification possible via le code ${verificationCode}.</div>
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
