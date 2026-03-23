import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './admin-roles.html',
})
export class AdminRolesPage implements OnInit {
  private adminService = inject(AdminService);

  gridConfig = {
    columns: ['Rôle', 'Description', 'Permissions'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.adminService.getRoles().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((r) => [r.name, r.description, r.permissions]),
      };
    });
  }
}
