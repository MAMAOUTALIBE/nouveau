import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpkDropdowns } from "../../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-mail',
    imports: [RouterModule, NgbDropdownModule, SpkDropdowns],
    templateUrl: './mail.html',
    styleUrl: './mail.scss'
})
export class Mail {
selectedFolder = 'Inbox';

  mainFolders = [
    { name: 'Inbox',     icon: 'far fa-envelope',       count: 20 },
    { name: 'Important', icon: 'far fa-bookmark',       count: 10 },
    { name: 'Sent Mail', icon: 'far fa-paper-plane',    count:  8 },
    { name: 'Drafts',    icon: 'far fa-hourglass',      count: 15 },
    { name: 'Trash',     icon: 'fe fe-trash',           count:  6 },
  ];

  labels = [
    { name: 'Social',      icon: 'fab fa-instagram',           count: 10 },
    { name: 'Promotions',  icon: 'far fa-plus-square',         count: 22 },
    { name: 'Updates',     icon: 'far fa-arrow-alt-circle-up', count: 17 },
  ];

  contacts = [
    { name: 'Abigail Johnson', phone: '+1-234-567-890', avatar: './assets/images/faces/2.jpg'  },
    { name: 'Cherry Blossom',   phone: '+1-644-767-890', avatar: './assets/images/faces/1.jpg'  },
    { name: 'Liz Erd',          phone: '+1-634-577-890', avatar: './assets/images/faces/12.jpg' },
    { name: 'Colin Sik',        phone: '+1-834-367-890', avatar: './assets/images/faces/11.jpg' },
    { name: 'Rita Book',        phone: '+1-233-867-830', avatar: './assets/images/faces/4.jpg'  },
    { name: 'Col Fays',         phone: '+1-144-577-690', avatar: './assets/images/faces/5.jpg'  },
  ];

  emails = [
  {
    id: 1,
    from: 'Adrian Monino',
    subject: 'Someone who believes in you',
    excerpt: 'enean commodo li gula eget dolor cum socia eget dolor enean commodo li gula eget dolor cum socia eget dolor',
    date: '11:30am',
    unread: true,
    starred: false,
    img: './assets/images/faces/5.jpg',
    hasAttachment: false
  },
  {
    id: 2,
    from: 'Albert Ansing',
    subject: "Here's What You Missed This Week",
    excerpt: 'enean commodo li gula eget dolor cum socia eget dolor enean commodo li gula eget dolor cum socia eget dolor...',
    date: '06:50am',
    unread: true,
    starred: true,
    img: './assets/images/faces/2.jpg',
    hasAttachment: false
  },
  {
    id: 3,
    from: 'Carla Guden',
    subject: '4 Ways to Optimize Your Search',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Yesterday',
    unread: false,
    starred: false,
    img: './assets/images/faces/9.jpg',
    hasAttachment: false
  },
  {
    id: 4,
    from: 'Reven Galeon',
    subject: "We're Giving a Macbook for Free",
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Yesterday',
    unread: true,
    starred: false,
    img: './assets/images/faces/10.jpg',
    hasAttachment: false
  },
  {
    id: 5,
    from: 'Elisse Tan',
    subject: 'Keep Your Personal Data Safe',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 13',
    unread: false,
    starred: false,
    img: './assets/images/faces/12.jpg',
    hasAttachment: false
  },
  {
    id: 6,
    from: 'Marianne Audrey',
    subject: "We've Made Some Changes",
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 13',
    unread: false,
    starred: false,
    img: './assets/images/faces/14.jpg',
    hasAttachment: false
  },
  {
    id: 7,
    from: 'Jane Phoebe',
    subject: 'Grab Our Holiday Deals',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 12',
    unread: false,
    starred: false,
    avatar: 'J',
    hasAttachment: false
  },
  {
    id: 8,
    from: 'Raffy Godinez',
    subject: 'Just a Few Steps Away',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 05',
    unread: false,
    starred: false,
    img: './assets/images/faces/15.jpg',
    hasAttachment: false
  },
  {
    id: 9,
    from: 'Allan Cadungog',
    subject: 'Credit Card Promos',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 04',
    unread: false,
    starred: true,
    img: './assets/images/faces/7.jpg'
  },
  {
    id: 10,
    from: 'Alfie Salinas',
    subject: '4 Ways to Optimize Your Search',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 02',
    unread: false,
    starred: false,
    img: './assets/images/faces/10.jpg',
    hasAttachment: false
  },
  {
    id: 11,
    from: 'Jove Guden',
    subject: 'Keep Your Personal Data Safe',
    excerpt: 'viva mus elemen tum semper nisi enean vulputat enean commodo li gula eget dolor cum socia eget dolor',
    date: 'Oct 02',
    unread: false,
    starred: false,
    img: './assets/images/faces/1.jpg',
    hasAttachment: false
  }
];
}


