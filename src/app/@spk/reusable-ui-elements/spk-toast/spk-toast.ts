import { CommonModule } from '@angular/common';
import { Component, input, output, signal } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-toast',
  standalone: true,
  imports: [NgbToastModule, CommonModule],
  templateUrl: './spk-toast.html',
  styleUrl: './spk-toast.scss'
})
export class SpkToast {
  // Input signals
  title = input(''); // Title of the toast
  content = input(''); // Content of the toast
  header = input(''); // Header of the toast
  buttonClass = input(''); // Button class
  btnClass = input(''); // Close button class
  content1 = input(''); // Alternative content
  autohide = input(false); // Autohide functionality
  toastImage = input(false); // Toast image toggle

  // Output emitters
  hide = output<void>(); // Emit event when the toast is hidden
  closeToast = output<void>(); // Emit event when close button is clicked

  // Signal for internal state
  show = signal(true);

  onClose() {
    this.show.set(false); // Hide the toast
    this.closeToast.emit(); // Emit close event to parent
  }

  onHide() {
    this.show.set(false);
    this.hide.emit();
  }

  hidden() {
    this.show.set(false);
  }
}

