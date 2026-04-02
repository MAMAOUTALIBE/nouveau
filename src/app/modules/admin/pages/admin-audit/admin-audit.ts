import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './admin-audit.html',
})
export class AdminAuditPage implements OnInit {
  private adminService = inject(AdminService);

  gridConfig = {
    columns: ['Date', 'Utilisateur', 'Action', 'Cible'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.adminService.getAudit().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((a) => [a.date, a.user, a.action, a.target]),
      };
    });
  }
}
