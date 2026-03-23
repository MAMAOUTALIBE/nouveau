export let Animation = {
    Html: `   <p class="placeholder-glow mb-0">
                            <span class="placeholder col-12"></span>
                        </p>
                        <p class="placeholder-wave mb-0">
                            <span class="placeholder col-12"></span>
                        </p>  `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholders',
  imports: [],
  templateUrl: './placeholders.html',
  styleUrl: './placeholders.scss'
})
export class PlaceholdersComponent {

}


    `,

}
export let Sizing = {
    Html: `    <span class="placeholder col-12 placeholder-xl mb-1"></span>
                                <span class="placeholder col-12 placeholder-lg"></span>
                                <span class="placeholder col-12"></span>
                                <span class="placeholder col-12 placeholder-sm"></span>
                                <span class="placeholder col-12 placeholder-xs"></span>
                      `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholders',
  imports: [],
  templateUrl: './placeholders.html',
  styleUrl: './placeholders.scss'
})
export class PlaceholdersComponent {

}


    `,

}
export let Colors = {
    Html: `<span class="placeholder col-12"></span>
                        <span class="placeholder col-12 bg-primary"></span>
                        <span class="placeholder col-12 bg-secondary"></span>
                        <span class="placeholder col-12 bg-success"></span>
                        <span class="placeholder col-12 bg-danger"></span>
                        <span class="placeholder col-12 bg-warning"></span>
                        <span class="placeholder col-12 bg-info"></span>
                        <span class="placeholder col-12 bg-light"></span>
                        <span class="placeholder col-12 bg-dark"></span>
                `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholders',
  imports: [],
  templateUrl: './placeholders.html',
  styleUrl: './placeholders.scss'
})
export class PlaceholdersComponent {

}


    `,

}
export let Width = {
    Html: ` <span class="placeholder bg-primary col-6"></span>
                <span class="placeholder bg-primary w-75"></span>
                <span class="placeholder bg-primary col-4"></span>
        `,
    Ts: `
import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholders',
  imports: [],
  templateUrl: './placeholders.html',
  styleUrl: './placeholders.scss'
})
export class PlaceholdersComponent {

}


    `,

}

