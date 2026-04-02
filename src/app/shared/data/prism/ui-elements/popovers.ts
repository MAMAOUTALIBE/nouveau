export let DefaultPopovers = {
    Html: `<div class="d-flex gap-2 flex-wrap">
                @for(popover of defaultPopovers;track $index){
                <button type="button" class="btn btn-outline-{{popover.class}} me-2" placement="{{popover.placement}}"
                    ngbPopover="{{popover.content}}" popoverTitle="{{popover.title}}">
                    {{popover.buttonText}}
                </button>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
 defaultPopovers = [
    {
      buttonText: 'Popover Top',
      placement: 'top',
      title: 'Popover on Top',
      content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.',
      class: 'primary',
    },
    {
      buttonText: 'Popover Right',
      placement: 'right',
      title: 'Popover on Right',
      content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.',
      class: 'primary',
    },
    {
      buttonText: 'Popover Bottom',
      placement: 'bottom',
      title: 'Popover on Bottom',
      content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.',
      class: 'primary',
    },
    {
      buttonText: 'Popover Left',
      placement: 'start',
      title: 'Popover on Left',
      content: 'Vivamus sagittis lacus vel augue laoreet rutrum faucibus.',
      class: 'primary',
    },
  ];
}
    `,

}
export let ColoredHeaders = {
    Html: ` <div class="d-flex gap-2 flex-wrap">
                @for(popover of coloredPopovers;track $index){
                <button type="button" class="btn btn-outline-{{popover.class}} me-2" placement="top"
                    popoverClass="{{popover.header}}" ngbPopover="{{popover.content}}" popoverTitle="{{popover.title}}">
                    {{popover.title1}}
                </button>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
 coloredPopovers = [
    { id: 1, header: "header-primary",   class: 'primary', title: 'colored header', title1: "Header Primary", content: "Popover with primary header.", textcolor: "" },
    { id: 5, header: "header-secondary", class: "secondary", title: 'colored header', title1: "Header Secondary", content: "Popover with Secondary header.", textcolor: '' },
    { id: 6, header: "header-info",      class: "info", title: 'colored header', title1: "Header Info", content: "Popover with Info header.", textcolor: '' },
    { id: 7, header: "header-warning",  class: "warning", title: 'colored header', title1: "Header Warning", content: "Popover with Warning header.", textcolor: '' },
    { id: 8, header: "header-success",  class: "success", title: 'colored header', title1: "Header Success", content: "Popover with success header.", textcolor: '' },
    { id: 9, header: "header-danger",  class: "danger", title: 'colored header', title1: "Header Danger", content: "Popover with Danger header.", textcolor: '' },
  ];
}
    `,

}
export let ColoredPopovers = {
    Html: ` <div class="d-flex gap-2 flex-wrap">
                @for(popover of coloredBackground;track $index){
                <button type="button" class="btn btn-{{popover.class}} me-2" popoverTitle="{{popover.title}}"
                    placement="top" [autoClose]="true" popoverClass="{{popover.popoverClass}}"
                    ngbPopover="{{popover.content}}">
                    {{popover.title}}
                </button>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
 coloredBackground = [
    { id: 1, header: "Color Background",class:"primary",popoverClass:"popover-primary", title: "Primary",  content: "Popover with Primary background.", color: "primary", textcolor: ""},
    { id: 2, header: "Color Background",class:"secondary", popoverClass:"popover-secondary",title: "Secondary", content: "Popover with Secondary background.", color: "secondary", textcolor: ''},
    { id: 3, header: "Color Background",class:"info",popoverClass:"popover-info",title: "Info", content: "Popover with Info background.", color: "info", textcolor: ''},
    { id: 4, header: "Color Background",class:"warning",popoverClass:"popover-warning",title: "Warning", content: "Popover with Warning background.", color: "warning", textcolor: ''},
    { id: 5, header: "Color Background",class:"success",popoverClass:"popover-success",title: "Success", content: "Popover with Success background.", color: "success", textcolor: ''},
    { id: 6, header: "Color Background",class:"danger",popoverClass:"popover-danger",title: "Danger", content: "Popover with danger background.", color: "danger", textcolor: ''},
    { id: 7, header: "Color Background",class:"teal",popoverClass:"popover-teal", title: "Teal",content: "Popover with Teal background.", color: "teal", textcolor: ''},
    { id: 8, header: "Color Background",class:"purple",popoverClass:"popover-purple", title: "Purple",content: "Popover with Purple background.", color: "purple", textcolor: ''}
  ];
}
    `,

}
export let LightPopovers = {
    Html: `<div class="d-flex gap-2 flex-wrap">
                @for(popover of lightPopovers;track $index){
                <button type="button" class="btn btn-{{popover.class}}-light btn-wave waves-effect waves-light"
                    popoverTitle="{{popover.title}}" placement="top" popoverClass="popover-{{popover.class}}-light"
                    [autoClose]="'outside'" ngbPopover="{{popover.content}}">
                    {{popover.title}}
                </button>

                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
 lightPopovers = [
    { id: 1, header: "Color Background",class:"primary",popoverClass:"primary", title: "Primary",  content: "Popover with Primary background.", color: "primary", textcolor: ""},
    { id: 2, header: "Color Background",class:"secondary", popoverClass:"secondary",title: "Secondary", content: "Popover with Secondary background.", color: "secondary", textcolor: ''},
    { id: 3, header: "Color Background",class:"info",popoverClass:"info",title: "Info", content: "Popover with Info background.", color: "info", textcolor: ''},
    { id: 4, header: "Color Background",class:"warning",popoverClass:"warning",title: "Warning", content: "Popover with Warning background.", color: "warning", textcolor: ''},
    { id: 5, header: "Color Background",class:"success",popoverClass:"success",title: "Success", content: "Popover with Success background.", color: "success", textcolor: ''},
    { id: 6, header: "Color Background",class:"danger",popoverClass:"danger",title: "Danger", content: "Popover with danger background.", color: "danger", textcolor: ''},
    { id: 7, header: "Color Background",class:"teal",popoverClass:"teal", title: "Teal",content: "Popover with Teal background.", color: "teal", textcolor: ''},
    { id: 8, header: "Color Background",class:"purple",popoverClass:"purple", title: "Purple",content: "Popover with Purple background.", color: "purple", textcolor: ''}
  ];
}
    `,

}
export let DismissiblePopovers = {
    Html: ` @for(popover of DismisablePopover;track popover){
            <a tabindex="0" class="btn btn-{{popover.color}} m-1" role="button" placement="auto"
                popoverTitle="{{popover.title}}" ngbPopover="{{popover.content}}">{{popover.title}}
            </a>
            }  `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
  DismisablePopover = [
    { id: 1,header:'Dismissible popover', title: "popover Dismiss", content: "And here's some amazing content. It's very engaging. Right?", color: "primary"},
    { id: 2,header:'Dismissible popover', title: "popover Dismiss", content: "And here's some amazing content. It's very engaging. Right?", color: "secondary"},
    { id: 3,header:'Dismissible popover', title: "popover Dismiss", content: "And here's some amazing content. It's very engaging. Right?", color: "info"},
    { id: 4,header:'Dismissible popover', title: "popover Dismiss", content: "And here's some amazing content. It's very engaging. Right?", color: "warning"},
  ]
}
    `,

}
export let DisabledPopover = {
    Html: `  <span class="d-inline-block" tabindex="0" data-bs-toggle="popover" triggers="hover focus" placement="end"
                ngbPopover="Disabled popover">
                <button [class]="'btn btn-primary'" type="button" [disabled]="true">Disabled
                    button</button>
            </span>  `,
    Ts: `
import { Component } from '@angular/core';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {

}
    `,

}
export let IconPopovers = {
    Html: `  @for(popover of SvgPopover;track popover){
            <a class="me-4 svg-{{popover.color}}" href="javascript:void(0);"
                popoverClass="popover-{{popover.class}} only-body" ngbPopover="{{popover.content}}"
                [innerHTML]="getSanitizedSVG(popover.svg)">
            </a>
            }  `,
    Ts: `
import { Component } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-popovers',
  imports: [NgbPopoverModule],
  templateUrl: './popovers.html',
  styleUrl: './popovers.scss'
})
export class PopoversComponent {
  SvgPopover = [
    { id: 1,
      class:'primary',svg:'<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none" /><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" /></svg>',
      content: "This popover is used to provide details about this icon.",  color: "primary", textcolor: ""},
    { id: 2,
      class:'secondary',
      content: "This popover is used to provide details about this icon.", svg: "<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>", color: "secondary", textcolor: ''},
   
  ]
       constructor( private sanitizer: DomSanitizer) { }
  
  getSanitizedSVG(svgContent: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svgContent);
  }
}
    `,

}

