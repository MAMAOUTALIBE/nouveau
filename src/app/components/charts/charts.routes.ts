import { Routes } from '@angular/router';

export const chartsRoutingModule: Routes = [
  {
    path: 'charts', children: [

      {
        path: 'chartjs',
        loadComponent: () => import('./chartjs/chartjs').then((m) => m.Chartjs),
        title: 'Nowa - CHART JS Charts',
        data: { parentTitle: 'charts', subParentTitle: '', childTitle: 'CHART JS ' }
      },
      {
        path: 'echart',
        loadComponent: () => import('./echarts/echarts').then((m) => m.Echarts),
        title: 'Nowa - EChart Charts',
        data: { parentTitle: 'charts', subParentTitle: '', childTitle: 'EChart Charts' }

      },

    ]
  }
];
