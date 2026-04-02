import { Component, input } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-progressbar',
  standalone: true,
  imports: [NgbModule],
  templateUrl: './spk-progressbar.html',
  styleUrl: './spk-progressbar.scss'
})
export class SpkProgressbar {
  progressBars = input<{ type: string; value: number }[]>([], { alias: 'progressBars' });
  class = input<string>('progress');
  stackedClass = input<string>('');
  type = input<string>('primary')
  height = input<string>('')
  value = input<number>(0);
  showValue = input<boolean>(false); // Whether to show the percentage label
  striped = input<boolean>(false); // Whether to show the percentage label
  stackedprogress = input<boolean>(false); // Whether to show the percentage label
  animated = input<boolean>(false); // Whether to show the percentage label
}
