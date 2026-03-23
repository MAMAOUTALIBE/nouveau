import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { PerformanceService } from '../../performance.service';

@Component({
  selector: 'app-perf-results',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './perf-results.html',
})
export class PerfResultsPage implements OnInit {
  private performanceService = inject(PerformanceService);

  gridConfig = {
    columns: ['Agent', 'Direction', 'Auto-éval', 'Manager', 'Score final', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.performanceService.getResults().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((r) => [
          r.agent,
          r.direction,
          r.selfScore,
          r.managerScore,
          r.finalScore,
          r.status,
        ]),
      };
    });
  }
}
