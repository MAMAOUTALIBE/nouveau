import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

export const mapsRoutingModule: Routes = [
  {
    path: 'maps', children: [
      {
        path: 'googlemaps',
        loadComponent: () => import('./google-maps/google-maps').then((m) => m.GoogleMaps),
        title: 'Nowa - Google Maps',
         data: { parentTitle: 'Maps', subParentTitle: '', childTitle: 'Google Maps' }
      },
      {
        path: 'leafletmaps',
        loadComponent: () => import('./leaflet-maps/leaflet-maps').then((m) => m.LeafletMaps),
        title: 'Nowa - Leaflet Maps',
         data: { parentTitle: 'Maps', subParentTitle: '', childTitle: 'Leaflet Maps' }
      },


    ]
  }
];
