import { Component, input } from '@angular/core';
interface MetricCard {
  title: string;
  value: string;
  lastWeek: string;
  trendIcon: string;
  trendClass: string;
  trendValue: string;
  cardClass: string;
  iconClass: string;
}
@Component({
  selector: 'spk-widgets-metric-card',
  imports: [],
  templateUrl: './spk-widgets-metric-card.html',
  styleUrl: './spk-widgets-metric-card.scss',
})
export class SpkWidgetsMetricCard {
  data = input<MetricCard>()
}
