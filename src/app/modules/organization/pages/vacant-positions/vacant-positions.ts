import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { OrganizationService } from '../../organization.service';

@Component({
  selector: 'app-vacant-positions',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './vacant-positions.html',
})
export class VacantPositionsPage implements OnInit {
  private organizationService = inject(OrganizationService);

  gridConfig = {
    columns: ['Code', 'Structure', 'Intitulé', 'Grade', 'Ouvert depuis', 'Priorité'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.organizationService.getVacantPositions().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((p) => [
          p.code,
          p.structure,
          p.title,
          p.grade,
          p.openedOn,
          p.priority,
        ]),
      };
    });
  }
}
