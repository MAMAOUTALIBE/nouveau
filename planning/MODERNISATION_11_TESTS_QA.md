# Fiche de modernisation 11 — Tests, QA & Qualité logicielle

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/tests/`, `Final/tests/e2e/`, `Final/src/**/*.spec.ts`, `Final/.github/workflows/quality.yml`, configs `pyproject.toml`/`vitest.config.mjs`/`playwright.config.ts`

## 0. Résumé exécutif

**Pyramide des tests inversée**, ce qui est le défaut #1 de QA d'un projet techniquement ambitieux : 8 fichiers de tests unitaires backend (~45 tests, mais **0 sur les services métier** leave/training/recruitment/performance/discipline/career/document/notification/workflow), **1 seul fichier d'intégration** (`test_health.py`, 4 scénarios), **2 scénarios E2E Playwright** (recruitment uniquement). Frontend : 17 specs Vitest dispersées (modules + core). **CI minimaliste** (typecheck + Vitest + build, **sans pytest, sans E2E, sans Docker push, sans rapport de couverture**). **Aucun test de charge**, **aucun audit de sécurité automatisé** (bandit en config Ruff seulement, ni semgrep, ni Snyk, ni Trivy, ni OWASP ZAP), **aucun test d'accessibilité** (axe-core, pa11y absents). Pour un SI qui ambitionne de gérer la fonction publique d'un État souverain (50 K+ agents), **cette couverture est insuffisante** ; elle doit être multipliée par 5 à 10 avant déploiement national.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Tests unitaires backend | `Final/backend/tests/unit/{test_passwords,test_tokens,test_rate_limit,test_rbac_logic,test_turnover_scoring,test_perf_360_aggregation,test_models_metadata,test_config}.py` (8 fichiers) |
| Tests intégration backend | `Final/backend/tests/integration/test_health.py` (1 fichier, 4 scénarios) |
| Tests E2E Playwright | `Final/tests/e2e/{recruitment-campaigns,recruitment-attachments}.spec.ts` (2 scénarios) |
| Tests frontend Vitest | 17 `*.spec.ts` dans `Final/src/` |
| CI | `Final/.github/workflows/quality.yml` |
| Configs qualité | `Final/backend/pyproject.toml` (Ruff, Mypy, Pytest), `Final/vitest.config.mjs`, `Final/playwright.config.ts` |

## 2. État réel (vérifié dans le code)

### Tests backend Python

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Tests unitaires socle (passwords, tokens, rate_limit, RBAC, config) | ✅ | `tests/unit/` | Bien faits. |
| Tests unitaires métier (turnover, perf 360, models metadata) | ✅ | `tests/unit/test_turnover_scoring.py`, `test_perf_360_aggregation.py`, `test_models_metadata.py` | Présents pour 3 modules métier. |
| **Tests services leave / training / recruitment / discipline / career / document / notification / workflow** | ❌ | grep | **Aucun test unitaire sur ces 8 services métier majeurs.** |
| Tests intégration | 🟡 | `integration/test_health.py` | 4 scénarios (health, security headers, OpenAPI, error format). **Aucun endpoint métier testé en intégration**. |
| DB de test | ✅ | `conftest.py` | Postgres `rh_primature_test` ; sans PG, état `degraded`. |
| Pytest-cov configuré | ✅ | `pyproject.toml:138` | Cible 75 %. |
| **Couverture rapportée en CI** | ❌ | `.github/workflows/quality.yml` | Pas de pytest, donc pas de pytest-cov en CI. |
| Ruff configuré (rules E, F, W, I, N, UP, B, C4, SIM, S, PT) | ✅ | `pyproject.toml:50-78` | Bandit (S) inclus. |
| Mypy strict | ✅ | py312 | OK. |
| Pre-commit hooks | ❌ | absence `.pre-commit-config.yaml` | Manque. |

### Tests frontend Angular

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Vitest configuré | ✅ | `vitest.config.mjs` | OK. |
| 17 specs réparties | 🟡 | `src/**/*.spec.ts` | Core (errors, guards, interceptors, security, api-client, auth-service) + 6 modules (recruitment, documents, personnel, reports, workflows, organization). |
| Composants / directives / pipes testés | ❌ | grep | Inexistant. |
| Modules leave / training / performance / careers / discipline | ❌ | — | **Pas de spec.** |
| Playwright config | ✅ | `playwright.config.ts` | OK. |
| **Scénarios E2E** | ❌ | 2 specs `recruitment-*` uniquement | **Auth flows, leave, training, personnel, workflows, documents NON couverts.** |
| ESLint | ❌ | absence `.eslintrc` | Prettier seul. |
| Prettier configuré | ✅ | `package.json:23` | OK. |

### CI / DevEx qualité

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Workflow `quality.yml` | 🟡 | `.github/workflows/quality.yml:1-33` | Étapes : checkout, setup Node, npm ci, typecheck, vitest, build. |
| Pytest dans CI | ❌ | — | Pas exécuté en CI. |
| Tests E2E dans CI | ❌ | — | Pas exécutés en CI (manuels seulement). |
| Build Docker dans CI | ❌ | — | Pas de `docker build`. |
| Push image registry | ❌ | — | Aucun. |
| Test Alembic upgrade/downgrade | ❌ | — | Aucun. |
| Matrix Node version + OS | ❌ | — | Aucun. |
| Rapport de couverture (Codecov, badge) | ❌ | — | Aucun. |

### Sécurité, charge, accessibilité

| Élément | État | Commentaire |
|---|---|---|
| Bandit (via Ruff S rules) | 🟡 | Local seulement. Pas de gating CI. |
| Semgrep / SonarQube | ❌ | Aucun. |
| Snyk / Dependabot dépendances | ❌ | Aucun (vérifier si Dependabot activé sur GitHub). |
| Trivy scan image Docker | ❌ | Aucun. |
| OWASP ZAP / Burp pen-test | ❌ | Aucun. |
| Tests de charge (locust, k6, gatling) | ❌ | Aucun. |
| Tests d'accessibilité (axe-core, pa11y, Lighthouse CI) | ❌ | Aucun. |
| Tests de mutation (mutmut, Stryker) | ❌ | Aucun. |
| Tests de contrat (Pact) front ↔ back | ❌ | Aucun. |
| Bug bounty / programme divulgation responsable | ❌ | Aucun. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **DGNUM FR — référentiel qualité projet** : tests pyramidaux, couverture min 80 %, sécurité automatisée | Pyramide inversée, ~30-40 % couverture estimée | ❌ |
| **France — DINSIC Sécurité Numérique** audit pen-test annuel obligatoire pour SI sensibles | Aucun audit | ❌ |
| **OWASP SAMM** (Software Assurance Maturity Model) — niveaux 1-3 | Niveau 1 partiellement | 🟡 |
| **NIST SP 800-218** SSDF (Secure Software Development Framework) | Quelques contrôles | 🟡 |
| **ISO/IEC 25010** (qualité logicielle) — fonctionnalité, fiabilité, performance, sécurité | Évaluation incomplète | 🟡 |
| **WCAG 2.1 / RGAA 4.1** automatisé | Aucun | ❌ |
| **Estonia e-Government testing standards** | Niveau bas | ❌ |
| **Sénégal/Rwanda — programmes bug bounty** | Aucun | ❌ |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Régression métier en production** : modification du service leave casse le workflow approbation, **0 test ne le détecte**. | **Critique** | À chaque PR |
| R2 | **Vulnérabilité dépendance non détectée** : faille critique CVE Anthropic SDK, FastAPI, SQLAlchemy → bénin pendant des mois. | **Critique** | Continu |
| R3 | **Effondrement sous charge** : 1 000 demandes de congé en 1 minute après un week-end → API timeout → utilisateurs ressaisissent → cascade. | Élevée | Premier lundi de mois |
| R4 | **Migration Alembic défaillante** non détectée → corruption schéma en prod. | Élevée | À chaque migration |
| R5 | **Pen-test pas réalisé** → vulnérabilité OWASP exploitée par un attaquant motivé (état adverse, désinformation). | Élevée | Continu |
| R6 | **Inaccessibilité aux personnes handicapées** → contestation associative + image négative. | Moyenne | Au déploiement |
| R7 | **Build Docker sans Trivy** → image base avec CVE haute non détectée → conteneur compromis. | Moyenne | À chaque build |
| R8 | **Pas de pre-commit** → code non formaté en commit, lint cassé en PR. | Faible | Continu |
| R9 | **Pas de tests de contrat front ↔ back** → backend renomme un champ, front muet. | Moyenne | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Couverture tests unitaires services métier ≥ 70 %** : leave, training, recruitment, performance, discipline, career, document, notification, workflow. Pytest async, fixtures conftest réutilisables, factory_boy pour modèles. **Bench couverture** : 0 % → 70 %. | Lève R1. | **15-20 j** | **P0** | — |
| **P2** | **CI étendue** : ajouter étapes pytest unit + integration (PG ephemeral via service container), Alembic upgrade/downgrade test, build Docker, Trivy scan, push image vers registry (sur main et tags), publication couverture (Codecov ou badge), rapport JUnit. Workflow séparé `release.yml` pour push image. | Lève R4, R7. Industrialise. | **5-7 j** | **P0** | Registry |
| **P3** | **Suite E2E Playwright complète** : 8 scénarios par module métier majeur (login → flux complet → vérification audit) sur leave, recruitment, training, performance, discipline, careers, documents, organization. Sharding sur CI. Données de test réinitialisées via fixtures Pytest. | Lève R1. Confiance déploiement. | **10-15 j** | **P0** | P2 |
| **P4** | **Pen-test externe** : missionner un cabinet (Synacktiv FR, ITrust, ou africain : Crowdsec/Lyqo) pour audit OWASP Top 10 + revue archi avant cutover prod. Plan de remédiation. | Lève R5. Conformité publique. | **10-15 j** + budget externe | **P0** | Décision politique |
| **P5** | **Tests de charge k6** : 5 scénarios standards (login storm, demandes congé pic mensuel, recherche dossiers, dashboard concurrentiel, upload OCR). Cibles : p95 < 500 ms, p99 < 2 s, 0 % erreur jusqu'à 5000 utilisateurs concurrents. Dashboard Grafana k6. | Lève R3. SLA crédible. | **5-7 j** | **P0** | k6, Grafana |
| **P6** | **Sécurité automatisée CI** : (a) Snyk ou GitHub Advanced Security pour SCA dépendances, (b) Semgrep règles OWASP Top 10 + custom RH (ex: leak data en réponse), (c) Trivy image Docker avec CRITICAL = échec, (d) Bandit en gating (déjà via Ruff, à renforcer). | Lève R2. | **3-4 j** | **P0** | — |
| **P7** | **Tests d'accessibilité automatisés** : axe-core dans Playwright (chaque page principale audit a11y), Lighthouse CI sur build avec budget (perf > 80, a11y > 90, best-practices > 85, SEO > 80). | Lève R6. | **3-4 j** | **P1** | — |
| **P8** | **Pre-commit hooks** : `.pre-commit-config.yaml` avec ruff, prettier, mypy stricte, secrets scan (gitleaks), conventional commits (commitlint). Onboarding `pre-commit install`. | Lève R8. Hygiène équipe. | **1 j** | **P1** | — |
| **P9** | **ESLint Angular** : config recommandée @angular-eslint + règles métier (no console.log en prod, no any, RxJS rules). | Hygiène frontend. | **1-2 j** | **P1** | — |
| **P10** | **Tests de contrat OpenAPI** : `dredd` ou `schemathesis` qui valide chaque endpoint contre l'OpenAPI. CI rejette les écarts spec ↔ implémentation. | Lève R9 partiellement. | **3-4 j** | **P1** | — |
| **P11** | **Programme de divulgation responsable** : page publique `/security` avec PGP key, contact, scope, policy. Hébergement sur YesWeHack ou Bug Bounty Africa (HackerOne difficilement accessible Afrique francophone). | Lève R5 long terme. | **2 j** + politique | **P2** | Validation Cabinet |
| **P12** | **Tests de mutation (mutmut)** : sur les modules sécurité (passwords, tokens, RBAC) — détecter tests qui « passent à côté » de la logique réelle. | Qualité tests. | **3-4 j** | **P2** | P1 |
| **P13** | **Smoke tests post-déploiement** : 10 endpoints critiques testés automatiquement après chaque déploiement (auth, dashboard, list agents, list congés, etc.). Alerte Slack/email si KO. | Détection régression production. | **2 j** | **P1** | CD |
| **P14** | **Données de test réalistes** : seed `seed_test_realistic.py` avec ~500 agents synthétiques (noms guinéens crédibles, structures Primature) pour tester volumétrie intermédiaire. | Tests E2E + démos. | **3 j** | **P1** | Faker FR + dataset noms guinéens |

## 6. Souveraineté & UX terrain (équipe technique)

**Souveraineté.** Tous les outils proposés sont auto-hébergeables (k6, Grafana, Trivy, Semgrep CE, Bandit, Snyk Open Source, Pact Broker, axe-core). Le pen-test externe est le seul élément où le choix d'un prestataire africain (vs européen) est à privilégier pour la souveraineté.

**UX équipe technique.**
- Tests rapides (< 5 min sur PR) : sharding CI, mocks pour les tests externes (LLM, SMTP).
- Tests E2E doivent être **stables** : sinon elles seront désactivées par les développeurs frustrés. Investir dans la robustesse (retries, attentes explicites, isolation données).
- Documentation `CONTRIBUTING.md` : comment lancer chaque type de test localement, comment ajouter un test.

## 7. Décision recommandée

Phase **P0 (5-6 semaines)** : P1, P2, P3, P4, P5, P6 = **48-68 j-h** + budget pen-test externe. Sans cela, **le déploiement national est techniquement irresponsable**.

Phase **P1 (3 semaines)** : P7, P8, P9, P10, P13, P14 = **13-18 j-h**. Industrialise la qualité.

Phase **P2** : P11, P12 = excellence.

**Note politique.** Le pen-test externe (P4) est aussi un **acte de confiance publique**. Communiquer « le SIRH de la Primature a été audité par un cabinet indépendant et a corrigé X vulnérabilités identifiées » est plus rassurant que « notre équipe interne pense que c'est sécurisé ». À budgétiser explicitement dans la conduite de projet.

**Ordre suggéré dans P0 :**
1. P2 (CI) immédiatement — débloque le reste.
2. P1 (tests métier) en parallèle d'autres travaux Vague A.
3. P3 (E2E) après P1.
4. P5 (charge) avant la fin Vague A pour sizing infra.
5. P4 (pen-test) avant cutover prod.
6. P6 (sécu CI) en continu.
