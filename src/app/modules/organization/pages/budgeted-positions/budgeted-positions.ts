import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { OrganizationService } from '../../organization.service';

@Component({
  selector: 'app-budgeted-positions',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './budgeted-positions.html',
})
export class BudgetedPositionsPage implements OnInit {
  private organizationService = inject(OrganizationService);

  gridConfig = {
    columns: ['Code', 'Structure', 'Intitulé', 'Grade', 'Statut', 'Titulaire'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.organizationService.getBudgetedPositions().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((p) => [
          p.code,
          p.structure,
          p.title,
          p.grade,
          p.status,
          p.holder || '—',
        ]),
      };
    });
  }
}
