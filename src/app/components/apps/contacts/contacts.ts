import { Component } from '@angular/core';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import { NgClass } from '@angular/common';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
interface Contact {
  name: string;
  detail: string;        // phone or email
  avatar?: string;       // image path if available
  initial?: string;      // fallback letter
  initialColor?: string; // e.g., 'bg-secondary', 'bg-danger'
  online?: boolean;      // true if online dot should show
  selected?: boolean;    // for the 'selected' class
}
@Component({
  selector: 'app-contacts',
  imports: [NgbNavModule, OverlayscrollbarsModule, NgbDropdownModule, NgbTooltipModule, NgClass, SpkDropdowns],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss'
})
export class Contacts {

  contactGroups = [
    {
      label: 'A',
      contacts: [
        {
          name: 'Abigail Johnson',
          active:true,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/2.jpg',
          online: true
        },
        {
          name: 'Archie Cantones',
          active:false,
          value: 'archie@cantones.com',
          avatar: './assets/images/faces/3.jpg'
        },
        {
          name: 'Allan Rey Palban',
          active:false,
          value: 'allanr@palban.com',
          initial: 'A',
          online: true
        },
        {
          name: 'Aileen Mante',
          active:false,
          value: '+1-234-567-890',
          initial: 'A',
          avatarBg: 'bg-secondary'
        }
      ]
    },
    {
      label: 'B',
      contacts: [
        {
          name: 'Brandon Dilao',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/4.jpg'
        },
        {
          name: 'Britney Labares',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/5.jpg',
          online: true
        },
        {
          name: 'Brateyley Cruz',
          active:false,
          value: '+1-234-567-890',
          initial: 'B',
          avatarBg: 'bg-danger'
        }
      ]
    },
    {
      label: 'C',
      contacts: [
        {
          name: 'Camille Audrey',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/6.jpg'
        },
        {
          name: 'Christian Lerio',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/7.jpg',
          online: true
        },
        {
          name: 'Christopher Segovia',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/8.jpg',
          online: true
        }
      ]
    },
    {
      label: 'D',
      contacts: [
        {
          name: 'Darius Clayton',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/9.jpg',
          online: true
        },
        {
          name: 'Dyanne Aceron',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/10.jpg'
        },
        {
          name: 'Divina Gracia',
          active:false,
          value: '+1-234-567-890',
          avatar: './assets/images/faces/11.jpg',
          online: true
        }
      ]
    }
  ];



  contacts = [
    { name: 'Abigali Kelly', role: 'Front end', image: './assets/images/faces/5.jpg' },
    { name: 'Brenda Crux', role: 'Angular', image: './assets/images/faces/2.jpg' },
    { name: 'Rach Michelle', role: 'Php', image: './assets/images/faces/8.jpg' },
    { name: 'Matt Harder', role: 'Codeignitor', image: './assets/images/faces/9.jpg' },
    { name: 'Micheal Phelps', role: 'Web Testing', image: './assets/images/faces/1.jpg' },
    { name: 'Azenda Hills', role: 'Django', image: './assets/images/faces/7.jpg' },
  ];

  url1: string = './assets/images/faces/6.jpg'; // Default image

  handleFileInput(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Optional: Clean up memory from the previous blob if it exists
      if (this.url1.startsWith('blob:')) {
        URL.revokeObjectURL(this.url1);
      }
      this.url1 = URL.createObjectURL(file);
    }
  }

}


