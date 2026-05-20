import { NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import {
  CareersService,
  DepartureDecision,
  DepartureHorizon,
  DepartureItem,
  DepartureType,
  DeparturesSummary,
} from '../../careers.service';

@Component({
  selector: 'app-departures',
  standalone: true,
  imports: [NgClass, FormsModule, RouterLink],
  templateUrl: './departures.html',
  styleUrls: ['./departures.scss'],
})
export class DeparturesPage implements OnInit {
  private careersService = inject(CareersService);
  private toastr = inject(ToastrService);

  isLoading = false;
  savingAge = false;
  summary: DeparturesSummary | null = null;
  allItems: DepartureItem[] = [];
  retirementAgeInput = 60;

  horizonFilter: 'all' | DepartureHorizon = 'all';
  typeFilter: 'all' | DepartureType = 'all';
  searchTerm = '';

  readonly horizonLabels: Record<DepartureHorizon, string> = {
    DEPASSE: 'Dépassé',
    URGENT: 'Urgent (≤ 3 mois)',
    A_ANTICIPER: 'À anticiper (≤ 6 mois)',
    A_PLANIFIER: 'À planifier (≤ 12 mois)',
    VISIBLE: 'Visible (12–24 mois)',
  };
  readonly decisionLabels: Record<DepartureDecision, string> = {
    A_DECIDER: 'À décider',
    A_RENOUVELER: 'À renouveler',
    A_LIBERER: 'À libérer',
    RECRUTEMENT_LANCE: 'Recrutement lancé',
  };
  readonly decisionOptions: DepartureDecision[] = [
    'A_DECIDER',
    'A_RENOUVELER',
    'A_LIBERER',
    'RECRUTEMENT_LANCE',
  ];
  readonly horizonOptions: DepartureHorizon[] = [
    'DEPASSE',
    'URGENT',
    'A_ANTICIPER',
    'A_PLANIFIER',
    'VISIBLE',
  ];

  ngOnInit(): void {
    this.loadDepartures();
  }

  loadDepartures(): void {
    this.isLoading = true;
    this.careersService
      .getDepartures()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (result) => {
          this.summary = result.summary;
          this.allItems = result.items;
          this.retirementAgeInput = result.summary.retirementAge;
        },
        error: () => this.toastr.error('Chargement des départs impossible.', 'Carrière'),
      });
  }

  saveRetirementAge(): void {
    const age = Number(this.retirementAgeInput);
    if (!Number.isFinite(age) || age < 45 || age > 80) {
      this.toastr.warning("L'âge de départ doit être compris entre 45 et 80 ans.", 'Carrière');
      return;
    }
    this.savingAge = true;
    this.careersService
      .setRetirementAge(age)
      .pipe(finalize(() => (this.savingAge = false)))
      .subscribe({
        next: (result) => {
          this.summary = result.summary;
          this.allItems = result.items;
          this.retirementAgeInput = result.summary.retirementAge;
          this.toastr.success('Âge légal de départ mis à jour.', 'Carrière');
        },
        error: () => this.toastr.error('Mise à jour de l’âge impossible.', 'Carrière'),
      });
  }

  onDecisionChange(item: DepartureItem, value: string): void {
    const decision = this.decisionOptions.find((option) => option === value);
    if (!decision || decision === item.decision) {
      return;
    }
    this.careersService.setDepartureDecision(item.employeeId, decision).subscribe({
      next: (result) => {
        this.summary = result.summary;
        this.allItems = result.items;
        this.toastr.success('Décision enregistrée.', 'Carrière');
      },
      error: () => this.toastr.error('Enregistrement de la décision impossible.', 'Carrière'),
    });
  }

  filteredItems(): DepartureItem[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.allItems.filter((item) => {
      if (this.horizonFilter !== 'all' && item.horizon !== this.horizonFilter) {
        return false;
      }
      if (this.typeFilter !== 'all' && item.departureType !== this.typeFilter) {
        return false;
      }
      if (search) {
        const haystack =
          `${item.matricule} ${item.fullName} ${item.directionName} ${item.positionTitle}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }
      return true;
    });
  }

  resetFilters(): void {
    this.horizonFilter = 'all';
    this.typeFilter = 'all';
    this.searchTerm = '';
  }

  departureTypeLabel(type: DepartureType): string {
    return type === 'RETRAITE' ? 'Retraite' : 'Fin de contrat';
  }

  deadlineLabel(item: DepartureItem): string {
    if (item.daysUntil < 0) {
      return `En retard de ${Math.abs(item.daysUntil)} j`;
    }
    if (item.daysUntil === 0) {
      return "Échéance aujourd'hui";
    }
    return `J-${item.daysUntil}`;
  }

  horizonBadgeClass(horizon: DepartureHorizon): string {
    switch (horizon) {
      case 'DEPASSE':
        return 'bg-danger text-white';
      case 'URGENT':
        return 'bg-warning text-dark';
      case 'A_ANTICIPER':
        return 'bg-info text-white';
      case 'A_PLANIFIER':
        return 'bg-primary text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  typeBadgeClass(type: DepartureType): string {
    return type === 'RETRAITE' ? 'bg-primary-transparent text-primary' : 'bg-warning-transparent text-warning';
  }
}
