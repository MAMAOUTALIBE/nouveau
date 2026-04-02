import { Routes } from '@angular/router';

export const pagesRoutingModule: Routes = [
  {
    path: 'pages', children: [
      {
        path: 'about-us',
        loadComponent: () => import('./about-us/about-us').then((m) => m.AboutUs),
        title: 'Nowa - About us',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'About us' }
      },
      {
        path: 'ecommerce',
        children: [
          {
            path: 'cart',
            loadComponent: () => import('./ecommerce/cart/cart').then((m) => m.Cart),
            title: 'Nowa - Cart',
            data: { parentTitle: 'pages', subParentTitle: 'Ecommerce', childTitle: 'Cart' }
          },
          {
            path: 'checkout',
            loadComponent: () => import('./ecommerce/check-out/check-out').then((m) => m.CheckOut),
            title: 'Nowa - Checkout',
            data: { parentTitle: 'pages', subParentTitle: 'Ecommerce', childTitle: 'Checkout' }
          },
          {
            path: 'product-details',
            loadComponent: () => import('./ecommerce/product-details/product-details').then((m) => m.ProductDetails),
            title: 'Nowa - Product Details',
            data: { parentTitle: 'pages', subParentTitle: 'Ecommerce', childTitle: 'Product Details' }
          },
          {
            path: 'shop',
            loadComponent: () => import('./ecommerce/shop/shop').then((m) => m.Shop),
            title: 'Nowa - Shop',
            data: { parentTitle: 'pages', subParentTitle: 'Ecommerce', childTitle: 'Shop' }
          },
          {
            path: 'wishlist',
            loadComponent: () => import('./ecommerce/wishlist/wishlist').then((m) => m.Wishlist),
            title: 'Nowa - Wishlist',
            data: { parentTitle: 'pages', subParentTitle: 'Ecommerce', childTitle: 'Wishlist' }
          },


        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile').then((m) => m.Profile),
        title: 'Nowa - profile',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Profile' }
      },
      {
        path: 'notifications-list',
        loadComponent: () => import('./notification-list/notification-list').then((m) => m.NotificationList),
        title: 'Nowa - Notifications-list',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Notifications-list' }
      },
      {
        path: 'about-us',
        loadComponent: () => import('./about-us/about-us').then((m) => m.AboutUs),
        title: 'Nowa - about-us',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'about-us' }
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings').then((m) => m.Settings),
        title: 'Nowa - Settings',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Settings', }
      },
      {
        path: 'invoice',
        loadComponent: () => import('./invoice/invoice').then((m) => m.Invoice),
        title: 'Nowa - Invoice',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Invoice', }
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing').then((m) => m.Pricing),
        title: 'Nowa - Pricing',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Pricing', }
      },
      {
        path: 'todo-task',
        loadComponent: () => import('./todo-task/todo-task').then((m) => m.TodoTask),
        title: 'Nowa - Todo-task',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Todo-task' }
      },
      {
        path: 'faqs',
        loadComponent: () => import('./faqs/faqs').then((m) => m.Faqs),
        title: 'Nowa - Faqs',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'Faqs' }
      },
      {
        path: 'emptypage',
        loadComponent: () => import('./empty-page/empty-page').then((m) => m.EmptyPage),
        title: 'Nowa - Empty page',
        data: { parentTitle: 'Pages', subParentTitle: '', childTitle: 'EMPTY PAGE' }
      },
    ]
  }
];
