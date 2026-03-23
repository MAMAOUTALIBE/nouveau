import { Component, computed, signal } from '@angular/core';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { SpkReusableTables } from "../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables";
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";



@Component({
  selector: 'app-dashboard-3',
  imports: [NgApexchartsModule, SpkApexcharts, SpkReusableTables, SpkDropdowns],
  templateUrl: './dashboard-3.html',
  styleUrl: './dashboard-3.scss'
})
export class Dashboard3 {

  ProjectBudget: ApexOptions = {
    series: [{
      name: 'active',
      data: [44, 42, 57, 86, 58, 55, 70, 43, 23, 54, 77, 34],
    }, {
      name: 'inactive',
      data: [-34, -22, -37, -56, -21, -35, -60, -34, -56, -78, -89, -53],
    }],
    chart: {
      stacked: true,
      type: 'bar',
      height: 345,
    },
    grid: {
      borderColor: '#f2f6f7',
    },
    colors: ["var(--primary-color)", "#e4e7ed"],
    plotOptions: {
      bar: {
        borderRadius: 5,
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
        columnWidth: '25%',
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all'
      }
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: true,
      position: 'top',
    },
    yaxis: {

      title: {
        text: 'Growth',
        style: {
          color: '	#adb5be',
          fontSize: '14px',
          fontFamily: 'poppins, sans-serif',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      },
      labels: {
        offsetX: 10,
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
      data: [44, 42, 57, 86, 58, 55, 70],
      // color:['#766df9']
    }, {
      name: 'Female',
      data: [34, 22, 47, 56, 21, 35, 60],
      // color:['#ebeff5']
    }
    ],
    chart: {
      type: 'bar',
      stacked: true,
      height: 338,
    },
    grid: {
      borderColor: '#eff2f6',
    },
    colors: ["var(--primary-color)", "#e4e7ed"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
      },
    },

    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    states: {
      hover: {
        filter: {
          type: 'none'
        }
      }
    },
    yaxis: {
      title: {
        style: {
          color: '	#adb5be',
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
      categories: ['Mon', 'Tue', 'Web', 'Thu', 'Fri', 'Sat', 'Sun'],
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
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: "top"
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
      value: '$47,589',
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
      value: '$57.12M',
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
    { label: 'Sharing the information with clients.', checked: false, badgeText: 'Today', badgeColor: 'primary-transparent' },
    { label: 'Hearing the information ', checked: false, badgeText: '22 hrs', badgeColor: 'primary-transparent' },
    { label: 'Setting up and customizing your own sales.', checked: false, badgeText: '1 Day', badgeColor: 'light-transparent' },
    { label: 'Complete 360° overview of sales information.', checked: true, badgeText: '2 Days', badgeColor: 'light-transparent' },
    { label: 'New Admin Launched.', checked: true },
    { label: 'To maximize profits and improve productivity.', checked: true },
    { label: 'Increase work state.', checked: true },
    { label: ' Setting up and customizing your own sales. ', checked: false }
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
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'Russia',
      value: '$22,710',
      percentage: '55%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-info',
      progressBarColor: 'bg-info',
      progressWidth: '50%',
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'Canada',
      value: '$56,291',
      percentage: '69%',
      trendIcon: 'fe fe-trending-down',
      trendColor: 'text-danger',
      progressBarColor: 'bg-secondary',
      progressWidth: '80%',
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'U.K',
      value: '$67,357',
      percentage: '73%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-success',
      progressWidth: '70%',
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'Brazil',
      value: '$34,209',
      percentage: '60%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-warning',
      progressWidth: '60%',
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'United States',
      value: '$45,870',
      percentage: '86%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-danger',
      progressWidth: '80%',
      progreClass: '',
      progressStriped: ''
    },
    {
      country: 'Germany',
      value: '$67,357',
      percentage: '73%',
      trendIcon: 'fe fe-trending-up',
      trendColor: 'text-success',
      progressBarColor: 'bg-success',
      progressWidth: '70%',
      progreClass: '',
      progressStriped: ''
    },

    {
      country: 'U.A.E',
      value: '$56,291',
      percentage: '69%',
      trendIcon: 'fe fe-trending-down',
      trendColor: 'text-danger',
      progressBarColor: 'bg-purple',
      progressWidth: '80%',
      progreClass: '',
      progressStriped: ''
    }
  ];

  timelineEvents = [
    { iconClass: 'featured_icon1', iconState: '', name: 'Anita Letterback', description: 'Lorem ipsum dolor tempor incididunt.', date: '23 Sep, 2021' },
    { iconClass: 'featured_icon1', iconState: '', name: 'Paddy O\'Furniture', description: 'Lorem ipsum dolor tempor incididunt.', date: '16 Aug, 2021' },
    { iconClass: 'featured_icon1', iconState: '', name: 'Olive Yew', description: 'Lorem ipsum dolor tempor incididunt.', date: '23 Feb, 2021' },
    { iconClass: 'featured_icon1', iconState: '', name: 'Maureen Biologist', description: 'Lorem ipsum dolor tempor incididunt.', date: '21 June, 2021' },
    { iconClass: 'featured_icon1', iconState: '', name: 'Peg Legge', description: 'Lorem ipsum dolor tempor incididunt.', date: '04 Aug, 2021' },
    { iconClass: 'featured_icon1', iconState: '', name: 'Neetato', description: 'Lorem ipsum dolor tempor incididunt.', date: '01 Jan, 2022' },
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


