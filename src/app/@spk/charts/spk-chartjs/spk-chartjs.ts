import { Component, input } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';

import { ChartConfiguration } from 'chart.js';
@Component({
  selector: 'spk-chartjs',
  imports: [BaseChartDirective],
  templateUrl: './spk-chartjs.html',
  styleUrl: './spk-chartjs.scss'
})
export class SpkChartjs {
  canvasClass = input<string>();
  chartjs = input<ChartConfiguration>();
  id=input<string>()
  class=input<string>()
}


