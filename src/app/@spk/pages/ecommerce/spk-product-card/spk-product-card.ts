import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
interface Product {
  id: number;
  category: string;
  title: string;
  image: string;
  oldPrice: string;
  newPrice: string;
}
@Component({
  selector: 'spk-product-card',
  imports: [RouterLink],
  templateUrl: './spk-product-card.html',
  styleUrl: './spk-product-card.scss',
})
export class SpkProductCard {
  data = input<Product>()
}
