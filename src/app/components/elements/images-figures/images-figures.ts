import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/images&figures';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-images-figures',
    imports: [ ShowcodeCard],
    templateUrl: './images-figures.html',
    styleUrls: ['./images-figures.scss']
})
export class ImagesFigures {

  prismCodeData = PrismCode;
}


