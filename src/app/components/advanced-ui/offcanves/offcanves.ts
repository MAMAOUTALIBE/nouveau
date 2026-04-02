import { Component, TemplateRef, inject } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import * as prismCode from '../../../shared/data/prism/advanceUi/offcanvas';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-offcanves',
    imports: [ ShowcodeCard,NgClass],
    templateUrl: './offcanves.html',
    styleUrl: './offcanves.scss'
})
export class Offcanves {
 prismCodeData = prismCode
  constructor(private offcanvasService: NgbOffcanvas) { }
  closeResult = '';

  open(content: TemplateRef<HTMLElement>) {
    this.offcanvasService
      .open(content, { ariaLabelledBy: 'offcanvas-basic-title' })
      .result.then(
        (result) => {
          this.closeResult = `Closed with: ${result}`;
        }

      );
  }

  openNoBackdrop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { backdrop: false });
  }

  openStaticBackdrop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { backdrop: 'static' });
  }
  EnableBackdrop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { scroll: false });
  }
  openTop(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'top' });
  }
  openRight(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  openBottom(content: TemplateRef<HTMLElement>) {
    this.offcanvasService.open(content, { position: 'bottom' });
  }


  activities = [
    { avatar: 'NW', avatarBg: 'bg-primary', description: 'New Website Created', date: '20 Nov 2022', timeAgo: '30 mins ago' },
    { avatar: 'CH', avatarBg: 'bg-danger', description: 'Prepare for the new project', date: '3 Jan 2023', timeAgo: '2 hrs ago' },
    { avatar: 'S', avatarBg: 'bg-info', description: 'Decide the live discussion', date: '17 Feb 2023', timeAgo: '3 hrs ago' },
    { avatar: './assets/images/faces/12.jpg', description: 'Meeting at 3:00 pm', date: '29 Dec 2022', timeAgo: '4 hrs ago' },
    { avatar: 'RC', avatarBg: 'bg-success', description: 'Prepare for presentation', date: '31 Dec 2022', timeAgo: '4 hrs ago' },
    { avatar: './assets/images/faces/1.jpg', description: 'Brenda New product launching', date: '1 Jan 2023', timeAgo: '7 hrs ago' },
    { avatar: 'M', avatarBg: 'bg-secondary', description: "Medeleine Hey! there i'm available", date: '5 Jan 2023', timeAgo: '3 hrs ago' },
    { avatar: 'OL', avatarBg: 'bg-info', description: 'Olivia New schedule release', date: '6 Jan 2023', timeAgo: '45 mins ago' },
    { avatar: 'A', avatarBg: 'bg-warning', description: 'Kamala Preparing for new admin launch', date: '7 Jan 2023', timeAgo: '28 mins ago' },
    { avatar: './assets/images/faces/6.jpg', description: 'Oisha Meeting with client for dinner', date: '10 Jan 2023', timeAgo: '14 hrs ago' },
    { avatar: 'CH', avatarBg: 'bg-danger', description: 'Prepare for the new project', date: '3 Jan 2023', timeAgo: '2 hrs ago' },
    { avatar: 'S', avatarBg: 'bg-info', description: 'Decide the live discussion', date: '17 Feb 2023', timeAgo: '3 hrs ago' },
    { avatar: './assets/images/faces/14.jpg', description: 'Meeting at 3:00 pm', date: '29 Dec 2022', timeAgo: '4 hrs ago' },
    { avatar: 'RC', avatarBg: 'bg-success', description: 'Prepare for presentation', date: '31 Dec 2022', timeAgo: '4 hrs ago' }
  ];
}



