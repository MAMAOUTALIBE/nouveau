
import { Component, input } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import flatpickr from 'flatpickr';
import { FlatpickrDefaults, FlatpickrDirective } from 'angularx-flatpickr';

@Component({
  selector: 'spk-flatpickr',
  standalone: true,
  imports: [FlatpickrDirective, FormsModule, ReactiveFormsModule],
  providers: [
    FlatpickrDefaults,
  ],
  templateUrl: './spk-flatpickr.html',
  styleUrl: './spk-flatpickr.scss'
})
export class SpkFlatpickr {
  altInput = input<boolean>(false);
  convertModelValue = input<boolean>(true);
  enableTime = input<boolean>(true);
  noCalendar = input<boolean>(false);
  inline = input<boolean>(false);
  class = input<string>('');
  dateFormat = input<string>('');
  placeholder = input<string>('');
  mode = input.required<'single' | 'multiple' | 'range'>();

  inlineDatePicker: boolean = false;
  weekNumbers!: true
  // selectedDate: Date | null = null;
  flatpickrOptions: any = {
    inline: true,

  };
  rangeValue = new Date();



  constructor() { }

  ngOnInit() {
    this.flatpickrOptions = {
      enableTime: true,
      noCalendar: true,
      dateFormat: 'H:i',

    }

    flatpickr('#inlinetime', this.flatpickrOptions);

    this.flatpickrOptions = {
      enableTime: true,
      dateFormat: 'Y-m-d', // Specify the format you want
      defaultDate: '2023-11-07 14:30', // Set the default/preloaded time (adjust this to your desired time)
      noCalendar: true,
    };

    flatpickr('#pretime', this.flatpickrOptions);
  }
}


