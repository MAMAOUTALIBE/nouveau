import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { downloadCsv } from '../../../../core/utils/csv-export.utils';
import {
  PersonnelService,
  PersonnelTurnoverRiskItem,
  PersonnelTurnoverRiskLevel,
} from '../../personnel.service';

@Component({
  selector: 'app-personnel-turnover-risk',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personnel-turnover-risk.html',
})
export class PersonnelTurnoverRiskPage implements OnInit {
  private personnelService = inject(PersonnelService);
  private toastr = inject(ToastrService);

  items: PersonnelTurnoverRiskItem[] = [];
  isLoading = false;
  search = '';
  direction = '';
  selectedRiskLevel: PersonnelTurnoverRiskLevel | 'all' = 'all';
  minScore = 0;

  readonly riskLevelOptions: Array<{ value: PersonnelTurnoverRiskLevel | 'all'; label: string }> = [
    { value: 'all', label: 'Tous les niveaux' },
    { value: 'Faible', label: 'Faible' },
    { value: 'Modere', label: 'Modere' },
    { value: 'Eleve', label: 'Eleve' },
    { value: 'Critique', label: 'Critique' },
  ];

  ngOnInit(): void {
    this.loadRisks();
  }

  loadRisks(): void {
    this.isLoading = true;
    this.personnelService
      .getTurnoverRisks({
        q: this.search.trim() || undefined,
        direction: this.direction.trim() || undefined,
        riskLevel: this.selectedRiskLevel === 'all' ? undefined : this.selectedRiskLevel,
        minScore: this.minScore > 0 ? this.minScore : undefined,
        page: 1,
        limit: 200,
        sortBy: 'riskScore',
        sortOrder: 'desc',
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (items) => {
          this.items = items;
        },
        error: (error) => {
          this.items = [];
          this.toastr.error(this.resolveError(error), 'Personnel', {
            timeOut: 3500,
            positionClass: 'toast-top-right',
          });
        },
      });
  }

  resetFilters(): void {
    this.search = '';
    this.direction = '';
    this.selectedRiskLevel = 'all';
    this.minScore = 0;
    this.loadRisks();
  }

  exportRisks(): void {
    if (!this.items.length) {
      return;
    }

    downloadCsv({
      filename: `risques-turnover-${this.exportDateSuffix()}.csv`,
      delimiter: ';',
      headers: [
        'Matricule',
        'Agent',
        'Direction',
        'Unite',
        'Poste',
        'Score',
        'Niveau',
        'Facteurs',
        'ActionRecommandee',
        'Modele',
        'Generation',
      ],
      rows: this.items.map((item) => [
        item.matricule,
        item.fullName,
        item.direction,
        item.unit,
        item.position,
        item.riskScore,
        item.riskLevel,
        item.factors.join(' | '),
        item.recommendedAction,
        item.modelName,
        item.generatedAt,
      ]),
    });
  }

  highRiskCount(): number {
    return this.items.filter((item) => item.riskLevel === 'Eleve' || item.riskLevel === 'Critique').length;
  }

  criticalRiskCount(): number {
    return this.items.filter((item) => item.riskLevel === 'Critique').length;
  }

  averageRiskScore(): number {
    if (!this.items.length) {
      return 0;
    }
    const total = this.items.reduce((sum, item) => sum + item.riskScore, 0);
    return Math.round(total / this.items.length);
  }

  riskLevelBadgeClass(level: PersonnelTurnoverRiskLevel): string {
    switch (level) {
      case 'Critique':
        return 'bg-danger-transparent text-danger';
      case 'Eleve':
        return 'bg-warning-transparent text-warning';
      case 'Modere':
        return 'bg-info-transparent text-info';
      case 'Faible':
      default:
        return 'bg-success-transparent text-success';
    }
  }

  scoreBarClass(level: PersonnelTurnoverRiskLevel): string {
    switch (level) {
      case 'Critique':
        return 'bg-danger';
      case 'Eleve':
        return 'bg-warning';
      case 'Modere':
        return 'bg-info';
      case 'Faible':
      default:
        return 'bg-success';
    }
  }

  trackByAgentId(_index: number, item: PersonnelTurnoverRiskItem): string {
    return item.agentId;
  }

  private exportDateSuffix(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private resolveError(error: unknown): string {
    const candidate = error as { error?: { message?: string }; message?: string };
    return candidate.error?.message || candidate.message || 'Impossible de charger les risques de turn-over';
  }
}
