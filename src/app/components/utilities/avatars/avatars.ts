import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/utilities/avatars';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-avatars',
    imports: [ ShowcodeCard],
    templateUrl: './avatars.html',
    styleUrls: ['./avatars.scss']
})
export class Avatars {
  prismcode = PrismCode;

}


