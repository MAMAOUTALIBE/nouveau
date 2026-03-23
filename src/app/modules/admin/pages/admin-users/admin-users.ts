import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './admin-users.html',
})
export class AdminUsersPage implements OnInit {
  private adminService = inject(AdminService);

  gridConfig = {
    columns: ['Utilisateur', 'Nom', 'Rôle', 'Direction', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.adminService.getUsers().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((u) => [u.username, u.fullName, u.role, u.direction, u.status]),
      };
    });
  }
}
