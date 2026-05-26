import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import * as QRCode from 'qrcode';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { InitialsAvatar } from '../../../../shared/components/initials-avatar/initials-avatar';
import { ActivatedRoute } from '@angular/router';
import { APP_PERMISSIONS, AccessControlService } from '../../../../core/security/access-control.service';
import { DisciplineCase, DisciplineService } from '../../../discipline/discipline.service';
import { DocumentAnalysisRun, DocumentsService } from '../../../documents/documents.service';
import {
  AgentAuditEvent,
  AgentCareerEvent,
  AgentCompetency,
  AgentDependent,
  AgentDetail,
  AgentDigitalBadge,
  AgentDocument,
  AgentEducation,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
  UpdateAgentPayload,
} from '../../personnel.service';
import {
  DocumentComplianceItem,
  RequiredDocumentDefinition,
  documentComplianceStatusLabel,
  evaluateDocumentComplianceItem,
  findDocumentByType as findAgentDocumentByType,
  getRequiredDocumentDefinitions,
  parseDocumentExpiry,
  summarizeDocumentCompliance,
} from '../../personnel-document-compliance';

const PHONE_PATTERN = /^[+\d\s().-]{7,20}$/;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MATRICULE_PATTERN = /^PRM-\d{4,8}$/;
const ALLOWED_DOCUMENT_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

interface AgentQualityReport {
  score: number;
  completedChecks: number;
  totalChecks: number;
  criticalIssues: string[];
  warnings: string[];
  strengths: string[];
  documentAlerts: string[];
}

interface AgentTimelineItem {
  type: 'Carriere' | 'Dossier' | 'Affectation' | 'Discipline';
  title: string;
  description: string;
  date: string;
  status: string;
  timestamp: number;
}

const COMPETENCY_LEVELS: AgentCompetency['level'][] = ['Debutant', 'Intermediaire', 'Avance', 'Expert'];
const DEPENDENT_STATUSES: AgentDependent['coverageStatus'][] = ['Actif', 'Suspendu', 'Expire'];

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgbNavModule, SpkReusableTables, InitialsAvatar],
  templateUrl: './agent-detail.html',
  styles: [
    `
      .agent-photo-block {
        width: 180px;
      }

      .agent-photo-frame {
        width: 160px;
        height: 160px;
        border-radius: 0.375rem;
        background: rgba(255, 255, 255, 0.07);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .agent-photo {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
      }

      @media (max-width: 767.98px) {
        .agent-photo-block {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      }
    `,
  ],
})
export class AgentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private personnelService = inject(PersonnelService);
  private disciplineService = inject(DisciplineService);
  private documentsService = inject(DocumentsService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private accessControl = inject(AccessControlService);
  private readonly fallbackPhoto = './assets/images/faces/profile.jpg';

  agent: AgentDetail = {
    id: '',
    matricule: '',
    fullName: '',
    direction: '',
    position: '',
    unit: '',
    status: '',
    manager: '',
    email: '',
    phone: '',
    photoUrl: './assets/images/faces/profile.jpg',
    identity: {
      identityType: '',
      identityNumber: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
    },
    administrative: {
      hireDate: '',
      contractType: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    educations: [],
    competencies: [],
    dependents: [],
    careerEvents: [],
    documents: [],
  };

  careerEvents: AgentCareerEvent[] = [];
  documents: AgentDocument[] = [];
  documentComplianceItems: DocumentComplianceItem[] = [];
  educations: AgentEducation[] = [];
  competencies: AgentCompetency[] = [];
  dependents: AgentDependent[] = [];
  dossiers: PersonnelDossier[] = [];
  affectations: PersonnelAffectation[] = [];
  disciplineCases: DisciplineCase[] = [];
  auditTrail: AgentAuditEvent[] = [];
  timeline360: AgentTimelineItem[] = [];
  digitalBadge: AgentDigitalBadge | null = null;
  badgeQrDataUrl = '';
  latestAnalysisRun: DocumentAnalysisRun | null = null;
  qualityReport: AgentQualityReport = {
    score: 0,
    completedChecks: 0,
    totalChecks: 0,
    criticalIssues: [],
    warnings: [],
    strengths: [],
    documentAlerts: [],
  };
  activeTabId:
    | 'identity'
    | 'diplomas'
    | 'competencies'
    | 'dependents'
    | 'badge'
    | 'quality'
    | 'assignments'
    | 'discipline'
    | 'career'
    | 'timeline'
    | 'history'
    | 'documents' =
    'identity';
  editMode = false;
  saving = false;
  uploadingPhoto = false;
  exportingDossier = false;
  loadingBadge = false;
  analyzingDocumentType = '';
  loadingContext = false;
  loadingAuditTrail = false;
  photoPreview = this.fallbackPhoto;
  selectedPhotoFileName = '';

  hasRealPhoto(): boolean {
    const preview = String(this.photoPreview || '').trim();
    return preview.length > 0 && preview !== this.fallbackPhoto;
  }
  competencyLevels = COMPETENCY_LEVELS;
  dependentStatuses = DEPENDENT_STATUSES;
  competencyDraft: AgentCompetency = this.createEmptyCompetency();
  dependentDraft: AgentDependent = this.createEmptyDependent();

  form = this.fb.group({
    matricule: [''],
    fullName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    direction: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    unit: ['', [Validators.maxLength(120)]],
    position: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    status: ['Actif', [Validators.required]],
    manager: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
    email: ['', [Validators.email, Validators.maxLength(120)]],
    phone: ['', [Validators.pattern(PHONE_PATTERN)]],
    photoUrl: [''],
    identityType: [''],
    identityNumber: [''],
    birthDate: [''],
    birthPlace: [''],
    nationality: [''],
    hireDate: [''],
    contractType: [''],
    address: [''],
    emergencyContactName: [''],
    emergencyContactPhone: ['', [Validators.pattern(PHONE_PATTERN)]],
    auditReason: ['', [Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    this.form.get('contractType')?.valueChanges.subscribe(() => {
      this.refreshDocumentAnalysis();
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;

      this.personnelService.getAgentById(id).subscribe((details) => {
        if (!details) return;
        // Defers state mutation to avoid NG0100 in dev mode when fallback streams emit synchronously.
        queueMicrotask(() => {
          this.applyAgentDetails(details);
        });
      });
    });
  }

  toggleEdit(): void {
    if (!this.editMode) {
      if (!this.accessControl.hasPermission(APP_PERMISSIONS.personnelManage)) {
        this.toastr.warning('Acces refuse: droits insuffisants pour modifier la fiche agent', 'Agent', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        });
        return;
      }
      this.editMode = true;
      return;
    }

    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.patchFormFromAgent(this.agent);
    this.documents = this.cloneDocuments(this.agent.documents || []);
    this.competencies = this.cloneCompetencies(this.agent.competencies || []);
    this.dependents = this.cloneDependents(this.agent.dependents || []);
    this.refreshDocumentAnalysis();
    this.selectedPhotoFileName = '';
    this.form.patchValue({ auditReason: '' });
  }

  regularizeDocuments(): void {
    this.activeTabId = 'documents';
    this.editMode = true;
  }

  auditSourceLabel(source: AgentAuditEvent['source']): string {
    switch (source) {
      case 'merge':
        return 'Fusion';
      case 'system':
        return 'Système';
      case 'update':
      default:
        return 'Mise à jour';
    }
  }

  auditSourceBadgeClass(source: AgentAuditEvent['source']): string {
    switch (source) {
      case 'merge':
        return 'bg-info-transparent text-info';
      case 'system':
        return 'bg-warning-transparent text-warning';
      case 'update':
      default:
        return 'bg-primary-transparent text-primary';
    }
  }

  addCompetency(): void {
    const draft = this.normalizeCompetency(this.competencyDraft);
    if (!draft.label) {
      this.toastr.warning('Renseignez au moins le libellé de la compétence', 'Compétences', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.competencies = [...this.competencies, draft];
    this.competencyDraft = this.createEmptyCompetency();
    this.refreshDocumentAnalysis();
  }

  removeCompetency(id: string): void {
    this.competencies = this.competencies.filter((item) => item.id !== id);
    this.refreshDocumentAnalysis();
  }

  updateCompetencyField(id: string, field: keyof AgentCompetency, value: string): void {
    this.competencies = this.competencies.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return this.normalizeCompetency({
        ...item,
        [field]: field === 'level' ? this.normalizeCompetencyLevel(value) : value,
      });
    });
    this.refreshDocumentAnalysis();
  }

  addDependent(): void {
    const draft = this.normalizeDependent(this.dependentDraft);
    if (!draft.fullName) {
      this.toastr.warning("Renseignez le nom de l'ayant droit", 'Ayants droit', {
        timeOut: 2500,
        positionClass: 'toast-top-right',
      });
      return;
    }
    this.dependents = [...this.dependents, draft];
    this.dependentDraft = this.createEmptyDependent();
    this.refreshDocumentAnalysis();
  }

  removeDependent(id: string): void {
    this.dependents = this.dependents.filter((item) => item.id !== id);
    this.refreshDocumentAnalysis();
  }

  updateDependentField(id: string, field: keyof AgentDependent, value: string): void {
    this.dependents = this.dependents.map((item) => {
      if (item.id !== id) {
        return item;
      }
      return this.normalizeDependent({
        ...item,
        [field]: field === 'coverageStatus' ? this.normalizeDependentStatus(value) : value,
      });
    });
    this.refreshDocumentAnalysis();
  }

  dependentStatusBadgeClass(status: AgentDependent['coverageStatus']): string {
    switch (status) {
      case 'Suspendu':
        return 'bg-warning-transparent text-warning';
      case 'Expire':
        return 'bg-danger-transparent text-danger';
      case 'Actif':
      default:
        return 'bg-success-transparent text-success';
    }
  }

  disciplineSeverityBadgeClass(severity: string): string {
    const normalized = this.normalizeText(severity);
    if (normalized.includes('critique') || normalized.includes('eleve')) {
      return 'bg-danger-transparent text-danger';
    }
    if (normalized.includes('moyen')) {
      return 'bg-warning-transparent text-warning';
    }
    return 'bg-info-transparent text-info';
  }

  save(): void {
    if (this.saving || this.uploadingPhoto) {
      return;
    }

    if (!this.accessControl.hasPermission(APP_PERMISSIONS.personnelManage)) {
      this.toastr.error('Acces refuse: droits insuffisants pour enregistrer les modifications', 'Agent', {
        timeOut: 3500,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.agent.id) {
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    this.personnelService
      .updateAgent(this.agent.id, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (updated) => {
          this.applyAgentDetails(updated);
          this.editMode = false;
          this.selectedPhotoFileName = '';
          this.toastr.success('Agent mis à jour avec succès', 'Agent', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const mimeType = (file.type || '').toLowerCase();
    if (!mimeType.startsWith('image/')) {
      this.toastr.error('La photo doit être une image (PNG/JPG/WebP)', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      this.toastr.error('La photo dépasse 10 MB', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.editMode = true;
    this.selectedPhotoFileName = file.name;
    this.previewSelectedPhoto(file);

    this.uploadingPhoto = true;
    this.personnelService
      .uploadAgentFile(file)
      .pipe(finalize(() => (this.uploadingPhoto = false)))
      .subscribe({
        next: (uploaded) => {
          this.form.patchValue({ photoUrl: uploaded.url });
          this.photoPreview = uploaded.url || this.photoPreview;
          this.selectedPhotoFileName = uploaded.fileName || file.name;
          this.toastr.success('Photo téléversée, cliquez sur Enregistrer', 'Agent', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  fieldError(fieldName: string): string | null {
    const control = this.form.get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caractères`;
    if (control.errors['email']) return 'Format email invalide';
    if (control.errors['pattern']) return 'Téléphone invalide';
    return 'Valeur invalide';
  }

  requiredDocumentDefinitions(): RequiredDocumentDefinition[] {
    return getRequiredDocumentDefinitions(
      String(this.form.get('contractType')?.value || this.agent.administrative?.contractType || '')
    );
  }

  requiredDocumentRecord(type: string): AgentDocument | null {
    return this.findDocumentByType(type);
  }

  requiredDocumentExpiryValue(type: string): string {
    return String(this.requiredDocumentRecord(type)?.expiresAt || '').trim();
  }

  requiredDocumentExpiryLabel(type: string): string {
    const document = this.requiredDocumentRecord(type);
    return document ? this.documentExpiryLabel(document) : 'Non renseignée';
  }

  requiredDocumentFileLabel(type: string): string {
    return String(this.requiredDocumentRecord(type)?.fileName || '').trim();
  }

  downloadDocument(document: AgentDocument | null, fallbackName: string): void {
    const fileUrl = String(document?.fileDataUrl || '').trim();
    if (!fileUrl) {
      return;
    }

    const fileName = String(document?.fileName || fallbackName || 'document').trim() || 'document';
    if (fileUrl.startsWith('blob:')) {
      this.downloadObjectUrl(fileUrl, fileName);
      return;
    }

    this.personnelService.downloadAgentFile(fileUrl).subscribe({
      next: (blob) => this.downloadBlob(blob, fileName),
      error: () => {
        this.toastr.error('Téléchargement impossible pour le moment', 'Agent', {
          timeOut: 3200,
          positionClass: 'toast-top-right',
        });
      },
    });
  }

  exportDossierPdf(): void {
    if (!this.agent.id || this.exportingDossier) {
      return;
    }

    this.exportingDossier = true;
    this.personnelService
      .exportAgentDossierPdf(this.agent.id)
      .pipe(finalize(() => (this.exportingDossier = false)))
      .subscribe({
        next: (blob) => {
          const fileName = `dossier-${this.agent.matricule || this.agent.id}.pdf`;
          this.downloadBlob(blob, fileName);
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Export dossier', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  refreshDigitalBadge(): void {
    if (!this.agent.id || this.loadingBadge) {
      return;
    }

    this.loadingBadge = true;
    this.personnelService
      .getAgentDigitalBadge(this.agent.id)
      .pipe(finalize(() => (this.loadingBadge = false)))
      .subscribe({
        next: (badge) => {
          this.digitalBadge = badge;
          this.renderBadgeQrCode(badge);
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Badge numérique', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  analyzeRequiredDocument(type: string): void {
    const document = this.requiredDocumentRecord(type);
    const reference = String(document?.reference || '').trim();
    if (!reference) {
      this.toastr.warning('Renseignez et enregistrez une référence documentaire avant analyse OCR', 'OCR', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.analyzingDocumentType = type;
    this.documentsService
      .analyzeDocument(reference, {
        pipelineStage: 'FULL',
        providerName: 'mock-ocr',
        modelName: 'gpa-gouve-ocr-v1',
        force: true,
      })
      .pipe(finalize(() => (this.analyzingDocumentType = '')))
      .subscribe({
        next: (run) => {
          this.latestAnalysisRun = run;
          this.applyDocumentAnalysisRun(run, type);
          this.editMode = true;
          this.toastr.info('Métadonnées OCR appliquées en brouillon. Vérifiez puis enregistrez.', 'OCR', {
            timeOut: 4200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'OCR', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  complianceForType(type: string): DocumentComplianceItem {
    return (
      this.documentComplianceItems.find((item) => this.normalizeText(item.type) === this.normalizeText(type)) || {
        type,
        label: type,
        required: true,
        status: 'manquant',
        message: 'Document non renseigné.',
        badgeClass: 'bg-danger-transparent text-danger',
        document: null,
      }
    );
  }

  isDocumentRequired(doc: AgentDocument): boolean {
    return (
      doc.required !== false ||
      this.requiredDocumentDefinitions().some((definition) => this.normalizeText(definition.type) === this.normalizeText(doc.type))
    );
  }

  documentSummaryLabel(): string {
    const requiredItems = this.documentComplianceItems.filter((item) => item.required);
    const compliant = requiredItems.filter((item) => item.status === 'conforme').length;
    return `${compliant}/${requiredItems.length} pièces obligatoires conformes`;
  }

  missingRequiredDocumentsCount(): number {
    return this.documentComplianceItems.filter((item) => item.required && item.status === 'manquant').length;
  }

  expiredDocumentCount(): number {
    return this.documentComplianceItems.filter((item) => item.required && item.status === 'expire').length;
  }

  expiringSoonDocumentCount(): number {
    return this.documentComplianceItems.filter((item) => item.required && item.status === 'a_renouveler').length;
  }

  hasDocumentAlerts(): boolean {
    return this.documentComplianceItems.some((item) => item.required && item.status !== 'conforme');
  }

  updateRequiredDocumentField(type: string, field: 'reference' | 'status' | 'expiresAt', value: string): void {
    const current = this.findDocumentByType(type);
    const nextDocument: AgentDocument = {
      type,
      reference: String(current?.reference || '').trim(),
      status: String(current?.status || 'Valide').trim() || 'Valide',
      expiresAt: String(current?.expiresAt || '').trim(),
      required: true,
      fileName: String(current?.fileName || '').trim(),
      fileDataUrl: String(current?.fileDataUrl || '').trim(),
    };

    if (field === 'reference') {
      nextDocument.reference = String(value || '').trim();
    } else if (field === 'status') {
      nextDocument.status = String(value || 'Valide').trim() || 'Valide';
    } else if (field === 'expiresAt') {
      nextDocument.expiresAt = String(value || '').trim();
    }

    this.upsertDocument(nextDocument);
  }

  onRequiredDocumentFileSelected(type: string, event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    if (!this.validateDocumentFile(file)) {
      return;
    }

    this.uploadingPhoto = true;
    this.personnelService
      .uploadAgentFile(file)
      .pipe(finalize(() => (this.uploadingPhoto = false)))
      .subscribe({
        next: (uploaded) => {
          const current = this.findDocumentByType(type);
          this.upsertDocument({
            type,
            reference: String(current?.reference || '').trim(),
            status: String(current?.status || 'Valide').trim() || 'Valide',
            expiresAt: String(current?.expiresAt || '').trim(),
            required: true,
            fileName: uploaded.fileName || file.name,
            fileDataUrl: uploaded.url,
          });
          this.toastr.success('Pièce téléversée, enregistrez la fiche pour valider', 'Agent', {
            timeOut: 2200,
            positionClass: 'toast-top-right',
          });
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Agent', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  documentStatusBadgeClass(doc: AgentDocument): string {
    return this.evaluateDocumentComplianceItem(doc.type, this.isDocumentRequired(doc)).badgeClass;
  }

  documentStatusBadgeLabel(doc: AgentDocument): string {
    return documentComplianceStatusLabel(this.evaluateDocumentComplianceItem(doc.type, this.isDocumentRequired(doc)).status);
  }

  documentStatusLabel(doc: AgentDocument): string {
    return this.evaluateDocumentComplianceItem(doc.type, this.isDocumentRequired(doc)).message;
  }

  documentExpiryLabel(doc: AgentDocument): string {
    const expiry = parseDocumentExpiry(doc.expiresAt);
    if (!expiry.isoDate) {
      return 'Non renseignée';
    }
    return expiry.isoDate;
  }

  private applyAgentDetails(details: AgentDetail): void {
    this.agent = details;
    this.careerEvents = details.careerEvents || [];
    this.documents = this.cloneDocuments(details.documents || []);
    this.educations = details.educations || [];
    this.competencies = this.cloneCompetencies(details.competencies || []);
    this.dependents = this.cloneDependents(details.dependents || []);
    this.loadAgentContext(details);
    this.patchFormFromAgent(details);
    this.refreshDocumentAnalysis();
    this.refreshDigitalBadge();
  }

  private patchFormFromAgent(agent: AgentDetail): void {
    this.form.patchValue({
      matricule: agent.matricule || '',
      fullName: agent.fullName || '',
      direction: agent.direction || '',
      unit: agent.unit || '',
      position: agent.position || '',
      status: agent.status || 'Actif',
      manager: agent.manager || '',
      email: agent.email || '',
      phone: agent.phone || '',
      photoUrl: agent.photoUrl || this.fallbackPhoto,
      identityType: agent.identity?.identityType || '',
      identityNumber: agent.identity?.identityNumber || '',
      birthDate: agent.identity?.birthDate || '',
      birthPlace: agent.identity?.birthPlace || '',
      nationality: agent.identity?.nationality || '',
      hireDate: agent.administrative?.hireDate || '',
      contractType: agent.administrative?.contractType || '',
      address: agent.administrative?.address || '',
      emergencyContactName: agent.administrative?.emergencyContactName || '',
      emergencyContactPhone: agent.administrative?.emergencyContactPhone || '',
      auditReason: '',
    });
    this.photoPreview = agent.photoUrl || this.fallbackPhoto;
  }

  private buildPayload(): UpdateAgentPayload {
    const value = this.form.getRawValue();
    const auditReason = String(value.auditReason || '').trim();

    return {
      matricule: String(value.matricule || '').trim(),
      fullName: String(value.fullName || '').trim(),
      direction: String(value.direction || '').trim(),
      unit: String(value.unit || '').trim(),
      position: String(value.position || '').trim(),
      status: String(value.status || 'Actif').trim(),
      manager: String(value.manager || '').trim(),
      email: String(value.email || '').trim(),
      phone: String(value.phone || '').trim(),
      photoUrl: String(value.photoUrl || this.fallbackPhoto).trim(),
      identity: {
        identityType: String(value.identityType || '').trim(),
        identityNumber: String(value.identityNumber || '').trim(),
        birthDate: String(value.birthDate || '').trim(),
        birthPlace: String(value.birthPlace || '').trim(),
        nationality: String(value.nationality || '').trim(),
      },
      administrative: {
        hireDate: String(value.hireDate || '').trim(),
        contractType: String(value.contractType || '').trim(),
        address: String(value.address || '').trim(),
        emergencyContactName: String(value.emergencyContactName || '').trim(),
        emergencyContactPhone: String(value.emergencyContactPhone || '').trim(),
      },
      educations: this.educations.map((item) => ({ ...item })),
      competencies: this.competencies.map((item) => ({ ...item })),
      dependents: this.dependents.map((item) => ({ ...item })),
      careerEvents: this.careerEvents.map((item) => ({ ...item })),
      documents: this.documents
        .map((item) => ({
          ...item,
          type: String(item.type || '').trim(),
          reference: String(item.reference || '').trim(),
          status: String(item.status || 'Valide').trim() || 'Valide',
          expiresAt: String(item.expiresAt || '').trim(),
          fileName: String(item.fileName || '').trim(),
          fileDataUrl: String(item.fileDataUrl || '').trim(),
        }))
        .filter((item) => item.type && item.reference),
      auditReason: auditReason || undefined,
    };
  }

  private refreshDocumentAnalysis(): void {
    const analysisAgent = this.buildAnalysisAgent();
    const documentSummary = summarizeDocumentCompliance(
      this.documents,
      String(this.form.get('contractType')?.value || this.agent.administrative?.contractType || '')
    );
    this.documentComplianceItems = documentSummary.items;
    this.qualityReport = this.buildQualityReport(analysisAgent, this.dossiers, this.affectations, documentSummary);
  }

  private buildAnalysisAgent(): AgentDetail {
    const value = this.form.getRawValue();

    return {
      ...this.agent,
      matricule: String(value.matricule || this.agent.matricule || '').trim(),
      fullName: String(value.fullName || this.agent.fullName || '').trim(),
      direction: String(value.direction || this.agent.direction || '').trim(),
      position: String(value.position || this.agent.position || '').trim(),
      unit: String(value.unit || this.agent.unit || '').trim(),
      status: String(value.status || this.agent.status || 'Actif').trim(),
      manager: String(value.manager || this.agent.manager || '').trim(),
      email: String(value.email || this.agent.email || '').trim(),
      phone: String(value.phone || this.agent.phone || '').trim(),
      photoUrl: String(value.photoUrl || this.agent.photoUrl || this.fallbackPhoto).trim() || this.fallbackPhoto,
      identity: {
        identityType: String(value.identityType || this.agent.identity?.identityType || '').trim(),
        identityNumber: String(value.identityNumber || this.agent.identity?.identityNumber || '').trim(),
        birthDate: String(value.birthDate || this.agent.identity?.birthDate || '').trim(),
        birthPlace: String(value.birthPlace || this.agent.identity?.birthPlace || '').trim(),
        nationality: String(value.nationality || this.agent.identity?.nationality || '').trim(),
      },
      administrative: {
        hireDate: String(value.hireDate || this.agent.administrative?.hireDate || '').trim(),
        contractType: String(value.contractType || this.agent.administrative?.contractType || '').trim(),
        address: String(value.address || this.agent.administrative?.address || '').trim(),
        emergencyContactName: String(
          value.emergencyContactName || this.agent.administrative?.emergencyContactName || ''
        ).trim(),
        emergencyContactPhone: String(
          value.emergencyContactPhone || this.agent.administrative?.emergencyContactPhone || ''
        ).trim(),
      },
      educations: this.educations.map((item) => ({ ...item })),
      competencies: this.competencies.map((item) => ({ ...item })),
      dependents: this.dependents.map((item) => ({ ...item })),
      careerEvents: this.careerEvents.map((item) => ({ ...item })),
      documents: this.cloneDocuments(this.documents),
    };
  }

  private evaluateDocumentComplianceItem(
    type: string,
    required: boolean,
    documents: AgentDocument[] = this.documents
  ): DocumentComplianceItem {
    return evaluateDocumentComplianceItem(type, required, documents);
  }

  private findDocumentByType(type: string, documents: AgentDocument[] = this.documents): AgentDocument | null {
    return findAgentDocumentByType(type, documents);
  }

  private upsertDocument(document: AgentDocument): void {
    const nextDocument = {
      ...document,
      type: String(document.type || '').trim(),
      reference: String(document.reference || '').trim(),
      status: String(document.status || 'Valide').trim() || 'Valide',
      expiresAt: String(document.expiresAt || '').trim(),
      required: document.required !== false,
      fileName: String(document.fileName || '').trim(),
      fileDataUrl: String(document.fileDataUrl || '').trim(),
    };
    const normalizedType = this.normalizeText(nextDocument.type);
    const hasMeaningfulContent =
      !!nextDocument.reference ||
      !!nextDocument.fileDataUrl ||
      !!nextDocument.fileName ||
      !!nextDocument.expiresAt ||
      this.normalizeText(nextDocument.status) !== 'valide';
    const existingIndex = this.documents.findIndex((item) => this.normalizeText(item.type) === normalizedType);
    const nextDocuments = this.cloneDocuments(this.documents);

    if (!hasMeaningfulContent) {
      if (existingIndex >= 0) {
        nextDocuments.splice(existingIndex, 1);
      }
      this.documents = nextDocuments;
      this.refreshDocumentAnalysis();
      return;
    }

    if (existingIndex >= 0) {
      nextDocuments[existingIndex] = nextDocument;
    } else {
      nextDocuments.push(nextDocument);
    }

    this.documents = nextDocuments;
    this.refreshDocumentAnalysis();
  }

  private cloneDocuments(documents: AgentDocument[]): AgentDocument[] {
    return (documents || []).map((item) => ({
      type: String(item.type || '').trim(),
      reference: String(item.reference || '').trim(),
      status: String(item.status || 'Valide').trim() || 'Valide',
      required: item.required !== false,
      expiresAt: String(item.expiresAt || '').trim(),
      fileName: String(item.fileName || '').trim(),
      fileDataUrl: String(item.fileDataUrl || '').trim(),
    }));
  }

  private cloneCompetencies(items: AgentCompetency[]): AgentCompetency[] {
    return (items || []).map((item) => this.normalizeCompetency(item)).filter((item) => !!item.label);
  }

  private cloneDependents(items: AgentDependent[]): AgentDependent[] {
    return (items || []).map((item) => this.normalizeDependent(item)).filter((item) => !!item.fullName);
  }

  private createEmptyCompetency(): AgentCompetency {
    return {
      id: this.buildLocalId('comp'),
      label: '',
      category: 'Métier RH',
      level: 'Debutant',
      lastAssessedAt: '',
    };
  }

  private createEmptyDependent(): AgentDependent {
    return {
      id: this.buildLocalId('dep'),
      fullName: '',
      relationship: '',
      birthDate: '',
      coverageType: 'Protection sociale',
      coverageStatus: 'Actif',
      phone: '',
    };
  }

  private normalizeCompetency(item: Partial<AgentCompetency>): AgentCompetency {
    return {
      id: String(item.id || this.buildLocalId('comp')).trim(),
      label: String(item.label || '').trim(),
      category: String(item.category || 'Métier RH').trim() || 'Métier RH',
      level: this.normalizeCompetencyLevel(item.level || 'Debutant'),
      lastAssessedAt: String(item.lastAssessedAt || '').trim(),
    };
  }

  private normalizeCompetencyLevel(value: string): AgentCompetency['level'] {
    if (value === 'Expert' || value === 'Avance' || value === 'Intermediaire' || value === 'Debutant') {
      return value;
    }
    const normalized = this.normalizeText(value);
    if (normalized.includes('expert')) return 'Expert';
    if (normalized.includes('avance')) return 'Avance';
    if (normalized.includes('inter')) return 'Intermediaire';
    return 'Debutant';
  }

  private normalizeDependent(item: Partial<AgentDependent>): AgentDependent {
    return {
      id: String(item.id || this.buildLocalId('dep')).trim(),
      fullName: String(item.fullName || '').trim(),
      relationship: String(item.relationship || '').trim(),
      birthDate: String(item.birthDate || '').trim(),
      coverageType: String(item.coverageType || 'Protection sociale').trim() || 'Protection sociale',
      coverageStatus: this.normalizeDependentStatus(item.coverageStatus || 'Actif'),
      phone: String(item.phone || '').trim(),
    };
  }

  private normalizeDependentStatus(value: string): AgentDependent['coverageStatus'] {
    if (value === 'Actif' || value === 'Suspendu' || value === 'Expire') {
      return value;
    }
    const normalized = this.normalizeText(value);
    if (normalized.includes('suspend')) return 'Suspendu';
    if (normalized.includes('expir')) return 'Expire';
    return 'Actif';
  }

  private buildLocalId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private renderBadgeQrCode(badge: AgentDigitalBadge): void {
    this.badgeQrDataUrl = '';
    const payload = badge.qrPayload || JSON.stringify(badge);
    QRCode.toDataURL(payload, {
      margin: 1,
      width: 184,
      errorCorrectionLevel: 'M',
    })
      .then((dataUrl) => {
        this.badgeQrDataUrl = dataUrl;
      })
      .catch(() => {
        this.badgeQrDataUrl = '';
      });
  }

  private applyDocumentAnalysisRun(run: DocumentAnalysisRun, type: string): void {
    const fieldValue = (fieldName: string): string => {
      const field = (run.fields || []).find((item) => this.normalizeText(item.fieldName) === this.normalizeText(fieldName));
      if (!field) {
        return '';
      }
      return String(
        field.normalizedValue ||
          field.fieldValueText ||
          field.fieldValueDate ||
          field.fieldValueNumber ||
          ''
      ).trim();
    };

    const formPatch: Record<string, string> = {};
    const mappedFields: Array<[string, string]> = [
      ['identityType', fieldValue('identity_type')],
      ['identityNumber', fieldValue('identity_number')],
      ['birthDate', fieldValue('birth_date')],
      ['birthPlace', fieldValue('birth_place')],
      ['nationality', fieldValue('nationality')],
      ['hireDate', fieldValue('hire_date')],
      ['contractType', fieldValue('contract_type')],
    ];
    mappedFields.forEach(([formKey, value]) => {
      if (value) {
        formPatch[formKey] = value;
      }
    });
    if (Object.keys(formPatch).length) {
      this.form.patchValue(formPatch);
    }

    const expiresOn = fieldValue('expires_on');
    const documentReference = fieldValue('document_reference');
    if (expiresOn || documentReference) {
      const current = this.findDocumentByType(type);
      this.upsertDocument({
        type,
        reference: documentReference || String(current?.reference || '').trim(),
        status: String(current?.status || 'Valide').trim() || 'Valide',
        expiresAt: expiresOn || String(current?.expiresAt || '').trim(),
        required: true,
        fileName: String(current?.fileName || '').trim(),
        fileDataUrl: String(current?.fileDataUrl || '').trim(),
      });
    }

    const degree = fieldValue('degree');
    const institution = fieldValue('institution');
    const graduationYear = fieldValue('graduation_year');
    const field = fieldValue('education_field');
    if (degree || institution || graduationYear || field) {
      const firstEducation = this.educations[0] || {
        degree: '',
        field: '',
        institution: '',
        graduationYear: '',
      };
      this.educations = [
        {
          degree: degree || firstEducation.degree,
          field: field || firstEducation.field,
          institution: institution || firstEducation.institution,
          graduationYear: graduationYear || firstEducation.graduationYear,
        },
        ...this.educations.slice(1),
      ];
    }

    this.refreshDocumentAnalysis();
  }

  private validateDocumentFile(file: File): boolean {
    const mimeType = (file.type || '').toLowerCase();
    const lowerFileName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_DOCUMENT_EXTENSIONS.some((extension) => lowerFileName.endsWith(extension));
    const isAllowedMimeType = mimeType ? ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType) : hasAllowedExtension;

    if (!isAllowedMimeType || !hasAllowedExtension) {
      this.toastr.error('Document invalide: formats autorisés PDF/JPG/PNG/WebP', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return false;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      this.toastr.error('Le document dépasse 10 MB', 'Agent', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return false;
    }

    return true;
  }

  private previewSelectedPhoto(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (dataUrl) {
        this.photoPreview = dataUrl;
      }
    };
    reader.readAsDataURL(file);
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

  private loadAgentContext(agent: AgentDetail): void {
    this.loadingContext = true;
    this.loadingAuditTrail = true;
    const auditTrail$ = agent.id
      ? this.personnelService.getAgentAuditTrail(agent.id, {
          page: 1,
          limit: 200,
          sortBy: 'changedAt',
          sortOrder: 'desc',
        })
      : of<AgentAuditEvent[]>([]);

    forkJoin({
      dossiers: this.personnelService
        .getDossiers({ page: 1, limit: 400, sortBy: 'updatedAt', sortOrder: 'desc', agentId: agent.id })
        .pipe(finalize(() => void 0)),
      affectations: this.personnelService
        .getAffectations({ page: 1, limit: 400, sortBy: 'effectiveDate', sortOrder: 'desc', agentId: agent.id })
        .pipe(finalize(() => void 0)),
      disciplineCases: this.disciplineService
        .getCases({ page: 1, limit: 200, sortBy: 'openedOn', sortOrder: 'desc', agent: agent.fullName })
        .pipe(catchError(() => of<DisciplineCase[]>([]))),
      auditTrail: auditTrail$.pipe(finalize(() => void 0)),
    })
      .pipe(
        finalize(() => {
          this.loadingContext = false;
          this.loadingAuditTrail = false;
        })
      )
      .subscribe({
        next: (context) => {
          this.dossiers = context.dossiers.filter((item) => this.matchesAgent(item.agentId, item.agent, agent));
          this.affectations = context.affectations.filter((item) =>
            this.matchesAgent(item.agentId, item.agent, agent)
          );
          this.disciplineCases = context.disciplineCases.filter((item) =>
            this.normalizeText(item.agent) === this.normalizeText(agent.fullName)
          );
          this.auditTrail = context.auditTrail;
          this.timeline360 = this.buildTimeline(agent, this.dossiers, this.affectations, this.disciplineCases);
          this.refreshDocumentAnalysis();
        },
        error: () => {
          this.dossiers = [];
          this.affectations = [];
          this.disciplineCases = [];
          this.auditTrail = [];
          this.timeline360 = this.buildTimeline(agent, [], [], []);
          this.refreshDocumentAnalysis();
        },
      });
  }

  private buildQualityReport(
    agent: AgentDetail,
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[],
    documentSummary = summarizeDocumentCompliance(agent.documents || [], agent.administrative?.contractType || '')
  ): AgentQualityReport {
    const criticalDocumentAlerts = documentSummary.items
      .filter((item) => item.required && (item.status === 'manquant' || item.status === 'expire'))
      .map((item) => item.message);
    const warningDocumentAlerts = documentSummary.items
      .filter((item) => item.required && item.status === 'a_renouveler')
      .map((item) => item.message);

    const checks: Array<{
      ok: boolean;
      severity: 'critical' | 'warning';
      successLabel: string;
      failureLabel: string;
    }> = [
      {
        ok: String(agent.fullName || '').trim().length >= 3,
        severity: 'critical',
        successLabel: 'Nom complet renseigné',
        failureLabel: 'Nom complet manquant ou invalide',
      },
      {
        ok: MATRICULE_PATTERN.test(String(agent.matricule || '').trim()),
        severity: 'critical',
        successLabel: 'Matricule conforme',
        failureLabel: 'Matricule non conforme (format PRM-0001)',
      },
      {
        ok: !!String(agent.direction || '').trim() && !!String(agent.unit || '').trim() && !!String(agent.position || '').trim(),
        severity: 'critical',
        successLabel: 'Affectation organisationnelle complète',
        failureLabel: 'Direction, unité ou poste manquant',
      },
      {
        ok: String(agent.manager || '').trim().length >= 3,
        severity: 'warning',
        successLabel: 'Manager renseigné',
        failureLabel: 'Manager absent ou incomplet',
      },
      {
        ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(agent.email || '').trim()),
        severity: 'warning',
        successLabel: 'Email professionnel valide',
        failureLabel: 'Email professionnel manquant ou invalide',
      },
      {
        ok: PHONE_PATTERN.test(String(agent.phone || '').trim()),
        severity: 'warning',
        successLabel: 'Téléphone principal valide',
        failureLabel: 'Téléphone principal manquant ou invalide',
      },
      {
        ok: !!String(agent.identity?.identityType || '').trim() && !!String(agent.identity?.identityNumber || '').trim(),
        severity: 'critical',
        successLabel: 'Pièce d’identité renseignée',
        failureLabel: 'Type/numéro de pièce d’identité manquant',
      },
      {
        ok: !!String(agent.identity?.birthDate || '').trim(),
        severity: 'warning',
        successLabel: 'Date de naissance renseignée',
        failureLabel: 'Date de naissance manquante',
      },
      {
        ok: !!String(agent.administrative?.hireDate || '').trim() && !!String(agent.administrative?.contractType || '').trim(),
        severity: 'critical',
        successLabel: 'Informations contractuelles complètes',
        failureLabel: 'Date de recrutement ou type de contrat manquant',
      },
      {
        ok: !!String(agent.administrative?.emergencyContactName || '').trim() && !!String(agent.administrative?.emergencyContactPhone || '').trim(),
        severity: 'warning',
        successLabel: 'Contact d’urgence complet',
        failureLabel: 'Contact d’urgence incomplet',
      },
      {
        ok: Array.isArray(agent.educations) && agent.educations.length > 0,
        severity: 'critical',
        successLabel: 'Formation académique renseignée',
        failureLabel: 'Aucun diplôme renseigné',
      },
      {
        ok: Array.isArray(agent.competencies) && agent.competencies.length > 0,
        severity: 'warning',
        successLabel: 'Compétences cartographiées',
        failureLabel: 'Aucune compétence métier renseignée',
      },
      {
        ok: Array.isArray(agent.dependents),
        severity: 'warning',
        successLabel: 'Registre des ayants droit contrôlé',
        failureLabel: 'Registre des ayants droit non initialisé',
      },
      {
        ok: criticalDocumentAlerts.length === 0,
        severity: 'critical',
        successLabel: 'Documents obligatoires présents',
        failureLabel: criticalDocumentAlerts[0] || 'Documents obligatoires incomplets',
      },
      {
        ok: dossiers.length > 0,
        severity: 'warning',
        successLabel: 'Dossier administratif rattaché',
        failureLabel: 'Aucun dossier administratif rattaché',
      },
      {
        ok: affectations.length > 0,
        severity: 'warning',
        successLabel: 'Historique d’affectations disponible',
        failureLabel: 'Aucune affectation historisée',
      },
      {
        ok: warningDocumentAlerts.length === 0,
        severity: 'warning',
        successLabel: 'Aucune pièce à renouveler immédiatement',
        failureLabel: warningDocumentAlerts[0] || 'Une pièce obligatoire doit être renouvelée',
      },
    ];

    const completedChecks = checks.filter((check) => check.ok).length;
    const totalChecks = checks.length;
    const score = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;

    return {
      score,
      completedChecks,
      totalChecks,
      criticalIssues: checks.filter((check) => !check.ok && check.severity === 'critical').map((check) => check.failureLabel),
      warnings: checks.filter((check) => !check.ok && check.severity === 'warning').map((check) => check.failureLabel),
      strengths: checks.filter((check) => check.ok).map((check) => check.successLabel),
      documentAlerts: [...criticalDocumentAlerts, ...warningDocumentAlerts],
    };
  }

  private buildTimeline(
    agent: AgentDetail,
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[],
    disciplineCases: DisciplineCase[]
  ): AgentTimelineItem[] {
    const careerItems: AgentTimelineItem[] = (agent.careerEvents || []).map((event) => ({
      type: 'Carriere',
      title: event.title || 'Évènement carrière',
      description: event.description || 'Mise à jour de carrière',
      date: event.date || '',
      status: 'Historique',
      timestamp: this.toTimestamp(event.date),
    }));

    const dossierItems: AgentTimelineItem[] = dossiers.map((item) => ({
      type: 'Dossier',
      title: item.type || 'Dossier administratif',
      description: `${item.reference} - ${item.agent}`,
      date: item.updatedAt,
      status: item.status || 'Actif',
      timestamp: this.toTimestamp(item.updatedAt),
    }));

    const affectationItems: AgentTimelineItem[] = affectations.map((item) => ({
      type: 'Affectation',
      title: `${item.fromUnit} → ${item.toUnit}`,
      description: `${item.reference} - ${item.agent}`,
      date: item.effectiveDate,
      status: item.status || 'Planifiee',
      timestamp: this.toTimestamp(item.effectiveDate),
    }));

    const disciplineItems: AgentTimelineItem[] = disciplineCases.map((item) => ({
      type: 'Discipline',
      title: `${item.reference} - ${item.category}`,
      description: item.summary || item.infraction || 'Dossier disciplinaire',
      date: item.openedOn || item.incidentOn,
      status: item.status || item.severity,
      timestamp: this.toTimestamp(item.openedOn || item.incidentOn),
    }));

    return [...careerItems, ...dossierItems, ...affectationItems, ...disciplineItems].sort(
      (left, right) => right.timestamp - left.timestamp
    );
  }

  private matchesAgent(agentId: string, candidateLabel: string, agent: AgentDetail): boolean {
    const normalizedAgentId = this.normalizeText(agentId);
    if (normalizedAgentId && normalizedAgentId === this.normalizeText(agent.id)) {
      return true;
    }

    const normalizedCandidateLabel = this.normalizeText(candidateLabel);
    if (!normalizedCandidateLabel) {
      return false;
    }

    return [agent.fullName, agent.matricule, agent.id]
      .map((value) => this.normalizeText(value))
      .some((value) => !!value && value === normalizedCandidateLabel);
  }

  private toTimestamp(rawDate: string): number {
    const parsed = Date.parse(String(rawDate || '').trim());
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  private normalizeText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
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

    return "Opération impossible pour le moment";
  }
}
