import { Component, input } from '@angular/core';
export interface PricingPlan {
  name: string;
  monthlyPrice: string; // Changed to string to support formatting/commas
  yearlyPrice: string;  // Changed to string to support formatting/commas
  description: string;
  isPopular: boolean;
  domains: string;
  apps: number;         // Kept as number per your requirement
  databases: number;    // Kept as number per your requirement
}

@Component({
  selector: 'spk-pricing-card',
  imports: [],
  templateUrl: './spk-pricing-card.html',
  styleUrl: './spk-pricing-card.scss',
})
export class SpkPricingCard {
  plan = input<PricingPlan>();
  isYearly = input<boolean>(false);
}
