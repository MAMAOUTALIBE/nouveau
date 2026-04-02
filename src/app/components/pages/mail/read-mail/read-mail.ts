import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkDropdowns } from "../../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";

@Component({
    selector: 'app-read-mail',
    imports: [RouterModule, NgbModule, SpkDropdowns],
    templateUrl: './read-mail.html',
    styleUrl: './read-mail.scss'
})
export class ReadMail {

}


