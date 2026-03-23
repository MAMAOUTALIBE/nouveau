import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { WorkflowsService } from '../../workflows.service';

@Component({
  selector: 'app-workflow-instances',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './workflow-instances.html',
})
export class WorkflowInstancesPage implements OnInit {
  private workflowsService = inject(WorkflowsService);

  gridConfig = {
    columns: ['ID', 'Workflow', 'Demandeur', 'Créé le', 'Étape actuelle', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.workflowsService.getInstances().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((i) => [i.id, i.definition, i.requester, i.createdOn, i.currentStep, i.status]),
      };
    });
  }
}
