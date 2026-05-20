import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule, NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import { NgClass } from '@angular/common';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
interface ContactItem {
  name: string;
  value: string;
  avatar?: string;
  initial?: string;
  avatarBg?: string;
  online?: boolean;
  active?: boolean;
  role?: string;
  biography?: string;
  work?: string;
  personal?: string;
  gmail?: string;
  other?: string;
  address?: string;
  callHistory?: string;
}
@Component({
  selector: 'app-contacts',
  imports: [CommonModule, NgbNavModule, OverlayscrollbarsModule, NgbDropdownModule, NgbTooltipModule, NgClass, SpkDropdowns],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss'
})
export class Contacts implements OnInit {
  private readonly defaultAvatar = './assets/images/faces/6.jpg';
  private readonly defaultBio =
    'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.';

  contactGroups: { label: string; contacts: ContactItem[] }[] = [
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



  contacts: { name: string; role: string; image: string }[] = [
    { name: 'Abigali Kelly', role: 'Front end', image: './assets/images/faces/5.jpg' },
    { name: 'Brenda Crux', role: 'Angular', image: './assets/images/faces/2.jpg' },
    { name: 'Rach Michelle', role: 'Php', image: './assets/images/faces/8.jpg' },
    { name: 'Matt Harder', role: 'Codeignitor', image: './assets/images/faces/9.jpg' },
    { name: 'Micheal Phelps', role: 'Web Testing', image: './assets/images/faces/1.jpg' },
    { name: 'Azenda Hills', role: 'Django', image: './assets/images/faces/7.jpg' },
  ];

  selectedContact: ContactItem | null = null;
  url1: string = this.defaultAvatar; // displayed avatar

  ngOnInit(): void {
    this.setInitialSelection();
  }

  private setInitialSelection(): void {
    const firstGroup = this.contactGroups[0];
    const firstContact = firstGroup?.contacts?.[0];
    if (firstContact) {
      firstContact.active = true;
      this.selectedContact = firstContact;
      this.url1 = firstContact.avatar || this.defaultAvatar;
    }
  }

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

  addNewContact(): void {
    const name = (prompt('Nom du contact ?') || '').trim();
    if (!name) { return; }

    const detail = (prompt('Téléphone ou email ?') || '').trim();
    const firstLetter = name[0]?.toUpperCase() || 'U';
    const contact = {
      name,
      value: detail || 'Non renseigné',
      avatar: '',
      initial: firstLetter,
      avatarBg: 'bg-primary',
      online: false,
      active: false,
      biography: this.defaultBio,
      role: 'Contact',
      work: detail || 'Non renseigné',
      personal: 'Non renseigné',
      gmail: 'Non renseigné',
      other: 'Non renseigné',
      address: 'Non renseignée',
      callHistory: 'Durée inconnue'
    };

    const groupIndex = this.contactGroups.findIndex((g) => g.label === firstLetter);
    if (groupIndex >= 0) {
      this.contactGroups[groupIndex] = {
        ...this.contactGroups[groupIndex],
        contacts: [...this.contactGroups[groupIndex].contacts, contact],
      };
    } else {
      this.contactGroups.push({ label: firstLetter, contacts: [contact] });
      this.contactGroups.sort((a, b) => a.label.localeCompare(b.label));
    }

    this.contacts = [{ name, role: detail || 'Nouveau contact', image: this.url1 }, ...this.contacts];

    this.selectContact(contact);
  }

  selectContact(contact: ContactItem): void {
    // clear previous selection
    this.contactGroups.forEach((g) =>
      g.contacts.forEach((c) => (c.active = c === contact))
    );
    this.selectedContact = contact;
    this.url1 = contact.avatar || this.defaultAvatar;
  }

  editSelectedContact(): void {
    if (!this.selectedContact) { return; }
    const name = (prompt('Nom du contact ?', this.selectedContact.name) || '').trim();
    if (!name) { return; }
    const value = (prompt('Téléphone ou email ?', this.selectedContact.value) || '').trim();
    const role = (prompt('Poste / Rôle ?', this.selectedContact.role || 'Contact') || '').trim();
    const bio = (prompt('Biographie ?', this.selectedContact.biography || this.defaultBio) || '').trim();
    const work = (prompt('Téléphone pro ?', this.selectedContact.work || this.selectedContact.value) || '').trim();
    const personal = (prompt('Téléphone perso ?', this.selectedContact.personal || '') || '').trim();
    const gmail = (prompt('Gmail ?', this.selectedContact.gmail || '') || '').trim();
    const other = (prompt('Autre email ?', this.selectedContact.other || '') || '').trim();
    const address = (prompt('Adresse ?', this.selectedContact.address || '') || '').trim();
    const callHistory = (prompt('Historique d’appel ?', this.selectedContact.callHistory || '') || '').trim();

    this.selectedContact.name = name;
    this.selectedContact.value = value || this.selectedContact.value;
    this.selectedContact.role = role || 'Contact';
    this.selectedContact.biography = bio || this.defaultBio;
    this.selectedContact.work = work || this.selectedContact.value;
    this.selectedContact.personal = personal || 'Non renseigné';
    this.selectedContact.gmail = gmail || 'Non renseigné';
    this.selectedContact.other = other || 'Non renseigné';
    this.selectedContact.address = address || 'Non renseignée';
    this.selectedContact.callHistory = callHistory || 'Durée inconnue';

    // ensure view updates
    this.contactGroups = this.contactGroups.map((group) => ({
      ...group,
      contacts: group.contacts.map((c) => (c === this.selectedContact ? { ...this.selectedContact } : c)),
    }));
  }

}


