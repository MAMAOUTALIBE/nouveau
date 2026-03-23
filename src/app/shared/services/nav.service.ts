import { Injectable, OnDestroy, inject } from '@angular/core';
import { Subject, BehaviorSubject, fromEvent } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
// Menu
export interface Menu {
  headTitle?: string;
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
  menutype?: string,
  dirchange?: boolean,
  nochild?: any

}

@Injectable({
  providedIn: 'root',
})
export class NavService implements OnDestroy {
  private router = inject(Router);

  private unsubscriber: Subject<any> = new Subject();
  public screenWidth: BehaviorSubject<number> = new BehaviorSubject(
    window.innerWidth
  );

  // Search Box
  public search = false;

  // Language
  public language = false;

  // Mega Menu
  public megaMenu = false;
  public levelMenu = false;
  public megaMenuColapse: boolean = window.innerWidth < 1199 ? true : false;

  // Collapse Sidebar
  public collapseSidebar: boolean = window.innerWidth < 991 ? true : false;

  // For Horizontal Layout Mobile
  public horizontal: boolean = window.innerWidth < 991 ? false : true;

  // Full screen
  public fullScreen = false;
  active: any;

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
    if (window.innerWidth < 991) {
      // Detect Route change sidebar close
      this.router.events.subscribe((event) => {
        this.collapseSidebar = true;
        this.megaMenu = false;
        this.levelMenu = false;
      });
    }
  }

  ngOnDestroy() {
    this.unsubscriber.next;
    this.unsubscriber.complete();
  }

  private setScreenWidth(width: number): void {
    this.screenWidth.next(width);
  }

  MENUITEMS: Menu[] = [
    { headTitle: 'RH' },
    { title: 'Tableau de bord', path: '/dashboard', type: 'link', dirchange: false },
    {
      title: 'Personnel',
      type: 'sub',
      dirchange: false,
      children: [
        { path: '/personnel/agents', title: 'Liste des agents', type: 'link', dirchange: false },
        { path: '/personnel/dossiers', title: 'Dossiers administratifs', type: 'link', dirchange: false },
        { path: '/personnel/affectations', title: 'Affectations', type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Organisation',
      type: 'sub',
      dirchange: false,
      children: [
        { path: '/organisation/organigramme', title: 'Organigramme', type: 'link', dirchange: false },
        { path: '/organisation/postes-budgetaires', title: 'Postes budgetaires', type: 'link', dirchange: false },
        { path: '/organisation/postes-vacants', title: 'Postes vacants', type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Recrutement',
      type: 'sub',
      dirchange: false,
      children: [
        { path: '/recrutement/candidatures', title: 'Candidatures', type: 'link', dirchange: false },
        { path: '/recrutement/campagnes', title: 'Campagnes', type: 'link', dirchange: false },
        { path: '/recrutement/integration', title: 'Integration', type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Carriere',
      type: 'sub',
      dirchange: false,
      children: [
        { path: '/carriere/avancements', title: 'Avancements', type: 'link', dirchange: false },
        { path: '/carriere/mutations', title: 'Mutations', type: 'link', dirchange: false },
        { path: '/carriere/detachements', title: 'Detachements', type: 'link', dirchange: false },
        { path: '/carriere/promotions', title: 'Promotions', type: 'link', dirchange: false },
      ],
    },
    {
      title: 'Absences',
      type: 'sub',
      dirchange: false,
      children: [
        { path: '/absences/demandes', title: 'Demandes', type: 'link', dirchange: false },
        { path: '/absences/calendrier', title: 'Calendrier', type: 'link', dirchange: false },
        { path: '/absences/soldes', title: 'Soldes', type: 'link', dirchange: false },
      ],
    },
    { headTitle: 'Pilotage' },
    { path: '/evaluation', title: 'Evaluation', type: 'link', dirchange: false },
    { path: '/formation', title: 'Formation', type: 'link', dirchange: false },
    { path: '/discipline', title: 'Discipline', type: 'link', dirchange: false },
    { path: '/documents', title: 'Documents', type: 'link', dirchange: false },
    { path: '/workflows', title: 'Workflows', type: 'link', dirchange: false },
    { path: '/rapports', title: 'Rapports', type: 'link', dirchange: false },
    { headTitle: 'Portails' },
    { path: '/portail-agent', title: 'Portail agent', type: 'link', dirchange: false },
    { path: '/portail-manager', title: 'Portail manager', type: 'link', dirchange: false },
    { headTitle: 'Administration' },
    { path: '/administration', title: 'Administration', type: 'link', dirchange: false },
  ];

  items = new BehaviorSubject<Menu[]>(this.MENUITEMS);
}
