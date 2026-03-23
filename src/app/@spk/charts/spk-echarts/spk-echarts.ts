import { Component, input } from '@angular/core';
import { EChartsOption } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
    selector: 'spk-echarts',
    imports: [NgxEchartsModule],
    templateUrl: './spk-echarts.html',
    styleUrl: './spk-echarts.scss'
})
export class SpkEcharts {
   options = input<EChartsOption>()
  id = input<string>()
  echartClass = input<string>()
}


