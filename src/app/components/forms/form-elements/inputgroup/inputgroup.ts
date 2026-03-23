import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as PrismCode from '../../../../shared/data/prism/forms/form-elements/inputgroup';
import { ShowcodeCard } from '../../../../shared/components/showcode-card/showcode-card';
import { SpkDropdowns } from "../../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-inputgroup',
    imports: [ NgbModule, ReactiveFormsModule, FormsModule, ShowcodeCard, SpkDropdowns],
    templateUrl: './inputgroup.html',
    styleUrl: './inputgroup.scss'
})
export class Inputgroup {
  prsimCodeData = PrismCode;

  selectedSimpleItem = 'Choose...';
  simpleItems:any = [];
  // Select2
  selectedSimpleItem1 = 'Choose...';
  simpleItems1:any = [];
   // Select3
   selectedSimpleItem3 = 'Choose...';
   simpleItems3:any = [];
    // Select4
  selectedSimpleItem4 = 'Choose...';
  simpleItems4:any = [];


  ngOnInit() {
    this.simpleItems = ['Choose...','one','two','three'];
    this.simpleItems1 = ['Choose...','one','two','three'];
    this.simpleItems3 = ['Choose...','one','two','three'];
    this.simpleItems4 = ['Choose...','one','two','three'];
}
}


