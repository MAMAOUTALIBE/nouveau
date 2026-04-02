import { Component } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import * as prismCode from '../../../shared/data/prism/advanceUi/scrollpsy';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";


@Component({
    selector: 'app-scrollspy',
    imports: [NgbModule, ShowcodeCard, SpkDropdowns],
    templateUrl: './scrollspy.html',
    styleUrl: './scrollspy.scss'
})
export class Scrollspy {
  prismCodeData=prismCode
}


