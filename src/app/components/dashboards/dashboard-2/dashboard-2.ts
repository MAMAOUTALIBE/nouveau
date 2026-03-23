import { Component, computed, signal } from '@angular/core';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { SpkApexcharts } from '../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { SpkReusableTables } from "../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables";
import { SpkDropdowns } from "../../../@spk/reusable-ui-elements/spk-dropdowns/spk-dropdowns";


@Component({
  selector: 'app-dashboard-2',
  imports: [NgApexchartsModule, SpkApexcharts, SpkReusableTables, SpkDropdowns],
  templateUrl: './dashboard-2.html',
  styleUrl: './dashboard-2.scss'
})
export class Dashboard2 {
  SalesActivity: ApexOptions = {
    series: [{
      name: "Sales",
      data: [32, 15, 63, 51, 136, 62, 99, 42, 178, 76, 32, 180]
    }],
    chart: {
      height: 260,
      type: 'line',
      zoom: {
        enabled: false
      },
      dropShadow: {
        enabled: true,
        enabledOnSeries: undefined,
        top: 5,
        left: 0,
        blur: 3,
        color: '#000',
        opacity: 0.1
      },
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      offsetX: -15,
      fontWeight: "bold",
    },
    stroke: {
      curve: 'smooth',

    },
    grid: {
      borderColor: '#f2f6f7',
    },
    colors: ["var(--primary-color)"],
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
                offsetX: 10,
        formatter: function (y: Number) {
          return y.toFixed(0) + "";
        }
      }
    },
    xaxis: {
      type: 'category',
      categories: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
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
  weeklyBudget: ApexOptions = {
    series: [{
      name: 'This Week',
      data: [44, 42, 57, 86, 58, 55, 70],
    }, {
      name: 'Last Week',
      data: [-34, -22, -37, -56, -21, -35, -60],
    }],
    chart: {
      stacked: true,
      type: 'bar',
      height: 280,
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
      categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'sat'],
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
      height: 260,
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
  weeklyVisitors1: ApexOptions = {
    series: [{
      name: 'Male',
      data: [51, 44, 55, 42, 58, 50, 62],
    }, {
      name: 'Female',
      data: [56, 58, 38, 50, 64, 45, 55]
    }],
    chart: {
      height: 260,
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
      curve: 'straight',
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
  };

  userData = [
    { avatar: './assets/images/faces/2.jpg', name: 'Samantha Melon', userId: '#1234', status: 'paid', textcolor: 'dark' },
    { avatar: './assets/images/faces/1.jpg', name: 'Allie Grater', userId: '#1234', status: 'pending', textcolor: 'dark' },
    { avatar: './assets/images/faces/5.jpg', name: 'Gabe Lackmen', userId: '#1234', status: 'pending', textcolor: 'dark' },
    { avatar: './assets/images/faces/7.jpg', name: 'Manuel Labor', userId: '#1234', status: 'paid', textcolor: 'dark' },
  ];

  cardData = [
    {
      id: 1, title: "Today Orders",
      value: '5,472',
      icon: 'shopping-bag',
      iconBg: 'primary',
      sales: '0.11%',
      Bgcolor: 'primary',
      direction: 'up',
      textcolor: "success",
      customcardClass:''
    },

    {
      id: 2,
      title: "Today Earnings",
      value: '$47,589',
      icon: 'dollar-sign',
      iconBg: 'warning',
      sales: '0.23%',
      Bgcolor: 'danger',
      direction: 'up',
      textcolor: "danger",
      customcardClass:'custom-dashboard2'
    },

    {
      id: 3, title: "Profit Gain",
      value: '$8,943',
      icon: 'external-link',
      iconBg: 'secondary',
      sales: '1.57%',
      Bgcolor: 'success',
      direction: 'up',
      textcolor: "success",
      customcardClass:''
    },

    {
      id: 4, title: "Total Earnings",
      value: '$57.12M',
      icon: 'credit-card',
      iconBg: 'info',
      sales: '0.45%',
      Bgcolor: 'success',
      direction: 'up',
      textcolor: "success",
      customcardClass:''
    },
  ]

  checkboxItems = [
    { label: 'Accurate information at any given point.', checked: false, badgeText: 'Today', badgeColor: 'primary-transparent' },
    { label: 'Sharing the information with clients or stakeholders.', checked: false, badgeText: 'Today', badgeColor: 'primary-transparent' },
    { label: 'Hearing the information and responding. ', checked: false, badgeText: '22 hrs', badgeColor: 'primary-transparent' },
    { label: 'Setting up and customizing your own sales.', checked: false, badgeText: '1 Day', badgeColor: 'light-transparent' },
    { label: 'Complete 360° overview of sales information.', checked: true, badgeText: '2 Days', badgeColor: 'light-transparent' },
    { label: 'New Admin Launched.', checked: true },
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
      progreClass: 'progress-style',
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
      progreClass: 'progress-style',
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
      progreClass: 'progress-style',
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
      progreClass: 'progress-style',
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
      progreClass: 'progress-style',
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
      progreClass: 'progress-style',
      progressStriped: ''
    },
  ];

  timelineEvents = [
    { iconClass: 'featured_icon1 danger', iconState: '', name: 'Anita Letterback', description: 'Lorem ipsum dolor tempor incididunt.', date: '11.43 pm' },
    { iconClass: 'featured_icon1 success', iconState: '', name: 'Paddy O\'Furniture', description: 'Lorem ipsum dolor tempor incididunt.', date: '12.22 am' },
    { iconClass: 'featured_icon1 primary', iconState: '', name: 'Olive Yew', description: 'Lorem ipsum dolor tempor incididunt.', date: '08.11 pm' },
    { iconClass: 'featured_icon1 warning', iconState: '', name: 'Maureen Biologist', description: 'Lorem ipsum dolor tempor incididunt.', date: '9.45 pm' },
    { iconClass: 'featured_icon1 teal', iconState: '', name: 'Peg Legge', description: 'Lorem ipsum dolor tempor incididunt.', date: '12.09 am' },
    { iconClass: 'featured_icon1 info', iconState: '', name: 'Letterbac', description: 'Lorem ipsum dolor tempor incididunt.', date: '05.28 pm' },
    { iconClass: 'featured_icon1 danger', iconState: '', name: 'Anita Letterback', description: 'Lorem ipsum dolor tempor incididunt.', date: '9.10 pm' }
  ];

  RecentTransactions = [
    { name: 'montha.K', date: '24-08-2021', amount: '$256,347', status: 'Processing', icon: 'fe fe-chevrons-right', bgClass: 'bg-primary-transparent', textClass: 'text-primary', amountClass: 'text-success' },
    { name: 'Allies Grater', date: '31-12-2021', amount: '$12,345', icon: 'fe fe-bookmark', bgClass: 'bg-secondary-transparent', textClass: 'text-secondary', amountClass: 'text-danger' },
    { name: 'Gabel', date: '15-09-2021', amount: '$34,567', status: 'Processing', icon: 'fe fe-more-horizontal', bgClass: 'bg-info-transparent', textClass: 'text-info', amountClass: 'text-success' },
    { name: 'Emmanuel', date: '30-11-2021', amount: '$16,746', status: 'Processing', icon: 'fe fe-chevrons-right', bgClass: 'bg-success-transparent', textClass: 'text-success', amountClass: 'text-danger' },
    { name: 'Manuel Labor', date: '20-10-2021', amount: '$45,900', icon: 'fe fe-file-text', bgClass: 'bg-warning-transparent', textClass: 'text-warning', amountClass: 'text-success' }
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
    rows: signal([

      { id: '#01', customer: 'Sean Black', productCode: 'PRO12345', productName: 'Mi LED Smart TV 4A 80', price: '$14,500', paymentMode: 'Online Payment', status: 'Delivered', badgeClass: 'bg-success' },
      { id: '#02', customer: 'Evan Rees', productCode: 'PRO8765', productName: 'Thomson R9 122cm (48 inch) Full HD LED TV', price: '$30,000', paymentMode: 'Cash on delivered', status: 'Add Cart', badgeClass: 'bg-primary' },
      { id: '#03', customer: 'David Wallace', productCode: 'PRO54321', productName: 'Vu 80cm (32 inch) HD Ready LED TV', price: '$13,200', paymentMode: 'Online Payment', status: 'Pending', badgeClass: 'bg-orange' },
      { id: '#04', customer: 'Julia Bower', productCode: 'PRO97654', productName: 'Micromax 81cm (32 inch) HD Ready LED TV', price: '$15,100', paymentMode: 'Cash on delivered', status: 'Delivering', badgeClass: 'bg-secondary' },
      { id: '#05', customer: 'Kevin James', productCode: 'PRO4532', productName: 'HP 200 Mouse & Wireless Laptop Keyboard', price: '$5,987', paymentMode: 'Online Payment', status: 'Shipped', badgeClass: 'bg-danger' },
      { id: '#06', customer: 'Theresa Wright', productCode: 'PRO6789', productName: 'Digisol DG-HR3400 Router', price: '$11,987', paymentMode: 'Cash on delivered', status: 'Delivering', badgeClass: 'bg-secondary' }, { id: '#07', customer: 'Sebastian Black', productCode: 'PRO4567', productName: 'Dell WM118 Wireless Optical Mouse', price: '$4,700', paymentMode: 'Online Payment', status: 'Add to Cart', badgeClass: 'bg-info' }, { id: '#08', customer: 'Kevin Glover', productCode: 'PRO32156', productName: 'Dell 16 inch Laptop Backpack', price: '$678', paymentMode: 'Cash On delivered', status: 'Delivered', badgeClass: 'bg-pink' }
    ])
  }
  searchQuery = signal<string>('');

  // 2. Compute filtered rows based on the signal
  filteredRows = computed(() => {
    const query = this.searchQuery().toLowerCase();
    const allRows = this.ProductSummary.rows(); // Call the signal here

    if (!query) return allRows;

    return allRows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(query)
      )
    );
  });

  // 3. Delete functionality
  deleteOrder(id: string) { // Changed to string because your IDs are '#01', etc.

      this.ProductSummary.rows.update(rows => rows.filter(row => row.id !== id));

  }

  onSearch(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}


