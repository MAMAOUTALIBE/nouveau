import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'spk-dashboard-progress-card',
    imports: [NgClass],
    templateUrl: './dashboard-progress-card.html',
    styleUrl: './dashboard-progress-card.scss'
})
export class DashboardProgressCard {
   country = input<string>('');
   value = input<string>('');
   percentage = input<string>('');
   progreClass = input<string>('');
   trendIcon = input<string>('');
   trendColor = input<string>('');
   progressStriped = input<string>('');
   progressBarColor = input<string>('');
   progressWidth = input<string>('');
}


