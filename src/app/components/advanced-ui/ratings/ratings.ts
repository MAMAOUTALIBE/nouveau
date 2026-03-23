import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormControl, } from '@angular/forms';
import { SpkRating } from "../../../@spk/plugins/bar-rating/bar-rating";
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
  selector: 'app-ratings',
  imports: [ReactiveFormsModule, FormsModule, SpkRating,NgbTooltipModule],
  templateUrl: './ratings.html',
  styleUrl: './ratings.scss'
})
export class Ratings {
  starRate: number = 4;
  MessageStarRate: number = 4.5;
  readonly = true;

  onRateChanged(rate: number): void {
    this.decimalRating = rate;
  }

  decimalRating: number = 3.5; // Set initial decimal rating
  selected = 3;
  hovered = 0;

  ctrl1: UntypedFormControl;

  constructor() {
    this.ctrl1 = new UntypedFormControl(3);
  }
  onHoverChange(value: number) {
    this.hovered = value;
  }

  onRateChange(value: number) {
    this.selected = value; // Update selected rating when changed
  }
  resetRating(): void {
    this.ctrl1.reset();
  }
}


