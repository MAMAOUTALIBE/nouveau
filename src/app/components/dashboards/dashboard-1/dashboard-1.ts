import { Component, computed, signal } from '@angular/core';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { SpkDashboardsCard } from '../../../@spk/spk-dashboards-card/spk-dashboards-card';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { DecimalPipe } from '@angular/common';
import { SpkReusableTables } from '../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";
@Component({
  selector: 'app-dashboard-1',
  imports: [NgApexchartsModule,  SpkDashboardsCard,
    SpkApexcharts, NgCircleProgressModule, DecimalPipe,  SpkReusableTables, SpkDropdowns],
  templateUrl: './dashboard-1.html',
  styleUrl: './dashboard-1.scss'
})

export class Dashboard1 {
  ProjectBudget: ApexOptions =
    {
      series: [{
        name: 'Total Orders',
        data: [44, 42, 57, 86, 58, 55, 70, 43, 23, 54, 77, 34],
      }, {
        name: 'Total Sales',
        data: [34, 22, 37, 56, 21, 35, 60, 34, 56, 78, 89, 53],
      }],
      chart: {
        type: 'bar',
        height: 280
      },
      grid: {
        borderColor: '#f2f6f7',
      },
      colors: ["var(--primary-color)", "#e4e7ed"],
      plotOptions: {
        bar: {
          colors: {
            ranges: [{
              from: -100,
              to: -46,
              color: '#ebeff5'
            }, {
              from: -45,
              to: 0,
              color: '#ebeff5'
            }]
          },
          columnWidth: '40%',
        }
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 4,
        colors: ['transparent']
      },
      legend: {
        show: true,
        position: 'top',
      },
      yaxis: {
        title: {
          text: 'Growth',
          style: {
            color: '#adb5be',
            fontSize: '14px',
            fontFamily: 'poppins, sans-serif',
            fontWeight: 600,
            cssClass: 'apexcharts-yaxis-label',
          },
        },
        labels: {
          formatter: function (y: number) {
            return y.toFixed(0) + "";
          }
        }
      },
      xaxis: {
        type: 'category',
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'sep', 'oct', 'nov', 'dec'],
        axisBorder: {
          show: true,
          color: 'rgba(119, 119, 142, 0.05)',
          offsetX: 0,
          offsetY: 0,
        },
        axisTicks: {
          show: true,
          borderType: 'solid',
          color: 'rgba(119, 119, 142, 0.05)',
          offsetX: 0,
          offsetY: 0
        },
        labels: {
          rotate: -90
        }
      }

    }
  WeeklyVisitors: ApexOptions = {
    series: [{
      name: 'Male',
      data: [51, 44, 55, 42, 58, 50, 62],
    }, {
      name: 'Female',
      data: [56, 58, 38, 50, 64, 45, 55]
    }],
    chart: {
      height: 305,
      type: 'line',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false
      },
      background: 'none',
    },
    fill: {
      colors: ["#fff"]
    },
    grid: {
      borderColor: '#f2f6f7',
    },
    colors: ["var(--primary-color)", "#e4e7ed"],

    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    legend: {
      show: true,
      position: 'top',
    },
    xaxis: {
      type: 'category',
      categories: ["1", "2", "3", "4", "5", "6", "7"],
      axisBorder: {
        show: false,
        color: 'rgba(119, 119, 142, 0.05)',
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: {
        show: false,
        borderType: 'solid',
        color: 'rgba(119, 119, 142, 0.05)',

        offsetX: 0,
        offsetY: 0
      },
      labels: {
        rotate: -90,
      }
    },
    yaxis: {
      show: false,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      }
    },
    tooltip: {
      x: {
        format: 'dd/MM/yy HH:mm'
      },
    },
  }
  cardData = [
    {
      id: 1, title: "Today Orders",
      value: '5,472',
      icon: 'shopping-bag',
      iconBg: 'primary',
      status: 'Last Week',
      sales: '+427',
      Bgcolor: 'primary',
      direction: 'up',
      textcolor: "success"
    },

    {
      id: 2, title: "Today Earnings",
      value: '$7,589',
      icon: 'dollar-sign',
      iconBg: 'info',
      status: 'Last Week',
      sales: '-453',
      Bgcolor: 'info',
      direction: 'down',
      textcolor: "danger"
    },

    {
      id: 3, title: "Profit Gain",
      value: '$8,943',
      icon: 'external-link',
      iconBg: 'secondary',
      status: 'Last Week',
      sales: '+788',
      Bgcolor: 'secondary',
      percentageChange: '11.54%',
      direction: 'up',
      textcolor: "success"
    },

    {
      id: 4, title: "Total Earnings",
      value: '$57.2M',
      icon: 'credit-card',
      iconBg: 'warning',
      status: 'Last Week',
      sales: '-693',
      Bgcolor: 'warning',
      percentageChange: '0.18%',
      direction: 'down',
      textcolor: "danger"
    },
  ]

  userData = [
    { avatar: './assets/images/faces/2.jpg', name: 'Samantha Melon', userId: '#1234', status: 'paid' },
    { avatar: './assets/images/faces/1.jpg', name: 'Allie Grater', userId: '#1234', status: 'pending' },
    { avatar: './assets/images/faces/5.jpg', name: 'Gabe Lackmen', userId: '#1234', status: 'pending' },
    { avatar: './assets/images/faces/7.jpg', name: 'Manuel Labor', userId: '#1234', status: 'paid' },
    { avatar: './assets/images/faces/9.jpg', name: 'Hercules Bing', userId: '#1754', status: 'paid' },
    { avatar: './assets/images/faces/11.jpg', name: 'Manuel Labor', userId: '#1234', status: 'pending' }
  ];

  checkboxItems = [
    { label: 'Accurate information at any given point.', checked: false, badgeText: 'Today', badgeColor: 'primary-transparent' },
    { label: 'Sharing the information with clients or stakeholders.', checked: false, badgeText: 'Today', badgeColor: 'primary-transparent' },
    { label: 'Hearing the information ', checked: false, badgeText: '22 hrs', badgeColor: 'primary-transparent' },
    { label: 'Setting up and customizing your own sales.', checked: false, badgeText: '1 Day', badgeColor: 'light-transparent' },
    { label: 'Complete 360° overview of sales information.', checked: true, badgeText: '2 Days', badgeColor: 'light-transparent' },
    { label: 'New Admin Launched.', checked: true },
    { label: 'To maximize profits and improve productivity.', checked: true },
    { label: 'Increase work state.', checked: true },
  ];

  countries = [
    {
      country: 'India',
      value: '$32,879',
      percentage: '65%',
      trendIcon: 'fe fe-trending-down',
      trendColor: 'text-danger',
      progressBarColor: 'bg-primary',
      progressWidth: '60%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'Russia',
      value: '$22,710',
      percentage: '55%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-info',
      progressBarColor: 'bg-info',
      progressWidth: '50%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'Canada',
      value: '$56,291',
      percentage: '69%',
      trendIcon: 'fe fe-trending-down',
      trendColor: 'text-danger',
      progressBarColor: 'bg-secondary',
      progressWidth: '80%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'Brazil',
      value: '$34,209',
      percentage: '60%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-warning',
      progressWidth: '60%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'United States',
      value: '$45,870',
      percentage: '86%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-danger',
      progressWidth: '80%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'Germany',
      value: '$67,357',
      percentage: '73%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-success',
      progressWidth: '70%',
      progressStriped: 'progress-bar-striped'
    },
    {
      country: 'U.A.E',
      value: '$56,291',
      percentage: '69%',
      trendIcon: 'fe fe-trending-down',
      trendColor: 'text-danger',
      progressBarColor: 'bg-purple',
      progressWidth: '80%',
      progressStriped: 'progress-bar-striped'
    }
  ];

  timelineEvents = [
    { iconClass: 'featured_icon danger', iconState: 'circle', name: 'Anita Letterback', description: 'Lorem ipsum dolor tempor incididunt.', date: '23 Sep, 2021' },
    { iconClass: 'featured_icon success', iconState: 'circle', name: 'Paddy O\'Furniture', description: 'Lorem ipsum dolor tempor incididunt.', date: '16 Aug, 2021' },
    { iconClass: 'featured_icon primary', iconState: 'circle', name: 'Olive Yew', description: 'Lorem ipsum dolor tempor incididunt.', date: '23 Feb, 2021' },
    { iconClass: 'featured_icon warning', iconState: 'circle', name: 'Maureen Biologist', description: 'Lorem ipsum dolor tempor incididunt.', date: '21 June, 2021' },
    { iconClass: 'featured_icon teal', iconState: 'circle', name: 'Peg Legge', description: 'Lorem ipsum dolor tempor incididunt.', date: '04 Aug, 2021' },
    { iconClass: 'featured_icon info', iconState: 'circle', name: 'Letterbac', description: 'Lorem ipsum dolor tempor incididunt.', date: '04 Aug, 2021' },
    { iconClass: 'featured_icon danger', iconState: 'circle', name: 'Anita Letterback', description: 'Lorem ipsum dolor tempor incididunt.', date: '23 Sep, 2021' }
  ];
  radialbarbasic1: ApexOptions = {
    series: [85],
    chart: {
      height: 170,
      width: '100%',
      type: 'radialBar',
      offsetX: 38,
    },
    states: {

      hover: {
        filter: {
          type: 'none',
        }
      },
      active: {
        filter: {
          type: 'none',
        }
      },
    },
    plotOptions: {
      radialBar: {
        offsetY: 20,
        startAngle: 0,
        hollow: {
          margin: 20,
          size: "100%",
          background: "#fff",

        },
        dataLabels: {
          name: {
            show: false,
            fontSize: '12px',

          },
          value: {
            show: true,
            offsetY: 6,
            fontSize: '22px',
          }
        }
      },
    },


    stroke: {
      lineCap: 'round'
    },
    colors: ["#38cab3"],
    labels: [""],
  };

  browsers = [
    { id: 1, name: 'Chrome', company: 'Google, Inc.', icon: './assets/images/svgicons/chrome.svg', count: 35502, trend: 'up', percent: '12.75%' },
    { id: 2, name: 'Edge', company: 'Microsoft Corporation, Inc.', icon: './assets/images/svgicons/edge.svg', count: 25364, trend: 'down', percent: '24.37%' },
    { id: 3, name: 'Firefox', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/firefox.svg', count: 14635, trend: 'up', percent: '15.63%' },
    { id: 4, name: 'Safari', company: 'Apple Corporation, Inc.', icon: './assets/images/svgicons/safari.svg', count: 35657, trend: 'up', percent: '12.54%' },
    { id: 5, name: 'Opera', company: 'Opera, Inc.', icon: './assets/images/svgicons/opera.svg', count: 12563, trend: 'down', percent: '15.12%' }
  ];


  projects = [
    {
      id: 1,
      title: 'Order Picking',
      value: '3,876',
      trend: 'up',
      percent: '03%',
      lastMonthLabel: 'last month',
      daysAgo: '5 days ago'
    },
    {
      id: 2,
      title: 'Storage',
      value: '2,178',
      trend: 'down',
      percent: '16%',
      lastMonthLabel: 'last month',
      daysAgo: '2 days ago'
    },
    {
      id: 3,
      title: 'Shipping',
      value: '1,367',
      trend: 'up',
      percent: '06%',
      lastMonthLabel: 'last month',
      daysAgo: '1 days ago'
    },
    {
      id: 4,
      title: 'Receiving',
      value: '678',
      trend: 'down',
      percent: '25%',
      lastMonthLabel: 'last month',
      daysAgo: '10 days ago'
    },
    {
      id: 5,
      title: 'Review',
      value: '578',
      trend: 'up',
      percent: '55%',
      lastMonthLabel: 'last month',
      daysAgo: '11 days ago'
    },
    {
      id: 6,
      title: 'Profit',
      value: '$27,215',
      trend: 'up',
      percent: '32%',
      lastMonthLabel: 'last month',
      daysAgo: '11 days ago'
    }
  ];
  ProductSummary = {
    colums: [
      { tableHeadColumn: 'text-center', header: 'Purchase Date' },
      { tableHeadColumn: '', header: 'Client Name' },
      { tableHeadColumn: '', header: 'Product ID' },
      { tableHeadColumn: '', header: 'Product' },
      { tableHeadColumn: '', header: 'Product Cost' },
      { tableHeadColumn: '', header: 'Payment Mode' },
      { tableHeadColumn: '', header: 'Status' },
    ],
    rows: [

      { id: '#01', customer: 'Sean Black', productCode: 'PRO12345', productName: 'Mi LED Smart TV 4A 80', price: '$14,500', paymentMode: 'Online Payment', status: 'Delivered', badgeClass: 'bg-success' },
      { id: '#02', customer: 'Evan Rees', productCode: 'PRO8765', productName: 'Thomson R9 122cm (48 inch) Full HD LED TV', price: '$30,000', paymentMode: 'Cash on delivered', status: 'Add Cart', badgeClass: 'bg-primary' },
      { id: '#03', customer: 'David Wallace', productCode: 'PRO54321', productName: 'Vu 80cm (32 inch) HD Ready LED TV', price: '$13,200', paymentMode: 'Online Payment', status: 'Pending', badgeClass: 'bg-orange' },
      { id: '#04', customer: 'Julia Bower', productCode: 'PRO97654', productName: 'Micromax 81cm (32 inch) HD Ready LED TV', price: '$15,100', paymentMode: 'Cash on delivered', status: 'Delivering', badgeClass: 'bg-secondary' },
      { id: '#05', customer: 'Kevin James', productCode: 'PRO4532', productName: 'HP 200 Mouse & Wireless Laptop Keyboard', price: '$5,987', paymentMode: 'Online Payment', status: 'Shipped', badgeClass: 'bg-danger' },
      { id: '#06', customer: 'Theresa Wright', productCode: 'PRO6789', productName: 'Digisol DG-HR3400 Router', price: '$11,987', paymentMode: 'Cash on delivered', status: 'Delivering', badgeClass: 'bg-secondary' }, { id: '#07', customer: 'Sebastian Black', productCode: 'PRO4567', productName: 'Dell WM118 Wireless Optical Mouse', price: '$4,700', paymentMode: 'Online Payment', status: 'Add to Cart', badgeClass: 'bg-info' }, { id: '#08', customer: 'Kevin Glover', productCode: 'PRO32156', productName: 'Dell 16 inch Laptop Backpack', price: '$678', paymentMode: 'Cash On delivered', status: 'Delivered', badgeClass: 'bg-pink' }
    ]
  }
    searchQuery = signal<string>('');

  // 2. Compute filtered rows based on the signal
  filteredRows = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allRows = this.ProductSummary.rows; // Call the signal here

    if (!query) return allRows;

    return allRows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(query)
      )
    );
  });


  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}


