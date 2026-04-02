import { data } from './../../echarts/echarts_data_';
import { Component, } from '@angular/core';
import { SpkApexcharts } from "../../../../@spk/charts/spk-apexcharts/spk-apexcharts";
import { ApexOptions } from 'ng-apexcharts';
import { dataSeries, series } from './data-series';
interface YRange { min: number; max: number; }
@Component({
  selector: 'app-line-charts',
  templateUrl: './line-charts.html',
  styleUrl: './line-charts.scss',
  imports: [SpkApexcharts]
})
export class LineCharts {
  BasicLineChart: ApexOptions = {
    series: [
      {
        name: "Desktops",
        data: [10, 41, 35, 51, 49, 62, 69, 91, 148]
      }
    ],
    chart: {
      height: 320,
      type: 'line',
      zoom: {
        enabled: false
      }
    },
    colors: ['#38cab3'],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight',
      width: 3,
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    title: {
      text: 'Product Trends by Month',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
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
  }

  LineChartWithDataLabels: ApexOptions = {
    series: [
      {
        name: "High - 2013",
        data: [28, 29, 33, 36, 32, 32, 33]
      },
      {
        name: "Low - 2013",
        data: [12, 11, 14, 18, 17, 13, 13]
      }
    ],
    chart: {
      height: 320,
      type: 'line',
      dropShadow: {
        enabled: true,
        color: '#000',
        top: 18,
        left: 7,
        blur: 10,
        opacity: 0.2
      },
      toolbar: {
        show: false
      }
    },
    colors: ['#38cab3', '#4ec2f0'],
    dataLabels: {
      enabled: true,
    },
    stroke: {
      curve: 'smooth'
    },
    title: {
      text: 'Average High & Low Temperature',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    markers: {
      size: 1
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      title: {
        text: 'Month',
        style: {
          fontSize: '13px',
          fontWeight: 'bold',
          color: "#8c9097"
        }
      },
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      },
    },
    yaxis: {
      title: {
        text: 'Temperature',
        style: {
          fontWeight: 'bold',
          fontSize: '13px',
          color: "#8c9097"
        }
      },
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      },
      min: 5,
      max: 40
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5
    }
  }



  dataSeries = dataSeries;
  dates: [number, number][] = [];

  ts2 = 1484418600000;
  spikes = [5, -5, 3, -3, 8, -8]

  transformData() {
    let ts2 = 1484418600000;
    const spikes = [5, -5, 3, -3, 8, -8]; // For demonstration, but not used here

    for (let i = 0; i < 120; i++) {
      ts2 = ts2 + 86400000; // Increment by 1 day (in milliseconds)
      this.dates.push([ts2, this.dataSeries[1][i].value]); // Push transformed data into 'dates' array
    }
  }
  ZoomableTimeSeries: ApexOptions = {
    series: [{
      name: 'XYZ MOTORS',
      data: this.dates
    }],
    chart: {
      type: 'area',
      stacked: false,
      height: 320,
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: 'zoom'
      }
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0,
    },
    title: {
      text: 'Stock Price Movement',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      },
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    colors: ["#38cab3"],
    yaxis: {
      labels: {
        formatter: function (val) {
          return (val / 1000000).toFixed(0);
        },
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      },
      title: {
        text: 'Price',
        style: {
          fontWeight: 'bold',
          fontSize: '13px',
          color: "#8c9097"
        }
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      },
    },
    tooltip: {
      shared: false,
      y: {
        formatter: function (val) {
          return (val / 1000000).toFixed(0)
        }
      }
    }
  }
  ngOnInit(): void {
    this.transformData(); // This populates the 'dates' array
    this.ZoomableTimeSeries.series = [{
      name: 'XYZ MOTORS',
      data: this.dates
    }]; // Assign the transformed data to the chart series
  }

  LineWithAnnotations: ApexOptions = {
    series: [{
      data: series.monthDataSeries2.prices
    }],
    colors: ["#38cab3"],
    chart: {
      height: 320,
      type: 'line',
      id: 'areachart-2'
    },
    annotations: {
      yaxis: [{
        y: 8200,
        borderColor: '#00E396',
        label: {
          borderColor: '#00E396',
          style: {
            color: '#fff',
            background: '#00E396',
          },
          text: 'Support',
        }
      }, {
        y: 8600,
        y2: 9000,
        borderColor: '#000',
        fillColor: '#FEB019',
        opacity: 0.2,
        label: {
          borderColor: '#333',
          style: {
            fontSize: '10px',
            color: '#333',
            background: '#FEB019',
          },
          text: 'Y-axis range',
        }
      }],
      xaxis: [{
        x: new Date('23 Nov 2017').getTime(),
        strokeDashArray: 0,
        borderColor: '#775DD0',
        label: {
          borderColor: '#775DD0',
          style: {
            color: '#fff',
            background: '#775DD0',
          },
          text: 'Anno Test',
        }
      }, {
        x: new Date('26 Nov 2017').getTime(),
        x2: new Date('28 Nov 2017').getTime(),
        fillColor: '#B3F7CA',
        opacity: 0.4,
        label: {
          borderColor: '#B3F7CA',
          style: {
            fontSize: '10px',
            color: '#fff',
            background: '#00E396',
          },
          offsetY: -10,
          text: 'X-axis range',
        }
      }],
      points: [{
        x: new Date('01 Dec 2017').getTime(),
        y: 8607.55,
        marker: {
          size: 8,
          fillColor: '#fff',
          strokeColor: 'red',
          cssClass: 'apexcharts-custom-class'
        },
        label: {
          borderColor: '#FF4560',
          offsetY: 0,
          style: {
            color: '#fff',
            background: '#FF4560',
          },

          text: 'Point Annotation',
        }
      }, {
        x: new Date('08 Dec 2017').getTime(),
        y: 9340.85,
        marker: {
          size: 0
        },
        image: {
          path: './assets/images/faces/1.jpg'
        }
      }]
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    title: {
      text: 'Line with Annotations',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    labels: series.monthDataSeries1.dates,
    xaxis: {
      type: 'datetime',
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
  }

  generateDayWiseTimeSeries(baseval: number, count: number, yrange: YRange): [number, number][] {
    const series: [number, number][] = [];

    for (let i = 0; i < count; i++) {
      const x = baseval;
      const y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push([x, y]);
      baseval += 86400000; // increment by one day in ms
    }

    return series;
  }

  BrushChart1: ApexOptions = {
    series: [{
      data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    chart: {
      id: 'fb',
      group: 'social',
      type: 'line',
      height: 160
    },
    colors: ['#38cab3'],
    stroke: {
      curve: 'straight',
      width: 3,
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
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
  }
  BrushChart2: ApexOptions = {
    series: [{
      data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 20, {
        min: 10,
        max: 30
      })
    }],
    chart: {
      id: 'tw',
      group: 'social',
      type: 'line',
      height: 160
    },
    stroke: {
      curve: 'straight',
      width: 3,
    },
    colors: ['#4ec2f0'],
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
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
  }
  StepLineChart: ApexOptions = {
    series: [{
      data: [34, 44, 54, 21, 12, 43, 33, 23, 66, 66, 58]
    }],
    chart: {
      type: 'line',
      height: 345
    },
    stroke: {
      curve: 'stepline',
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    dataLabels: {
      enabled: false
    },
    colors: ["#38cab3"],
    title: {
      text: 'Stepline Chart',
      align: 'left'
    },
    markers: {
      hover: {
        sizeOffset: 4
      }
    },
    xaxis: {
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
  }
  GradientLineChart: ApexOptions = {
    series: [{
      name: 'Sales',
      data: [4, 3, 10, 9, 29, 19, 22, 9, 12, 7, 19, 5, 13, 9, 17, 2, 7, 5]
    }],
    chart: {
      height: 320,
      type: 'line',
    },
    forecastDataPoints: {
      count: 7
    },
    stroke: {
      width: 3,
      curve: 'smooth'
    },
    xaxis: {
      type: 'datetime',
      categories: ['1/11/2000', '2/11/2000', '3/11/2000', '4/11/2000', '5/11/2000', '6/11/2000', '7/11/2000', '8/11/2000', '9/11/2000', '10/11/2000', '11/11/2000', '12/11/2000', '1/11/2001', '2/11/2001', '3/11/2001', '4/11/2001', '5/11/2001', '6/11/2001'],
      tickAmount: 10,
      labels: {
        formatter: function (value, timestamp: number, opts) {
          return opts.dateFormatter(new Date(timestamp), 'dd MMM')
        },
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    title: {
      text: 'Forecast',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        gradientToColors: ['#38cab3'],
        shadeIntensity: 1,
        type: 'horizontal',
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100, 100, 100]
      },
    },
    yaxis: {
      min: -10,
      max: 40,
      labels: {
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    }
  }
  MissingNullValuesChart: ApexOptions = {
    series: [{
      name: 'Peter',
      data: [5, 5, 10, 8, 7, 5, 4, null, null, null, 10, 10, 7, 8, 6, 9]
    }, {
      name: 'Johnny',
      data: [10, 15, null, 12, null, 10, 12, 15, null, null, 12, null, 14, null, null, null]
    }, {
      name: 'David',
      data: [null, null, null, null, 3, 4, 1, 3, 4, 6, 7, 9, 5, null, null, null]
    }],
    chart: {
      height: 320,
      type: 'line',
      zoom: {
        enabled: false
      },
      animations: {
        enabled: false
      }
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    stroke: {
      width: [3, 3, 2],
      curve: 'straight'
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a"],
    labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', ' 16'],
    title: {
      text: 'Missing data (null values)',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    xaxis: {
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
  }
  data = this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 185, {
    min: 30,
    max: 90
  })
  XAXISRANGE = 777600000
  RealTimeChart: ApexOptions = {
    series: [{
      data: this.data.slice()
    }],
    chart: {
      id: 'dynamic-chart',
      height: 320,
      type: 'line',
      animations: {
        enabled: true,
        dynamicAnimation: {
          speed: 1000
        }
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ["#38cab3"],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    title: {
      text: 'Dynamic Updating Chart',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    markers: {
      size: 0
    },
    xaxis: {
      type: 'datetime',
      range: this.XAXISRANGE,
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
      max: 100,
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
    legend: {
      show: false
    },
  }
  DashedLineChart: ApexOptions = {
    series: [{
      name: "Session Duration",
      data: [45, 52, 38, 24, 33, 26, 21, 20, 6, 8, 15, 10]
    },
    {
      name: "Page Views",
      data: [35, 41, 62, 42, 13, 18, 29, 37, 36, 51, 32, 35]
    },
    {
      name: 'Total Visits',
      data: [87, 57, 74, 99, 75, 38, 62, 47, 82, 56, 45, 47]
    }
    ],
    chart: {
      height: 320,
      type: 'line',
      zoom: {
        enabled: false
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [3, 4, 3],
      curve: 'straight',
      dashArray: [0, 8, 5]
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a"],
    title: {
      text: 'Page Statistics',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    legend: {
      tooltipHoverFormatter: function (val, opts) {
        return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + ''
      }
    },
    markers: {
      size: 0,
      hover: {
        sizeOffset: 6
      }
    },
    xaxis: {
      categories: ['01 Jan', '02 Jan', '03 Jan', '04 Jan', '05 Jan', '06 Jan', '07 Jan', '08 Jan', '09 Jan',
        '10 Jan', '11 Jan', '12 Jan'
      ],
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
    tooltip: {
      y: [
        {
          title: {
            formatter: function (val) {
              return val + " (mins)"
            }
          }
        },
        {
          title: {
            formatter: function (val) {
              return val + " per session"
            }
          }
        },
        {
          title: {
            formatter: function (val) {
              return val;
            }
          }
        }
      ]
    },
    grid: {
      borderColor: '#f1f1f1',
    }
  }
  SyncingCharts1: ApexOptions = {
    series: [{
      data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    chart: {
      id: 'fb',
      group: 'social',
      type: 'line',
      height: 160
    },
    colors: ['#38cab3'],
    stroke: {
      curve: 'straight',
      width: 3,
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
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
    markers: {
      size: [7]
    },
  }
  SyncingCharts2: ApexOptions = {
    series: [{
      data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 20, {
        min: 10,
        max: 30
      })
    }],
    chart: {
      id: 'tw',
      group: 'social',
      type: 'line',
      height: 160
    },
    stroke: {
      curve: 'straight',
      width: 3,
    },
    markers: {
      size: [7]
    },
     colors: ['#4ec2f0'],
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
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
  }
  SyncingCharts3: ApexOptions = {
    series: [{
      data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017').getTime(), 20, {
        min: 10,
        max: 60
      })
    }],
    chart: {
      id: 'yt',
      group: 'social',
      type: 'area',
      height: 160
    },
    markers: {
      size: [7]
    },
    stroke: {
      curve: 'straight',
      width: 3,
    },
    colors: ['#ffbd5a'],
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
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
  }

}


