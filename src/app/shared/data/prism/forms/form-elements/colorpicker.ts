export let BootstrapColorPicker = {
    html: `      <input type="color" class="form-control form-control-color border-0" id="exampleColorInput" value="#136ad0"
          title="Choose your color">`
}
export let Classic = {
    html: `   <div>
          <div class="theme-container"></div>
          <div class="pickr-container example-picker">
            <form class="example-form2" [formGroup]="exampleForm">
              <mat-form-field class="example-full-width">
                <mat-label>Color</mat-label>
                <input matInput formControlName="inputCtrl" />
                <ngx-colors class="suffix" matSuffix ngx-colors-trigger formControlName="pickerCtrl"></ngx-colors>
                @if (this.exampleForm.controls['inputCtrl'].hasError('invalidColor')) {
                <mat-error>
                  The color is invalid.
                </mat-error>
                }
              </mat-form-field>
            </form>
          </div>
        </div>
        <div>
          <div class="theme-container2"></div>
          <div class="pickr-container2 example-picker">
            <ngx-colors ngx-colors-trigger [(ngModel)]="color2" acceptLabel="Select" cancelLabel="Cancel">
            </ngx-colors>
          </div>
        </div>`,
    ts: `
        import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ColorPickerComponent,ColorPickerDirective  } from 'ngx-color-picker';
import { NgxColorsModule, validColorValidator } from 'ngx-colors';
import { MaterialModuleModule } from '../../../../material-module/material-module.module';

@Component({
    selector: 'app-colorpicker',
    imports: [ MaterialModuleModule,FormsModule, ReactiveFormsModule, NgxColorsModule],
    providers: [],
    templateUrl: './colorpicker.html',
    styleUrl: './colorpicker.scss'
})
export class Colorpicker {
  constructor() {}
  
  public color1 = "#a68e5e";

  public exampleForm: FormGroup = new FormGroup(
    {
      inputCtrl: new FormControl("rgb(79, 195, 255)", validColorValidator()),
      pickerCtrl: new FormControl("rgb(79, 195, 255)"),
    },
    { updateOn: "change" }
  );

  ngOnInit(): void {
    this.exampleForm.controls["inputCtrl"].valueChanges.subscribe((color) => {
      if (this.exampleForm.controls["pickerCtrl"].valid) {
        this.exampleForm.controls["pickerCtrl"].setValue(color, {
          emitEvent: false,
        });
      }
    });
    this.exampleForm.controls["pickerCtrl"].valueChanges.subscribe((color) =>
      this.exampleForm.controls["inputCtrl"].setValue(color, {
        emitEvent: false,
      })
    );
  }

 color:string = '#EC407A';
 color2:string = '#EC407B';

}


        `

}