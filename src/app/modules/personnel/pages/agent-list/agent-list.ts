import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SpkNgSelect } from '../../../../@spk/plugins/spk-ng-select/spk-ng-select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  AgentDuplicateCase,
  AgentDuplicateCaseAgentSummary,
  AgentMergeField,
  AgentMergeFieldSource,
  AgentListItem,
  AgentListQuery,
  MergeDuplicateAgentsPayload,
  PersonnelAffectation,
  PersonnelDossier,
  PersonnelService,
} from '../../personnel.service';
import { AccessControlService } from '../../../../core/security/access-control.service';

interface AgentRiskProfile {
  qualityScore: number;
  riskLevel: 'OK' | 'Moyen' | 'Critique';
  issues: string[];
  hasDossier: boolean;
  assignmentCount: number;
}

type AgentListViewItem = AgentListItem & AgentRiskProfile;
const MATRICULE_PATTERN = /^PRM-\d{4,8}$/;

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [SpkNgSelect, FormsModule, RouterLink, NgClass],
  templateUrl: './agent-list.html',
})
export class AgentListPage implements OnInit, OnDestroy {
  private personnelService = inject(PersonnelService);
  private toastr = inject(ToastrService);
  private accessControl = inject(AccessControlService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  readonly fallbackPhotoUrl = './assets/images/faces/profile.jpg';
  readonly mergeFields: AgentMergeField[] = [
    'fullName',
    'matricule',
    'email',
    'identityNumber',
    'direction',
    'unit',
    'position',
    'manager',
    'status',
    'phone',
    'contractType',
  ];
  readonly mergeFieldLabels: Record<AgentMergeField, string> = {
    fullName: 'Nom complet',
    matricule: 'Matricule',
    email: 'Email',
    identityNumber: "Piece d'identite",
    direction: 'Direction',
    unit: 'Unite',
    position: 'Poste',
    manager: 'Manager',
    status: 'Statut',
    phone: 'Telephone',
    contractType: 'Type contrat',
  };

  directions = [
    { value: 'all', label: 'Toutes les directions' },
    { value: 'Direction des Ressources Humaines', label: 'Direction des Ressources Humaines' },
    { value: 'Direction Administrative', label: 'Direction Administrative' },
  ];

  statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'Actif', label: 'Actif' },
    { value: 'En absence', label: 'En absence' },
    { value: 'Inactif', label: 'Inactif' },
  ];

  units = [
    { value: 'all', label: 'Toutes les unités' },
    { value: 'Gestion administrative', label: 'Gestion administrative' },
    { value: 'Service Paie', label: 'Service Paie' },
    { value: 'Cabinet', label: 'Cabinet' },
  ];

  contractTypes = [
    { value: 'all', label: 'Tous les contrats' },
    { value: 'Fonctionnaire', label: 'Fonctionnaire' },
    { value: 'Contractuel', label: 'Contractuel' },
    { value: 'Stagiaire', label: 'Stagiaire' },
  ];

  riskLevels = [
    { value: 'all', label: 'Tous les niveaux de risque' },
    { value: 'Critique', label: 'Risque critique' },
    { value: 'Moyen', label: 'Risque moyen' },
    { value: 'OK', label: 'Conforme' },
  ];

  selectedDirection = 'all';
  selectedStatus = 'all';
  selectedUnit = 'all';
  selectedContractType = 'all';
  selectedRiskLevel = 'all';
  searchTerm = '';
  managerTerm = '';
  positionTerm = '';
  isLoading = false;
  allAgents: AgentListViewItem[] = [];
  currentAgents: AgentListViewItem[] = [];
  kpiTotalAgents = 0;
  kpiCriticalRisk = 0;
  kpiMediumRisk = 0;
  kpiMissingManager = 0;
  kpiWithoutDossier = 0;
  loadingDuplicateCases = false;
  duplicateCases: AgentDuplicateCase[] = [];
  selectedDuplicateCase: AgentDuplicateCase | null = null;
  selectedPrimaryAgentId = '';
  selectedSecondaryAgentId = '';
  mergeReason = 'fusion_doublon';
  mergingDuplicates = false;
  canMergeDuplicates = false;
  mergeFieldSources: Record<AgentMergeField, AgentMergeFieldSource> = this.createDefaultMergeFieldSources();

  ngOnInit(): void {
    this.canMergeDuplicates = this.accessControl.hasAnyRole(['super_admin', 'hr_manager']);
    this.loadAgents();
    this.loadDuplicateCases();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
      this.searchTimer = null;
    }
  }

  onDirectionSelected(value: unknown): void {
    this.selectedDirection = this.normalizeSelectValue(value, 'all');
    this.loadAgents();
  }

  onStatusSelected(value: unknown): void {
    this.selectedStatus = this.normalizeSelectValue(value, 'all');
    this.loadAgents();
  }

  onUnitSelected(value: unknown): void {
    this.selectedUnit = this.normalizeSelectValue(value, 'all');
    this.loadAgents();
  }

  onContractTypeSelected(value: unknown): void {
    this.selectedContractType = this.normalizeSelectValue(value, 'all');
    this.loadAgents();
  }

  onRiskSelected(value: unknown): void {
    this.selectedRiskLevel = this.normalizeSelectValue(value, 'all');
    this.currentAgents = this.applyRiskFilter(this.allAgents);
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.scheduleReload();
  }

  onManagerInput(value: string): void {
    this.managerTerm = value;
    this.scheduleReload();
  }

  onPositionInput(value: string): void {
    this.positionTerm = value;
    this.scheduleReload();
  }

  private scheduleReload(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadAgents();
    }, 250);
  }

  private loadAgents(): void {
    this.isLoading = true;
    forkJoin({
      agents: this.personnelService.getAgents(this.buildQuery()),
      dossiers: this.personnelService
        .getDossiers({ page: 1, limit: 500, sortBy: 'updatedAt', sortOrder: 'desc' })
        .pipe(catchError(() => of([] as PersonnelDossier[]))),
      affectations: this.personnelService
        .getAffectations({ page: 1, limit: 500, sortBy: 'effectiveDate', sortOrder: 'desc' })
        .pipe(catchError(() => of([] as PersonnelAffectation[]))),
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ agents, dossiers, affectations }) => {
          const enriched = agents.map((agent) => this.buildRiskProfile(agent, dossiers, affectations));
          this.allAgents = enriched;
          this.currentAgents = this.applyRiskFilter(enriched);
          this.updateKpis(enriched);
        },
        error: () => {
          this.allAgents = [];
          this.currentAgents = [];
          this.updateKpis([]);
        },
      });
  }

  exportAgents(): void {
    if (!this.currentAgents.length) {
      return;
    }

    this.exportRows(`agents-${this.exportDateSuffix()}.csv`, this.currentAgents);
  }

  exportAnomalies(): void {
    const anomalies = this.allAgents.filter((item) => item.riskLevel !== 'OK');
    if (!anomalies.length) {
      return;
    }
    this.exportRows(`agents-anomalies-${this.exportDateSuffix()}.csv`, anomalies);
  }

  onPhotoError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }
    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackPhotoUrl;
  }

  loadDuplicateCases(): void {
    this.loadingDuplicateCases = true;
    this.personnelService
      .getAgentDuplicateCases({
        page: 1,
        limit: 50,
        minCount: 2,
        sortBy: 'confidenceScore',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.loadingDuplicateCases = false)))
      .subscribe({
        next: (items) => {
          this.duplicateCases = items || [];
          if (this.selectedDuplicateCase) {
            const refreshed = this.duplicateCases.find((item) => item.reference === this.selectedDuplicateCase?.reference);
            if (refreshed) {
              this.selectedDuplicateCase = refreshed;
              this.ensureValidMergeParticipants();
            } else {
              this.closeDuplicateMergeAssistant();
            }
          }
        },
        error: () => {
          this.duplicateCases = [];
        },
      });
  }

  openDuplicateMergeAssistant(item: AgentDuplicateCase): void {
    this.selectedDuplicateCase = item;
    const [first, second] = item.agents;
    this.selectedPrimaryAgentId = first?.id || '';
    this.selectedSecondaryAgentId = second?.id || '';
    this.mergeReason = 'fusion_doublon';
    this.mergeFieldSources = this.createDefaultMergeFieldSources();
    this.autoselectFieldSources();
  }

  closeDuplicateMergeAssistant(): void {
    this.selectedDuplicateCase = null;
    this.selectedPrimaryAgentId = '';
    this.selectedSecondaryAgentId = '';
    this.mergeReason = 'fusion_doublon';
    this.mergeFieldSources = this.createDefaultMergeFieldSources();
  }

  onPrimaryAgentChange(value: string): void {
    this.selectedPrimaryAgentId = String(value || '').trim();
    this.ensureValidMergeParticipants();
    this.autoselectFieldSources();
  }

  onSecondaryAgentChange(value: string): void {
    this.selectedSecondaryAgentId = String(value || '').trim();
    this.ensureValidMergeParticipants();
    this.autoselectFieldSources();
  }

  availableSecondaryCandidates(): AgentDuplicateCaseAgentSummary[] {
    const selected = this.selectedDuplicateCase;
    if (!selected) {
      return [];
    }
    return selected.agents.filter((agent) => agent.id !== this.selectedPrimaryAgentId);
  }

  currentPrimaryCandidate(): AgentDuplicateCaseAgentSummary | null {
    const selected = this.selectedDuplicateCase;
    if (!selected) {
      return null;
    }
    return selected.agents.find((agent) => agent.id === this.selectedPrimaryAgentId) || null;
  }

  currentSecondaryCandidate(): AgentDuplicateCaseAgentSummary | null {
    const selected = this.selectedDuplicateCase;
    if (!selected) {
      return null;
    }
    return selected.agents.find((agent) => agent.id === this.selectedSecondaryAgentId) || null;
  }

  executeDuplicateMerge(): void {
    if (!this.canMergeDuplicates) {
      this.toastr.warning('Role insuffisant pour executer une fusion', 'Personnel');
      return;
    }

    if (!this.selectedDuplicateCase || !this.selectedPrimaryAgentId || !this.selectedSecondaryAgentId) {
      this.toastr.warning('Selection fusion incomplete', 'Personnel');
      return;
    }

    if (this.selectedPrimaryAgentId === this.selectedSecondaryAgentId) {
      this.toastr.warning('Les agents a fusionner doivent etre differents', 'Personnel');
      return;
    }

    const payload: MergeDuplicateAgentsPayload = {
      reference: this.selectedDuplicateCase.reference,
      primaryAgentId: this.selectedPrimaryAgentId,
      secondaryAgentId: this.selectedSecondaryAgentId,
      fieldSources: { ...this.mergeFieldSources },
      reason: this.mergeReason.trim() || 'fusion_doublon',
    };

    this.mergingDuplicates = true;
    this.personnelService
      .mergeDuplicateAgents(payload)
      .pipe(finalize(() => (this.mergingDuplicates = false)))
      .subscribe({
        next: (result) => {
          this.toastr.success(
            `Fusion terminee. Dossiers reassignes: ${result.reassignedDossiers}, affectations: ${result.reassignedAffectations}.`,
            'Personnel'
          );
          this.closeDuplicateMergeAssistant();
          this.loadAgents();
          this.loadDuplicateCases();
        },
        error: () => {
          this.toastr.error('Echec de la fusion des doublons', 'Personnel');
        },
      });
  }

  duplicateFieldLabel(field: AgentDuplicateCase['duplicateField']): string {
    if (field === 'email') return 'Email';
    if (field === 'identityNumber') return "Piece d'identite";
    return 'Nom complet';
  }

  duplicateCaseBadgeClass(item: AgentDuplicateCase): string {
    if (item.confidenceScore >= 95) {
      return 'bg-danger-transparent text-danger';
    }
    if (item.confidenceScore >= 80) {
      return 'bg-warning-transparent text-warning';
    }
    return 'bg-info-transparent text-info';
  }

  mergeFieldPreviewValue(field: AgentMergeField, source: AgentMergeFieldSource): string {
    const primary = this.currentPrimaryCandidate();
    const secondary = this.currentSecondaryCandidate();
    if (!primary || !secondary) {
      return '—';
    }
    const sourceCandidate = source === 'secondary' ? secondary : primary;
    const fallbackCandidate = source === 'secondary' ? primary : secondary;
    const preferred = this.readMergeField(sourceCandidate, field);
    const fallback = this.readMergeField(fallbackCandidate, field);
    return preferred || fallback || '—';
  }

  mergeSourceFor(field: AgentMergeField): AgentMergeFieldSource {
    return this.mergeFieldSources[field] || 'primary';
  }

  setMergeSource(field: AgentMergeField, value: AgentMergeFieldSource | string): void {
    this.mergeFieldSources[field] = value === 'secondary' ? 'secondary' : 'primary';
  }

  private buildQuery(): AgentListQuery {
    return {
      q: this.searchTerm,
      direction: this.selectedDirection === 'all' ? undefined : this.selectedDirection,
      status: this.selectedStatus === 'all' ? undefined : this.selectedStatus,
      unit: this.selectedUnit === 'all' ? undefined : this.selectedUnit,
      manager: this.managerTerm.trim() || undefined,
      position: this.positionTerm.trim() || undefined,
      contractType: this.selectedContractType === 'all' ? undefined : this.selectedContractType,
      page: 1,
      limit: 200,
      sortBy: 'fullName',
      sortOrder: 'asc',
    };
  }

  private buildRiskProfile(
    agent: AgentListItem,
    dossiers: PersonnelDossier[],
    affectations: PersonnelAffectation[]
  ): AgentListViewItem {
    const linkedDossiers = dossiers.filter((item) => this.matchesAgent(item.agent, agent));
    const linkedAffectations = affectations.filter((item) => this.matchesAgent(item.agent, agent));

    const checks: Array<{
      ok: boolean;
      severity: 'critical' | 'warning';
      issue: string;
    }> = [
      {
        ok: String(agent.fullName || '').trim().length >= 3,
        severity: 'critical',
        issue: 'Nom complet incomplet',
      },
      {
        ok: MATRICULE_PATTERN.test(String(agent.matricule || '').trim()),
        severity: 'critical',
        issue: 'Matricule non conforme',
      },
      {
        ok: String(agent.unit || '').trim().length > 0,
        severity: 'critical',
        issue: 'Unité non renseignée',
      },
      {
        ok: String(agent.manager || '').trim().length >= 3,
        severity: 'warning',
        issue: 'Manager manquant',
      },
      {
        ok: String(agent.contractType || '').trim().length > 0,
        severity: 'warning',
        issue: 'Type de contrat manquant',
      },
      {
        ok: linkedDossiers.length > 0,
        severity: 'warning',
        issue: 'Aucun dossier administratif lié',
      },
      {
        ok: linkedAffectations.length > 0,
        severity: 'warning',
        issue: 'Aucune affectation historisée',
      },
    ];

    const totalChecks = checks.length;
    const passedChecks = checks.filter((check) => check.ok).length;
    const qualityScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
    const hasCriticalIssue = checks.some((check) => !check.ok && check.severity === 'critical');
    const riskLevel: AgentRiskProfile['riskLevel'] = hasCriticalIssue
      ? 'Critique'
      : qualityScore < 85
        ? 'Moyen'
        : 'OK';

    return {
      ...agent,
      qualityScore,
      riskLevel,
      issues: checks.filter((check) => !check.ok).map((check) => check.issue),
      hasDossier: linkedDossiers.length > 0,
      assignmentCount: linkedAffectations.length,
    };
  }

  private matchesAgent(candidate: string, agent: AgentListItem): boolean {
    const normalizedCandidate = this.normalizeText(candidate);
    if (!normalizedCandidate) {
      return false;
    }
    const aliases = [agent.id, agent.matricule, agent.fullName]
      .map((value) => this.normalizeText(value))
      .filter((value) => !!value);
    return aliases.some((alias) => normalizedCandidate.includes(alias) || alias.includes(normalizedCandidate));
  }

  private normalizeText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private applyRiskFilter(items: AgentListViewItem[]): AgentListViewItem[] {
    if (this.selectedRiskLevel === 'all') {
      return [...items];
    }
    return items.filter((item) => item.riskLevel === this.selectedRiskLevel);
  }

  private updateKpis(items: AgentListViewItem[]): void {
    this.kpiTotalAgents = items.length;
    this.kpiCriticalRisk = items.filter((item) => item.riskLevel === 'Critique').length;
    this.kpiMediumRisk = items.filter((item) => item.riskLevel === 'Moyen').length;
    this.kpiMissingManager = items.filter((item) => String(item.manager || '').trim().length < 3).length;
    this.kpiWithoutDossier = items.filter((item) => !item.hasDossier).length;
  }

  riskBadgeClass(level: AgentRiskProfile['riskLevel']): string {
    if (level === 'Critique') return 'bg-danger-transparent text-danger';
    if (level === 'Moyen') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  private exportRows(filename: string, rows: AgentListViewItem[]): void {
    downloadCsv({
      filename,
      headers: [
        'Matricule',
        'Nom complet',
        'Direction',
        'Unite',
        'Poste',
        'Contrat',
        'Statut',
        'Manager',
        'QualiteScore',
        'NiveauRisque',
        'Anomalies',
      ],
      rows: rows.map((agent) => [
        agent.matricule,
        agent.fullName,
        agent.direction,
        agent.unit,
        agent.position,
        agent.contractType,
        agent.status,
        agent.manager,
        String(agent.qualityScore),
        agent.riskLevel,
        agent.issues.join(' | '),
      ]),
      delimiter: ';',
    });
  }

  private normalizeSelectValue(value: unknown, fallback: string): string {
    if (typeof value === 'string') {
      return value || fallback;
    }

    if (typeof value === 'object' && value !== null && 'value' in value) {
      const nested = (value as { value?: unknown }).value;
      if (typeof nested === 'string' && nested.length > 0) {
        return nested;
      }
    }

    return fallback;
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  }

  private createDefaultMergeFieldSources(): Record<AgentMergeField, AgentMergeFieldSource> {
    return {
      matricule: 'primary',
      fullName: 'primary',
      direction: 'primary',
      unit: 'primary',
      position: 'primary',
      status: 'primary',
      manager: 'primary',
      email: 'primary',
      phone: 'primary',
      identityNumber: 'primary',
      contractType: 'primary',
    };
  }

  private ensureValidMergeParticipants(): void {
    if (!this.selectedDuplicateCase) {
      return;
    }

    const candidateIds = this.selectedDuplicateCase.agents.map((agent) => agent.id);
    if (!candidateIds.includes(this.selectedPrimaryAgentId)) {
      this.selectedPrimaryAgentId = candidateIds[0] || '';
    }

    const secondaryCandidates = candidateIds.filter((id) => id !== this.selectedPrimaryAgentId);
    if (!secondaryCandidates.length) {
      this.selectedSecondaryAgentId = '';
      return;
    }

    if (
      !this.selectedSecondaryAgentId ||
      this.selectedSecondaryAgentId === this.selectedPrimaryAgentId ||
      !secondaryCandidates.includes(this.selectedSecondaryAgentId)
    ) {
      this.selectedSecondaryAgentId = secondaryCandidates[0];
    }
  }

  private autoselectFieldSources(): void {
    const primary = this.currentPrimaryCandidate();
    const secondary = this.currentSecondaryCandidate();
    if (!primary || !secondary) {
      return;
    }

    this.mergeFields.forEach((field) => {
      const primaryValue = this.readMergeField(primary, field);
      const secondaryValue = this.readMergeField(secondary, field);
      if (!primaryValue && secondaryValue) {
        this.mergeFieldSources[field] = 'secondary';
      } else {
        this.mergeFieldSources[field] = 'primary';
      }
    });
  }

  private readMergeField(candidate: AgentDuplicateCaseAgentSummary, field: AgentMergeField): string {
    switch (field) {
      case 'identityNumber':
        return String(candidate.identityNumber || '').trim();
      case 'contractType':
        return String(candidate.contractType || '').trim();
      case 'matricule':
        return String(candidate.matricule || '').trim();
      case 'fullName':
        return String(candidate.fullName || '').trim();
      case 'direction':
        return String(candidate.direction || '').trim();
      case 'unit':
        return String(candidate.unit || '').trim();
      case 'position':
        return String(candidate.position || '').trim();
      case 'status':
        return String(candidate.status || '').trim();
      case 'manager':
        return String(candidate.manager || '').trim();
      case 'email':
        return String(candidate.email || '').trim();
      case 'phone':
        return String(candidate.phone || '').trim();
      default:
        return '';
    }
  }
}
