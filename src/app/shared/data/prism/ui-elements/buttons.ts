export let DefaultButtons = {
    Html: ` <div class="btn-list">
                @for (item of DefaultButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div>`,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent { DefaultButtons = [
    {
      buttonclass: 'btn btn-primary btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary btn-wave',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success btn-wave',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger btn-wave',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning btn-wave',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info btn-wave',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light btn-wave',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark btn-wave text-white',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link btn-wave',
      buttonname: 'Link'
    },
]}
    `,
}
export let RoundedButtons = {
    Html: `   <div class="btn-list">
                @for (item of RoundedButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div>`,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
 RoundedButtons = [
    {
      buttonclass: 'btn btn-primary btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light btn-wave rounded-pill',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark btn-wave text-white rounded-pill',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link btn-wave rounded-pill',
      buttonname: 'Link'
    },
]}
    `,

}

export let LightButtons = {
    Html: `  <div class="btn-list">
                @for (item of LightButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
  LightButtons = [
    {
      buttonclass: 'btn btn-primary-light btn-wave',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-light btn-wave',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-light btn-wave',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-light btn-wave',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-light btn-wave',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-light btn-wave',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light-light btn-wave',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark-light  btn-wave text-white',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link-light btn-wave',
      buttonname: 'Link'
    },
]}
    `,

}
export let LightRoundedButtons = {
    Html: ` @for (item of LightRoundedButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent { 
LightRoundedButtons = [
    {
      buttonclass: 'btn btn-primary-light btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-light btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-light btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-light btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-light btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-light btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-light-light btn-wave rounded-pill',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-dark-light  btn-wave text-white rounded-pill',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-link-light btn-wave rounded-pill',
      buttonname: 'Link'
    },
]}
    `,

}
export let OutlineButtons = {
    Html: `  <div class="btn-list">
                @for (item of OutlineButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
 OutlineButtons = [
    {
      buttonclass: 'btn btn-outline-primary btn-wave ',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-outline-secondary btn-wave ',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-outline-success btn-wave ',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-outline-danger btn-wave ',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-outline-warning btn-wave ',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-outline-info btn-wave ',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-outline btn-wave ',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-outline-dark  btn-wave ',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-outline-link btn-wave ',
      buttonname: 'Link'
    },
  ]}
    `,

}

export let RoundedOutlineButtons = {
    Html: ` <div class="btn-list">
                @for (item of RoundedOutlineButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
  RoundedOutlineButtons = [
    {
      buttonclass: 'btn btn-outline-primary btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-outline-secondary btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-outline-success btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-outline-danger btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-outline-warning btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-outline-info btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-outline btn-wave rounded-pill',
      buttonname: 'Light'
    },
    {
      buttonclass: 'btn btn-outline-dark  btn-wave rounded-pill',
      buttonname: 'Dark'
    },
    {
      buttonclass: 'btn btn-outline-link btn-wave rounded-pill',
      buttonname: 'Link'
    },
  ]}  `,

}
export let GradientButtons = {
    Html: `<div class="btn-list">
                @for (item of GradientButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
  GradientButtons = [
    {
      buttonclass: 'btn btn-primary-gradient btn-wave',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-gradient btn-wave',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-gradient btn-wave',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-gradient btn-wave',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-gradient btn-wave',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-gradient btn-wave',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-gradient btn-wave',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-gradient btn-wave',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-gradient btn-wave',
      buttonname: 'Teal'
    },
]}   `,

}


export let RoundedGradientButtons = {
    Html: `  <div class="btn-list">
                @for (item of RoundedGradientButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
RoundedGradientButtons = [
    {
      buttonclass: 'btn btn-primary-gradient btn-wave rounded-pill',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-gradient btn-wave rounded-pill',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-gradient btn-wave rounded-pill',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-gradient btn-wave rounded-pill',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-gradient btn-wave rounded-pill',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-gradient btn-wave rounded-pill',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-gradient btn-wave rounded-pill',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-gradient btn-wave rounded-pill',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-gradient btn-wave rounded-pill',
      buttonname: 'Teal'
    },
  ]}
    `,

}




export let GhostButtons = {
    Html: `  <div class="btn-list">
                @for (item of GhostButtons; track $index) {
                <button type="button" [class]="item.buttonclass">{{item.buttonname}}</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
 GhostButtons = [
    {
      buttonclass: 'btn btn-primary-ghost btn-wave ',
      buttonname: 'Primary'
    },
    {
      buttonclass: 'btn btn-secondary-ghost btn-wave ',
      buttonname: 'Secondary'
    },
    {
      buttonclass: 'btn btn-success-ghost btn-wave ',
      buttonname: 'Success'
    },
    {
      buttonclass: 'btn btn-danger-ghost btn-wave ',
      buttonname: 'Danger'
    },
    {
      buttonclass: 'btn btn-warning-ghost btn-wave ',
      buttonname: 'Warning'
    },
    {
      buttonclass: 'btn btn-info-ghost btn-wave ',
      buttonname: 'Info'
    },
    {
      buttonclass: 'btn btn-orange-ghost btn-wave ',
      buttonname: 'Orange'
    },
    {
      buttonclass: 'btn btn-purple-ghost btn-wave ',
      buttonname: 'Purple'
    },
    {
      buttonclass: 'btn btn-teal-ghost btn-wave ',
      buttonname: 'Teal'
    },
  ]}
    `,

}




export let Buttontags = {
    Html: ` <div class="btn-list">
                <a class="btn btn-primary btn-wave" href="javascript:void(0);" role="button">Link</a>
                <button class="btn btn-secondary btn-wave" type="submit">Button</button>
                <input class="btn btn-info" type="button" value="Input">
                <input class="btn btn-warning" type="submit" value="Submit">
                <input class="btn btn-success" type="reset" value="Reset">
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}




export let disabledstatewithanchortags = {
    Html: `   <div class="btn-list">
                <div class="mb-4">
                    <button type="button" class="btn btn-primary" disabled="">Primary
                        button</button>
                    <button type="button" class="btn btn-secondary" disabled="">Button</button>
                    <button type="button" class="btn btn-outline-primary" disabled="">Primary
                        button</button>
                    <button type="button" class="btn btn-outline-secondary" disabled="">Button</button>
                </div>

                <div>
                    <a class="btn btn-primary disabled" role="button" aria-disabled="true">Primary
                        link</a>
                    <a class="btn btn-secondary disabled" role="button" aria-disabled="true">Link</a>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}



export let buttonplugintogglestates = {
    Html: `   <div class="btn-list">
                <div class="mb-4">
                    <button type="button" class="btn btn-primary btn-wave" data-bs-toggle="button">Toggle
                        button</button>
                    <button type="button" class="btn btn-secondary active btn-wave" data-bs-toggle="button"
                        aria-pressed="true">Active toggle button</button>
                    <button type="button" class="btn btn-teal btn-wave" disabled data-bs-toggle="button">Disabled
                        toggle
                        button</button>
                </div>
                <div>
                    <a href="javascript:void(0);" class="btn btn-primary btn-wave" role="button"
                        data-bs-toggle="button">Toggle
                        link</a>
                    <a href="javascript:void(0);" class="btn btn-secondary active btn-wave" role="button"
                        data-bs-toggle="button" aria-pressed="true">Active toggle link</a>
                    <a class="btn btn-teal disabled btn-wave" aria-disabled="true" role="button"
                        data-bs-toggle="button">Disabled toggle link</a>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
    `,

}



export let Linkfunctionallycaveat = {
    Html: `  <div class="btn-list">
                <a class="btn btn-primary disabled" tabindex="-1" role="button" aria-disabled="true">Primary
                    link</a>
                <a class="btn btn-secondary disabled" tabindex="-1" role="button" aria-disabled="true">Link</a>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
    `,

}


export let LoadingButtons = {
    Html: ` <div class="btn-list d-md-flex flex-wrap">
                @for (item of LoadingButtons; track $index) {

                <button [class]="item.class">
                    <span class="me-2">Loading</span>
                    <span class="loading"><i class="ri-loader-2-fill fs-16"></i></span>
                </button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
  LoadingButtons = [
    {
      class: "btn btn-primary btn-loader"
    },
    {
      class: "btn btn-outline-secondary btn-loader"
    },
    {
      class: "btn btn-info-light btn-loader"
    },
    {
      class: "btn btn-warning-light btn-loader"
    },
    {
      class: "btn btn-success btn-loader disabled"
    },
  ]}`,

}
export let IconButtons = {
    Html: `
            <div class="btn-list d-md-flex d-block">
                <div class="mb-md-0 mb-2">
                    <button class="btn btn-icon btn-primary btn-wave">
                        <i class="ri-bank-fill"></i>
                    </button>
                    <button class="btn btn-icon btn-info btn-wave">
                        <i class="ri-medal-line"></i>
                    </button>
                    <button class="btn btn-icon btn-danger btn-wave">
                        <i class="ri-archive-line"></i>
                    </button>
                    <button class="btn btn-icon btn-warning btn-wave me-5">
                        <i class="ri-calendar-2-line"></i>
                    </button>
                </div>
                <div class="mb-md-0 mb-2">
                    <button class="btn btn-icon btn-primary-light rounded-pill btn-wave">
                        <i class="ri-home-smile-line"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary-light rounded-pill btn-wave">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <button class="btn btn-icon btn-info-light rounded-pill btn-wave">
                        <i class="ri-notification-3-line"></i>
                    </button>
                    <button class="btn btn-icon btn-danger-light rounded-pill btn-wave me-5">
                        <i class="ri-chat-settings-line"></i>
                    </button>
                </div>
                <div class="">
                    <button class="btn btn-icon btn-outline-primary rounded-pill btn-wave">
                        <i class="ri-phone-line"></i>
                    </button>
                    <button class="btn btn-icon btn-outline-teal rounded-pill btn-wave">
                        <i class="ri-customer-service-2-line"></i>
                    </button>
                    <button class="btn btn-icon btn-outline-danger rounded-pill btn-wave">
                        <i class="ri-live-line"></i>
                    </button>
                    <button class="btn btn-icon btn-outline-secondary rounded-pill btn-wave">
                        <i class="ri-save-line"></i>
                    </button>
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}
export let IconButtonSizes = {
    Html: `  <div class="btn-list d-md-flex d-block gap-5">
                <div class="mb-md-0 mb-2">
                    <button class="btn btn-sm btn-icon btn-primary btn-wave">
                        <i class="ri-bank-fill"></i>
                    </button>
                    <button class="btn btn-icon btn-info btn-wave">
                        <i class="ri-medal-line"></i>
                    </button>
                    <button class="btn btn-lg btn-icon btn-danger btn-wave">
                        <i class="ri-archive-line"></i>
                    </button>
                </div>
                <div class="mb-md-0 mb-2">
                    <button class="btn btn-sm btn-icon btn-primary-light rounded-pill btn-wave">
                        <i class="ri-home-smile-line"></i>
                    </button>
                    <button class="btn btn-icon btn-secondary-light rounded-pill btn-wave">
                        <i class="ri-delete-bin-line"></i>
                    </button>
                    <button class="btn btn-lg btn-icon btn-info-light rounded-pill btn-wave">
                        <i class="ri-notification-3-line"></i>
                    </button>
                </div>
                <div class="">
                    <button class="btn btn-sm btn-icon btn-outline-primary rounded-pill btn-wave">
                        <i class="ri-phone-line"></i>
                    </button>
                    <button class="btn btn-icon btn-outline-teal rounded-pill btn-wave">
                        <i class="ri-customer-service-2-line"></i>
                    </button>
                    <button class="btn btn-lg btn-icon btn-outline-danger rounded-pill btn-wave">
                        <i class="ri-live-line"></i>
                    </button>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}
export let SocialButtons = {
    Html: `   <div class="btn-list">
                @for (item of SocialButtons; track $index) {
                <button [class]="item.class">
                    <i [class]="item.iconclass"></i>
                </button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
SocialButtons = [
    {
      class: 'btn btn-icon btn-facebook btn-wave',
      iconclass: 'ri-facebook-line',
    },
    {
      class: 'btn btn-icon btn-twitter btn-wave',
      iconclass: 'ri-twitter-line',
    },
    {
      class: 'btn btn-icon btn-instagram btn-wave',
      iconclass: 'ri-instagram-line',
    },
    {
      class: 'btn btn-icon btn-github btn-wave',
      iconclass: 'ri-github-line',
    },
    {
      class: 'btn btn-icon btn-youtube btn-wave',
      iconclass: 'ri-youtube-line',
    },
    {
      class: 'btn btn-icon btn-google btn-wave',
      iconclass: 'ri-google-line',
    },


  ]}
    `,

}

export let Sizes = {
    Html: `   <div class="btn-list">
                        <button type="button" class="btn btn-primary btn-sm btn-wave">Small
                            button</button>
                        <button type="button" class="btn btn-secondary btn-wave">Default
                            button</button>
                        <button type="button" class="btn btn-danger btn-lg btn-wave">Large
                            button</button>
                    </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}


export let ButtonWidths = {
    Html: ` <div class="btn-list">
                        <button type="button" class="btn btn-primary btn-w-xs btn-wave">XS</button>
                        <button type="button" class="btn btn-secondary btn-w-sm btn-wave">SM</button>
                        <button type="button" class="btn btn-warning btn-w-md btn-wave">MD</button>
                        <button type="button" class="btn btn-info btn-w-lg btn-wave">LG</button>
                    </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {}
    `,

}
export let ButtonsWithDifferentShadows = {
    Html: ` <div class="btn-list d-flex">

                        <div class="me-5">
                            <button class="btn btn-primary shadow-sm btn-wave">Button</button>
                            <button class="btn btn-primary shadow btn-wave">Button</button>
                            <button class="btn btn-primary shadow-lg btn-wave">Button</button>
                        </div>
                        <div>
                            <button class="btn btn-secondary btn-sm shadow-sm btn-wave">Button</button>
                            <button class="btn btn-info shadow btn-wave">Button</button>
                            <button class="btn btn-lg btn-warning shadow-lg btn-wave">Button</button>
                        </div>
                    </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
}
    `,

}


export let DifferentColoredButtonsWithShadows = {
    Html: ` <div class="btn-list">
                @for (item of DifferentColoredButtonsWithShadows; track $index) {
                <button [class]="item.class">Button</button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
  DifferentColoredButtonsWithShadows = [
    {
      class: 'btn btn-primary shadow-primary btn-wave'
    },
    {
      class: 'btn btn-secondary shadow-secondary btn-wave'
    },
    {
      class: 'btn btn-success shadow-success btn-wave'
    },
    {
      class: 'btn btn-info shadow-info btn-wave'
    },
    {
      class: 'btn btn-warning shadow-warning btn-wave'
    },
    {
      class: 'btn btn-danger shadow-danger btn-wave'
    },
    {
      class: 'btn btn-purple shadow-purple btn-wave'
    },
    {
      class: 'btn btn-orange shadow-orange btn-wave'
    },

  ]}
    `,

}


export let RaisedButtons = {
    Html: `   <div class="btn-list">
                @for (item of RaisedButtons; track $index) {
                <button [class]="item.class">Button</button>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
 RaisedButtons = [
    {
      class: 'btn btn-primary btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-secondary btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-success btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-info btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-warning btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-danger btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-purple btn-raised-shadow  btn-wave'
    },
    {
      class: 'btn btn-orange btn-raised-shadow  btn-wave'
    },

  ]

}
    `,

}


export let LabelButtons = {
    Html: ` <div class="btn-list">
                @for(button of LabelButtons;track $index){
                <button [class]="button.class">
                    <i class="{{button.icon}}"></i>
                    {{button.text}} </button>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
 LabelButtons = [
    { class: 'btn btn-primary label-btn', icon: 'ri-chat-smile-line label-btn-icon me-2', text: 'Primary' },
    { class: 'btn btn-secondary label-btn', icon: 'ri-settings-4-line label-btn-icon me-2', text: 'Secondary' },
    { class: 'btn btn-warning label-btn rounded-pill', icon: 'ri-spam-2-line label-btn-icon me-2 rounded-pill', text: 'Warning' },
    { class: 'btn btn-info label-btn rounded-pill', icon: 'ri-phone-line label-btn-icon me-2 rounded-pill', text: 'Info' },
    { class: 'btn btn-success label-btn label-end', icon: 'ri-thumb-up-line label-btn-icon ms-2', text: 'Success' },
    { class: 'btn btn-danger label-btn label-end rounded-pill', icon: 'ri-close-line label-btn-icon ms-2 rounded-pill', text: 'Cancel' },
  ]

}
    `,

}


export let CustomButtons = {
    Html: ` @for(button of customButtons;track $index){
                <button [class]="button.class">
                    @if(button.icon){
                    <span class="custom-btn-icons">
                        <i class="{{button.icon}}"></i>
                    </span>
                    }
                    {{button.text}} </button>
                } `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {
customButtons = [
    { class: 'btn btn-info custom-button rounded-pill', icon: 'ri-twitter-x-line text-info', text: 'Twitter' },
    { class: 'btn btn-teal-light btn-border-down', text: 'Border' },
    { class: 'btn btn-secondary-light btn-border-start', text: 'Border' },
    { class: 'btn btn-purple-light btn-border-end', text: 'Border' },
    { class: 'btn btn-warning-light btn-border-top', text: 'Border' },
    { class: 'btn btn-secondary btn-glare', text: 'Glare Button' },
    { class: 'btn btn-danger btn-hover btn-hover-animate', text: 'Like' },
    { class: 'btn btn-success btn-darken-hover', text: 'Hover' },
    { class: 'btn btn-orange btn-custom-border', text: 'Hover' },
  ]
}
    `,

}


export let BlockButtons = {
    Html: `   <div class="btn-list">
                <div class="d-grid gap-2 mb-4">
                    @for(buttons of Blockbutton;track $index){
                    <ng-container>
                        <button [class]="buttons.color">{{buttons.class}}</button>
                    </ng-container>
                    }
                </div>
                <div class="d-grid gap-2 d-md-block">
                    @for(buttons of Blockbutton1;track $index){
                    <ng-container>
                        <button [class]="buttons.color">{{buttons.class}}</button>
                    </ng-container>
                    }
                </div>

                <div class="d-grid gap-2 col-6 mx-auto">
                    @for(buttons of Blockbutton2;track $index){
                    <ng-container>
                        <button [class]="buttons.color">{{buttons.class}}</button>
                    </ng-container>
                    }
                </div>
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    @for(buttons of Blockbutton3;track $index){
                    <ng-container>
                        <button [class]="buttons.color">{{buttons.class}}</button>
                    </ng-container>
                    }
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-buttons',
  imports: [],
  templateUrl: './buttons.html',
  styleUrl: './buttons.scss'
})
export class ButtonsComponent {

Blockbutton = [
    { id: 1, class: "Button", color: "btn btn-primary w-100" },
    { id: 2, class: "Button", color: "btn btn-secondary w-100" },
  ]
  Blockbutton1 = [
    { id: 1, class: "Button", color: "btn btn-info" },
    { id: 2, class: "Button", color: "btn btn-success" },
  ]

  Blockbutton2 = [
    { id: 1, class: "Button", color: "btn btn-warning w-75" },
    { id: 2, class: "Button", color: "btn btn-danger w-75" },
  ]
  Blockbutton3 = [
    { id: 1, class: "Button", color: "btn btn-teal" },
    { id: 2, class: "Button", color: "btn btn-success" },
]}
    `,

}
