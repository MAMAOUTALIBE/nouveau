# Synthèse — Plan de modernisation GPA-GOUVE (RH Primature de Guinée)

> Audit code réel — 2026-05-10 — Architecte logiciel senior / consultant GovTech
> Méthode : inspection module par module du code à `Final/` (Angular 21 + FastAPI Python), cf. fiches `MODERNISATION_01..13`.
> **Révision v3** — ajout des fiches 10 à 13 (Données SQL, Tests/QA, DevOps/Continuité, Conduite du changement & Conformité) — domaines structurels initialement omis.
> **Révision v2** — ajout des fiches 08 (Organisation & Postes) et 09 (Self-service & Authentification UI) initialement omises.

## 1. Verdict général

**État de maturité : 70-75 % d'un produit GovTech de référence.**

Le projet est **nettement au-dessus de la moyenne** des SIRH des administrations publiques francophones :
- Architecture **Hexagonale propre** côté backend Python (ports/adapters pour LLM, OCR, signature, storage, email, workflow) — choix qui rend la souveraineté triviale (basculer Anthropic→Ollama, S3→MinIO, etc. = configuration).
- **RBAC granulaire** (5 scopes hiérarchiques, permissions fines) appliqué à 95,9 % des endpoints backend.
- **Audit transactionnel persistant** avec before/after JSONB (table `hr.audit_logs`).
- **Anonymat structurel certifié pour la 360°** — c'est rare et excellent.
- **Matching CV par LLM avec garde-fous anti-discrimination explicites + validation humaine obligatoire** — supérieur aux pratiques courantes.
- **Migration FastAPI déjà bien avancée** (services par domaine, modèles SQLAlchemy, Alembic, Docker multi-stage, CI GitHub Actions).

Mais **cinq familles de manques bloquent la mise en production réelle d'État** :

1. **La couche statutaire de la fonction publique guinéenne est absente.** Pas de table `corps`/`grade`/`échelon`/`indice`, sanctions disciplinaires en string libre, avancement à l'ancienneté non automatisé. Le SIRH est un SI RH générique, pas un SIRH d'État. Sans cette couche, paie, avancement et discipline sont contestables.

2. **La sécurité pré-prod a 4 trous concrets** : rate-limit en mémoire (HA impossible), CSP/HSTS absents, MFA non obligatoire pour les rôles critiques, audit non scellé (un admin compromis peut altérer la trace).

3. **Le « dernier kilomètre » opérationnel n'est pas livré** : notifications email/SMS jamais envoyées (worker arq absent), portail candidat externe inaccessible (auth requise), commissions de recrutement en localStorage frontend, certificats de formation jamais générés en PDF, calendrier guinéen / Hadj absents, frontend perf/carrière encore mock-only par endroits.

4. **Les fondations d'exploitation sont sous-investies** : pyramide des tests inversée (0 test sur les services métier majeurs), CI minimaliste (pas de pytest, pas de docker push, pas de couverture), **aucun backup ni PRA**, secrets en clair dans Kubernetes, pas de Prometheus/alerting, données SQL non partitionnées et sans chiffrement colonne, pas d'index GIN sur 45 champs JSONB.

5. **La dimension publique du service public est absente** : aucune page légale (mentions, CGU, confidentialité, cookies, accessibilité, security.txt), aucun registre des traitements RGPD, aucune DPIA pour les algos sensibles (turnover, LLM matching CV, 360°), aucune déclaration CNPDP-GN, aucun manuel utilisateur, aucun plan de formation, aucun plan de déploiement national, aucun SLA, aucun comité de pilotage formalisé, app à 100 % en français unilingue.

**Ces cinq familles représentent 350-500 jours-homme de travail bien identifié** (incluant budgets juridique + audit a11y + production vidéos + pen-test + infrastructure DR). En face : un investissement défendable pour un SI qui prétend gérer la fonction publique d'un État souverain.

## 2. Tableau croisé fiches × état

| # | Module | État global | Note (/10) | Top défaut bloquant | Top atout |
|---|---|---|---|---|---|
| 01 | Socle technique | 🟡 | 7,5 | Rate-limit mémoire + CSP/HSTS absents + MFA optionnel | Ports/adapters, audit transactionnel, Docker prod-ready |
| 02 | Personnel & Dossiers | 🟡 | 6,5 | Pas de couche statutaire FP-GN ; signature non-eIDAS | Modèle 360 riche, turnover explicable, ports OCR/Signature/PDF |
| 03 | Recrutement & Onboarding | 🟡 | 7 | Portail externe derrière auth ; commissions en localStorage | Matching CV LLM avec anti-discrim ; conversion atomique |
| 04 | Congés & Temps | 🟡 | 6 | Pas de calendrier guinéen / Hadj ; auto-approbation non câblée ; notifications absentes | Modèle de couverture service avancé ; règles auto-approbation prêtes |
| 05 | Performance, Carrière, Discipline, GPEC | 🟡 | 7 | Discipline sans référentiel statutaire ; avancement auto absent ; frontend mock-only | 360° anonymisée structurellement ; GPEC avec snapshots d'écarts |
| 06 | Formation | 🟡 | 6,5 | Certificats jamais générés en PDF ; éval froid jamais relancée ; pas de UI éval | Modèle complet incluant J+90 ; endpoints publics anonymes prêts |
| 07 | Transverses (BPMN/GED/IA/Notif/Reports/Admin) | 🟡 | 7 | Notifications jamais envoyées ; SpiffWorkflow non câblé ; pas d'API Gateway | Hexagonal partout, Prim'Assistant avec contrôle d'autorisation, GED complète |
| 08 | Organisation & Postes | 🟡 | 6 | Aucune dimension budgétaire ; libellés libres ; pas de versioning organigramme | Hiérarchie N niveaux, org-chart visuel, audit, cycle-detection |
| 09 | Self-service Agent/Manager + Authentification UI | 🟡 | 5,5 | **Login sans MFA / sans reset / sans 1st-login** ; portail desktop-first ; sections agent incomplètes | Portail agent branché aux services réels, manager-portal avec inline validation |
| **10** | **Données & Architecture SQL** | 🟡 | **6,5** | **Pas de partition audit_logs ; pas de chiffrement colonne ; pas de purge ; pas d'index GIN JSONB** | 43 tables, 3 vues, 28 triggers, 63 index, doctrine de rétention modélisée |
| **11** | **Tests, QA & Qualité** | 🟡 | **4** | **Pyramide inversée : 0 test sur services métier ; CI sans pytest ; pas de tests charge ; pas d'audit sécu** | Ruff + Mypy strict, conftest fixtures, 17 specs Vitest, infra Playwright OK |
| **12** | **DevOps, Déploiement, Continuité** | 🟡 | **5** | **AUCUN backup ; AUCUN PRA ; secrets en clair ; pas de CD ; pas de HPA/PDB/NetworkPolicy** | Dockerfile multi-stage non-root ; docker-compose orchestré ; Helm chart versionné ; CUTOVER documenté |
| **13** | **Conduite changement, i18n, Accessibilité, Conformité légale** | 🟡 | **3** | **Aucune page légale ; aucun DPO/DPIA/registre CNPDP-GN ; aucun manuel utilisateur ; aucun plan déploiement ; mono-langue sans config i18n** | Doc technique solide (2 911 lignes) ; @angular/localize installé ; 470 attributs ARIA |

**Score moyen : 5,9 / 10** (vs 6,5 avant — la note baisse fortement parce que les fondations transverses sont les plus négligées).

**Cible réaliste à 12 mois : 8,5-9 / 10.**

**3 modules les plus faibles** :
1. **Conduite du changement / Conformité (13)** = 3/10. Sans cela, **le projet n'est pas un service public** mais un logiciel interne.
2. **Tests, QA & Qualité (11)** = 4/10. Sans cela, **chaque release est un saut dans le vide**.
3. **DevOps, Déploiement, Continuité (12)** = 5/10. Sans backup ni PRA, **une seule panne grave perd 50 K dossiers**.

Ce triple déséquilibre — **fondations techniques applicatives solides, fondations d'exploitation et de gouvernance sous-investies** — est le défaut typique des projets d'État pilotés par des équipes développement back-end sans sponsor opérationnel et sans cadrage public. **C'est à corriger en priorité, avant toute extension fonctionnelle.**

## 3. Roadmap consolidée 3 vagues

### Vague A — Bloquante mise en production (8-10 semaines, ~135-185 j-h)

**Objectif :** faire tomber les risques juridiques et sécuritaires, débloquer l'usage opérationnel quotidien, rendre le SI utilisable par tous les agents (pas que par la DRH centrale).

| # | Action | Fiche | Effort | Effet |
|---|---|---|---|---|
| A1 | MFA obligatoire rôles critiques + Refresh rotatif + Redis rate-limit | 01 P1, P3 | 5-7 j | Auth durcie |
| A2 | CSP + HSTS + CORS strict + cookies HttpOnly | 01 P2 | 1-2 j | Headers |
| A3 | `permissionGuard` sur les 9 modules Angular manquants | 01 P5 | 2 j | UI cohérente RBAC |
| A4 | Logs RGPD-aware (PII stripping middleware) | 01 P9 | 1 j | Conformité |
| A5 | Tables statutaires FP-GN (corps/grade/échelon/indice) + migration | 02 P1, 05 P3-P4 | 8-12 j | Avancement, paie correctes |
| A6 | Signature PAdES réelle + horodatage RFC 3161 | 02 P2 | 10-15 j | Valeur probante |
| A7 | Hardening uploads (ClamAV + magic + qpdf + Pillow strip) | 02 P4 | 3-4 j | Sécurité fichiers |
| A8 | Modèle backend `RecruitmentCommission` + signature PV | 03 P1, P8 | 8-12 j | Concours opposable |
| A9 | Endpoint public candidature + hCaptcha + scan AV + accusé PDF | 03 P2 | 5-7 j | Portail candidat externe ouvert |
| A10 | Calendrier guinéen + type Hadj + branchement auto-approbation + notifications congé | 04 P1-P4 | 10-14 j | Module congés utilisable |
| A11 | Référentiel sanctions FP-GN + prescription | 05 P1, P2 | 5-7 j | Discipline opposable |
| A12 | Branchement frontend perf/carrière aux APIs (sortie du mock) | 05 P5 | 5-7 j | Cycle 360 utilisable |
| A13 | Génération PDF certificats + UI éval + scheduler éval froid + trigger éval chaud | 06 P1-P5 | 11-16 j | Cycle formation complet |
| A14 | Worker arq email + templates Jinja2 + triggers métier + adapter SMS GN | 07 P11-P15 + 13 | 15-20 j | SI parle aux utilisateurs |
| A15 | Recherche FTS PostgreSQL sur GED | 07 P4 | 3-4 j | GED utilisable |
| A16 | Bascule Ollama par défaut pour LLM | 07 P7 | 3 j | Souveraineté IA |
| **A17** | **Dimension budgétaire postes + référentiel fonctions FP-GN + versioning organigramme + brouillons backend** | **08 P1, P2, P3, P4** | **24-34 j** | **Pilotage budgétaire et statistique inter-min** |
| **A18** | **MFA UI + Reset MdP + Forced 1st-login + Politique MdP affichée + Cookie HttpOnly** | **09 P1-P4, P13** | **13-19 j** | **Login enfin défendable** |
| **A19** | **PWA Angular + Refonte responsive serrée mobile** | **09 P10, P11** | **13-19 j** | **Agent en préfecture peut utiliser le SI** |
| **A20** | **Partition audit_logs/notifications/document_versions + Index GIN JSONB + Chiffrement at-rest colonnes sensibles + Worker purge RGPD** | **10 P1-P4** | **18-25 j** | **Données tenant à 10 ans + RGPD-GN** |
| **A21** | **Tests métier (services leave/training/recrutement/perf/discipline/etc.) ≥ 70 % + CI étendue (pytest, Trivy, docker push) + Suite E2E 8 modules + Pen-test externe + Tests de charge k6 + Sécurité automatisée CI** | **11 P1-P6** | **48-68 j** + budget pen-test | **Confiance pré-prod, SLA crédible** |
| **A22** | **Backup PG + Backup MinIO + PRA site secondaire + Secrets (sealed/SOPS) + CD pipeline + HPA/PDB/NetworkPolicy + Décision hosting souverain** | **12 P1-P6, P12** | **30-40 j** + budget infra DR | **Aucune perte de données, continuité d'État** |
| **A23** | **Pages légales + DPO + Registre + 3 DPIA + Droits agent self-service + Bandeau cookies + Manuel utilisateur + Plan formation + Audit RGAA + Plan déploiement + Comité pilotage** | **13 P1-P5, P7, P11, P16, P18, P19** | **50-65 j** + budgets juridique/a11y | **Service public réel, juridiquement opposable** |

**Total Vague A : ≈ 305-410 j-h** + budgets externes (pen-test, juridique, audit a11y, infrastructure DR), équipe de 4-6 ETP : **12-16 semaines**.

À l'issue : application **mettable en production réelle pour la Primature et déployable jusqu'aux préfectures**, avec sécurité, valeur juridique, continuité de service, qualité industrielle et appropriation publique attendues.

### Vague B — Excellence GovTech (8-10 semaines, ~95 j-h)

**Objectif :** passer de « utilisable » à « référence francophone ».

| # | Action | Fiche | Effort |
|---|---|---|---|
| B1 | Scellement audit (Merkle quotidien Ed25519 + WORM) | 01 P4 | 5-7 j |
| B2 | Purge / archivage RGPD-GN automatisé | 02 P6 + 07 P5 | 7-10 j |
| B3 | Prometheus `/metrics` + dashboard Grafana + alerting | 01 P7 | 3 j |
| B4 | Healthcheck composé + RBAC dépendants chiffré pgcrypto + état civil structuré | 01 P8, 02 P5, P11 | 5 j |
| B5 | Templates PDF officiels (en-tête République + filigrane + QR) | 02 P8 | 3-4 j |
| B6 | Portail self-service données personnelles (RGPD-GN) | 02 P9 | 5-7 j |
| B7 | DPIA recrutement + anonymisation CV pour LLM | 03 P5, P6 | 6-7 j |
| B8 | Onboarding backend + déclenchement automatique post-embauche | 03 P3, P4 | 8-10 j |
| B9 | Accessibilité RGAA portail externe | 03 P10 | 5-7 j |
| B10 | Vues différentiées congés (agent/manager/DRH heatmap) + pré-vérification + quotas par grade + continuité ministérielle | 04 P5-P8, P10 | 14-20 j |
| B11 | Plans de développement + recours discipline + référentiel métiers FP-GN + lien GPEC→formation + dashboard exécutif RH | 05 P6-P10 | 22-31 j |
| B12 | Plan de formation annuel + coût + mutualisation inter-min + ISO 30414 + Kirkpatrick 4 | 06 P6-P11 | 25-32 j |
| B13 | SpiffWorkflow + 5 modèles BPMN officiels + RAG Prim'Assistant + streaming + intentions étendues | 07 P1, P8, P9, P10 | 18-22 j |
| B14 | API Gateway + webhooks sortants Trésor/État Civil | 07 P22, P23 | 11-16 j |
| B15 | Indicateurs ISO 30414 complets + exports CSV/Excel/PDF standardisés + page admin-audit enrichie | 07 P16, P17, P19 | 16-23 j |
| **B16** | **Alerte vacance + workflow création/suppression poste + bouton « lancer recrutement » + seed Primature réel + indicateurs ISO 30414 effectifs** | **08 P5-P8, P10** | **15-20 j** |
| **B17** | **Sections portail agent (mes éval, objectifs, parcours, certificats, RGPD) + Hero cards + Prim'Assistant intégré + Manager hero+calendrier + Délégation managériale + RGAA AA + Modernization vers /admin** | **09 P5-P9, P12, P14** | **25-37 j** |
| **B18** | **Rôles PostgreSQL applicatifs + Tables référentielles ISO + Audit FK CASCADE + JSON Schema sur JSONB + Plan d'exécution capturé + Read replica + Soft-delete cohérent** | **10 P5-P8, P10, P12, P13** | **23-31 j** |
| **B19** | **Tests a11y CI + Pre-commit + ESLint + Tests de contrat OpenAPI + Smoke tests post-deploy + Données de test réalistes** | **11 P7-P10, P13, P14** | **13-18 j** |
| **B20** | **Stack logs centralisée (Loki/Grafana) + Alerting Alertmanager + Runbooks d'incident + Retrait définitif mock Node + Frontend séparé + PostgreSQL HA + GitOps ArgoCD** | **12 P7-P11, P14, P16** | **30-43 j** |
| **B21** | **Cadre éthique IA RH + Tutoriels vidéo + Aide contextuelle in-app + Centre d'aide en ligne + Charte d'utilisation + i18n Angular activée + Backend i18n + Tests a11y intégrés + Communication politique + SLA + Référents fonctionnels** | **13 P6, P8-P10, P12, P13, P14, P17, P20-P22** | **35-50 j** |

**Total Vague B : ≈ 316-432 j-h** (équipe de 4 ETP : 16-22 semaines).

À l'issue : **référence GovTech francophone**, comparable aux meilleures pratiques DINUM FR / Marina Sénégal / Estonia.

### Vague C — Différenciation et écosystème (au-delà)

| # | Action | Fiche |
|---|---|---|
| C1 | OIDC national / Pro Connect Agent guinéen | 01 P10 |
| C2 | WAF + mTLS pour intégrations gouvernementales | 01 P11 |
| C3 | Badges QR signés + OCR Tesseract enrichi langues nationales | 02 P10, P12 |
| C4 | Dashboard transparence concours public (open data) + anti-fraude | 03 P9, P11 |
| C5 | Module Time / pointage léger mobile | 04 P9 |
| C6 | iCal congés + Allaitement | 04 P11, P12 |
| C7 | Anonymisation 360 prouvée cryptographiquement | 05 P11 |
| C8 | Modeleur visuel BPMN bpmn-js + versioning A/B | 07 P2, P3 |
| C9 | Visionneuse PDF inline + diff versions GED | 07 P6 |
| C10 | Open data RH gouvernance ouverte | 07 P18 |
| C11 | SSE dashboards + heatmaps stratégiques | 07 P20, P21 |
| C12 | Connecteur État Civil GN (RAVEC) | 07 P24 |
| C13 | Page publique organigramme open data + carte préfectures Leaflet + édition drag-and-drop | 08 P9, P11, P12 |
| C14 | OIDC national (Pro Connect Agent GN) + mode kiosque préfecture | 09 P15, P16 |
| C15 | Index couvrants + tablespace tiering + Diagrammes ERD générés CI | 10 P9, P11, P14 |
| C16 | Programme bug bounty + Tests de mutation | 11 P11, P12 |
| C17 | MailHog + Ollama dans compose dev + Service mesh Linkerd | 12 P13, P15 |
| C18 | Audio Prim'Assistant en langues nationales (Pular/Soussou/Malinké) | 13 P15 |

## 4. Sept principes structurants à respecter

1. **Toujours le statut avant le digital.** Aucune fonctionnalité d'avancement / sanction / paie ne doit être livrée tant que la couche statutaire FP-GN n'est pas modélisée et seedée.

2. **Souveraineté par défaut, pas en option.** En production : `LLM_PROVIDER=ollama`, `STORAGE_PROVIDER=minio`, `SIGNATURE_PROVIDER=endesive_local`, `OCR_PROVIDER=tesseract`, `EMAIL_PROVIDER=smtp`, `SMS_PROVIDER=orange_gn`. Les adapters cloud (Anthropic, S3, Universign) sont **opt-in nominatifs** documentés et validés par DPO.

3. **Notification = engagement.** Toute action métier (congé approuvé, formation invitée, sanction prononcée, candidature changée d'état) doit produire une notification multicanale (email + SMS + inbox SI). Sinon le SI est silencieux et ne sera pas adopté.

4. **Audit = preuve, pas trace.** Le journal d'audit doit être scellé (hash chaîné Merkle + signature Ed25519) et archivé en WORM. Sans cela, l'audit n'a pas de valeur en contentieux administratif.

5. **Pas de production sans backup, sans PRA, sans tests métier.** Le triptyque opérationnel non négociable : sauvegarde quotidienne + site de reprise + tests automatisés des services critiques. Une perte de dossiers d'agents est irréversible politiquement.

6. **Service public = pages légales + DPO + manuel utilisateur + plan de déploiement.** Sans ces quatre éléments, c'est un logiciel interne, pas un service public numérique. Cette transformation se fait en parallèle du dev, pas après.

7. **Couche transverse (donnée, qualité, devops, gouvernance) ≥ 40 % de l'effort total.** Le projet a sur-investi le code applicatif et sous-investi tout le reste. Le rééquilibrage est urgent.

## 5. Risques de gouvernance projet

| Risque | Mitigation |
|---|---|
| Tentation d'enchaîner Vague C avant de finir Vague A → produit séduisant en démo, indéfendable en prod | Gouvernance par jalons fermés ; aucune feature C tant que A non livrée. |
| Décision politique « on lance en prod tout de suite » avant fin Vague A | Refus argumenté avec liste précise R1-R10 par fiche ; chaque risque doit être accepté formellement par DRH + DSI. |
| Concentration des connaissances métier RH-GN dans 1 ou 2 personnes | Atelier hebdomadaire DRH-DSI ; documentation en français des décisions statutaires. |
| LLM Anthropic activé en prod par ignorance | Refuser par défaut côté Pydantic Settings (validator interdit `LLM_PROVIDER=anthropic` si `ENV=production` sans flag explicite `LLM_PROVIDER_PROD_OVERRIDE=true` documenté). |
| Évolutions statut FP-GN postérieures à mise en service | Conception des tables `civil_service_*` versionnée (date_debut/date_fin), historique conservé. |
| Dépendance forte au prestataire SMS Orange GN | Adapter `SMS_PROVIDER` pluggable (3 providers minimum) + circuit breaker. |

## 6. Indicateurs de succès à 12 mois

| Indicateur | Cible |
|---|---|
| Couverture des 5 modules opérationnels (Personnel, Congés, Recrutement, Formation, Performance) en production réelle | 100 % |
| Score de couverture statutaire FP-GN | ≥ 90 % des champs requis modélisés et seedés |
| MFA effective sur rôles critiques | 100 % |
| Notifications délivrées (email + SMS) | ≥ 95 % de taux de délivrabilité |
| Conformité loi 037/AN/2016 (registre, droits, purge) | Documentée et auditée par CNPDP-GN |
| Adoption agents (logins uniques mensuels / effectif) | ≥ 70 % |
| Taux de complétion 360° | ≥ 65 % |
| Taux de réponse éval froid J+90 | ≥ 50 % |
| Disponibilité applicative | ≥ 99,5 % (4 h/an d'indisponibilité) |
| Délai moyen de traitement demande de congé | ≤ 48 h |

## 7. Conclusion

Le projet GPA-GOUVE est un **bon projet GovTech applicatif**, structurellement bien conçu, en avance sur la moyenne francophone côté code métier — mais il **n'est pas encore un service public numérique d'État guinéen**, faute des couches statutaires, sécuritaires, opérationnelles, qualité et publiques précisées dans les 13 fiches.

**305-410 jours-homme** + budgets externes (pen-test, juridique, audit a11y, infrastructure DR) investis sur la Vague A (sécurité auth complète, statut FP-GN, signature, notifications, calendrier guinéen, organigramme budgétaire, PWA mobile, login MFA, partition + chiffrement données, tests + pen-test, backup + PRA, pages légales + DPO + manuel + plan déploiement) le rendent **mettable en production sur tout le territoire**.

**316-432 jours-homme supplémentaires** sur la Vague B le hissent au rang de **référence GovTech francophone**, exportable vers d'autres administrations CEDEAO.

**Total Vagues A+B : 620-840 j-h**, soit **5 à 8 trimestres avec une équipe de 4-6 ETP** + budgets externes structurants.

**C'est ambitieux mais défendable.** L'alternative — déployer en l'état actuel — exposerait l'État guinéen à des risques juridiques, sécuritaires et politiques disproportionnés.

**Note de conduite de projet finale.** Cette synthèse révisée v3 contient 13 fiches couvrant 18 modules Angular, 19 APIs backend, et 4 domaines transverses (données, qualité, exploitation, gouvernance). Le **risque principal est qu'un sponsor politique pressé décide de couper la Vague A en deux** pour aller en production plus tôt. **Refuser ce raccourci.** Aucune des 23 actions A1-A23 n'est négociable. Toutes sont là parce qu'elles correspondent à un risque réel qui se manifestera dans les 12 mois suivant la mise en service.

— Fin de la synthèse révisée v3. —
