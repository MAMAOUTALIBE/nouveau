import { Component } from '@angular/core';
import { SpkApexcharts } from '../../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-bubblecharts',
  imports: [ SpkApexcharts],
  templateUrl: './bubblecharts.html',
  styleUrl: './bubblecharts.scss'
})
export class Bubblecharts {
  public generateData(baseval: number, count: number, yrange: { min: any; max: any }) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = Math.floor(Math.random() * (750 - 1 + 1)) + 1;
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;
      var z = Math.floor(Math.random() * (75 - 15 + 1)) + 15;

      series.push([x, y, z]);
      baseval += 86400000;
      i++;
    }
    return series;
  }
  SimpleBubbleChart: ApexOptions = {
    series: [{
      name: 'Bubble1',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble2',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble3',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Bubble4',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    chart: {
      height: 320,
      type: 'bubble',
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 0.8
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    title: {
      text: 'Simple Bubble Chart',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    colors: ["#38cab3", "#38cab3", "#ffbd5a"],
    xaxis: {
      tickAmount: 12,
      type: 'category',
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    yaxis: {
      max: 70,
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      }
    }
  };
  BubbleChart3D: ApexOptions = {
    series: [{
      name: 'Product1',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Product2',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Product3',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    },
    {
      name: 'Product4',
      data: this.generateData(new Date('11 Feb 2017 GMT').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    chart: {
      height: 320,
      type: 'bubble',
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    colors: ["#38cab3", "#38cab3", "#ffbd5a"],
    title: {
      text: '3D Bubble Chart',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    xaxis: {
      tickAmount: 12,
      type: 'datetime',
      labels: {
        rotate: 0,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    yaxis: {
      max: 70,
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      }
    },
    theme: {
      palette: 'palette2'
    }
  }



}


