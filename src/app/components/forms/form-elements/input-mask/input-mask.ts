import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { NgbModule, NgbDateStruct, NgbTimeStruct, NgbCalendar, NgbTimepickerConfig } from '@ng-bootstrap/ng-bootstrap';
import { InputMaskModule,createMask } from '@ngneat/input-mask';

@Component({
    selector: 'app-input-mask',
    imports: [ NgbModule, FormsModule, ReactiveFormsModule, InputMaskModule],
    templateUrl: './input-mask.html',
    styleUrl: './input-mask.scss'
})
export class InputMask {
  private calendar = inject(NgbCalendar);

  model1!: NgbDateStruct;
  model!: NgbDateStruct;
  // today = this.calendar.getToday();
  selectedDate: any;
  datePickerConfig: any;
  time: NgbTimeStruct = { hour: 13, minute: 30, second: 30 };
  seconds = true;
  time1 = { hour: 13, minute: 30 };
  spinners = true;
  time2: NgbTimeStruct = { hour: 13, minute: 30, second: 0 };

  dateInputMask = createMask<Date>({
    alias: 'datetime',
    inputFormat: 'dd-mm-yyyy',
    parser: (value: string) => {
      const values = value.split('/');
      const year = +values[2];
      const month = +values[1] - 1;
      const date = +values[0];
      return new Date(year, month, date);
    }
  });
  // dATEFORMATE
  dateInputMask1 = createMask<Date>({
    alias: 'datetime',
    inputFormat: 'mm-dd-yyyy',
    parser: (value: string) => {
      const values = value.split('/');
      const year = +values[2];
      const month = +values[1] - 1;
      const date = +values[0];
      return new Date(month,date,year);
    }
  });

  //   // monthYear
dateInputMask2 = createMask<Date>({
  alias: 'datetime',
  inputFormat: 'mm-yy',
  parser: (value: string) => {
    const values = value.split('/');
    const year = +values[2];
    const month = +values[1] - 1;
    const date = +values[0];
    return new Date(month,year);
  }
});

  ngOnInit(): void {
    this.datePickerConfig = {
      firstDayOfWeek: 'su',
      monthFormat: 'mmm, yyyy',
      disableKeypress: false,
      allowMultiSelect: false,
      closeOnSelect: undefined,
      closeOnSelectDelay: 100,
      onOpenDelay: 0,
      weekDayFormat: 'ddd',
      appendTo: document.body,
      drops: 'down',
      opens: 'right',
      showNearMonthDays: true,
      showWeekNumbers: false,
      enableMonthSelector: true,
      format: 'mm-dd-yyyy',
      yearFormat: 'yyyy',
      showGoToCurrent: true,
      dayBtnFormat: 'dd',
      monthBtnFormat: 'mmm',
      hours12Format: 'hh',
      hours24Format: 'HH',
      meridiemFormat: 'A',
      minutesFormat: 'mm',
      minutesInterval: 1,
      secondsFormat: 'ss',
      secondsInterval: 1,
      showSeconds: false,
      showTwentyFourHours: true,
      timeSeparator: ':',
      multipleYearsNavigateBy: 10,
      showMultipleYearsNavigation: false,
    };
  }

  licenseInputMask = createMask('[9-]AAA-999-AAAA');
  licenseFC = new FormControl('');

  ipAddressMask = createMask({ alias: 'ip' });
  ipFC = new FormControl('');

  phoneMask = createMask({ alias: 'US(+1)99 9999 9999' });
  phoneFC = new FormControl('');

  currencyInputMask = createMask({
    alias: 'numeric',
    groupSeparator: ',',
    digits: 2,
    digitsOptional: false,
    prefix: '$ ',
    placeholder: '0',
  });
  currencyFC = new FormControl('');

  dateFC = new FormControl('');
}


