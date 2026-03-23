import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
interface shopCard {
  image:string;
  image1:string;
  name:string;
  offerprice:string;
  price1:string;
}
@Component({
  selector: 'spk-shop-card',
  imports: [RouterLink],
  templateUrl: './spk-shop-card.html',
  styleUrl: './spk-shop-card.scss',
})
export class SpkShopCard {
  data = input<shopCard>()
}
