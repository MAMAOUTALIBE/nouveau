import { Component } from '@angular/core';
import { NgbCarousel, NgbSlide, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkWidgetsMetricCard } from '../../../@spk/widgets/spk-widgets-metric-card/spk-widgets-metric-card';
import { SpkWidgetsSocialCard } from '../../../@spk/widgets/spk-widgets-social-card/spk-widgets-social-card';
import { SpkWidgetsUsersCards } from '../../../@spk/widgets/spk-widgets-users-cards/spk-widgets-users-cards';
import { SpkWidgetsBgCards } from "../../../@spk/widgets/spk-widgets-bg-cards/spk-widgets-bg-cards";
import { SpkWidgetsStatCard } from '../../../@spk/widgets/spk-widgets-stat-card/spk-widgets-stat-card';
import { SpkUserWigetCard } from '../../../@spk/widgets/spk-user-wiget-card/spk-user-wiget-card';
import { SpkWidgetsAnalyticCard } from '../../../@spk/widgets/spk-widgets-analytic-card/spk-widgets-analytic-card';
import { SpkWidgetsSummaryCard } from "../../../@spk/widgets/spk-widgets-summary-card/spk-widgets-summary-card";
import { SpkWidgetsFinanceCard } from "../../../@spk/widgets/spk-widgets-finance-card/spk-widgets-finance-card";
import { SpkReusableTables } from '../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { SpkProgressbar } from "../../../@spk/reusable-ui-elements/spk-progressbar/spk-progressbar";


@Component({
  selector: 'app-widgets',
  imports: [ NgbNavModule, SpkWidgetsMetricCard, SpkWidgetsSocialCard, SpkWidgetsUsersCards, SpkWidgetsBgCards, SpkWidgetsStatCard, SpkUserWigetCard, SpkWidgetsAnalyticCard, SpkWidgetsSummaryCard, SpkWidgetsFinanceCard, NgbCarousel, NgbSlide, SpkReusableTables, SpkProgressbar],
  templateUrl: './widgets.html',
  styleUrl: './widgets.scss'
})
export class Widgets {
  hideNavigationArrows = false;
  hideNavigationIndicators = false;
  cards = [
    {
      title: 'TODAY ORDERS',
      value: '5,74,12',
      lastWeek: 'Last week',
      trendIcon: 'up',
      trendClass: 'text-success',
      trendValue: '+427',
      cardClass: 'bg-primary-gradient shadow-primary box-shadow-primary',
      iconClass: 'shopping-bag'
    },
    {
      title: 'TODAY EARNINGS',
      value: '$47,589',
      lastWeek: 'Last week',
      trendIcon: 'down',
      trendClass: 'text-danger',
      trendValue: '-453',
      cardClass: 'bg-info-gradient shadow-info box-shadow-info',
      iconClass: 'dollar-sign'
    },
    {
      title: 'PROFIT GAIN',
      value: '$8,943',
      lastWeek: 'Last week',
      trendIcon: 'up',
      trendClass: 'text-success',
      trendValue: '+788',
      cardClass: 'bg-success-gradient shadow-success box-shadow-success',
      iconClass: 'external-link'
    },
    {
      title: 'TOTAL EARNINGS',
      value: '5,74.12',
      lastWeek: 'Last week',
      trendIcon: 'down',
      trendClass: 'text-danger',
      trendValue: '-693',
      cardClass: 'bg-warning-gradient shadow-warning box-shadow-warning',
      iconClass: 'credit-card'
    }
  ];

  metrics = [
    { icon: 'fe fe-share', title: 'Total Shares', value: 678, badgeClass: 'bg-success', badgeValue: '+89%', subtitle: 'From previous month' },
    { icon: 'fe fe-message-square', title: 'Total Comments', value: 493, badgeClass: 'bg-success', badgeValue: '+76%', subtitle: 'From previous month' },
    { icon: 'fe fe-thumbs-up', title: 'Total Likes', value: 3287, badgeClass: 'bg-success', badgeValue: '+18%', subtitle: 'From previous month' },
    { icon: 'fe fe-eye', title: 'Total Views', value: 279, badgeClass: 'bg-success', badgeValue: '+5%', subtitle: 'From previous month' }
  ];

  usercards = [
    {
      title: 'App Views',
      value: '19.89K',
      change: '(+25%)',
      changeClass: 'text-success',
      iconClass: 'fe fe-eye project bg-primary-transparent text-primary',
      progressClass: 'bg-primary',
      progressWidth: 'wd-80',
      monthly: '60%'
    },
    {
      title: 'New Users',
      value: '692',
      change: '(+15%)',
      changeClass: 'text-success',
      iconClass: 'fe fe-users project bg-pink-transparent text-pink',
      progressClass: 'bg-secondary',
      progressWidth: 'wd-50',
      monthly: '50%'
    },
    {
      title: 'Churned Users',
      value: '286',
      change: '(+08%)',
      changeClass: 'text-success',
      iconClass: 'ti-pulse project bg-warning-transparent text-warning',
      progressClass: 'bg-danger',
      progressWidth: 'wd-30',
      monthly: '30%'
    },
    {
      title: 'Total Revenue',
      value: '$2.98M',
      change: '(+35%)',
      changeClass: 'text-success',
      iconClass: 'ti-bar-chart-alt project bg-success-transparent text-success',
      progressClass: 'bg-success',
      progressWidth: 'wd-25',
      monthly: '25%'
    }
  ];
  bgcards = [
    { title: 'Members', value: '600', icon: 'fe fe-users', gradient: 'bg-primary-gradient' },
    { title: 'Sales', value: '854', icon: 'fe fe-shopping-cart', gradient: 'bg-danger-gradient' },
    { title: 'Profits', value: '98K', icon: 'fe fe-bar-chart-2', gradient: 'bg-success-gradient' },
    { title: 'Taxes', value: '876', icon: 'fe fe-pie-chart', gradient: 'bg-warning-gradient' }
  ];

  salesprofitCards = [
    {
      title: 'Sales',
      today: '3,256',
      week: '25,321',
      month: '53,625',
      progress: 50,
      progressClass: 'primary',
      progressWidth: '50%'
    },
    {
      title: 'Profit',
      today: '236 ',
      week: '1,365 ',
      month: '36,254 ',
      progress: 36,
      progressClass: 'warning',
      progressWidth: '36%'
    },
  ]
  statcards = [
    { title: 'Services', value: '$124', icon: 'si si-basket-loaded', footerIcon: 'si si-arrow-down-circle', footerText: 'Daily Orders', footerColor: 'text-warning' },
    { title: 'Sources', value: '$124', icon: 'si si-credit-card', footerIcon: 'si si-arrow-up-circle', footerText: 'Less Sales', footerColor: 'text-success' },
    { title: 'Income', value: '21%', icon: 'si si-chart', footerIcon: 'si si-exclamation', footerText: 'From Last Month', footerColor: 'text-info' },
    { title: 'Followers', value: '24K', icon: 'si si-social-facebook', footerIcon: 'si si-check', footerText: 'Recent History', footerColor: 'text-primary' }
  ];
  users = [
    { name: 'Frost Williams', role: 'Founder & CEO', image: './assets/images/faces/17.jpg', headerColor: 'bg-primary', stats: [{ value: '3,200', label: 'SALES' }, { value: '13,000', label: 'FOLLOWERS' }, { value: '35', label: 'PRODUCTS' }] },
    { name: 'Kennedy trox', role: 'Founder & CEO', image: './assets/images/faces/12.jpg', headerColor: 'bg-danger', stats: [{ value: '3,200', label: 'SALES' }, { value: '13,000', label: 'FOLLOWERS' }, { value: '35', label: 'PRODUCTS' }] },
    { name: 'Alexander Pierce', role: 'Founder & CEO', image: './assets/images/faces/5.jpg', headerColor: 'bg-success', stats: [{ value: '3,200', label: 'SALES' }, { value: '13,000', label: 'FOLLOWERS' }, { value: '35', label: 'PRODUCTS' }] }
  ];

  analaticcards = [
    { title: 'Real time users', value: '154', change: '(+0.98%)', changeColor: 'text-success', description: 'Overview of Last month', chartBg: 'bg-primary-transparent', chartIcon: 'typcn typcn-group-outline', chartColor: 'text-primary', progressColor: 'bg-primary', progressWidth: 'wd-70p', progressLabel: '70%' },
    { title: 'Total visits', value: '5274', change: '(-12.45%)', changeColor: 'text-danger', description: 'Overview of Last month', chartBg: 'bg-pink-transparent', chartIcon: 'typcn typcn-chart-line-outline', chartColor: 'text-pink', progressColor: 'bg-pink', progressWidth: 'wd-50p', progressLabel: '50%' },
    { title: 'Bounce Rate', value: '76.3%', change: '(+13.52%)', changeColor: 'text-success', description: 'Overview of Last month', chartBg: 'bg-teal-transparent', chartIcon: 'typcn typcn-chart-bar-outline', chartColor: 'text-teal', progressColor: 'bg-teal', progressWidth: 'wd-60p', progressLabel: '60%' },
    { title: 'Visits Duration', value: '5m 24s', change: '(+19.5%)', changeColor: 'text-success', description: 'Overview of Last month', chartBg: 'bg-purple-transparent', chartIcon: 'typcn typcn-time', chartColor: 'text-purple', progressColor: 'bg-purple', progressWidth: 'wd-40p', progressLabel: '40%' }
  ];

  SummaryCard = [
    { title: 'New users', value: '3,672', icon: 'mdi mdi-account-multiple', iconColor: 'text-primary', shadowColor: 'text-primary-shadow', subtitle: 'Monthly users', footerValue: '50%' },
    { title: 'Total Tax', value: '$89,265', icon: 'mdi mdi-cube', iconColor: 'text-success', shadowColor: 'text-success-shadow', subtitle: 'Monthly Income', footerValue: '$7,893' },
    { title: 'Total Profit', value: '$23,987', icon: 'mdi mdi-poll-box', iconColor: 'text-warning', shadowColor: 'text-warning-shadow', subtitle: 'Monthly Profit', footerValue: '$4,678' },
    { title: 'Total Sales', value: '46,486', icon: 'mdi mdi-cart-outline', iconColor: 'text-danger', shadowColor: 'text-danger-shadow', subtitle: 'Monthly Sales', footerValue: '3,756' }
  ];

  FinanceCard = [
    { title: 'Total Revenue', value: '$125.465', icon: 'ti-bar-chart', iconColor: 'text-primary', bgColor: 'bg-primary-transparent' },
    { title: 'Marketing Spend', value: '$75.045', icon: 'ti-pie-chart', iconColor: 'text-pink', bgColor: 'bg-pink-transparent' },
    { title: 'Total Profit', value: '$46.352', icon: 'ti-pulse', iconColor: 'text-teal', bgColor: 'bg-teal-transparent' },
    { title: 'Total Investment', value: '62%', icon: 'ti-stats-up', iconColor: 'text-success', bgColor: 'bg-success-transparent' }
  ];

  timelineItems = [
    {
      status: 'danger',
      date: '23 Sep, 2021',
      name: 'Anita Letterback',
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      status: 'success',
      date: '16 Aug, 2021',
      name: "Paddy O'Furniture",
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      status: 'primary',
      date: '23 Feb, 2021',
      name: 'Olive Yew',
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      status: 'warning',
      date: '21 June, 2021',
      name: 'Maureen Biologist',
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      status: 'teal',
      date: '04 Aug, 2021',
      name: 'Peg Legge',
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
      status: 'info',
      date: '24 Sep, 2021',
      name: 'Ivana B. Withew',
      description: 'Lorem ipsum dolor tempor incididunt ut labore et dolore magna aliqua.'
    }
  ];


  activities = [
    {
      name: 'Lilly',
      section: 'Website',
      avatar: './assets/images/faces/5.jpg',
      statusColor: 'bg-green',
      message: 'Awesome websites!',
      time: '2 hours ago'
    },
    {
      name: 'Thomos',
      section: 'Material',
      avatar: './assets/images/faces/1.jpg',
      statusColor: 'bg-green',
      message: 'Awesome websites!',
      time: '3 hours ago'
    },
    {
      name: 'Marry cott',
      section: 'Photo',
      avatar: './assets/images/faces/14.jpg',
      statusColor: 'bg-green',
      message: "That's Great!",
      time: '1 hours ago'
    },
    {
      name: 'Thomos',
      section: 'Material',
      avatar: './assets/images/faces/1.jpg',
      statusColor: 'bg-green',
      message: 'Awesome websites!',
      time: '3 hours ago'
    },
    {
      name: 'John',
      section: 'Status',
      avatar: './assets/images/faces/4.jpg',
      statusColor: 'bg-green',
      message: 'Awesome websites!',
      time: '1 hours ago'
    }
  ];
  VisitorCard = [
    { title: 'All Visitors', total: '31,648', progressColor: 'bg-primary-gradient', progressWidth: 'wd-90p', male: '32,730', female: '42,948' },
    { title: 'New Visitors', total: '64,858', progressColor: 'bg-danger-gradient', progressWidth: 'wd-75p', male: '20,818', female: '17,350' },
    { title: 'Returning Visitors', total: '80,115', progressColor: 'bg-warning-gradient', progressWidth: 'wd-85', male: '29,350', female: '10,718' }
  ];
  ratings = [
    { rank: 1, icon: 'ion ion-md-star', progressWidth: 'wd-20p', progressColor: 'bg-danger', value: 7 },
    { rank: 2, icon: 'ion ion-md-star', progressWidth: 'wd-30p', progressColor: 'bg-primary', value: 27 },
    { rank: 3, icon: 'ion ion-md-star', progressWidth: 'wd-60p', progressColor: 'bg-warning', value: 64 },
    { rank: 4, icon: 'ion ion-md-star', progressWidth: 'wd-70p', progressColor: 'bg-teal', value: 93 },
    { rank: 5, icon: 'ion ion-md-star', progressWidth: 'wd-80p', progressColor: 'bg-success', value: 82 }
  ];
  orders = [
    { name: 'Lottie Arnold', productId: '#PRD-10250', avatar: './assets/images/faces/3.jpg', thumbs: ['./assets/images/ecommerce/17.jpg', './assets/images/ecommerce/22.jpg'] },
    { name: 'Alan Macedo', productId: '#PRD-10251', avatar: './assets/images/faces/9.jpg', thumbs: ['./assets/images/ecommerce/18.jpg', './assets/images/ecommerce/19.jpg'] },
    { name: 'Bruce Tran', productId: '#PRD-10252', avatar: './assets/images/faces/5.jpg', thumbs: ['./assets/images/ecommerce/20.jpg', './assets/images/ecommerce/21.jpg'] },
    { name: 'Alan Macedo', productId: '#PRD-10251', avatar: './assets/images/faces/9.jpg', thumbs: ['./assets/images/ecommerce/18.jpg', './assets/images/ecommerce/19.jpg'] },
    { name: 'Mina Harper', productId: '#PRD-10253', avatar: './assets/images/faces/12.jpg', thumbs: ['./assets/images/ecommerce/22.jpg', './assets/images/ecommerce/23.jpg'] }
  ];
  LatestTask = {
    today: [
      { title: 'XML Import & Export', time: '12:00 PM', lineColor: 'primary', checked: true },
      { title: 'Database Optimization', time: '02:13 PM', lineColor: 'pink', checked: false, id: 'flexCheckChecked2' },
      { title: 'Create Wireframes', time: '06:20 PM', lineColor: 'success', checked: false, id: 'flexCheckChecked3' },
      { title: 'Develop MVP', time: '10:00 PM', lineColor: 'warning', checked: false, id: 'flexCheckChecked4' },
      { title: 'Design Ecommerce', time: '10:00 PM', lineColor: 'teal', checked: false, id: 'flexCheckChecked5' }
    ],

    week: [
      { title: 'Management meeting', time: '06:30 AM', lineColor: 'teal', checked: false },
      { title: 'Connect API to pages', time: '08:00 AM', lineColor: 'danger', checked: false },
      { title: 'Icon change in Redesign App', time: '11:20 AM', lineColor: 'purple', checked: false },
      { title: 'Test new features in tablets', time: '02:00 PM', lineColor: 'warning', checked: false },
      { title: 'Design Logo', time: '04:00 PM', lineColor: 'success', checked: false }

    ],
    month: [
      { title: 'Design a Landing Page', time: '06:12 AM', lineColor: 'info', checked: false },
      { title: 'Food Delivery Application', time: '03:00 PM', lineColor: 'danger', checked: false },
      { title: 'Export Database values', time: '03:20 PM', lineColor: 'warning', checked: false },
      { title: 'Write Simple Python Script', time: '04:00 PM', lineColor: 'pink', checked: false },
      { title: 'Write Simple Program', time: '05:00 PM', lineColor: 'success', checked: false }
    ]
  }
  reviews = [
    { name: 'Joanne Scott', avatar: './assets/images/faces/5.jpg', comment: 'long established fact..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half'] },
    { name: 'Cristobal Sharp', avatar: './assets/images/faces/9.jpg', comment: 'The point of using Lorem..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half', 'ion ion-md-star-outline'] },
    { name: 'Velma Wellons', avatar: './assets/images/faces/4.jpg', comment: 'Various versions have..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half'] },
    { name: 'Cathie Madonna', avatar: './assets/images/faces/7.jpg', comment: 'long established fact..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half', 'ion ion-md-star-outline'] },
    { name: 'Aurelio Dahmer', avatar: './assets/images/faces/12.jpg', comment: 'Ut enim ad minim veniam..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half'] },
    { name: 'Cyrus Macarthur', avatar: './assets/images/faces/13.jpg', comment: 'variations of passages..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half', 'ion ion-md-star-outline'] },
    { name: 'Bernardo Sykes', avatar: './assets/images/faces/2.jpg', comment: 'you are going to use..', reviewsCount: '5 reviews', stars: ['ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star', 'ion ion-md-star-half', 'ion ion-md-star-outline'] }
  ];
  countries = [
    { rank: 1, name: 'United States', amount: '$273.12', percent: '(2.17%)', progressWidth: 'wd-60p', progressColor: 'bg-primary' },
    { rank: 2, name: 'United Kingdom', amount: '$423.10', percent: '(12.43%)', progressWidth: 'wd-70p', progressColor: 'bg-info' },
    { rank: 3, name: 'Australia', amount: '$547.18', percent: '(3.14%)', progressWidth: 'wd-60p', progressColor: 'bg-danger' },
    { rank: 4, name: 'Canada', amount: '$728.32', percent: '(7.23%)', progressWidth: 'wd-50p', progressColor: 'bg-warning' },
    { rank: 5, name: 'Russia', amount: '$843.19', percent: '(1.83%)', progressWidth: 'wd-40p', progressColor: 'bg-success' },
    { rank: 6, name: 'Japan', amount: '$562.19', percent: '(1.35%)', progressWidth: 'wd-60p', progressColor: 'bg-purple' }

  ];


  browsers = [
    { name: 'Chrome', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/chrome.svg', users: '35,502', trend: '12.75%', trendColor: 'text-success fs-15', trendIcon: 'fe fe-arrow-up' },
    { name: 'Opera', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/opera.svg', users: '12,563', trend: '15.12%', trendColor: 'text-danger', trendIcon: 'fe fe-arrow-down' },
    { name: 'Edge', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/edge.svg', users: '25,364', trend: '24.37%', trendColor: 'text-success', trendIcon: 'fe fe-arrow-up' },
    { name: 'Firefox', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/firefox.svg', users: '14,635', trend: '15.63%', trendColor: 'text-success', trendIcon: 'fe fe-arrow-up' },
    { name: 'Ucbrowser', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/uc-browser.svg', users: '15,453', trend: '23.70%', trendColor: 'text-danger', trendIcon: 'fe fe-arrow-down' },
    { name: 'Safari', company: 'Mozilla Foundation, Inc.', icon: './assets/images/svgicons/safari.svg', users: '35,657', trend: '12.54%', trendColor: 'text-danger', trendIcon: 'fe fe-arrow-down' }];
}


