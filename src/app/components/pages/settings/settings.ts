import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-settings',
    imports: [ NgbNavModule],
    templateUrl: './settings.html',
    styleUrl: './settings.scss'
})
export class Settings {
items = [
    {
      icon: 'fe-home',
      title: 'Dashboard',
      description: 'Dashboard Settings such as sidemenu, header and main page can be Controlled.',
      defaultEnabled: false,
    },
    {
      icon: 'fe-grid',
      title: 'Webapps',
      description: 'Web apps settings such as Apps, Elements, Advanced Ui & Mail can be Controlled.',
      defaultEnabled: false,
    },
    {
      icon: 'fe-server',
      title: 'General',
      description: 'General settings such as Icons, Charts, Ecommerce can be Controlled.',
      defaultEnabled: true,
    },
    {
      icon: 'fe-flag',
      title: 'Region & language',
      description: 'In this settings we can change the region and language manually.',
      defaultEnabled: false,
    },
    {
      icon: 'fe-bell',
      title: 'Notification',
      description: 'Notification settings we can control the notification privacy and security.',
      defaultEnabled: false,
    },
    {
      icon: 'fe-settings',
      title: 'Blog',
      description: 'In this settings we can modify all Blog related settings in this template.',
      defaultEnabled: true,
    },
  ];

}


