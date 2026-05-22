import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CareersService } from './careers.service';
import { AdvancementsPage } from './pages/advancements/advancements';
import { TransfersPage } from './pages/transfers/transfers';
import { SecondmentsPage } from './pages/secondments/secondments';
import { PromotionsPage } from './pages/promotions/promotions';
import { DeparturesPage } from './pages/departures/departures';

type CareerTab = 'advancements' | 'transfers' | 'secondments' | 'promotions' | 'departures';

/**
 * Page « Carriere » unifiee : cockpit KPI + 5 onglets (Avancements, Mutations,
 * Detachements, Promotions, Departs & Retraites).
 */
@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [
    CommonModule,
    AdvancementsPage,
    TransfersPage,
    SecondmentsPage,
    PromotionsPage,
    DeparturesPage,
  ],
  templateUrl: './careers.html',
})
export class CareersPage implements OnInit {
  private route = inject(ActivatedRoute);
  private careersService = inject(CareersService);

  activeTab: CareerTab = 'advancements';
  advancementsCount = 0;
  transfersCount = 0;
  secondmentsCount = 0;
  promotionsCount = 0;
  departuresCount = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['careerTab'];
    if (
      routeTab === 'advancements' ||
      routeTab === 'transfers' ||
      routeTab === 'secondments' ||
      routeTab === 'promotions' ||
      routeTab === 'departures'
    ) {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: CareerTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.careersService.getMovesByType('Avancement').subscribe({
      next: (items) => (this.advancementsCount = items.length),
      error: () => (this.advancementsCount = 0),
    });
    this.careersService.getMovesByType('Mutation').subscribe({
      next: (items) => (this.transfersCount = items.length),
      error: () => (this.transfersCount = 0),
    });
    this.careersService.getMovesByType('Détachement').subscribe({
      next: (items) => (this.secondmentsCount = items.length),
      error: () => (this.secondmentsCount = 0),
    });
    this.careersService.getMovesByType('Promotion').subscribe({
      next: (items) => (this.promotionsCount = items.length),
      error: () => (this.promotionsCount = 0),
    });
    this.careersService.getDepartures().subscribe({
      next: (result) => (this.departuresCount = result.items.length),
      error: () => (this.departuresCount = 0),
    });
  }
}
