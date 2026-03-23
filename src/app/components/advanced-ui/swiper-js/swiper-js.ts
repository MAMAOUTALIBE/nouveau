import { CUSTOM_ELEMENTS_SCHEMA, Component, } from '@angular/core';
import { register } from 'swiper/element/bundle';
register();



@Component({
  selector: 'app-swiper-js',
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './swiper-js.html',
  styleUrl: './swiper-js.scss'
})
export class SwiperJs {


  paginationOptions = {
    el: '.swiper-pagination',
    clickable: true,

    renderBullet: function (index: number, className: string) {
      return '<span class="' + className + '">' + (index + 1) + "</span>";
    },
  };

}

