
import { Routes } from '@angular/router';

export const apexchartsRoutingModule: Routes = [
  {
    path: 'charts/apex-charts', children: [
      {
        path: 'line-charts',
        loadComponent: () => import('./line-charts/line-charts').then((m) => m.LineCharts),
        title: 'Nowa - Line Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX Line CHARTS' }
      },
      {
        path: 'area-charts',
        loadComponent: () => import('./area-charts/area-charts').then((m) => m.AreaCharts),
        title: 'Nowa - Area Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX AREA CHARTS' }
      },
      {
        path: 'bar-charts',
        loadComponent: () => import('./bar-charts/bar-charts').then((m) => m.BarCharts),
        title: 'Nowa - Bar Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX BAR CHARTS' }
      }, {
        path: 'column-charts',
        loadComponent: () => import('./column-charts/column-charts').then((m) => m.ColumnCharts),
        title: 'Nowa - Column Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX COLUMN CHARTS' }
      }, {
        path: 'mixedcharts',
        loadComponent: () => import('./mixedcharts/mixedcharts').then((m) => m.Mixedcharts),
        title: 'Nowa -  MIxed Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX MIXD CHARTS' }
      }, {
        path: 'rangeareacharts',
        loadComponent: () => import('./rangeareacharts/rangeareacharts').then((m) => m.Rangeareacharts),
        title: 'Nowa - Range Area Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX RANGE AREA CHARTS' }
      }, {
        path: 'timelinecharts',
        loadComponent: () => import('./timelinecharts/timelinecharts').then((m) => m.Timelinecharts),
        title: 'Nowa - Timeline Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX TIMELINE CHARTS' }
      }, {
        path: 'candlestickcharts',
        loadComponent: () => import('./candlestickcharts/candlestickcharts').then((m) => m.Candlestickcharts),
        title: 'Nowa - CandleStick Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX CANDLESTICK CHARTS' }
      }, {
        path: 'boxplotcharts',
        loadComponent: () => import('./boxplotcharts/boxplotcharts').then((m) => m.Boxplotcharts),
        title: 'Nowa - Box Plot Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX BOXPLOT CHARTS' }
      },
      {
        path: 'bubblecharts',
        loadComponent: () => import('./bubblecharts/bubblecharts').then((m) => m.Bubblecharts),
        title: 'Nowa - Bubble Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX BUBBLE CHARTS' }
      }, {
        path: 'scattercharts',
        loadComponent: () => import('./scattercharts/scattercharts').then((m) => m.Scattercharts),
        title: 'Nowa - Scatter Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX SCATTER CHARTS' }
      }, {
        path: 'heatmapcharts',
        loadComponent: () => import('./heatmapcharts/heatmapcharts').then((m) => m.Heatmapcharts),
        title: 'Nowa - HeatMap Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX HEATMAP CHARTS' }
      }, {
        path: 'treemapcharts',
        loadComponent: () => import('./treemapcharts/treemapcharts').then((m) => m.Treemapcharts),
        title: 'Nowa - Treemap Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX TREEMAP CHARTS' }
      }, {
        path: 'piecharts',
        loadComponent: () => import('./piecharts/piecharts').then((m) => m.Piecharts),
        title: 'Nowa - Pie Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX PIE CHARTS' }
      }, {
        path: 'radialbarcharts',
        loadComponent: () => import('./radialbarcharts/radialbarcharts').then((m) => m.Radialbarcharts),
        title: 'Nowa - RadialBar Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX RADIALBAR CHARTS' }
      }, {
        path: 'radarcharts',
        loadComponent: () => import('./radarcharts/radarcharts').then((m) => m.Radarcharts),
        title: 'Nowa - Radar Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX RADAR CHARTS' }
      },
      {
        path: 'polarareacharts',
        loadComponent: () => import('./polarareacharts/polarareacharts').then((m) => m.Polarareacharts),
        title: 'Nowa - Polar Area Charts',
        data: { parentTitle: 'charts', subParentTitle: 'Apex Charts', childTitle: 'APEX POLAR AREA CHARTS' }
      },

    ]
  }
];
