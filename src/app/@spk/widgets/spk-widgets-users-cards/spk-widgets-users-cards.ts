import { Component, input } from '@angular/core';
interface DashboardMetric {
  title: string;
  value: string;
  change: string;
  changeClass: string;
  iconClass: string;
  progressClass: string;
  progressWidth: string;
  monthly: string;
}

@Component({
  selector: 'spk-widgets-users-cards',
  imports: [],
  templateUrl: './spk-widgets-users-cards.html',
  styleUrl: './spk-widgets-users-cards.scss',
})
export class SpkWidgetsUsersCards {
  data = input<DashboardMetric>()
}
