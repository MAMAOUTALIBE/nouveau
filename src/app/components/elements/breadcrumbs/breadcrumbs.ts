import { Component } from '@angular/core';
import { ShowcodeCard } from '../../../shared/components/showcode-card/showcode-card';
import * as PrismCode from '../../../shared/data/prism/ui-elements/breadcrumb';
import { SpkBreadcrumb } from "../../../@spk/reusable-ui-elements/spk-breadcrumb/spk-breadcrumb";
import { NgStyle } from '@angular/common';
@Component({
  selector: 'app-breadcrumbs',
  imports: [ ShowcodeCard, SpkBreadcrumb, NgStyle],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.scss'
})
export class Breadcrumbs {
  prismCodeData = PrismCode;

  breadcrumbStyle = {
    '--bs-breadcrumb-divider':
      'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\'%3E%3Cpath d=\'M2.5 0L1 1.5 3.5 4 1 6.5 2.5 8l4-4-4-4z\' fill=\'currentColor\'/%3E%3C/svg%3E")',
  };
  divider = {
    '--bs-breadcrumb-divider': "'~'"
  }
  divider1 = {
    '--bs-breadcrumb-divider': "''"
  }
}


