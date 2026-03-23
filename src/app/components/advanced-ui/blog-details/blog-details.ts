import { Component, inject } from '@angular/core';
import { Gallery as ngGallery, GalleryItem, ImageItem } from 'ng-gallery';
import { GallerizeDirective } from 'ng-gallery/lightbox';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-blog-details',
    imports: [ GallerizeDirective, RouterModule],
    templateUrl: './blog-details.html',
    styleUrl: './blog-details.scss'
})
export class BlogDetails {
  gallery = inject(ngGallery);

  items!: GalleryItem[];

  imageData = data;

  ngOnInit(): void {
    // Creat gallery items
    this.items = this.imageData.map(
      (item) => new ImageItem({ src: item.srcUrl, thumb: item.previewUrl })
    );
  }
}

const data = [
  {
    srcUrl: './assets/images/photos/1.jpg',
    previewUrl: './assets/images/photos/1.jpg',
  },
  {
    srcUrl: './assets/images/photos/2.jpg',
    previewUrl: './assets/images/photos/2.jpg',
  },
  {
    srcUrl: './assets/images/photos/3.jpg',
    previewUrl: './assets/images/photos/3.jpg',
  },
  {
    srcUrl: './assets/images/photos/4.jpg',
    previewUrl: './assets/images/photos/4.jpg',
  },
  {
    srcUrl: './assets/images/photos/5.jpg',
    previewUrl: './assets/images/photos/5.jpg',
  },
  {
    srcUrl: './assets/images/photos/6.jpg',
    previewUrl: './assets/images/photos/6.jpg',
  },
  {
    srcUrl: './assets/images/photos/7.jpg',
    previewUrl: './assets/images/photos/7.jpg',
  },
  {
    srcUrl: './assets/images/photos/8.jpg',
    previewUrl: './assets/images/photos/8.jpg',
  },
  {
    srcUrl: './assets/images/photos/2.jpg',
    previewUrl: './assets/images/photos/2.jpg',
  },
]


