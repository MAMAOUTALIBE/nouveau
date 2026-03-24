import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { SpkWidgetsMetricCard } from '../../../../@spk/widgets/spk-widgets-metric-card/spk-widgets-metric-card';
import { SpkApexcharts } from '../../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [
    FormsModule,
    SpkWidgetsMetricCard,
    SpkApexcharts,
    SpkReusableTables,
    NgApexchartsModule,
  ],
  templateUrl: './hr-dashboard.html',
})
export class HrDashboardPage implements OnInit {
  private dashboardService = inject(DashboardService);

  readonly pendingColumns = [
    { header: 'Référence' },
    { header: 'Agent' },
    { header: 'Type' },
    { header: 'Structure' },
    { header: 'Soumis le' },
    { header: 'Statut' },
  ];

  kpis = [
    { title: 'Effectif total', value: '1 284', lastWeek: 'M-1', trendIcon: 'up', trendClass: 'text-success', trendValue: '+2.1%', cardClass: 'bg-primary-gradient', iconClass: 'users' },
    { title: 'Agents actifs', value: '1 173', lastWeek: 'Aujourd’hui', trendIcon: 'up', trendClass: 'text-success', trendValue: '+1.4%', cardClass: 'bg-success-gradient', iconClass: 'user-check' },
    { title: 'Absences en cours', value: '47', lastWeek: 'En attente', trendIcon: 'up', trendClass: 'text-warning', trendValue: '12 urgentes', cardClass: 'bg-warning-gradient', iconClass: 'calendar' },
    { title: 'Postes vacants', value: '23', lastWeek: 'Priorité', trendIcon: 'down', trendClass: 'text-danger', trendValue: '5 critiques', cardClass: 'bg-danger-gradient', iconClass: 'briefcase' },
  ];

  headcountTrend: ApexOptions = {
    chart: { type: 'line', height: 320, toolbar: { show: false } },
    series: [
      { name: 'Effectif', data: [1201, 1210, 1216, 1228, 1240, 1255, 1284] },
      { name: 'Sorties', data: [3, 2, 5, 1, 4, 2, 6] },
    ],
    colors: ['var(--primary-color)', '#f74f75'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'] },
    grid: { borderColor: '#f2f6f7' },
    dataLabels: { enabled: false },
  };

  pendingRequests: {
    checked: boolean;
    reference: string;
    agent: string;
    type: string;
    unit: string;
    submittedAt: string;
    status: string;
  }[] = [];

  ngOnInit(): void {
    this.dashboardService.getSummary().subscribe((summary) => {
      // Keep async updates outside the initial check cycle to avoid NG0100 on first paint.
      setTimeout(() => {
        this.kpis = [
          { ...this.kpis[0], value: summary.headcount.toLocaleString('fr-FR') },
          { ...this.kpis[1], value: summary.active.toLocaleString('fr-FR') },
          { ...this.kpis[2], value: String(summary.absences) },
          { ...this.kpis[3], value: String(summary.vacancies) },
        ];
      });
    });

    this.dashboardService.getPendingRequests().subscribe((requests) => {
      // Keep async updates outside the initial check cycle to avoid NG0100 on first paint.
      setTimeout(() => {
        this.pendingRequests = requests.map((request) => ({ ...request, checked: false }));
      });
    });
  }

  toggleAllRows(checked: boolean) {
    this.pendingRequests = this.pendingRequests.map((row) => ({ ...row, checked }));
  }
}
