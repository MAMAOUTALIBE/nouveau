import { Component, OnInit, inject } from '@angular/core';
import { GridJsAngularComponent } from 'gridjs-angular';
import { RecruitmentService } from '../../recruitment.service';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [GridJsAngularComponent],
  templateUrl: './campaigns.html',
})
export class CampaignsPage implements OnInit {
  private recruitmentService = inject(RecruitmentService);

  gridConfig = {
    columns: ['Code', 'Intitulé', 'Direction', 'Ouvertures', 'Début', 'Fin', 'Statut'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [] as (string | number)[][],
  };

  ngOnInit(): void {
    this.recruitmentService.getCampaigns().subscribe((items) => {
      this.gridConfig = {
        ...this.gridConfig,
        data: items.map((c) => [
          c.code,
          c.title,
          c.department,
          c.openings,
          c.startDate,
          c.endDate,
          c.status,
        ]),
      };
    });
  }
}
