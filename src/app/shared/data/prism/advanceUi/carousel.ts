export let SlidesOnly = {
    Html: `            <div id="carouselExampleSlidesOnly" class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                    @if (SlidesOnly) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="false" [showNavigationIndicators]="false">

                        @for (image of SlidesOnly; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                        </ng-template>
                        }
                    </ngb-carousel>
                    }


                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
SlidesOnly=[
    {
      src:'./assets/images/media/media-26.jpg'
    },
    {
      src:'./assets/images/media/media-27.jpg'
    },
    {
      src:'./assets/images/media/media-28.jpg'
    },
  ]
}
    `,

}


export let Withcontrols = {
    Html: `  <div id="carouselExampleControls" class="carousel slide" data-bs-ride="carousel">

                @if (Withcontrols) {
                <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="false">

                    @for (image of Withcontrols; track $index) {
                    <ng-template ngbSlide>
                        <img [src]="image.src" class="d-block w-100" alt="...">
                    </ng-template>
                    }
                </ngb-carousel>
                }


            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {

  Withcontrols=[
    {
      src:'./assets/images/media/media-28.jpg'
    },
    {
      src:'./assets/images/media/media-31.jpg'
    },
    {
      src:'./assets/images/media/media-32.jpg'
    },
  ]
}
    `,

}

export let Withindicators = {
    Html: `  <div id="carouselExampleIndicators" class="carousel slide" data-bs-ride="carousel">
                @if (Withindicators) {
                <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="true">

                    @for (image of Withindicators; track $index) {
                    <ng-template ngbSlide>
                        <img [src]="image.src" class="d-block w-100" alt="...">
                    </ng-template>
                    }
                </ngb-carousel>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
Withindicators=[
    {
      src:'./assets/images/media/media-25.jpg'
    },
    {
      src:'./assets/images/media/media-29.jpg'
    },
    {
      src:'./assets/images/media/media-30.jpg'
    },
  ]
}
    `,

}

export let Withcaptions = {
    Html: ` <div id="carouselExampleCaptions" class="carousel slide" data-bs-ride="carousel">
                    @if (Withcaptions) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="true">
                        @for (image of Withcaptions; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                            <div class="carousel-caption d-none d-md-block">
                                <h5 class="text-fixed-white">{{image.title}}</h5>
                                <p>{{image.content}}</p>
                            </div>
                        </ng-template>
                        }
                    </ngb-carousel>
                    }
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
  Withcaptions=[
    {
      src:'./assets/images/media/media-59.jpg',
      title:'First slide label',
      content:'Some representative placeholder content for the first slide'
    },
    {
      src:'./assets/images/media/media-60.jpg',
      title:'Second slide label',
      content:'Some representative placeholder content for the Second slide'
    },
    {
      src:'./assets/images/media/media-61.jpg',
      title:'Third slide label',
      content:'Some representative placeholder content for the third slide'
    },
  ]

}
    `,

}

export let Crossfade = {
    Html: ` <div id="carouselExampleFade" class="carousel slide carousel-fade" data-bs-ride="carousel">
                <div class="carousel-inner">

                    @if (Crossfade) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="false">

                        @for (image of Crossfade; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                        </ng-template>
                        }
                    </ngb-carousel>
                    }
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
  Crossfade=[

    {
      src:'./assets/images/media/media-43.jpg'
    },
    {
      src:'./assets/images/media/media-44.jpg'
    },
    {
      src:'./assets/images/media/media-45.jpg'
    },
  ]
}
    `,

}

export let Individual = {
    Html: `<div id="carouselExampleFade" class="carousel slide carousel-fade" data-bs-ride="carousel">
                <div class="carousel-inner">

                    @if (Individualcarouseliteminterval) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="false">

                        @for (image of Individualcarouseliteminterval; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                        </ng-template>
                        }
                    </ngb-carousel>
                    }
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
  Individualcarouseliteminterval=[

    {
      src:'./assets/images/media/media-40.jpg'
    },
    {
      src:'./assets/images/media/media-41.jpg'
    },
    {
      src:'./assets/images/media/media-42.jpg'
    },
  ]
}
    `,

}


export let Disabletouchswiping = {
    Html: ` <div id="carouselExampleFade" class="carousel slide carousel-fade" data-bs-ride="carousel">
                <div class="carousel-inner">

                    @if (Disabletouchswiping) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="false">

                        @for (image of Disabletouchswiping; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                        </ng-template>
                        }
                    </ngb-carousel>
                    }
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
Disabletouchswiping=[

    {
      src:'./assets/images/media/media-13.jpg'
    },
    {
      src:'./assets/images/media/media-14.jpg'
    },
    {
      src:'./assets/images/media/media-18.jpg'
    },
  ]
}
    `,

}


export let Darkvariant = {
    Html: ` <div id="carouselExampleFade" class="carousel slide carousel-fade" data-bs-ride="carousel">
                <div class="carousel-inner">

                    @if (Darkvariant) {
                    <ngb-carousel [interval]="3200" [showNavigationArrows]="true" [showNavigationIndicators]="true">

                        @for (image of Darkvariant; track $index) {
                        <ng-template ngbSlide>
                            <img [src]="image.src" class="d-block w-100" alt="...">
                        </ng-template>
                        }
                    </ngb-carousel>
                    }
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'app-carousel',
  imports: [NgbCarouselModule],
  templateUrl: './carousel.html',
  styleUrl: './carousel.scss'
})
export class CarouselComponent {
 Darkvariant=[

      {
        src:'./assets/images/media/media-63.jpg',
        title:'First slide label',
        content:'Some representative placeholder content for the first slide'
      },
      {
        src:'./assets/images/media/media-64.jpg',
        title:'Second slide label',
        content:'Some representative placeholder content for the Second slide'
      },
      {
        src:'./assets/images/media/media-62.jpg',
        title:'Third slide label',
        content:'Some representative placeholder content for the third slide'
      },

  ]
}
    `,

}


