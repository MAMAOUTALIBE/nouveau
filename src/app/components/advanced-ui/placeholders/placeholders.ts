import { Component } from '@angular/core';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import *as PrismCode from '../../../shared/data/prism/advanceUi/placeholders';
@Component({
    selector: 'app-placeholders',
    imports: [ ShowcodeCard],
    templateUrl: './placeholders.html',
    styleUrl: './placeholders.scss'
})
export class Placeholders {
  prsimCodeData = PrismCode;
}


