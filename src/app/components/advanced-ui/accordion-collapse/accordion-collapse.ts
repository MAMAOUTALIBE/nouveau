import { Component } from '@angular/core';
import { NgbAccordionModule, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import *as prismCode from "../../../shared/data/prism/advanceUi/accordin&collapse"
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

import { SpkAccordion } from "../../../@spk/plugins/spk-accordion/spk-accordion";

@Component({
  selector: 'app-accordion-collapse',
  imports: [NgbModule, FormsModule, ReactiveFormsModule, NgbAccordionModule, ShowcodeCard, SpkAccordion],
  templateUrl: './accordion-collapse.html',
  styleUrl: './accordion-collapse.scss'
})
export class AccordionCollapse {
  prismCodeData = prismCode;
  isCollapsed: any = true;
  isCollapsed1: boolean = true;
  isCollapsed2: boolean = true;
  isCollapsed3: any = true;
  isHorizontalCollapsed: boolean = true;
  BasicAccordion = [
    {
      id: 'collapseOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapseTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapseThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];

  AlwaysOpenAccordion = [
    {
      id: 'panelsStayOpen-collapseOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'panelsStayOpen-collapseTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'panelsStayOpen-collapseThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];


  FlushAccordion = [
    {
      id: 'flush-collapseOne',
      title: 'Accordion Item #1',
      description: "Placeholder content for this accordion, which is intended to demonstrate the ",
      highlight: ".accordion-flush",
      subDescription: " class. This is the first item's accordion body.",
      expanded: false
    },
    {
      id: 'flush-collapseTwo',
      title: 'Accordion Item #2',
      description: "Placeholder content for this accordion, which is intended to demonstrate the ",
      highlight: ".accordion-flush",
      subDescription: " class. This is the second item's accordion body. Let's imagine this being filled with some actual content.",
      expanded: false
    },
    {
      id: 'flush-collapseThree',
      title: 'Accordion Item #3',
      description: "Placeholder content for this accordion, which is intended to demonstrate the ",
      highlight: ".accordion-flush",
      subDescription: " class. This is the third item's accordion body. Nothing more exciting happening here in terms of content, but just filling up the space to make it look, at least at first glance, a bit more representative of how this would look in a real-world application.",
      expanded: false
    }
  ];


  LightColorsPrimary = [
    {
      id: 'collapsePrimaryOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapsePrimaryTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapsePrimaryThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];

  LightColorsSecondary = [
    {
      id: 'collapseSecondaryOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapseSecondaryTwo',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.", // Note: Your snippet repeats the 'first item' text here
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapseSecondaryThree',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.", // Note: Your snippet repeats the 'first item' text here
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];


  SolidColorsPrimary = [
    {
      id: 'collapsePrimarySolidOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapsePrimarySolidTwo',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapsePrimarySolidThree',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];




  SolidColorsSecondary = [
    {
      id: 'collapseSecondarySolidOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapseSecondarySolidTwo',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapseSecondarySolidThree',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];





  ColoredBordersPrimary = [
    {
      id: 'primaryBorderOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'primaryBorderTwo',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'primaryBorderThree',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];



  ColoredBordersSecondary = [
    {
      id: 'successBorderOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'successBorderTwo',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'successBorderThree',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];






  LeftAlignedIcons = [
    {
      id: 'collapseleftOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapseLeftTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapseLeftThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];




  WithoutIcon = [
    {
      id: 'collapsenoIconOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapsenoIconTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapsenoIconThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];


  CustomIconAccordion = [
    {
      id: 'collapsecustomicon1One',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: true
    },
    {
      id: 'collapsecustomicon1Two',
      title: 'Accordion Item #2',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    },
    {
      id: 'collapsecustomicon1Three',
      title: 'Accordion Item #3',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance...",
      highlight: ".accordion-body",
      subDescription: ", though the transition does limit overflow.",
      expanded: false
    }
  ];



  CustomAccordion = [
    {
      id: 'customized-AccordionOne',
      title: 'Accordion Item #1',
      boldText: "This is the first item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the ",
      highlight: ".accordion-body",
      expanded: true,
      itemClass: 'custom-accordion-primary'
    },
    {
      id: 'customized-AccordionTwo',
      title: 'Accordion Item #2',
      boldText: "This is the second item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance...",

      highlight: ".accordion-body",
      expanded: false,
      itemClass: 'custom-accordion-secondary'
    },
    {
      id: 'customized-AccordionThree',
      title: 'Accordion Item #3',
      boldText: "This is the third item's accordion body.",
      description: "It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance...",

      highlight: ".accordion-body",
      expanded: false,
      itemClass: 'custom-accordion-danger'
    }
  ];

  HorizontalCollapse = [
    {
      triggerText: 'Toggle width collapse',
      bodyText: 'This is some placeholder content for a horizontal collapse. It\'s hidden by default and shown when triggered.',
      isCollapsed: true,
      targetId: 'collapseWidthExample',
      width: '230px',
      horizontal: true,
      collapseClass: 'primary'
    }
  ];









}



