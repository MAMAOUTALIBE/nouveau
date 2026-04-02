import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/objectFit'
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-media-object',
    imports: [ ShowcodeCard],
    templateUrl: './media-object.html',
    styleUrl: './media-object.scss'
})
export class MediaObject {
  prismCodeData = PrismCode;
}


