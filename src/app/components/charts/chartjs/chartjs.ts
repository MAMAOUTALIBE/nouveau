import { Component } from '@angular/core';
import { SpkChartjs } from '../../../@spk/charts/spk-chartjs/spk-chartjs';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
@Component({
  selector: 'app-chartjs',
  imports: [SpkChartjs,BaseChartDirective],
  templateUrl: './chartjs.html',
  styleUrl: './chartjs.scss'
})
export class Chartjs {

  ChartjsLineChart: ChartConfiguration = {
    type: 'line',
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(56, 202, 179)',
        borderColor: 'rgb(56, 202, 179)',
        data: [0, 10, 5, 2, 20, 30, 45],
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },
        x: {
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        }
      }
    }
  };
  ChartjsBarChart: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July',],
      datasets: [{
        label: 'My First Dataset',
        data: [65, 59, 80, 81, 56, 55, 40],
        backgroundColor: [
          'rgba(56, 202, 179, 0.2)',
          'rgba(78, 194, 240, 0.2)',
          'rgba(255, 189, 90, 0.2)',
          'rgba(73, 182, 245, 0.2)',
          'rgba(230, 83, 60, 0.2)',
          'rgba(38, 191, 148, 0.2)',
          'rgba(35, 35, 35, 0.2)'
        ],
        borderColor: [
          'rgb(56, 202, 179)',
          'rgb(78, 194, 240)',
          'rgb(255, 189, 90)',
          'rgb(73, 182, 245)',
          'rgb(230, 83, 60)',
          'rgb(38, 191, 148)',
          'rgb(35, 35, 35)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },
        x: {
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        }
      }
    }
  }
  ChartjsPieChart: ChartConfiguration = {
    type: 'pie',
    data: {
      labels: ['Green', 'Blue', 'Yellow'],
      datasets: [{
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(56, 202, 179)',
          'rgb(78, 194, 240)',
          'rgb(255, 189, 90)'
        ],
        hoverOffset: 4
      }]
    },
    options: {

      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },

    }
  }
  ChartjsDoughnutChart: ChartConfiguration = {
    type: 'doughnut',
    data: {
      labels: ['Green', 'Blue', 'Yellow'],
      datasets: [{
        label: 'My First Dataset',
        data: [300, 50, 100],
        backgroundColor: [
          'rgb(56, 202, 179)',
          'rgb(78, 194, 240)',
          'rgb(255, 189, 90)'
        ],
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          enabled: true,
        },
      },

    }
  }


  ChartjsMixedChart: ChartConfiguration = {
    type: 'bar',
    data: {
      labels: [
        'January',
        'February',
        'March',
        'April'
      ],
      datasets: [{
        type: 'bar',
        label: 'Bar Dataset',
        data: [10, 20, 30, 40],
        borderColor: 'rgb(56, 202, 179)',
        backgroundColor: 'rgba(56, 202, 179, 0.2)'
      }, {
        type: 'line',
        label: 'Line Dataset',
        data: [50, 50, 50, 50],
        fill: false,
        borderColor: 'rgb(78, 194, 240)'
      }]
    }, options: {
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },
        x: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },

      }
    }


  }
  ChartjsPolarChart: ChartConfiguration = {
    type: 'polarArea',
    data: {
      labels: [
        'Green',
        'Blue',
        'Yellow',
        'Red',
        'Grey'
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [11, 16, 7, 3, 14],
        backgroundColor: [
          'rgb(56, 202, 179)',
          'rgb(75, 192, 192)',
          'rgb(255, 189, 90)',
          'rgb(201, 203, 207)',
          'rgb(78, 194, 240)'
        ]
      }]
    },
    options: {
      responsive: true,
      scales: {
        radialLinear: {
          beginAtZero: true,
          grid: {
            color: 'rgba(142, 156, 173,0.1)' // grid circle color
          },
          angleLines: {
            color: 'rgba(142, 156, 173,0.1)' // radial lines color
          },
          pointLabels: {
            color: '#8E9CAD' // labels around the chart
          },
        }
      }


    }
  }
  ChartjsRadialChart: ChartConfiguration = {
    type: 'radar',
    data: {
      labels: [
        'Eating',
        'Drinking',
        'Sleeping',
        'Designing',
        'Coding',
        'Cycling',
        'Running'
      ],
      datasets: [{
        label: 'My First Dataset',
        data: [65, 59, 90, 81, 56, 55, 40],
        fill: true,
        backgroundColor: 'rgba(56, 202, 179, 0.2)',
        borderColor: 'rgb(56, 202, 179)',
        pointBackgroundColor: 'rgb(56, 202, 179)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(56, 202, 179)'
      }, {
        label: 'My Second Dataset',
        data: [28, 48, 40, 19, 96, 27, 100],
        fill: true,
        backgroundColor: 'rgba(78, 194, 240, 0.2)',
        borderColor: 'rgb(78, 194, 240)',
        pointBackgroundColor: 'rgb(78, 194, 240)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(78, 194, 240)'
      }]
    },
    options: {
      responsive: true,
      elements: {
        line: {
          borderWidth: 3
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          grid: {
            color: 'rgba(142, 156, 173,0.1)',
          },
          angleLines: {
            color: 'rgba(142, 156, 173,0.1)',
          },
          ticks: {
            backdropColor: 'rgba(119, 119, 142, 0)',
            color: '#77778e',
          },
        },
      },

    }
  }
  ChartjsScatterChart: ChartConfiguration = {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Scatter Dataset',
        data: [{
          x: -10,
          y: 0
        }, {
          x: 0,
          y: 10
        }, {
          x: 10,
          y: 5
        }, {
          x: 0.5,
          y: 5.5
        }],
        backgroundColor: 'rgb(56, 202, 179)'

      }],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },
        x: {
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        }
      }

    }
  }
  ChartjsBubbleChart: ChartConfiguration = {
    type: 'bubble',
    data: {
      datasets: [{
        label: 'First Dataset',
        data: [{
          x: 20,
          y: 30,
          r: 15
        }, {
          x: 40,
          y: 10,
          r: 10
        }],
        backgroundColor: 'rgb(56, 202, 179)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        },
        x: {
          grid: {
            color: "rgba(142, 156, 173,0.1)"
          }
        }
      }
    }
  }
}


