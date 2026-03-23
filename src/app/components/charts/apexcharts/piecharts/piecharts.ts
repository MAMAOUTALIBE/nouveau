import { Component } from '@angular/core';
import { SpkApexcharts } from '../../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { ApexOptions } from 'ng-apexcharts';


@Component({
  selector: 'app-piecharts',
  imports: [SpkApexcharts],
  templateUrl: './piecharts.html',
  styleUrl: './piecharts.scss'
})
export class Piecharts {


  BasicPieChart: ApexOptions = {
    series: [44, 55, 13, 43, 22],
    chart: {
      height: 300,
      type: 'pie',
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a", "#4ec2f0", "#f34343"],
    labels: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
    legend: {
      position: "bottom"
    },
    dataLabels: {
      dropShadow: {
        enabled: false
      }
    },
  }
  SimpleDonutChart: ApexOptions = {
    series: [44, 55, 41, 17, 15],
    chart: {
      type: 'donut',
      height: 290
    },
    legend: {
      position: 'bottom'
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a", "#4ec2f0", "#f34343"],
    dataLabels: {
      dropShadow: {
        enabled: false
      }
    },
  }
  UpdatingDonutChart: ApexOptions = {
    series: [44, 55, 13, 33] as number[],
    chart: {
      type: "donut",
      height: 280,
    },
    dataLabels: {
      enabled: false
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 260
          },
          legend: {
            show: false
          },

        }
      },

    ],
    legend: {
      show: true,
      position: 'bottom',
    }
  }

  // Keep a copy of the initial series for reset
  defaultSeries: number[] = [...(this.UpdatingDonutChart.series as number[])];

  // Method to append random data
  appendData() {
    const newSeries = [...(this.UpdatingDonutChart.series as number[])];
    newSeries.push(Math.floor(Math.random() * 100) + 1);
    this.UpdatingDonutChart = {
      ...this.UpdatingDonutChart,
      series: newSeries,
    };
  }

  // Method to remove last data point
  removeData() {
    const newSeries = [...(this.UpdatingDonutChart.series as number[])];
    if (newSeries.length > 0) {
      newSeries.pop();
      this.UpdatingDonutChart = {
        ...this.UpdatingDonutChart,
        series: newSeries
      };
    }
  }


  // Method to randomize data points
  randomize() {
    const newSeries = this.UpdatingDonutChart.series!.map(() =>
      Math.floor(Math.random() * 100) + 1
    );
    this.UpdatingDonutChart = {
      ...this.UpdatingDonutChart,
      series: newSeries,
    };
  }

  // Method to reset to initial data
  reset() {
    this.UpdatingDonutChart = {
      ...this.UpdatingDonutChart,
      series: [...this.defaultSeries],
    };
  }

  MonochromePieChart: ApexOptions = {
    series: [25, 15, 44, 55, 41, 17],
    chart: {
      height: '280',
      type: 'pie',
    },
    labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    theme: {
      monochrome: {
        enabled: true,
        color: "#38cab3",
      }
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -5
        }
      }
    },
    title: {
      text: 'Monochrome Pie',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    dataLabels: {
      formatter: (val: string | number | number[], opts: { seriesIndex: number; w: any }): string | string[] => {
        // pick off the numeric value
        let num: number;
        if (Array.isArray(val)) {
          num = val[0];
        } else if (typeof val === 'string') {
          num = parseFloat(val);
        } else {
          num = val;
        }

        // get your series name
        const name = opts.w.globals.labels[opts.seriesIndex];
        // return [label, formattedValue]
        return [name, num.toFixed(1) + '%'];
      },
      dropShadow: {
        enabled: false
      }
    },
    legend: {
      show: false
    }
  }
  GradientDonutChart: ApexOptions = {
    series: [44, 55, 41, 17, 15],
    chart: {
      height: 300,
      type: 'donut',
    },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 270
      }
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
    },
    legend: {
      position: 'bottom',
      formatter: function (val: string, opts: {
        series: number[][],
        seriesIndex: number,
        dataPointIndex: number,
        w: {
          globals: {
            series: (string | number)[][]
          }
        }
      }
      ) {
        return val + " - " + opts.w.globals.series[opts.seriesIndex]
      }
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a", "#4ec2f0", "#f34343"],
    title: {
      text: 'Gradient Donut with custom Start-angle',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },

  }
  DonutChartWithPatterns: ApexOptions = {
    series: [44, 55, 41, 17, 15],
    chart: {
      height: 250,
      type: 'donut',
      dropShadow: {
        enabled: true,
        color: '#111',
        top: -1,
        left: 3,
        blur: 3,
        opacity: 0.2
      }
    },
    stroke: {
      width: 0,
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              showAlways: true,
              show: true
            }
          }
        }
      }
    },
    colors: ["#38cab3", "#4ec2f0", "#ffbd5a", "#4ec2f0", "#f34343"],
    labels: ["Comedy", "Action", "SciFi", "Drama", "Horror"],
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#111']
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderWidth: 0
      }
    },
    fill: {
      type: 'pattern',
      opacity: 1,
      pattern: {

        style: ['verticalLines', 'squares', 'horizontalLines', 'circles', 'slantedLines'],
      },
    },

    theme: {
      palette: 'palette2'
    },
    title: {
      text: 'Favourite Movie Type',
      align: 'left',
      style: {
        fontSize: '13px',
        fontWeight: 'bold',
        color: '#8c9097'
      },
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  }
  ImageFilledPieChart: ApexOptions = {
    series: [44, 33, 54, 45],
    chart: {
      height: 300,
      type: 'pie',
    },
    colors: ['#93C3EE', '#E5C6A0', '#669DB5', '#94A74A'],
    fill: {
      type: 'image',
      opacity: 0.85,
      image: {
        src: ['./assets/images/media/media-21.jpg', './assets/images/media/media-21.jpg', './assets/images/media/media-21.jpg', './assets/images/media/media-21.jpg'],
        width: 25,
      },
    },
    stroke: {
      width: 4
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#111']
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderWidth: 0
      }
    },
    legend: {
      position: 'bottom'
    },
  }
}


