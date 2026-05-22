import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeaveService } from './leave.service';
import { LeaveRequestsPage } from './pages/leave-requests/leave-requests';
import { LeaveCalendarPage } from './pages/leave-calendar/leave-calendar';
import { LeaveBalancesPage } from './pages/leave-balances/leave-balances';

type LeaveTab = 'requests' | 'calendar' | 'balances';

/**
 * Page « Absences » unifiee : cockpit KPI + 3 onglets (Demandes, Calendrier,
 * Soldes).
 */
@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, LeaveRequestsPage, LeaveCalendarPage, LeaveBalancesPage],
  templateUrl: './leave.html',
})
export class LeavePage implements OnInit {
  private route = inject(ActivatedRoute);
  private leaveService = inject(LeaveService);

  activeTab: LeaveTab = 'requests';
  requestsCount = 0;
  pendingCount = 0;
  approvedCount = 0;
  balancesCount = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['leaveTab'];
    if (routeTab === 'requests' || routeTab === 'calendar' || routeTab === 'balances') {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: LeaveTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.leaveService.getRequests({ page: 1, limit: 500 }).subscribe({
      next: (items) => {
        this.requestsCount = items.length;
        this.pendingCount = items.filter((item) => this.norm(item.status).includes('attente')).length;
        this.approvedCount = items.filter((item) => {
          const status = this.norm(item.status);
          return status.includes('valid') || status.includes('approuv');
        }).length;
      },
      error: () => {
        this.requestsCount = 0;
        this.pendingCount = 0;
        this.approvedCount = 0;
      },
    });
    this.leaveService.getBalances({ page: 1, limit: 200 }).subscribe({
      next: (items) => (this.balancesCount = items.length),
      error: () => (this.balancesCount = 0),
    });
  }

  private norm(value: string): string {
    return String(value || '').toLowerCase();
  }
}
