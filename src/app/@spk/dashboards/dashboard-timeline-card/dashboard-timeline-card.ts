import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'spk-dashboard-timeline-card',
    imports: [NgClass],
    templateUrl: './dashboard-timeline-card.html',
    styleUrl: './dashboard-timeline-card.scss'
})
export class DashboardTimelineCard {
  readonly events = input<Array<{
    iconClass: string;
    name: string;
    iconState: string;
    description: string;
    date: string;
}>>([]);

}


