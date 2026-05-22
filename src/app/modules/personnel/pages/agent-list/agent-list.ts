import { NgClass } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SpkNgSelect } from '../../../../@spk/plugins/spk-ng-select/spk-ng-select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  downloadPdf,
  downloadXlsx,
  type ExportCell,
} from '../../../../core/utils/table-export.utils';
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
import {
  AgentDocumentComplianceSummary,
  summarizeDocumentCompliance,
} from '../../personnel-document-compliance';
import { AccessControlService } from '../../../../core/security/access-control.service';

interface AgentHrDeadline {
  label: string;
  dueDate: string;
  severity: 'Critique' | 'Moyen' | 'Info';
  overdue: boolean;
  daysRemaining: number | null;
}

interface AgentRiskProfile {
  qualityScore: number;
  riskLevel: 'OK' | 'Moyen' | 'Critique';
  issues: string[];
  hasDossier: boolean;
  assignmentCount: number;
  documentSummary: AgentDocumentComplianceSummary;
  nextDeadline: AgentHrDeadline | null;
  deadlineCount: number;
  hasDocumentData: boolean;
}

type AgentListViewItem = AgentListItem & AgentRiskProfile;
type AgentExportDataset = 'filtered' | 'anomalies' | 'all';
type AgentExportFormat = 'csv' | 'xlsx' | 'pdf';
const MATRICULE_PATTERN = /^PRM-\d{4,8}$/;

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [SpkNgSelect, FormsModule, RouterLink, NgClass, NgbDropdownModule],
  styleUrls: ['./agent-list.scss'],
  templateUrl: './agent-list.html',
})
export class AgentListPage implements OnInit, OnDestroy {
  private personnelService = inject(PersonnelService);
  private toastr = inject(ToastrService);
  private accessControl = inject(AccessControlService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly fallbackPhoto = './assets/images/faces/profile.jpg';
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
  ];

  statuses = [
    { value: 'all', label: 'Tous les statuts' },
  ];

  units = [
    { value: 'all', label: 'Toutes les unités' },
  ];

  contractTypes = [
    { value: 'all', label: 'Tous les contrats' },
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
  pageIndex = 1;
  pageSize = 10;
  readonly pageSizeOptions = [10, 25, 50, 100];
  // Sections repliées par défaut pour laisser la liste visible sans défilement.
  showFilters = false;
  showDuplicates = false;
  kpiTotalAgents = 0;
  kpiCriticalRisk = 0;
  kpiMediumRisk = 0;
  kpiMissingManager = 0;
  kpiWithoutDossier = 0;
  kpiCriticalDocuments = 0;
  kpiDeadlinesThisWeek = 0;
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
    this.loadFilterCatalog();
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
    this.pageIndex = 1;
    this.loadAgents();
  }

  onStatusSelected(value: unknown): void {
    this.selectedStatus = this.normalizeSelectValue(value, 'all');
    this.pageIndex = 1;
    this.loadAgents();
  }

  onUnitSelected(value: unknown): void {
    this.selectedUnit = this.normalizeSelectValue(value, 'all');
    this.pageIndex = 1;
    this.loadAgents();
  }

  onContractTypeSelected(value: unknown): void {
    this.selectedContractType = this.normalizeSelectValue(value, 'all');
    this.pageIndex = 1;
    this.loadAgents();
  }

  onRiskSelected(value: unknown): void {
    this.selectedRiskLevel = this.normalizeSelectValue(value, 'all');
    this.pageIndex = 1;
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

  resetFilters(): void {
    this.selectedDirection = 'all';
    this.selectedStatus = 'all';
    this.selectedUnit = 'all';
    this.selectedContractType = 'all';
    this.selectedRiskLevel = 'all';
    this.searchTerm = '';
    this.managerTerm = '';
    this.positionTerm = '';
    this.pageIndex = 1;
    this.loadAgents();
  }

  /** Nombre de filtres avancés actifs — affiché sur le bouton quand ils sont repliés. */
  activeFilterCount(): number {
    let count = 0;
    if (this.selectedDirection !== 'all') count += 1;
    if (this.selectedStatus !== 'all') count += 1;
    if (this.selectedUnit !== 'all') count += 1;
    if (this.selectedContractType !== 'all') count += 1;
    if (this.selectedRiskLevel !== 'all') count += 1;
    if (this.positionTerm.trim()) count += 1;
    if (this.managerTerm.trim()) count += 1;
    return count;
  }

  agentPhoto(agent: AgentListViewItem): string {
    return String(agent.photoUrl || '').trim() || this.fallbackPhoto;
  }

  documentSummaryLabel(agent: AgentListViewItem): string {
    if (!agent.hasDocumentData) {
      return 'Non calculé';
    }

    const { documentSummary } = agent;
    if (!documentSummary.hasAlerts) {
      return `${documentSummary.compliantCount}/${documentSummary.requiredCount} conformes`;
    }

    const parts: string[] = [];
    if (documentSummary.missingCount > 0) {
      parts.push(`${documentSummary.missingCount} manq.`);
    }
    if (documentSummary.expiredCount > 0) {
      parts.push(`${documentSummary.expiredCount} expir.`);
    }
    if (documentSummary.expiringSoonCount > 0) {
      parts.push(`${documentSummary.expiringSoonCount} à renouv.`);
    }
    return parts.join(' · ');
  }

  documentBadgeClass(agent: AgentListViewItem): string {
    if (!agent.hasDocumentData) return 'bg-light text-muted';
    if (agent.documentSummary.missingCount > 0 || agent.documentSummary.expiredCount > 0) {
      return 'bg-danger-transparent text-danger';
    }
    if (agent.documentSummary.expiringSoonCount > 0) {
      return 'bg-warning-transparent text-warning';
    }
    return 'bg-success-transparent text-success';
  }

  documentSummaryTooltip(agent: AgentListViewItem): string {
    if (!agent.hasDocumentData) {
      return 'Synthèse documentaire indisponible depuis la source.';
    }
    return agent.documentSummary.alertMessages.join(' | ') || 'Toutes les pièces obligatoires sont conformes.';
  }

  deadlineBadgeClass(deadline: AgentHrDeadline | null): string {
    if (!deadline) return 'bg-success-transparent text-success';
    if (deadline.severity === 'Critique') return 'bg-danger-transparent text-danger';
    if (deadline.severity === 'Moyen') return 'bg-warning-transparent text-warning';
    return 'bg-info-transparent text-info';
  }

  deadlineDueLabel(deadline: AgentHrDeadline | null): string {
    if (!deadline) {
      return 'Aucune échéance';
    }
    if (!deadline.dueDate) {
      return 'À planifier';
    }
    if (deadline.overdue) {
      return `En retard depuis ${deadline.dueDate}`;
    }
    if (deadline.daysRemaining === 0) {
      return `À traiter aujourd'hui (${deadline.dueDate})`;
    }
    if (deadline.daysRemaining !== null) {
      return `J-${deadline.daysRemaining} (${deadline.dueDate})`;
    }
    return deadline.dueDate;
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
          this.goToPage(this.pageIndex);
          this.updateKpis(enriched);
        },
        error: () => {
          this.allAgents = [];
          this.currentAgents = [];
          this.updateKpis([]);
        },
      });
  }

  private loadFilterCatalog(): void {
    this.personnelService
      .getAgents({
        page: 1,
        limit: 500,
        sortBy: 'fullName',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (agents) => {
          this.directions = this.buildFilterOptions(agents.map((agent) => agent.direction), 'Toutes les directions');
          this.statuses = this.buildFilterOptions(agents.map((agent) => agent.status), 'Tous les statuts');
          this.units = this.buildFilterOptions(agents.map((agent) => agent.unit), 'Toutes les unités');
          this.contractTypes = this.buildFilterOptions(agents.map((agent) => agent.contractType), 'Tous les contrats');
        },
      });
  }

  private buildFilterOptions(values: string[], allLabel: string): Array<{ value: string; label: string }> {
    const uniqueValues = Array.from(
      new Set(
        (values || [])
          .map((value) => String(value || '').trim())
          .filter((value) => !!value)
      )
    ).sort((left, right) => left.localeCompare(right, 'fr', { sensitivity: 'base' }));

    return [{ value: 'all', label: allLabel }, ...uniqueValues.map((value) => ({ value, label: value }))];
  }

  /** Nombre d'agents en anomalie (risque ≠ OK) — pilote l'état des boutons. */
  get anomaliesCount(): number {
    return this.allAgents.filter((item) => item.riskLevel !== 'OK').length;
  }

  /** Exporte un jeu de données d'agents dans le format demandé. */
  exportData(dataset: AgentExportDataset, format: AgentExportFormat): void {
    const rows = this.exportDatasetRows(dataset);
    if (!rows.length) {
      this.toastr.info('Aucune donnée à exporter pour cette sélection.');
      return;
    }

    const table = this.buildExportTable(rows);
    const base = `agents-${dataset}-${this.exportDateSuffix()}`;

    if (format === 'csv') {
      downloadCsv({
        filename: `${base}.csv`,
        headers: table.headers,
        rows: table.rows,
        delimiter: ';',
      });
    } else if (format === 'xlsx') {
      downloadXlsx({
        filename: `${base}.xlsx`,
        headers: table.headers,
        rows: table.rows,
        sheetName: 'Agents',
      });
    } else {
      downloadPdf({
        filename: `${base}.pdf`,
        headers: table.headers,
        rows: table.rows,
        title: this.exportDatasetLabel(dataset),
      });
    }
  }

  private exportDatasetRows(dataset: AgentExportDataset): AgentListViewItem[] {
    if (dataset === 'anomalies') {
      return this.allAgents.filter((item) => item.riskLevel !== 'OK');
    }
    if (dataset === 'all') {
      return this.allAgents;
    }
    return this.currentAgents;
  }

  private exportDatasetLabel(dataset: AgentExportDataset): string {
    if (dataset === 'anomalies') return 'Agents en anomalie';
    if (dataset === 'all') return "Tout l'effectif";
    return 'Liste filtrée des agents';
  }

  onPhotoError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image || image.dataset['fallbackApplied'] === 'true') {
      return;
    }
    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackPhoto;
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
    const linkedDossiers = dossiers.filter((item) => this.matchesAgent(item.agentId, item.agent, agent));
    const linkedAffectations = affectations.filter((item) => this.matchesAgent(item.agentId, item.agent, agent));
    const hasDocumentData =
      Array.isArray(agent.documents) &&
      (agent.documents.length > 0 ||
        !!String(agent.contractType || '').trim() ||
        !!String(agent.hireDate || '').trim());
    const documentSummary = hasDocumentData
      ? summarizeDocumentCompliance(agent.documents || [], agent.contractType || '')
      : this.emptyDocumentSummary();
    const deadlines = this.buildHrDeadlines(agent, linkedDossiers.length, linkedAffectations.length, documentSummary);
    const nextDeadline = deadlines[0] || null;

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
      ...(hasDocumentData
        ? [
            {
              ok: documentSummary.missingCount === 0,
              severity: 'critical' as const,
              issue:
                documentSummary.missingCount > 0
                  ? `${documentSummary.missingCount} pièce(s) obligatoire(s) manquante(s)`
                  : 'Pièces obligatoires présentes',
            },
            {
              ok: documentSummary.expiredCount === 0,
              severity: 'critical' as const,
              issue:
                documentSummary.expiredCount > 0
                  ? `${documentSummary.expiredCount} pièce(s) expirée(s)`
                  : 'Aucune pièce expirée',
            },
          ]
        : []),
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
      ...(hasDocumentData
        ? [
            {
              ok: documentSummary.expiringSoonCount === 0,
              severity: 'warning' as const,
              issue:
                documentSummary.expiringSoonCount > 0
                  ? `${documentSummary.expiringSoonCount} pièce(s) à renouveler sous 30 jours`
                  : 'Aucune pièce à renouveler',
            },
          ]
        : []),
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
      documentSummary,
      nextDeadline,
      deadlineCount: deadlines.length,
      hasDocumentData,
    };
  }

  private emptyDocumentSummary(): AgentDocumentComplianceSummary {
    return {
      items: [],
      requiredCount: 0,
      compliantCount: 0,
      missingCount: 0,
      expiredCount: 0,
      expiringSoonCount: 0,
      hasAlerts: false,
      alertMessages: [],
    };
  }

  private buildHrDeadlines(
    agent: AgentListItem,
    dossierCount: number,
    affectationCount: number,
    documentSummary: AgentDocumentComplianceSummary
  ): AgentHrDeadline[] {
    const deadlines: AgentHrDeadline[] = [];

    documentSummary.items
      .filter((item) => item.required && item.status !== 'conforme')
      .forEach((item) => {
        const dueDate = this.normalizeIsoDate(item.document?.expiresAt) || this.todayIsoDate();
        deadlines.push(
          this.createDeadline(
            item.status === 'manquant' ? `Téléverser ${item.label}` : `Régulariser ${item.label}`,
            dueDate,
            item.status === 'a_renouveler' ? 'Moyen' : 'Critique'
          )
        );
      });

    const hireDate = this.normalizeIsoDate(agent.hireDate);
    if (dossierCount === 0 && hireDate) {
      deadlines.push(
        this.createDeadline(
          'Compléter le dossier administratif',
          this.addDaysToIsoDate(hireDate, 7),
          'Moyen'
        )
      );
    }

    if (affectationCount === 0 && hireDate) {
      deadlines.push(
        this.createDeadline(
          'Historiser la première affectation',
          this.addDaysToIsoDate(hireDate, 3),
          'Moyen'
        )
      );
    }

    // Départ à la retraite — alerte dès que l'échéance est à moins d'un an.
    const retirementDate = this.normalizeIsoDate(agent.retirementDate);
    if (retirementDate) {
      const daysToRetirement = this.daysUntilIsoDate(retirementDate);
      if (daysToRetirement !== null && daysToRetirement <= 365) {
        deadlines.push(
          this.createDeadline(
            'Départ à la retraite',
            retirementDate,
            daysToRetirement <= 90 ? 'Critique' : 'Moyen'
          )
        );
      }
    }

    // Fin de contrat — alerte à moins de 6 mois (décision renouvellement / libération).
    const contractEndDate = this.normalizeIsoDate(agent.contractEndDate);
    if (contractEndDate) {
      const daysToContractEnd = this.daysUntilIsoDate(contractEndDate);
      if (daysToContractEnd !== null && daysToContractEnd <= 180) {
        deadlines.push(
          this.createDeadline(
            'Fin de contrat',
            contractEndDate,
            daysToContractEnd <= 60 ? 'Critique' : 'Moyen'
          )
        );
      }
    }

    return deadlines.sort((left, right) => {
      // Les départs (retraite, fin de contrat) priment : ce sont des échéances
      // métier dures, prioritaires sur les rappels de qualité de données.
      const leftDeparture = this.isDepartureDeadline(left.label);
      const rightDeparture = this.isDepartureDeadline(right.label);
      if (leftDeparture !== rightDeparture) {
        return leftDeparture ? -1 : 1;
      }
      const severityGap = this.deadlineSeverityRank(left.severity) - this.deadlineSeverityRank(right.severity);
      if (severityGap !== 0) {
        return severityGap;
      }
      const leftTime = Date.parse(left.dueDate || '') || Number.MAX_SAFE_INTEGER;
      const rightTime = Date.parse(right.dueDate || '') || Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    });
  }

  private isDepartureDeadline(label: string): boolean {
    return label === 'Départ à la retraite' || label === 'Fin de contrat';
  }

  private createDeadline(label: string, dueDate: string, severity: AgentHrDeadline['severity']): AgentHrDeadline {
    const normalizedDueDate = this.normalizeIsoDate(dueDate) || dueDate;
    const parsed = Date.parse(normalizedDueDate || '');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = Number.isNaN(parsed) ? null : new Date(parsed);
    if (due) {
      due.setHours(0, 0, 0, 0);
    }
    const daysRemaining = due ? Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)) : null;
    const overdue = daysRemaining !== null && daysRemaining < 0;

    return {
      label,
      dueDate: normalizedDueDate || '',
      severity: overdue && severity !== 'Info' ? 'Critique' : severity,
      overdue,
      daysRemaining,
    };
  }

  private daysUntilIsoDate(isoDate: string): number | null {
    const parsed = Date.parse(this.normalizeIsoDate(isoDate) || isoDate);
    if (Number.isNaN(parsed)) {
      return null;
    }
    const due = new Date(parsed);
    due.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  }

  private deadlineSeverityRank(severity: AgentHrDeadline['severity']): number {
    if (severity === 'Critique') return 0;
    if (severity === 'Moyen') return 1;
    return 2;
  }

  private normalizeIsoDate(value: string | undefined): string {
    const raw = String(value || '').trim();
    if (!raw) {
      return '';
    }
    const parsed = Date.parse(raw);
    if (Number.isNaN(parsed)) {
      return raw;
    }
    return new Date(parsed).toISOString().slice(0, 10);
  }

  private addDaysToIsoDate(value: string, days: number): string {
    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
      return this.todayIsoDate();
    }
    const date = new Date(parsed);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  private todayIsoDate(): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 10);
  }

  private matchesAgent(agentId: string, candidateLabel: string, agent: AgentListItem): boolean {
    const normalizedAgentId = this.normalizeText(agentId);
    if (normalizedAgentId && normalizedAgentId === this.normalizeText(agent.id)) {
      return true;
    }

    const normalizedCandidateLabel = this.normalizeText(candidateLabel);
    if (!normalizedCandidateLabel) {
      return false;
    }

    return [agent.id, agent.matricule, agent.fullName]
      .map((value) => this.normalizeText(value))
      .some((value) => !!value && value === normalizedCandidateLabel);
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

  displayedAgents(): AgentListViewItem[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.currentAgents.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.currentAgents.length / this.pageSize));
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    this.pageIndex = Math.min(Math.max(1, page), total);
  }

  changePageSize(value: string | number): void {
    const numeric = Number(value) || 25;
    this.pageSize = this.pageSizeOptions.includes(numeric) ? numeric : 25;
    this.pageIndex = 1;
  }

  private updateKpis(items: AgentListViewItem[]): void {
    this.kpiTotalAgents = items.length;
    this.kpiCriticalRisk = items.filter((item) => item.riskLevel === 'Critique').length;
    this.kpiMediumRisk = items.filter((item) => item.riskLevel === 'Moyen').length;
    this.kpiMissingManager = items.filter((item) => String(item.manager || '').trim().length < 3).length;
    this.kpiWithoutDossier = items.filter((item) => !item.hasDossier).length;
    this.kpiCriticalDocuments = items.filter(
      (item) => item.hasDocumentData && (item.documentSummary.missingCount > 0 || item.documentSummary.expiredCount > 0)
    ).length;
    this.kpiDeadlinesThisWeek = items.filter(
      (item) => !!item.nextDeadline && item.nextDeadline.daysRemaining !== null && item.nextDeadline.daysRemaining <= 7
    ).length;
  }

  riskBadgeClass(level: AgentRiskProfile['riskLevel']): string {
    if (level === 'Critique') return 'bg-danger-transparent text-danger';
    if (level === 'Moyen') return 'bg-warning-transparent text-warning';
    return 'bg-success-transparent text-success';
  }

  private buildExportTable(rows: AgentListViewItem[]): {
    headers: string[];
    rows: ExportCell[][];
  } {
    return {
      headers: [
        'Matricule',
        'Nom complet',
        'Direction',
        'Unite',
        'Poste',
        'Contrat',
        'Statut',
        'Manager',
        'Documents',
        'EcheanceRH',
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
        this.documentSummaryLabel(agent),
        agent.nextDeadline
          ? `${agent.nextDeadline.label} (${this.deadlineDueLabel(agent.nextDeadline)})`
          : 'Aucune',
        String(agent.qualityScore),
        agent.riskLevel,
        agent.issues.join(' | '),
      ]),
    };
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
