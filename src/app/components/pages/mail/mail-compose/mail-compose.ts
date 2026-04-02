import { Component } from '@angular/core';
import { NgbTooltipModule, NgbDropdownItem } from '@ng-bootstrap/ng-bootstrap';
import { SpkDropdowns } from "../../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-mail-compose',
    imports: [NgbTooltipModule, SpkDropdowns, NgbDropdownItem],
    templateUrl: './mail-compose.html',
    styleUrl: './mail-compose.scss'
})
export class MailCompose {

}


