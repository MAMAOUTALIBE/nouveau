import { NgClass } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
    selector: 'spk-dashboard-varticalcards',
    imports: [NgClass],
    templateUrl: './dashboard-varticalcards.html',
    styleUrl: './dashboard-varticalcards.scss'
})
export class DashboardVarticalcards {
   avatar = input<string>('');
   name = input<string>('');
   userId = input<string>('');
   status = input<string>(''); // 'paid' or 'pending'
   bgClass = input<string>('');
   textcolor = input<string>('');

}


