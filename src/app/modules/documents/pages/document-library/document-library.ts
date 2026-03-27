import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize } from 'rxjs';
import {
  AssignDocumentPayload,
  CreateDocumentPayload,
  DocumentAnalyticsReport,
  DocumentArchivePurgeResult,
  DocumentArchiveRunResult,
  DocumentAuditLogItem,
  DocumentItem,
  DocumentOverdueItem,
  DocumentsService,
  SignDocumentPayload,
  UpdateDocumentPayload,
} from '../../documents.service';

@Component({
  selector: 'app-document-library',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './document-library.html',
})
export class DocumentLibraryPage implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private documentsService = inject(DocumentsService);
  private toastr = inject(ToastrService);

  private typeSub?: Subscription;

  readonly documentTypeOptions = [
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

  readonly statusOptions = ['Brouillon', 'En validation', 'Valide', 'Publie', 'Archive'];
  readonly statusTransitions: Record<string, string[]> = {
    Brouillon: ['En validation', 'Archive'],
    'En validation': ['Brouillon', 'Valide', 'Archive'],
    Valide: ['En validation', 'Publie', 'Archive'],
    Publie: ['Archive'],
    Archive: [],
  };

  items: DocumentItem[] = [];
  analytics: DocumentAnalyticsReport = this.emptyAnalytics();
  overdueItems: DocumentOverdueItem[] = [];
  lastArchiveRun: DocumentArchiveRunResult | null = null;
  lastPurgeRun: DocumentArchivePurgeResult | null = null;
  auditItems: DocumentAuditLogItem[] = [];
  showCreateForm = false;
  submitting = false;
  assigning = false;
  signing = false;
  transitioning = false;
  auditLoading = false;
  analyticsLoading = false;
  maintenanceRunning = false;
  editingReference: string | null = null;
  selectedReference = '';

  form = this.fb.group({
    reference: ['', [Validators.maxLength(40), Validators.pattern(/^[A-Z0-9-]*$/)]],
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    type: ['Ordre de mission', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
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
    approver: ['', [Validators.maxLength(120)]],
    missionDestination: ['', [Validators.maxLength(140)]],
    missionPurpose: ['', [Validators.maxLength(220)]],
    absenceReason: ['', [Validators.maxLength(220)]],
    notes: ['', [Validators.maxLength(600)]],
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

  ngOnInit(): void {
    this.loadDocuments();
    this.applyConditionalValidators();
    this.typeSub = this.form.controls.type.valueChanges.subscribe(() => {
      this.applyConditionalValidators();
    });
  }

  ngOnDestroy(): void {
    this.typeSub?.unsubscribe();
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

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (this.showCreateForm) {
      this.startCreate();
    } else {
      this.cancelCreate();
    }
  }

  startCreate(): void {
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
    this.runArchiveCycle(true);
  }

  executeArchiveRun(): void {
    if (!window.confirm('Confirmer l archivage automatique des documents eligibles ?')) {
      return;
    }
    this.runArchiveCycle(false);
  }

  runPurgeSimulation(): void {
    this.runArchivePurge(true);
  }

  executeArchivePurge(): void {
    if (!window.confirm('Confirmer la purge des documents archives selon la retention ?')) {
      return;
    }
    this.runArchivePurge(false);
  }

  startEdit(item: DocumentItem): void {
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

  assignDocument(item: DocumentItem): void {
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

  deliveryStatusLabel(item: DocumentItem): string {
    const status = String(item.deliveryStatus || '').trim() || 'Non assigne';
    if (status.toLowerCase() === 'assigne' && item.assignedEmployeeName) {
      return `${status} -> ${item.assignedEmployeeName}`;
    }
    return status;
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
    const pdfContent = this.buildSimplePdfDocument(lines);
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

  private buildSimplePdfDocument(rawLines: string[]): string {
    const normalizedLines = rawLines
      .map((line) => this.sanitizePdfPlainText(line))
      .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
      .slice(0, 46);

    const textCommands: string[] = ['BT', '/F1 11 Tf', '50 790 Td'];
    normalizedLines.forEach((line, index) => {
      if (index > 0) {
        textCommands.push('0 -15 Td');
      }
      textCommands.push(`(${this.escapePdfText(line)}) Tj`);
    });
    textCommands.push('ET');

    const stream = textCommands.join('\n');
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
