import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { PerformanceService } from '../../performance.service';

@Component({
  selector: 'app-perf-campaigns',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './perf-campaigns.html',
})
export class PerfCampaignsPage implements OnInit {
  private performanceService = inject(PerformanceService);

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Période', 'Population', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.performanceService.getCampaigns().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((c) => [c.code, c.title, c.period, c.population, c.status]),
      };
    });
  }
}
