import { Component, input } from '@angular/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-popovers',
  standalone: true,
  imports: [NgbModule],
  templateUrl: './spk-popovers.html',
  styleUrl: './spk-popovers.scss'
})
export class SpkPopovers {
   buttonText = input<string>('');
   title = input<string>('Popover Title');
   content = input<string>('Popover Content');
   placement = input<string>('top');
   popoverClass = input<string>('');
   color = input<string>('');
   class = input<string>('btn-outline-primary');
   autoClose = input<boolean | string>(true);
}
