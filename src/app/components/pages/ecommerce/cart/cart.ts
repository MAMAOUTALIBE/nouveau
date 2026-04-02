import { Component, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
interface Product {
  id: number;              // Unique identifier
  img: string;             // Path or URL to product image
  name: string;            // Product name
  size: string;            // Size (e.g., "XXL")
  color: string;           // Color description
  bg: string;              // Background style key (e.g., "danger")
  text: string;            // Text color (e.g., "white")
  status: string;          // Availability status
  price: string;           // Price as formatted string
  quantity: number;        // Quantity available or selected
}

@Component({
  selector: 'app-cart',
  imports: [RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class Cart {

  cartItems = signal([
    {
      id: 1,
      img: './assets/images/ecommerce/2.jpg',
      name: 'Party Wear',
      size: 'XXL',
      color: 'Red Color',
      bg: 'danger',
      text: 'white',
      status: 'Out of stock',
      price: ' $129',
      quantity: 3,
    },
    {
      id: 2,
      img: './assets/images/ecommerce/23.jpg',
      name: 'Flower pot',
      size: 'XL',
      color: 'Purple Color',
      bg: 'success',
      text: 'success',
      status: 'In stock',
      price: '$50.30',
      quantity: 2,
    },
    {
      id: 3,
      img: './assets/images/ecommerce/22.jpg',
      name: 'Mens wear',
      size: 'M',
      color: 'LightPink color',
      bg: 'danger',
      text: 'danger',
      status: 'Out of stock',
      price: ' $249',
      quantity: 1,
    },
    {
      id: 4,
      img: './assets/images/ecommerce/16.jpg',
      name: 'Ear phones',
      size: '11-12 inches',
      color: 'Red color',
      bg: 'success',
      text: 'danger',
      status: 'In stock',
      price: ' $249',
      total: ' $249',
      quantity: 1,
    },
  ])
  increaseQuantity(item: Product) {
    item.quantity++;

  }

  // Decrease quantity and update total (minimum quantity is 1)
  decreaseQuantity(item: Product) {
    if (item.quantity > 1) {
      item.quantity--;

    }
  }


  // Delete item from cart
  deleteItem(id: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#546dfe',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
         const updated = this.cartItems().filter(item => item.id !== id);
        this.cartItems.set(updated);
        Swal.fire('Deleted!', 'Your item has been deleted!', 'success');
      }
    });
  }
}


