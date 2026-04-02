import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShowcodeCard } from "../../../shared/components/showcode-card/showcode-card";
import { SpkNgSelect } from "../../../@spk/plugins/spk-ng-select/spk-ng-select";
import * as prismCodeData from '../../../shared/data/prism/forms/form_layouts'

@Component({
  selector: 'app-forms-layout',
  imports: [  FormsModule, ReactiveFormsModule, ShowcodeCard, SpkNgSelect],
  templateUrl: './forms-layout.html',
  styleUrl: './forms-layout.scss'
})
export class FormsLayout {
  prismCode = prismCodeData;
  Preference = [
    { label: 'Choose...', value: 1 },
    { label: 'One', value: 2 },
    { label: 'Two', value: 3 },
    { label: 'Three', value: 4 },
  ]

}


