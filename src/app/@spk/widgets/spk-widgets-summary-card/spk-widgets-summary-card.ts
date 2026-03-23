import { Component, input } from '@angular/core';
interface SummaryCard {
  title: string;        // e.g. "New users"
  value: string;        // e.g. "3,672", "$89,265"
  icon: string;         // icon class, e.g. "mdi mdi-account-multiple"
  iconColor: string;    // e.g. "text-primary"
  shadowColor: string;  // e.g. "text-primary-shadow"
  subtitle: string;     // e.g. "Monthly users"
  footerValue: string;  // e.g. "50%", "$7,893"
}

@Component({
  selector: 'spk-widgets-summary-card',
  imports: [],
  templateUrl: './spk-widgets-summary-card.html',
  styleUrl: './spk-widgets-summary-card.scss',
})
export class SpkWidgetsSummaryCard {
  data = input<SummaryCard>()
}
