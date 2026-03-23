import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgClass } from '@angular/common';
import { NgToggleModule } from 'ng-toggle-button';
import * as PrismCode from '../../../../shared/data/prism/forms/form-elements/checks&radios';
import { ShowcodeCard } from '../../../../shared/components/showcode-card/showcode-card';
@Component({
    selector: 'app-checksradios',
    imports: [ FormsModule, ReactiveFormsModule, NgbModule, NgToggleModule, ShowcodeCard, NgClass],
    templateUrl: './checksradios.html',
    styleUrl: './checksradios.scss'
})
export class Checksradios {
  prsimCodeData = PrismCode;

  toggles = [
    { class: 'toggle  mb-3 radio-first' },
    { class: 'toggle  mb-3 toggle-secondary' },
    { class: 'toggle  mb-3 toggle-warning' },
    { class: 'toggle  mb-3 toggle-info' },
    { class: 'toggle  mb-3 toggle-success' },
    { class: 'toggle  mb-3 toggle-danger' },
    { class: 'toggle  mb-3 toggle-light' },
    { class: 'toggle  mb-3 toggle-dark' },
    // Add more toggles as needed
  ];

  statuses: boolean[] = Array(this.toggles.length).fill(true);

  clickEvent(index: number) {
    document.querySelector(`.${this.toggles[index].class}`)?.classList.toggle('on');
    this.statuses[index] = !this.statuses[index];
  }
  toggleSwitches = [
    { label: 'Small size toggle switch', code: 'toggle-sm', status: true },
    { label: 'Default toggle switch', code: 'toggle', status: true,bg:'toggle-secondary ' },
    { label: 'Large size toggle switch', code: 'toggle-lg', status: true,bg:'toggle-success'},
    // Add more toggle switches as needed
  ];

  clickEvent1(toggle: { label: string; code: string; status: boolean; }) {
    const toggleClass = toggle.code ? `toggle ${toggle.code}` : 'toggle';
    document.querySelector(`.${toggleClass}`)?.classList.toggle('on');
    toggle.status = !toggle.status;
  }
}

