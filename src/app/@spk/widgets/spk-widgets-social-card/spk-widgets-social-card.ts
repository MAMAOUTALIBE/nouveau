import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
interface Metric {
  icon: string;        // CSS class for the icon
  title: string;       // Card title (e.g. "Total Shares")
  value: number;       // Numeric value (e.g. 678)
  badgeClass: string;  // Badge CSS class (e.g. "bg-success")
  badgeValue: string;  // Badge text (e.g. "+89%")
  subtitle: string;    // Supporting text (e.g. "From previous month")
}

@Component({
  selector: 'spk-widgets-social-card',
  imports: [DecimalPipe],
  templateUrl: './spk-widgets-social-card.html',
  styleUrl: './spk-widgets-social-card.scss',
})
export class SpkWidgetsSocialCard {
  data = input<Metric>()
}
