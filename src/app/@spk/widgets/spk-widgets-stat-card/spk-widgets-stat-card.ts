import { Component, input } from '@angular/core';
interface StatCard {
  title: string;       // e.g. "Services"
  value: string;       // e.g. "$124", "21%", "24K"
  icon: string;        // icon class, e.g. "si si-basket-loaded"
  footerIcon: string;  // footer icon class
  footerText: string;  // footer label
  footerColor: string; // footer icon color class
}
@Component({
  selector: 'spk-widgets-stat-card',
  imports: [],
  templateUrl: './spk-widgets-stat-card.html',
  styleUrl: './spk-widgets-stat-card.scss',
})
export class SpkWidgetsStatCard {
  data = input<StatCard>()
}
