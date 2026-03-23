import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, viewChild } from '@angular/core';
import { Gallery, GalleryItem, ImageItem } from 'ng-gallery';
import { LightboxModule } from 'ng-gallery/lightbox';
import { RouterModule } from '@angular/router';
import { SpkReusableTables } from "../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables";
import { register } from 'swiper/element/bundle';
register();


@Component({
  selector: 'app-file-details',
  imports: [LightboxModule, RouterModule, SpkReusableTables],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './file-details.html',
  styleUrl: './file-details.scss'
})
export class FileDetails {
  gallery = inject(Gallery);

  items!: GalleryItem[];

  imageData = data;

  ngOnInit(): void {
    // Creat gallery items
    this.items = this.imageData.map(
      (item) => new ImageItem({ src: item.srcUrl, thumb: item.previewUrl })
    );
  }

  breakpoints = {
    // 320px and up (Small Phones)
    320: {
      slidesPerView: 1,
      spaceBetween: 10
    },
    // 480px and up (Large Phones / Phablets)
    480: {
      slidesPerView: 2,
      spaceBetween: 15
    },
    // 768px and up (Tablets)
    768: {
      slidesPerView: 3,
      spaceBetween: 20
    },
    // 1024px and up (Laptops/Small Desktops)
    1024: {
      slidesPerView: 4,
      spaceBetween: 25
    },
    // 1440px and up (Large Desktops)
    1440: {
      slidesPerView: 5,
      spaceBetween: 30
    },
    // 1800px and up (Ultra-wide)
    1800: {
      slidesPerView: 6,
      spaceBetween: 40
    }
  }

  imageData1 = [
    {
      src: './assets/images/media/media-29.jpg',
    },
    {
      src: './assets/images/media/media-28.jpg',
    },
    {
      src: './assets/images/media/media-30.jpg',
    },
  ];

  fileDetails = [
    { label: 'File-name', value: 'image.jpg' },
    { label: 'File-size', value: '12.45mb' },
    { label: 'uploaded-date', value: '01-12-2020' },
    { label: 'uploaded-by', value: 'prityy abodh' },
    { label: 'image-width', value: 1000 },
    { label: 'image-height', value: 600 },
    { label: 'File-formate', value: 'jpg' },
    { label: 'File-location', value: 'storage/photos/image.jpg' },
  ];


}

const data = [
  {
    srcUrl: './assets/images/media/media-91.jpg',
    previewUrl: './assets/images/media/media-91.jpg',
  },
  {
    srcUrl: './assets/images/media/media-92.jpg',
    previewUrl: './assets/images/media/media-92.jpg',
  },
  {
    srcUrl: './assets/images/media/media-93.jpg',
    previewUrl: './assets/images/media/media-93.jpg',
  },
  {
    srcUrl: './assets/images/media/media-93.jpg',
    previewUrl: './assets/images/media/media-93.jpg',
  },
  {
    srcUrl: './assets/images/media/media-94.jpg',
    previewUrl: './assets/images/media/media-94.jpg',
  },
  {
    srcUrl: './assets/images/media/media-95.jpg',
    previewUrl: './assets/images/media/media-95.jpg',
  },
  {
    srcUrl: './assets/images/media/media-96.jpg',
    previewUrl: './assets/images/media/media-96.jpg',
  },
  {
    srcUrl: './assets/images/media/media-97.jpg',
    previewUrl: './assets/images/media/media-97.jpg',
  },

]


