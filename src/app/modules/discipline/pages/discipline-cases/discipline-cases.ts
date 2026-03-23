import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { DisciplineService } from '../../discipline.service';

@Component({
  selector: 'app-discipline-cases',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './discipline-cases.html',
})
export class DisciplineCasesPage implements OnInit {
  private disciplineService = inject(DisciplineService);

  gridConfig = {
    columns: ['Référence', 'Agent', 'Motif', 'Ouvert le', 'Statut', 'Sanction'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.disciplineService.getCases().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((c) => [
          c.reference,
          c.agent,
          c.infraction,
          c.openedOn,
          c.status,
          c.sanction || '—',
        ]),
      };
    });
  }
}
