import { Component, computed, DOCUMENT, ElementRef, signal } from '@angular/core';
import { interval } from 'rxjs';

@Component({
  selector: 'app-underconstruction',
  imports: [],
  templateUrl: './underconstruction.html',
  styleUrl: './underconstruction.scss'
})
export class Underconstruction {


  private countDownDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).getTime(); // 3 days from now

  private now = signal(Date.now());

  public days = computed(() =>
    Math.floor((this.countDownDate - this.now()) / (1000 * 60 * 60 * 24))
  );
  public hours = computed(() =>
    Math.floor((this.countDownDate - this.now()) % (1000 * 60 * 60 * 24) / (1000 * 60 * 60))
  );
  public minutes = computed(() =>
    Math.floor((this.countDownDate - this.now()) % (1000 * 60 * 60) / (1000 * 60))
  );
  public seconds = computed(() =>
    Math.floor((this.countDownDate - this.now()) % (1000 * 60) / 1000)
  );
  constructor(
   ) {

    interval(1000).subscribe(() => {
      this.now.set(Date.now());
    });


  }

}


