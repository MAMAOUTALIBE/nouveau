import { Component } from '@angular/core';
import * as prism from "../../../shared/data/prism/tables"
import { SpkReusableTables } from "../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables";
import { ShowcodeCard } from "../../../shared/components/showcode-card/showcode-card";
@Component({
  selector: 'app-tables',
  imports: [ SpkReusableTables, ShowcodeCard],
  templateUrl: './tables.html',
  styleUrl: './tables.scss'
})
export class Tables {
  prismData = prism;
  BasicTables = {
    columns:
      [
        { key: 'name', header: 'Name' },
        { key: 'createdOn', header: 'Created On' },
        { key: 'number', header: 'Number' },
        { key: 'status', header: 'Status' },
      ],
    rows: [
      { name: 'Mark', createdOn: '21, Dec 2021', number: '+1234-12340', status: { label: 'Completed', badgeClass: 'bg-outline-primary' }, },
      { name: 'Monika', createdOn: '29, April 2022', number: '+1523-12459', status: { label: 'Failed', badgeClass: 'bg-outline-warning' }, },
      { name: 'Madina', createdOn: '30, Nov 2022', number: '+1982-16234', status: { label: 'Successful', badgeClass: 'bg-outline-success' }, },
      { name: 'Bhamako', createdOn: '18, Mar 2022', number: '+1526-10729', status: { label: 'Pending', badgeClass: 'bg-outline-secondary' }, },
    ]
  };

  BorderTables = {
    columns: [
      { key: 'user', header: 'User' },
      { key: 'status', header: 'Status' },
      { key: 'email', header: 'Email' },
      { key: 'action', header: 'Action' },],
    rows: [
      { user: { name: 'Sukuro Kim', avatar: './assets/images/faces/13.jpg', onlineClass: 'online', }, status: { label: 'Active', badgeClass: 'bg-success-transparent' }, email: 'kimosukuro@gmail.com', },
      { user: { name: 'Hasimna', avatar: './assets/images/faces/6.jpg', onlineClass: 'offline', }, status: { label: 'Inactive', badgeClass: 'bg-light text-dark' }, email: 'hasimna2132@gmail.com', },
      { user: { name: 'Azimo Khan', avatar: './assets/images/faces/15.jpg', onlineClass: 'online', }, status: { label: 'Active', badgeClass: 'bg-success-transparent' }, email: 'azimokhan421@gmail.com', },
      { user: { name: 'Samantha Julia', avatar: './assets/images/faces/5.jpg', onlineClass: 'online', }, status: { label: 'Active', badgeClass: 'bg-success-transparent' }, email: 'julianasams143@gmail.com', },
    ],
  };
  BorderedPrimary = {
    columns: [
      { key: 'order', header: 'Order' },
      { key: 'date', header: 'Date' },
      { key: 'customer', header: 'Customer' },
      { key: 'action', header: 'Action' },
    ],
    rows: [
      { order: '#0007', date: { label: '26-04-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Mayor Kelly', avatar: './assets/images/faces/3.jpg', onlineClass: 'online', }, action: { label: 'Booked', badgeClass: 'bg-primary-transparent' }, },
      { order: '#0008', date: { label: '15-02-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Wicky Kross', avatar: './assets/images/faces/6.jpg', onlineClass: 'online', }, action: { label: 'Booked', badgeClass: 'bg-primary-transparent' }, },
      { order: '#0009', date: { label: '23-05-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Julia Cam', avatar: './assets/images/faces/1.jpg', onlineClass: 'online', }, action: { label: 'Booked', badgeClass: 'bg-primary-transparent' }, },
    ],
  };

  BorderedSecondary = {
    columns: [{ key: 'order', header: 'Order' }, { key: 'date', header: 'Date' }, { key: 'customer', header: 'Customer' }, { key: 'status', header: 'Status' },], rows: [{ order: '#0011', date: { label: '07-01-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Helsenky', avatar: './assets/images/faces/10.jpg', onlineClass: 'online', }, status: { label: 'Delivered', badgeClass: 'bg-success-transparent' }, }, { order: '#0012', date: { label: '18-05-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Brodus', avatar: './assets/images/faces/14.jpg', onlineClass: 'online', }, status: { label: 'Delivered', badgeClass: 'bg-success-transparent' }, }, { order: '#0013', date: { label: '19-03-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Chikka Alen', avatar: './assets/images/faces/12.jpg', onlineClass: 'online', }, status: { label: 'Delivered', badgeClass: 'bg-success-transparent' }, },],
  }

  Borderwarning = {
    columns: [
      { key: 'order', header: 'Order' },
      { key: 'date', header: 'Date' }, { key: 'customer', header: 'Customer' },
      { key: 'action', header: 'Action' },],
    rows: [

      { order: '#0014', date: { label: '21-02-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Sukuro Kim', avatar: './assets/images/faces/13.jpg', onlineClass: 'online', }, action: { label: 'Accepted', badgeClass: 'bg-warning-transparent' }, },
      { order: '#0018', date: { label: '26-03-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Alex Carey', avatar: './assets/images/faces/11.jpg', onlineClass: 'online', }, action: { label: 'Accepted', badgeClass: 'bg-warning-transparent' }, },
      { order: '#0020', date: { label: '14-03-2022', badgeClass: 'bg-light text-dark' }, customer: { name: 'Pamila Anderson', avatar: './assets/images/faces/2.jpg', onlineClass: 'online', }, action: { label: 'Accepted', badgeClass: 'bg-warning-transparent' }, },

    ],
  }


  TableWithoutBorders = {
    columns: [
      { key: 'userName', header: 'User Name' },
      { key: 'transactionId', header: 'Transaction Id' },
      { key: 'created', header: 'Created' },
      { key: 'status', header: 'Status' },],
    rows: [
      { userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Fixed', badgeClass: 'bg-primary' }, },
      { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'In Progress', badgeClass: 'bg-warning' }, },
      { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Completed', badgeClass: 'bg-success' }, },
      { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Pending', badgeClass: 'bg-danger' }, },],
  };
  TableGroupDividers = {
    columns: [
      { key: 'product', header: 'Product' },
      { key: 'seller', header: 'Seller' },
      { key: 'salePercentage', header: 'Sale Percentage' },
      { key: 'quantitySold', header: 'Quantity Sold' },],
    rows: [
      { product: 'Smart Watch', seller: 'Slowtrack.inc', salePercentage: { value: '24.23%', class: 'text-success', icon: 'ri-arrow-up-fill' }, quantitySold: '250/1786', },
      { product: 'White Sneakers', seller: 'American & Co.inc', salePercentage: { value: '12.45%', class: 'text-danger', icon: 'ri-arrow-down-fill' }, quantitySold: '123/985', },
      { product: 'Baseball Bat', seller: 'Sports Company', salePercentage: { value: '06.64%', class: 'text-success', icon: 'ri-arrow-up-fill' }, quantitySold: '124/232', },
      { product: 'Black Hoodie', seller: 'Renonds Fabrics', salePercentage: { value: '14.42%', class: 'text-success', icon: 'ri-arrow-up-fill' }, quantitySold: '192/2456', },],
  };
  StripedTables = {
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'date', header: 'Date' },
      { key: 'customer', header: 'Customer' },
      { key: 'action', header: 'Action' },],
    rows: [
      { id: '2022R-01', date: '27-10-2022', customer: 'Moracco', action: 'Download', },
      { id: '2022R-02', date: '28-10-2022', customer: 'Thornton', action: 'Download', },
      { id: '2022R-03', date: '22-10-2022', customer: 'Larry Bird', action: 'Download', },
      { id: '2022R-04', date: '29-09-2022', customer: 'Erica Sean', action: 'Download', },],
  };
  StripedColumnsTables = {
    columns: [
      { key: 'id', header: 'ID' },
      { key: 'date', header: 'Date' },
      { key: 'customer', header: 'Customer' },
      { key: 'action', header: 'Action' },],
    rows: [

      { id: '2022R-01', date: '27-10-2022', customer: 'Moracco', action: { label: 'Delete', btnClass: 'btn btn-sm btn-danger btn-wave', icon: 'ri-delete-bin-line' }, },
      { id: '2022R-02', date: '28-10-2022', customer: 'Thornton', action: { label: 'Delete', btnClass: 'btn btn-sm btn-danger btn-wave', icon: 'ri-delete-bin-line' }, },
      { id: '2022R-03', date: '22-10-2022', customer: 'Larry Bird', action: { label: 'Delete', btnClass: 'btn btn-sm btn-danger btn-wave', icon: 'ri-delete-bin-line' }, },
      { id: '2022R-04', date: '29-09-2022', customer: 'Erica Sean', action: { label: 'Delete', btnClass: 'btn btn-sm btn-danger btn-wave', icon: 'ri-delete-bin-line' }, },],
  };
  PrimaryTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };


  SecondaryTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };
  WarningTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };
  DangerTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };


  DarkTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };




  SuccessTables = {
    columns: [
      { key: 'id', header: '#' },
      { key: 'first', header: 'First' },
      { key: 'last', header: 'Last' },
      { key: 'handle', header: 'Handle' },],
    rows: [
      { id: '1', first: 'Mark', last: 'Otto', handle: '@mdo' },
      { id: '2', first: 'Jacob', last: 'Thornton', handle: '@fat' },
      { id: '3', first: 'Larry the Bird', last: 'Thornton', handle: '@twitter' },],
  };


  HoverTables = {

    columns: [
      { key: 'manager', header: 'Product Manager' },
      { key: 'category', header: 'Category' },
      { key: 'team', header: 'Team' },
      { key: 'status', header: 'Status' },],
    rows: [
      { manager: { name: 'Joanna Smith', email: 'joannasmith14@gmail.com', avatar: './assets/images/faces/10.jpg', }, category: { label: 'Fashion', badgeClass: 'bg-primary-transparent' }, team: ['./assets/images/faces/2.jpg', './assets/images/faces/8.jpg', './assets/images/faces/2.jpg',], teamExtra: '+5', status: { progress: 52, barClass: 'bg-primary' }, },
      { manager: { name: 'Kara Kova', email: 'milesakara@gmail.com', avatar: './assets/images/faces/2.jpg', }, category: { label: 'Clothing', badgeClass: 'bg-warning-transparent' }, team: ['./assets/images/faces/4.jpg', './assets/images/faces/6.jpg',], teamExtra: '+6', status: { progress: 40, barClass: 'bg-primary' }, },
      { manager: { name: 'Donald Trimb', email: 'donaldo21@gmail.com', avatar: './assets/images/faces/16.jpg', }, category: { label: 'Electronics', badgeClass: 'bg-dark-transparent' }, team: ['./assets/images/faces/1.jpg', './assets/images/faces/11.jpg', './assets/images/faces/15.jpg',], teamExtra: '+2', status: { progress: 17, barClass: 'bg-primary' }, },
      { manager: { name: 'Justin Gaethje', email: 'justingae@gmail.com', avatar: './assets/images/faces/13.jpg', }, category: { label: 'Sports', badgeClass: 'bg-danger-transparent' }, team: ['./assets/images/faces/4.jpg', './assets/images/faces/6.jpg',], teamExtra: '+5', status: { progress: 72, barClass: 'bg-primary' }, },
    ],
  }
  HoverStripedTables = {
    columns: [
      { key: 'invoice', header: 'Invoice' },
      { key: 'customer', header: 'Customer' },
      { key: 'status', header: 'Status' },
      { key: 'date', header: 'Date' },],
    rows: [
      { invoice: 'IN-2032', customer: { name: 'Mark Cruise', email: 'markcruise24@gmail.com', avatar: './assets/images/faces/15.jpg', }, status: { label: 'Paid', badgeClass: 'bg-success-transparent', icon: 'ri-check-fill' }, date: 'Jul 26,2022', },
      { invoice: 'IN-2022', customer: { name: 'Charanjeep', email: 'charanjeep@gmail.in', avatar: './assets/images/faces/12.jpg', }, status: { label: 'Paid', badgeClass: 'bg-success-transparent', icon: 'ri-check-fill' }, date: 'Mar 14,2022', },
      { invoice: 'IN-2014', customer: { name: 'Samantha Julie', email: 'julie453@gmail.com', avatar: './assets/images/faces/5.jpg', }, status: { label: 'Cancelled', badgeClass: 'bg-danger-transparent', icon: 'ri-close-fill' }, date: 'Feb 1,2022', },
      { invoice: 'IN-2036', customer: { name: 'Simon Cohen', email: 'simon@gmail.com', avatar: './assets/images/faces/11.jpg', }, status: { label: 'Refunded', badgeClass: 'bg-light text-dark', icon: 'ri-reply-line' }, date: 'Apr 24,2022', },
    ],
  };


  PrimaryHeadTables = { columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', actions: [{ icon: 'ri-download-2-line', btnClass: 'btn-success-transparent' }, { icon: 'ri-edit-line', btnClass: 'btn-info-transparent' }, { icon: 'ri-delete-bin-line', btnClass: 'btn-danger-transparent' },], }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', actions: [{ icon: 'ri-download-2-line', btnClass: 'btn-success-transparent' }, { icon: 'ri-edit-line', btnClass: 'btn-info-transparent' }, { icon: 'ri-delete-bin-line', btnClass: 'btn-danger-transparent' },], }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', actions: [{ icon: 'ri-download-2-line', btnClass: 'btn-success-transparent' }, { icon: 'ri-edit-line', btnClass: 'btn-info-transparent' }, { icon: 'ri-delete-bin-line', btnClass: 'btn-danger-transparent' },], }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', actions: [{ icon: 'ri-download-2-line', btnClass: 'btn-success-transparent' }, { icon: 'ri-edit-line', btnClass: 'btn-info-transparent' }, { icon: 'ri-delete-bin-line', btnClass: 'btn-danger-transparent' },], },], };
  WarningHeadTables = {
    columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Rejected', btnClass: 'btn btn-sm btn-danger-light' }, }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Processed', btnClass: 'btn btn-sm btn-success-light' }, },],
  }

  SuccessHeadTables = { columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Rejected', btnClass: 'btn btn-sm btn-danger-light' }, }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Processed', btnClass: 'btn btn-sm btn-success-light' }, },], };

  InfoHeadTables = { columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Rejected', btnClass: 'btn btn-sm btn-danger-light' }, }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Processed', btnClass: 'btn btn-sm btn-success-light' }, },], };
  SecondaryHeadTables = { columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Rejected', btnClass: 'btn btn-sm btn-danger-light' }, }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Processed', btnClass: 'btn btn-sm btn-success-light' }, },], };
  DangerHeadTables = { columns: [{ key: 'userName', header: 'User Name' }, { key: 'transactionId', header: 'Transaction Id' }, { key: 'created', header: 'Created' }, { key: 'status', header: 'Status' },], rows: [{ userName: 'Harshrath', transactionId: '#5182-3467', created: '24 May 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Zozo Hadid', transactionId: '#5182-3412', created: '02 July 2022', status: { label: 'Pending', btnClass: 'btn btn-sm btn-primary-light' }, }, { userName: 'Martiana', transactionId: '#5182-3423', created: '15 April 2022', status: { label: 'Rejected', btnClass: 'btn btn-sm btn-danger-light' }, }, { userName: 'Alex Carey', transactionId: '#5182-3456', created: '17 March 2022', status: { label: 'Processed', btnClass: 'btn btn-sm btn-success-light' }, },], };
  FootTables = { columns: [{ key: 'sno', header: 'S.No' }, { key: 'team', header: 'Team' }, { key: 'matchesWon', header: 'Matches Won' }, { key: 'winRatio', header: 'Win Ratio' },], rows: [{ sno: '01', team: 'Manchester', matchesWon: 232, winRatio: '42%' }, { sno: '02', team: 'Barcelona', matchesWon: 175, winRatio: '58%' }, { sno: '03', team: 'Portugal', matchesWon: 126, winRatio: '32%' },], footer: { sno: 'Total', team: 'United States', matchesWon: 558, winRatio: '56%' }, };
  CaptionTables = { caption: 'Top IT Companies', columns: [{ key: 'sno', header: 'S.No' }, { key: 'name', header: 'Name' }, { key: 'revenue', header: 'Revenue' }, { key: 'country', header: 'Country' },], rows: [{ sno: '1', name: 'Microsoft', revenue: '$170 billion', country: 'United States' }, { sno: '2', name: 'HP', revenue: '$72 billion', country: 'United States' }, { sno: '3', name: 'IBM', revenue: '$60 billion', country: 'United States' },], };


  CaptionTopTables = {
    caption: 'Top IT Companies',
    columns: [
      { key: 'sno', header: 'S.No' },
      { key: 'name', header: 'Name' },
      { key: 'revenue', header: 'Revenue' },
      { key: 'country', header: 'Country' },
    ],
    rows: [
      { sno: '1', name: 'Microsoft', revenue: '$170 billion', country: 'United States' },
      { sno: '2', name: 'HP', revenue: '$72 billion', country: 'United States' },
      { sno: '3', name: 'IBM', revenue: '$60 billion', country: 'United States' },
    ],
  };

  TopITCompanies = { columns: [{ key: 'sNo', header: 'S.No' }, { key: 'name', header: 'Name' }, { key: 'revenue', header: 'Revenue' }, { key: 'country', header: 'Country' }], rows: [{ sNo: 1, name: 'Microsoft', revenue: '$170 billion', country: 'United States' }, { sNo: 2, name: 'HP', revenue: '$72 billion', country: 'United States' }, { sNo: 3, name: 'IBM', revenue: '$60 billion', country: 'United States' }] };
  ActiveTables = {
    columns: [
      { key: 'name', header: 'Name' },
      { key: 'createdOn', header: 'Created On' },
      { key: 'number', header: 'Number' },
      { key: 'status', header: 'Status' }
    ],
    rows: [
      {
        name: 'Mark',
        createdOn: '21,Dec 2021',
        number: '+1234-12340',
        status: { label: 'Completed', badgeClass: 'badge bg-primary' },
        rowClass: 'table-active'
      },
      {
        name: 'Monika',
        createdOn: '29,April 2022',
        number: '+1523-12459',
        status: { label: 'Failed', badgeClass: 'badge bg-warning' }
      },
      {
        name: 'Madina',
        createdOn: '30,Nov 2022',
        number: '+1982-16234',
        status: { label: 'Successful', badgeClass: 'badge bg-success' },
        numberClass: 'table-active'
      },
      {
        name: 'Bhamako',
        createdOn: '18,Mar 2022',
        number: '+1526-10729',
        status: { label: 'Pending', badgeClass: 'badge bg-secondary' }
      }
    ]
  };
  SmallTables = {
    columns: [
      { key: 'invoice', header: 'Invoice' },
      { key: 'createdDate', header: 'Created Date' },
      { key: 'status', header: 'Status' },
      { key: 'action', header: 'Action' }
    ],
    rows: [
      {
        invoice: { id: 'checkebox-sm', label: 'Zelensky', checked: true },
        createdDate: '25-Apr-2021',
        status: { label: 'Paid', badgeClass: 'badge bg-success-transparent' },
        actions: ['download', 'edit']
      },
      {
        invoice: { id: 'checkebox-sm1', label: 'Kim Jong', checked: false },
        createdDate: '29-April-2022',
        status: { label: 'Pending', badgeClass: 'badge bg-danger-transparent' },
        actions: ['download', 'edit']
      },
      {
        invoice: { id: 'checkebox-sm2', label: 'Obana', checked: false },
        createdDate: '30-Nov-2022',
        status: { label: 'Paid', badgeClass: 'badge bg-success-transparent' },
        actions: ['download', 'edit']
      },
      {
        invoice: { id: 'checkebox-sm3', label: 'Sean Paul', checked: false },
        createdDate: '01-Jan-2022',
        status: { label: 'Paid', badgeClass: 'badge bg-success-transparent' },
        actions: ['download', 'edit']
      },
      {
        invoice: { id: 'checkebox-sm4', label: 'Karizma', checked: false },
        createdDate: '14-Feb-2022',
        status: { label: 'Pending', badgeClass: 'badge bg-danger-transparent' },
        actions: ['download', 'edit']
      }
    ]
  };


  ColorVariantTables = {
    columns: [
      { key: 'color', header: 'Color' },
      { key: 'client', header: 'Client' },
      { key: 'state', header: 'State' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'totalPrice', header: 'Total Price' }
    ],
    rows: [
      {
        color: 'Default',
        client: 'Rita Book',
        state: { label: 'Processed', badgeClass: 'badge bg-primary-transparent' },
        quantity: 22,
        totalPrice: '$2,012'
      },
      {
        rowClass: 'table-primary',
        color: 'Primary',
        client: 'Rhoda Report',
        state: { label: 'Processed', badgeClass: 'badge bg-primary' },
        quantity: 22,
        totalPrice: '$4,254'
      },
      {
        rowClass: 'table-secondary',
        color: 'Secondary',
        client: 'Rita Book',
        state: { label: 'Processed', badgeClass: 'badge bg-secondary' },
        quantity: 26,
        totalPrice: '$1,234'
      },
      {
        rowClass: 'table-success',
        color: 'Success',
        client: 'Anne Teak',
        state: { label: 'Processed', badgeClass: 'badge bg-success' },
        quantity: 42,
        totalPrice: '$2,623'
      },
      {
        rowClass: 'table-danger',
        color: 'Danger',
        client: 'Dee End',
        state: { label: 'Processed', badgeClass: 'badge bg-danger' },
        quantity: 52,
        totalPrice: '$32,132'
      },
      {
        rowClass: 'table-warning',
        color: 'Warning',
        client: 'Lee Nonmi',
        state: { label: 'Processed', badgeClass: 'badge bg-warning' },
        quantity: 10,
        totalPrice: '$1,434'
      },
      {
        rowClass: 'table-info',
        color: 'Info',
        client: 'Lynne Gwistic',
        state: { label: 'Processed', badgeClass: 'badge bg-info' },
        quantity: 63,
        totalPrice: '$1,854'
      },
      {
        rowClass: 'table-light',
        color: 'Light',
        client: 'Fran Tick',
        state: { label: 'Processed', badgeClass: 'badge bg-light text-dark' },
        quantity: 5,
        totalPrice: '$823'
      },
      {
        rowClass: 'table-dark',
        color: 'Dark',
        client: 'Polly Pipe',
        state: { label: 'Processed', badgeClass: 'badge bg-dark text-white' },
        quantity: 35,
        totalPrice: '$1,832'
      }
    ]
  };
NestedTables = {
  columns: [
    { key: 'id', header: '#' },
    { key: 'first', header: 'First' },
    { key: 'last', header: 'Last' },
    { key: 'handle', header: 'Handle' }
  ],
  rows: [
    {
      id: 1,
      first: 'Mark',
      last: 'Otto',
      handle: '@mdo'
    },
    {
      // Nested child table
      children: {
        columns: [
          { key: 'alphabet', header: 'Alphabets' },
          { key: 'user', header: 'Users' },
          { key: 'email', header: 'Email' }
        ],
        rows: [
          { alphabet: 'A', user: 'Dino King', email: 'dinoking231@gmail.com' },
          { alphabet: 'B', user: 'Poppins sams', email: 'pops@gmail.com' },
          { alphabet: 'C', user: 'Brian Shaw', email: 'swanbrian@gmail.com' }
        ]
      }
    },
    {
      id: 3,
      first: 'Larry',
      last: 'the Bird',
      handle: '@twitter'
    },
    {
      id: 4,
      first: 'Jimmy',
      last: 'the Ostrich',
      handle: 'Dummy Text'
    },
    {
      id: 5,
      first: 'Cobra Kai',
      last: 'the Snake',
      handle: 'Another Name'
    }
  ]
};

TeamTables = {
  columns: [
  
    { key: 'head', header: 'Team Head' },
    { key: 'category', header: 'Category' },
    { key: 'role', header: 'Role' },
    { key: 'gmail', header: 'Gmail' },
    { key: 'team', header: 'Team' },
    { key: 'progress', header: 'Work Progress' },
    { key: 'revenue', header: 'Revenue' },
    { key: 'action', header: 'Action' }
  ],
  rows: [
    {
      checkboxId: 'checkboxNoLabel1',
      head: { name: 'Mayor Kelly', avatar: './assets/images/faces/3.jpg' },
      category: 'Manufacturer',
      role: { label: 'Team Lead', badgeClass: 'badge bg-primary-transparent' },
      gmail: 'mayorkrlly@gmail.com',
      team: ['./assets/images/faces/2.jpg','./assets/images/faces/8.jpg','./assets/images/faces/2.jpg'],
      extraCount: 4,
      progress: 52,
      revenue: '$10,984.29',
      actions: ['download','edit']
    },
    {
      checkboxId: 'checkboxNoLabel2',
      head: { name: 'Andrew Garfield', avatar: './assets/images/faces/12.jpg' },
      category: 'Managing Director',
      role: { label: 'Director', badgeClass: 'badge bg-warning-transparent' },
      gmail: 'andrewgarfield@gmail.com',
      team: ['./assets/images/faces/1.jpg','./assets/images/faces/5.jpg','./assets/images/faces/11.jpg','./assets/images/faces/15.jpg'],
      extraCount: 4,
      progress: 91,
      revenue: '$1.4billion',
      actions: ['download','edit']
    },
    {
      checkboxId: 'checkboxNoLabel3',
      head: { name: 'Simon Cowel', avatar: './assets/images/faces/14.jpg' },
      category: 'Service Manager',
      role: { label: 'Manager', badgeClass: 'badge bg-success-transparent' },
      gmail: 'simoncowel234@gmail.com',
      team: ['./assets/images/faces/6.jpg','./assets/images/faces/16.jpg'],
      extraCount: 10,
      progress: 45,
      revenue: '$7,123.21',
      actions: ['download','edit']
    },
    {
      checkboxId: 'checkboxNoLabel13',
      head: { name: 'Mirinda Hers', avatar: './assets/images/faces/5.jpg' },
      category: 'Recruiter',
      role: { label: 'Employee', badgeClass: 'badge bg-danger-transparent' },
      gmail: 'mirindahers@gmail.com',
      team: ['./assets/images/faces/3.jpg','./assets/images/faces/10.jpg','./assets/images/faces/14.jpg'],
      extraCount: 6,
      progress: 21,
      revenue: '$2,325.45',
      actions: ['download','edit']
    }
  ]
};


}
