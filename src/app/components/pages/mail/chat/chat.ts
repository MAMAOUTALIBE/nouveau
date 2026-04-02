import { Component } from '@angular/core';
import {  NgbNavModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { OverlayscrollbarsModule } from 'overlayscrollbars-ngx';
import { RouterModule } from '@angular/router';
import { SpkDropdowns } from "../../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-chat',
    imports: [NgbNavModule, OverlayscrollbarsModule,  NgbTooltipModule, RouterModule, SpkDropdowns],
    templateUrl: './chat.html',
    styleUrl: './chat.scss'
})
export class Chat {
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  contacts = [
  { name: 'Socrates Itumay', time: '2 hours', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '5.jpg', online: true, unread: 2, status: 'new' },
  { name: 'Dexter dela Cruz', time: '3 hours', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '6.jpg', online: false, unread: 1, status: 'new' },
  { name: 'Reynante Labares', time: '10 hours', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '9.jpg', online: true, status: 'selected' },
  { name: 'Joyce Chua', time: '2 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '11.jpg' },
  { name: 'Rolando Paloso', time: '2 days', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '4.jpg' },
  { name: 'Ariana Monino', time: '3 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '7.jpg', unread: 1, status: 'new' },
  { name: 'Maricel Villalon', time: '4 days', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '8.jpg' },
  { name: 'Maryjane Cruiser', time: '5 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '12.jpg' },
  { name: 'Lovely Dela Cruz', time: '5 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '15.jpg' },
  { name: 'Daniel Padilla', time: '5 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '10.jpg' },
  { name: 'John Pratts', time: '6 days', message: 'Maecenas tempus, tellus eget condimentum rhoncus, sem quam', img: '3.jpg' },
  { name: 'Raymart Santiago', time: '6 days', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '7.jpg' },
  { name: 'Samuel Lerin', time: '7 days', message: 'Nam quam nunc, blandit vel maecenas et ante tincid', img: '6.jpg' }
];
}


