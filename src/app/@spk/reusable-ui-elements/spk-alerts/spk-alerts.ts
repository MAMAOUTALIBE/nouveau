import { Component, input, output } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-alerts',
  standalone: true,
  imports: [NgbAlertModule],
  templateUrl: './spk-alerts.html',
  styleUrl: './spk-alerts.scss'
})
export class SpkAlerts {
   isDismissible = input(false);
   variant = input<string>('');
  // Output remains an EventEmitter (signals don't replace outputs)
  close = output<void>();
   title = input<string>('');
   linkText = input<string>('');
   buttonClass = input<string>('');


  onClose() {
    this.close.emit(); // Emit close event
  }
}
