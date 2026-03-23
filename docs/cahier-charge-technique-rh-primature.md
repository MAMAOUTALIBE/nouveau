# Cahier De Charge Technique

## Application RH De La Primature Sur Le Template Angular 21 Existant

## 0. Périmètre Et Décision D’Architecture

Objectif: transformer le template admin Angular 21 existant en application RH gouvernementale complète sans rupture visuelle.

Principe directeur: adapter le métier au template, jamais l’inverse.

Décisions structurantes:

- La base d’intégration retenue est `Final`; `Starterkit` reste uniquement une référence minimale, pas la cible fonctionnelle.
- Le socle UI du template `Final` est conservé.
- Les layouts existants restent inchangés.
- La sidebar continue d’être pilotée par `shared/services/nav.service.ts`.
- Les pages métier sont implémentées en composants standalone chargés par route, comme dans le template actuel.
- Les styles globaux restent pilotés par `src/styles.scss`, `public/assets/css/bootstrap.css` et `public/assets/css/styles.css`.
- Les pages génériques du template deviennent soit des écrans RH réutilisés, soit des références techniques, soit des routes retirées du menu.

---

## A. Audit D’Intégration Du Template

## A.1. Socle Réel Audité

Éléments observés dans le dépôt `Final`:

- Angular 21 confirmé dans `package.json`.
- Bootstrap de l’application via `bootstrapApplication()` dans `src/main.ts`.
- Configuration globale via `src/app/app.config.ts`.
- Routing racine via `src/app/app.routes.ts`.
- Layout métier via `src/app/shared/layouts/content-layout/content-layout.html`.
- Layout authentification via `src/app/shared/layouts/authentication-layout/authentication-layout.html`.
- Routes métier agrégées via `src/app/shared/routes/content.routes.ts`.
- Routes d’authentification via `src/app/shared/routes/auth.routes.ts`.
- Menu latéral via `src/app/shared/services/nav.service.ts`.
- Sidebar via `src/app/shared/components/sidebar/sidebar.html`.
- Header via `src/app/shared/components/header/header.html`.
- Breadcrumbs via `src/app/shared/components/page-header/page-header.ts`.

## A.2. Parties Du Template À Conserver Telles Quelles

Conserver sans refonte:

- `ContentLayout`
- `AuthenticationLayout`
- `sidebar.html` et sa mécanique de navigation
- `header.html` et ses zones de recherche, thème, dropdowns
- `footer`, `tab-to-top`, `right-sidebar`, `switcher`
- `src/styles.scss`
- `public/assets/css/bootstrap.css`
- `public/assets/css/styles.css`
- la structure de cartes Bootstrap et classes utilitaires du thème
- les composants `@spk/*`
- les patterns d’affichage actuels: cards, widgets, tables, tabs, timelines, dropdowns, formulaires, badges, notifications

## A.3. Contraintes D’Intégration Déduites Du Template

Contraintes techniques réelles à respecter:

- La sidebar accepte 3 niveaux maximum de profondeur car `sidebar.html` gère `children`, `children2` et sous-menus visuels jusqu’au niveau `child3`.
- Le breadcrumb dépend des métadonnées de route `data.parentTitle`, `data.subParentTitle`, `data.childTitle`.
- Le header search exploite `menuItems` issus de `NavService`; le nouveau menu doit donc être proprement structuré et routable.
- Les composants de page du template sont majoritairement standalone; les nouvelles pages RH doivent suivre le même mode.
- Les logos du header/sidebar et certains liens sont encore hardcodés vers `/dashboards/dashboard-1`; ils devront pointer vers le nouveau dashboard RH au moment du développement.
- Le thème repose sur des variables CSS racines, notamment `--primary-rgb`, `--menu-bg`, `--header-bg`; aucune de ces variables ne doit être modifiée.

## A.4. Pages Existantes Réutilisables

| Source template | Réutilisation RH cible | Niveau de réutilisation | Adaptation attendue |
| --- | --- | --- | --- |
| `components/dashboards/dashboard-1` | Tableau de bord RH exécutif | Élevé | Remplacer KPIs, graphiques, listes et timeline mockées |
| `components/widgets/widgets` + `@spk/widgets/*` | KPIs RH, indicateurs par direction, alertes synthétiques | Élevé | Alimenter avec données RH |
| `components/apps/contacts` | Annuaire du personnel, annuaire managers, vue rapide agent | Élevé | Remplacer contacts par agents et structures |
| `components/apps/fullcalendar` | Calendrier des congés, absences, missions, astreintes | Élevé | Brancher demandes, soldes, workflow et permissions |
| `components/apps/file-manager` | GED RH, dépôt et classement documentaire | Élevé | Adapter catégories, types documentaires, actions |
| `components/apps/file-details` | Détail document, versions, métadonnées, téléchargement | Élevé | Brancher GED RH et workflow documentaire |
| `components/apps/treeview` | Organigramme, rattachements, postes occupés/vacants | Moyen à élevé | Remplacer dataset et ajouter panneau détail |
| `components/tables/angular-tables` | Listes agents, postes, demandes, campagnes | Moyen | Généraliser le filtre actuellement câblé sur des champs de démonstration |
| `components/tables/grid-js-tables` | Reporting tabulaire, exports, vues analytiques | Élevé | Adapter colonnes, filtres et actions |
| `components/forms/forms-layout` | Formulaires RH structurés | Élevé | Remplacer labels, champs et règles métier |
| `components/forms/validation` | Formulaires validés côté client | Élevé | Brancher reactive forms RH |
| `@spk/plugins/spk-ng-select` | Sélecteurs référentiels RH | Élevé | Alimenter via référentiels API/mock |
| `@spk/plugins/spk-flatpickr` | Dates de prise de service, congés, campagnes | Élevé | Brancher formats et règles métier |
| `components/pages/profile` | Fiche agent / dossier individuel | Élevé | Remplacer données profil par données agent, carrière, documents |
| `@spk/pages/spk-profile-timeline` + timeline | Historique carrière, décisions, sanctions, validations | Élevé | Remplacer évènements |
| `components/pages/settings` | Paramétrage RH / administration fonctionnelle | Moyen | Remplacer catégories techniques par paramètres métiers |
| `components/pages/notification-list` | Journal de notifications RH et décisions | Élevé | Brancher notifications métier |
| `components/apps/notification` | Toastr, popup, notifications workflow | Élevé | Réutiliser pour feedback d’actions |
| `components/apps/sweet-alerts` | Confirmations sensibles RH | Élevé | Réutiliser pour suppression, validation, clôture |
| `components/apps/widget-notification` | Alertes visuelles, empty states, erreurs métier | Élevé | Réutiliser pour dossiers incomplets, documents manquants |

## A.5. Routes Existant À Remplacer Ou À Sortir Du Périmètre

Routes à retirer du périmètre fonctionnel RH principal:

- `dashboards/*`
- `ui-elements/*`
- `advanced-ui/*`
- `charts/*`
- `maps/*`
- `icons/*`
- `widgets/*` en tant que menu autonome
- `pages/ecommerce/*`
- `pages/pricing`
- `pages/about-us`
- `pages/faqs`

Routes à conserver mais à remapper:

- `auth/login`
- `pages/profile` ou son équivalent en nouveau module RH
- `pages/settings` ou son équivalent en administration RH
- `apps/contacts`
- `apps/fullcalender`
- `apps/file-manager`
- `apps/file-details`
- `apps/treeview`
- `pages/notifications-list`

## A.6. Ajustements Techniques Obligatoires Avant Développement Métier

- Remplacer `NavService.MENUITEMS` par un menu RH final.
- Remplacer `content.routes.ts` pour ne plus agréger les routes démo.
- Rediriger les liens hardcodés du logo et du login vers le dashboard RH.
- Isoler ou remplacer l’authentification Firebase de démonstration par une authentification API réelle.
- Créer des guards `auth` et `permission`.
- Introduire une couche `core/api` pour factoriser `HttpClient`, interceptors, erreurs et pagination.

## A.7. Risques Techniques Déjà Identifiés

- `AuthService` actuel mélange plusieurs approches Firebase et du code legacy; il ne doit pas être recyclé tel quel pour le SI RH.
- `SpkAngularMaterialTables` contient un `filterPredicate` câblé sur des colonnes fictives; il faut le rendre générique ou le wrapper.
- Certaines pages du template contiennent des `href="javascript:void(0);"`; en contexte métier, elles doivent devenir des actions Angular explicites.
- Plusieurs composants sont fortement alimentés en mocks internes; il faut sortir les données vers `services` et `models`.

---

## B. Arborescence Cible Du Projet

## B.1. Arborescence Recommandée

```text
src/app/
  core/
    api/
      api-client.service.ts
      api-config.ts
      api-response.model.ts
    auth/
      auth.service.ts
      session.service.ts
      auth.models.ts
    guards/
      auth.guard.ts
      permission.guard.ts
    interceptors/
      auth.interceptor.ts
      audit.interceptor.ts
      error.interceptor.ts
    state/
      app-shell.store.ts
  modules/
    dashboard/
      pages/hr-dashboard/
      components/dashboard-kpi-card/
      components/alerts-panel/
      services/dashboard.service.ts
      models/dashboard.models.ts
      dashboard.routes.ts
    personnel/
      pages/agent-list/
      pages/agent-detail/
      pages/administrative-files/
      pages/assignments/
      components/agent-filters/
      components/agent-summary/
      services/agent.service.ts
      services/assignment.service.ts
      models/agent.model.ts
      models/assignment.model.ts
      personnel.routes.ts
    organization/
      pages/org-chart/
      pages/budget-positions/
      pages/vacant-positions/
      services/organization.service.ts
      models/organization.model.ts
      organization.routes.ts
    recruitment/
      pages/applications/
      pages/campaigns/
      pages/onboarding/
      services/recruitment.service.ts
      models/recruitment.model.ts
      recruitment.routes.ts
    careers/
      pages/advancements/
      pages/transfers/
      pages/secondments/
      pages/promotions/
      services/careers.service.ts
      models/careers.model.ts
      careers.routes.ts
    leave/
      pages/requests/
      pages/calendar/
      pages/balances/
      services/leave.service.ts
      models/leave.model.ts
      leave.routes.ts
    time/
      pages/attendance/
      pages/timesheets/
      services/time.service.ts
      models/time.model.ts
      time.routes.ts
    performance/
      pages/evaluations/
      pages/campaigns/
      services/performance.service.ts
      models/performance.model.ts
      performance.routes.ts
    training/
      pages/catalog/
      pages/sessions/
      pages/individual-plans/
      services/training.service.ts
      models/training.model.ts
      training.routes.ts
    discipline/
      pages/cases/
      pages/sanctions/
      services/discipline.service.ts
      models/discipline.model.ts
      discipline.routes.ts
    documents/
      pages/document-library/
      pages/document-detail/
      pages/document-validation/
      services/documents.service.ts
      models/documents.model.ts
      documents.routes.ts
    workflows/
      pages/inbox/
      pages/requests/
      pages/instance-detail/
      services/workflows.service.ts
      models/workflows.model.ts
      workflows.routes.ts
    reports/
      pages/hr-reports/
      pages/export-history/
      services/reports.service.ts
      models/reports.model.ts
      reports.routes.ts
    self-service/
      pages/agent-portal/
      pages/manager-portal/
      services/self-service.service.ts
      models/self-service.model.ts
      self-service.routes.ts
    admin/
      pages/users/
      pages/roles/
      pages/permissions/
      pages/reference-data/
      pages/system-settings/
      services/admin.service.ts
      models/admin.model.ts
      admin.routes.ts
  mocks/
    dashboard/
    agents/
    organization/
    leave/
    workflows/
    reports/
  shared/
    components/
    directives/
    layouts/
    routes/
    services/
```

## B.2. Détail Par Module

| Module | Pages | Composants | Services | Modèles | Routes |
| --- | --- | --- | --- | --- | --- |
| `dashboard` | `hr-dashboard` | `dashboard-kpi-card`, `alerts-panel`, `pending-validations-widget` | `DashboardService` | `DashboardSummary`, `DashboardAlert`, `DashboardKpi` | `/dashboard` |
| `personnel` | `agent-list`, `agent-detail`, `administrative-files`, `assignments` | `agent-filters`, `agent-summary`, `agent-documents-tab` | `AgentService`, `AssignmentService` | `Agent`, `AdministrativeFile`, `Assignment` | `/personnel/*` |
| `organization` | `org-chart`, `budget-positions`, `vacant-positions` | `org-tree-panel`, `position-card` | `OrganizationService` | `Direction`, `Service`, `Position` | `/organisation/*` |
| `recruitment` | `applications`, `campaigns`, `onboarding` | `candidate-card`, `campaign-filters` | `RecruitmentService` | `Candidate`, `RecruitmentCampaign`, `Application` | `/recrutement/*` |
| `careers` | `advancements`, `transfers`, `secondments`, `promotions` | `movement-timeline`, `decision-summary` | `CareersService` | `CareerMovement`, `PromotionDecision` | `/carriere/*` |
| `leave` | `requests`, `calendar`, `balances` | `leave-balance-card`, `leave-request-form` | `LeaveService` | `LeaveRequest`, `Absence`, `LeaveBalance` | `/absences/*` |
| `time` | `attendance`, `timesheets` | `timesheet-summary`, `attendance-calendar` | `TimeService` | `AttendanceRecord`, `Timesheet` | `/temps/*` |
| `performance` | `evaluations`, `campaigns` | `evaluation-form`, `objective-card` | `PerformanceService` | `Evaluation`, `EvaluationCampaign` | `/evaluation/*` |
| `training` | `catalog`, `sessions`, `individual-plans` | `training-session-card`, `enrollment-table` | `TrainingService` | `TrainingCourse`, `TrainingSession`, `Enrollment` | `/formation/*` |
| `discipline` | `cases`, `sanctions` | `discipline-case-panel`, `sanction-history` | `DisciplineService` | `DisciplinaryCase`, `Sanction` | `/discipline/*` |
| `documents` | `document-library`, `document-detail`, `document-validation` | `document-card`, `document-metadata-table` | `DocumentsService` | `Document`, `DocumentVersion` | `/documents/*` |
| `workflows` | `inbox`, `requests`, `instance-detail` | `workflow-stepper`, `approval-history` | `WorkflowsService` | `WorkflowInstance`, `WorkflowTask` | `/workflows/*` |
| `reports` | `hr-reports`, `export-history` | `report-filter-bar`, `export-job-status` | `ReportsService` | `ReportDefinition`, `ExportJob` | `/rapports/*` |
| `self-service` | `agent-portal`, `manager-portal` | `self-request-card`, `manager-team-list` | `SelfServiceService` | `SelfServiceSummary`, `ManagerTeamSummary` | `/portail-agent`, `/portail-manager` |
| `admin` | `users`, `roles`, `permissions`, `reference-data`, `system-settings` | `role-matrix`, `reference-table-editor` | `AdminService` | `User`, `Role`, `Permission`, `ReferenceData` | `/administration/*` |

---

## C. Nouveau Menu Latéral

## C.1. Structure TypeScript Compatible `NavService`

```ts
import { Menu } from '../shared/services/nav.service';

export const RH_MENU_ITEMS: Menu[] = [
  { headTitle: 'RH' },
  {
    title: 'Tableau de bord',
    path: '/dashboard',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Personnel',
    type: 'sub',
    active: false,
    selected: false,
    dirchange: false,
    children: [
      {
        title: 'Liste des agents',
        path: '/personnel/agents',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Dossiers administratifs',
        path: '/personnel/dossiers',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Affectations',
        path: '/personnel/affectations',
        type: 'link',
        dirchange: false,
      },
    ],
  },
  {
    title: 'Organisation',
    type: 'sub',
    active: false,
    selected: false,
    dirchange: false,
    children: [
      {
        title: 'Organigramme',
        path: '/organisation/organigramme',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Postes budgétaires',
        path: '/organisation/postes-budgetaires',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Postes vacants',
        path: '/organisation/postes-vacants',
        type: 'link',
        dirchange: false,
      },
    ],
  },
  {
    title: 'Recrutement',
    type: 'sub',
    active: false,
    selected: false,
    dirchange: false,
    children: [
      {
        title: 'Candidatures',
        path: '/recrutement/candidatures',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Campagnes',
        path: '/recrutement/campagnes',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Intégration',
        path: '/recrutement/integration',
        type: 'link',
        dirchange: false,
      },
    ],
  },
  {
    title: 'Carrière',
    type: 'sub',
    active: false,
    selected: false,
    dirchange: false,
    children: [
      {
        title: 'Avancements',
        path: '/carriere/avancements',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Mutations',
        path: '/carriere/mutations',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Détachements',
        path: '/carriere/detachements',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Promotions',
        path: '/carriere/promotions',
        type: 'link',
        dirchange: false,
      },
    ],
  },
  {
    title: 'Absences',
    type: 'sub',
    active: false,
    selected: false,
    dirchange: false,
    children: [
      {
        title: 'Demandes',
        path: '/absences/demandes',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Calendrier',
        path: '/absences/calendrier',
        type: 'link',
        dirchange: false,
      },
      {
        title: 'Soldes',
        path: '/absences/soldes',
        type: 'link',
        dirchange: false,
      },
    ],
  },

  { headTitle: 'PILOTAGE' },
  {
    title: 'Évaluation',
    path: '/evaluation',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Formation',
    path: '/formation',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Discipline',
    path: '/discipline',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Documents',
    path: '/documents',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Workflows',
    path: '/workflows',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Rapports',
    path: '/rapports',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },

  { headTitle: 'PORTAILS' },
  {
    title: 'Portail agent',
    path: '/portail-agent',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
  {
    title: 'Portail manager',
    path: '/portail-manager',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },

  { headTitle: 'ADMINISTRATION' },
  {
    title: 'Administration',
    path: '/administration',
    type: 'link',
    active: false,
    selected: false,
    dirchange: false,
  },
];
```

## C.2. Règles D’Implémentation Menu

- Remplacer uniquement `MENUITEMS` dans `nav.service.ts`.
- Ne pas modifier `sidebar.html`.
- Ajouter les SVG existants du template sur les entrées de niveau 1 uniquement.
- Garder une profondeur maximum de 2 sous-niveaux pour éviter toute surcharge UX.

---

## D. Plan Des Routes Angular

## D.1. Conventions

- Routes en kebab-case sans accent.
- Une route liste par domaine.
- Une route détail `:id` pour les fiches.
- Lazy loading par domaine métier.
- `data.parentTitle`, `data.subParentTitle`, `data.childTitle` obligatoire sur toute route visible.
- `AuthenticationLayout` réservé aux pages `auth/*`.
- `ContentLayout` réservé à l’application métier.

## D.2. `app.routes.ts`

```ts
import { Routes } from '@angular/router';
import { ContentLayout } from './shared/layouts/content-layout/content-layout';
import { AuthenticationLayout } from './shared/layouts/authentication-layout/authentication-layout';
import { content } from './shared/routes/content.routes';
import { authen } from './shared/routes/auth.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: '',
    component: ContentLayout,
    canActivate: [authGuard],
    children: content,
  },
  {
    path: '',
    component: AuthenticationLayout,
    children: authen,
  },
  { path: '**', redirectTo: 'dashboard' },
];
```

## D.3. `shared/routes/content.routes.ts`

```ts
import { Routes } from '@angular/router';

export const content: Routes = [
  {
    path: 'dashboard',
    loadChildren: () =>
      import('../../modules/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'personnel',
    loadChildren: () =>
      import('../../modules/personnel/personnel.routes').then((m) => m.PERSONNEL_ROUTES),
  },
  {
    path: 'organisation',
    loadChildren: () =>
      import('../../modules/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
  },
  {
    path: 'recrutement',
    loadChildren: () =>
      import('../../modules/recruitment/recruitment.routes').then((m) => m.RECRUITMENT_ROUTES),
  },
  {
    path: 'carriere',
    loadChildren: () =>
      import('../../modules/careers/careers.routes').then((m) => m.CAREERS_ROUTES),
  },
  {
    path: 'absences',
    loadChildren: () =>
      import('../../modules/leave/leave.routes').then((m) => m.LEAVE_ROUTES),
  },
  {
    path: 'temps',
    loadChildren: () =>
      import('../../modules/time/time.routes').then((m) => m.TIME_ROUTES),
  },
  {
    path: 'evaluation',
    loadChildren: () =>
      import('../../modules/performance/performance.routes').then((m) => m.PERFORMANCE_ROUTES),
  },
  {
    path: 'formation',
    loadChildren: () =>
      import('../../modules/training/training.routes').then((m) => m.TRAINING_ROUTES),
  },
  {
    path: 'discipline',
    loadChildren: () =>
      import('../../modules/discipline/discipline.routes').then((m) => m.DISCIPLINE_ROUTES),
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('../../modules/documents/documents.routes').then((m) => m.DOCUMENTS_ROUTES),
  },
  {
    path: 'workflows',
    loadChildren: () =>
      import('../../modules/workflows/workflows.routes').then((m) => m.WORKFLOWS_ROUTES),
  },
  {
    path: 'rapports',
    loadChildren: () =>
      import('../../modules/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
  },
  {
    path: 'portail-agent',
    loadChildren: () =>
      import('../../modules/self-service/self-service.routes').then((m) => m.SELF_SERVICE_AGENT_ROUTES),
  },
  {
    path: 'portail-manager',
    loadChildren: () =>
      import('../../modules/self-service/self-service.routes').then((m) => m.SELF_SERVICE_MANAGER_ROUTES),
  },
  {
    path: 'administration',
    loadChildren: () =>
      import('../../modules/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
];
```

## D.4. `shared/routes/auth.routes.ts`

```ts
import { Routes } from '@angular/router';

export const authen: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('../../authentication/login/login').then((m) => m.Login),
    title: 'Primature RH - Connexion',
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import('../../components/pages/authentication/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
    title: 'Primature RH - Mot de passe oublié',
  },
];
```

## D.5. Exemple De Route Module

```ts
import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const PERSONNEL_ROUTES: Routes = [
  {
    path: 'agents',
    loadComponent: () =>
      import('./pages/agent-list/agent-list').then((m) => m.AgentListPage),
    canActivate: [permissionGuard('agents.read')],
    data: {
      parentTitle: 'Personnel',
      subParentTitle: '',
      childTitle: 'Liste des agents',
    },
  },
  {
    path: 'agents/:id',
    loadComponent: () =>
      import('./pages/agent-detail/agent-detail').then((m) => m.AgentDetailPage),
    canActivate: [permissionGuard('agents.read')],
    data: {
      parentTitle: 'Personnel',
      subParentTitle: 'Agents',
      childTitle: 'Fiche agent',
    },
  },
  {
    path: 'dossiers',
    loadComponent: () =>
      import('./pages/administrative-files/administrative-files').then(
        (m) => m.AdministrativeFilesPage,
      ),
    data: {
      parentTitle: 'Personnel',
      subParentTitle: '',
      childTitle: 'Dossiers administratifs',
    },
  },
  {
    path: 'affectations',
    loadComponent: () =>
      import('./pages/assignments/assignments').then((m) => m.AssignmentsPage),
    data: {
      parentTitle: 'Personnel',
      subParentTitle: '',
      childTitle: 'Affectations',
    },
  },
];
```

---

## E. Liste Des Pages Métier

## E.1. Catalogue Des Pages Par Domaine

- Tableau de bord RH
  - Dashboard exécutif RH
  - Dashboard manager
  - Dashboard agent
- Personnel
  - Liste des agents
  - Création agent
  - Édition agent
  - Fiche agent
  - Dossiers administratifs
  - Affectations
- Organisation
  - Organigramme
  - Postes budgétaires
  - Postes vacants
- Recrutement
  - Candidatures
  - Campagnes
  - Intégration
- Carrière
  - Avancements
  - Mutations
  - Détachements
  - Promotions
  - Historique des mouvements
- Absences
  - Demandes
  - Calendrier
  - Soldes
- Temps de travail
  - Pointage
  - Feuilles de temps
- Évaluation
  - Campagnes
  - Saisies
  - Résultats
- Formation
  - Catalogue
  - Sessions
  - Plans individuels
- Discipline
  - Dossiers contentieux
  - Sanctions
- Documents
  - Bibliothèque documentaire
  - Détail document
  - Validation documentaire
- Workflows
  - Corbeille de validation
  - Historique des instances
  - Détail d’instance
- Rapports
  - Rapports RH
  - Historique des exports
- Portails
  - Portail agent
  - Portail manager
- Administration
  - Utilisateurs
  - Rôles
  - Permissions
  - Référentiels
  - Paramètres système

## E.2. Spécifications Des Pages Principales

| Page | Structure visuelle attendue | Composants template à réutiliser | Données affichées | Actions utilisateur | APIs nécessaires |
| --- | --- | --- | --- | --- | --- |
| Tableau de bord RH | rangée KPI, cartes de synthèse, graphique d’évolution, tableaux “demandes en attente”, timeline d’alertes | `dashboard-1`, `widgets`, `spk-dashboards-card`, `spk-apexcharts`, `spk-reusable-tables`, `widget-notification` | effectif total, agents actifs, absences en cours, départs retraite, postes vacants, masse salariale, alertes, tâches workflow | filtrer, naviguer vers listes filtrées, exporter widgets | `GET /dashboard/summary`, `GET /dashboard/alerts`, `GET /dashboard/pending-tasks` |
| Liste des agents | card header avec filtres, table paginée, recherche, badges, dropdown actions, export | `angular-tables`, `grid-js-tables`, `spk-ng-select`, `spk-dropdowns`, `forms-layout` | matricule, nom, structure, poste, statut, grade, date entrée, manager | rechercher, filtrer, trier, exporter, ouvrir fiche, créer agent | `GET /agents`, `POST /agents/export`, `GET /reference-data/*` |
| Fiche agent | bloc profil, tabs, timeline carrière, tableaux historiques, zone documents | `pages/profile`, `spk-profile-timeline`, `ngbNav`, `spk-reusable-tables`, `file-manager/file-details` | état civil, contacts, statut, poste, affectation, contrats, absences, évaluations, documents, décisions | éditer, attacher document, lancer workflow, consulter historique | `GET /agents/:id`, `GET /agents/:id/timeline`, `GET /agents/:id/documents`, `GET /agents/:id/evaluations` |
| Gestion des congés | formulaire dans card, calendrier en colonne principale, solde en cards, panneau workflow | `fullcalendar`, `validation`, `spk-flatpickr`, `widgets-summary-card`, `notification` | demandes, soldes par type, validation en cours, calendrier équipe | créer demande, annuler, approuver, rejeter, consulter soldes | `GET /leave/requests`, `POST /leave/requests`, `PATCH /leave/requests/:id`, `GET /leave/balances`, `GET /leave/calendar` |
| Organigramme | arbre hiérarchique + carte détail + tableau des postes | `treeview`, `cards`, `spk-reusable-tables`, `widget cards` | directions, services, responsables, postes occupés/vacants | naviguer dans l’arbre, ouvrir détail structure, voir postes | `GET /organization/tree`, `GET /organization/units/:id`, `GET /positions?unitId=...` |
| Documents administratifs | panneau navigation gauche, grille de documents, table de métadonnées, preview | `file-manager`, `file-details`, `forms/file-uploads`, `sweet-alerts`, `notification` | type, auteur, version, statut, date dépôt, visa, archive | déposer, télécharger, valider, rejeter, archiver | `GET /documents`, `POST /documents`, `GET /documents/:id`, `POST /documents/:id/validate` |
| Reporting RH | filtre en tête, KPIs, graphes, table exportable, historique export | `apexcharts`, `echarts`, `grid-js-tables`, `widgets`, `spk-progressbar` | effectifs, pyramide, absentéisme, mobilité, formation, discipline | appliquer filtres, générer PDF/Excel, sauvegarder vue | `GET /reports/hr`, `POST /reports/exports`, `GET /reports/exports/:id` |

## E.3. Règles De Conception Visuelle Pour Les Pages RH

- Toujours envelopper les contenus dans la grille actuelle `row` / `col-*`.
- Utiliser les cards du template comme conteneur principal.
- Réutiliser la typographie, les badges et les classes utilitaires existantes.
- Conserver les patterns de header de page et breadcrumb via `route.data`.
- Réutiliser les empty states de `widget-notification` pour les vues vides.

---

## F. Modèles TypeScript

```ts
export type UUID = string;
export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DRAFT';
export type WorkflowStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
export type Sex = 'M' | 'F';

export interface BaseEntity {
  id: UUID;
  createdAt: string;
  createdBy: UUID;
  updatedAt?: string;
  updatedBy?: UUID;
  deletedAt?: string | null;
  versionNo: number;
  status: EntityStatus;
}

export interface Direction extends BaseEntity {
  code: string;
  label: string;
  managerId?: UUID;
}

export interface Service extends BaseEntity {
  directionId: UUID;
  code: string;
  label: string;
  managerId?: UUID;
}

export interface Poste extends BaseEntity {
  code: string;
  title: string;
  directionId?: UUID;
  serviceId?: UUID;
  gradeCode?: string;
  budgeted: boolean;
  vacant: boolean;
}

export interface ContratStatut extends BaseEntity {
  agentId: UUID;
  contractType: 'FONCTIONNAIRE' | 'CONTRACTUEL' | 'STAGIAIRE' | 'CONSULTANT';
  statusLabel: string;
  startDate: string;
  endDate?: string;
}

export interface Agent extends BaseEntity {
  matricule: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  sex: Sex;
  dateOfBirth: string;
  placeOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  email?: string;
  phone?: string;
  address?: string;
  maritalStatus?: string;
  photoUrl?: string;
  currentDirectionId?: UUID;
  currentServiceId?: UUID;
  currentPosteId?: UUID;
  managerId?: UUID;
  contract?: ContratStatut;
}

export interface Affectation extends BaseEntity {
  agentId: UUID;
  posteId: UUID;
  directionId: UUID;
  serviceId: UUID;
  startDate: string;
  endDate?: string;
  reason?: string;
  isCurrent: boolean;
}

export interface Demande extends BaseEntity {
  type:
    | 'LEAVE'
    | 'ABSENCE'
    | 'DOCUMENT'
    | 'MUTATION'
    | 'PROMOTION'
    | 'TRAINING'
    | 'DISCIPLINE';
  requesterId: UUID;
  workflowInstanceId?: UUID;
  reference: string;
  submittedAt: string;
}

export interface Absence extends BaseEntity {
  agentId: UUID;
  leaveTypeCode: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  reason?: string;
  requestId?: UUID;
}

export interface MouvementCarriere extends BaseEntity {
  agentId: UUID;
  movementType: 'ADVANCEMENT' | 'TRANSFER' | 'SECONDMENT' | 'PROMOTION' | 'APPOINTMENT';
  effectiveDate: string;
  fromPosteId?: UUID;
  toPosteId?: UUID;
  decisionReference?: string;
  comment?: string;
}

export interface Evaluation extends BaseEntity {
  agentId: UUID;
  campaignId: UUID;
  evaluatorId: UUID;
  periodStart: string;
  periodEnd: string;
  score: number;
  result: string;
  comments?: string;
}

export interface Formation extends BaseEntity {
  code: string;
  title: string;
  category?: string;
  startDate: string;
  endDate: string;
  provider?: string;
}

export interface Sanction extends BaseEntity {
  agentId: UUID;
  caseReference: string;
  sanctionType: string;
  decisionDate: string;
  effectiveDate?: string;
  description?: string;
}

export interface Document extends BaseEntity {
  ownerType: 'AGENT' | 'DOSSIER' | 'REQUEST' | 'WORKFLOW';
  ownerId: UUID;
  typeCode: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  versionLabel: string;
  validationStatus: WorkflowStatus;
}

export interface WorkflowInstance extends BaseEntity {
  definitionCode: string;
  entityType: string;
  entityId: UUID;
  currentStepCode: string;
  initiatorId: UUID;
  assigneeId?: UUID;
  status: WorkflowStatus;
}

export interface Permission extends BaseEntity {
  code: string;
  label: string;
  module: string;
}

export interface Role extends BaseEntity {
  code: string;
  label: string;
  permissions?: Permission[];
}

export interface Utilisateur extends BaseEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  agentId?: UUID;
  roles: Role[];
  lastLoginAt?: string;
}

export interface Notification extends BaseEntity {
  userId: UUID;
  title: string;
  message: string;
  channel: 'IN_APP' | 'EMAIL' | 'SMS';
  readAt?: string;
  link?: string;
}

export interface AuditLog extends BaseEntity {
  actorUserId?: UUID;
  actorDisplayName?: string;
  entityType: string;
  entityId: UUID;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'EXPORT';
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}
```

---

## G. Services Angular

## G.1. Services Cibles

| Service | Responsabilité | Méthodes minimales |
| --- | --- | --- |
| `ApiClientService` | base `HttpClient`, headers, pagination, erreurs | `get`, `post`, `patch`, `delete`, `upload`, `download` |
| `AuthService` | login, session, refresh token, profil connecté | `login`, `logout`, `refresh`, `me`, `hasPermission` |
| `DashboardService` | KPIs et synthèse RH | `getSummary`, `getAlerts`, `getPendingTasks` |
| `AgentService` | agents, fiches, recherche, export | `search`, `getById`, `create`, `update`, `export` |
| `AssignmentService` | affectations et postes occupés | `list`, `create`, `close`, `currentByAgent` |
| `OrganizationService` | arbre organisationnel et postes | `getTree`, `getUnits`, `getPositions`, `getVacancies` |
| `RecruitmentService` | candidatures et campagnes | `listApplications`, `listCampaigns`, `startOnboarding` |
| `CareersService` | mouvements de carrière | `listMovements`, `createMovement`, `getTimeline` |
| `LeaveService` | congés, absences, soldes | `listRequests`, `createRequest`, `approve`, `reject`, `getBalances`, `getCalendar` |
| `TimeService` | temps de travail | `getAttendance`, `saveTimesheet` |
| `PerformanceService` | évaluations | `listCampaigns`, `submitEvaluation`, `getResults` |
| `TrainingService` | catalogue et inscriptions | `listCourses`, `listSessions`, `enrollAgent` |
| `DisciplineService` | contentieux et sanctions | `listCases`, `createCase`, `recordSanction` |
| `DocumentsService` | GED | `list`, `upload`, `getDetail`, `validate`, `archive` |
| `WorkflowsService` | circuit de validation | `getInbox`, `getInstance`, `approve`, `reject`, `reassign` |
| `ReportsService` | reporting et exports | `runReport`, `export`, `getExportHistory` |
| `AdminService` | users, rôles, permissions, référentiels | `listUsers`, `saveRole`, `saveReferenceData` |

## G.2. Structure De Mise En Oeuvre

- `core/api` pour les services transverses.
- `modules/*/services` pour les services métier.
- `mocks/*` pour les fournisseurs de données simulées.
- Un `environment.apiBaseUrl` pour le backend réel.
- Un `MockModeService` ou simple drapeau `useMocks` pour basculer entre données JSON et API.

## G.3. Exemple De Service Angular

```ts
@Injectable({ providedIn: 'root' })
export class AgentService {
  private api = inject(ApiClientService);

  search(params: AgentSearchParams) {
    return this.api.get<PaginatedResponse<Agent>>('/agents', params);
  }

  getById(id: string) {
    return this.api.get<AgentDetailDto>(`/agents/${id}`);
  }

  create(payload: CreateAgentDto) {
    return this.api.post<Agent>('/agents', payload);
  }

  update(id: string, payload: UpdateAgentDto) {
    return this.api.patch<Agent>(`/agents/${id}`, payload);
  }

  export(params: AgentSearchParams) {
    return this.api.post<ExportJob>('/agents/export', params);
  }
}
```

---

## H. Contrats API REST

## H.1. Conventions REST

- Base path: `/api/v1`
- Réponse standard:

```ts
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
  errors?: { code: string; message: string }[];
}
```

- Pagination par `page`, `pageSize`, `sort`, `direction`.
- Filtrage via query params.
- Upload documentaire en `multipart/form-data`.
- Exports lourds en mode asynchrone avec `jobId`.

## H.2. Endpoints Principaux

### Authentification Et Sécurité

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/permissions`

### Dashboard

- `GET /dashboard/summary`
- `GET /dashboard/alerts`
- `GET /dashboard/pending-tasks`
- `GET /dashboard/headcount-trend`

### Personnel

- `GET /agents`
- `POST /agents`
- `GET /agents/{id}`
- `PATCH /agents/{id}`
- `GET /agents/{id}/dossier`
- `GET /agents/{id}/documents`
- `GET /agents/{id}/timeline`
- `POST /agents/export`

### Organisation

- `GET /organization/tree`
- `GET /organization/units`
- `GET /organization/units/{id}`
- `GET /positions`
- `GET /positions/vacant`
- `POST /positions`
- `PATCH /positions/{id}`

### Recrutement

- `GET /recruitment/campaigns`
- `POST /recruitment/campaigns`
- `GET /recruitment/applications`
- `POST /recruitment/applications`
- `POST /recruitment/applications/{id}/onboarding`

### Carrière

- `GET /careers/movements`
- `POST /careers/movements`
- `GET /careers/movements/{id}`
- `POST /careers/promotions`
- `POST /careers/transfers`
- `POST /careers/secondments`

### Absences Et Temps

- `GET /leave/requests`
- `POST /leave/requests`
- `PATCH /leave/requests/{id}`
- `POST /leave/requests/{id}/cancel`
- `GET /leave/balances`
- `GET /leave/calendar`
- `GET /time/attendance`
- `POST /time/timesheets`

### Évaluation / Formation / Discipline

- `GET /performance/campaigns`
- `GET /performance/evaluations`
- `POST /performance/evaluations`
- `GET /training/courses`
- `GET /training/sessions`
- `POST /training/enrollments`
- `GET /discipline/cases`
- `POST /discipline/cases`
- `POST /discipline/sanctions`

### GED / Workflows / Rapports

- `GET /documents`
- `POST /documents`
- `GET /documents/{id}`
- `POST /documents/{id}/versions`
- `POST /documents/{id}/validate`
- `POST /documents/{id}/archive`
- `GET /workflows/inbox`
- `GET /workflows/instances/{id}`
- `POST /workflows/instances/{id}/approve`
- `POST /workflows/instances/{id}/reject`
- `POST /reports/hr`
- `POST /reports/exports`
- `GET /reports/exports/{jobId}`

### Administration Et Audit

- `GET /admin/users`
- `POST /admin/users`
- `GET /admin/roles`
- `POST /admin/roles`
- `GET /admin/permissions`
- `GET /admin/reference-data/{domain}`
- `PUT /admin/reference-data/{domain}`
- `GET /audit-logs`
- `GET /notifications`
- `PATCH /notifications/{id}/read`

## H.3. Rôles Cibles

- `SUPER_ADMIN`
- `ADMIN_RH`
- `GESTIONNAIRE_RH`
- `MANAGER`
- `AGENT`
- `RECRUTEUR`
- `ARCHIVISTE`
- `AUDITEUR`
- `CONTROLEUR`

## H.4. Permissions Minimales

- `dashboard.read`
- `agents.read`
- `agents.write`
- `agents.export`
- `organization.read`
- `positions.write`
- `recruitment.manage`
- `careers.manage`
- `leave.request`
- `leave.approve`
- `performance.write`
- `training.manage`
- `discipline.manage`
- `documents.upload`
- `documents.validate`
- `workflows.approve`
- `reports.read`
- `reports.export`
- `admin.manage`
- `audit.read`

---

## I. Schéma Base De Données

## I.1. Technologie Recommandée

- SGBD: PostgreSQL 16
- Stockage documentaire: S3 compatible ou MinIO
- Cache optionnel: Redis
- Recherche documentaire optionnelle: PostgreSQL full-text ou OpenSearch

## I.2. Conventions De Schéma

Champs transverses sur les tables métier:

- `id UUID PK`
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `deleted_at`
- `version_no`
- `status`

Champs d’historisation à prévoir selon le domaine:

- `effective_from`
- `effective_to`
- `is_current`

## I.3. Tables Principales

| Table | Rôle | Champs principaux | FKs |
| --- | --- | --- | --- |
| `users` | compte applicatif | username, email, password_hash, agent_id, last_login_at | `agent_id -> agents.id` |
| `roles` | rôle RBAC | code, label | - |
| `permissions` | permission fine | code, label, module | - |
| `user_roles` | liaison user/role | user_id, role_id | `users`, `roles` |
| `role_permissions` | liaison role/permission | role_id, permission_id | `roles`, `permissions` |
| `organizational_units` | structure hiérarchique unique | code, label, unit_type, parent_id, manager_agent_id | auto FK, `agents` |
| `positions` | poste | code, title, unit_id, grade_code, budgeted, vacant | `organizational_units.id` |
| `position_occupancies` | occupation historique du poste | position_id, agent_id, effective_from, effective_to | `positions`, `agents` |
| `agents` | agent principal | matricule, civil_status, phone, email, current_unit_id, current_position_id | `organizational_units`, `positions` |
| `agent_addresses` | adresses historisées | agent_id, address_type, address_line, city, country | `agents` |
| `contracts` | contrat/statut | agent_id, contract_type, status_label, start_date, end_date | `agents` |
| `assignments` | affectations | agent_id, unit_id, position_id, start_date, end_date, reason | `agents`, `organizational_units`, `positions` |
| `career_movements` | carrière | agent_id, movement_type, from_position_id, to_position_id, decision_reference, effective_date | `agents`, `positions` |
| `recruitment_campaigns` | campagne | code, title, start_date, end_date, status | - |
| `candidates` | candidat | reference, full_name, email, phone, source | - |
| `applications` | candidature | candidate_id, campaign_id, target_position_id, status | `candidates`, `recruitment_campaigns`, `positions` |
| `leave_types` | référentiel congés | code, label, annual_quota | - |
| `leave_requests` | demande de congé | agent_id, leave_type_id, start_date, end_date, duration_days, workflow_instance_id | `agents`, `leave_types`, `workflow_instances` |
| `leave_balances` | soldes annuels | agent_id, leave_type_id, year, allocated_days, consumed_days, remaining_days | `agents`, `leave_types` |
| `absence_events` | absences | agent_id, category, start_date, end_date, linked_request_id | `agents`, `leave_requests` |
| `attendance_records` | pointage | agent_id, work_date, check_in, check_out, worked_minutes | `agents` |
| `evaluation_campaigns` | campagne d’évaluation | code, label, period_start, period_end | - |
| `evaluations` | évaluation agent | agent_id, evaluator_id, campaign_id, score, result | `agents`, `evaluation_campaigns` |
| `training_courses` | catalogue | code, title, category, provider | - |
| `training_sessions` | session | course_id, start_date, end_date, location, seats | `training_courses` |
| `training_enrollments` | inscription | session_id, agent_id, status, result | `training_sessions`, `agents` |
| `disciplinary_cases` | dossier disciplinaire | case_reference, agent_id, opening_date, closing_date, status | `agents` |
| `sanctions` | sanction | case_id, sanction_type, decision_date, effective_date | `disciplinary_cases` |
| `documents` | document logique | owner_type, owner_id, type_code, title, current_version_id | - |
| `document_versions` | version physique | document_id, storage_key, file_name, mime_type, checksum, version_label | `documents` |
| `document_links` | rattachement polyvalent | document_id, entity_type, entity_id | `documents` |
| `workflow_definitions` | définition de workflow | code, label, entity_type, active | - |
| `workflow_definition_steps` | étapes paramétrables | definition_id, step_code, label, role_code, order_no | `workflow_definitions` |
| `workflow_instances` | instance workflow | definition_id, entity_type, entity_id, current_step_code, initiator_user_id, status | `workflow_definitions`, `users` |
| `workflow_tasks` | tâche active | workflow_instance_id, assignee_user_id, due_at, status | `workflow_instances`, `users` |
| `workflow_actions` | historique des actions | workflow_instance_id, step_code, action, actor_user_id, comment, acted_at | `workflow_instances`, `users` |
| `notifications` | notif utilisateur | user_id, title, message, channel, read_at, link | `users` |
| `report_exports` | export asynchrone | requested_by, report_code, file_key, status, requested_at, completed_at | `users` |
| `audit_logs` | piste d’audit | actor_user_id, entity_type, entity_id, action, before_json, after_json, ip_address | `users` |

## I.4. Historisation Et Traçabilité

Historiser obligatoirement:

- affectations
- occupations de poste
- statut/contrat
- mouvements de carrière
- soldes congés annuels
- workflow actions
- versions documentaires
- rôles et permissions sensibles

Traçabilité forte:

- aucune suppression physique des entités métier critiques
- archivage logique via `deleted_at` et `status`
- `audit_logs` alimenté via interceptor backend
- workflow immuable via `workflow_actions`
- pièces jointes versionnées via `document_versions`

---

## J. Plan De Développement Par Phases

## Phase 0. Cadrage Et Assainissement Du Template

- geler le thème et les layouts
- remplacer le menu
- nettoyer les routes de démonstration
- préparer `core/api`, `core/auth`, guards et interceptors

## Phase 1. Intégration Visuelle RH

- dashboard RH
- menu final
- pages vides routées avec breadcrumbs
- réutilisation des composants de contacts, tables, profile, calendar, file manager

Critère de sortie:

- l’application navigue entièrement en mode RH sans casse visuelle

## Phase 2. Données Mock Et Services Simulés

- création des modèles TypeScript
- JSON mocks par domaine
- services Angular retournant `Observable` mockés
- formulaires et listes fonctionnels sans backend

Critère de sortie:

- démonstration complète front RH en autonomie

## Phase 3. Backend Fondations

- auth, users, roles, permissions
- organizational units, agents, positions
- audit logs
- GED minimale

Critère de sortie:

- login réel + lecture liste agents + détail agent + organigramme

## Phase 4. Processus RH Cœur

- carrière
- congés et absences
- workflows
- documents
- reporting initial

## Phase 5. Portails Et Modules Complémentaires

- portail agent
- portail manager
- évaluation
- formation
- discipline

## Phase 6. Industrialisation

- tests automatisés
- sécurisation
- supervision
- performance
- recette fonctionnelle
- déploiement

---

## K. Exemples De Code Angular Pour 3 Écrans Clés

## K.1. Dashboard RH

```ts
// src/app/modules/dashboard/pages/hr-dashboard/hr-dashboard.ts
import { Component, inject } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';
import { SpkWidgetsMetricCard } from '../../../../@spk/widgets/spk-widgets-metric-card/spk-widgets-metric-card';
import { SpkApexcharts } from '../../../../@spk/charts/spk-apexcharts/spk-apexcharts';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-hr-dashboard',
  standalone: true,
  imports: [FormsModule, SpkWidgetsMetricCard, SpkApexcharts, SpkReusableTables, NgApexchartsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './hr-dashboard.html',
})
export class HrDashboardPage {
  private dashboardService = inject(DashboardService);

  kpis = [
    { title: 'Effectif total', value: '1 284', iconClass: 'fe fe-users', badgeClass: 'bg-success', badgeValue: '+2.1%', subtitle: 'vs mois précédent' },
    { title: 'Agents actifs', value: '1 173', iconClass: 'fe fe-user-check', badgeClass: 'bg-success', badgeValue: '+1.4%', subtitle: 'aujourd’hui' },
    { title: 'Absences en cours', value: '47', iconClass: 'fe fe-calendar', badgeClass: 'bg-warning', badgeValue: '12 urgentes', subtitle: 'validation requise' },
    { title: 'Postes vacants', value: '23', iconClass: 'fe fe-briefcase', badgeClass: 'bg-danger', badgeValue: '5 critiques', subtitle: 'à pourvoir' },
  ];

  headcountTrend: ApexOptions = {
    chart: { type: 'line', height: 320, toolbar: { show: false } },
    series: [
      { name: 'Effectif', data: [1201, 1210, 1216, 1228, 1240, 1255, 1284] },
      { name: 'Sorties', data: [3, 2, 5, 1, 4, 2, 6] },
    ],
    colors: ['var(--primary-color)', '#f74f75'],
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'] },
    grid: { borderColor: '#f2f6f7' },
    dataLabels: { enabled: false },
  };

  pendingRequests = [
    { checked: false, reference: 'ABS-2026-00014', agent: 'Aminata Diallo', type: 'Congé annuel', unit: 'Direction RH', submittedAt: '2026-03-18', status: 'En attente manager' },
    { checked: false, reference: 'MVT-2026-00008', agent: 'Moussa Kone', type: 'Mutation', unit: 'Cabinet', submittedAt: '2026-03-20', status: 'En attente DRH' },
  ];

  toggleAllRows(checked: boolean) {
    this.pendingRequests = this.pendingRequests.map((row) => ({ ...row, checked }));
  }
}
```

```html
<!-- src/app/modules/dashboard/pages/hr-dashboard/hr-dashboard.html -->
<div class="row row-sm">
  @for (kpi of kpis; track $index) {
    <div class="col-xl-3 col-lg-6 col-md-6">
      <spk-widgets-metric-card [data]="kpi"></spk-widgets-metric-card>
    </div>
  }
</div>

<div class="row row-sm">
  <div class="col-xxl-8 col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">Évolution des effectifs</div>
      </div>
      <div class="card-body">
        <spk-apexcharts id="hr-headcount-trend" [chartOptions]="headcountTrend"></spk-apexcharts>
      </div>
    </div>
  </div>

  <div class="col-xxl-4 col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">Alertes administratives</div>
      </div>
      <div class="card-body">
        <div class="alert alert-warning-transparent mb-2">12 dossiers incomplets</div>
        <div class="alert alert-danger-transparent mb-2">5 départs à la retraite sous 90 jours</div>
        <div class="alert alert-info-transparent mb-0">9 validations manager en attente</div>
      </div>
    </div>
  </div>
</div>

<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header">
        <div class="card-title">Demandes à traiter</div>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <spk-reusable-tables
            [tableClass]="'table text-nowrap'"
            [showCheckbox]="true"
            [columns]="[
              { header: 'Référence' },
              { header: 'Agent' },
              { header: 'Type' },
              { header: 'Structure' },
              { header: 'Soumis le' },
              { header: 'Statut' }
            ]"
            [data]="pendingRequests"
            (toggleSelectAll)="toggleAllRows($event)"
          >
            @for (row of pendingRequests; track row.reference) {
              <tr>
                <td><input class="form-check-input" type="checkbox" [(ngModel)]="row.checked" /></td>
                <td>{{ row.reference }}</td>
                <td>{{ row.agent }}</td>
                <td>{{ row.type }}</td>
                <td>{{ row.unit }}</td>
                <td>{{ row.submittedAt }}</td>
                <td><span class="badge bg-warning-transparent text-warning">{{ row.status }}</span></td>
              </tr>
            }
          </spk-reusable-tables>
        </div>
      </div>
    </div>
  </div>
</div>
```

## K.2. Liste Des Agents

```ts
// src/app/modules/personnel/pages/agent-list/agent-list.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GridJsAngularComponent } from 'gridjs-angular';
import { SpkNgSelect } from '../../../../@spk/plugins/spk-ng-select/spk-ng-select';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agent-list',
  standalone: true,
  imports: [GridJsAngularComponent, SpkNgSelect, FormsModule, RouterLink],
  templateUrl: './agent-list.html',
})
export class AgentListPage {
  directions = [
    { value: 'all', label: 'Toutes les directions' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'drh', label: 'Direction RH' },
  ];

  statuses = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actif' },
    { value: 'leave', label: 'En absence' },
  ];

  gridConfig = {
    columns: ['Matricule', 'Nom complet', 'Direction', 'Poste', 'Statut', 'Manager'],
    search: true,
    sort: true,
    pagination: { limit: 10 },
    data: [
      ['PRM-000124', 'Aminata Diallo', 'Direction RH', 'Chef de service', 'Actif', 'Seydou Traore'],
      ['PRM-000211', 'Moussa Kone', 'Cabinet', 'Chargé d’études', 'En absence', 'Fatoumata Bah'],
      ['PRM-000318', 'Awa Camara', 'Finances', 'Gestionnaire', 'Actif', 'Bintou Sy'],
    ],
  };
}
```

```html
<!-- src/app/modules/personnel/pages/agent-list/agent-list.html -->
<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-header justify-content-between">
        <div class="card-title">Liste des agents</div>
        <div class="btn-list">
          <a routerLink="/personnel/agents/nouveau" class="btn btn-primary">Nouvel agent</a>
          <button type="button" class="btn btn-outline-primary">Exporter Excel</button>
        </div>
      </div>
      <div class="card-body">
        <div class="row g-3 mb-3">
          <div class="col-xl-4">
            <spk-ng-select [options]="directions" [placeholder]="'Direction'" />
          </div>
          <div class="col-xl-4">
            <spk-ng-select [options]="statuses" [placeholder]="'Statut'" />
          </div>
          <div class="col-xl-4">
            <input type="text" class="form-control" placeholder="Recherche matricule, nom, poste..." />
          </div>
        </div>

        <div id="agents-grid">
          <gridjs-angular [config]="gridConfig"></gridjs-angular>
        </div>
      </div>
    </div>
  </div>
</div>
```

## K.3. Fiche Agent

```ts
// src/app/modules/personnel/pages/agent-detail/agent-detail.ts
import { Component } from '@angular/core';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { SpkProfileTimeline } from '../../../../@spk/pages/spk-profile-timeline/spk-profile-timeline';
import { SpkReusableTables } from '../../../../@spk/tables/spk-reusable-tables/spk-reusable-tables/spk-reusable-tables';

@Component({
  selector: 'app-agent-detail',
  standalone: true,
  imports: [NgbNavModule, SpkProfileTimeline, SpkReusableTables],
  templateUrl: './agent-detail.html',
})
export class AgentDetailPage {
  agent = {
    matricule: 'PRM-000124',
    fullName: 'Aminata Diallo',
    position: 'Chef de service',
    unit: 'Direction RH',
    email: 'aminata.diallo@primature.gouv',
    phone: '+223 00 00 00 00',
    photoUrl: './assets/images/faces/profile.jpg',
  };

  careerEvents = [
    { title: 'Promotion', description: 'Nomination Chef de service RH', date: '2025-09-01' },
    { title: 'Mutation', description: 'Affectation à la Primature', date: '2023-06-15' },
  ];

  documents = [
    { type: 'Arrêté', reference: 'ARR-2025-118', status: 'Validé' },
    { type: 'Décision', reference: 'DEC-2024-044', status: 'Archivé' },
  ];
}
```

```html
<!-- src/app/modules/personnel/pages/agent-detail/agent-detail.html -->
<div class="row row-sm">
  <div class="col-xl-12">
    <div class="card custom-card">
      <div class="card-body d-md-flex">
        <div>
          <img [src]="agent.photoUrl" alt="" class="br-5" />
        </div>
        <div class="my-md-auto mt-4 prof-details">
          <h4 class="font-weight-semibold ms-md-4 mb-1">{{ agent.fullName }}</h4>
          <p class="fs-13 text-muted ms-md-4 mb-2">
            <span class="me-3 d-inline-block"><i class="far fa-address-card me-2"></i>{{ agent.position }}</span>
            <span class="d-inline-block"><i class="far fa-building me-2"></i>{{ agent.unit }}</span>
          </p>
          <p class="text-muted ms-md-4 mb-2"><i class="fa fa-envelope me-2"></i>{{ agent.email }}</p>
          <p class="text-muted ms-md-4 mb-0"><i class="fa fa-phone me-2"></i>{{ agent.phone }}</p>
        </div>
      </div>

      <div class="card-footer py-0">
        <nav ngbNav #nav="ngbNav" class="main-nav-line p-0 tabs-menu profile-nav-line border-0 br-5 mb-0">
          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">État civil</a>
            <ng-template ngbNavContent>
              <div class="p-4">
                <div class="row">
                  <div class="col-md-4"><strong>Matricule</strong><div>{{ agent.matricule }}</div></div>
                  <div class="col-md-4"><strong>Fonction</strong><div>{{ agent.position }}</div></div>
                  <div class="col-md-4"><strong>Structure</strong><div>{{ agent.unit }}</div></div>
                </div>
              </div>
            </ng-template>
          </ng-container>

          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">Carrière</a>
            <ng-template ngbNavContent>
              <div class="p-4">
                @for (event of careerEvents; track event.date) {
                  <div class="border-bottom pb-3 mb-3">
                    <div class="fw-semibold">{{ event.title }}</div>
                    <div class="text-muted">{{ event.description }}</div>
                    <small class="text-muted">{{ event.date }}</small>
                  </div>
                }
              </div>
            </ng-template>
          </ng-container>

          <ng-container ngbNavItem>
            <a ngbNavLink class="mb-2 mt-2">Documents</a>
            <ng-template ngbNavContent>
              <div class="p-4 table-responsive">
                <spk-reusable-tables
                  [tableClass]="'table text-nowrap'"
                  [columns]="[
                    { header: 'Type' },
                    { header: 'Référence' },
                    { header: 'Statut' }
                  ]"
                  [data]="documents"
                >
                  @for (doc of documents; track doc.reference) {
                    <tr>
                      <td>{{ doc.type }}</td>
                      <td>{{ doc.reference }}</td>
                      <td><span class="badge bg-success-transparent text-success">{{ doc.status }}</span></td>
                    </tr>
                  }
                </spk-reusable-tables>
              </div>
            </ng-template>
          </ng-container>
        </nav>
        <div class="border-top-0" [ngbNavOutlet]="nav"></div>
      </div>
    </div>
  </div>
</div>
```

---

## Recommandation De Suite Immédiate

Ordre d’exécution recommandé:

1. Valider ce cahier de charge.
2. Générer le squelette Angular métier compatible avec `Final`.
3. Remplacer le menu et les routes démo.
4. Créer les 3 premiers écrans avec données mockées:
   - dashboard RH
   - liste des agents
   - fiche agent
5. Brancher ensuite backend réel par domaine.
