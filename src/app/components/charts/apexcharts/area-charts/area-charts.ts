import { Component, ViewChild, } from '@angular/core';

import { ApexAxisChartSeries, ApexOptions } from 'ng-apexcharts';
import { SpkApexcharts } from '../../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { data, dataSeries, githubData, series } from "./data";
import moment from 'moment';
import ApexCharts from 'apexcharts';

@Component({
  selector: 'app-area-charts',
  imports: [SpkApexcharts],
  templateUrl: './area-charts.html',
  styleUrl: './area-charts.scss'
})
export class AreaCharts {

  @ViewChild(SpkApexcharts) reusableChart!: SpkApexcharts;
  BasicAreaChart: ApexOptions = {
    series: [{
      name: "STOCK ABC",
      data: series.monthDataSeries1.prices
    }],
    chart: {
      type: 'area',
      height: 320,
      zoom: {
        enabled: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight',
    },
    subtitle: {
      text: 'Price Movements',
      align: 'left'
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    labels: series.monthDataSeries1.dates,
    title: {
      text: 'Fundamental Analysis of Stocks',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    colors: ['#38cab3'],
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
      opposite: true,
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
      horizontalAlign: 'left'
    }
  }
  SplineAreaChart: ApexOptions = {
    series: [{
      name: 'series1',
      data: [31, 40, 28, 51, 42, 109, 100]
    }, {
      name: 'series2',
      data: [11, 32, 45, 32, 34, 52, 41]
    }],
    chart: {
      height: 320,
      type: 'area'
    },
    colors: ["#38cab3", "#38cab3"],
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    xaxis: {
      type: 'datetime',
      categories: ["2018-09-19T00:00:00.000Z", "2018-09-19T01:30:00.000Z", "2018-09-19T02:30:00.000Z", "2018-09-19T03:30:00.000Z", "2018-09-19T04:30:00.000Z", "2018-09-19T05:30:00.000Z", "2018-09-19T06:30:00.000Z"],
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
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    },
  }

  AreaChartWithNegativeValues: ApexOptions = {
    series: [{
      name: 'north',
      data: [{
        x: 1996,
        y: 322
      },
      {
        x: 1997,
        y: 324
      },
      {
        x: 1998,
        y: 329
      },
      {
        x: 1999,
        y: 342
      },
      {
        x: 2000,
        y: 348
      },
      {
        x: 2001,
        y: 334
      },
      {
        x: 2002,
        y: 325
      },
      {
        x: 2003,
        y: 316
      },
      {
        x: 2004,
        y: 318
      },
      {
        x: 2005,
        y: 330
      },
      {
        x: 2006,
        y: 355
      },
      {
        x: 2007,
        y: 366
      },
      {
        x: 2008,
        y: 337
      },
      {
        x: 2009,
        y: 352
      },
      {
        x: 2010,
        y: 377
      },
      {
        x: 2011,
        y: 383
      },
      {
        x: 2012,
        y: 344
      },
      {
        x: 2013,
        y: 366
      },
      {
        x: 2014,
        y: 389
      },
      {
        x: 2015,
        y: 334
      }
      ]
    }, {
      name: 'south',
      data: [
        {
          x: 1996,
          y: 162
        },
        {
          x: 1997,
          y: 90
        },
        {
          x: 1998,
          y: 50
        },
        {
          x: 1999,
          y: 77
        },
        {
          x: 2000,
          y: 35
        },
        {
          x: 2001,
          y: -45
        },
        {
          x: 2002,
          y: -88
        },
        {
          x: 2003,
          y: -120
        },
        {
          x: 2004,
          y: -156
        },
        {
          x: 2005,
          y: -123
        },
        {
          x: 2006,
          y: -88
        },
        {
          x: 2007,
          y: -66
        },
        {
          x: 2008,
          y: -45
        },
        {
          x: 2009,
          y: -29
        },
        {
          x: 2010,
          y: -45
        },
        {
          x: 2011,
          y: -88
        },
        {
          x: 2012,
          y: -132
        },
        {
          x: 2013,
          y: -146
        },
        {
          x: 2014,
          y: -169
        },
        {
          x: 2015,
          y: -184
        }
      ]
    }],
    chart: {
      type: 'area',
      height: 355,
      toolbar: {
        show: false
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },

    title: {
      text: 'Area with Negative Values',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      }
    },
    xaxis: {
      type: 'category',
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      },
      labels: {
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    yaxis: {
      tickAmount: 4,
      floating: false,

      labels: {
        style: {
          colors: '#8c9097',
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
        offsetY: -7,
        offsetX: 0,
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false
      }
    },
    colors: ["#38cab3", "#38cab3"],
    fill: {
      opacity: 0.5
    },
    tooltip: {
      x: {
        format: "yyyy",
      },
      fixed: {
        enabled: false,
        position: 'topRight'
      }
    },
    grid: {
      borderColor: '#f2f5f7',
      yaxis: {
        lines: {
          offsetX: -30
        }
      },
      padding: {
        left: 20
      }
    }
  }
  commits = 0;
  SelectionGithubStyleChart1: ApexOptions = {
    series: [{
      name: 'commits',
      data: githubData.series
    }],
    chart: {
      id: 'chartyear',
      type: 'area',
      height: 130,
      toolbar: {
        show: false,
        autoSelected: 'pan'
      },
      events: {
        mounted: (chartContext: any) => {
          this.commits = chartContext.getSeriesTotalXRange(
            chartContext.w.globals.minX,
            chartContext.w.globals.maxX
          );
        },
        updated: (chartContext: any) => {
          this.commits = chartContext.getSeriesTotalXRange(
            chartContext.w.globals.minX,
            chartContext.w.globals.maxX
          );
        }
      }
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    colors: ['#38cab3'],
    stroke: {
      width: 0,
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    yaxis: {
      show: false,
      tickAmount: 3,
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
    }
  }
  SelectionGithubStyleChart2: ApexOptions = {
    series: [{
      name: 'commits',
      data: githubData.series
    }],
    chart: {
      height: 140,
      type: 'area',
      toolbar: {
        autoSelected: 'selection',
      },
      brush: {
        enabled: true,
        target: 'chartyear'
      },
      selection: {
        enabled: true,
        xaxis: {
          min: new Date('26 Jan 2014').getTime(),
          max: new Date('29 Mar 2015').getTime()
        }
      },
    },
    colors: ['#38cab3'],
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    stroke: {
      width: 0,
      curve: 'smooth'
    },
    fill: {
      opacity: 1,
      type: 'solid'
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
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
  }
  public generateDayWiseTimeSeries(baseval: number, count: number, yrange: { min: number; max: number; }) {
    var i = 0;
    var series = [];
    while (i < count) {
      var x = baseval;
      var y =
        Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

      series.push([x, y]);
      baseval += 86400000;
      i++;
    }
    return series;
  };

  StackedAreaChart: ApexOptions = {
    series: [
      {
        name: 'South',
        data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 60
        })
      },
      {
        name: 'North',
        data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 20
        })
      },
      {
        name: 'Central',
        data: this.generateDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 20, {
          min: 10,
          max: 15
        })
      }
    ],
    chart: {
      type: 'area',
      height: 350,
      stacked: true,
      events: {
        selection: function (chart, e) {
          console.log(new Date(e.xaxis.min))
        }
      },
    },
    colors: ['#38cab3', '#38cab3', '#e6eaeb'],
    grid: {
      borderColor: '#f2f5f7',
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth'
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.2,
        opacityTo: 0.6,
      }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    xaxis: {
      type: 'datetime'
    },
  }


  irregularTimeseries: ApexOptions = {
    series: [{
      name: 'PRODUCT A',
      data: []
    }, {
      name: 'PRODUCT B',
      data: []
    }, {
      name: 'PRODUCT C',
      data: []
    }],
    chart: {
      type: 'area',
      stacked: false,
      height: 350,
      zoom: {
        enabled: false
      },
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    markers: {
      size: 0,
    },
    colors: ["#38cab3", "#38cab3", "#ffbd5a"],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100]
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#8e8da4',
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
        offsetX: 0,
        formatter: function (val) {
          return (val / 1000000).toFixed(2);
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false
      },

    },
    xaxis: {
      type: 'datetime',
      tickAmount: 8,
      min: new Date("01/01/2014").getTime(),
      max: new Date("01/20/2014").getTime(),
      labels: {
        rotate: -15,
        rotateAlways: true,
        formatter: function (val, timestamp) {
          // Check if timestamp is valid
          if (timestamp !== undefined && timestamp !== null) {
            return moment(new Date(timestamp)).format("DD MMM YYYY");
          }
          return ''; // Return an empty string if timestamp is undefined or null
        },
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    title: {
      text: 'Irregular Data in Time Series',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    tooltip: {
      shared: true
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      offsetX: -10
    }
  }
  dataSet: [number, number][][] = [[], [], []];
  ts1: number = 1388534400000;
  ts2: number = 1388620800000;
  ts3: number = 1389052800000;
  irregulardata() {
    // Populating dataSet with values for PRODUCT A
    for (let i = 0; i < 12; i++) {
      this.ts1 = this.ts1 + 86400000; // Increment by 1 day
      let innerArr: [number, number] = [this.ts1, dataSeries[2][i].value];
      this.dataSet[0].push(innerArr);
    }

    // Populating dataSet with values for PRODUCT B
    for (let i = 0; i < 18; i++) {
      this.ts2 = this.ts2 + 86400000; // Increment by 1 day
      let innerArr: [number, number] = [this.ts2, dataSeries[1][i].value];
      this.dataSet[1].push(innerArr);
    }

    // Populating dataSet with values for PRODUCT C
    for (let i = 0; i < 12; i++) {
      this.ts3 = this.ts3 + 86400000; // Increment by 1 day
      let innerArr: [number, number] = [this.ts3, dataSeries[0][i].value];
      this.dataSet[2].push(innerArr);
    }

    (this.irregularTimeseries.series as ApexAxisChartSeries)[0].data = this.dataSet[0]; // PRODUCT A
    (this.irregularTimeseries.series as ApexAxisChartSeries)[1].data = this.dataSet[1]; // PRODUCT B
    (this.irregularTimeseries.series as ApexAxisChartSeries)[2].data = this.dataSet[2]; // PRODUCT C
  }

  AreaChartWithNullValues: ApexOptions = {
    series: [{
      name: 'Network',
      data: [{
        x: 'Dec 23 2017',
        y: null
      },
      {
        x: 'Dec 24 2017',
        y: 44
      },
      {
        x: 'Dec 25 2017',
        y: 31
      },
      {
        x: 'Dec 26 2017',
        y: 38
      },
      {
        x: 'Dec 27 2017',
        y: null
      },
      {
        x: 'Dec 28 2017',
        y: 32
      },
      {
        x: 'Dec 29 2017',
        y: 55
      },
      {
        x: 'Dec 30 2017',
        y: 51
      },
      {
        x: 'Dec 31 2017',
        y: 67
      },
      {
        x: 'Jan 01 2018',
        y: 22
      },
      {
        x: 'Jan 02 2018',
        y: 34
      },
      {
        x: 'Jan 03 2018',
        y: null
      },
      {
        x: 'Jan 04 2018',
        y: null
      },
      {
        x: 'Jan 05 2018',
        y: 11
      },
      {
        x: 'Jan 06 2018',
        y: 4
      },
      {
        x: 'Jan 07 2018',
        y: 15,
      },
      {
        x: 'Jan 08 2018',
        y: null
      },
      {
        x: 'Jan 09 2018',
        y: 9
      },
      {
        x: 'Jan 10 2018',
        y: 34
      },
      {
        x: 'Jan 11 2018',
        y: null
      },
      {
        x: 'Jan 12 2018',
        y: null
      },
      {
        x: 'Jan 13 2018',
        y: 13
      },
      {
        x: 'Jan 14 2018',
        y: null
      }
      ],
    }],
    chart: {
      type: 'area',
      height: 320,
      animations: {
        enabled: false
      },
      zoom: {
        enabled: false
      },
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'straight'
    },
    fill: {
      opacity: 0.8,
      type: 'pattern',
      pattern: {
        style: ['verticalLines', 'horizontalLines'],
        width: 5,
        height: 6
      },
    },
    markers: {
      size: 5,
      hover: {
        size: 9
      }
    },
    title: {
      text: 'Network Monitoring',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    colors: ["#38cab3"],
    grid: {
      borderColor: '#f2f5f7',
    },
    tooltip: {
      intersect: true,
      shared: false
    },
    theme: {
      palette: 'palette1'
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    yaxis: {
      title: {
        text: 'Bytes Received',
        style: {
          color: "#8c9097",
        }
      },
      labels: {
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      }
    }
  }
  ngOnInit() {
    this.irregulardata();
  }
  public activeOptionButton = "all";
  updateData(timeline: string) {
    // Use the last timestamp in your actual data array
    const lastDataDate = data[data.length - 1][0];
    let min: number;

    switch (timeline) {
      case '1m':
        min = new Date(lastDataDate).setMonth(new Date(lastDataDate).getMonth() - 1);
        this.activeOptionButton = '1m'
        break;
      case '6m':
        min = new Date(lastDataDate).setMonth(new Date(lastDataDate).getMonth() - 6);
        this.activeOptionButton = '6m'
        break;
      case '1y':
        min = new Date(lastDataDate).setFullYear(new Date(lastDataDate).getFullYear() - 1);
        this.activeOptionButton = '1y'
        break;
      case 'all':
      default: // This makes 'all' the fallback
        min = data[0][0]; // Earliest date in your data
        break;
    }

    ApexCharts.exec('area-datetime', 'zoomX', min, lastDataDate);
  }
  AreaChartDatetimeXAxisChart: ApexOptions = {
    series: [{
      data: data
    }],
    chart: {
      id: 'area-datetime',
      type: 'area',
      height: 310,
      zoom: {
        autoScaleYaxis: true
      }
    },
    colors: ["#38cab3"],
    annotations: {
      yaxis: [{
        y: 30,
        borderColor: '#999',
        label: {
          text: 'Support',
          style: {
            color: "#fff",
            background: '#00E396'
          }
        }
      }],
      xaxis: [{
        x: new Date('14 Nov 2012').getTime(),
        borderColor: '#999',
        label: {
          text: 'Rally',
          style: {
            color: "#fff",
            background: '#775DD0'
          }
        }
      }]
    },
    grid: {
      borderColor: '#f2f5f7',
    },
    dataLabels: {
      enabled: false
    },
    markers: {
      size: 0,
    },
    xaxis: {
      type: 'datetime',
      min: new Date('01 Mar 2012').getTime(),
      tickAmount: 6,
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
    tooltip: {
      x: {
        format: 'dd MMM yyyy'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.9,
        stops: [0, 100]
      }
    },
  }
}


