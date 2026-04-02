export let BasicAccordion = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion" id="accordionExample">

                @for (data of BasicAccordion ; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item ">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerid">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse id="collapseOne" class="accordion-collapse collapse show"
                        aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                        <div ngbAccordionBody class="accordion-body">
                            <ng-template>
                                {{data.content}}
                                <code>{{data.code}}</code>{{data.afterCodeContent}}
                            </ng-template>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {

 BasicAccordion = [
    {
      collapsed: false,
      headerid: 'headingOne',
      title: 'Accordion Item #1',
      accordinid: 'collapseOne',
      content: 'This is the first item\'s accordion body. It is shown bydefault, until the collapse plugin adds the appropriate classes that weuse to style each element. These classes control the overall appearance,as well as the showing and hiding via CSS transitions. You can modifyany of this with custom CSS or overriding our default variables. It\'salso worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ', though the transition does limit overflow.'
    },
    {
      collapsed: true,
      headerid: 'headingTwo',
      title: ' Accordion Item #2',
      accordinid: 'collapseTwo',
      content: 'This is the second item\'s accordion body. It is hidden by default,until the collapse plugin adds the appropriate classes that we use to style eachelement. These classes control the overall appearance, as well as the showing and hidingvia CSS transitions. You can modify any of this with custom CSS or overriding ourdefault variables. It\'s also worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ',though the transition does limit overflow.'
    },
    {
      collapsed: true,
      headerid: 'headingThree',
      title: ' Accordion Item #3',
      accordinid: 'collapseThree',
      content: 'This is the third item\'s accordion body. It is hidden by default,until the collapse plugin adds the appropriate classes that we use to style eachelement. These classes control the overall appearance, as well as the showing and hidingvia CSS transitions. You can modify any of this with custom CSS or overriding ourdefault variables. It\'s also worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ',though the transition does limit overflow.'
    },
  ]

}
    `,

}
export let alwaysOpenAccordion = {
    Html: ` <p class="text-muted subtitle fs-12 fw-normal">Omit the <code>data-bs-parent</code>
                attribute on each
                <code>.accordion-collapse</code>
                to make accordion items stay open when another item is opened.
            </p>


            <div ngbAccordion [closeOthers]="false" class="accordion" id="accordionPanelsStayOpenExample">

                @for (data of AlwaysOpenAccordion ; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item ">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerid">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse id="collapseOne" class="accordion-collapse collapse show"
                        aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                        <div ngbAccordionBody class="accordion-body">
                            <ng-template>
                                {{data.content}}
                                <code>{{data.code}}</code>{{data.afterCodeContent}}
                            </ng-template>
                        </div>
                    </div>
                </div>
                }
            </div>

`,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 AlwaysOpenAccordion=[
      {
      collapsed: false,
      headerid: 'panelsStayOpen-headingOne',
      title: 'Accordion Item #1',
      accordinid: 'panelsStayOpen-collapseOne',
      content: 'This is the first item\'s accordion body. It is shown bydefault, until the collapse plugin adds the appropriate classes that weuse to style each element. These classes control the overall appearance,as well as the showing and hiding via CSS transitions. You can modifyany of this with custom CSS or overriding our default variables. It\'salso worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ', though the transition does limit overflow.'
    },
    {
      collapsed: true,
      headerid: 'panelsStayOpen-headingTwo',
      title: ' Accordion Item #2',
      accordinid: 'panelsStayOpen-collapseTwo',
      content: 'This is the second item\'s accordion body. It is hidden by default,until the collapse plugin adds the appropriate classes that we use to style eachelement. These classes control the overall appearance, as well as the showing and hidingvia CSS transitions. You can modify any of this with custom CSS or overriding ourdefault variables. It\'s also worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ',though the transition does limit overflow.'
    },
    {
      collapsed: true,
      headerid: 'panelsStayOpen-headingThree',
      title: ' Accordion Item #3',
      accordinid: 'panelsStayOpen-collapseThree',
      content: 'This is the third item\'s accordion body. It is hidden by default,until the collapse plugin adds the appropriate classes that we use to style eachelement. These classes control the overall appearance, as well as the showing and hidingvia CSS transitions. You can modify any of this with custom CSS or overriding ourdefault variables. It\'s also worth noting that just about any HTML can go within the',
      code: '.accordion-body',
      afterCodeContent: ',though the transition does limit overflow.'
    },
  ]
}
    `,

}




export let FlushAccordion = {
    Html: ` <p class="subtitle text-muted fs-12 fw-normal">
                Add <code>.accordion-flush</code> to remove the default
                <code>background-color</code>,
                some borders, and some rounded corners to render accordions edge-to-edge with
                their
                parent container.
            </p>
            <div ngbAccordion [closeOthers]="true" class="accordion accordion-flush" id="accordionFlushExample">
                @for (data of FlushAccordion; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button " type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionFlushExample">
                        <div ngbAccordionBody class="accordion-body">
                            <ng-template>
                                {{data.content}}
                            </ng-template>
                        </div>
                    </div>
                </div>
                }
            </div>   `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 FlushAccordion = [
    {
      collapsed: false,
      headerId: 'flush-headingOne',
      collapseId: 'flush-collapseOne',
      title: 'Accordion Item #1',
      content: "Placeholder content for this accordion, which is intended to demonstrate the .accordion-flush class. This is the first item's accordion body."
    },
    {
      collapsed: true,
      headerId: 'flush-headingTwo',
      collapseId: 'flush-collapseTwo',
      title: 'Accordion Item #2',
      content: "Placeholder content for this accordion, which is intended to demonstrate the .accordion-flush class. This is the second item's accordion body. Let's imagine this being filled with some actual content."
    },
    {
      collapsed: true,
      headerId: 'flush-headingThree',
      collapseId: 'flush-collapseThree',
      title: 'Accordion Item #3',
      content: "Placeholder content for this accordion, which is intended to demonstrate the .accordion-flush class. This is the third item's accordion body. Nothing more exciting happening here in terms of content, but just filling up the space to make it look, at least at first glance, a bit more representative of how this would look in a real-world application."
    }
  ];
}
    `,

}


export let LightColorsPrimary = {
    Html: `  <div ngbAccordion [closeOthers]="true" class="accordion accordion-primary" id="accordionPrimaryExample">
                @for (data of LightColorsPrimary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionPrimaryExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 LightColorsPrimary = [
    {
      collapsed: false,
      headerId: 'headingPrimaryOne',
      collapseId: 'collapsePrimaryOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingPrimaryTwo',
      collapseId: 'collapsePrimaryTwo',
      title: 'Accordion Item #2',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingPrimaryThree',
      collapseId: 'collapsePrimaryThree',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It\'s also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}


export let LightColorsSecondary = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion accordion-secondary" id="accordionSecondaryExample">
                @for (data of LightColorsSecondary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionSecondaryExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 LightColorsSecondary = [
    {
      collapsed: false,
      headerId: 'headingSecondaryOne',
      collapseId: 'collapseSecondaryOne',
      title: 'Accordion Item #1',
  content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
},
    {
        collapsed: true,
        headerId: 'headingSecondaryTwo',
        collapseId: 'collapseSecondaryTwo',
        title: 'Accordion Item #2',
        content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
        collapsed: true,
        headerId: 'headingSecondaryThree',
        collapseId: 'collapseSecondaryThree',
        title: 'Accordion Item #3',
        content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It\'s also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
`,

}


export let SolidColorsPrimary = {
    Html: `<div ngbAccordion [closeOthers]="true" class="accordion accordion-solid-primary"
                id="accordionPrimarySolidExample">
                @for (data of SolidColorsPrimary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionPrimarySolidExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 SolidColorsPrimary = [
    {
      collapsed: false,
      headerId: 'headingPrimarySolidOne',
      collapseId: 'collapsePrimarySolidOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingPrimarySolidTwo',
      collapseId: 'collapsePrimarySolidTwo',
      title: 'Accordion Item #2',
      content:"This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingPrimarySolidThree',
      collapseId: 'collapsePrimarySolidThree',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It\'s also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}

export let SolidColorsSecondary = {
    Html: `  <div ngbAccordion [closeOthers]="true" class="accordion accordion-solid-secondary"
                id="accordionSecondarySolidExample">
                @for (data of SolidColorsSecondary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionSecondarySolidExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
SolidColorsSecondary = [
    {
      collapsed: false,
      headerId: 'headingSecondarySolidOne',
      collapseId: 'collapseSecondarySolidOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingSecondarySolidTwo',
      collapseId: 'collapseSecondarySolidTwo',
      title: 'Accordion Item #2',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingSecondarySolidThree',
      collapseId: 'collapseSecondarySolidThree',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It\'s also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}

export let BorderColorsPrimary = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion accordion-border-primary accordions-items-seperate"
                id="accordionprimaryborderExample">
                @for (data of BorderColorsPrimary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionprimaryborderExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
  BorderColorsPrimary = [
    {
      collapsed: false,
      headerId: 'headingborderprimaryOne',
      collapseId: 'primaryBorderOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingborderprimaryTwo',
      collapseId: 'primaryBorderTwo',
      title: 'Accordion Item #2',
      content:" This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingborderprimaryThree',
      collapseId: 'primaryBorderThree',
      title: 'Accordion Item #3',
      content:" This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];

}
    `,

}


export let BorderColorsSecondary = {
    Html: `            <div ngbAccordion [closeOthers]="true"
                class="accordion accordion-border-secondary accordions-items-seperate"
                id="accordionsecondaryborderExample">
                @for (data of BorderColorsSecondary; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordionsecondaryborderExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 BorderColorsSecondary = [
    {
      collapsed: false,
      headerId: 'headingbordersecondaryOne',
      collapseId: 'secondaryBorderOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingbordersecondaryTwo',
      collapseId: 'secondaryBorderTwo',
      title: 'Accordion Item #2',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingbordersecondaryThree',
      collapseId: 'secondaryBorderThree',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}


export let CustomIconAccordion = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion accordion-customicon1 accordions-items-seperate"
                id="accordioncustomicon1Example">
                @for (data of CustomIconAccordion; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordioncustomicon1Example">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 CustomIconAccordion = [
    {
      collapsed: false,
      headerId: 'headingcustomicon1One',
      collapseId: 'collapsecustomicon1One',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingcustomicon1Two',
      collapseId: 'collapsecustomicon1Two',
      title: 'Accordion Item #2',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingcustomicon1Three',
      collapseId: 'collapsecustomicon1Three',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}


export let CustomAccordion = {
    Html: `
            <div ngbAccordion [closeOthers]="true" class="accordion customized-accordion accordions-items-seperate"
                id="customizedAccordion">
                @for (data of CustomAccordion; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item {{data.itemClass}}">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#customizedAccordion">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
CustomAccordion = [
    {
      collapsed: false,
      headerId: 'customizedAccordionOne',
      collapseId: 'customized-AccordionOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow.",
      itemClass: 'custom-accordion-primary'
    },
    {
      collapsed: true,
      headerId: 'customizedAccordionTwo',
      collapseId: 'customized-AccordionTwo',
      title: 'Accordion Item #2',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow.",
      itemClass: 'custom-accordion-secondary'
    },
    {
      collapsed: true,
      headerId: 'customizedAccordionThree',
      collapseId: 'customized-AccordionThree',
      title: 'Accordion Item #3',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow.",
      itemClass: 'custom-accordion-danger'
    }
  ];
}
    `,

}

export let LeftIconAccordion = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion accordionicon-left accordions-items-seperate"
                id="accordioniconLeftExample">
                @for (data of LeftIconAccordion; track data) {
                <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                    <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                        <button ngbAccordionButton class="accordion-button" type="button" data-bs-toggle="collapse"
                            [attr.data-bs-target]="'#' + data.collapseId" [attr.aria-expanded]="!data.collapsed"
                            [attr.aria-controls]="data.collapseId">
                            {{data.title}}
                        </button>
                    </h2>
                    <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                        [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                        data-bs-parent="#accordioniconLeftExample">
                        <div ngbAccordionBody class="accordion-body">
                            <strong>{{data.content}}</strong>
                        </div>
                    </div>
                </div>
                }
            </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
LeftIconAccordion = [
    {
      collapsed: false,
      headerId: 'headingleftOne',
      collapseId: 'collapseleftOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingleftTwo',
      collapseId: 'collapseLeftTwo',
      title: 'Accordion Item #2',
      content: "This is the second item's accordion body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingleftThree',
      collapseId: 'collapseLeftThree',
      title: 'Accordion Item #3',
      content: "This is the third item's accordion body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}

export let NoIconAccordion = {
    Html: ` <div ngbAccordion [closeOthers]="true" class="accordion accordionicon-none accordions-items-seperate"
                    id="accordioniconnoIconExample">
                    @for (data of NoIconAccordion; track data) {
                    <div ngbAccordionItem [collapsed]="data.collapsed" class="accordion-item">
                        <h2 ngbAccordionHeader class="accordion-header" [id]="data.headerId">
                            <button ngbAccordionButton class="accordion-button" 
                                type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#' + data.collapseId"
                                [attr.aria-expanded]="!data.collapsed" [attr.aria-controls]="data.collapseId">
                                {{data.title}}
                            </button>
                        </h2>
                        <div ngbAccordionCollapse [id]="data.collapseId" class="accordion-collapse collapse"
                            [class.show]="!data.collapsed" [attr.aria-labelledby]="data.headerId"
                            data-bs-parent="#accordioniconnoIconExample">
                            <div ngbAccordionBody class="accordion-body">
                                <strong>{{data.content}}</strong>
                            </div>
                        </div>
                    </div>
                    }
                </div>  `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
NoIconAccordion = [
    {
      collapsed: false,
      headerId: 'headingnoIconOne',
      collapseId: 'collapsenoIconOne',
      title: 'Accordion Item #1',
      content: "This is the first item's accordion body. It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingnoIconTwo',
      collapseId: 'collapsenoIconTwo',
      title: 'Accordion Item #2',
      content: "This is the second item's accordion body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    },
    {
      collapsed: true,
      headerId: 'headingnoIconThree',
      collapseId: 'collapsenoIconThree',
      title: 'Accordion Item #3',
      content: "This is the third item's accordion body. It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the .accordion-body, though the transition does limit overflow."
    }
  ];
}
    `,

}

export let Example = {
    Html: `  <p class="mb-0">
                <a class="btn btn-primary collapsed mb-2 me-1" (click)="collapse.toggle()" data-bs-toggle="collapse"
                    role="button" [attr.aria-expanded]="!isCollapsed" aria-controls="collapseExample">
                    Link with href
                </a>
                <button class="btn btn-secondary collapsed mb-2" (click)="isCollapsed = !isCollapsed" type="button"
                    data-bs-toggle="collapse" data-bs-target="#collapseExample" [attr.aria-expanded]="!isCollapsed"
                    aria-controls="collapseExample">
                    Button with data-bs-target
                </button>
            </p>
            <div #collapse="ngbCollapse" [(ngbCollapse)]="isCollapsed" id="collapseExample">
                <div class="card card-body mb-0">
                    Some placeholder content for the collapse component. This panel is hidden by default but revealed
                    when the user activates the relevant trigger.
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
  isCollapsed: any = true;
}
    `,

}

export let TargetsCollapse = {
    Html: `  <p class="mb-0">
                <a class="btn btn-primary mb-2 me-1" (click)="isCollapsed1 = !isCollapsed1" role="button"
                    [attr.aria-expanded]="!isCollapsed1" [attr.aria-controls]="'multiCollapseExample1'">Toggle
                    first element</a>
                <button class="btn btn-success mb-2 me-1" (click)="isCollapsed2 = !isCollapsed2"
                    [attr.aria-expanded]="!isCollapsed2" [attr.aria-controls]="'multiCollapseExample2'">Toggle
                    second element</button>
                <button class="btn btn-danger mb-2 me-1"
                    (click)="isCollapsed1 = !isCollapsed1; isCollapsed2 = !isCollapsed2"
                    [attr.aria-expanded]="!isCollapsed1 && !isCollapsed2"
                    [attr.aria-controls]="'multiCollapseExample1 multiCollapseExample2'">Toggle both
                    elements</button>
            </p>
            <div class="row">
                <div class="col m-1">
                    <div class="collapse multi-collapse" id="multiCollapseExample1" [ngbCollapse]="isCollapsed1">
                        <div class="card card-body mb-0 shadow-none">
                            Some placeholder content for the first collapse component of this multi-collapse
                            example. This panel is hidden by default but revealed when the user activates the
                            relevant trigger.
                        </div>
                    </div>
                </div>
                <div class="col m-1">
                    <div class="collapse multi-collapse" id="multiCollapseExample2" [ngbCollapse]="isCollapsed2">
                        <div class="card card-body mb-0 shadow-none">
                            Some placeholder content for the second collapse component of this multi-collapse
                            example. This panel is hidden by default but revealed when the user activates the
                            relevant trigger.
                        </div>
                    </div>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {
 isCollapsed1: boolean = true;
   isCollapsed2: boolean = true;
}
    `,

}

export let HorizontalCollapse = {
    Html: ` <div ngbAccordion class="card-body">
                <div ngbAccordionItem>

                    <p>
                        <button ngbAccordionButton class="btn btn-primary" type="button" data-bs-toggle="collapse"
                            data-bs-target="#collapseWidthExample" aria-expanded="false"
                            aria-controls="collapseWidthExample">
                            Toggle width collapse
                        </button>
                    </p>
                    <div style="min-height: 120px;">
                        <div ngbAccordionCollapse class="collapse collapse-horizontal" id="collapseWidthExample">
                            <div ngbAccordionBody class="card card-body" style="width: 230px;">
                                This is some placeholder content for a horizontal collapse. It's
                                hidden
                                by default and shown when triggered.
                            </div>
                        </div>
                    </div>
                </div>
            </div> `,
    Ts: `
import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-accordin-collapse',
  imports: [NgbAccordionModule,NgbModule],
  templateUrl: './accordin-collapse.html',
  styleUrl: './accordin-collapse.scss'
})
export class AccordinCollapseComponent {

}
    `,

}



