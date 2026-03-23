import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { TrainingService } from '../../training.service';

@Component({
  selector: 'app-training-catalog',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './training-catalog.html',
})
export class TrainingCatalogPage implements OnInit {
  private trainingService = inject(TrainingService);

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Durée', 'Modalité', 'Domaine'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.trainingService.getCatalog().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((c) => [c.code, c.title, c.duration, c.modality, c.domain]),
      };
    });
  }
}
