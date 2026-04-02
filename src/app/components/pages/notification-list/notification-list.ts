import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-notification-list',
  imports: [ RouterLink],
  templateUrl: './notification-list.html',
  styleUrl: './notification-list.scss'
})
export class NotificationList {

  notifications = [
    {
      date: 'Friday',
      time: '02:31',
      avatarSrc: './assets/images/faces/6.jpg',
      avatarStatus: 'online',
      name: 'Emperio',
      message: `Project assigned by the manager all <span class="badge bg-primary-transparent tx-12 fw-semibold text-primiary ms-1 me-1">files</span> and <span class="badge bg-primary-transparent text-primary tx-12 fw-semibold ms-1 me-1">folders</span> were included`,
      badgeDate: '24, oct 2021'
    },
    {
      date: 'Monday',
      time: '08:47',
      avatarSrc: './assets/images/faces/1.jpg',
      avatarStatus: 'offline',
      name: 'Anesthesia',
      message: 'Admin and other team accepted your work request',
      badgeDate: '30,sep 2021'
    },
    {
      date: 'Yesterday',
      time: '18:43',
      avatarSrc: './assets/images/faces/15.jpg',
      avatarStatus: 'online',
      name: 'Hughes',
      message: `Temporary data will be <span class="badge bg-danger-transparent tx-12 fw-semibold me-1 ms-1">deleted</span> once dedicated time complated`,
      badgeDate: '11,sep 2021'
    },
    {
      date: 'Today',
      time: '03:18',
      avatarSrc: './assets/images/faces/2.jpg',
      avatarStatus: 'online',
      name: 'Samantha Melon',
      message: 'Approved date for sanction of loan is verified <i class="fe fe-check text-success"></i>',
      badgeDate: '18, sep 2021'
    },
    {
      date: 'Today',
      time: '12:24',
      avatarSrc: './assets/images/faces/11.jpg',
      avatarStatus: 'offline',
      name: 'Nexus Ronaldo',
      message: `Social network accounts are at risk check your <span class="badge bg-success-transparent fw-semibold tx-12 ms-1 me-1">login</span> details`,
      badgeDate: '18,sep 2021'
    },
    {
      date: 'Today',
      time: '04:11',
      avatarSrc: './assets/images/faces/13.jpg',
      avatarStatus: 'online',
      name: 'Hercules',
      message: `Changed the password of gmail 4 hrs ago. <span class="badge bg-secondary">Update</span>`,
      badgeDate: '18,sep 2021'
    },
    {
      date: 'today',
      time: '02:52',
      avatarSrc: './assets/images/faces/4.jpg',
      avatarStatus: 'online',
      name: 'Milinda',
      message: 'Completed target date to change data heirarchy',
      badgeDate: '18,sep 2021'
    }
  ];
}


