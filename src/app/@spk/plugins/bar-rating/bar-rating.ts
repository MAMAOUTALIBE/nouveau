
import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbRatingModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-rating',
  standalone: true,
  imports: [ FormsModule, ReactiveFormsModule, NgbRatingModule,NgClass],
  templateUrl: './bar-rating.html',
  styleUrl: './bar-rating.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpkRating {
  rating = input<number>(0);
  maxStars = input<number>(5);
  disabled = input<boolean>(false);
  readonly = input<boolean>(false);
  resettable = input<boolean>(false);
  ngClass = input<string>('');
  starTemplate = input<any>();
  control = input<FormControl>(new FormControl());

  // Outputs for external communication
  hoverChange = output<number>();
  rateChange = output<number>(); // New output for selected rating changes

  currentRating = 0;
  hoveredRating = 0;

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.control()) {
      this.control().valueChanges.subscribe(value => {
        this.currentRating = value === null ? 0 : value;
        this.rateChange.emit(this.currentRating); // Emit initial control value
        this.cdr.markForCheck();
      });

      if (this.control().value === null) {
        this.control().setValue(this.rating());
        this.cdr.markForCheck();
      }
    } else {
      this.currentRating = this.rating(); // Set initial rating if no control
      this.rateChange.emit(this.currentRating); // Emit initial rating
    }
  }

  onRateChange(value: number) {
    if (this.control()) {
      this.control().setValue(value);
    }
    this.currentRating = value;
    this.rateChange.emit(value); // Emit new rating
    this.cdr.markForCheck();
  }

  onHover(value: number) {
    this.hoveredRating = value;
    this.hoverChange.emit(value);
    this.cdr.markForCheck();
  }

  onLeave() {
    this.hoveredRating = 0;
    this.hoverChange.emit(0);
    this.cdr.markForCheck();
  }
}

