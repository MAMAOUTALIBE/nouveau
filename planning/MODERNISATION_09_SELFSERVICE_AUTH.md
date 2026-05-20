# Fiche de modernisation 09 — Self-service Agent / Manager, Authentification, Modernization Dashboard

> Audit code réel — 2026-05-10 — Périmètre : `Final/src/app/modules/{self-service,modernization}/`, `Final/src/app/authentication/login/`

## 0. Résumé exécutif

Module **portails utilisateurs** = visage du SI pour les agents de l'État. **Aujourd'hui mi-mature** : le portail agent expose 5 sections fonctionnelles (profil, dossier, formations, documents reçus, congés) branchées aux services backend (pas de mock), le portail manager permet validation rapide formations/documents/workflows avec motifs de rejet et export CSV équipe. Mais **deux trous bloquants** : (1) la **page de login ne propose ni MFA TOTP** (pourtant le backend l'expose, cf. fiche 01), **ni reset mot de passe**, **ni changement forcé au 1er login** ; (2) le portail agent n'a **ni « mes évaluations »**, **ni « mes objectifs »**, **ni « mon parcours pro »**, **ni intégration visuelle du Prim'Assistant** dans le portail (composant standalone à part). La modernization-dashboard est utile en interne projet mais reste **destinée aux cadres RH**, pas aux agents.

**Enjeu UX critique :** les portails sont **construits pour Conakry / desktop**, pas pour un agent C en préfecture sur Android entrée de gamme avec 3G intermittente. Un effort PWA + offline + responsive serré est nécessaire avant déploiement national.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Portail Agent | `Final/src/app/modules/self-service/agent-portal.ts`, `agent-portal.html` |
| Portail Manager | `Final/src/app/modules/self-service/manager-portal.ts`, `manager-portal.html` |
| Login | `Final/src/app/authentication/login/login.ts`, `login.html` |
| Modernization dashboard | `Final/src/app/modules/modernization/pages/modernization-dashboard/modernization-dashboard.ts`, `.html`, `modernization.service.ts` |
| Guards | `Final/src/app/core/guards/{auth,permission}.guard.ts` |
| Prim'Assistant (composant) | `Final/src/app/modules/ai-assistant/prim-assistant.ts` |

## 2. État réel (vérifié dans le code)

### Portail Agent

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Section « Mon profil » | ✅ | `agent-portal.html` profile-section | Photo, matricule, poste, direction, manager, recrutement, coordonnées, pièce ID. |
| Section « Mon dossier RH » | ✅ | documents table | Docs administratifs liés. |
| Section « Mes formations » | ✅ | training-requests-section | Demandes + sessions ouvertes + statuts. |
| Section « Mes documents assignés » (inbox) | ✅ | documents-recues | Statut livraison (Assigné/Lu/Accusé), actions voir/imprimer/marquer lu/accuser réception. |
| Section « Mes demandes d'absence » | ✅ | recent requests table | Congés annuels/maladie/mission/maternité avec statut. |
| Notifications inbox | ✅ | `agent-portal.html:455-495` | `documentsService.getMyNotifications()` + `markNotificationRead()`. Badge couleur lu/non-lu. |
| Données via API réelles (vs mock) | ✅ | services réels | `leaveService`, `trainingService`, `documentsService`, `personnelService`. |
| **Mes évaluations 360° (consultation + lien plan développement)** | ❌ | — | Absent. |
| **Mes objectifs** (PDP / fixation annuelle) | ❌ | — | Absent. |
| **Mon parcours pro** (historique mouvements + projection) | ❌ | — | Absent. |
| **Mes certificats de formation** (téléchargement) | ❌ | — | Absent (cf. fiche 06 P3). |
| **Mes données personnelles RGPD** (accès/rectification/oubli) | ❌ | — | Absent (cf. fiche 02 P9). |
| **Mon solde de congés en hero card** | 🟡 | présent dans la section congés | Pas en hero card. |
| **Recherche / favoris documents** | ❌ | — | Absent. |
| Mobile-friendly | 🟡 | grilles Bootstrap col-sm/xl | Tables larges non scrollables, pas de PWA, pas d'offline. |
| Intégration visuelle Prim'Assistant | ❌ | composant standalone | Le chatbot n'est pas inséré dans le portail agent (l'agent doit naviguer). |

### Portail Manager

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Demandes formation en attente (vue équipe) | ✅ | manager-portal.html | Inline decision notes + Valider/Rejeter, motif rejet ≥ 3 chars. |
| Demandes documents en attente | ✅ | idem | Idem. |
| Workflow manager (instances) | ✅ | EN_ATTENTE/EN_COURS/ESCALADE | Étape, échéance, owner. |
| Indicateurs équipe synthétiques | 🟡 | actions contextuelles only | Pas de cartes hero (« 12 demandes en attente », « 3 absents cette semaine »). |
| Export CSV équipe | ✅ | exportTeam | 8 colonnes. |
| Délégation (changer owner workflow) | 🟡 | colonne owner visible | Pas d'UI pour changer en 1 clic. |
| **Vue calendrier équipe (qui est où ?)** | ❌ | — | Absent (cf. fiche 04 P5). |
| **Validation rapide congés** | 🟡 | possiblement via workflow | Pas de page dédiée « mes demandes de congés à valider ». |
| **Validation rapide évaluation 360** | ❌ | — | Absent. |

### Authentication / Login

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Form login email + password | ✅ | `login.ts:44-47` | Validators (email format, min 6 chars). |
| Password toggle | ✅ | UI | OK. |
| Messages d'erreur spécifiques | ✅ | API_UNREACHABLE, INVALID_CREDENTIALS, AUTH_SERVER_ERROR | Bon. |
| Dev fallback (dev mode) | ✅ | `environment.auth.devFallback` | Hint credentials en dev. |
| **MFA TOTP setup + saisie code** | ❌ | — | Backend prêt (cf. fiche 01), **non exposé dans login**. |
| **Reset mot de passe** (lien email) | ❌ | — | Aucun parcours. |
| **Forced password change au 1er login** | ❌ | — | Aucun. |
| **Lockout UI après tentatives échouées** | ❌ | — | Backend rate-limit ✅, mais UX ne l'explique pas. |
| **Politique mot de passe** (force, expiration) | ❌ | — | Pas affichée à la création/changement. |
| **« Se souvenir de moi » sécurisé** | ❌ | — | Stockage email en localStorage probablement. |
| **Login avec OIDC national** (Pro Connect Agent GN) | ❌ | — | Pas de bouton « Se connecter avec ma carte d'identité numérique GN ». |

### Modernization Dashboard

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Suivi propositions / taux implémentation / alertes | ✅ | `modernization-dashboard.ts` | Vue synthétique modules + IA + signaux + roadmap restante. |
| Modules RH (KPIs, capacités, alertes) | ✅ | col-xl-8 | OK. |
| IA & automatisation (signaux, sévérité, recommandation) | ✅ | col-xl-4 | OK. |
| Public cible | 🟡 | DG + cadres RH | Pas pour les agents. À renommer / déplacer dans `/admin/modernization`. |
| Lien items PY-001..PY-071 | 🟡 | via ModernizationSummary backend | Suivi visible mais pas en cards individuelles. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — RenoiRH self-service** : portail unique avec congés / formation / éval / paie / dossier en ligne | Sections présentes mais éval / objectifs / parcours absents | 🟡 |
| **France — Pro Connect Agent** | Pas de connecteur OIDC | ❌ V2+ (dépend IdP national GN) |
| **DINUM FR — Design System État** (`design.numerique.gouv.fr`) | Bootstrap générique | 🟡 Pas grave si Material guideline interne. |
| **WCAG 2.1 AA / RGAA 4.1** | Non audité | ❌ |
| **Estonia eesti.ee** : portail citoyen-fonctionnaire intégré | Portail agent isolé | ⚪ V2+. |
| **NIST 800-63B** : MFA obligatoire pour comptes administratifs, password reset par canal indépendant | Aucun MFA UI, aucun reset | ❌ |
| **OWASP ASVS L2** auth requirements | Lockout backend ✅, MFA non exposé | 🟡 |
| **Sénégal — SAGNA agent.gouv.sn** | Plus simple | À comparer. |
| **Mobile-first** (W3C Mobile Web Best Practices) | Desktop-first | ❌ |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Pas de MFA dans le login** → un mot de passe DRH/SG volé = accès complet aux dossiers de l'État. | **Critique** | Immédiat |
| R2 | **Pas de reset mot de passe** → tout reset passe par DSI (helpdesk surchargé, contournement par tickets) → mots de passe partagés. | **Critique** | Immédiat |
| R3 | **Pas de changement forcé au 1er login** → mots de passe initiaux distribués (souvent prévisibles type matricule) restent en place. | **Critique** | Immédiat |
| R4 | **Portail desktop-first** → agent en préfecture sur Android entrée de gamme = expérience cassée → contournement (re-saisie papier au DRH local). | Élevée | Continu |
| R5 | **Pas de PWA / offline** → coupure 3G en pleine demande de congé = travail perdu → frustration. | Élevée | Continu |
| R6 | **Pas de section « mes évaluations » + « mon parcours »** → la 360 et la GPEC sont invisibles à l'agent → cynisme. | Élevée | Au cycle 360 suivant |
| R7 | **Pas de droit d'accès RGPD self-service** → demandes par email DRH → traitement manuel non tracé. | Moyenne | Continu |
| R8 | **Modernization-dashboard mélangé au flux utilisateur** → confusion fonctionnelle (agents le voient ?). | Faible | Immédiat |
| R9 | **Tables non scrollables sur petits écrans** → accessibilité dégradée. | Moyenne | Continu |
| R10 | **« Se souvenir de moi » en localStorage non chiffré** → vol token sur poste partagé. | Moyenne | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **MFA TOTP UI** : (a) écran de saisie code TOTP après login si MFA requis (cf. fiche 01 P1) ; (b) écran d'enrôlement (QR code, vérification code, codes de récupération) ; (c) gestion perte d'authenticator (procédure RH manuelle tracée). | Lève R1. | **5-7 j** | **P0** | Backend TOTP OK |
| **P2** | **Reset mot de passe** : « Mot de passe oublié » → email avec lien magique signé court (15 min) → écran de saisie nouveau mot de passe + politique affichée + force-meter. Endpoint backend `/auth/password/forgot` + `/auth/password/reset`. | Lève R2. | **3-4 j** | **P0** | SMTP (cf. fiche 07 P11) |
| **P3** | **Forced password change au 1er login** : flag `User.must_change_password` ; après login, redirection forcée vers écran de changement avec politique stricte (≥ 12 caractères, classes mixtes, pas de matricule, pas dans top-10000 mots de passe HIBP). | Lève R3. | **2-3 j** | **P0** | — |
| **P4** | **Politique mot de passe affichée** : barre de force temps réel (zxcvbn), liste des règles, vérification HIBP « pwnedpasswords » (k-anonymity). | Réduit la dette. | **1-2 j** | **P0** | — |
| **P5** | **Portail agent — sections manquantes** : (a) Mes évaluations + plan de développement (cf. fiche 05 P6) ; (b) Mes objectifs ; (c) Mon parcours pro (timeline) ; (d) Mes certificats (cf. fiche 06 P3) ; (e) Mes données personnelles + droits RGPD (cf. fiche 02 P9). | Lève R6, R7. Boucle l'usage agent. | **8-12 j** | **P1** | Fiches 05, 06, 02 |
| **P6** | **Hero cards portail agent** : solde congés, prochaine formation, évaluation à compléter, dossier documents en attente — toutes en accueil, accessibles en 1 clic. | UX adoption. | **2-3 j** | **P1** | — |
| **P7** | **Prim'Assistant intégré au portail** : bulle de chat persistante en bas-droite du portail agent ; pré-rempli avec contexte utilisateur ; quick-prompts contextuels (« Demander congé », « Mon solde », « Statut de ma demande »). | Adoption Prim'Assistant. | **3-4 j** | **P1** | Fiche 07 P10 |
| **P8** | **Portail manager — hero cards et calendrier équipe** : « 5 demandes en attente », « 3 absents cette semaine », « 2 évaluations 360 à clore », « 1 conflit de planning ». Vue calendrier équipe (mini FullCalendar). | UX manager. | **3-4 j** | **P1** | — |
| **P9** | **Délégation managériale** : page « déléguer mes validations à X jusqu'au DD/MM » (intérim, congés manager). Délégué a permissions équivalentes en lecture/validation, avec audit. | Continuité service. | **3-4 j** | **P1** | RBAC |
| **P10** | **PWA Angular + service worker** : installation depuis navigateur, app shell cachée, offline read-only sur dossier consulté + soldes + notifications, sync au retour en ligne. Push notifications navigateur. | Lève R5, ouvre mobilité. | **5-7 j** | **P0** | — |
| **P11** | **Refonte responsive serrée** : audit Lighthouse mobile, refactor tables (cards sur mobile), bottom-nav sur mobile pour les sections principales, tap targets ≥ 44 px. Test sur Galaxy A05 / Tecno Spark / appareil HSDPA simulé. | Lève R4, R9. | **8-12 j** | **P0** | — |
| **P12** | **Audit RGAA 4.1 AA + corrections** : contrastes, navigation clavier, ARIA, lecteurs d'écran. Engagement public d'accessibilité publié (`/accessibilite`). | Inclusion + conformité. | **5-7 j** | **P1** | P11 |
| **P13** | **Token auth en cookie HttpOnly + Secure + SameSite=Lax** au lieu de localStorage. Refresh transparent. | Lève R10. | **2-3 j** | **P0** | Backend cookie |
| **P14** | **Modernization-dashboard déplacée vers `/admin/modernization`** + RBAC `system:modernization:view` (super_admin, hr_director only). Renommage UI « Suivi de projet » pour clarté. | Lève R8. | **0,5 j** | **P1** | — |
| **P15** | **Bouton OIDC national / SSO** (option future) : si Pro Connect Agent GN existe → bouton « Se connecter avec mon compte d'État » à côté du form local. | Préparer V2. | **5-8 j** | **P2** | IdP national |
| **P16** | **Mode kiosque préfecture** : interface simplifiée pour agents partageant un poste (1 PC pour 5 agents) — login rapide par matricule + PIN + MFA TOTP, déconnexion auto à 5 min d'inactivité. | UX terrain spécifique. | **3-4 j** | **P2** | — |

## 6. Souveraineté & UX terrain

**Souveraineté.** Aucune dépendance externe. Le portail self-service est entièrement gérable en interne. Les push notifications navigateur peuvent transiter par un serveur Web Push auto-hébergé (`webpush-py`).

**UX terrain (les vraies personae).**
- **Mariama, agent C, Préfecture de N'Zérékoré, Tecno Spark 8C, 2G/3G** : doit pouvoir consulter son solde de congés en 30 s, soumettre une demande en 2 minutes maximum, recevoir une confirmation SMS. Aujourd'hui = échec total.
- **Ibrahima, manager intermédiaire, Conakry, vieux PC sous Windows 10, IE/Edge** : doit pouvoir valider 10 demandes en 5 minutes. Aujourd'hui = OK mais pas de bulk action.
- **DG informaticien, MacBook Pro, Conakry** : utilisera Prim'Assistant, dashboards riches, exports. Aujourd'hui = bien servi.
- **DRH expérimentée, Primature, fibre optique** : bête de foire qui demandera vues croisées, exports, recherche avancée. Aujourd'hui = partiellement servi.

**Le projet est calibré pour les deux derniers profils. Il faut le redescendre sur les deux premiers.** Les propositions P10 + P11 (PWA + responsive serré) sont **P0** pour cette raison, pas un confort.

## 7. Décision recommandée

Phase **P0 (3 semaines)** : P1 + P2 + P3 + P4 (auth durcie) + P10 + P11 (PWA + responsive) + P13 (cookies sécurisés) = **26 à 38 j-h**. À l'issue, le portail est **utilisable en sécurité par tous les agents de l'État**.

Phase **P1 (4-5 semaines)** : P5 + P6 + P7 + P8 + P9 + P12 + P14 = **25-37 j-h**. Le portail devient un véritable produit pour l'agent.

Phase **P2** : P15 (OIDC) + P16 (kiosque) = différenciation et inclusion.

**Note politique forte.** Le login de l'application est la première impression du SI auprès de chaque agent et la première porte d'entrée d'un attaquant. Aujourd'hui, ce login = formulaire 1990. La pile P1 → P4 doit être livrée **avant tout déploiement en production**, sans exception.
