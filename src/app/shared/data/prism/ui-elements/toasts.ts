export let Liveexample = {
    Html: `  <button type="button" class="btn btn-primary btn-wave" (click)="showToast()">
                Show live toast
            </button>
            <!-- ARIA container for toasts -->
            <div aria-live="polite" aria-atomic="true" class="position-relative">
                <!-- position it -->
                <div class="toast-container position-fixed top-0 end-0 p-3">
                    @for (toast of toasts; track toast) {
                    <ngb-toast [delay]="5000" [autohide]="toast.autohide" (hide)="hideToast(toast)"
                        [class.bg-warning]="!toast.autohide">
                        <div class="toast-header text-default">
                            <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/favicon.ico"
                                alt="Your Image" />
                            <strong class="me-auto">nowa</strong>
                            <small>11 mins ago</small>
                            <button type="button" class="btn-close" (click)="hideToast(toast)"
                                aria-label="Close"></button>
                        </div>
                        <div class="toast-body">Hello, world! This is a toast message.</div>
                    </ngb-toast>
                    }
                </div>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
toasts: { autohide: boolean }[] = [];

 showToast() {
    const newToast = { autohide: true };
    this.toasts.push(newToast);
  }

  hideToast(toast: { autohide: boolean }) {
    this.toasts = this.toasts.filter((t) => t !== toast);
  }
}
    `,

}

export let Basicexample = {
    Html: `   @if (show) {
            <ngb-toast [autohide]="false" (hidden)="show = false">
                <ng-template ngbToastHeader>
                    <div class="me-auto d-flex justify-content-between w-100">
                        <div class="d-flex text-default">
                            <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/favicon.ico"
                                alt="..." />
                            <strong class="tx-14 mg-b-0 mg-r-auto">nowa</strong>
                        </div>
                        <div class="d-flex">
                            <small class="text-muted me-2 lh-lg">11 mins ago</small>
                        </div>
                    </div>
                </ng-template>
                Hello, world! This is a toast message.
            </ngb-toast>
            }
 `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
 show = true;

}
    `,

}
export let Colorschemes = {
    Html: `  @if (show1) {
            <ngb-toast class="toast align-items-center text-bg-primary  border-0 mb-4" [autohide]="false">
                <div class="align-items-center show" role="alert" aria-live="assertive" aria-atomic="true"
                    data-bs-autohide="false">
                    <div class="d-flex">
                        <div class="text-fixed-white">
                            Hello, world! This is the Primary toast message
                        </div>
                        <button aria-label="Close" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                            (click)="show1 = false">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </ngb-toast>
            }

            @if (show2) {
            <ngb-toast class="toast align-items-center text-bg-secondary border-0  mb-4" [autohide]="false">
                <div class="align-items-center show" role="alert" aria-live="assertive" aria-atomic="true"
                    data-bs-autohide="false">
                    <div class="d-flex">
                        <div class="text-fixed-white">
                            Hello, world! This is the Secondary toast message
                        </div>
                        <button aria-label="Close" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                            (click)="show2 = false">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </ngb-toast>
            }


            @if (show3) {
            <ngb-toast class="toast align-items-center text-bg-success border-0  mb-4" [autohide]="false">
                <div class="align-items-center show" role="alert" aria-live="assertive" aria-atomic="true"
                    data-bs-autohide="false">
                    <div class="d-flex">
                        <div class="text-fixed-white">
                            Hello, world! This is the Success toast message
                        </div>
                        <button aria-label="Close" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                            (click)="show3 = false">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </ngb-toast>
            }

            @if (show4) {
            <ngb-toast class="toast align-items-center text-bg-info border-0 fade show" [autohide]="false">
                <div class="align-items-center show" role="alert" aria-live="assertive" aria-atomic="true"
                    data-bs-autohide="false">
                    <div class="d-flex">
                        <div class="text-fixed-white">
                            Hello, world! This is the Info toast message
                        </div>
                        <button aria-label="Close" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"
                            (click)="show4 = false">
                            <span aria-hidden="true"></span>
                        </button>
                    </div>
                </div>
            </ngb-toast>
            }
 `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
   show1 = true;
  show2= true;
  show3 = true;
  show4 = true;
}
    `,

}
export let Customcontent = {
    Html: `@if (show5) {
            <ngb-toast [autohide]="false" class="toast align-items-center fade show mb-3" role="alert"
                aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">Hello, world! This is a toast message.</div>
                    <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"
                        (click)="show5 = false"></button>
                </div>
            </ngb-toast>
            }

            <div>
                <span class="my-4 text-muted">
                    Alternatively, you can also add additional controls and components
                    to toasts.
                </span>
            </div>
            @if (show6) {
            <ngb-toast [autohide]="false" class="toast fade show mt-2" role="alert" aria-live="assertive"
                aria-atomic="true">
                <div class="toast-body">
                    Hello, world! This is a toast message.
                    <div class="mt-2 pt-2 border-top">
                        <button type="button" class="btn btn-primary btn-sm btn-wave me-2">
                            Take action
                        </button>
                        <button type="button" class="btn btn-secondary btn-sm btn-wave" data-bs-dismiss="toast"
                            (click)="show6 = false">
                            Close
                        </button>
                    </div>
                </div>
            </ngb-toast>
            }  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
  show5 = true;
  show6 = true;
}
    `,

}
export let Stacking = {
    Html: ` <div class="toast-container position-static">
                @if (show7) {
                <ngb-toast [autohide]="false" (hidden)="show7 = false">
                    <ng-template ngbToastHeader>
                        <div class="me-auto d-flex justify-content-between w-100">
                            <div class="d-flex text-default">
                                <img class="bd-placeholder-img rounded me-2"
                                    src="./assets/images/brand-logos/favicon.ico" alt="..." />
                                <strong class="tx-14 mg-b-0 mg-r-auto">nowa</strong>
                            </div>
                            <div class="d-flex ms-auto">
                                <small class="text-muted me-2 lh-lg">just now</small>
                            </div>
                        </div>
                    </ng-template>
                    See? Just like this.
                </ngb-toast>
                }

                @if (show8) {
                <ngb-toast [autohide]="false" (hidden)="show8 = false">
                    <ng-template ngbToastHeader>
                        <div class="me-auto d-flex justify-content-between w-100">
                            <div class="d-flex text-default">
                                <img class="bd-placeholder-img rounded me-2"
                                    src="./assets/images/brand-logos/favicon.ico" alt="..." />
                                <strong class="tx-14 mg-b-0 mg-r-auto">nowa</strong>
                            </div>
                            <div class="d-flex ms-auto">
                                <small class="text-muted me-2 lh-lg">2 mins ago</small>
                            </div>
                        </div>
                    </ng-template>
                    Heads up, toasts will stack automatically
                </ngb-toast>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
show7 = true;
  show8 = true;
}
    `,

}
export let AligningToastUsingFlexbox = {
    Html: `      <div class="bd-example bg-light bd-example-toasts d-flex justify-content-center align-items-center px-2">
                @if (show9) {
                <ngb-toast [autohide]="false">
                    <ng-template ngbToastHeader>
                        <div class="d-flex text-default">
                            <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/favicon.ico"
                                alt="..." />
                            <strong class="me-auto">nowa</strong>
                        </div>
                        <div class="d-flex ms-auto">
                            <small class="text-muted me-2 lh-lg">11 mins ago</small>
                        </div>
                    </ng-template>
                    Hello, world! This is a toast message.
                </ngb-toast>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
show9= true;

}
    `,

}
export let ColorVariantsLive = {
    Html: `
            <div class="btn-list">
                <button type="button" class="btn btn-primary-light me-2 btn-wave" id="primaryToastBtn"
                    (click)="showToastprimary()">
                    Primary
                </button>
                <button type="button" class="btn btn-secondary-light me-2 btn-wave" id="secondaryToastBtn"
                    (click)="showToastseconday()">
                    secondary
                </button>
                <button type="button" class="btn btn-warning-light me-2 btn-wave" id="warningToastBtn"
                    (click)="showToastwarning()">
                    warning
                </button>
                <button type="button" class="btn btn-info-light me-2 btn-wave" id="infoToastBtn"
                    (click)="showToastinfo()">
                    info
                </button>
                <button type="button" class="btn btn-success-light me-2 btn-wave" id="successToastBtn"
                    (click)="showToastsuccess()">
                    success
                </button>
                <button type="button" class="btn btn-danger-light me-2 btn-wave" id="dangerToastBtn"
                    (click)="showToastdanger()">
                    danger
                </button>
            </div>
            <div class="toast-container position-fixed top-0 end-0 p-3">
                @for (toast of toasts1; track toast) {
                <ngb-toast class="toast colored-toast bg-primary-transparent" [delay]="5000" [autohide]="toast.autohide"
                    (hide)="hideToastprimary(toast)" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toasts2; track toast) {
                <ngb-toast class="toast colored-toast bg-secondary-transparent" [delay]="5000"
                    [autohide]="toast.autohide" (hide)="hideToastsecondary(toast)" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toasts3; track toast) {
                <ngb-toast class="toast colored-toast bg-warning-transparent" [delay]="5000" [autohide]="toast.autohide"
                    (hide)="hideToastwarning(toast)" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toasts4; track toast) {
                <ngb-toast class="toast colored-toast bg-info-transparent" [delay]="5000" [autohide]="toast.autohide"
                    (hide)="hideToastinfo(toast)" [class.bg-danger]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }

                @for (toast of toasts5; track toast) {
                <ngb-toast class="toast colored-toast bg-success-transparent" [delay]="5000" [autohide]="toast.autohide"
                    (hide)="hideToastsuccess(toast)" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }

                @for (toast of toasts6; track toast) {
                <ngb-toast class="toast colored-toast bg-danger-transparent" [delay]="5000" [autohide]="toast.autohide"
                    (hide)="hideToastdanger(toast)" [class.bg-danger]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
 toasts1: { autohide: boolean }[] = [];
  toasts2: { autohide: boolean }[] = [];
  toasts3: { autohide: boolean }[] = [];
  toasts4: { autohide: boolean }[] = [];
  toasts5: { autohide: boolean }[] = [];
  toasts6: { autohide: boolean }[] = [];
 showToastprimary() {
    const newToast = { autohide: true };
    this.toasts1.push(newToast);
  }

  showToastseconday() {
    const newToast = { autohide: true };
    this.toasts2.push(newToast);
  }
  showToastwarning() {
    const newToast = { autohide: true };
    this.toasts3.push(newToast);
  }
  showToastinfo() {
    const newToast = { autohide: true };
    this.toasts4.push(newToast);
  }
  showToastsuccess() {
    const newToast = { autohide: true };
    this.toasts5.push(newToast);
  }
  showToastdanger() {
    const newToast = { autohide: true };
    this.toasts6.push(newToast);
  }



  hideToastprimary(toast1: { autohide: boolean }) {
    this.toasts1 = this.toasts1.filter((t) => t !== toast1);
  }
  hideToastsecondary(toast: { autohide: boolean }) {
    this.toasts2 = this.toasts2.filter((t) => t !== toast);
  }
  hideToastwarning(toast: { autohide: boolean }) {
    this.toasts3 = this.toasts3.filter((t) => t !== toast);
  }
  hideToastinfo(toast: { autohide: boolean }) {
    this.toasts4 = this.toasts4.filter((t) => t !== toast);
  }
  hideToastsuccess(toast: { autohide: boolean }) {
    this.toasts5 = this.toasts5.filter((t) => t !== toast);
  }
  hideToastdanger(toast: { autohide: boolean }) {
    this.toasts6 = this.toasts6.filter((t) => t !== toast);
  }


}
    `,

}
export let SolidBackgroundToasts = {
    Html: `
            <div class="btn-list">
                <button type="button" class="btn btn-primary me-2 btn-wave" id="solidprimaryToastBtn"
                    (click)="SolidToastprimary()">
                    Primary
                </button>
                <button type="button" class="btn btn-secondary me-2 btn-wave" id="solidsecondaryToastBtn"
                    (click)="SolidToastsecondary()">
                    secondary
                </button>
                <button type="button" class="btn btn-warning me-2 btn-wave" id="solidsecondaryToastBtn"
                    (click)="SolidToastwarning()">
                    Warning
                </button>
                <button type="button" class="btn btn-info me-2 btn-wave" id="solidinfoToastBtn"
                    (click)="SolidToastinfo()">
                    info
                </button>
                <button type="button" class="btn btn-success me-2 btn-wave" id="solidsuccessToastBtn"
                    (click)="SolidToastsuccess()">
                    success
                </button>
                <button type="button" class="btn btn-danger me-2 btn-wave" id="soliddangerToastBtn"
                    (click)="SolidToastdanger()">
                    danger
                </button>
            </div>
            <div class="toast-container position-fixed top-0 end-0 p-3">
                @for (toast of toastsA; track toast) {
                <ngb-toast id="solid-primaryToast" class="toast colored-toast bg-primary text-fixed-white"
                    [delay]="5000" [autohide]="toast.autohide" (click)="hideSolidToastprimary(toast)"
                    [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toastsB; track toast) {
                <ngb-toast id="solid-secondaryToast" class="toast colored-toast bg-secondary text-fixed-white"
                    [delay]="5000" [autohide]="toast.autohide" (hide)="hideSolidToastsecondary(toast)"
                    [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toastsC; track toast) {
                <ngb-toast id="solid-warningToast" class="toast colored-toast bg-warning text-fixed-white"
                    [delay]="5000" [autohide]="toast.autohide" (hide)="hideSolidToastwarning(toast)"
                    [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toastsD; track toast) {
                <ngb-toast id="solid-infoToast" class="toast colored-toast bg-info text-fixed-white" [delay]="5000"
                    [autohide]="toast.autohide" (hide)="hideSolidToastinfo(toast)" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toastsE; track toast) {
                <ngb-toast id="solid-successToast" class="toast colored-toast bg-success text-fixed-white"
                    [delay]="5000" [autohide]="toast.autohide" (hide)="hideSolidToastsuccess(toast)"
                    [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
                @for (toast of toastsF; track toast) {
                <ngb-toast id="solid-dangerToast" class="toast colored-toast bg-danger text-fixed-white" [delay]="5000"
                    [autohide]="toast.autohide" (hide)="hideSolidToastdanger(toast)"
                    [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {

  toastsA: { autohide: boolean }[] = [];
  toastsB: { autohide: boolean }[] = [];
  toastsC: { autohide: boolean }[] = [];
  toastsD: { autohide: boolean }[] = [];
  toastsE: { autohide: boolean }[] = [];
  toastsF: { autohide: boolean }[] = [];
  toastsG: { autohide: boolean }[] = [];
//solid toast
  SolidToastprimary() {
    const newToast = { autohide: true };
    this.toastsA.push(newToast);
  }

  SolidToastsecondary() {
    const newToast = { autohide: true };
    this.toastsB.push(newToast);
  }
  SolidToastwarning() {
    const newToast = { autohide: true };
    this.toastsC.push(newToast);
  }
  SolidToastinfo() {
    const newToast = { autohide: true };
    this.toastsD.push(newToast);
  }
  SolidToastsuccess() {
    const newToast = { autohide: true };
    this.toastsE.push(newToast);
  }
  SolidToastdanger() {
    const newToast = { autohide: true };
    this.toastsF.push(newToast);
  }

  hideSolidToastprimary(toastA: { autohide: boolean }) {
    this.toastsA = this.toastsA.filter((t) => t !== toastA);
  }
  hideSolidToastsecondary(toast: { autohide: boolean }) {
    this.toastsB = this.toastsB.filter((t) => t !== toast);
  }
  hideSolidToastwarning(toast: { autohide: boolean }) {
    this.toastsC = this.toastsC.filter((t) => t !== toast);
  }
  hideSolidToastinfo(toast: { autohide: boolean }) {
    this.toastsD = this.toastsD.filter((t) => t !== toast);
  }
  hideSolidToastsuccess(toast: { autohide: boolean }) {
    this.toastsE = this.toastsE.filter((t) => t !== toast);
  }
  hideSolidToastdanger(toast: { autohide: boolean }) {
    this.toastsF = this.toastsF.filter((t) => t !== toast);
  }
}
    `,

}

export let ToastPlacements = {
    Html: `<div class="btn-list">
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="topleftToastBtn"
                    (click)="TopLeft()">Top
                    Left</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="topcenterToastBtn"
                    (click)="TopCenter()">Top Center</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="toprightToastBtn"
                    (click)="TopRight()">Top Right</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="middleleftToastBtn"
                    (click)="MiddleLeft()">Middle Left</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="middlecenterToastBtn"
                    (click)="MiddleCenter()">Middle Center</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="middlerightToastBtn"
                    (click)="MiddleRight()">Middle Right</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="bottomleftToastBtn"
                    (click)="BottomLeft()">Bottom Left</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="bottomcenterToastBtn"
                    (click)="BottomCenter()">Bottom Center</button>
                <button type="button" class="btn btn-outline-primary me-2 btn-wave mb-2" id="bottomrightToastBtn"
                    (click)="BottomRight()">Bottom Right</button>
            </div>


            <div class="toast-container position-fixed top-0 start-0 p-3">
                @for (toast of toasts7; track toasts7) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary"
                           [delay]="5000"
                           [autohide]="toast.autohide"
                           [class.bg-warning]="!toast.autohide"
                           >
                  <ng-template ngbToastHeader>
                    <img class="bd-placeholder-img rounded me-2"
                         src="./assets/images/brand-logos/toggle-dark.png"
                         alt="..." />
                    <strong class="me-auto">nowa</strong>
                  </ng-template>
                  Your toast message here.
                </ngb-toast>
            }
              </div>

            <div class="toast-container position-fixed top-0 start-50  translate-middle-x p-3">
                @for (toast of toasts8; track toasts8) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed top-0 end-0 p-3">
                @for (toast of toasts9; track toasts9) {
                <ngb-toast class="toast-header bg-primary  text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed top-50 start-0 translate-middle-y p-3">
                @for (toast of toasts10; track toasts10) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed top-50 start-50 translate-middle">
                @for (toast of toasts11; track toasts11) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed top-50 end-0 translate-middle-y p-3">
                @for (toast of toasts12; track toasts12) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed bottom-0 start-0 p-3">
                @for (toast of toasts13; track toasts13) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed bottom-0 start-50 translate-middle-x p-3">
                @for (toast of toasts14; track toasts14) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                @for (toast of toasts15; track toasts15) {
                <ngb-toast class="toast-header bg-primary text-fixed-white text-primary " [delay]="5000"
                    [autohide]="toast.autohide" [class.bg-warning]="!toast.autohide">
                    <ng-template ngbToastHeader>
                        <img class="bd-placeholder-img rounded me-2" src="./assets/images/brand-logos/toggle-dark.png"
                            alt="..." />
                        <strong class="me-auto">nowa</strong>
                    </ng-template>
                    Your,toast message here.
                </ngb-toast>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-toasts',
  imports: [NgbToastModule, ],
  templateUrl: './toasts.html',
  styleUrl: './toasts.scss'
})
export class ToastsComponent {
  toasts7: { autohide: boolean }[] = [];
  toasts8: { autohide: boolean }[] = [];
  toasts9: { autohide: boolean }[] = [];
  toasts10: { autohide: boolean }[] = [];
  toasts11: { autohide: boolean }[] = [];
  toasts12: { autohide: boolean }[] = [];
  toasts13: { autohide: boolean }[] = [];
  toasts14: { autohide: boolean }[] = [];
  toasts15: { autohide: boolean }[] = [];

  //Top Placements
  TopLeft() {
    const newToast = { autohide: true };
    this.toasts7.push(newToast);
  }
  TopCenter() {
    const newToast = { autohide: true };
    this.toasts8.push(newToast);
  }
  TopCenterhideToast(toast7: { autohide: boolean }) {
    this.toasts8 = this.toastsA.filter((t) => t !== toast7);
  }
  TopRight() {
    const newToast = { autohide: true };
    this.toasts9.push(newToast);
  }
  TopRighthideToast(toast7: { autohide: boolean }) {
    this.toasts9 = this.toastsA.filter((t) => t !== toast7);
  }
  MiddleLeft() {
    const newToast = { autohide: true };
    this.toasts10.push(newToast);
  }
  MiddleLefthideToast(toast7: { autohide: boolean }) {
    this.toasts10 = this.toastsA.filter((t) => t !== toast7);
  }
  MiddleCenter() {
    const newToast = { autohide: true };
    this.toasts11.push(newToast);
  }
  MiddleCenterhideToast(toast7: { autohide: boolean }) {
    this.toasts11 = this.toastsA.filter((t) => t !== toast7);
  }
  MiddleRight() {
    const newToast = { autohide: true };
    this.toasts12.push(newToast);
  }
  MiddleRighthideToast(toast7: { autohide: boolean }) {
    this.toasts12 = this.toastsA.filter((t) => t !== toast7);
  }
  BottomLeft() {
    const newToast = { autohide: true };
    this.toasts13.push(newToast);
  }
  BottomLefthideToast(toast7: { autohide: boolean }) {
    this.toasts13 = this.toastsA.filter((t) => t !== toast7);
  }
  BottomCenter() {
    const newToast = { autohide: true };
    this.toasts14.push(newToast);
  }
  BottomCenterthideToast(toast7: { autohide: boolean }) {
    this.toasts14 = this.toastsA.filter((t) => t !== toast7);
  }
  BottomRight() {
    const newToast = { autohide: true };
    this.toasts15.push(newToast);
  }
  BottomRighthideToast(toast7: { autohide: boolean }) {
    this.toasts15 = this.toastsA.filter((t) => t !== toast7);
  }

}
    `,

}

