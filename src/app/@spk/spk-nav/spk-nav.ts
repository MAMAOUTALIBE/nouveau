import { NgTemplateOutlet } from '@angular/common';
import { Component, input, model, output, TemplateRef, ViewChild } from '@angular/core';
import { NgbNav, NgbModule, NgbNavModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
export interface NavTab {
  id: number | string;
  label: string;
  icon?: string;
  disabled?: boolean;
  isDropdown?: boolean;
  navClasses?: string;
  navbuttonClass?: string;
  badge?: {
    text: string | number;
    class: string;
  };
  dropdownItems?: { label: string; action?: string; isDivider?: boolean }[]; // New: dropdown list
}
@Component({
  selector: 'spk-nav',
  imports: [NgbNavModule, NgbDropdownModule, NgTemplateOutlet],
  templateUrl: './spk-nav.html',
  styleUrl: './spk-nav.scss',
})
export class SpkNav {
  @ViewChild('nav', { static: true }) public navInstance!: NgbNav;
  ready = output<NgbNav>();
  tabcontent = input<string>('tab-content');
  navClasses = input<string>('nav-tabs');
  navItemClass = input<string>('nav-item');
  navbuttonClass = input<string>('nav-link');
  tabs = input<NavTab[]>();
  contentTemplate = input<TemplateRef<{ $implicit: NavTab }>>();
  activeId = model<string | number>(1);
  ngAfterViewInit() {
    // Emit the instance so the parent can refresh its binding
    this.ready.emit(this.navInstance);
  }
}
