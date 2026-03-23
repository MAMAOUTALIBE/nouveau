import { Component, ElementRef, inject, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgxSliderModule, Options } from '@angular-slider/ngx-slider';
import { NouisliderModule } from 'ng2-nouislider';
import * as PrismCode from '../../../../shared/data/prism/forms/form-elements/rangeslider';
import { ShowcodeCard } from "../../../../shared/components/showcode-card/showcode-card";
import * as noUiSlider from 'nouislider';
interface SimpleSliderModel {
  value5: number;
  options6: Options;
}

@Component({
  selector: 'app-rangeslider',
  imports: [NgxSliderModule, FormsModule, ReactiveFormsModule, NouisliderModule, ShowcodeCard],
  templateUrl: './rangeslider.html',
  styleUrl: './rangeslider.scss'
})
export class Rangeslider {
  private formBuilder = inject(FormBuilder);

  prsimCodeData = PrismCode;
    lockedState = false;
  lockedSlider = false;
  lockedValues = [60, 80];
  @ViewChild('slider6') slider6!: ElementRef;
  @ViewChild('slider7') slider7!: ElementRef;
  @ViewChild('lockButton') lockButton!: ElementRef;
  @ViewChild('slider6Value') slider6Value!: ElementRef;
  @ViewChild('slider7Value') slider7Value!: ElementRef;
  ngAfterViewInit(): void {
    this.initializeSliders();
  }

  initializeSliders(): void {
    const sliderOptions = {
      start: [60],
      animate: false,
      range: {
        min: 50,
        max: 100
      }
    };
    noUiSlider.create(this.slider6.nativeElement, sliderOptions);
    noUiSlider.create(this.slider7.nativeElement, { ...sliderOptions, start: [80] });

    this.slider6.nativeElement.noUiSlider.on('update', (values: string[], handle: number) => {
      this.slider6Value.nativeElement.innerHTML = values[handle];
    });

    this.slider7.nativeElement.noUiSlider.on('update', (values: string[], handle: number) => {
      this.slider7Value.nativeElement.innerHTML = values[handle];
    });

    if (this.lockButton) {
      this.lockButton.nativeElement.addEventListener('click', () => {
        this.lockedState = !this.lockedState;
        this.lockButton.nativeElement.textContent = this.lockedState ? 'unlock' : 'lock';
      });
    }

    this.slider6.nativeElement.noUiSlider.on('update', () => this.setLockedValues());
    this.slider7.nativeElement.noUiSlider.on('update', () => this.setLockedValues());

    this.slider6.nativeElement.noUiSlider.on('slide', (values: string[], handle: number) => {
      this.crossUpdate(Number(values[handle]), this.slider7.nativeElement);
    });

    this.slider7.nativeElement.noUiSlider.on('slide', (values: string[], handle: number) => {
      this.crossUpdate(Number(values[handle]), this.slider6.nativeElement);
    });
  }

  setLockedValues(): void {
    this.lockedValues = [
      Number(this.slider6.nativeElement.noUiSlider.get()),
      Number(this.slider7.nativeElement.noUiSlider.get())
    ];
  }
  crossUpdate(value: number, slider: any): void {
    // If the sliders aren't interlocked, don't cross-update.
    if (!this.lockedState) {
      return;
    }

    // Select whether to increase or decrease the other slider value.
    const a: number = this.slider6 === slider ? 0 : 1;

    // Invert a
    const b: number = a ? 0 : 1;

    // Offset the slider value.
    value -= this.lockedValues[b] - this.lockedValues[a];

    // Set the value
    slider.noUiSlider.set(value);
  }



  public disabled: boolean = false;
  public someRange: number[] = [0, 7];
  public someRange1: number[] = [3, 7];
  public someRange2: number[] = [7];
  public someRange3: number[] = [3];
  public someRange4: number[] = [4, 8];
  public someRange5: number[] = [4, 8];
  public someRange6: number[] = [4, 7];

  public someMin: number = -10;
  public someValue: number = 5;
  public someMax: number = 10;
  public someStep: number = 1;
  public form1: FormGroup | any;
  public form2: FormGroup | any;
  public form3: FormGroup | any;

  red = 0;
  green = 0;
  blue = 0;

  getColor(): string {
    return `rgb(${this.red}, ${this.green}, ${this.blue})`;
  }

  public ngOnInit() {
    this.form1 = this.formBuilder.group({
      single: [10, Validators.required], // Example validator, change as needed
    });

    this.form2 = this.formBuilder.group({
      single: [8, Validators.min(0)], // Another example validator
    });

    this.form3 = this.formBuilder.group({
      single: [0, [Validators.min(0), Validators.max(4)]], // Multiple validators
    });
  }
  onChange(value: any) {
    // console.log('Value changed to', value);
  }

  value = 40;
  value1 = 60;
  value2 = 4;
  value3 = 8;

  options2: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBar: true,
  };
  options3: Options = {
    floor: 0,
    ceil: 10,
    showSelectionBarEnd: true,
  };
  value4: number = 12;
  options5: Options = {
    floor: 0,
    ceil: 12,
    showSelectionBar: true,
    getSelectionBarColor: (value: number): string => {
      if (value <= 3) {
        return 'red';
      }
      if (value <= 6) {
        return 'orange';
      }
      if (value <= 9) {
        return 'yellow';
      }
      return '#2AE02A';
    },
  };
  verticalSlider1: SimpleSliderModel = {
    value5: 5,
    options6: {
      floor: 0,
      ceil: 5,
      vertical: true,
    },
  };

  public someKeyboard: number[] = [3];
  public someKeyboardConfig: any = {
    behaviour: 'drag',
    connect: true,
    start: [0, 5],
    keyboard: true,
    step: 0.1,
    pageSteps: 10, // number of page steps, defaults to 10
    range: {
      min: 0,
      max: 5,
    },
    pips: {
      mode: 'count',
      density: 2,
      values: 6,
      stepped: true,
    },
  };

  public keyupLabelOn: boolean = false;
  public keydownLabelOn: boolean = false;
  blinkKeyupLabel() {
    this.keyupLabelOn = true;
    setTimeout(() => {
      this.keyupLabelOn = false;
    }, 450);
  }

  blinkKeydownLabel() {
    this.keydownLabelOn = true;
    setTimeout(() => {
      this.keydownLabelOn = false;
    }, 450);
  }

  public someKeyboard2: number[] = [1, 3];
  public someKeyboardConfig2: any = {
    behaviour: 'drag',
    connect: true,
    start: [0, 5],
    step: 0.1,
    range: {
      min: 0,
      max: 5,
    },
    pips: {
      mode: 'count',
      density: 2,
      values: 6,
      stepped: true,
    },
    keyboard: true,
  };

  minValue: number = 10;
  maxValue: number = 90;
  options: Options = {
    floor: 0,
    ceil: 100,
    step: 1,
    noSwitching: true,
  };
  minValue1: number = 10;
  maxValue1: number = 90;

  minValue2: number = 50;
  maxValue2: number = 90;

  minValue3: number = 50;
  maxValue3: number = 90;
  options4: Options = {
    floor: 0,
    ceil: 100,
    step: 1,
    noSwitching: true,
  };

  minValue6 = 15;
  maxValue6 = 85;
  options6: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#f74f75',
      to: '#f74f75',
    },
  };
  minValue7 = 15;
  maxValue7 = 85;
  options7: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#ffbd5a',
      to: '#ffbd5a',
    },
  };
  minValue8 = 15;
  maxValue8 = 85;
  options8: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#4ec2f0',
      to: '#4ec2f0',
    },
  };
  minValue9 = 15;
  maxValue9 = 85;
  options9: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#1aafac',
      to: '#1aafac',
    },
  };
  minValue10 = 15;
  maxValue10 = 85;
  options10: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#f34343',
      to: '#f34343',
    },
  };
  minValue11 = 15;
  options11: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#38cab3',
      to: '#38cab3',
    },
  };

  minValue12 = 20;
  maxValue12 = 60;
  options12: Options = {
    ceil: 50,
    showSelectionBar: true,
    selectionBarGradient: {
      from: '#f74f75',
      to: '#f74f75',
    },
  };

  sliderConfig: any;
  sliderModel: number[] = [127, 127, 127];

  updateColor() {
    const color = `rgb(${this.sliderModel[0]}, ${this.sliderModel[1]}, ${this.sliderModel[2]})`;
    // You can update the resultElement in the way you want (e.g., using Angular Renderer2).
  }
}



