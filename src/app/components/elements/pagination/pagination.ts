import { Component } from '@angular/core';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import * as prismCode from '../../../shared/data/prism/ui-elements/pagination'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'app-pagination',
    imports: [ ShowcodeCard, NgbModule],
    templateUrl: './pagination.html',
    styleUrl: './pagination.scss'
})
export class Pagination {
    prismCodeData=prismCode

}


