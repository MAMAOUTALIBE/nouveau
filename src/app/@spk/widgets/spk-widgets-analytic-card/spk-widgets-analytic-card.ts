import { Component, input } from '@angular/core';
interface AnalyticsCard {
  title: string;
  value: string;
  change: string;
  changeColor: string;
  description: string;
  chartBg: string;
  chartIcon: string;
  chartColor: string;
  progressColor: string;
  progressWidth: string;
  progressLabel: string;
}

@Component({
  selector: 'spk-widgets-analytic-card',
  imports: [],
  templateUrl: './spk-widgets-analytic-card.html',
  styleUrl: './spk-widgets-analytic-card.scss',
})
export class SpkWidgetsAnalyticCard {
  data = input<AnalyticsCard>()
}
