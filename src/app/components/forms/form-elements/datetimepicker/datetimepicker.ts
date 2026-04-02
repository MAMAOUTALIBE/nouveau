import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MaterialModuleModule } from '../../../../material-module/material-module.module';
import { SpkFlatpickr } from "../../../../@spk/plugins/spk-flatpickr/spk-flatpickr";

@Component({
    selector: 'app-datetimepicker',
    imports: [MaterialModuleModule, FormsModule, ReactiveFormsModule, MatDatepickerModule,  SpkFlatpickr],
    providers: [],
    templateUrl: './datetimepicker.html',
    styleUrl: './datetimepicker.scss'
})
export class Datetimepicker {

 // timepicker
 basicDemoValue = '2017-01-01';
 modelValueAsDate: Date = new Date();
 dateTimeValue: Date = new Date();
 dateTimeValue1: Date = new Date();
 multiDates: Date[] = [new Date(), (new Date() as any)['fp_incr'](10)];
 rangeValue1 = '2017-01-01';
 rangeValue: { from: Date; to: Date } = {
   from: new Date(),
   to: (new Date() as any)['fp_incr'](10)
 };
 inlineDatePicker: Date = new Date();
 timePicker: Date | null = null;
 timePicker1: Date | null = null;
 timePicker2: Date | null = null;
 timePicker3: Date | null = null;
 timePicker4: Date | null = null;


 min='16:00 pm';
 max='22:00 pm';
 min1='04:00';
 max1='10:00';
 basicDemoValue1= '10:00';

}


