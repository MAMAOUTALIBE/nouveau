import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TrainingService } from './training.service';
import { TrainingSessionsPage } from './pages/training-sessions/training-sessions';
import { TrainingCatalogPage } from './pages/training-catalog/training-catalog';
import { TrainingRequestsPage } from './pages/training-requests/training-requests';

type TrainingTab = 'sessions' | 'catalog' | 'requests';

/**
 * Page « Formation » unifiee : cockpit KPI + 3 onglets (Sessions, Catalogue,
 * Demandes).
 */
@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, TrainingSessionsPage, TrainingCatalogPage, TrainingRequestsPage],
  templateUrl: './training.html',
})
export class TrainingPage implements OnInit {
  private route = inject(ActivatedRoute);
  private trainingService = inject(TrainingService);

  activeTab: TrainingTab = 'sessions';
  sessionsCount = 0;
  catalogCount = 0;
  requestsCount = 0;
  pendingRequestsCount = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['trainingTab'];
    if (routeTab === 'sessions' || routeTab === 'catalog' || routeTab === 'requests') {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: TrainingTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.trainingService.getSessions({ page: 1, limit: 200 }).subscribe({
      next: (items) => (this.sessionsCount = items.length),
      error: () => (this.sessionsCount = 0),
    });
    this.trainingService.getCatalog({ page: 1, limit: 200 }).subscribe({
      next: (items) => (this.catalogCount = items.length),
      error: () => (this.catalogCount = 0),
    });
    this.trainingService.getRequests({ page: 1, limit: 500 }).subscribe({
      next: (items) => {
        this.requestsCount = items.length;
        this.pendingRequestsCount = items.filter(
          (item) => String(item.status || '').toLowerCase() === 'soumise'
        ).length;
      },
      error: () => {
        this.requestsCount = 0;
        this.pendingRequestsCount = 0;
      },
    });
  }
}
