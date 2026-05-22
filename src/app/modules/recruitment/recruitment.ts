import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RecruitmentService } from './recruitment.service';
import { ApplicationsPage } from './pages/applications/applications';
import { CampaignsPage } from './pages/campaigns/campaigns';
import { RecruitmentCommissionsPage } from './pages/commissions/commissions';
import { OnboardingPage } from './pages/onboarding/onboarding';

type RecruitmentTab = 'applications' | 'campaigns' | 'commissions' | 'onboarding';

/**
 * Page « Recrutement » unifiee : cockpit KPI + 4 onglets back-office
 * (Candidatures, Campagnes, Commissions, Integration). Le Portail candidat
 * reste une page distincte (espace des candidats externes).
 */
@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, ApplicationsPage, CampaignsPage, RecruitmentCommissionsPage, OnboardingPage],
  templateUrl: './recruitment.html',
})
export class RecruitmentPage implements OnInit {
  private route = inject(ActivatedRoute);
  private recruitmentService = inject(RecruitmentService);

  activeTab: RecruitmentTab = 'applications';
  applicationsCount = 0;
  campaignsCount = 0;
  commissionsCount = 0;
  onboardingCount = 0;

  ngOnInit(): void {
    const routeTab = this.route.snapshot.data['recruitmentTab'];
    if (
      routeTab === 'applications' ||
      routeTab === 'campaigns' ||
      routeTab === 'commissions' ||
      routeTab === 'onboarding'
    ) {
      this.activeTab = routeTab;
    }
    this.loadKpis();
  }

  setTab(tab: RecruitmentTab): void {
    this.activeTab = tab;
  }

  private loadKpis(): void {
    this.recruitmentService
      .getApplications({ page: 1, limit: 500, sortBy: 'receivedOn', sortOrder: 'desc' })
      .subscribe({
        next: (items) => (this.applicationsCount = items.length),
        error: () => (this.applicationsCount = 0),
      });
    this.recruitmentService
      .getCampaigns({ page: 1, limit: 200, sortBy: 'startDate', sortOrder: 'desc' })
      .subscribe({
        next: (items) => (this.campaignsCount = items.length),
        error: () => (this.campaignsCount = 0),
      });
    this.recruitmentService.getOnboarding({ page: 1, limit: 200 }).subscribe({
      next: (items) => (this.onboardingCount = items.length),
      error: () => (this.onboardingCount = 0),
    });
    this.commissionsCount = this.readCommissionsCount();
  }

  private readCommissionsCount(): number {
    try {
      const raw = window.localStorage.getItem('rh_dev_recruitment_commissions');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  }
}
