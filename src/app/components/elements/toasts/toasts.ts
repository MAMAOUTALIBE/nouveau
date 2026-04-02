import { ChangeDetectorRef, Component } from '@angular/core';
import * as prismCode from "../../../shared/data/prism/ui-elements/toasts";
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { SpkToast } from '../../../@spk/reusable-ui-elements/spk-toast/spk-toast';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  standalone: true,
  imports: [SpkToast, NgbToastModule, ShowcodeCard],
  templateUrl: './toasts.html',
  styleUrls: ['./toasts.scss']
})
export class Toasts {
  prismCodeData = prismCode;

  // Boolean flags for "Basic" toasts that aren't dynamic
  showBasic = true;
  showTranslucent = true;
  showContent = true;
  showStack1 = true;
  showStack2 = true;
  showCustomClose = true;

  // Flags for the "Color Schemes" static examples
  showColors = { primary: true, secondary: true, success: true, info: true };

  constructor(public toastService: ToastService, private cdr: ChangeDetectorRef) { }


  triggerToast(color: string, isSolid: boolean = false, pos: string = 'top-end', img: string = './assets/images/brand-logos/toggle-white.png') {
    const styleClass = isSolid ? `bg-${color} text-fixed-white` : `bg-${color}-transparent`;

    this.toastService.show('Notification message received.', {
      buttonClass: `toast colored-toast mb-2 ${styleClass}`,
      position: pos,
      toastImage: img
    });

    setTimeout(() => {
      this.cdr.detectChanges();
    }, 3100);
  }
  // Prevent close for content interaction
  preventClose(event: any): void {
    event.stopPropagation();
  }
}
