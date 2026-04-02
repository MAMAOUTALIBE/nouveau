import { Component, signal } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavTab, SpkNav } from "../../../@spk/spk-nav/spk-nav";
import { Tab, TabContent, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
@Component({
  selector: 'app-nav-tabs',
  imports: [NgbModule, SpkNav,Tab, TabContent, TabList, TabPanel, Tabs ],
  templateUrl: './nav-tabs.html',
  styleUrl: './nav-tabs.scss'
})
export class NavTabs {
  active = 1;
  active2 = 4;
  active3 = 10;
  active4 = 14;
  active5 = 17;
  active6 = 19;
  active7 = 28;
  active8 = 31;
  active9 = 34;
  active12 = 43;
  active13 = 46;
  active14 = 52;
  active15 = 53;
  active16 = 59;
  active17 = 60;
  active18 = 56;

  DefaultNavTabs = signal<NavTab[]>([
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'License' }
  ]);

  JustifiedNavTabs = signal<NavTab[]>([
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'License' }
  ])

  BasicPillTabsWithLinks: NavTab[] = [
    { id: 1, label: 'Products' },
    { id: 2, label: 'Cart', badge: { text: 32, class: 'bg-secondary' } },
    { id: 3, label: 'Orders', badge: { text: 4, class: 'bg-success' } },
    { id: 4, label: 'Offers' }
  ];
  // parent.component.ts
  JustifiedPillTabsWithLinks: NavTab[] = [
    { id: 1, label: 'Products' },
    { id: 2, label: 'Cart', badge: { text: 'Full', class: 'bg-info-transparent' } },
    { id: 3, label: 'Orders' },
    { id: 4, label: 'Offers', badge: { text: '7', class: 'bg-warning-transparent' } }
  ];
  verticalTabs: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'Contacts' }
  ];
  // parent.component.ts
  Verticalalignmentwithlinks: NavTab[] = [
    { id: 1, label: 'Home', icon: 'ri-home-smile-line' },
    { id: 2, label: 'About', icon: 'ri-archive-drawer-line' },
    { id: 3, label: 'Services', icon: 'ri-bank-line' },
    { id: 4, label: 'Contacts', icon: 'ri-contacts-book-2-line' },
  ];
  CenterAlignedNav: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'Contacts' }
  ];
  RightAlignedNav: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'Contacts' }
  ];
  orderTabs: NavTab[] = [
    { id: 1, label: 'Orders' },
    { id: 2, label: 'Accepted' },
    { id: 3, label: 'Declined' }
  ];
  headerTabs: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' }
  ];
  FooterTabs: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' }
  ];

  TabStyle1tabs: NavTab[] = [
    { id: 1, label: 'Orders', icon: 'ri-file-list-line' },
    { id: 2, label: 'Accepted', icon: 'ri-check-line', badge: { text: '5', class: 'bg-success' } },
    { id: 3, label: 'Declined', icon: 'ri-close-line' }
  ];
  TabStyle2tabs: NavTab[] = [
    { id: 1, label: 'Ordered', icon: 'ri-gift-line' },
    { id: 2, label: 'Confirmed', icon: 'ri-check-double-line' },
    { id: 3, label: 'Shipped', icon: 'ri-shopping-bag-3-line' },
    { id: 4, label: 'Delivery', icon: 'ri-truck-line' }
  ];
  TabStyle3tabs: NavTab[] = [
    { id: 1, label: 'Home' ,navbuttonClass:'home'},
    { id: 2, label: 'About' ,navbuttonClass:'about'},
    { id: 3, label: 'Services',navbuttonClass:'services' }
  ];



  TabStyle4tabs: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'Profile' },
    { id: 3, label: 'About' }
  ];

  TabStyle5tabs: NavTab[] = [
    { id: 1, label: 'Home' },
    { id: 2, label: 'About' },
    { id: 3, label: 'Services' },
    { id: 4, label: 'Contacts' }
  ];
  TabStyle6tabs: NavTab[] = [
    { id: 1, label: 'Products', icon: 'ri-gift-line' },
    { id: 2, label: 'Sales', icon: 'ri-bill-line' },
    { id: 3, label: 'Profit', icon: 'ri-money-dollar-box-line' },
    { id: 4, label: 'Expenses', icon: 'ri-exchange-box-line' }
  ];
  TabStyle7tabs: NavTab[] = [
    { id: 1, label: 'Profile', icon: 'ri-shield-user-line' },
    { id: 2, label: 'Password', icon: 'ri-u-disk-line' },
    { id: 3, label: 'Team', icon: 'ri-group-line' },
    { id: 4, label: 'Billing', icon: 'ri-bill-line' },
    { id: 5, label: 'Email', icon: 'ri-mail-line' }
  ];
  TabStyle8tabs: NavTab[] = [
    { id: 1, label: 'Home', icon: 'ri-home-4-line' },
    { id: 2, label: 'About', icon: 'ri-phone-line' },
    { id: 3, label: 'Services', icon: 'ri-customer-service-line' }
  ];
  TabStyle9tabs: NavTab[] = [
    { id: 1, label: 'Employees', icon: 'ri-map-pin-user-line' },
    { id: 2, label: 'Customers', icon: 'ri-group-line' },
    { id: 3, label: 'Products', icon: 'ri-gift-line' }
  ];


  TabStyle10tabs: NavTab[] = [
    { id: 1, label: 'Home' },
    {
      id: 2,
      label: 'Company',
      isDropdown: true,
      dropdownItems: [
        { label: 'About' },
        { label: 'Another action' },
        { label: 'Something else here' },
        { label: '', isDivider: true },
        { label: 'Separated link' }
      ]
    },
    { id: 3, label: 'Products' },
    { id: 4, label: 'Services', disabled: true }
  ];
  TabStyle11tabs: NavTab[] = [
  { id: 1, label: 'Products' },
  {
    id: 2,
    label: 'Cart',
    isDropdown: true,
    dropdownItems: [
      { label: 'Wishlist' },
      { label: 'Liked' },
      { label: 'Save For Later' },
      { label: '', isDivider: true },
      { label: 'Recently Viewed' }
    ]
  },
  { id: 3, label: 'Orders' },
  { id: 4, label: 'Offers', disabled: true }
];

TabStyle12tabs: NavTab[] = [
  { id: 1, label: 'Home' },
  { id: 2, label: 'Customer-ratings' },
  { id: 3, label: 'Services' },
  { id: 4, label: 'Disabled', disabled: true }
];
TabStyle13tabs: NavTab[] = [
  { id: 1, label: 'Home' },
  { id: 2, label: 'Company Details' },
  { id: 3, label: 'Products' },
  { id: 4, label: 'Disabled', disabled: true }
];
TabStyle14tabs: NavTab[] = [
  { id: 1, label: 'Home' },
  { id: 2, label: 'More Data More The Tab Size' },
  { id: 3, label: 'About' },
  { id: 4, label: 'Services', disabled: true }
];
}


