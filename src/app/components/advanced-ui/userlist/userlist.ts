import { Component, inject, TemplateRef } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-userlist',
    imports: [NgbModule, SpkDropdowns],
    templateUrl: './userlist.html',
    styleUrl: './userlist.scss'
})
export class Userlist {
  private modalService = inject(NgbModal);

	openVerticallyCentered(content: TemplateRef<any>) {
		this.modalService.open(content, { centered: true });
	}

  users=[
  { name: 'Ajanto', email: 'ajanto.aja445@hotmail.in', position: 'Architect', joined: '20 days ago', country: 'France', status: 'Verified', date: '23-7-2021', avatar: { type: 'image', src: './assets/images/faces/4.jpg' } },
  { name: 'Winters', email: 'winters.w345@gmail.org', position: 'Front end Designer', joined: '20 hrs ago', country: 'Greece', status: 'Not Verified', date: '11-2-2021', avatar: { type: 'initial', initials: 'W', bg: 'success' } },
  { name: 'Cox', email: 'morenocox.g111@gmail.in', position: 'Junior Technical Author', joined: '1 month ago', country: 'Texas', status: 'Verified', date: '25-5-2021', avatar: { type: 'initial', initials: 'CX', bg: 'secondary' } },
  { name: 'Kelly', email: 'kellybelly357@webmail.org', position: 'Senior Javascript Developer', joined: '36 mins ago', country: 'Columbia', status: 'Not Verified', date: '13-3-2021', avatar: { type: 'image', src: './assets/images/faces/7.jpg' } },
  { name: 'Satou', email: 'satousatti3345@gmail.org', position: 'Accountant', joined: '11 hrs ago', country: 'Spain', status: 'Verified', date: '12-6-2020', avatar: { type: 'image', src: './assets/images/faces/8.jpg' } },
  { name: 'Williamson', email: 'Williamson.wilson123@gmail.in', position: 'Integration Specialist', joined: '21 hrs ago', country: 'Bermuda', status: 'Verified', date: '29-1-2021', avatar: { type: 'image', src: './assets/images/faces/9.jpg' } },
  { name: 'Chandler', email: 'Chandler.k@mobimail.in', position: 'Sales Assistant', joined: '28 days ago', country: 'China', status: 'Not Verified', date: '3-4-2021', avatar: { type: 'initial', initials: 'CH', bg: 'info' } },
  { name: 'Davidson', email: 'davidson.david@hotmail.com', position: 'Integration Specialist', joined: '14 mins ago', country: 'Portugal', status: 'Verified', date: '19-8-2021', avatar: { type: 'image', src: './assets/images/faces/11.jpg' } },
  { name: 'Hurst', email: 'Hurst.h@webmail.org.in', position: 'Javascript Developer', joined: '17 days ago', country: 'Iceland', status: 'Verified', date: '16-4-2021', avatar: { type: 'initial', initials: 'H', bg: 'warning' } },
  { name: 'Frost', email: 'Frostpup143@gmail.org', position: 'Software Engineer', joined: '19 hrs ago', country: 'India', status: 'Verified', date: '31-1-2021', avatar: { type: 'image', src: './assets/images/faces/13.jpg' } },
  { name: 'Gaines', email: 'Gaines.j@hotmail.in', position: 'Office Manager', joined: '15 days ago', country: 'Romania', status: 'Not Verified', date: '27-3-2021', avatar: { type: 'image', src: './assets/images/faces/14.jpg' } },
  { name: 'Flynn', email: 'flynn.gov@gmail.in', position: 'Support Lead', joined: '1 month ago', country: 'Japan', status: 'Verified', date: '23-5-2021', avatar: { type: 'image', src: './assets/images/faces/15.jpg' } },
  { name: 'Marshall', email: 'Marshall@ravichandra.mail', position: 'Regional Director', joined: '2 days ago', country: 'Mexico', status: 'Verified', date: '11-7-2020', avatar: { type: 'image', src: './assets/images/faces/16.jpg' } },
  { name: 'Kennedy', email: 'Kennedy@123.org.in', position: 'Senior Marketing Designer', joined: '12 mins ago', country: 'Italy', status: 'Verified', date: '26-4-2021', avatar: { type: 'image', src: './assets/images/faces/17.jpg' } }
]
}


