import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { finalize, forkJoin, of } from 'rxjs';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { ActivatedRoute } from '@angular/router';
import {
  AgentAuditEvent,
  AgentCareerEvent,
  AgentDetail,
  AgentDocument,
  AgentEducation,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
  UpdateAgentPayload,
} from '../../personnel.service';

const PHONE_PATTERN = /^[+\d\s().-]{7,20}$/;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MATRICULE_PATTERN = /^PRM-\d{4,8}$/;

interface AgentQualityReport {
  score: number;
  completedChecks: number;
  totalChecks: number;
  criticalIssues: string[];
  warnings: string[];
  strengths: string[];
}

interface AgentTimelineItem {
  type: 'Carriere' | 'Dossier' | 'Affectation';
  title: string;
  description: string;
  date: string;
  status: string;
  timestamp: number;
}

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgbNavModule, SpkReusableTables],
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
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
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
    careerEvents: [],
    documents: [],
  };

  careerEvents: AgentCareerEvent[] = [];
  documents: AgentDocument[] = [];
  educations: AgentEducation[] = [];
  dossiers: PersonnelDossier[] = [];
  affectations: PersonnelAffectation[] = [];
  auditTrail: AgentAuditEvent[] = [];
  timeline360: AgentTimelineItem[] = [];
  qualityReport: AgentQualityReport = {
    score: 0,
    completedChecks: 0,
    totalChecks: 0,
    criticalIssues: [],
    warnings: [],
    strengths: [],
  };
  editMode = false;
  saving = false;
  uploadingPhoto = false;
  loadingContext = false;
  loadingAuditTrail = false;
  photoPreview = this.fallbackPhoto;
  selectedPhotoFileName = '';

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
      this.editMode = true;
      return;
    }

    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.patchFormFromAgent(this.agent);
    this.selectedPhotoFileName = '';
    this.form.patchValue({ auditReason: '' });
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

  save(): void {
    if (this.saving || this.uploadingPhoto) {
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

  private applyAgentDetails(details: AgentDetail): void {
    this.agent = details;
    this.careerEvents = details.careerEvents || [];
    this.documents = details.documents || [];
    this.educations = details.educations || [];
    this.loadAgentContext(details);
    this.patchFormFromAgent(details);
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
      careerEvents: this.careerEvents.map((item) => ({ ...item })),
      documents: this.documents.map((item) => ({ ...item })),
      auditReason: auditReason || undefined,
    };
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

  private loadAgentContext(agent: AgentDetail): void {
    this.loadingContext = true;
    this.loadingAuditTrail = true;
    const agentFilter = agent.fullName || agent.matricule || agent.id;
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
        .getDossiers({ page: 1, limit: 400, sortBy: 'updatedAt', sortOrder: 'desc', agent: agentFilter })
        .pipe(finalize(() => void 0)),
      affectations: this.personnelService
        .getAffectations({ page: 1, limit: 400, sortBy: 'effectiveDate', sortOrder: 'desc', agent: agentFilter })
        .pipe(finalize(() => void 0)),
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
          this.dossiers = context.dossiers.filter((item) => this.matchesAgent(item.agent, agent));
          this.affectations = context.affectations.filter((item) => this.matchesAgent(item.agent, agent));
          this.auditTrail = context.auditTrail;
          this.timeline360 = this.buildTimeline(agent, this.dossiers, this.affectations);
          this.qualityReport = this.buildQualityReport(agent, this.dossiers, this.affectations);
        },
        error: () => {
          this.dossiers = [];
          this.affectations = [];
          this.auditTrail = [];
          this.timeline360 = this.buildTimeline(agent, [], []);
          this.qualityReport = this.buildQualityReport(agent, [], []);
        },
      });
  }

  private buildQualityReport(
    agent: AgentDetail,
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[]
  ): AgentQualityReport {
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
        ok: this.hasRequiredDocuments(agent.documents || []),
        severity: 'critical',
        successLabel: 'Documents obligatoires présents',
        failureLabel: 'Documents obligatoires incomplets',
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
    };
  }

  private hasRequiredDocuments(documents: AgentDocument[]): boolean {
    const requiredTypes = [
      "piece d'identite (cni/passeport)",
      'cv',
      'diplome principal',
      'acte/arrete de nomination',
      'contrat',
    ];
    const normalizedDocumentTypes = new Set(
      documents
        .map((item) => this.normalizeText(item.type))
        .filter((item) => !!item)
    );
    return requiredTypes.every((type) => normalizedDocumentTypes.has(type));
  }

  private buildTimeline(
    agent: AgentDetail,
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[]
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

    return [...careerItems, ...dossierItems, ...affectationItems].sort((left, right) => right.timestamp - left.timestamp);
  }

  private matchesAgent(candidate: string, agent: AgentDetail): boolean {
    const normalizedCandidate = this.normalizeText(candidate);
    if (!normalizedCandidate) {
      return false;
    }
    const possibleMatches = [agent.fullName, agent.matricule, agent.id]
      .map((value) => this.normalizeText(value))
      .filter((value) => !!value);
    return possibleMatches.some((value) => normalizedCandidate.includes(value) || value.includes(normalizedCandidate));
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
