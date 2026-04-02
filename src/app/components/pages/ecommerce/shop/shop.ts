import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkShopCard } from "../../../../@spk/pages/ecommerce/spk-shop-card/spk-shop-card";
import { SpkNgSelect } from "../../../../@spk/plugins/spk-ng-select/spk-ng-select";

@Component({
  selector: 'app-shop',
  imports: [RouterModule, NgbTooltipModule, SpkShopCard, SpkNgSelect],
  templateUrl: './shop.html',
  styleUrl: './shop.scss'
})
export class Shop {

  shopData = [
    {
      image: './assets/images/ecommerce/9.jpg',
      image1: './assets/images/ecommerce/23.jpg',
      name: 'Glass Flower pot',
      offerprice: '55',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/8.jpg',
      image1: './assets/images/ecommerce/22.jpg',
      name: 'Mens party wear t-shirt',
      offerprice: '40',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/6.jpg',
      image1: './assets/images/ecommerce/20.jpg',
      name: 'glass with soil gift item',
      offerprice: '95',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/2.jpg',
      image1: './assets/images/ecommerce/2.jpg',
      name: 'women party wear dress',
      offerprice: '80',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/16.jpg',
      image1: './assets/images/ecommerce/24.jpg',
      name: 'White Ear buds',
      offerprice: '35',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/3.jpg',
      image1: './assets/images/ecommerce/17.jpg',
      name: 'simple white Chair',
      offerprice: '50',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/4.jpg',
      image1: './assets/images/ecommerce/18.jpg',
      name: 'pink teddy bear',
      offerprice: '45',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/5.jpg',
      image1: './assets/images/ecommerce/19.jpg',
      name: 'Lence Camara',
      offerprice: '55',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/7.jpg',
      image1: './assets/images/ecommerce/21.jpg',
      name: 'smooth and soft Kids wear',
      offerprice: '70',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/11.jpg',
      image1: './assets/images/ecommerce/10.jpg',
      name: 'Branded Alaram clock',
      offerprice: '80',
      price1: '59'
    },
    {
      image: './assets/images/ecommerce/13.jpg',
      image1: './assets/images/ecommerce/12.jpg',
      name: 'Branded black headset',
      offerprice: '550',
      price1: '650'
    },
    {
      image: './assets/images/ecommerce/14.jpg',
      image1: './assets/images/ecommerce/15.jpg',
      name: 'Colorful coffee cup',
      offerprice: '60',
      price1: '49'
    },
  ]

  retailers = [
    { id: 'Choice 1', label: 'Wallmart' },
    { id: 'Choice 2', label: 'Catseye' },
    { id: 'Choice 3', label: 'Monsoon' },
    { id: 'Choice 4', label: 'Textmart' }
  ];
  categories = [
    { value: 'Choice 1', label: 'Foot wear' },
    { value: 'Choice 2', label: 'Top wear' },
    { value: 'Choice 3', label: 'Bottom wear' },
    { value: 'Choice 4', label: "Men's Grooming" },
    { value: 'Choice 5', label: 'Accessories' }
  ];

  styleCategories = [
    { value: 'Choice 1', label: 'Western wear' },
    { value: 'Choice 2', label: 'Foot wear' },
    { value: 'Choice 3', label: 'Top wear' },
    { value: 'Choice 4', label: 'Bottom wear' },
    { value: 'Choice 5', label: 'Beauty Grooming' },
    { value: 'Choice 6', label: 'Accessories' },
    { value: 'Choice 7', label: 'Jewellery' }
  ];


  kidsCategories = [
    { value: 'Choice 1', label: 'Boys Clothing' },
    { value: 'Choice 2', label: 'Girls Clothing' },
    { value: 'Choice 3', label: 'Toys' },
    { value: 'Choice 4', label: 'Baby care' },
    { value: 'Choice 5', label: 'Beauty Grooming' },
    { value: 'Choice 6', label: 'Kids Footwear' }
  ];
  electronicCategories = [
    { value: 'Choice 1', label: 'Mobiles' },
    { value: 'Choice 2', label: 'Laptops' },
    { value: 'Choice 3', label: 'Gaming & Accessories' },
    { value: 'Choice 4', label: 'Health care Appliances' }
  ];
  lifestyleCategories = [
    { value: 'Choice 1', label: 'Stationery' },
    { value: 'Choice 2', label: 'Books' },
    { value: 'Choice 3', label: 'Gaming' },
    { value: 'Choice 4', label: 'Music' },
    { value: 'Choice 5', label: 'Exercise & fitness' }
  ];

  sizeOptions = [
    { value: 'Choice 1', label: 'Small' },
    { value: 'Choice 2', label: 'Medium' },
    { value: 'Choice 3', label: 'Large' },
    { value: 'Choice 4', label: 'Extra Large' }
  ];



}


