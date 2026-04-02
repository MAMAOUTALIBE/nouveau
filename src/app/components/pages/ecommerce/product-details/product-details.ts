import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from '@angular/router';
import { SpkProductCard } from "../../../../@spk/pages/ecommerce/spk-product-card/spk-product-card";
import { SpkNgSelect } from "../../../../@spk/plugins/spk-ng-select/spk-ng-select";

@Component({
  selector: 'app-product-details',
  imports: [NgbModule, RouterModule, SpkProductCard, SpkNgSelect],
  templateUrl: './product-details.html',
  styleUrl: './product-details.scss'
})
export class ProductDetails {
  active = 1

  products = [
    {
      id: 1,
      category: 'Fashion',
      title: 'long slit',
      image: './assets/images/ecommerce/2.jpg',
      oldPrice: '$999',
      newPrice: '$799'
    },
    {
      id: 2,
      category: 'Items',
      title: 'Mens wear',
      image: './assets/images/ecommerce/22.jpg',
      oldPrice: '$999',
      newPrice: '$799'
    },
    {
      id: 3,
      category: 'Fashion',
      title: 'kids wear',
      image: './assets/images/ecommerce/21.jpg',
      oldPrice: '$999',
      newPrice: '$799'
    },
    {
      id: 4,
      category: 'Accessories',
      title: 'camara',
      image: './assets/images/ecommerce/5.jpg',
      oldPrice: '$999',
      newPrice: '$799'
    }
  ];

  // Static array
  quantities = [
    { value: '1', label: '1' },
    { value: '2', label: '2' },
    { value: '3', label: '3' },
    { value: '4', label: '4' }
  ];

  // Set the default value to '1' as per your "selected" attribute
  selectedQuantity = '1';
}


