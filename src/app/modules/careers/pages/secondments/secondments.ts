import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { CareerMove, CareersService } from '../../careers.service';

@Component({
  selector: 'app-secondments',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './secondments.html',
})
export class SecondmentsPage implements OnInit {
  private careersService = inject(CareersService);

  gridConfig = {
    columns: ['Référence', 'Agent', 'Origine', 'Accueil', 'Date effet', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.careersService.getMovesByType('Détachement').subscribe((items: CareerMove[]) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((m) => [m.reference, m.agent, m.from || '—', m.to, m.effectiveDate, m.status]),
      };
    });
  }
}
