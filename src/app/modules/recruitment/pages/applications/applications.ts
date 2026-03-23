import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { RecruitmentService } from '../../recruitment.service';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './applications.html',
})
export class ApplicationsPage implements OnInit {
  private recruitmentService = inject(RecruitmentService);

  gridConfig = {
    columns: ['Référence', 'Candidat', 'Poste', 'Campagne', 'Statut', 'Reçu le'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.recruitmentService.getApplications().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((a) => [
          a.reference,
          a.candidate,
          a.position,
          a.campaign,
          a.status,
          a.receivedOn,
        ]),
      };
    });
  }
}
