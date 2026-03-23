import { Component } from '@angular/core';
import { SpkCard } from '../../../@spk/spk-card/spk-card';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-cards',
    imports: [SpkCard, SpkDropdowns],
    templateUrl: './cards.html',
    styleUrl: './cards.scss'
})
export class Cards {

}


