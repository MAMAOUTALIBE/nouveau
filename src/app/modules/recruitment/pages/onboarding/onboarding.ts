import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecruitmentService, OnboardingItem } from '../../recruitment.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.html',
})
export class OnboardingPage implements OnInit {
  private recruitmentService = inject(RecruitmentService);

  items: OnboardingItem[] = [];

  ngOnInit(): void {
    this.recruitmentService.getOnboarding().subscribe((items) => (this.items = items));
  }
}
