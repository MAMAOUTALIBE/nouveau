import { Component, inject, } from '@angular/core';
import { NgbActiveOffcanvas, } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.html',
  styleUrls: ['./right-sidebar.scss'],
  standalone: false,
})
export class RightSidebar {
  activeOffcanvas = inject(NgbActiveOffcanvas);

  Chat = [
    { id: 1, initials: 'CH', avatarClass: 'bg-primary', title: 'New Websites is Created', time: '30 mins ago' },
    { id: 2, initials: 'L', avatarClass: 'bg-purple', title: 'Prepare for Presentation', time: '45 mins ago' },
    { id: 3, initials: 'N', avatarClass: 'bg-danger', title: 'Prepare For the Next Project', time: '2 hours ago' },
    { id: 4, initials: 'S', avatarClass: 'bg-info', title: 'Decide the live Discussion', time: '3 hours ago' },
    { id: 5, initials: 'K', avatarClass: 'bg-warning', title: 'Meeting at 3:00 pm', time: '4 hours ago' },
    { id: 6, initials: 'R', avatarClass: 'bg-success', title: 'Prepare for Presentation', time: '1 days ago' },
    { id: 7, initials: 'MS', avatarClass: 'bg-pink', title: 'Prepare for Presentation', time: '1 days ago' },
    { id: 8, initials: 'U', avatarClass: 'bg-secondary', title: 'Prepare for Presentation', time: '2 days ago' }
  ];
  notifications = [
    { name: 'Madeleine', message: "Hey! there I' am available....", time: '3 hours ago', img: './assets/images/faces/12.jpg' },
    { name: 'Anthony', message: 'New product Launching...', time: '5 hour ago', img: './assets/images/faces/1.jpg' },
    { name: 'Olivia', message: 'New Schedule Realease......', time: '45 mintues ago', img: './assets/images/faces/2.jpg' },
    { name: 'Madeleine', message: "Hey! there I' am available....", time: '3 hours ago', img: './assets/images/faces/8.jpg' },
    { name: 'Anthony', message: 'New product Launching...', time: '5 hour ago', img: './assets/images/faces/11.jpg' },
    { name: 'Olivia', message: 'New Schedule Realease......', time: '45 mintues ago', img: './assets/images/faces/6.jpg' },
    { name: 'Olivia', message: "Hey! there I' am available....", time: '12 mintues ago', img: './assets/images/faces/9.jpg' }
  ];
  users = [
    { name: 'Mozelle Belt', img: './assets/images/faces/9.jpg' },
    { name: 'Florinda Carasco', img: './assets/images/faces/11.jpg' },
    { name: 'Alina Bernier', img: './assets/images/faces/10.jpg' },
    { name: 'Zula Mclaughin', img: './assets/images/faces/2.jpg' },
    { name: 'Isidro Heide', img: './assets/images/faces/13.jpg' },
    { name: 'Mozelle Belt', img: './assets/images/faces/12.jpg' },
    { name: 'Florinda Carasco', img: './assets/images/faces/4.jpg' },
    { name: 'Alina Bernier', img: './assets/images/faces/7.jpg' },
    { name: 'Zula Mclaughin', img: './assets/images/faces/2.jpg' },
    { name: 'Isidro Heide', img: './assets/images/faces/14.jpg' },
    { name: 'Florinda Carasco', img: './assets/images/faces/11.jpg' },
    { name: 'Alina Bernier', img: './assets/images/faces/9.jpg' },
    { name: 'Zula Mclaughin', img: './assets/images/faces/15.jpg' },
    { name: 'Isidro Heide', img: './assets/images/faces/4.jpg' }
  ];
}


