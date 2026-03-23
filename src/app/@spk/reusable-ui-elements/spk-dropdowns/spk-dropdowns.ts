import { Component, EventEmitter, Output, TemplateRef, input } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'spk-dropdowns',
  standalone: true,
  imports: [NgbModule],
  templateUrl: './spk-dropdowns.html',
  styleUrl: './spk-dropdowns.scss'
})
export class SpkDropdowns {
   Customclass = input<string>();
   title = input<string>();
   Menulabel = input<string>();
   Menuclass = input<string>();
   Toggleshow = input<boolean>();
   Flip = input<boolean>();
   Menuvariant = input<string>();
   autoClose = input<true | 'outside' | 'inside' | false>();
   Id = input<string>();
   class = input<string>();
   iconPosition = input<string>();
   Imagetag = input<boolean>();
   Imagename = input<string>();
   Imagesrc = input<string>();
   Imageclass = input<string>();
   placement = input<any>();
   Icon = input<boolean>();
   IconClass = input<string>();
   Toggletext = input<string>();
   SvgClass = input<string>();
   Svgicon = input<string>();
   Badgetext = input<string>();
   splitTitle = input<string>();
   Buttontag = input<boolean>();
   Badgetag = input<boolean>();
   BadgeClass = input<string>();
   Arrowicon = input<boolean>();
   Svg = input<boolean>();
   splitbutton = input<boolean>();
   splitbuttonEnd = input<boolean>();
   splitbuttonClass = input<string>();
}
