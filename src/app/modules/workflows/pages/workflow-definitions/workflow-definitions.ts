import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { WorkflowsService } from '../../workflows.service';

@Component({
  selector: 'app-workflow-definitions',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './workflow-definitions.html',
})
export class WorkflowDefinitionsPage implements OnInit {
  private workflowsService = inject(WorkflowsService);

  gridConfig = {
    columns: ['Code', 'Nom', 'Étapes', 'Usage', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.workflowsService.getDefinitions().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((d) => [d.code, d.name, d.steps, d.usedFor, d.status]),
      };
    });
  }
}
