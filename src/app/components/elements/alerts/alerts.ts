import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/alets';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';
import { SpkAlerts } from "../../../@spk/reusable-ui-elements/spk-alerts/spk-alerts";
import { SvgReplaceDirective } from "../../../shared/directives/svgReplace.directive";
interface Alert {
  type: string;
  message: string;
}
export interface AlertData {
  id?: string | number; // Optional unique identifier
  type: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  message: string;
  title?: string;      // Optional
  icon?: string;       // Optional (for SVG alerts)
  image?: string;      // Optional (for Avatar alerts)
  avatarClass?: string;// Optional (for size variations)
  linkTitle?: string;  // Optional (for additional content)
}
@Component({
  selector: 'app-alerts',
  imports: [NgClass, NgbModule, ShowcodeCard, SpkAlerts, SvgReplaceDirective],
  templateUrl: './alerts.html',
  styleUrls: ['./alerts.scss']
})

export class Alerts {
  prismCodeData = PrismCode;
  constructor() { }

  alerts!: Alert[];
  showAlert = true;

  closeAlert() {
    this.showAlert = false;
  }
  livealerts: { message: string; show: boolean }[] = [];

  livealertsshowAlert() {
    // Add a new alert to the array
    this.livealerts.push({
      message: 'Nice, you triggered this alert message!',
      show: true,
    });
  }



  BasicAlert = [
    {
      type: 'warning ',
      message: 'Holy guacamole! You should check in on some of those fields below.',
      bg: ''
    },
  ]

  OutlineAlerts = [
    {
      type: 'outline-primary',
      message: 'A simple outline primary alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-secondary',
      message: 'A simple outline secondary alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-info',
      message: 'A simple outline info alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-warning',
      message: 'A simple outline warning alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-success',
      message: 'A simple outline success alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-danger',
      message: 'A simple outline danger alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'outline-light',
      message: 'A simple outline light alert—check it out!',
      bg: 'text-dark',
      buttonclass: 'text-default'
    },
    {
      type: 'outline-dark text-dark',
      message: 'A simple outline dark alert—check it out!',
      bg: 'text-dark',
      buttonclass: ''
    },
  ];




  linkWithAlerts = [

    { variant: 'primary mb-3', title: 'A simple primary alert with' },
    { variant: 'secondary mb-3', title: 'A simple secondary alert with' },
    { variant: 'success mb-3', title: 'A simple success alert with' },
    { variant: 'danger mb-3', title: 'A simple danger alert with' },
    { variant: 'warning mb-3', title: 'A simple warning alert with' },
    { variant: 'info mb-3', title: 'A simple info alert with' },
    { variant: 'light mb-3', title: 'A simple light alert with' },
    { variant: 'dark', title: 'A simple dark alert with' },
  ]

  shadowAlert = [
    {
      type: 'primary shadow-sm',
      message: 'A simple solid primary alert with normal shadow—check it out!',
    },
    {
      type: 'solid-primary shadow-sm',
      message: 'A simple solid primary alert with normal shadow—check it out!',
    },
    {
      type: 'solid-primary shadow-sm',
      message: 'A simple solid primary alert with normal shadow—check it out!',
    },
    {
      type: 'solid-secondary shadow-sm',
      message: 'A simple solid secondary alert with normal shadow—check it out!',
    },
    {
      type: 'solid-secondary shadow-sm',
      message: ' A simple solid secondary alert with normal shadow—check it out!',
    },
    {
      type: 'solid-secondary shadow-sm',
      message: 'A simple solid secondary alert with normal shadow—check it out!',
    },
  ];




  DiffshadowAlert = [
    {
      type: 'primary shadow-sm',
      message: 'A simple primary alert with normal shadow—check it out!',
    },
    {
      type: 'primary shadow',
      message: 'A simple primary alert with normal shadow—check it out!',
    },
    {
      type: 'primary shadow-lg',
      message: 'A simple primary alert with normal shadow—check it out!',
    },
    {
      type: 'secondary shadow-sm',
      message: 'A simple secondary alert with normal shadow—check it out!',
    },
    {
      type: 'secondary shadow',
      message: ' A simple secondary alert with normal shadow—check it out!',
    },
    {
      type: 'secondary shadow-lg',
      message: 'A simple secondary alert with normal shadow—check it out!',
    },
  ];



  DefaultAlerts = [
    { color: 'primary mb-3', title: 'A simple primary alert—check it out!' },
    { color: 'secondary mb-3', title: 'A simple secondary alert—check it out!' },
    { color: 'success mb-3', title: 'A simple success alert—check it out!' },
    { color: 'danger mb-3', title: 'A simple danger alert—check it out!' },
    { color: 'warning mb-3', title: 'A simple warning alert—check it out!' },
    { color: 'info mb-3', title: 'A simple info alert—check it out!' },
    { color: 'light mb-3', title: 'A simple light alert—check it out!' },
    { color: 'dark', title: 'A simple dark alert—check it out!' },
  ]
  SolidColoredAlerts = [
    {
      type: 'solid-primary ',
      message: ' A simple solid primary alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'solid-secondary ',
      message: 'A simple solid secondary alert—check it out!',
      bg: '',
      buttonclass: ''
    },
    {
      type: 'solid-info ',
      message: 'A simple solid info alert—check it out!',
      bg: '',
      buttonclass: ''

    },
    {
      type: 'solid-warning ',
      message: 'A simple solid warning alert—check it out!',
      bg: '',
      buttonclass: ''

    },
    {
      type: 'solid-success ',
      message: 'A simple solid success alert—check it out!',
      bg: '',
      buttonclass: ''

    },
    {
      type: 'solid-danger ',
      message: 'A simple solid danger alert—check it out!',
      bg: '',
      buttonclass: ''

    },
    {
      type: 'solid-light ',
      message: 'A simple solid light alert—check it out!',
      bg: 'text-dark',
      buttonclass: ''
    },
    {
      type: 'solid-dark text-white',
      message: 'A simple solid dark alert—check it out!',
      bg: 'text-dark',
      buttonclass: 'text-white'
    },
  ]


  RoundedSolidAlerts = [
    {
      type: 'solid-primary rounded-pill',
      message: '  A simple solid rounded primary alert—check it out!',
    },
    {
      type: 'solid-secondary rounded-pill',
      message: 'A simple solid rounded secondary alert—check it out!',
    },
    {
      type: 'solid-warning rounded-pill',
      message: '  A simple solid rounded warning alert—check it out!',
    },
    {
      type: 'solid-danger rounded-pill',
      message: 'A simple solid rounded danger alert—check it out!',
    },
  ]

  RoundedOutlineAlerts = [
    {
      type: 'outline-primary rounded-pill',
      message: ' A simple outline primary alert—check it out!',
    },

    {
      type: 'outline-secondary rounded-pill',
      message: 'A simple outline secondary alert—check it out!',
    },
    {
      type: 'outline-warning rounded-pill',
      message: 'A simple outline warning alert—check it out!',
    },
    {
      type: 'outline-info rounded-pill',
      message: 'A simple outline info alert—check it out!',
    },
  ]

  RoundedDefaultAlerts = [
    {
      type: 'primary rounded-pill',
      message: ' A simple rounded primary alert—check it out!',
    },

    {
      type: 'secondary rounded-pill',
      message: 'A simple rounded secondary alert—check it out!',
    },
    {
      type: 'warning rounded-pill',
      message: 'A simple rounded warning alert—check it out!',
    },
    {
      type: 'danger rounded-pill',
      message: 'A simple rounded danger alert—check it out!',
    },

  ]

  RoundedAlertsWithCustomCloseButton = [
    {
      type: 'primary rounded-pill',
      message: ' A simple rounded primary alert—check it out!',
    },
    {
      type: 'secondary rounded-pill',
      message: 'A simple rounded secondary alert—check it out!',
    },
    {
      type: 'warning rounded-pill',
      message: 'A simple rounded warning alert—check it out!',
    },
    {
      type: 'danger rounded-pill',
      message: 'A simple rounded danger alert—check it out!',
    },
  ];


  CustomizedAlertsWithSVG = [
    {
      type: 'primary svg-primary custom-alert-icon shadow-sm ',
      icon: '  <svg  class="svg-primary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000" > <path d="M0 0h24v24H0z" fill="none" /> <path   d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/> </svg>',
      message: ' A customized primary alert with an icon ',

    },
    {
      type: 'secondary svg-secondary custom-alert-icon shadow-sm',
      message: 'A customized secondary alert with an icon ',
      icon: ' <svg class="svg-secondary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>'
    },
    {
      type: 'success svg-success custom-alert-icon shadow-sm',
      message: ' A customized success alert with an icon ',
      icon: '<svg class="svg-success" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    },
    {
      type: 'danger svg-danger custom-alert-icon shadow-sm',
      message: ' A customized danger alert with an icon ',
      icon: '<svg class="svg-danger" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"/></svg>'
    },
  ];



  AlertsWithIcons = [
    {
      type: 'primary svg-primary  shadow-sm ',
      icon: ' <svg class="flex-shrink-0 me-2 svg-primary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>',
      message: ' A customized primary alert with an icon ',

    },
    {
      type: 'success svg-success  shadow-sm',
      message: 'A customized success alert with an icon ',
      icon: ' <svg class="flex-shrink-0 me-2 svg-success" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"></path><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></svg>'
    },
    {
      type: 'warning svg-warning  shadow-sm',
      message: ' A customized warning alert with an icon ',
      icon: '<svg class="flex-shrink-0 me-2 svg-warning" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"></rect></g><g><g><g><path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z"></path><polygon points="13,16 11,16 11,18 13,18"></polygon><polygon points="13,10 11,10 11,15 13,15"></polygon></g></g></g></svg>'
    },
    {
      type: 'danger svg-danger  shadow-sm',
      message: ' A customized danger alert with an icon ',
      icon: '<svg class="flex-shrink-0 me-2 svg-danger" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"></rect></g><g><g><g><path d="M15.73,3H8.27L3,8.27v7.46L8.27,21h7.46L21,15.73V8.27L15.73,3z M19,14.9L14.9,19H9.1L5,14.9V9.1L9.1,5h5.8L19,9.1V14.9z"></path><rect height="6" width="2" x="11" y="7"></rect><rect height="2" width="2" x="11" y="15"></rect></g></g></g></svg>'
    },
  ]


  AlertsWithImages = [
    { type: 'primary alert-img  rounded-pill flex-wrap', message: 'A simple primary alert with image—check it out!', image: './assets/images/faces/3.jpg' },
    { type: 'secondary alert-img  rounded-pill flex-wrap', message: 'A simple secondary alert with image—check it out!', image: './assets/images/faces/5.jpg' },
    { type: 'warning alert-img  rounded-pill flex-wrap', message: 'A simple warning alert with image—check it out!', image: './assets/images/faces/8.jpg' },
    { type: 'danger alert-img  rounded-pill flex-wrap', message: 'A simple danger alert with image—check it out!', image: './assets/images/faces/11.jpg' },
    { type: 'info alert-img  rounded-pill flex-wrap', message: 'A simple info alert with image—check it out!', image: './assets/images/faces/13.jpg' },
    { type: 'light alert-img  rounded-pill flex-wrap', message: 'A simple light alert with image—check it out!', image: './assets/images/faces/10.jpg' },
    { type: 'dark alert-img  rounded-pill flex-wrap', message: 'A simple dark alert with image—check it out!', image: './assets/images/faces/15.jpg' }

  ]



  AlertsWithDifferentsizeImages = [

    { type: 'primary alert-img   flex-wrap', message: 'A simple primary alert with image—check it out!', image: './assets/images/faces/3.jpg', avatarClass: 'avatar-xs' },
    { type: 'secondary alert-img   flex-wrap', message: 'A simple secondary alert with image—check it out!', image: './assets/images/faces/5.jpg', avatarClass: 'avatar-sm' },
    { type: 'success alert-img   flex-wrap', message: 'A simple success alert with image—check it out!', image: './assets/images/faces/8.jpg', avatarClass: '' },
    { type: 'danger alert-img   flex-wrap', message: 'A simple danger alert with image—check it out!', image: './assets/images/faces/11.jpg', avatarClass: 'avatar-md' },
    { type: 'info alert-img   flex-wrap', message: 'A simple info alert with image—check it out!', image: './assets/images/faces/13.jpg', avatarClass: 'avatar-lg' },
    { type: 'dark alert-img   flex-wrap', message: 'A simple dark alert with image—check it out!', image: './assets/images/faces/14.jpg', avatarClass: 'avatar-xl' }
  ]


  Additionalcontent = [
    {
      variant: 'primary p-0 overflow-hidden',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      variant: 'secondary p-0 overflow-hidden',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      variant: 'success p-0 overflow-hidden',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      variant: 'warning p-0 overflow-hidden',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
  ];


  infoalerts = [

    {
      class: 'alert alert-solid-primary border border-primary mb-0 p-2',
      icon: ' <svg class="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"> <path d="M0 0h24v24H0V0z" fill="none" /> <path d="M11 7h2v2h 4h2v6h-2zm1-9C6.48 2 2 6 2 12s4.48 10 10 10 10-4 10-10S17.52 2 12 2zm0 18c- 41 0-8-3.59-8-8s3.59-8 8 8 3.59 8 8-3.59 8-8 8z" /> </svg>',
      title: 'Information Alert',
      content: 'Information alert to show to information'
    },
    {
      class: 'alert alert-solid-primary border border-primary mb-0 p-2',
      icon: '<svg class="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width=" 5rem" fill="#000000"> <path d="M0 0h24v24H0V0z" fill="none" /> <path d="M16.59 7.58L10 14.17l- 59-3.58L5 12l5 5 8 2C6.48 2 2 6.48 2 12s4 10 10 10 10-4.48 10-10S1 52 2 12 2zm0 18c-4.42 0-8- 58-8-8s3.58-8 8-8 8 3.58 8-3.58 8-8 8z" /> </svg>',
      title: 'Information Alert',
      content: 'Information alert to show to information'
    },
    {
      class: 'alert alert-solid-primary border border-primary mb-0 p-2',
      icon: '  <svg class="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"> <g>     <rect fill="none" height="24" width="24" /></g> <g> <g> <g> <path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z" /> <polygon points="13,16 11,16 11,18 13,18" /> <polygon points="13,10 11,10 11,15 13,15" />  </g> </g>  </g> </svg>',
      title: 'Information Alert',
      content: 'Information alert to show to information'
    },
    {
      class: 'alert alert-solid-primary border border-primary mb-0 p-2',
      icon: ' <svg class="flex-shrink-0" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"> <g>     <rect fill="none" height="24" width="24" /> </g> <g>     <g>         <g>             <path                 d="M15.73,3H8.27L3,8.27v7.46L8.27,21h7.46L21,15.73V8.27L15.73,3z M19,14.9L14.9,19H9.1L5,14.9V9.1L9.1,5h5.8L19,9.1V14.9z" />             <rect height="6" width="2" x="11" y="7" />             <rect height="2" width="2" x="11" y="15" />         </g>     </g> </g></svg>',
      title: 'Information Alert',
      content: 'Information alert to show to information'
    },
  ]

  removeAlert<T>(array: T[], index: number): void {
    if (index > -1 && index < array.length) {
      // Splicing the array triggers Angular's @for to remove the entire <spk-alerts>
      // element from the DOM, which removes the occupied space.
      array.splice(index, 1);
    }
  }



  InfolightAlertData = [
    {
      id: 57,
      type: 'primary',
      title: 'Information Alert',
      iconColor: 'white',
      iconPath: `<svg class="flex-shrink-0 svg-primary" xmlns="http://www.w3.org/2000/svg" height="1.5rem"
                  viewBox="0 0 24 24" width="1.5rem" fill="#000000">
                  <path d="M0 0h24v24H0V0z" fill="none" />
                  <path
                    d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>`,
      message: 'Information alert to show to information',
    },
    {
      id: 58,
      type: 'secondary',
      title: 'Success Alert',
      iconColor: 'white',
      iconPath: `                                                    <svg class="flex-shrink-0 svg-secondary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"/><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></svg>
`,
      message: 'Success alert to show to success message',
    },
    {
      id: 59,
      type: 'warning',
      title: 'Warning Alert',
      iconColor: 'white',
      iconPath: `
                                                    <svg class="flex-shrink-0 svg-warning" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z"/><polygon points="13,16 11,16 11,18 13,18"/><polygon points="13,10 11,10 11,15 13,15"/></g></g></g></svg>


      `,
      message: 'Warning alert to show to warning message',
    },
    {
      id: 60,
      type: 'danger',
      title: 'danger Alert',
      iconColor: 'white',
      iconPath: `
                                                    <svg class="flex-shrink-0 svg-danger" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M15.73,3H8.27L3,8.27v7.46L8.27,21h7.46L21,15.73V8.27L15.73,3z M19,14.9L14.9,19H9.1L5,14.9V9.1L9.1,5h5.8L19,9.1V14.9z"/><rect height="6" width="2" x="11" y="7"/><rect height="2" width="2" x="11" y="15"/></g></g></g></svg>

      `,
      message: 'danger alert to show to danger message',
    },
  ];



  InfoSolidAlertData = [
    {
      id: 5,
      type: 'solid-primary',
      title: 'Information Alert',
      message: 'Information alert to show to information',
      cancelColor: 'secondary',
      iconPath: `<svg class="flex-shrink-0 svg-white" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>`
    },
    {
      id: 6,
      type: 'solid-secondary',
      title: 'Success Alert',
      message: 'Success alert to show to success message',
      cancelColor: 'danger',
      iconPath: `<svg class="flex-shrink-0 svg-white" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none" /><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /></svg>`
    },
    {
      id: 7,
      type: 'solid-warning',
      title: 'Warning Alert',
      message: 'Warning alert to show warning message',
      cancelColor: 'dark',
      iconPath: `<svg class="flex-shrink-0 svg-white" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24" /></g><g><g><g><path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z" /><polygon points="13,16 11,16 11,18 13,18" /><polygon points="13,10 11,10 11,15 13,15" /></g></g></g></svg>`
    },
    {
      id: 8,
      type: 'solid-danger',
      title: 'Danger Alert',
      message: 'Danger alert to show the danger message',
      cancelColor: 'info',
      iconPath: `<svg class="flex-shrink-0 svg-white" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24" /></g><g><g><g><path d="M15.73,3H8.27L3,8.27v7.46L8.27,21h7.46L21,15.73V8.27L15.73,3z M19,14.9L14.9,19H9.1L5,14.9V9.1L9.1,5h5.8L19,9.1V14.9z" /><rect height="6" width="2" x="11" y="7" /><rect height="2" width="2" x="11" y="15" /></g></g></g></svg>`
    }
  ];


  CustomAlertData = [
    {
      id: 1,
      type: 'primary',
      title: 'Information?',
      message: 'This alert is created to just show the related information.',
      svg: `<svg class="custom-alert-icon svg-primary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>`,
      actions: [
        { label: 'Decline', class: 'btn-outline-danger' },
        { label: 'Accept', class: 'btn-primary' }
      ]
    },
    {
      id: 2,
      type: 'secondary',
      title: 'Confirmed',
      message: 'This alert is created to just show the confirmation message.',
      svg: `<svg class="custom-alert-icon svg-secondary" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none" /><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>`,
      actions: [
        { label: 'Close', class: 'btn-secondary' }
      ]
    },
    {
      id: 3,
      type: 'warning',
      title: 'Warning',
      message: 'This alert is created to just show the warning message.',
      svg: `<svg class="custom-alert-icon svg-warning" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none" /><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" /></svg>`,
      actions: [
        { label: 'Back', class: 'btn-outline-secondary' },
        { label: 'Continue', class: 'btn-warning' }
      ]
    },
    {
      id: 4,
      type: 'danger',
      title: 'danger',
      message: 'This alert is created to just show the danger message.',
      svg: `<svg class="custom-alert-icon svg-danger" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none" /><path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z" /></svg>`,
      actions: [
        { label: 'Delete', class: 'btn-danger' }
      ]
    }
  ];
}


