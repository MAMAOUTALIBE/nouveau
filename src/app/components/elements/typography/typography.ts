import { Component } from '@angular/core';
import *as prsimCode from "../../../shared/data/prism/ui-elements/typography"
import { ShowcodeCard } from "../../../shared/components/showcode-card/showcode-card";
@Component({
  selector: 'app-typography',

  imports: [ShowcodeCard],
  templateUrl: './typography.html',
  styleUrl: './typography.scss'
})
export class Typography {
  prismCodeData=prsimCode
}
