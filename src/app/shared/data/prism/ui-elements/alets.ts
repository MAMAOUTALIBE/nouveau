export let basicAlert = {
  Html: ` <div class="example">
 <div class="alert alert-warning alert-dismissible fade show" role="alert">
     <strong>Holy guacamole!</strong> You should check in on some of those fields
     below.
     <button type="button" class="btn-close" data-bs-dismiss="alert"
         aria-label="Close"><i class="bi bi-x"></i></button>
 </div>
</div>`,


}
export let liveExample = {
  Html: ` @for (alert of livealerts; track $index) {
            <ngb-alert [dismissible]="true">
                {{ alert }}
            </ngb-alert>
            }
            <button type="button" class="btn btn-primary" (click)="showAlert()">
                Show live alert
            </button>
    `,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
interface Alert {
  type: string;
  message: string;
}
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
alerts!: Alert[];

  livealerts: string[] = []; // Initialize livealerts as an empty array
  showAlert() {
    this.livealerts.push('Nice, you triggered this alert message!');
  }
}
    `,

}
export let outlineAlerts = {
  Html: ` @for(alert of OutlineAlerts; track alert; let i = $index){
            <ngb-alert [dismissible]="true" [class]="alert.class">
                {{alert.title}}
                <button type="button" class="btn-close" (click)="OutlineClose(i)" data-bs-dismiss="alert"
                    aria-label="Close"><i class="bi bi-x"></i></button>
            </ngb-alert>

            }
    `,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
interface Alert {
  type: string;
  message: string;
}
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {

OutlineAlerts = [
    {
      title: 'A simple outline primary alert—check it out!',
      class: 'alert-outline-primary'
    },
    {
      title: 'A simple outline secondary alert—check it out!',
      class: 'alert-outline-secondary'
    },
    {
      title: 'A simple outline danger alert—check it out!',
      class: 'alert-outline-danger'
    },
    {
      title: 'A simple outline warning alert—check it out!',
      class: 'alert-outline-warning'
    },
    {
      title: 'A simple outline success alert—check it out!',
      class: 'alert-outline-success'
    },
    {
      title: 'A simple outline info alert—check it out!',
      class: 'alert-outline-info'
    },
    {
      title: 'A simple outline light alert—check it out!',
      class: 'alert-outline-light'
    },
    {
      title: 'A simple outline dark alert—check it out!',
      class: 'alert-outline-dark'
    }
  ];

  OutlineClose(index: number) {
    this.OutlineAlerts.splice(index, 1); // Remove the alert from the array
  }

}
    `,

}
export let LinkInAlerts = {
  Html: `    @for(alert of linkWithAlerts;track alert){

                <ngb-alert [type]="alert.type" [class]="alert.class"  [dismissible]="false">
                    {{alert.content1}} <a href="javascript:void(0);" class="alert-link">{{alert.content2}}</a>{{alert.content3}}
                </ngb-alert>
            }
    `,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
interface Alert {
  type: string;
  message: string;
}
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {

 linkWithAlerts=[

    {
      content1:'A simple primary alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-primary',
      type:'primary'
    },
    {
      content1:'A simple secondary alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-secondary',
      type:'secondary'
    },
    {
      content1:'A simple warning alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-warning',
      type:'warning'
    },
    {
      content1:'A simple success alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-success',
      type:'success'
    },
    {
      content1:'A simple info alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-info',
      type:'info'
    },
    {
      content1:'A simple light alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-light',
      type:'light'
    },
    {
      content1:'A simple dark alert with',
      content2:'an example link',
      content3:'Give it a click if you like.',
      class:'alert alert-dark',
      type:'dark'
    },
  ]
} `,

}

export let SolidAlertsWithDifferentShadows = {
  Html: `  @for (alert of shadowAlert; track alert; let i = $index) {
            <ngb-alert [class]="alert.class">
                {{ alert.title }}
                <button type="button" class="btn-close" (close)="shodowClose(i)" data-bs-dismiss="alert"
                    aria-label="Close">
                    <i class="bi bi-x"></i>
                </button>

            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  shadowAlert = [
    { class: 'alert alert-solid-primary shadow-sm alert-dismissible fade show', title: 'A simple solid primary alert—check it out!' },
    { class: 'alert alert-solid-primary shadow-sm alert-dismissible fade show', title: 'A simple solid primary alert—check it out!' }, // No
    { class: 'alert alert-solid-primary shadow-sm alert-dismissible fade show', title: 'A simple solid primary alert—check it out!' },
    { class: 'alert alert-solid-secondary shadow-sm alert-dismissible fade show', title: 'A simple solid secondary alert—check it out!' }, // No shadow
    { class: 'alert alert-solid-secondary shadow-sm alert-dismissible fade show', title: 'A simple solid secondary alert—check it out!' },
    { class: 'alert alert-solid-secondary shadow-sm alert-dismissible fade show', title: 'A simple solid secondary alert—check it out!' }, // No shadow
  ];

  shodowClose(index: number) {
    this.shadowAlert.splice(index, 1); // Remove the alert from the array
  }

}
    `,

}



export let DefaultAlertsWithDifferentShadows = {
  Html: ` @for(alert of DiffshadowAlert;track alert ){
            <ngb-alert [class]="alert.class">
                {{ alert.title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {

  DiffshadowAlert = [
    {
      title: 'A simple primary alert with small shadow—check it out!',
      class: 'alert alert-primary shadow-sm',
    },
    {
      title: 'A simple primary alert with normal shadow—check it out!',
      class: 'alert alert-primary shadow-sm '
    },
    {
      title: 'A simple primary alert with large shadow—check it out!',
      class: 'alert alert-primary shadow-sm',
    },
    {
      title: 'A simple secondary alert with small shadow—check it out!', class: 'alert alert-secondary shadow-sm',
    },
    {

      title: 'A simple secondary alert with normal shadow—check it out!', class: 'alert alert-secondary shadow-sm'
    },
    {
      title: 'A simple secondary alert with large shadow—check it out!', class: 'alert alert-secondary shadow-sm',
    },
  ];

}
    `,

}

export let DefaultAlerts = {
  Html: ` @for(alert of DefaultAlerts;track alert ){
            <ngb-alert [type]="alert.type">
                {{ alert.Title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  DefaultAlerts = [
    {

      type: 'primary',
      Title: '   A simple primary alert—check it out!'
    },
    {

      type: 'secondary',
      Title: '   A simple secondary alert—check it out!'
    },
    {

      type: 'success',
      Title: '   A simple success alert—check it out!'
    },
    {

      type: 'danger',
      Title: '   A simple danger alert—check it out!'
    },
    {

      type: 'warning',
      Title: '   A simple warning alert—check it out!'
    },
    {

      type: 'info',
      Title: '   A simple info alert—check it out!'
    },
    {

      type: 'light',
      Title: '   A simple light alert—check it out!'
    },
    {

      type: 'dark',
      Title: '   A simple dark alert—check it out!'
    },
  ]
}
    `,

}


export let SolidColoredAlerts = {
  Html: `  @for(alert of SolidColoredAlerts;track alert ){
            <ngb-alert [dismissible]="true" [class]="alert.class">
                {{ alert.title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  SolidColoredAlerts = [
    {
      title: '  A simple solid primary alert—check it out!',
      class: 'alert alert-solid-primary alert-dismissible fade show'
    },
    {
      title: '  A simple solid secondary alert—check it out!',
      class: 'alert alert-solid-secondary alert-dismissible fade show'
    },
    {
      title: '  A simple solid info alert—check it out!',
      class: 'alert alert-solid-info alert-dismissible fade show'
    },
    {
      title: '  A simple solid warning alert—check it out!',
      class: 'alert alert-solid-warning alert-dismissible fade show'
    },
    {
      title: '  A simple solid success alert—check it out!',
      class: 'alert alert-solid-success alert-dismissible fade show'
    },
    {
      title: '  A simple solid danger alert—check it out!',
      class: 'alert alert-solid-danger alert-dismissible fade show'
    },
    {
      title: '  A simple solid light alert—check it out!',
      class: 'alert alert-solid-light alert-dismissible fade show'
    },
    {
      title: '  A simple solid dark alert—check it out!',
      class: 'alert alert-solid-dark alert-dismissible fade show'
    },


  ]
}
    `,

}


export let RoundedSolidAlerts = {
  Html: `   @for(alert of RoundedSolidAlerts;track alert ){
            <ngb-alert [class]="alert.class">
                {{ alert.title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
 RoundedSolidAlerts = [
    {
      title: '  A simple solid primary alert—check it out!',
      class: 'alert alert-solid-primary alert-dismissible fade show rounded-pill'
    },
    {
      title: '  A simple solid secondary alert—check it out!',
      class: 'alert alert-solid-secondary alert-dismissible fade show rounded-pill'
    },

    {
      title: '  A simple solid warning alert—check it out!',
      class: 'alert alert-solid-warning alert-dismissible fade show rounded-pill'
    },
    {
      title: '  A simple solid danger alert—check it out!',
      class: 'alert alert-solid-danger alert-dismissible fade show rounded-pill'
    },

  ]
}
    `,

}

export let RoundedOutlineAlerts = {
  Html: `@for(alert of RoundedOutlineAlerts;track alert ){
            <ngb-alert [class]="alert.class">
                {{ alert.title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
 RoundedOutlineAlerts = [
    {
      title: ' A simple outline rounded primary alert—check it out!',
      class: 'alert  alert-outline-primary alert-dismissible fade show rounded-pill'
    },
    {
      title: ' A simple outline rounded secondary alert—check it out!',
      class: 'alert  alert-outline-secondary alert-dismissible fade show rounded-pill'
    },
    {
      title: ' A simple outline rounded warning alert—check it out!',
      class: 'alert  alert-outline-warning alert-dismissible fade show rounded-pill'
    },

    {
      title: ' A simple outline rounded danger alert—check it out!',
      class: 'alert  alert-outline-danger alert-dismissible fade show rounded-pill'
    },

  ]
}
    `,

}


export let RoundedDefaultAlerts = {
  Html: `  @for(alert of RoundedDefaultAlerts;track alert ){
            <ngb-alert [class]="alert.class">
                {{ alert.title }}
            </ngb-alert>
            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  RoundedDefaultAlerts = [
    {
      title: ' A simple rounded primary alert—check it out!',
      class: 'alert  alert-primary alert-dismissible fade show rounded-pill'
    },
    {
      title: ' A simple rounded secondary alert—check it out!',
      class: 'alert  alert-secondary alert-dismissible fade show rounded-pill'
    },
    {
      title: ' A simple rounded warning alert—check it out!',
      class: 'alert  alert-warning alert-dismissible fade show rounded-pill'
    },

    {
      title: ' A simple rounded danger alert—check it out!',
      class: 'alert  alert-danger alert-dismissible fade show rounded-pill'
    },

  ]
}
    `,

}



export let RoundedAlertsWithCustomCloseButton = {
  Html: ` @for (alert of RoundedAlertsWithCustomCloseButton; track alert; let i = $index) {
            <ngb-alert [class]="alert.color" [dismissible]="true" (close)="CustomeButtonClose(i)">
                {{alert.title}}
                <button type="button" class="btn-close custom-close" (close)="CustomeButtonClose(i)"
                    data-bs-dismiss="alert" aria-label="Close">
                    <i class="bi bi-x"></i>
                </button>
            </ngb-alert>

            }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
RoundedAlertsWithCustomCloseButton = [
    { color: 'alert alert-primary rounded-pill alert-dismissible fade show', title: 'A simple primary alert—check it out!' },
    { color: 'alert alert-secondary rounded-pill alert-dismissible fade show', title: 'A simple secondary alert—check it out!' },
    { color: 'alert alert-warning rounded-pill alert-dismissible fade show', title: 'A simple warning alert—check it out!' },
    { color: 'alert alert-danger rounded-pill alert-dismissible fade show', title: 'A simple danger alert—check it out!' },
  ];

  CustomeButtonClose(index: number) {
    // Remove the alert from the array based on the index
    this.RoundedAlertsWithCustomCloseButton.splice(index, 1);
  }
}
    `,

}
export let CustomizedAlertsWithSVG = {
  Html: `  @for (alert of CustomizedAlertsWithSVG; track $index) {
        <ngb-alert [class]="alert.type">
            <span [innerHTML]="getSanitizedSVG(alert.icon)"></span>
            {{alert.message}}
        </ngb-alert>
        }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
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
      type: 'warning svg-warning custom-alert-icon shadow-sm',
      message: ' A customized warning alert with an icon ',
      icon: '<svg class="svg-warning" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>'
    },
    {
      type: 'danger svg-danger custom-alert-icon shadow-sm',
      message: ' A customized danger alert with an icon ',
      icon: '<svg class="svg-danger" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM12 17.3c-.72 0-1.3-.58-1.3-1.3 0-.72.58-1.3 1.3-1.3.72 0 1.3.58 1.3 1.3 0 .72-.58 1.3-1.3 1.3zm1-4.3h-2V7h2v6z"/></svg>'
    },
  ];
  getSanitizedSVG(svgContent: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }

}
    `,

}
export let AlertsWithIcons = {
  Html: `  @for (alert of AlertsWithIcons; track alert; let i = $index) {
        <ngb-alert [class]="alert.class">
            <span [innerHTML]="getSanitizedSVG(alert.icon)"></span>
            {{alert.message}}
        </ngb-alert>
        }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
 AlertsWithIcons = [
    {
      class: 'alert alert-primary svg-primary d-flex align-items-center ',
      icon: ' <svg class="flex-shrink-0 me-2" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg>',
      message: ' A customized primary alert with an icon ',

    },
    {
      class: 'alert alert-success svg-success d-flex align-items-center',
      message: 'A customized success alert with an icon ',
      icon: ' <svg class="flex-shrink-0 me-2" xmlns="http://www.w3.org/2000/svg" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"></path><path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"></path></svg>'
    },
    {
      class: 'alert alert-warning svg-warning d-flex align-items-center',
      message: ' A customized warning alert with an icon ',
      icon: '<svg class="flex-shrink-0 me-2" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"></rect></g><g><g><g><path d="M12,5.99L19.53,19H4.47L12,5.99 M12,2L1,21h22L12,2L12,2z"></path><polygon points="13,16 11,16 11,18 13,18"></polygon><polygon points="13,10 11,10 11,15 13,15"></polygon></g></g></g></svg>'
    },
    {
      class: 'alert alert-danger svg-danger d-flex align-items-center',
      message: ' A customized danger alert with an icon ',
      icon: '<svg class="flex-shrink-0 me-2" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="1.5rem" viewBox="0 0 24 24" width="1.5rem" fill="#000000"><g><rect fill="none" height="24" width="24"></rect></g><g><g><g><path d="M15.73,3H8.27L3,8.27v7.46L8.27,21h7.46L21,15.73V8.27L15.73,3z M19,14.9L14.9,19H9.1L5,14.9V9.1L9.1,5h5.8L19,9.1V14.9z"></path><rect height="6" width="2" x="11" y="7"></rect><rect height="2" width="2" x="11" y="15"></rect></g></g></g></svg>'
    },
  ]

}
    `,

}





export let AlertsWithImages = {
  Html: ` @for(alert of AlertsWithImages;track $index; let i = $index){
        <ngb-alert [class]="alert.type" [dismissible]="true" (close)="imageAlertsClose(i)">
            <div class="avatar avatar-sm me-3 avatar-rounded">
                <img [src]="alert.image" alt="img" />
            </div>
            {{alert.message}}
            <button type="button" class="btn-close" (close)="imageAlertsClose(i)" data-bs-dismiss="alert"
                aria-label="Close">
                <i class="bi bi-x"
                    [ngClass]="alert.type === 'dark alert-img  rounded-pill flex-wrap' ? 'text-muted' : ''">
                </i>
            </button>
        </ngb-alert>
        }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  AlertsWithImages = [
    { type: 'alert alert-img alert-primary alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple primary alert with image—check it out!', image: './assets/images/faces/3.jpg' },
    { type: 'alert alert-img alert-secondary alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple secondary alert with image—check it out!', image: './assets/images/faces/5.jpg' },
    { type: 'alert alert-img alert-warning alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple warning alert with image—check it out!', image: './assets/images/faces/8.jpg' },
    { type: 'alert alert-img alert-danger alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple danger alert with image—check it out!', image: './assets/images/faces/11.jpg' },
    { type: 'alert alert-img alert-info alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple info alert with image—check it out!', image: './assets/images/faces/13.jpg' },
    { type: 'alert alert-img alert-light alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple light alert with image—check it out!', image: './assets/images/faces/10.jpg' },
    { type: 'alert alert-img alert-dark alert-dismissible fase show rounded-pill flex-wrap', message: 'A simple dark alert with image—check it out!', image: './assets/images/faces/15.jpg' }

  ]

  imageAlertsClose(index: number) {
    this.AlertsWithImages.splice(index, 1); // Remove the alert from the array
  }
}
    `,

}
export let AlertsWithDifferentSizeImages = {
  Html: `@for(alert of AlertsWithDifferentsizeImages;track $index; let i = $index){
        <ngb-alert [class]="alert.class" [dismissible]="true" (close)="ImageSizeAlertclose(i)">
            <div class="avatar {{alert.avatarClass }} me-3">
                <img [src]="alert.image" alt="img" />
            </div>
            {{alert.message}}
            <button type="button" class="btn-close" (close)="ImageSizeAlertclose(i)" data-bs-dismiss="alert"
                aria-label="Close">
                <i class="bi bi-x" [ngClass]="alert.class === 'dark alert-img   flex-wrap' ? 'text-muted' : ''"> </i>
            </button>
        </ngb-alert>
        }`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {
  AlertsWithDifferentsizeImages = [

    { class: 'alert alert-img alert-primary alert-dismissible fase show flex-wrap', message: 'A simple primary alert with image—check it out!', image: './assets/images/faces/3.jpg', avatarClass: 'avatar-xs' },
    { class: 'alert alert-img alert-secondary alert-dismissible fase show flex-wrap', message: 'A simple secondary alert with image—check it out!', image: './assets/images/faces/5.jpg', avatarClass: 'avatar-sm' },
    { class: 'alert alert-img alert-warning alert-dismissible fase show flex-wrap', message: 'A simple warning alert with image—check it out!', image: './assets/images/faces/8.jpg', avatarClass: '' },
    { class: 'alert alert-img alert-danger alert-dismissible fase show flex-wrap', message: 'A simple danger alert with image—check it out!', image: './assets/images/faces/11.jpg', avatarClass: 'avatar-md' },
    { class: 'alert alert-img alert-info alert-dismissible fase show flex-wrap', message: 'A simple info alert with image—check it out!', image: './assets/images/faces/13.jpg', avatarClass: 'avatar-lg' },
    { class: 'alert alert-img alert-dark alert-dismissible fase show flex-wrap', message: 'A simple dark alert with image—check it out!', image: './assets/images/faces/14.jpg', avatarClass: 'avatar-xl' }
  ]

  ImageSizeAlertclose(index: number) {
    // Remove the alert from the array based on the index
    this.AlertsWithDifferentsizeImages.splice(index, 1);
  }
}
    `,

}




export let AdditionalContent = {
  Html: `<div class="row gy-3 additional-style">
            @for (alert of Additionalcontent; track alert; let i = $index) {
            <div class="col-xl-6">
                <ngb-alert [class]="alert.class1" [title]="alert.title" [dismissible]="true">
                    <div [class]="alert.class2">
                        <h6 class="aletr-heading mb-0 text-fixed-white">{{alert.title}}</h6>
                    </div>
                    <hr class="my-0">
                    <div class="p-3">
                        <p class="mb-0">{{alert.message}} <a href="javascript:void(0);"
                                class="fw-medium text-decoration-underline"> {{alert.linkTitle}}</a></p>
                    </div>

                </ngb-alert>
            </div>
            }
        </div>`,
  Ts: `
import { Component } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
@Component({
selector: 'app-alerts',
imports: [NgbAlertModule],
templateUrl: './alerts.html',
styleUrl: './alerts.scss'
})
export class AlertsComponent {

  Additionalcontent = [
    {
      class1: 'alert alert-primary overflow-hidden p-0',
      class2: 'p-3 bg-primary text-fixed-white d-flex justify-content-between',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      class1: 'alert alert-secondary overflow-hidden p-0',
      class2: 'p-3 bg-secondary text-fixed-white d-flex justify-content-between',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      class1: 'alert alert-danger overflow-hidden p-0',
      class2: 'p-3 bg-danger text-fixed-white d-flex justify-content-between',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
    {
      class1: 'alert alert-warning overflow-hidden p-0',
      class2: 'p-3 bg-warning text-fixed-white d-flex justify-content-between',
      title: 'Thank you for reporting this.',
      message: 'We appreciate you letting us know the bug in the template and for warning us about future consequences.',
      linkTitle: 'Visit for support for queries ?'
    },
  ]

}
    `,

}



















