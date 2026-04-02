
import { Component, input } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-ngb-carousel',
  standalone: true,
  imports: [NgbCarouselModule],
  templateUrl: './ngb-carousel.html',
  styleUrl: './ngb-carousel.scss'
})
export class SpkNgbCarousel {
  images = input<any[]>([]); // Array of image URLs
  interval = input<number>(3000); // Duration between slides
  showNavigationArrows = input<boolean>(false); // Controls visibility of navigation arrows
  showNavigationIndicators = input<boolean>(false); // Controls visibility of navigation indicators
  carouselId = input<string>('carouselExample'); // Unique ID for the carousel
  carouselClass = input<string>('carouselExample'); // Unique ID for the carousel
  title = input<string>(''); // Unique ID for the carousel
  slides = input<boolean>();

}
