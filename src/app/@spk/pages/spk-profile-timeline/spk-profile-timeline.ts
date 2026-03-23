 import { Component, input } from '@angular/core';
import { SpkDropdowns } from '../../reusable-ui-elements/spk-dropdowns/spk-dropdowns';

@Component({
  selector: 'spk-profile-timeline',
  imports: [SpkDropdowns],
  templateUrl: './spk-profile-timeline.html',
  styleUrl: './spk-profile-timeline.scss',
})
export class SpkProfileTimeline {
images=input<string[]>()
}
