import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { TrainingService } from '../../training.service';

@Component({
  selector: 'app-training-sessions',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './training-sessions.html',
})
export class TrainingSessionsPage implements OnInit {
  private trainingService = inject(TrainingService);

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Dates', 'Lieu', 'Places', 'Inscrits', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.trainingService.getSessions().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((s) => [
          s.code,
          s.title,
          s.dates,
          s.location,
          s.seats,
          s.enrolled,
          s.status,
        ]),
      };
    });
  }
}
