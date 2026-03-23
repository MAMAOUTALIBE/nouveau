import { Component,  } from '@angular/core';
import {  NgbCollapseModule, NgbModule, } from '@ng-bootstrap/ng-bootstrap';

import * as prismCode from '../../../shared/data/prism/advanceUi/carousel';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { SpkNgbCarousel } from "../../../@spk/plugins/ngb-carousel/ngb-carousel/ngb-carousel";

@Component({
    selector: 'app-carousel',
    imports: [NgbCollapseModule, NgbModule,  ShowcodeCard, SpkNgbCarousel],
    templateUrl: './carousel.html',
    styleUrl: './carousel.scss'
})
export class Carousel {
  prismCodeData = prismCode;
  SlidesOnly = [
    {
      src: './assets/images/media/media-26.jpg'
    },
    {
      src: './assets/images/media/media-27.jpg'
    },
    {
      src: './assets/images/media/media-28.jpg'
    },
  ]

  Withcontrols = [
    {
      src: './assets/images/media/media-28.jpg'
    },
    {
      src: './assets/images/media/media-31.jpg'
    },
    {
      src: './assets/images/media/media-32.jpg'
    },
  ]


  Withindicators = [
    {
      src: './assets/images/media/media-25.jpg'
    },
    {
      src: './assets/images/media/media-29.jpg'
    },
    {
      src: './assets/images/media/media-30.jpg'
    },
  ]

  Withcaptions = [
    {
      src: './assets/images/media/media-59.jpg',
      title: 'First slide label',
      content: 'Some representative placeholder content for the first slide'
    },
    {
      src: './assets/images/media/media-60.jpg',
      title: 'Second slide label',
      content: 'Some representative placeholder content for the Second slide'
    },
    {
      src: './assets/images/media/media-61.jpg',
      title: 'Third slide label',
      content: 'Some representative placeholder content for the third slide'
    },
  ]

  Crossfade = [

    {
      src: './assets/images/media/media-43.jpg'
    },
    {
      src: './assets/images/media/media-44.jpg'
    },
    {
      src: './assets/images/media/media-45.jpg'
    },
  ]
  Individualcarouseliteminterval = [

    {
      src: './assets/images/media/media-40.jpg'
    },
    {
      src: './assets/images/media/media-41.jpg'
    },
    {
      src: './assets/images/media/media-42.jpg'
    },
  ]
  Disabletouchswiping = [

    {
      src: './assets/images/media/media-13.jpg'
    },
    {
      src: './assets/images/media/media-14.jpg'
    },
    {
      src: './assets/images/media/media-18.jpg'
    },
  ]
  Darkvariant = [

    {
      src: './assets/images/media/media-63.jpg',
      title: 'First slide label',
      content: 'Some representative placeholder content for the first slide'
    },
    {
      src: './assets/images/media/media-64.jpg',
      title: 'Second slide label',
      content: 'Some representative placeholder content for the Second slide'
    },
    {
      src: './assets/images/media/media-62.jpg',
      title: 'Third slide label',
      content: 'Some representative placeholder content for the third slide'
    },

  ]




  images = [
    './assets/images/media/media-22.jpg',
    './assets/images/media/media-27.jpg',
    './assets/images/media/media-33.jpg',
  ];
  imagescontrol = [
    './assets/images/media/media-28.jpg',
    './assets/images/media/media-31.jpg',
    './assets/images/media/media-32.jpg',
  ];
  imagesIndicators = [
    './assets/images/media/media-21.jpg',
    './assets/images/media/media-29.jpg',
    './assets/images/media/media-30.jpg',
  ];
  carouselImages = [
    {
      src: './assets/images/media/media-59.jpg',
      alt: 'First slide',
      title: 'First slide label',
      description: 'Some representative placeholder content for the first slide.'
    },
    {
      src: './assets/images/media/media-60.jpg',
      alt: 'Second slide',
      title: 'Second slide label',
      description: 'Some representative placeholder content for the second slide.'
    },
    {
      src: './assets/images/media/media-61.jpg',
      alt: 'Third slide',
      title: 'Third slide label',
      description: 'Some representative placeholder content for the third slide.'
    }
  ];
  imagescross = [
    './assets/images/media/media-43.jpg',
    './assets/images/media/media-44.jpg',
    './assets/images/media/media-45.jpg',
  ];
  images1 = [
    './assets/images/media/media-13.jpg',
    './assets/images/media/media-14.jpg',
    './assets/images/media/media-18.jpg',
  ];
  imagesindividual = [
    './assets/images/media/media-40.jpg',
    './assets/images/media/media-41.jpg',
    './assets/images/media/media-42.jpg',
  ];
  darkVariantlImages = [
    {
      src: './assets/images/media/media-63.jpg',
      alt: 'First slide',
      title: 'First slide label',
      description: 'Some representative placeholder content for the first slide.'
    },
    {
      src: './assets/images/media/media-64.jpg',
      alt: 'Second slide',
      title: 'Second slide label',
      description: 'Some representative placeholder content for the second slide.'
    },
    {
      src: './assets/images/media/media-62.jpg',
      alt: 'Third slide',
      title: 'Third slide label',
      description: 'Some representative placeholder content for the third slide.'
    }
  ]

}


