export let badges = {
  Html: `@for (item of Pillbadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  Pillbadges = [
    {
      class: 'badge bg-primary',
      title: 'Primary',
    },
    {
      class: 'badge  bg-secondary',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-success',
      title: 'Success',
    },
    {
      class: 'badge  bg-danger',
      title: 'Danger',
    },
    {
      class: 'badge  bg-warning',
      title: 'Warning',
    },
    {
      class: 'badge  bg-info',
      title: 'Info',
    },
    {
      class: 'badge  bg-light text-dark',
      title: 'Light',
    },
    {
      class: 'badge  bg-dark text-light',
      title: 'Dark',
    },
  ]

}
    `,

}


export let LightPillBadges = {
  Html: `   @for (item of LightPillBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  LightPillBadges = [
    {
      class: 'badge  bg-primary',
      title: 'Primary',
    },
    {
      class: 'badge  bg-secondary-transparent',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-success-transparent',
      title: 'Success',
    },
    {
      class: 'badge  bg-danger-transparent',
      title: 'Danger',
    },
    {
      class: 'badge  bg-warning-transparent',
      title: 'Warning',
    },
    {
      class: 'badge  bg-info-transparent',
      title: 'Info',
    },
    {
      class: 'badge  bg-light-transparent text-dark',
      title: 'Light',
    },
    {
      class: 'badge  bg-dark-transparent ',
      title: 'Dark',
    },
  ]
}
    `,

}



export let PillRoundedBadges= {
  Html: ` @for (item of PillRoundedBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  PillRoundedBadges = [
    {
      class: 'badge  bg-primary-transparent',
      title: 'Primary',
    },
    {
      class: 'badge rounded-pill bg-secondary-transparent',
      title: 'Secondary',
    },
    {
      class: 'badge rounded-pill bg-success-transparent',
      title: 'Success',
    },
    {
      class: 'badge rounded-pill bg-danger-transparent',
      title: 'Danger',
    },
    {
      class: 'badge rounded-pill bg-warning-transparent',
      title: 'Warning',
    },
    {
      class: 'badge rounded-pill bg-info-transparent',
      title: 'Info',
    },
    {
      class: 'badge rounded-pill bg-light-transparent text-dark',
      title: 'Light',
    },
    {
      class: 'badge rounded-pill bg-dark-transparent ',
      title: 'Dark',
    },
  ]
}
    `,

}


export let  LightPillRoundedBadges= {
  Html: ` @for (item of LightPillRoundedBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  LightPillRoundedBadges = [
    {
      class: 'badge rounded-pill bg-primary-transparent',
      title: 'Primary',
    },
    {
      class: 'badge rounded-pill bg-secondary-transparent',
      title: 'Secondary',
    },
    {
      class: 'badge rounded-pill bg-success-transparent',
      title: 'Success',
    },
    {
      class: 'badge rounded-pill bg-danger-transparent',
      title: 'Danger',
    },
    {
      class: 'badge rounded-pill bg-warning-transparent',
      title: 'Warning',
    },
    {
      class: 'badge rounded-pill bg-info-transparent',
      title: 'Info',
    },
    {
      class: 'badge rounded-pill bg-light-transparent text-dark',
      title: 'Light',
    },
    {
      class: 'badge rounded-pill bg-dark-transparent ',
      title: 'Dark',
    },
  ]
}
    `,

}


export let  GradientBadges= {
  Html: ` @for (item of GradientBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
 GradientBadges = [
    {
      class: 'badge  bg-primary',
      title: 'Primary',
    },
    {
      class: 'badge  bg-secondary',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-success',
      title: 'Success',
    },
    {
      class: 'badge  bg-danger',
      title: 'Danger',
    },
    {
      class: 'badge  bg-warning',
      title: 'Warning',
    },
    {
      class: 'badge  bg-info',
      title: 'Info',
    },
    {
      class: 'badge  bg-light text-dark',
      title: 'Light',
    },
    {
      class: 'badge  bg-dark ',
      title: 'Dark',
    },
  ]
}
    `,

}


export let GradientRoundedBadges= {
  Html: `   @for (item of GradientPillRoundedBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  GradientPillRoundedBadges = [
    {
      class: 'badge bg-primary rounded-pill ',
      title: 'Primary',
    },
    {
      class: 'badge  bg-secondary rounded-pill ',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-success rounded-pill ',
      title: 'Success',
    },
    {
      class: 'badge  bg-danger rounded-pill ',
      title: 'Danger',
    },
    {
      class: 'badge  bg-warning rounded-pill ',
      title: 'Warning',
    },
    {
      class: 'badge  bg-info rounded-pill ',
      title: 'Info',
    },
    {
      class: 'badge  bg-light text-dark rounded-pill ',
      title: 'Light',
    },
    {
      class: 'badge  bg-dark text-light rounded-pill ',
      title: 'Dark',
    },
  ]
}
    `,

}


export let OutlineBadges= {
  Html: ` @for (item of OutlineBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  OutlineBadges = [
    {
      class: 'badge  bg-outline-primary',
      title: 'Primary',
    },
    {
      class: 'badge  bg-outline-secondary',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-outline-success',
      title: 'Success',
    },
    {
      class: 'badge  bg-outline-danger',
      title: 'Danger',
    },
    {
      class: 'badge  bg-outline-warning',
      title: 'Warning',
    },
    {
      class: 'badge  bg-outline-info',
      title: 'Info',
    },
    {
      class: 'badge  bg-outline-light text-dark',
      title: 'Light',
    },
    {
      class: 'badge  bg-outline-dark ',
      title: 'Dark',
    },
  ]
}
    `,

}


export let OutlinePillRoundedBadges= {
  Html: `@for (item of OutlinePillRoundedBadges; track $index) {
            <span [class]="item.class">
                {{item.title}}
            </span>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
OutlinePillRoundedBadges = [
    {
      class: 'badge  bg-outline-primary rounded-pill',
      title: 'Primary',
    },
    {
      class: 'badge  bg-outline-secondary rounded-pill',
      title: 'Secondary',
    },
    {
      class: 'badge  bg-outline-success rounded-pill',
      title: 'Success',
    },
    {
      class: 'badge  bg-outline-danger rounded-pill',
      title: 'Danger',
    },
    {
      class: 'badge  bg-outline-warning rounded-pill',
      title: 'Warning',
    },
    {
      class: 'badge  bg-outline-info rounded-pill',
      title: 'Info',
    },
    {
      class: 'badge  bg-outline-light text-dark rounded-pill',
      title: 'Light',
    },
    {
      class: 'badge  bg-outline-dark rounded-pill',
      title: 'Dark',
    },
  ]
}
    `,

}


export let ButtonsWithBadges = {
  Html: `      @for (item of ButtonsWithBadges; track $index) {
            <button type="button" [class]="item.buttonClass">
                Notifications <span [class]="item.spanClass">{{item.number}}</span>
            </button>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
 ButtonsWithBadges = [

    {
      buttonClass: 'btn btn-primary my-1 me-2',
      spanClass: "badge ms-2 bg-secondary",
      number: 4
    },
    {
      buttonClass: 'btn btn-secondary my-1 me-2',
      spanClass: "badge ms-2 bg-primary",
      number: 7
    },
    {
      buttonClass: 'btn btn-warning my-1 me-2',
      spanClass: "badge ms-2 bg-danger",
      number: 12
    },
    {
      buttonClass: 'btn btn-info my-1 me-2',
      spanClass: "badge ms-2 bg-warning",
      number: 32
    },
  ]
}
    `,

}


export let OutlineButtonBadges = {
  Html: ` @for (item of OutlineButtonBadges; track $index) {
            <button type="button" [class]="item.buttonClass">
                Notifications <span class="badge ms-2">{{item.number}}</span>
            </button>
            }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
  OutlineButtonBadges = [

    {
      buttonClass: 'btn btn-outline-primary my-1 me-2',

      number: 4
    },
    {
      buttonClass: 'btn btn-outline-secondary my-1 me-2',

      number: 7
    },
    {
      buttonClass: 'btn btn-outline-danger my-1 me-2',

      number: 12
    },
    {
      buttonClass: 'btn btn-outline-ino my-1 me-2',

      number: 32
    },
  ]
}
    `,

}


export let  PositionedBadges= {
  Html: ` @for (item of PositionedBadges; track $index) {
                    @if(!item.img){
                    <button type="button" [class]="item.buttonclass">
                        {{item.title}}
                        <span [class]="item.spanClass">
                            {{item.text}}
                            <span class="visually-hidden">{{item.messages}}</span>
                        </span>
                    </button>
                    }@else{
                    <span class="avatar">
                        <img [src]="item.src" alt="img">
                        <span [class]="item.spanClass">
                            <span class="visually-hidden">{{item.title}}</span>
                        </span>
                    </span>
                    }

                    }`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {
PositionedBadges = [
    {
      buttonclass: 'btn btn-primary position-relative',
      title: '  Inbox',
      spanClass: 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger',
      text: ' 99+',
      messages: 'unread messages',
      img:false
    },
    {
      buttonclass: 'btn btn-secondary position-relative',
      title: '  Profile',
      spanClass: 'position-absolute top-80 start-100 translate-middle p-2 bg-primary border border-light rounded-circle',
      text: ' 99+',
      messages: 'New alerts',
      img:false
    },
    {
      img:true,
      src:'./assets/images/faces/2.jpg',
      spnaClass:'position-absolute top-0 start-100 translate-middle p-1 bg-primary border border-light rounded-circle',
      title:'New alerts'
    },
    {
      img:true,
      src:'./assets/images/faces/15.jpg',
      spnaClass:'position-absolute top-80 start-100 translate-middle p-1 bg-primary border border-light rounded-circle',
      title:'New alerts'
    },
    {
      img:true,
      src:'./assets/images/faces/10.jpg',
      spnaClass:'position-absolute top-0 start-100 translate-middle badge bg-secondary rounded-pill shadow-lg',
      title:'New alerts'
    },

  ]
}
    `,

}
export let  CustomBadges= {
  Html: `  <div class="d-flex align-items-center gap-5 flex-wrap">
                            <div>
                                <span
                                    class="badge bg-outline-secondary custom-badge fs-15 d-inline-flex align-items-center"><i
                                        class="ti ti-flame me-1"></i>Hot</span>
                            </div>
                            <div>
                                <span class="icon-badge">
                                    <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="24px"
                                        viewBox="0 0 24 24" width="24px" fill="#000000">
                                        <path
                                            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                                    </svg>
                                    <span class="badge rounded-pill bg-primary">14</span>
                                </span>
                            </div>
                            <div>
                                <span class="badge border bg-light text-default custom-badge"><i
                                        class="fe fe-eye me-2 d-inline-block"></i>13.2k</span>
                            </div>
                            <div>
                                <span class="text-badge">
                                    <span class="text fs-18">Inbox</span>
                                    <span class="badge rounded-pill bg-primary">32</span>
                                </span>
                            </div>
                        </div>`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {

}
    `,

}
export let  Headings= {
  Html: `  <h1>Example heading <span class="badge bg-primary">New</span></h1>
            <h2>Example heading <span class="badge bg-primary">New</span></h2>
            <h3>Example heading <span class="badge bg-primary">New</span></h3>
            <h4>Example heading <span class="badge bg-primary">New</span></h4>
            <h5>Example heading <span class="badge bg-primary">New</span></h5>
            <h6>Example heading <span class="badge bg-primary">New</span></h6>`,
  Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {

}
    `,

}



