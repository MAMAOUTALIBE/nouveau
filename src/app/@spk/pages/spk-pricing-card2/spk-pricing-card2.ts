import { Component, input } from '@angular/core';
export interface Feature {
  label: string;
  badge?: string;
  price: string;
  isSelected: boolean;
  isPrimary?: boolean; // For the blue highlighted rows
}

export interface PricingPlan {
  name: string;
  subTitle: string;
  bestPrice: string;
  vatTax: string;
  total: string;
  buttonText: string;
  isAdvanced?: boolean; // For the card border
  statusBadge?: string; // e.g., "New"
  features: Feature[];
}
@Component({
  selector: 'spk-pricing-card2',
  imports: [],
  templateUrl: './spk-pricing-card2.html',
  styleUrl: './spk-pricing-card2.scss',
})
export class SpkPricingCard2 {
  data = input<PricingPlan>()
}
