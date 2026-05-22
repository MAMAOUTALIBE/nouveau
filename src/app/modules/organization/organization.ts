import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrganizationService } from './organization.service';
import { OrgChartPage } from './pages/org-chart/org-chart';
import { BudgetedPositionsPage } from './pages/budgeted-positions/budgeted-positions';
import { VacantPositionsPage } from './pages/vacant-positions/vacant-positions';

type OrgTab = 'organigramme' | 'budgetaires' | 'vacants';

/**
 * Page « Organisation » unifiee : cockpit KPI + 3 onglets regroupant
 * l'organigramme, les postes budgetaires et les postes vacants.
 */
@Component({
  selector: 'app-organization',
  standalone: true,
  imports: [CommonModule, OrgChartPage, BudgetedPositionsPage, VacantPositionsPage],
  templateUrl: './organization.html',
})
export class OrganizationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationService = inject(OrganizationService);

  activeTab: OrgTab = 'organigramme';
  unitsCount = 0;
  totalStaff = 0;
  budgetedCount = 0;
  vacantCount = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['orgTab'];
    if (routeTab === 'organigramme' || routeTab === 'budgetaires' || routeTab === 'vacants') {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: OrgTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.organizationService.getOrgUnits().subscribe({
      next: (units) => {
        this.unitsCount = units.length;
        this.totalStaff = units.reduce((sum, unit) => sum + (Number(unit.staffCount) || 0), 0);
      },
      error: () => {
        this.unitsCount = 0;
        this.totalStaff = 0;
      },
    });
    this.organizationService.getBudgetedPositions().subscribe({
      next: (items) => (this.budgetedCount = items.length),
      error: () => (this.budgetedCount = 0),
    });
    this.organizationService.getVacantPositions().subscribe({
      next: (items) => (this.vacantCount = items.length),
      error: () => (this.vacantCount = 0),
    });
  }
}
