import { Component } from '@angular/core';
import * as PrismCode from '../../../shared/data/prism/ui-elements/listGroup';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';

@Component({
    selector: 'app-list-group',
    imports: [ ShowcodeCard],
    templateUrl: './list-group.html',
    styleUrl: './list-group.scss'
})
export class ListGroup {
  prismCodeData = PrismCode;
}


