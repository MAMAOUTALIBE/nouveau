export let Borderspinner = {
    Html: `  <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let Growingspinner = {
    Html: `<div class="spinner-grow" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let Colors = {
    Html: ` @for (color of colors; track $index) {
            <div class="spinner-border m-1" [ngClass]="'text-' + color" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        }  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
  colors: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];

}
    `,

}
export let GrowingSpinnerColors = {
    Html: `  @for (color of colors; track $index) {
                    <div class="spinner-grow me-1" [ngClass]="'text-' + color" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
            } `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
  colors: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];

}
    `,

}
export let AlignmentFlex = {
    Html: ` <div class="d-flex justify-content-center mb-4">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <strong>Loading...</strong>
                    <div class="spinner-border ms-auto" role="status" aria-hidden="true"></div>
                </div> `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let AlignmentFloat = {
    Html: `   <div class="clearfix mb-4">
                    <div class="spinner-border float-end" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
                <div class="clearfix">
                    <div class="spinner-border float-start" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let AlignmentTextcenter = {
    Html: `  <div class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let SpinnerSizes = {
    Html: ` <div class="spinner-border spinner-border-sm me-4" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow spinner-grow-sm me-4" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-border me-4" style="width: 3rem; height: 3rem;"
                    role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <div class="spinner-grow" style="width: 3rem; height: 3rem;" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let AlignmentMargin = {
    Html: `<div class="spinner-border m-5" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}
export let Buttons = {
    Html: `  <div class="btn-list">
                    <button class="btn btn-primary-light" type="button" >
                        <span class="spinner-border spinner-border-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        <span class="visually-hidden">Loading...</span>
                    </button>
                    <button class="btn btn-primary-light" type="button" >
                        <span class="spinner-border spinner-border-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-primary-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        <span class="visually-hidden">Loading...</span>
                    </button>
                    <button class="btn btn-primary-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-secondary-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-success-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-info-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-warning-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-danger-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-light" type="button" >
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                    <button class="btn btn-dark text-fixed-white" type="button" disabled>
                        <span class="spinner-grow spinner-grow-sm align-middle" role="status"
                            aria-hidden="true"></span>
                        Loading...
                    </button>
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinners',
  imports: [CommonModule],
  templateUrl: './spinners.html',
  styleUrl: './spinners.scss'
})
export class SpinnersComponent {
}
    `,

}

