import { Component, input, contentChild, TemplateRef } from '@angular/core';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';
import { NgTemplateOutlet } from '@angular/common';
export interface AccordionItem {
  id?: string | number;
  expanded?: boolean;
  itemClass?: string;
  headerClass?: string;
  bodyClass?: string;
  // You can add more optional UI properties here
}
@Component({
  selector: 'spk-accordion',
  standalone: true,
  imports: [NgbAccordionModule, NgTemplateOutlet],
  templateUrl: './spk-accordion.html',
})
export class SpkAccordion {

  // Accordion-level inputs
  items = input<AccordionItem[]>();
  accordionId = input<string>('accordionExample');
  closeOthers = input<boolean>(false);

  // Class inputs to match your specific UI
  accordionClass = input<string>('accordion');
  buttonClass = input<string>('accordion-button');

  // Templates for content projection
  headerTemplate = contentChild<TemplateRef<any>>('header');
  bodyTemplate = contentChild<TemplateRef<any>>('body');
}
