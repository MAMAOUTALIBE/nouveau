import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, firstValueFrom } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  buildSimulationLabel,
  cloneOrgUnits,
  computeReorgChanges,
  ReorgChange,
  ReorgSnapshot,
  ReorgSnapshotStatus,
} from './org-chart-reorg.utils';
import {
  CreateOrgUnitPayload,
  OrgUnit,
  OrgUnitsQuery,
  OrganizationService,
  UpdateOrgUnitPayload,
  VacantPosition,
} from '../../organization.service';
import {
  OrgTreeNode,
  buildOrgTree,
  collectCollapsibleNodeIds,
  collectDescendantIds,
  flattenOrgTree,
  summarizeOrgUnits,
} from './org-chart.utils';
import { WorkflowDefinition, WorkflowsService } from '../../../workflows/workflows.service';

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './org-chart.html',
})
export class OrgChartPage implements OnInit {
  private readonly reorgSnapshotsKey = 'rh_org_reorg_snapshots';
  private fb = inject(FormBuilder);
  private organizationService = inject(OrganizationService);
  private workflowsService = inject(WorkflowsService);
  private toastr = inject(ToastrService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  units: OrgUnit[] = [];
  allUnits: OrgUnit[] = [];
  roots: OrgTreeNode[] = [];
  totalUnits = 0;
  totalStaff = 0;
  showCreateForm = false;
  submitting = false;
  updating = false;
  loading = false;
  loadError: string | null = null;
  collapsedNodeIds = new Set<string>();
  selectedUnitId: string | null = null;
  selectedUnit: OrgUnit | null = null;
  selectedVacancyCount = 0;

  isSimulationMode = false;
  isSubmittingSimulation = false;
  simulationBaseUnits: OrgUnit[] = [];
  simulationUnits: OrgUnit[] = [];
  simulationChanges: ReorgChange[] = [];
  activeSimulationSnapshotId: string | null = null;

  snapshots: ReorgSnapshot[] = [];
  snapshotActionId: string | null = null;

  private vacancyByStructure = new Map<string, number>();

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    parentId: [''],
    head: ['', [Validators.maxLength(120)]],
    headTitle: ['', [Validators.maxLength(120)]],
    staffCount: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
  });

  filterForm = this.fb.group({
    q: [''],
    head: [''],
    parentId: [''],
  });

  editForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    parentId: [''],
    head: ['', [Validators.maxLength(120)]],
    headTitle: ['', [Validators.maxLength(120)]],
    staffCount: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
  });

  get availableParentUnits(): OrgUnit[] {
    const source = this.allUnits.length ? this.allUnits : this.units;
    if (!this.selectedUnitId) {
      return source;
    }

    const descendants = collectDescendantIds(buildOrgTree(source), this.selectedUnitId);
    return source.filter((unit) => unit.id !== this.selectedUnitId && !descendants.has(unit.id));
  }

  ngOnInit(): void {
    this.restoreStateFromQueryParams();
    this.loadSnapshots();
    this.loadFilterOptions();
    this.loadVacancyCounts();
    this.loadUnits();
  }

  fieldError(fieldName: string, mode: 'create' | 'edit' = 'create'): string | null {
    const control = (mode === 'create' ? this.form : this.editForm).get(fieldName);
    if (!control || !control.touched || !control.errors) {
      return null;
    }

    if (control.errors['required']) return 'Champ obligatoire';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.errors['min']) return 'Valeur minimale: 0';
    if (control.errors['max']) return `Valeur maximale: ${control.errors['max'].max}`;
    return 'Valeur invalide';
  }

  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
      this.resetForm();
    }
  }

  cancelCreate(): void {
    this.showCreateForm = false;
    this.resetForm();
  }

  applyFilters(): void {
    this.syncQueryParams();
    this.loadUnits();
  }

  clearFilters(): void {
    this.filterForm.reset({
      q: '',
      head: '',
      parentId: '',
    });
    this.syncQueryParams();
    this.loadUnits();
  }

  selectUnit(id: string): void {
    this.selectedUnitId = id;
    this.refreshSelectedState();
    this.syncQueryParams();
  }

  clearSelectedUnit(): void {
    this.selectedUnitId = null;
    this.selectedUnit = null;
    this.selectedVacancyCount = 0;
    this.resetEditForm();
    this.syncQueryParams();
  }

  toggleNode(id: string): void {
    if (this.collapsedNodeIds.has(id)) {
      this.collapsedNodeIds.delete(id);
      return;
    }
    this.collapsedNodeIds.add(id);
  }

  isExpanded(id: string): boolean {
    return !this.collapsedNodeIds.has(id);
  }

  expandAll(): void {
    this.collapsedNodeIds.clear();
  }

  collapseAll(): void {
    this.collapsedNodeIds = new Set(collectCollapsibleNodeIds(this.roots));
  }

  startSimulation(): void {
    const source = this.allUnits.length ? this.allUnits : this.units;
    if (!source.length) {
      this.toastr.info('Aucune unite disponible pour demarrer une simulation', 'Organisation', {
        timeOut: 2300,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.isSimulationMode = true;
    this.activeSimulationSnapshotId = null;
    this.simulationBaseUnits = cloneOrgUnits(source);
    this.simulationUnits = cloneOrgUnits(source);
    this.simulationChanges = [];
    this.showCreateForm = false;
    this.selectedUnitId = null;

    this.loadFilterOptions();
    this.loadUnits();

    this.toastr.info('Mode simulation active', 'Organisation', {
      timeOut: 2000,
      positionClass: 'toast-top-right',
    });
  }

  cancelSimulation(): void {
    if (!this.isSimulationMode) {
      return;
    }

    this.resetSimulationState();
    this.loadFilterOptions();
    this.loadUnits();
    this.toastr.info('Simulation annulee', 'Organisation', {
      timeOut: 1800,
      positionClass: 'toast-top-right',
    });
  }

  saveSimulationDraft(): void {
    if (!this.isSimulationMode || !this.simulationChanges.length) {
      this.toastr.info('Aucun changement a sauvegarder', 'Organisation', {
        timeOut: 2000,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.upsertSnapshotFromSimulation('BROUILLON');
    this.toastr.success('Brouillon de simulation sauvegarde', 'Organisation', {
      timeOut: 2200,
      positionClass: 'toast-top-right',
    });
  }

  async submitSimulationForApproval(): Promise<void> {
    if (!this.isSimulationMode || !this.simulationChanges.length || this.isSubmittingSimulation) {
      return;
    }

    this.isSubmittingSimulation = true;
    try {
      const definition = await this.ensureReorgWorkflowDefinition();
      const instance = await firstValueFrom(
        this.workflowsService.createInstance({
          definition: definition.code,
          requester: 'Direction RH',
          owner: 'Directeur RH',
          priority: 'Haute',
          stepsTotal: 1,
          stepsCompleted: 0,
          status: 'EN_ATTENTE',
          currentStep: 'Validation reorganisation organigramme',
          dueOn: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        })
      );

      this.upsertSnapshotFromSimulation('SOUMIS', instance.id);
      this.resetSimulationState();
      this.loadFilterOptions();
      this.loadUnits();

      this.toastr.success(`Simulation soumise (workflow ${instance.id})`, 'Organisation', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Organisation', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.isSubmittingSimulation = false;
    }
  }

  resumeSnapshot(snapshotId: string): void {
    const snapshot = this.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) {
      return;
    }

    if (snapshot.status !== 'BROUILLON' && snapshot.status !== 'REJETE') {
      this.toastr.info('Seuls les brouillons et simulations rejetees peuvent etre repris', 'Organisation', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.isSimulationMode = true;
    this.activeSimulationSnapshotId = snapshot.id;
    this.simulationBaseUnits = cloneOrgUnits(snapshot.baseUnits.length ? snapshot.baseUnits : snapshot.units);
    this.simulationUnits = cloneOrgUnits(snapshot.units);
    this.simulationChanges = computeReorgChanges(this.simulationBaseUnits, this.simulationUnits);
    this.showCreateForm = false;
    this.selectedUnitId = null;

    this.loadFilterOptions();
    this.loadUnits();

    this.toastr.info(`Simulation reprise: ${snapshot.label}`, 'Organisation', {
      timeOut: 2300,
      positionClass: 'toast-top-right',
    });
  }

  async approveSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot || snapshot.status !== 'SOUMIS' || this.snapshotActionId) {
      return;
    }

    this.snapshotActionId = snapshotId;
    try {
      if (snapshot.workflowInstanceId) {
        await firstValueFrom(
          this.workflowsService.transitionInstance(
            snapshot.workflowInstanceId,
            'APPROUVER',
            'Validation simulation de reorganisation'
          )
        );
      }

      snapshot.status = 'APPROUVE';
      snapshot.updatedAt = new Date().toISOString();
      this.persistSnapshots();

      this.toastr.success('Simulation approuvee', 'Organisation', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Organisation', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.snapshotActionId = null;
    }
  }

  async rejectSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot || snapshot.status !== 'SOUMIS' || this.snapshotActionId) {
      return;
    }

    this.snapshotActionId = snapshotId;
    try {
      if (snapshot.workflowInstanceId) {
        await firstValueFrom(
          this.workflowsService.transitionInstance(
            snapshot.workflowInstanceId,
            'REJETER',
            'Simulation non conforme'
          )
        );
      }

      snapshot.status = 'REJETE';
      snapshot.updatedAt = new Date().toISOString();
      this.persistSnapshots();

      this.toastr.info('Simulation rejetee', 'Organisation', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Organisation', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.snapshotActionId = null;
    }
  }

  async publishSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.find((item) => item.id === snapshotId);
    if (!snapshot || snapshot.status !== 'APPROUVE' || this.snapshotActionId) {
      return;
    }

    this.snapshotActionId = snapshotId;
    try {
      const currentUnits = await firstValueFrom(
        this.organizationService.getOrgUnits({
          page: 1,
          limit: 5000,
          sortBy: 'name',
          sortOrder: 'asc',
        })
      );
      const existingIds = new Set(currentUnits.map((item) => item.id));

      const creations = snapshot.changes.filter((change) => change.type === 'CREATION');
      const modifications = snapshot.changes.filter((change) => change.type === 'MODIFICATION');

      const pendingCreations = [...creations];
      let appliedCreations = 0;

      while (pendingCreations.length > 0) {
        let progressed = false;

        for (let index = pendingCreations.length - 1; index >= 0; index -= 1) {
          const change = pendingCreations[index];
          const parentId = change.after.parentId;
          if (parentId && !existingIds.has(parentId)) {
            continue;
          }

          const created = await firstValueFrom(
            this.organizationService.createOrgUnit({
              name: change.after.name,
              parentId: change.after.parentId,
              head: change.after.head,
              headTitle: change.after.headTitle,
              staffCount: change.after.staffCount,
            })
          );
          existingIds.add(change.unitId);
          existingIds.add(created.id);
          pendingCreations.splice(index, 1);
          appliedCreations += 1;
          progressed = true;
        }

        if (!progressed) {
          throw new Error('Publication impossible: dependances parent/enfant non resolues');
        }
      }

      let appliedUpdates = 0;
      for (const change of modifications) {
        await firstValueFrom(
          this.organizationService.updateOrgUnit({
            id: change.unitId,
            name: change.after.name,
            parentId: change.after.parentId,
            head: change.after.head,
            headTitle: change.after.headTitle,
            staffCount: change.after.staffCount,
          })
        );
        appliedUpdates += 1;
      }

      snapshot.status = 'PUBLIE';
      snapshot.updatedAt = new Date().toISOString();
      snapshot.publishedAt = snapshot.updatedAt;
      this.persistSnapshots();

      this.loadFilterOptions();
      this.loadVacancyCounts();
      this.loadUnits();

      this.toastr.success(
        `Simulation publiee (${appliedCreations} creation(s), ${appliedUpdates} mise(s) a jour)`,
        'Organisation',
        {
          timeOut: 3000,
          positionClass: 'toast-top-right',
        }
      );
    } catch (error) {
      this.toastr.error(this.resolveError(error), 'Organisation', {
        timeOut: 3400,
        positionClass: 'toast-top-right',
      });
    } finally {
      this.snapshotActionId = null;
    }
  }

  deleteSnapshot(snapshotId: string): void {
    const index = this.snapshots.findIndex((item) => item.id === snapshotId);
    if (index < 0 || this.snapshotActionId) {
      return;
    }

    const snapshot = this.snapshots[index];
    if (snapshot.status === 'PUBLIE') {
      this.toastr.info('Les simulations publiees ne peuvent pas etre supprimees', 'Organisation', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.snapshots.splice(index, 1);
    if (this.activeSimulationSnapshotId === snapshotId) {
      this.activeSimulationSnapshotId = null;
    }
    this.persistSnapshots();
    this.toastr.info('Simulation supprimee', 'Organisation', {
      timeOut: 1800,
      positionClass: 'toast-top-right',
    });
  }

  snapshotStatusLabel(status: ReorgSnapshotStatus): string {
    switch (status) {
      case 'BROUILLON':
        return 'Brouillon';
      case 'SOUMIS':
        return 'Soumis';
      case 'APPROUVE':
        return 'Approuve';
      case 'REJETE':
        return 'Rejete';
      case 'PUBLIE':
        return 'Publie';
      default:
        return status;
    }
  }

  snapshotStatusClass(status: ReorgSnapshotStatus): string {
    switch (status) {
      case 'BROUILLON':
        return 'bg-secondary-transparent';
      case 'SOUMIS':
        return 'bg-warning-transparent';
      case 'APPROUVE':
        return 'bg-success-transparent';
      case 'REJETE':
        return 'bg-danger-transparent';
      case 'PUBLIE':
        return 'bg-info-transparent';
      default:
        return 'bg-light text-default';
    }
  }

  isSnapshotBusy(snapshotId: string): boolean {
    return this.snapshotActionId === snapshotId;
  }

  exportUnits(): void {
    if (!this.units.length) {
      this.toastr.info('Aucune unite a exporter', 'Organisation', {
        timeOut: 2200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const rows = flattenOrgTree(this.roots).map(({ node, depth, parentName }) => [
      node.unit.id,
      node.unit.name,
      parentName || '',
      node.unit.head || '',
      node.unit.headTitle || '',
      node.unit.staffCount,
      depth,
      node.children.length,
      this.vacancyCountForStructure(node.unit.name),
    ]);

    downloadCsv({
      filename: this.buildExportFilename(),
      headers: [
        'Code unite',
        'Nom unite',
        'Unite parente',
        'Responsable',
        'Titre responsable',
        'Effectif',
        'Niveau',
        'Sous-unites',
        'Postes vacants',
      ],
      rows,
      delimiter: ';',
    });

    this.toastr.success('Export CSV genere', 'Organisation', {
      timeOut: 2200,
      positionClass: 'toast-top-right',
    });
  }

  saveUnit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: CreateOrgUnitPayload = {
      name: this.form.value.name?.trim() || '',
      parentId: this.form.value.parentId?.trim() || undefined,
      head: this.form.value.head?.trim() || undefined,
      headTitle: this.form.value.headTitle?.trim() || undefined,
      staffCount: Number(this.form.value.staffCount ?? 0),
    };

    if (this.isSimulationMode) {
      this.appendSimulationUnit(payload);
      return;
    }

    this.submitting = true;
    this.organizationService
      .createOrgUnit(payload)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastr.success('Unite ajoutee avec succes', 'Organisation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.showCreateForm = false;
          this.resetForm();
          this.loadFilterOptions();
          this.loadUnits();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Organisation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  saveSelectedUnit(): void {
    if (!this.selectedUnit || this.editForm.invalid || this.updating) {
      this.editForm.markAllAsTouched();
      return;
    }

    const parentId = (this.editForm.value.parentId || '').trim();
    const hierarchyError = this.validateSelectedParent(parentId);
    if (hierarchyError) {
      this.toastr.error(hierarchyError, 'Organisation', {
        timeOut: 3200,
        positionClass: 'toast-top-right',
      });
      return;
    }

    const payload: UpdateOrgUnitPayload = {
      id: this.selectedUnit.id,
      name: this.editForm.value.name?.trim() || '',
      parentId: parentId || undefined,
      head: this.editForm.value.head?.trim() || undefined,
      headTitle: this.editForm.value.headTitle?.trim() || undefined,
      staffCount: Number(this.editForm.value.staffCount ?? 0),
    };

    if (this.isSimulationMode) {
      this.applySimulationUpdate(payload);
      return;
    }

    this.updating = true;
    this.organizationService
      .updateOrgUnit(payload)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe({
        next: (updated) => {
          this.selectedUnitId = updated.id;
          this.toastr.success('Unite mise a jour avec succes', 'Organisation', {
            timeOut: 2500,
            positionClass: 'toast-top-right',
          });
          this.syncQueryParams();
          this.loadFilterOptions();
          this.loadUnits();
        },
        error: (error) => {
          this.toastr.error(this.resolveError(error), 'Organisation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  vacancyCountForStructure(structureName: string): number {
    const key = this.normalizeLookupKey(structureName);
    return this.vacancyByStructure.get(key) || 0;
  }

  trackNode = (_: number, node: OrgTreeNode): string => node.unit.id;
  trackSnapshot = (_: number, snapshot: ReorgSnapshot): string => snapshot.id;

  private appendSimulationUnit(payload: CreateOrgUnitPayload): void {
    const created: OrgUnit = {
      id: this.generateSimulationUnitId(payload.name || ''),
      name: String(payload.name || '').trim(),
      parentId: this.normalizeOptionalText(payload.parentId),
      head: this.normalizeOptionalText(payload.head),
      headTitle: this.normalizeOptionalText(payload.headTitle),
      staffCount: this.toNonNegativeInt(payload.staffCount, 0),
    };

    this.simulationUnits.push(created);
    this.simulationChanges = computeReorgChanges(this.simulationBaseUnits, this.simulationUnits);
    this.allUnits = cloneOrgUnits(this.simulationUnits);
    this.showCreateForm = false;
    this.resetForm();
    this.loadUnits();

    this.toastr.success('Unite ajoutee au brouillon de simulation', 'Organisation', {
      timeOut: 2300,
      positionClass: 'toast-top-right',
    });
  }

  private applySimulationUpdate(payload: UpdateOrgUnitPayload): void {
    const index = this.simulationUnits.findIndex((item) => item.id === payload.id);
    if (index < 0) {
      this.toastr.error('Unite introuvable dans la simulation', 'Organisation', {
        timeOut: 2600,
        positionClass: 'toast-top-right',
      });
      return;
    }

    this.updating = true;
    this.simulationUnits[index] = {
      ...this.simulationUnits[index],
      name: String(payload.name || '').trim(),
      parentId: this.normalizeOptionalText(payload.parentId),
      head: this.normalizeOptionalText(payload.head),
      headTitle: this.normalizeOptionalText(payload.headTitle),
      staffCount: this.toNonNegativeInt(payload.staffCount, this.simulationUnits[index].staffCount),
    };

    this.simulationChanges = computeReorgChanges(this.simulationBaseUnits, this.simulationUnits);
    this.allUnits = cloneOrgUnits(this.simulationUnits);
    this.loadUnits();
    this.updating = false;

    this.toastr.success('Modification appliquee au brouillon de simulation', 'Organisation', {
      timeOut: 2200,
      positionClass: 'toast-top-right',
    });
  }

  private loadUnits(): void {
    if (this.isSimulationMode) {
      this.loading = false;
      this.loadError = null;
      const filtered = this.applyLocalOrgUnitFilters(this.simulationUnits);
      this.applyUnitsToView(filtered);
      return;
    }

    this.loading = true;
    this.loadError = null;

    this.organizationService
      .getOrgUnits(this.buildUnitsQuery())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (units) => {
          this.applyUnitsToView(units);
        },
        error: (error) => {
          this.units = [];
          this.roots = [];
          this.totalUnits = 0;
          this.totalStaff = 0;
          this.loadError = this.resolveError(error);
          this.selectedUnit = null;
          this.selectedVacancyCount = 0;
          this.resetEditForm();
          this.toastr.error(this.loadError, 'Organisation', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  private applyUnitsToView(units: OrgUnit[]): void {
    this.units = units;
    this.roots = buildOrgTree(units);

    const summary = summarizeOrgUnits(units);
    this.totalUnits = summary.totalUnits;
    this.totalStaff = summary.totalStaff;

    const availableIds = new Set(units.map((unit) => unit.id));
    this.collapsedNodeIds = new Set(
      Array.from(this.collapsedNodeIds).filter((id) => availableIds.has(id))
    );
    this.refreshSelectedState();
  }

  private loadFilterOptions(): void {
    if (this.isSimulationMode) {
      this.allUnits = cloneOrgUnits(this.simulationUnits);
      this.refreshSelectedState();
      return;
    }

    this.organizationService
      .getOrgUnits({
        page: 1,
        limit: 5000,
        sortBy: 'name',
        sortOrder: 'asc',
      })
      .subscribe({
        next: (units) => {
          this.allUnits = units;
          this.refreshSelectedState();
        },
      });
  }

  private loadVacancyCounts(): void {
    this.organizationService
      .getVacantPositions({
        page: 1,
        limit: 5000,
        sortBy: 'openedOn',
        sortOrder: 'desc',
      })
      .subscribe({
        next: (items) => {
          this.vacancyByStructure = this.buildVacancyIndex(items);
          this.refreshSelectedState();
        },
        error: () => {
          this.vacancyByStructure = new Map<string, number>();
          this.refreshSelectedState();
        },
      });
  }

  private buildVacancyIndex(items: VacantPosition[]): Map<string, number> {
    const index = new Map<string, number>();
    items.forEach((item) => {
      const key = this.normalizeLookupKey(item.structure);
      index.set(key, (index.get(key) || 0) + 1);
    });
    return index;
  }

  private refreshSelectedState(): void {
    if (!this.selectedUnitId) {
      this.selectedUnit = null;
      this.selectedVacancyCount = 0;
      this.resetEditForm();
      return;
    }

    const selectedFromCurrent = this.units.find((unit) => unit.id === this.selectedUnitId);
    const selectedFromAll = this.allUnits.find((unit) => unit.id === this.selectedUnitId);
    const selected = selectedFromCurrent || selectedFromAll || null;

    if (!selected) {
      this.selectedUnitId = null;
      this.selectedUnit = null;
      this.selectedVacancyCount = 0;
      this.resetEditForm();
      this.syncQueryParams();
      return;
    }

    this.selectedUnit = selected;
    this.selectedVacancyCount = this.vacancyCountForStructure(selected.name);
    this.patchEditForm(selected);
  }

  private patchEditForm(unit: OrgUnit): void {
    this.editForm.reset(
      {
        name: unit.name || '',
        parentId: unit.parentId || '',
        head: unit.head || '',
        headTitle: unit.headTitle || '',
        staffCount: Number(unit.staffCount || 0),
      },
      { emitEvent: false }
    );
  }

  private resetEditForm(): void {
    this.editForm.reset(
      {
        name: '',
        parentId: '',
        head: '',
        headTitle: '',
        staffCount: 0,
      },
      { emitEvent: false }
    );
  }

  private validateSelectedParent(parentId: string): string | null {
    if (!this.selectedUnit || !parentId) {
      return null;
    }

    if (this.selectedUnit.id === parentId) {
      return 'Une unite ne peut pas etre sa propre parente';
    }

    const source = this.allUnits.length ? this.allUnits : this.units;
    const descendants = collectDescendantIds(buildOrgTree(source), this.selectedUnit.id);
    if (descendants.has(parentId)) {
      return 'Impossible de rattacher une unite a une de ses sous-unites';
    }

    if (!source.some((unit) => unit.id === parentId)) {
      return 'Unite parente introuvable';
    }

    return null;
  }

  private buildUnitsQuery(): OrgUnitsQuery {
    const q = (this.filterForm.value.q || '').trim();
    const head = (this.filterForm.value.head || '').trim();
    const parentId = (this.filterForm.value.parentId || '').trim();

    return {
      q: q || undefined,
      head: head || undefined,
      parentId: parentId || undefined,
      page: 1,
      limit: 5000,
      sortBy: 'name',
      sortOrder: 'asc',
    };
  }

  private applyLocalOrgUnitFilters(source: OrgUnit[]): OrgUnit[] {
    const q = (this.filterForm.value.q || '').trim().toLowerCase();
    const head = (this.filterForm.value.head || '').trim().toLowerCase();
    const parentId = (this.filterForm.value.parentId || '').trim().toLowerCase();

    let next = [...source];

    if (parentId) {
      next = next.filter((item) => (item.parentId || '').toLowerCase().includes(parentId));
    }

    if (head) {
      next = next.filter((item) => (item.head || '').toLowerCase().includes(head));
    }

    if (q) {
      next = next.filter((item) => {
        return (
          item.id.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          (item.parentId || '').toLowerCase().includes(q) ||
          (item.head || '').toLowerCase().includes(q) ||
          (item.headTitle || '').toLowerCase().includes(q)
        );
      });
    }

    next.sort((left, right) => left.name.localeCompare(right.name, 'fr', { sensitivity: 'base' }));
    return next;
  }

  private buildExportFilename(): string {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `organigramme-${yyyy}-${mm}-${dd}.csv`;
  }

  private restoreStateFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    this.filterForm.patchValue(
      {
        q: params.get('q') || '',
        head: params.get('head') || '',
        parentId: params.get('parentId') || '',
      },
      { emitEvent: false }
    );

    const unitId = String(params.get('unitId') || '').trim();
    this.selectedUnitId = unitId || null;
  }

  private syncQueryParams(): void {
    const q = (this.filterForm.value.q || '').trim();
    const head = (this.filterForm.value.head || '').trim();
    const parentId = (this.filterForm.value.parentId || '').trim();

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: q || null,
        head: head || null,
        parentId: parentId || null,
        unitId: this.selectedUnitId || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      parentId: '',
      head: '',
      headTitle: '',
      staffCount: 0,
    });
  }

  private resetSimulationState(): void {
    this.isSimulationMode = false;
    this.activeSimulationSnapshotId = null;
    this.simulationBaseUnits = [];
    this.simulationUnits = [];
    this.simulationChanges = [];
  }

  private upsertSnapshotFromSimulation(
    status: ReorgSnapshotStatus,
    workflowInstanceId?: string
  ): ReorgSnapshot {
    const now = new Date().toISOString();
    const snapshotId = this.activeSimulationSnapshotId || this.generateSnapshotId();
    const snapshotIndex = this.snapshots.findIndex((item) => item.id === snapshotId);
    const existing = snapshotIndex >= 0 ? this.snapshots[snapshotIndex] : null;
    const changes = computeReorgChanges(this.simulationBaseUnits, this.simulationUnits);
    this.simulationChanges = changes;

    const snapshot: ReorgSnapshot = {
      id: snapshotId,
      label: existing?.label || buildSimulationLabel(),
      status,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      publishedAt: status === 'PUBLIE' ? now : existing?.publishedAt,
      workflowInstanceId: workflowInstanceId || existing?.workflowInstanceId,
      changes,
      baseUnits: cloneOrgUnits(this.simulationBaseUnits),
      units: cloneOrgUnits(this.simulationUnits),
    };

    if (snapshotIndex >= 0) {
      this.snapshots[snapshotIndex] = snapshot;
    } else {
      this.snapshots.unshift(snapshot);
    }

    this.activeSimulationSnapshotId = snapshotId;
    this.persistSnapshots();
    return snapshot;
  }

  private loadSnapshots(): void {
    if (!this.hasLocalStorage()) {
      this.snapshots = [];
      return;
    }

    const raw = window.localStorage.getItem(this.reorgSnapshotsKey);
    if (!raw) {
      this.snapshots = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        this.snapshots = [];
        return;
      }

      this.snapshots = parsed
        .map((item) => this.normalizeSnapshot(item))
        .filter((item): item is ReorgSnapshot => !!item)
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    } catch {
      this.snapshots = [];
    }
  }

  private persistSnapshots(): void {
    this.snapshots = [...this.snapshots].sort(
      (left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt)
    );

    if (!this.hasLocalStorage()) {
      return;
    }

    window.localStorage.setItem(this.reorgSnapshotsKey, JSON.stringify(this.snapshots));
  }

  private normalizeSnapshot(value: unknown): ReorgSnapshot | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const record = value as Partial<ReorgSnapshot>;
    const status = this.normalizeSnapshotStatus(record.status);
    if (!status) {
      return null;
    }

    const baseUnits = Array.isArray(record.baseUnits)
      ? cloneOrgUnits(record.baseUnits as OrgUnit[])
      : [];
    const units = Array.isArray(record.units)
      ? cloneOrgUnits(record.units as OrgUnit[])
      : [];
    const changes = Array.isArray(record.changes) ? (record.changes as ReorgChange[]) : [];

    const createdAt = this.toIsoDateOrNow(record.createdAt);
    const updatedAt = this.toIsoDateOrNow(record.updatedAt || createdAt);
    const publishedAt = record.publishedAt ? this.toIsoDateOrNow(record.publishedAt) : undefined;

    return {
      id: String(record.id || '').trim(),
      label: String(record.label || '').trim() || buildSimulationLabel(new Date(createdAt)),
      status,
      createdAt,
      updatedAt,
      publishedAt,
      workflowInstanceId: this.normalizeOptionalText(record.workflowInstanceId),
      changes,
      baseUnits,
      units,
    };
  }

  private normalizeSnapshotStatus(value: unknown): ReorgSnapshotStatus | null {
    const raw = String(value || '').trim().toUpperCase();
    if (raw === 'BROUILLON' || raw === 'SOUMIS' || raw === 'APPROUVE' || raw === 'REJETE' || raw === 'PUBLIE') {
      return raw as ReorgSnapshotStatus;
    }
    return null;
  }

  private generateSnapshotId(): string {
    const now = new Date();
    const compact = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    let candidate = `REORG-${compact}`;
    let suffix = 2;

    const ids = new Set(this.snapshots.map((item) => item.id));
    while (ids.has(candidate)) {
      candidate = `REORG-${compact}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async ensureReorgWorkflowDefinition(): Promise<WorkflowDefinition> {
    const definitions = await firstValueFrom(this.workflowsService.getDefinitions());
    const existing = definitions.find((item) => {
      const code = String(item.code || '').trim().toUpperCase();
      const usedFor = this.normalizeLookupKey(item.usedFor || '');
      const name = this.normalizeLookupKey(item.name || '');
      return code === 'WF-ORG' || usedFor === 'organisation' || name.includes('reorganisation');
    });
    if (existing) {
      return existing;
    }

    return firstValueFrom(
      this.workflowsService.createDefinition({
        code: 'WF-ORG',
        name: 'Validation reorganisation organigramme',
        steps: 1,
        usedFor: 'Organisation',
        status: 'Actif',
        slaTargetHours: 72,
        autoEscalation: true,
      })
    );
  }

  private generateSimulationUnitId(name: string): string {
    const normalizedName = String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24);
    const base = normalizedName || 'UNIT';

    let candidate = `ORG-${base}`;
    let suffix = 2;
    const ids = new Set(this.simulationUnits.map((item) => item.id));
    while (ids.has(candidate)) {
      candidate = `ORG-${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  private normalizeLookupKey(value: unknown): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private normalizeOptionalText(value: unknown): string | undefined {
    const normalized = String(value || '').trim();
    return normalized.length ? normalized : undefined;
  }

  private toNonNegativeInt(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    const rounded = Math.round(parsed);
    return rounded >= 0 ? rounded : fallback;
  }

  private toIsoDateOrNow(value: unknown): string {
    const raw = String(value || '').trim();
    const parsed = Date.parse(raw);
    if (!raw || Number.isNaN(parsed)) {
      return new Date().toISOString();
    }
    return new Date(parsed).toISOString();
  }

  private hasLocalStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
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

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return 'Operation impossible pour le moment';
  }
}
