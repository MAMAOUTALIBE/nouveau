import { Component, ElementRef, inject, Renderer2, TemplateRef } from '@angular/core';
import { SwitcherService } from '../../../shared/services/switcher.service';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Menu, NavService } from '../../services/nav.service';
import { Switcher } from '../switcher/switcher';
import { AppStateService } from '../../services/app-state.service';
import { RightSidebar } from '../right-sidebar/right-sidebar';
import { AuthService } from '../../services/auth.service';

interface Item {
  id: number;
  name: string;
  type: string;
  title: string;
  // Add other properties as needed
}
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  standalone: false,
})
export class Header {
  elementRef = inject(ElementRef);
  SwitcherService = inject(SwitcherService);
  renderer = inject(Renderer2);
  NavServices = inject(NavService);
  authService = inject(AuthService);
  private appStateService = inject(AppStateService);

  private modalService = inject(NgbModal);

  cartItemCount: number = 5;

  constructor() { }

  private offcanvasService = inject(NgbOffcanvas);
  toggleSwitcher() {
    this.offcanvasService.open(Switcher, {
      position: 'end',
      scroll: true,
    });
  }

  openNotifications() {
    this.offcanvasService.open(RightSidebar, {
      position: 'end',
      scroll: true,
      panelClass:'sidebar-right'
    });
  }

  updateTheme(theme: string) {
    this.appStateService.updateState({ theme, menuColor: theme, headerColor: theme });
    if (theme == 'light') {
      this.appStateService.updateState({ theme, themeBackground: '', headerColor: 'light', menuColor: 'light' });
      let html = document.querySelector('html');
      html?.style.removeProperty('--body-bg-rgb');
      html?.style.removeProperty('--body-bg-rgb2');
      html?.style.removeProperty('--light-rgb');
      html?.style.removeProperty('--form-control-bg');
      html?.style.removeProperty('--input-border');
    }
    if (theme == 'dark') {
      this.appStateService.updateState({ theme, themeBackground: '', headerColor: 'dark', menuColor: 'dark' });
      let html = document.querySelector('html');
      html?.style.removeProperty('--body-bg-rgb');
      html?.style.removeProperty('--body-bg-rgb2');
      html?.style.removeProperty('--light-rgb');
      html?.style.removeProperty('--form-control-bg');
      html?.style.removeProperty('--input-border');
    }
  }


  toggleSidebar() {
    let html = document.querySelector("html")!;

    // Check the window width
    if (window.innerWidth <= 992) {
      let dataToggled = html.getAttribute("data-toggled");

      if (dataToggled == "open") {
        html.setAttribute("data-toggled", "close");
      } else {
        html.setAttribute("data-toggled", "open");
      }
    }
    else {
      let menuNavLayoutType = html.getAttribute("data-nav-style");
      let verticalStyleType = html.getAttribute("data-vertical-style");

      if (menuNavLayoutType) {
        let dataToggled = html.getAttribute("data-toggled");
        if (dataToggled) {
          html.removeAttribute("data-toggled");
        } else {
          html.setAttribute("data-toggled", menuNavLayoutType + "-closed",);
        }
      } else if (verticalStyleType) {
        let dataToggled = html.getAttribute("data-toggled");

        if (verticalStyleType == "doublemenu") {
          if (
            html.getAttribute("data-toggled") === "double-menu-open" && document.querySelector(".double-menu-active")
          ) {
            html.setAttribute("data-toggled", "double-menu-close");
          } else {
            if (document.querySelector(".double-menu-active")) {
              html.setAttribute("data-toggled", "double-menu-open",);
            }
          }
        } else if (dataToggled) {
          html.removeAttribute("data-toggled");
        } else {
          switch (verticalStyleType) {
            case "closed":
              html.setAttribute("data-toggled", "close-menu-close",);
              break;
            case "icontext":
              html.setAttribute("data-toggled", "icon-text-close",);
              break;
            case "overlay":
              html.setAttribute("data-toggled", "icon-overlay-close",);
              break;
            case "detached":
              html.setAttribute("data-toggled", "detached-close");
              break;
            default:

          }
        }
      }
    }
  }

  cartItems = [
    { id: 'row1', imageUrl: './assets/images/ecommerce/19.jpg', name: 'Lence Camera', quantity: 1, price: 189.00 },
    { id: 'row2', imageUrl: './assets/images/ecommerce/16.jpg', name: 'White Earbuds', quantity: 3, price: 59.00 },
    { id: 'row3', imageUrl: './assets/images/ecommerce/12.jpg', name: 'Branded Black Headset', quantity: 2, price: 39.99 },
    { id: 'row4', imageUrl: './assets/images/ecommerce/6.jpg', name: 'Glass Decor Item', quantity: 5, price: 5.99 },
    { id: 'row5', imageUrl: './assets/images/ecommerce/4.jpg', name: 'Pink Teddy Bear', quantity: 1, price: 10.00 },
  ];

  notifications = [
    {
      icon: 'far fa-folder-open text-fixed-white fs-18',
      bgClass: 'bg-pink',
      title: 'New Files available',
      timeAgo: '10 hours ago'
    },
    {
      icon: 'fab fa-delicious text-fixed-white fs-18',
      bgClass: 'bg-purple',
      title: 'Updates available',
      timeAgo: '2 days ago'
    },
    {
      icon: 'fa fa-cart-plus text-fixed-white fs-18',
      bgClass: 'bg-success',
      title: 'New order received',
      timeAgo: '1 hour ago'
    },
    {
      icon: 'far fa-envelope-open text-fixed-white fs-18',
      bgClass: 'bg-warning',
      title: 'New review received',
      timeAgo: '1 day ago'
    },
    {
      icon: 'fab fa-wpforms text-fixed-white fs-18',
      bgClass: 'bg-danger',
      title: '22 verified registrations',
      timeAgo: '2 hours ago'
    },
    {
      icon: 'far fa-check-square text-fixed-white fs-18',
      bgClass: 'bg-success',
      title: 'Project approved',
      timeAgo: '4 hours ago'
    },
  ];
  notificationCount: number = this.notifications.length;
  removeNotification(index: number) {
    // 1. Remove the item
    this.notifications.splice(index, 1);

    // 2. Update the count
    this.notificationCount = this.notifications.length;

    // 3. Update the boolean flag (This is what you're missing!)
    if (this.notifications.length === 0) {
      this.isNotifyEmpty = true;
    }
  }
  languages = [
    { code: 'en', name: 'English', flagSrc: './assets/images/flags/us_flag.jpg' },
    { code: 'es', name: 'Spanish', flagSrc: './assets/images/flags/spain_flag.jpg' },
    { code: 'fr', name: 'French', flagSrc: './assets/images/flags/french_flag.jpg' },
    { code: 'de', name: 'German', flagSrc: './assets/images/flags/germany_flag.jpg' },
    { code: 'it', name: 'Italian', flagSrc: './assets/images/flags/italy_flag.jpg' },
    { code: 'ru', name: 'Russian', flagSrc: './assets/images/flags/russia_flag.jpg' },
  ];


  apps = [
    { name: 'Figma', iconSrc: './assets/images/apps/figma.png' },
    { name: 'Power Point', iconSrc: './assets/images/apps/microsoft-powerpoint.png' },
    { name: 'MS Word', iconSrc: './assets/images/apps/microsoft-word.png' },
    { name: 'Calendar', iconSrc: './assets/images/apps/calender.png' },
    { name: 'Sketch', iconSrc: './assets/images/apps/sketch.png' },
    { name: 'Docs', iconSrc: './assets/images/apps/google-docs.png' },
    { name: 'Google', iconSrc: './assets/images/apps/google.png' },
    { name: 'Translate', iconSrc: './assets/images/apps/translate.png' },
    { name: 'Sheets', iconSrc: './assets/images/apps/google-sheets.png' },
  ];



  activities = [
    { initials: 'CH', bgClass: 'bg-primary', title: 'New Websites is Created', timeAgo: '30 mins ago' },
    { initials: 'N', bgClass: 'bg-danger', title: 'Prepare For the Next Project', timeAgo: '2 hours ago' },
    { initials: 'S', bgClass: 'bg-info', title: 'Decide the live Discussion', timeAgo: '3 hours ago' },
    { initials: 'K', bgClass: 'bg-warning', title: 'Meeting at 3:00 pm', timeAgo: '4 hours ago' },
    { initials: 'R', bgClass: 'bg-success', title: 'Prepare for Presentation', timeAgo: '1 days ago' },
    { initials: 'MS', bgClass: 'bg-pink', title: 'Prepare for Presentation', timeAgo: '1 days ago' },
    { initials: 'L', bgClass: 'bg-purple', title: 'Prepare for Presentation', timeAgo: '45 mintues ago' },
    { initials: 'U', bgClass: 'bg-secondary', title: 'Prepare for Presentation', timeAgo: '2 days ago' },
  ];

  SearchModal(SearchModal: TemplateRef<HTMLElement>) {
    this.modalService.open(SearchModal);
  }
  SearchHeader() {
    document.querySelector('.header-search')?.classList.toggle('searchdrop');
  }
  isCartEmpty: boolean = false;
  isNotifyEmpty: boolean = false;

  removeRow(rowId: string) {
    const rowElement = document.getElementById(rowId);
    if (rowElement) {
      rowElement.remove();
    }
    this.cartItemCount--;
    this.isCartEmpty = this.cartItemCount === 0;
  }



  handleCardClick(event: MouseEvent) {
    // Prevent the click event from propagating to the container
    event.stopPropagation();
  }

  isFullscreen: boolean = false;

  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
  }

  logout() {
    this.authService.logout();
  }

  openModal(content: TemplateRef<HTMLElement>) {
    this.modalService.open(content, {
      windowClass: 'searchdisplay',
      backdropClass: 'searchdisplaybackdrop'
    });
  }

  ngOnInit(): void {
    this.NavServices.items.subscribe((menuItems) => {
      this.items = menuItems;
    });
    // To clear and close the search field by clicking on body
    document.querySelector('.main-content')?.addEventListener('click', () => {
      this.clearSearch();
    })
    this.text = '';
  }

  //search
  public menuItems!: Menu[];
  public items!: Menu[];
  public text!: string;
  public SearchResultEmpty: boolean = false;

  Search(searchText: any) {
    if (!searchText) return this.menuItems = [];
    // items array which stores the elements
    let items: any[] = [];
    // Converting the text to lower case by using toLowerCase() and trim() used to remove the spaces from starting and ending
    searchText = searchText.toLowerCase().trim();
    this.items.filter((menuItems: any) => {
      // checking whether menuItems having title property, if there was no title property it will return
      if (!menuItems?.title) return false;
      //  checking wheteher menuitems type is text or string and checking the titles of menuitems
      if (menuItems.type === 'link' && menuItems.title.toLowerCase().includes(searchText)) {
        // Converting the menuitems title to lowercase and checking whether title is starting with same text of searchText
        if (menuItems.title.toLowerCase().startsWith(searchText)) {// If you want to get all the data with matching to letter entered remove this line(condition and leave items.push(menuItems))
          // If both are matching then the code is pushed to items array
          items.push(menuItems);
        }
      }
      //  checking whether the menuItems having children property or not if there was no children the return
      if (!menuItems.children) return false;
      menuItems.children.filter((subItems: any) => {
        if (subItems.type === 'link' && subItems.title.toLowerCase().includes(searchText)) {
          if (subItems.title.toLowerCase().startsWith(searchText)) {         // If you want to get all the data with matching to letter entered remove this line(condition and leave items.push(subItems))
            items.push(subItems);
          }

        }
        if (!subItems.children) return false;
        subItems.children.filter((subSubItems: any) => {
          if (subSubItems.title.toLowerCase().includes(searchText)) {
            if (subSubItems.title.toLowerCase().startsWith(searchText)) {// If you want to get all the data with matching to letter entered remove this line(condition and leave items.push(subSubItems))
              items.push(subSubItems);
            }
          }
        })
        return;
      })
      return this.menuItems = items;
    });
    // Used to show the No search result found box if the length of the items is 0
    if (!items.length) {
      this.SearchResultEmpty = true;
    }
    else {
      this.SearchResultEmpty = false;
    }
    return;
  }

  //  Used to clear previous search result
  clearSearch() {
    this.text = '';
    this.menuItems = [];
    this.SearchResultEmpty = false;
    return this.text, this.menuItems
  }

}


