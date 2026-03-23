import { Component } from '@angular/core';
import *as prismCode from "../../../shared/data/prism/ui-elements/spinners"
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-spinners',
    imports: [ ShowcodeCard,NgClass],
    templateUrl: './spinners.html',
    styleUrl: './spinners.scss'
})
export class Spinners {
  prismCodeData = prismCode;
   colors: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'];
  spinnerTypes: string[] = ['border', 'grow'];
}


