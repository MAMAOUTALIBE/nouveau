import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { SpkNgSelect } from '../../../../@spk/plugins/spk-ng-select/spk-ng-select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import { AgentListItem, AgentListQuery, PersonnelService } from '../../personnel.service';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [SpkNgSelect, FormsModule, RouterLink],
  templateUrl: './agent-list.html',
})
export class AgentListPage implements OnInit, OnDestroy {
  private personnelService = inject(PersonnelService);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

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

  selectedDirection = 'all';
  selectedStatus = 'all';
  searchTerm = '';
  isLoading = false;
  currentAgents: AgentListItem[] = [];

  ngOnInit(): void {
    this.loadAgents();
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

  onSearchInput(value: string): void {
    this.searchTerm = value;
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.loadAgents();
    }, 250);
  }

  private loadAgents(): void {
    this.isLoading = true;
    this.personnelService
      .getAgents(this.buildQuery())
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((agents) => {
        this.currentAgents = agents;
      });
  }

  exportAgents(): void {
    if (!this.currentAgents.length) {
      return;
    }

    downloadCsv({
      filename: `agents-${this.exportDateSuffix()}.csv`,
      headers: ['Matricule', 'Nom complet', 'Direction', 'Poste', 'Statut', 'Manager'],
      rows: this.currentAgents.map((agent) => [
        agent.matricule,
        agent.fullName,
        agent.direction,
        agent.position,
        agent.status,
        agent.manager,
      ]),
      delimiter: ';',
    });
  }

  private buildQuery(): AgentListQuery {
    return {
      q: this.searchTerm,
      direction: this.selectedDirection === 'all' ? undefined : this.selectedDirection,
      status: this.selectedStatus === 'all' ? undefined : this.selectedStatus,
      page: 1,
      limit: 200,
      sortBy: 'fullName',
      sortOrder: 'asc',
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
}
