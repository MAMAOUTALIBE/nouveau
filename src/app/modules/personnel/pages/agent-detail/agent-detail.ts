import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { ActivatedRoute } from '@angular/router';
import {
  AgentCareerEvent,
  AgentDetail,
  AgentDocument,
  AgentEducation,
  PersonnelService,
} from '../../personnel.service';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [CommonModule, NgbNavModule, SpkReusableTables],
  templateUrl: './agent-detail.html',
})
export class AgentDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private personnelService = inject(PersonnelService);

  agent: AgentDetail = {
    id: '',
    matricule: '',
    fullName: '',
    direction: '',
    position: '',
    unit: '',
    status: '',
    manager: '',
    email: '',
    phone: '',
    photoUrl: './assets/images/faces/profile.jpg',
    identity: {
      identityType: '',
      identityNumber: '',
      birthDate: '',
      birthPlace: '',
      nationality: '',
    },
    administrative: {
      hireDate: '',
      contractType: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
    },
    educations: [],
    careerEvents: [],
    documents: [],
  };

  careerEvents: AgentCareerEvent[] = [];
  documents: AgentDocument[] = [];
  educations: AgentEducation[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) return;

      this.personnelService.getAgentById(id).subscribe((details) => {
        if (!details) return;
        // Defers state mutation to avoid NG0100 in dev mode when fallback streams emit synchronously.
        queueMicrotask(() => {
          this.agent = details;
          this.careerEvents = details.careerEvents || [];
          this.documents = details.documents || [];
          this.educations = details.educations || [];
        });
      });
    });
  }
}
