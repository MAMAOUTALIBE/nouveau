import { Component } from '@angular/core';
import { NgbDateStruct, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as PrismCode from '../../../../shared/data/prism/forms/form-elements/inputs';
import { ShowcodeCard } from '../../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-inputs',
    imports: [ NgbModule, ReactiveFormsModule, FormsModule, ShowcodeCard],
    templateUrl: './inputs.html',
    styleUrl: './inputs.scss'
})
export class Inputs {
  prsimCodeData = PrismCode;
  model!: NgbDateStruct;
  timePicker: Date | null = null;
  dateTimeValue: Date = new Date();

}


