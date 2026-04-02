import { Component } from '@angular/core';
import *as PrismCode from "../../../shared/data/prism/ui-elements/buttongroup"
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
@Component({
    selector: 'app-button-group',
    imports: [NgbModule, ShowcodeCard, SpkDropdowns],
    templateUrl: './button-group.html',
    styleUrl: './button-group.scss'
})
export class ButtonGroup {
  prismCodeData = PrismCode;
}


