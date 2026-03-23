import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, Validators, FormBuilder, FormGroup } from '@angular/forms';

import { MaterialModuleModule } from '../../../../material-module/material-module.module';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkNgSelect } from "../../../../@spk/plugins/spk-ng-select/spk-ng-select";

@Component({
    selector: 'app-check-out',
    imports: [FormsModule, ReactiveFormsModule, MaterialModuleModule, NgbNavModule, SpkNgSelect],
    templateUrl: './check-out.html',
    styleUrls: ['./check-out.scss']
})
export class CheckOut implements OnInit {
  private _formBuilder = inject(FormBuilder);

  firstFormGroup!: FormGroup; // Use the definite assignment operator
  secondFormGroup!: FormGroup; // Use the definite assignment operator

  isLinear = false;

  ngOnInit(): void {
    this.firstFormGroup = this._formBuilder.group({
      firstCtrl: ['', Validators.required],
    });

    this.secondFormGroup = this._formBuilder.group({
      secondCtrl: ['', Validators.required],
    });
  }


  products = [
    {
      id: 1,
      name: 'Flowerpot',
      image: './assets/images/ecommerce/23.jpg',
      quantity: 2,
      price: 290,
    },
    {
      id: 2,
      name: 'White Chair',
      image: './assets/images/ecommerce/17.jpg',
      quantity: 2,
      price: 124,
    },
  ];

  increaseQuantity(index: number) {
    this.products[index].quantity++;
  }

  decreaseQuantity(index: number) {
    if (this.products[index].quantity > 1) {
      this.products[index].quantity--;
    }
  }


  countries = [
  { value: 'Choice 1', label: 'USA' },
  { value: 'Choice 2', label: 'Italy' },
  { value: 'Choice 3', label: 'Australia' },
  { value: 'Choice 4', label: 'England' },
  { value: 'Choice 5', label: 'Spain' }
];

stateOptions = [
  { value: 'Choice 1', label: 'California' },
  { value: 'Choice 2', label: 'Alaska' },
  { value: 'Choice 3', label: 'Colorado' },
  { value: 'Choice 4', label: 'Arizona' },
  { value: 'Choice 5', label: 'Delaware' }
];


}


