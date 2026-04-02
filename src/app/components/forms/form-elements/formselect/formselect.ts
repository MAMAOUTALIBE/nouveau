import { TagInputModule } from 'ngx-chips';
import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShowcodeCard } from '../../../../shared/components/showcode-card/showcode-card';
import * as prismCodeData from "../../../../shared/data/prism/forms/form-elements/formselect"
import { SpkNgSelect } from "../../../../@spk/plugins/spk-ng-select/spk-ng-select";
@Component({
  selector: 'app-formselect',
  imports: [ FormsModule, ReactiveFormsModule, ShowcodeCard, TagInputModule, SpkNgSelect],
  templateUrl: './formselect.html',
  styleUrl: './formselect.scss'
})
export class Formselect {
  prismCode = prismCodeData
  emails = ['abc@hotmail.com'];
  emailFormControl = new FormControl([
    'abc@hotmail.com'
  ]);
  emailTagValidator = (tag: any) => {
    const emailRegex =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.){3}[0-9]{1,3}|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;

    return emailRegex.test(tag.value)
      ? null : { email: true };
  };
  Optionsaddedviaconfig = [
    { label: 'Label Five', value: 1 },
    { label: 'Label Four', value: 2 },
    { label: 'Label One', value: 3 },
    { label: 'Label Six', value: 4 },
    { label: 'Label Three', value: 5 },
    { label: 'Label Two', value: 6 },
    { label: 'Label Zero', value: 7 },
  ]
  options = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
  ];
  selectedOption = [1]

  states = [
    { label: 'Alabama', value: 'AL' },
    { label: 'Alaska', value: 'AK' },
    { label: 'Arizona', value: 'AZ' },
    { label: 'Arkansas', value: 'AR' },
    { label: 'California', value: 'CA' },
    { label: 'Colorado', value: 'CO' },
    { label: 'Connecticut', value: 'CT' },
    { label: 'Delaware', value: 'DE' },
    { label: 'District of Columbia', value: 'DC' },
    { label: 'Florida', value: 'FL' },
    { label: 'Georgia', value: 'GA' },
    { label: 'Hawaii', value: 'HI' },
    { label: 'Idaho', value: 'ID' },
    { label: 'Illinois', value: 'IL' },
    { label: 'Indiana', value: 'IN' },
    { label: 'Iowa', value: 'IA' },
    { label: 'Kansas', value: 'KS' },
    { label: 'Kentucky', value: 'KY' },
    { label: 'Louisiana', value: 'LA' },
    { label: 'Maine', value: 'ME' },
    { label: 'Maryland', value: 'MD' },
    { label: 'Massachusetts', value: 'MA' },
    { label: 'Michigan', value: 'MI' },
    { label: 'Minnesota', value: 'MN' },
    { label: 'Mississippi', value: 'MS' },
    { label: 'Missouri', value: 'MO' },
    { label: 'Montana', value: 'MT' },
    { label: 'Nebraska', value: 'NE' },
    { label: 'Nevada', value: 'NV' },
    { label: 'New Hampshire', value: 'NH' },
    { label: 'New Jersey', value: 'NJ' },
    { label: 'New Mexico', value: 'NM' },
    { label: 'New York', value: 'NY' },
    { label: 'North Carolina', value: 'NC' },
    { label: 'North Dakota', value: 'ND' },
    { label: 'Ohio', value: 'OH' },
    { label: 'Oklahoma', value: 'OK' },
    { label: 'Oregon', value: 'OR' },
    { label: 'Pennsylvania', value: 'PA' },
    { label: 'Rhode Island', value: 'RI' },
    { label: 'South Carolina', value: 'SC' },
    { label: 'South Dakota', value: 'SD' },
    { label: 'Tennessee', value: 'TN' },
    { label: 'Texas', value: 'TX' },
    { label: 'Utah', value: 'UT' },
    { label: 'Vermont', value: 'VT' },
    { label: 'Virginia', value: 'VA' },
    { label: 'Washington', value: 'WA' },
    { label: 'West Virginia', value: 'WV' },
    { label: 'Wisconsin', value: 'WI' },
    { label: 'Wyoming', value: 'WY' }
  ]
  selectedstate = ['CA']
  selectedCompanies = [1, 2, 3];
  selected = [1]
  multipleSelect = [
    { label: 'Choice 1', value: 1 },
    { label: 'Choice 2', value: 2 },
    { label: 'Choice 3', value: 3 },
    { label: 'Choice 4', value: 4 },
    { label: 'Choice 5', value: 5 },
    { label: 'Choice 6', value: 6, disabled: true },
    // Add more options as needed
  ];
  multipleRemove = [
    { label: 'Choice 1', value: 1 },
    { label: 'Choice 2', value: 2 },
    { label: 'Choice 3', value: 3 },
    { label: 'Choice 4', value: 4 },
    // Add more options as needed
  ];
  accounts = [
    { label: 'UK', disabled: true },
    { label: 'London', value: 'London' },
    { label: 'Manchester', value: 'Manchester' },
    { label: 'Liverpool', value: 'Liverpool' },
    { label: 'FR', disabled: true },
    { label: 'Paris', value: 'Paris' },
    { label: 'Lyon', value: 'Lyon' },
    { label: 'Marseille', value: 'Marseille' },
    { label: 'US', disabled: true },
    { label: 'New York', value: 'New York' },
    { label: 'Washington', value: 'Washington', disabled: true },
    { label: 'Michigan', value: 'Michigan' },
    { label: 'SP', disabled: true },
    { label: 'Madrid', value: 'Madrid' },
    { label: 'Barcelona', value: 'Barcelona' },
    { label: 'Malaga', value: 'Malaga' },
    { label: 'CA', disabled: true },
    { label: 'Montreal', value: 'Montreal' },
    { label: 'Toronto', value: 'Toronto' },
    { label: 'Vancouver', value: 'Vancouver' },
  ];
  Single = [
    { label: 'Choice 1', value: 1 },
    { label: 'Choice 2', value: 2 },
    { label: 'Choice 3', value: 3 },
  ]
  cityOptions = [
    { label: 'Choose a city', value: '' },
    { label: 'UK', disabled: true },
    { label: 'London', value: 'London' },
    { label: 'Manchester', value: 'Manchester' },
    { label: 'Liverpool', value: 'Liverpool' },
    { label: 'FR', disabled: true },
    { label: 'Paris', value: 'Paris' },
    { label: 'Lyon', value: 'Lyon' },
    { label: 'Marseille', value: 'Marseille' },
    { label: 'US', disabled: true },
    { label: 'New York', value: 'New York' },
    { label: 'Washington', value: 'Washington', disabled: true },
    { label: 'Michigan', value: 'Michigan' },
    { label: 'SP', disabled: true },
    { label: 'Madrid', value: 'Madrid' },
    { label: 'Barcelona', value: 'Barcelona' },
    { label: 'Malaga', value: 'Malaga' },
    { label: 'CA', disabled: true },
    { label: 'Montreal', value: 'Montreal' },
    { label: 'Toronto', value: 'Toronto' },
    { label: 'Vancouver', value: 'Vancouver' },
  ];

  Passing = [
    { label: 'one', value: 1 },
    { label: 'two', value: 2 },
    { label: 'three', value: 3 },
    { label: 'four', value: 4 },
  ]
  selectedValues = [1, 2];
  PassingUnique = [
    { label: 'child-1', value: 1 },
    { label: 'child-2', value: 2 },
  ]
  selectedValues1 = [1, 2];
}
