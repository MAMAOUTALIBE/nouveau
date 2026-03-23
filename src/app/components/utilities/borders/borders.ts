import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/utilities/borders';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-borders',
    imports: [ ShowcodeCard, NgClass],
    templateUrl: './borders.html',
    styleUrls: ['./borders.scss']
})
export class Borders {
  prismCodeData = PrismCode;
   borderData = [
    { class: 'border border-container' },
    { class: 'border-top border-container' },
    { class: 'border-end border-container' },
    { class: 'border-bottom border-container' },
    { class: 'border-start border-container' },
]
 Removeborders = [
    { class: 'border-0 border-container' },
    { class: 'border border-top-0 border-container' },
    { class: 'border border-end-0 border-container' },
    { class: 'border border-bottom-0 border-container' },
    { class: 'border border-start-0 border-container' },
]
 BorderWidths = [
    { class: 'border border-container border-1' },
    { class: 'border border-container border-2' },
    { class: 'border border-container border-3' },
    { class: 'border border-container border-4' },
    { class: 'border border-container border-5' },
]
 Bordercolors = [
    { class: 'border border-container border-primary' },
    { class: 'border border-container border-secondary' },
    { class: 'border border-container border-success' },
    { class: 'border border-container border-danger' },
    { class: 'border border-container border-warning' },
    { class: 'border border-container border-info' },
    { class: 'border border-container border-light' },
    { class: 'border border-container border-dark' },
]

 Borderwithopacity = [
    { value: 100 },
    { value: 75 },
    { value: 50 },
    { value: 25 },
    { value: 10 }
];

 BorderRadius =[
    {src:'./assets/images/media/media-58.jpg',class:'rounded"'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-top'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-end'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-bottom'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-start'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-circle'},
    {src:'./assets/images/media/media-58.jpg',class:'rounded-pill'}
]

 Sizes =[
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-0'},
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-1'},
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-2'},
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-3'},
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-4'},
    {src:'./assets/images/media/media-58.jpg',class:'bd-placeholder-img rounded-5'},

]


}


