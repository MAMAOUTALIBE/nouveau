import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-agent-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="row row-sm">
      <div class="col-xl-12">
        <div class="card custom-card">
          <div class="card-header justify-content-between">
            <div class="card-title">Portail agent</div>
            <div class="btn-list">
              <button class="btn btn-primary">Nouvelle demande</button>
              <button class="btn btn-outline-primary">Mes documents</button>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-4" *ngFor="let item of quick">
                <div class="card shadow-none border p-3">
                  <div class="fw-semibold mb-1">{{ item.label }}</div>
                  <div class="text-muted fs-12 mb-2">{{ item.desc }}</div>
                  <button class="btn btn-sm btn-primary-light">{{ item.cta }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AgentPortalPage {
  quick = [
    { label: 'Demander une absence', desc: 'Congés, missions, maladie', cta: 'Ouvrir' },
    { label: 'Consulter mes bulletins', desc: 'Documents administratifs', cta: 'Voir' },
    { label: 'Mettre à jour mon profil', desc: 'Coordonnées, situation', cta: 'Mettre à jour' },
  ];
}
