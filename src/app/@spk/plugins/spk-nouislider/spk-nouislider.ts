import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NouisliderModule } from 'ng2-nouislider';
export type TwoTooltips = [boolean, boolean];
@Component({
  selector: 'spk-nouislider',
  imports: [NouisliderModule, FormsModule],
  templateUrl: './spk-nouislider.html',
  styleUrl: './spk-nouislider.scss'
})
export class SpkNouislider {
  id = input<string>();
  connect = input<boolean>(false);
  min = input<number>(0);
  step = input<number>(0);
  max = input<number>(10000000000000000);
  someRange = model<number[]>([]);
  tooltips=input<TwoTooltips>([false, false]);

  
}
