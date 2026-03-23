export let Livedemo = {
    Html: `<a class="btn btn-primary mb-1" (click)="open(content)">
                                        Link with href
                                </a> &nbsp;
                                <button class="btn btn-primary mb-1" (click)="open(content)">
                                        Button with data-bs-target
                                </button>
                                <ng-template #content let-offcanvas>
                                ----Your Content --
                                </ng-template>               
                                `

    ,
    Ts: `
import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.html',
    styleUrl: './offcanvas.scss'
})
export class OffcanvasComponent {
    closeResult = '';

    constructor(private offcanvasService: NgbOffcanvas) {}

    open(content: any) {
        this.offcanvasService
            .open(content, { ariaLabelledBy: 'offcanvas-basic-title' })
            .result.then(
                (result) => {
                    this.closeResult = \`Closed with: \${result}\`;
                },
                (reason) => {
                    this.closeResult = \`Dismissed \${this.getDismissReason(reason)}\`;
                }
            );
    }

    private getDismissReason(reason: any): string {
        if (reason === OffcanvasDismissReasons.ESC) {
            return 'by pressing ESC';
        } else if (reason === OffcanvasDismissReasons.BACKDROP_CLICK) {
            return 'by clicking on the backdrop';
        } else {
            return \`with: \${reason}\`;
        }
    }
}
`
};
export let DisableBackDrop = {
    Html: `   <button class="btn btn-primary" (click)="openNoBackdrop(content)">No BackDrop</button>
                                <ng-template #content let-offcanvas>
                                ----Your Content --
                                </ng-template>               
                                `

    ,
    Ts: `
import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.html',
    styleUrl: './offcanvas.scss'
})
export class OffcanvasComponent {
    closeResult = '';

    constructor(private offcanvasService: NgbOffcanvas) {}

      openNoBackdrop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { backdrop: false });
  }
}
`
};
export let Staticbackdrop = {
    Html: `   <button class="btn btn-primary" (click)="openStaticBackdrop(content)">
            Toggle static offcanvas
        </button>
                                <ng-template #content let-offcanvas>
                                ----Your Content --
                                </ng-template>               
                                `

    ,
    Ts: `
import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.html',
    styleUrl: './offcanvas.scss'
})
export class OffcanvasComponent {
    closeResult = '';

    constructor(private offcanvasService: NgbOffcanvas) {}

    openStaticBackdrop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { backdrop: 'static' });
  }
}

`
};
export let Bodyscrolling = {
    Html: `  <button (click)="EnableBackdrop(content)" class="btn btn-primary" type="button" data-bs-toggle="offcanvas"
            data-bs-target="#offcanvasWithBothOptions" aria-controls="offcanvasWithBothOptions">
            Enable both scrolling &amp; backdrop
        </button>
                                <ng-template #content let-offcanvas>
                                ----Your Content --
                                </ng-template>               
                                `

    ,
    Ts: `
import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.html',
    styleUrl: './offcanvas.scss'
})
export class OffcanvasComponent {
    closeResult = '';

    constructor(private offcanvasService: NgbOffcanvas) {}

      EnableBackdrop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { scroll: false });
  }
}

`
};
export let Placement = {
    Html: `    <button (click)="openTop(content1)" class="btn btn-primary mb-1 me-1" type="button"
                data-bs-toggle="offcanvas" data-bs-target="#offcanvasTop" aria-controls="offcanvasTop">
                Toggle top offcanvas
            </button>
            <ng-template #content1 let-offcanvas>
                <div class="offcanvas-header">
                    <h5 class="offcanvas-title" id="offcanvasTopLabel">
                        Offcanvas top
                    </h5>
                    <button (click)="offcanvas.dismiss('Cross click')" type="button" class="btn-close"
                        data-bs-dismiss="offcanvas" aria-label="Close"></button>
                </div>
                <div class="offcanvas-body">...</div>
            </ng-template>
            <button (click)="openRight(content)" class="btn btn-primary mb-1 me-1" type="button"
                data-bs-toggle="offcanvas" data-bs-target="#offcanvasRight" aria-controls="offcanvasRight">
                Toggle right offcanvas
            </button>
            <button (click)="openBottom(content1)" class="btn btn-primary mb-1" type="button" data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasBottom" aria-controls="offcanvasBottom">
                Toggle bottom offcanvas
            </button>
                                <ng-template #content let-offcanvas>
                                ----Your Content --
                                </ng-template>               
                                `

    ,
    Ts: `
import { Component, TemplateRef } from '@angular/core';
import { NgbOffcanvas, OffcanvasDismissReasons } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-offcanvas',
    templateUrl: './offcanvas.html',
    styleUrl: './offcanvas.scss'
})
export class OffcanvasComponent {
    closeResult = '';

    constructor(private offcanvasService: NgbOffcanvas) {}

     openTop(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'top' });
  }
  openRight(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'end' });
  }

  openBottom(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { position: 'bottom' });
  }

}

`
};


