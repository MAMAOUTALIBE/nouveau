
import { Component, input } from '@angular/core';

@Component({
  selector: 'spk-breadcrumb',
  standalone: true,
  imports: [],
  templateUrl: './spk-breadcrumb.html',
  styleUrl: './spk-breadcrumb.scss'
})
export class SpkBreadcrumb {
 olClass = input<string>('');
 divider = input<string>('/'); // default divider
}
