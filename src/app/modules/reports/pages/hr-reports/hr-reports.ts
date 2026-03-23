import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hr-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hr-reports.html',
})
export class HrReportsPage {
  kpis = [
    { label: 'Effectif total', value: 320, badge: 'bg-primary' },
    { label: 'Agents actifs', value: 305, badge: 'bg-success' },
    { label: 'Absences en cours', value: 12, badge: 'bg-warning' },
    { label: 'Postes vacants', value: 8, badge: 'bg-danger' },
  ];

  reports = [
    { name: 'Effectifs par direction', format: 'PDF' },
    { name: 'Mouvements de carrière', format: 'Excel' },
    { name: 'Absences mensuelles', format: 'PDF' },
  ];
}
