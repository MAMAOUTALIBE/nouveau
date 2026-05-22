import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PerformanceService } from './performance.service';
import { PerfCampaignsPage } from './pages/perf-campaigns/perf-campaigns';
import { PerfResultsPage } from './pages/perf-results/perf-results';

type PerfTab = 'campaigns' | 'results';

/**
 * Page « Evaluation » unifiee : cockpit KPI + 2 onglets (Campagnes, Resultats).
 */
@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, PerfCampaignsPage, PerfResultsPage],
  templateUrl: './performance.html',
})
export class PerformancePage implements OnInit {
  private route = inject(ActivatedRoute);
  private performanceService = inject(PerformanceService);

  activeTab: PerfTab = 'campaigns';
  campaignsCount = 0;
  activeCampaignsCount = 0;
  resultsCount = 0;
  averageScore = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['perfTab'];
    if (routeTab === 'campaigns' || routeTab === 'results') {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: PerfTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.performanceService.getCampaigns({ page: 1, limit: 200 }).subscribe({
      next: (items) => {
        this.campaignsCount = items.length;
        this.activeCampaignsCount = items.filter((campaign) => {
          const status = String(campaign.status || '').toLowerCase();
          return (
            status.includes('actif') ||
            status.includes('active') ||
            status.includes('cours') ||
            status.includes('ouvert')
          );
        }).length;
      },
      error: () => {
        this.campaignsCount = 0;
        this.activeCampaignsCount = 0;
      },
    });
    this.performanceService.getResults({ page: 1, limit: 500 }).subscribe({
      next: (items) => {
        this.resultsCount = items.length;
        if (items.length) {
          const total = items.reduce((sum, result) => sum + (Number(result.finalScore) || 0), 0);
          this.averageScore = Math.round(total / items.length);
        } else {
          this.averageScore = 0;
        }
      },
      error: () => {
        this.resultsCount = 0;
        this.averageScore = 0;
      },
    });
  }
}
