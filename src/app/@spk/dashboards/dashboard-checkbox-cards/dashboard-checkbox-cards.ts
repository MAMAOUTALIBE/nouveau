import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'spk-dashboard-checkbox-cards',
    imports: [NgClass],
    templateUrl: './dashboard-checkbox-cards.html',
    styleUrl: './dashboard-checkbox-cards.scss'
})
export class DashboardCheckboxCards {
   items = input<Array<{ label: string; checked: boolean; badgeText?: string; badgeColor?: string;}>>([]);
}


