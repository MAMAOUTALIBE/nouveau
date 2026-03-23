import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { CareerMove, CareersService } from '../../careers.service';

@Component({
  selector: 'app-advancements',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './advancements.html',
})
export class AdvancementsPage implements OnInit {
  private careersService = inject(CareersService);

  gridConfig = {
    columns: ['Référence', 'Agent', 'Grade actuel', 'Nouveau grade', 'Date effet', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.load();
  }

  private load() {
    this.careersService.getMovesByType('Avancement').subscribe((items: CareerMove[]) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((m) => [m.reference, m.agent, m.from || '—', m.to, m.effectiveDate, m.status]),
      };
    });
  }
}
