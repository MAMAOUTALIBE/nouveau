import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { SpkNgSelect } from '../../../../@spk/plugins/spk-ng-select/spk-ng-select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PersonnelService } from '../../personnel.service';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [GridJsAngularComponent, SpkNgSelect, FormsModule, RouterLink],
  templateUrl: './agent-list.html',
})
export class AgentListPage implements OnInit {
  private personnelService = inject(PersonnelService);

  directions = [
    { value: 'all', label: 'Toutes les directions' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'drh', label: 'Direction RH' },
  ];

  statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'leave', label: 'En absence' },
  ];

  gridConfig = {
    columns: ['Matricule', 'Nom complet', 'Direction', 'Poste', 'Statut', 'Manager'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.personnelService.getAgents().subscribe((agents) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: agents.map((agent) => [
          agent.matricule,
          agent.fullName,
          agent.direction,
          agent.position,
          agent.status,
          agent.manager,
        ]),
      };
    });
  }
}
