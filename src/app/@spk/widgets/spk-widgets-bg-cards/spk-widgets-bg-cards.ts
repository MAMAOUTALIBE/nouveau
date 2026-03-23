import { Component, input } from '@angular/core';
 interface DashboardCard {
  title: string;    
  value: string;    
  icon: string;     
  gradient: string; 
}

@Component({
  selector: 'spk-widgets-bg-cards',
  imports: [],
  templateUrl: './spk-widgets-bg-cards.html',
  styleUrl: './spk-widgets-bg-cards.scss',
})
export class SpkWidgetsBgCards {
data=input<DashboardCard>()
}
