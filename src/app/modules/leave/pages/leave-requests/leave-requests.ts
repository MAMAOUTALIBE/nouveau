import { Component, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { LeaveService } from '../../leave.service';

@Component({
  selector: 'app-leave-requests',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './leave-requests.html',
})
export class LeaveRequestsPage {
  private leaveService = inject(LeaveService);

  gridConfig = {
    columns: ['Référence', 'Agent', 'Type', 'Début', 'Fin', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit() {
    this.leaveService.getRequests().subscribe((rows) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: rows.map((r) => [r.reference, r.agent, r.type, r.startDate, r.endDate, r.status]),
      };
    });
  }
}
