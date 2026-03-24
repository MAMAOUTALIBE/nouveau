import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  Renderer2,
  TemplateRef,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { SwitcherService } from '../../../shared/services/switcher.service';
import { NgbModal, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { Menu, NavService } from '../../services/nav.service';
import { Switcher } from '../switcher/switcher';
import { AppStateService } from '../../services/app-state.service';
import { RightSidebar } from '../right-sidebar/right-sidebar';
import { AuthService } from '../../services/auth.service';
import { Subject, filter, takeUntil } from 'rxjs';

interface Item {
  id: number;
  name: string;
  type: string;
  title: string;
  // Add other properties as needed
}

type CommandType = 'navigation' | 'action' | 'recent';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  type: CommandType;
  path?: string;
  keywords: string[];
  action?: () => void;
}
@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
  standalone: false,
})
export class Header implements OnInit, OnDestroy {
  elementRef = inject(ElementRef);
  SwitcherService = inject(SwitcherService);
  renderer = inject(Renderer2);
  NavServices = inject(NavService);
  authService = inject(AuthService);
  private appStateService = inject(AppStateService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  private readonly recentRoutesStorageKey = 'rh_recent_routes';
  private readonly maxRecentRoutes = 8;
  private commandItems: CommandItem[] = [];

  @ViewChild('commandPaletteInput') commandPaletteInput?: ElementRef<HTMLInputElement>;

  private modalService = inject(NgbModal);

  cartItemCount: number = 5;
  commandPaletteOpen = false;
  commandQuery = '';
  commandResults: CommandItem[] = [];
  activeCommandIndex = 0;
  readonly commandHint = this.isMacPlatform() ? 'Cmd+K' : 'Ctrl+K';

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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const usesCommandPaletteShortcut = (event.ctrlKey || event.metaKey) && key === 'k';

    if (usesCommandPaletteShortcut) {
      event.preventDefault();
      if (this.commandPaletteOpen) {
        this.closeCommandPalette();
      } else {
        this.openCommandPalette();
      }
      return;
    }

    if (!this.commandPaletteOpen) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeCommandPalette();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActiveCommand(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveCommand(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const activeCommand = this.commandResults[this.activeCommandIndex];
      if (activeCommand) {
        this.executeCommand(activeCommand);
      }
    }
  }

  ngOnInit(): void {
    this.NavServices.items.pipe(takeUntil(this.destroy$)).subscribe((menuItems) => {
      this.items = menuItems;
      this.buildCommandIndex(menuItems);
      if (this.commandPaletteOpen) {
        this.updateCommandResults();
      }
    });
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.trackRecentRoute(event.urlAfterRedirects));
    // To clear and close the search field by clicking on body
    document.querySelector('.main-content')?.addEventListener('click', () => {
      this.clearSearch();
    })
    this.text = '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  //search
  public menuItems: Menu[] = [];
  public items: Menu[] = [];
  public text = '';
  public SearchResultEmpty: boolean = false;

  openCommandPalette(): void {
    if (this.commandPaletteOpen) {
      return;
    }

    this.commandPaletteOpen = true;
    this.commandQuery = '';
    this.updateCommandResults();
    setTimeout(() => this.commandPaletteInput?.nativeElement.focus(), 0);
  }

  closeCommandPalette(): void {
    this.commandPaletteOpen = false;
    this.commandQuery = '';
    this.commandResults = [];
    this.activeCommandIndex = 0;
  }

  updateCommandResults(): void {
    const normalizedQuery = this.normalize(this.commandQuery);
    const recentCommands = this.getRecentCommands();

    if (!normalizedQuery) {
      const actionCommands = this.commandItems.filter((command) => command.type === 'action');
      const navigationCommands = this.commandItems
        .filter((command) => command.type === 'navigation')
        .slice(0, 8);
      this.commandResults = this.mergeCommandGroups([
        recentCommands,
        actionCommands,
        navigationCommands,
      ]).slice(0, 12);
      this.activeCommandIndex = 0;
      return;
    }

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const rankedCommands = this.commandItems
      .map((command) => ({
        command,
        score: this.scoreCommand(command, normalizedQuery, tokens),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.command.title.localeCompare(right.command.title))
      .map((item) => item.command);

    const filteredRecentCommands = recentCommands.filter((command) => {
      const searchable = `${this.normalize(command.title)} ${this.normalize(command.description)} ${command.keywords
        .map((keyword) => this.normalize(keyword))
        .join(' ')}`;
      return tokens.every((token) => searchable.includes(token));
    });

    this.commandResults = this.mergeCommandGroups([filteredRecentCommands, rankedCommands]).slice(0, 12);
    this.activeCommandIndex = 0;
  }

  executeCommand(command: CommandItem): void {
    if (command.action) {
      command.action();
    } else if (command.path) {
      void this.router.navigateByUrl(command.path);
    }
    this.closeCommandPalette();
  }

  formatCommandType(type: CommandType): string {
    if (type === 'action') return 'Action';
    if (type === 'recent') return 'Recent';
    return 'Page';
  }

  private moveActiveCommand(direction: number): void {
    if (!this.commandResults.length) {
      return;
    }

    const nextIndex =
      (this.activeCommandIndex + direction + this.commandResults.length) % this.commandResults.length;
    this.activeCommandIndex = nextIndex;
  }

  private buildCommandIndex(menuItems: Menu[]): void {
    const navigationCommands = this.collectNavigationCommands(menuItems);
    const actionCommands = this.getActionCommands();
    this.commandItems = this.mergeCommandGroups([actionCommands, navigationCommands]);
  }

  private collectNavigationCommands(items: Menu[], parents: string[] = []): CommandItem[] {
    const commands: CommandItem[] = [];

    items.forEach((item) => {
      const nextParents = item.title ? [...parents, item.title] : parents;

      if (item.type === 'link' && item.path && item.title) {
        commands.push({
          id: `nav:${item.path}`,
          title: item.title,
          description: parents.length ? parents.join(' > ') : 'Navigation principale',
          type: 'navigation',
          path: item.path,
          keywords: [...nextParents, item.path],
        });
      }

      if (Array.isArray(item.children) && item.children.length) {
        commands.push(...this.collectNavigationCommands(item.children, nextParents));
      }

      if (Array.isArray(item.children2) && item.children2.length) {
        commands.push(...this.collectNavigationCommands(item.children2, nextParents));
      }
    });

    return commands;
  }

  private getActionCommands(): CommandItem[] {
    return [
      {
        id: 'action:toggle-theme',
        title: 'Basculer le theme',
        description: 'Passer entre mode clair et mode sombre',
        type: 'action',
        keywords: ['theme', 'dark', 'light', 'apparence'],
        action: () => {
          const nextTheme = this.currentThemeMode() === 'dark' ? 'light' : 'dark';
          this.updateTheme(nextTheme);
        },
      },
      {
        id: 'action:open-notifications',
        title: 'Ouvrir le centre de notifications',
        description: 'Afficher le panneau lateral des notifications',
        type: 'action',
        keywords: ['notifications', 'alerte', 'centre'],
        action: () => this.openNotifications(),
      },
      {
        id: 'action:logout',
        title: 'Se deconnecter',
        description: 'Terminer la session utilisateur en cours',
        type: 'action',
        keywords: ['logout', 'session', 'deconnexion'],
        action: () => this.logout(),
      },
    ];
  }

  private scoreCommand(command: CommandItem, normalizedQuery: string, tokens: string[]): number {
    const title = this.normalize(command.title);
    const description = this.normalize(command.description);
    const keywordText = command.keywords.map((keyword) => this.normalize(keyword)).join(' ');
    const searchable = `${title} ${description} ${keywordText}`;

    if (!tokens.every((token) => searchable.includes(token))) {
      return 0;
    }

    let score = 100;

    if (title.startsWith(normalizedQuery)) {
      score += 130;
    } else if (title.includes(normalizedQuery)) {
      score += 80;
    }

    if (description.includes(normalizedQuery)) {
      score += 25;
    }

    if (command.type === 'action') {
      score += 15;
    }

    if (command.type === 'recent') {
      score += 10;
    }

    const firstToken = tokens[0] ?? normalizedQuery;
    const tokenIndex = title.indexOf(firstToken);
    if (tokenIndex >= 0) {
      score += Math.max(0, 20 - tokenIndex);
    }

    return score;
  }

  private trackRecentRoute(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    if (!normalizedUrl || normalizedUrl.startsWith('/auth')) {
      return;
    }

    const existing = this.readRecentRoutes();
    const updated = [normalizedUrl, ...existing.filter((route) => route !== normalizedUrl)].slice(
      0,
      this.maxRecentRoutes
    );

    try {
      localStorage.setItem(this.recentRoutesStorageKey, JSON.stringify(updated));
    } catch {
      // Ignore localStorage failures on private mode / quota.
    }
  }

  private getRecentCommands(): CommandItem[] {
    const recentRoutes = this.readRecentRoutes();
    if (!recentRoutes.length) {
      return [];
    }

    const navigationByPath = new Map(
      this.commandItems
        .filter((command) => command.type === 'navigation' && command.path)
        .map((command) => [command.path as string, command])
    );

    return recentRoutes.map((route) => {
      const existing = navigationByPath.get(route);
      if (existing) {
        return {
          ...existing,
          id: `recent:${route}`,
          type: 'recent',
          description: `Recemment visite - ${existing.description}`,
        };
      }

      return {
        id: `recent:${route}`,
        title: route,
        description: 'Recemment visite',
        type: 'recent',
        path: route,
        keywords: [route, 'recent'],
      };
    });
  }

  private readRecentRoutes(): string[] {
    try {
      const raw = localStorage.getItem(this.recentRoutesStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((entry): entry is string => typeof entry === 'string' && entry.startsWith('/'))
        .slice(0, this.maxRecentRoutes);
    } catch {
      return [];
    }
  }

  private normalizeUrl(url: string): string {
    const [withoutQuery] = url.split('?');
    const [withoutHash] = withoutQuery.split('#');
    return withoutHash || '/';
  }

  private mergeCommandGroups(groups: CommandItem[][]): CommandItem[] {
    const uniqueById = new Map<string, CommandItem>();
    groups.flat().forEach((command) => {
      if (!uniqueById.has(command.id)) {
        uniqueById.set(command.id, command);
      }
    });
    return Array.from(uniqueById.values());
  }

  private currentThemeMode(): string {
    const htmlTheme = document.querySelector('html')?.getAttribute('data-theme-mode');
    return (htmlTheme || 'light').toLowerCase();
  }

  private normalize(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private isMacPlatform(): boolean {
    return typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);
  }

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


