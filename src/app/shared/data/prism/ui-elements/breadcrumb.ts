export let Example= {
  Html: `  <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item active" aria-current="page">Home</li>
                </ol>
            </nav>

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Library</li>
                </ol>
            </nav>

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Library</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Data</li>
                </ol>
            </nav>`,
  Ts: `
import { Component } from '@angular/core';


@Component({
  selector: 'app-bread-crumb',
  imports: [],
  templateUrl: './bread-crumb.html',
  styleUrl: './bread-crumb.scss'
})
export class BreadCrumbComponent {
}

    `,

}
export let Example1= {
  Html: ` <nav aria-label="breadcrumb">
                <ol class="breadcrumb breadcrumb-example1">
                    <li class="breadcrumb-item active" aria-current="page">Home</li>
                </ol>
            </nav>

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb breadcrumb-example1">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Library</li>
                </ol>
            </nav>

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb breadcrumb-example1 mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Library</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Data</li>
                </ol>
            </nav>`,
  Ts: `
import { Component } from '@angular/core';


@Component({
  selector: 'app-bread-crumb',
  imports: [],
  templateUrl: './bread-crumb.html',
  styleUrl: './bread-crumb.scss'
})
export class BreadCrumbComponent {

}

    `,

}
export let Dividers= {
  Html: `  <nav style="--bs-breadcrumb-divider: '~';" aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Library</li>
                </ol>
            </nav>`,
  Ts: `
import { Component } from '@angular/core';


@Component({
  selector: 'app-bread-crumb',
  imports: [],
  templateUrl: './bread-crumb.html',
  styleUrl: './bread-crumb.scss'
})
export class BreadCrumbComponent {

}

    `,

}


export let  EmbeddedSVGicon= {
  Html: ` <nav style="--bs-breadcrumb-divider: url(&#34;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z' fill='currentColor'/%3E%3C/svg%3E&#34;);"
                aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item active embedded-breadcrumb" aria-current="page">Library</li>
                </ol>
            </nav>`,
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

export let BreadcrumbStyle1 = {
  Html: ` <nav aria-label="breadcrumb">
                <ol class="breadcrumb breadcrumb-style1 mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                    <li class="breadcrumb-item"><a href="javascript:void(0);">Library</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Data</li>
                </ol>
            </nav>`,
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




export let BreadcrumbStyle2= {
  Html: `  <nav aria-label="breadcrumb">
                <ol class="breadcrumb breadcrumb-style2 mb-0">
                    <li class="breadcrumb-item"><a href="javascript:void(0);"><i
                                class="ti ti-home-2 me-1 fs-15 d-inline-block"></i>Home</a></li>
                    <li class="breadcrumb-item"><a href="javascript:void(0);"><i
                                class="ti ti-apps me-1 fs-15 d-inline-block"></i>About</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Services</li>
                </ol>
            </nav>`,
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



export let BackgroundColors={
  html:` <nav style="--bs-breadcrumb-divider: '';" aria-label="breadcrumb">
                                        <ol class="breadcrumb mb-0">
                                            <li class="breadcrumb-item"><a href="javascript:void(0);">Home</a></li>
                                            <li class="breadcrumb-item active" aria-current="page">Library</li>
                                        </ol>
                                    </nav>`,
  ts:`import { Component } from '@angular/core';

@Component({
  selector: 'app-badge',
  imports: [],
  templateUrl: './badge.html',
  styleUrl: './badge.scss'
})
export class BadgeComponent {

}
    `
}
