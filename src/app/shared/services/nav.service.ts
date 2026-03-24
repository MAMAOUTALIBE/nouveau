import { Injectable, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Subject, fromEvent } from 'rxjs';
import { debounceTime, filter, takeUntil } from 'rxjs/operators';
import { APP_PERMISSIONS, AccessControlService } from '../../core/security/access-control.service';

const menuIcon = (pathData: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="side-menu__icon" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none" /><path d="${pathData}" /></svg>`;

const sectionIcon = (pathData: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" class="category-head-icon" height="16" viewBox="0 0 24 24" width="16"><path d="M0 0h24v24H0V0z" fill="none" /><path d="${pathData}" /></svg>`;

const SECTION_ICONS = {
  rh: sectionIcon(
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13z'
  ),
  pilotage: sectionIcon('M3 17h2v4H3v-4zm4-6h2v10H7V11zm4 3h2v7h-2v-7zm4-5h2v12h-2V9zm4-7h2v19h-2V2z'),
  portails: sectionIcon(
    'M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10 1.49 0 2.9-.33 4.18-.91-.42-.9-1.58-1.59-3.06-1.92-.34.4-.85.65-1.42.65-1.04 0-1.88-.84-1.88-1.88S10.66 16 11.7 16c.57 0 1.08.26 1.43.66 1.86.41 3.36 1.34 4.09 2.57C19.54 17.45 21 14.89 21 12c0-5.52-4.48-10-9-10z'
  ),
} as const;

const MENU_ICONS = {
  dashboard: menuIcon('M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'),
  personnel: menuIcon(
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
  ),
  organisation: menuIcon(
    'M19 11V3H5v18h14v-2h-3v-2h3v-2h-3v-2h3v-2h-3zm-8 8H9v-2h2v2zm0-4H9v-2h2v2zm0-4H9V9h2v2zm0-4H9V5h2v2zm4 12h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2zm0-4h-2V5h2v2zM3 21h2V7H3v14z'
  ),
  recrutement: menuIcon(
    'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM6 10V8H4V6H2v2H0v2h2v2h2v-2h2zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
  ),
  carriere: menuIcon('M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6.59-6.59 4 4 6.3-6.29L22 11V6z'),
  absences: menuIcon(
    'M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zm-5.16-6.71L12 10.46l-3.16 3.17-1.41-1.42L12 7.63l3.25 3.25L17.84 8.3 19.25 9.71l-5.41 5.58z'
  ),
  evaluation: menuIcon('M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 14l-5-5 1.41-1.41L11 14.17l5.59-5.59L18 10l-7 7z'),
  formation: menuIcon('M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z'),
  discipline: menuIcon(
    'M13 3h-2v10h2V3zm0 14h-2v2h2v-2zm-1-16C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'
  ),
  documents: menuIcon('M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 18H8v-2h8v2zm0-4H8v-2h8v2zm-3-7V3.5L18.5 9H13z'),
  workflows: menuIcon('M18 7l-1.41 1.41L18.17 10H3v2h15.17l-1.58 1.59L18 15l4-4-4-4zM6 9 2 5l4-4 1.41 1.41L5.83 4H21v2H5.83l1.58 1.59L6 9z'),
  rapports: menuIcon('M3 13h2v8H3v-8zm4-6h2v14H7V7zm4 3h2v11h-2V10zm4-7h2v18h-2V3zm4 11h2v7h-2v-7z'),
  agents: menuIcon('M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'),
  dossiers: menuIcon('M6 2h9l5 5v13c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8 1.5V9h5.5'),
  affectations: menuIcon('M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h6v2H7v-2zM4 6h2v12H4V6zm14 0h2v12h-2V6z'),
  organigramme: menuIcon('M10 3h4v4h-4V3zm-6 8h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zm-5-3h2v2h-2V8zM7 9h10v2H7V9z'),
  postesBudgetaires: menuIcon('M4 4h16v4H4V4zm0 6h10v10H4V10zm12 2h4v8h-4v-8z'),
  postesVacants: menuIcon('M5 4h14v2H5V4zm2 4h10v12H7V8zm2 2v8h6v-8H9z'),
  candidatures: menuIcon('M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm-7 8c0-2.76 3.58-5 8-5s8 2.24 8 5H5z'),
  campagnes: menuIcon('M3 5h18v2H3V5zm2 4h14v10H5V9zm3 2v6h8v-6H8z'),
  integration: menuIcon('M12 2l4 4h-3v7h-2V6H8l4-4zm-7 13h14v7H5v-7z'),
  avancements: menuIcon('M4 18h16v2H4v-2zm3-2 3-4 2 2 4-6 1.7 1.1L12.2 17 10 15l-1.6 2H7z'),
  mutations: menuIcon('M7 7h10v2H7V7zm0 8h10v2H7v-2zm-4-4h14v2H3v-2z'),
  detachements: menuIcon('M12 2l4 4h-3v5h-2V6H8l4-4zm-7 11h14v9H5v-9zm2 2v5h10v-5H7z'),
  promotions: menuIcon('M12 2l2.09 4.26L19 7l-3.5 3.41.83 4.84L12 13l-4.33 2.25.83-4.84L5 7l4.91-.74L12 2z'),
  demandes: menuIcon('M6 4h12v2H6V4zm0 4h12v2H6V8zm0 4h8v2H6v-2zm0 4h5v2H6v-2z'),
  calendrier: menuIcon('M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14h18V6c0-1.1-.9-2-2-2zm0 14H5V9h14v9z'),
  soldes: menuIcon('M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm1 14h-2v-2h2v2zm1.9-7.5-.9.92c-.72.73-1 1.33-1 2.58h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.95 2.25z'),
  formationSessions: menuIcon('M12 3L1 9l11 6 9-4.91V17h2V9L12 3zm0 14L5 13.18V17l7 4 7-4v-3.82L12 17z'),
  formationCatalogue: menuIcon('M4 6h10v2H4V6zm0 4h10v2H4v-2zm0 4h10v2H4v-2zm12-8h4v12h-4V6z'),
  portailAgent: menuIcon(
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08C16.71 18.72 14.5 20 12 20z'
  ),
  portailManager: menuIcon(
    'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h8v-2.5c0-.85.33-1.66.88-2.31C9.12 13.44 8.44 13 8 13zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'
  ),
  administration: menuIcon(
    'M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.14 7.14 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.89 2h-3.78a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.72 8.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.07.63-.07.95s.02.63.06.94l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.31.62.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.05.24.25.42.49.42h3.78c.24 0 .44-.18.49-.42l.36-2.54c.58-.23 1.13-.54 1.63-.94l2.39.96c.23.09.49 0 .62-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.01-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z'
  ),
} as const;

// Menu
export interface Menu {
  headTitle?: string;
  headIcon?: string;
  headTitle2?: string;
  path?: string;
  title?: string;
  icon?: string;
  type?: string;
  badgeValue?: string;
  badgeClass?: string;
  badgeText?: string;
  active?: boolean;
  selected?: boolean;
  bookmark?: boolean;
  children?: Menu[];
  children2?: Menu[];
  Menusub?: boolean;
  target?: boolean;
  menutype?: string;
  dirchange?: boolean;
  nochild?: unknown;
  requiredAnyPermissions?: string[];
  requiredAllPermissions?: string[];
  requiredRoles?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  private router = inject(Router);
  private accessControl = inject(AccessControlService);
  private unsubscriber = new Subject<void>();

  public screenWidth: BehaviorSubject<number> = new BehaviorSubject(window.innerWidth);

  // Search Box
  public search = false;

  // Language
  public language = false;

  // Mega Menu
  public megaMenu = false;
  public levelMenu = false;
  public megaMenuColapse: boolean = window.innerWidth < 1199;

  // Collapse Sidebar
  public collapseSidebar: boolean = window.innerWidth < 991;

  // For Horizontal Layout Mobile
  public horizontal: boolean = window.innerWidth >= 991;

  // Full screen
  public fullScreen = false;
  active: any;

  private readonly baseMenuItems: Menu[] = [
    { headTitle: 'RH', headIcon: SECTION_ICONS.rh },
    {
      title: 'Tableau de bord',
      icon: MENU_ICONS.dashboard,
      path: '/dashboard',
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.dashboardView],
    },
    {
      title: 'Personnel',
      icon: MENU_ICONS.personnel,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.personnelView],
      children: [
        { path: '/personnel/agents', title: 'Liste des agents', icon: MENU_ICONS.agents, type: 'link', dirchange: false },
        { path: '/personnel/dossiers', title: 'Dossiers administratifs', icon: MENU_ICONS.dossiers, type: 'link', dirchange: false },
        { path: '/personnel/affectations', title: 'Affectations', icon: MENU_ICONS.affectations, type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Organisation',
      icon: MENU_ICONS.organisation,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.organizationView],
      children: [
        { path: '/organisation/organigramme', title: 'Organigramme', icon: MENU_ICONS.organigramme, type: 'link', dirchange: false },
        { path: '/organisation/postes-budgetaires', title: 'Postes budgetaires', icon: MENU_ICONS.postesBudgetaires, type: 'link', dirchange: false },
        { path: '/organisation/postes-vacants', title: 'Postes vacants', icon: MENU_ICONS.postesVacants, type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Recrutement',
      icon: MENU_ICONS.recrutement,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.recruitmentView],
      children: [
        { path: '/recrutement/candidatures', title: 'Candidatures', icon: MENU_ICONS.candidatures, type: 'link', dirchange: false },
        { path: '/recrutement/campagnes', title: 'Campagnes', icon: MENU_ICONS.campagnes, type: 'link', dirchange: false },
        { path: '/recrutement/integration', title: 'Integration', icon: MENU_ICONS.integration, type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Carriere',
      icon: MENU_ICONS.carriere,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.careersView],
      children: [
        { path: '/carriere/avancements', title: 'Avancements', icon: MENU_ICONS.avancements, type: 'link', dirchange: false },
        { path: '/carriere/mutations', title: 'Mutations', icon: MENU_ICONS.mutations, type: 'link', dirchange: false },
        { path: '/carriere/detachements', title: 'Detachements', icon: MENU_ICONS.detachements, type: 'link', dirchange: false },
        { path: '/carriere/promotions', title: 'Promotions', icon: MENU_ICONS.promotions, type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Absences',
      icon: MENU_ICONS.absences,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.leaveView],
      children: [
        { path: '/absences/demandes', title: 'Demandes', icon: MENU_ICONS.demandes, type: 'link', dirchange: false },
        { path: '/absences/calendrier', title: 'Calendrier', icon: MENU_ICONS.calendrier, type: 'link', dirchange: false },
        { path: '/absences/soldes', title: 'Soldes', icon: MENU_ICONS.soldes, type: 'link', dirchange: false },
      ],
    },
    { headTitle: 'Pilotage', headIcon: SECTION_ICONS.pilotage },
    {
      path: '/evaluation',
      title: 'Evaluation',
      icon: MENU_ICONS.evaluation,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.performanceView],
    },
    {
      title: 'Formation',
      icon: MENU_ICONS.formation,
      type: 'sub',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.trainingView],
      children: [
        { path: '/formation/sessions', title: 'Sessions', icon: MENU_ICONS.formationSessions, type: 'link', dirchange: false },
        { path: '/formation/catalogue', title: 'Catalogue', icon: MENU_ICONS.formationCatalogue, type: 'link', dirchange: false },
      ],
    },
    {
      path: '/discipline',
      title: 'Discipline',
      icon: MENU_ICONS.discipline,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.disciplineView],
    },
    {
      path: '/documents',
      title: 'Documents',
      icon: MENU_ICONS.documents,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.documentsView],
    },
    {
      path: '/workflows',
      title: 'Workflows',
      icon: MENU_ICONS.workflows,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.workflowsView],
    },
    {
      path: '/rapports',
      title: 'Rapports',
      icon: MENU_ICONS.rapports,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.reportsView],
    },
    { headTitle: 'Portails', headIcon: SECTION_ICONS.portails },
    {
      path: '/portail-agent',
      title: 'Portail agent',
      icon: MENU_ICONS.portailAgent,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.portalAgent],
    },
    {
      path: '/portail-manager',
      title: 'Portail manager',
      icon: MENU_ICONS.portailManager,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.portalManager],
    },
    { headTitle: 'Administration' },
    {
      path: '/administration',
      title: 'Administration',
      icon: MENU_ICONS.administration,
      type: 'link',
      dirchange: false,
      requiredAnyPermissions: [APP_PERMISSIONS.adminView],
    },
  ];

  items = new BehaviorSubject<Menu[]>([]);

  constructor() {
    this.setScreenWidth(window.innerWidth);
    fromEvent(window, 'resize')
      .pipe(debounceTime(1000), takeUntil(this.unsubscriber))
      .subscribe((evt: any) => {
        this.setScreenWidth(evt.target.innerWidth);
        if (evt.target.innerWidth < 991) {
          this.collapseSidebar = true;
          this.megaMenu = false;
          this.levelMenu = false;
        }
        if (evt.target.innerWidth < 1199) {
          this.megaMenuColapse = true;
        }
      });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.unsubscriber)
      )
      .subscribe(() => {
        if (window.innerWidth < 991) {
          this.collapseSidebar = true;
          this.megaMenu = false;
          this.levelMenu = false;
        }
      });

    this.accessControl.state$.pipe(takeUntil(this.unsubscriber)).subscribe(() => {
      this.refreshMenuItems();
    });

    this.refreshMenuItems();
  }

  ngOnDestroy() {
    this.unsubscriber.next();
    this.unsubscriber.complete();
  }

  private setScreenWidth(width: number): void {
    this.screenWidth.next(width);
  }

  private refreshMenuItems(): void {
    const filtered = this.filterMenuItems(this.baseMenuItems);
    this.items.next(this.removeOrphanHeadings(filtered));
  }

  private filterMenuItems(items: Menu[]): Menu[] {
    const filtered: Menu[] = [];

    items.forEach((item) => {
      const children = item.children ? this.filterMenuItems(item.children) : undefined;
      const children2 = item.children2 ? this.filterMenuItems(item.children2) : undefined;
      const hasVisibleChildren = !!children?.length || !!children2?.length;

      if (item.headTitle) {
        filtered.push({ ...item });
        return;
      }

      const allowedByPermissions = this.isMenuItemAllowed(item);
      if (!allowedByPermissions && !hasVisibleChildren) {
        return;
      }

      if (item.type === 'sub' && !hasVisibleChildren && !item.path) {
        return;
      }

      filtered.push({
        ...item,
        active: false,
        selected: false,
        children,
        children2,
      });
    });

    return filtered;
  }

  private removeOrphanHeadings(items: Menu[]): Menu[] {
    const cleaned: Menu[] = [];
    let pendingHeading: Menu | null = null;

    items.forEach((item) => {
      if (item.headTitle) {
        pendingHeading = item;
        return;
      }

      if (pendingHeading) {
        cleaned.push(pendingHeading);
        pendingHeading = null;
      }
      cleaned.push(item);
    });

    return cleaned;
  }

  private isMenuItemAllowed(item: Menu): boolean {
    return this.accessControl.hasRouteAccess({
      requiredAnyPermissions: item.requiredAnyPermissions,
      requiredAllPermissions: item.requiredAllPermissions,
      requiredRoles: item.requiredRoles,
    });
  }
}
