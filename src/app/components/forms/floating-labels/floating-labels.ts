import { Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ShowcodeCard } from "../../../shared/components/showcode-card/showcode-card";
import * as prismcodeData from "../../../shared/data/prism/forms/floating-labels"
@Component({
  selector: 'app-floating-labels',
  imports: [ MatFormFieldModule, MatSelectModule, ShowcodeCard],
  templateUrl: './floating-labels.html',
  styleUrl: './floating-labels.scss'
})
export class FloatingLabels {
  prismCode = prismcodeData
}


