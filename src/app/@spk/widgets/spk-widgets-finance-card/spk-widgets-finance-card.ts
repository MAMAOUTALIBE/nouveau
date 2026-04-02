import { Component, input } from '@angular/core';
interface FinanceCard {
  title: string;       // e.g. "Total Revenue"
  value: string;       // e.g. "$125.465", "62%"
  icon: string;        // e.g. "ti-bar-chart"
  iconColor: string;   // e.g. "text-primary"
  bgColor: string;     // e.g. "bg-primary-transparent"
}

@Component({
  selector: 'spk-widgets-finance-card',
  imports: [],
  templateUrl: './spk-widgets-finance-card.html',
  styleUrl: './spk-widgets-finance-card.scss',
})
export class SpkWidgetsFinanceCard {
  data = input<FinanceCard>()
}
