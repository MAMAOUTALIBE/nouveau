import { Component, OnInit, inject } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { ActivatedRoute } from '@angular/router';
import { AgentCareerEvent, AgentDetail, AgentDocument, PersonnelService } from '../../personnel.service';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [NgbNavModule, SpkReusableTables],
  templateUrl: './agent-detail.html',
})
export class AgentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private personnelService = inject(PersonnelService);

  agent: AgentDetail = {
    id: '',
    matricule: '',
    fullName: '',
    position: '',
    unit: '',
    email: '',
    phone: '',
    photoUrl: './assets/images/faces/profile.jpg',
    careerEvents: [],
    documents: [],
  };

  careerEvents: AgentCareerEvent[] = [];
  documents: AgentDocument[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;

      this.personnelService.getAgentById(id).subscribe((details) => {
        if (!details) return;
        this.agent = details;
        this.careerEvents = details.careerEvents || [];
        this.documents = details.documents || [];
      });
    });
  }
}
