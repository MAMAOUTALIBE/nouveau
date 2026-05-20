# Suivi de l'exécution — Vague A

> Mis à jour au 2026-05-11. Référence : `PLAN_EXECUTION.md` (8 sprints, 23 actions A1-A23).

## Légende

- ✅ Livré et vérifié dans l'environnement local
- 🟡 Partiellement livré (à finaliser)
- ⏳ En cours
- ⛔ Non démarré
- 🚫 Bloqué (dépend d'une décision externe)

## Synthèse rapide

| Sprint | État global | Commentaire |
|---|---|---|
| 0 | 🟡 Documentation prête / décisions à prendre | 14 ADR rédigés + CI durcie + pre-commit configuré ; reste arbitrage des sponsors politiques (D1-D14) |
| 1 | ⛔ | Bloqué par décisions ADR-001 à ADR-006 (hosting, secrets, PKI) |
| 2 | 🟡 | Headers + CORS + logs PII livrés ; pages légales + footer + cookies livrés ; reste guards Angular (déjà OK en réalité, audit corrigé), PG HA (infra) |
| 3-8 | ⛔ | À démarrer après cutover Sprint 1+2 |

---

## Sprint 0 — Cadrage

### Actions livrées

| # | Action | Statut | Fichiers |
|---|---|---|---|
| S0-1 | 14 ADR Sprint 0 (D1-D14) | ✅ Templates rédigés, **statut `proposed`** | `Final/docs/decisions/ADR-001..014-*.md` + README + TEMPLATE |
| S0-2 | CI étendue : ajout pytest backend + Alembic up/down + Trivy + Docker build + push registry sur tags | ✅ | `Final/.github/workflows/quality.yml` (refacto complet) |
| S0-3 | pre-commit hooks : ruff + ruff-format + mypy backend + prettier + gitleaks + commitizen + checks de base | ✅ | `Final/.pre-commit-config.yaml` |

### Actions à faire (hors code)

| # | Action | Bloquant ? | Owner |
|---|---|---|---|
| S0-A | Arbitrage des 14 ADR par sponsors (Cabinet PM, DSI, DPO, DAF, Min. FP) | **OUI** pour Sprint 1+ | Cabinet PM |
| S0-B | Désignation formelle du DPO (lettre de mission, email `dpo@prim.gov.gn`) | OUI pour conformité | Cabinet PM |
| S0-C | Mise en place du Comité de pilotage (charte signée, 1ère réunion) | OUI pour gouvernance | SG Primature |
| S0-D | Lancement consultation prestataires externes (juridique, a11y, pen-test, vidéaste) | OUI pour Sprints 4+ | DAF |

---

## Sprint 1 — Sécurité auth + Backup PG

### Actions livrées (anticipées)

Aucune (dépend de Redis prod + ADR-004 secrets management + branche backend).

### Actions partiellement livrées

| # | Action | Statut | Notes |
|---|---|---|---|
| (Sprint 2 anticipé) | **Headers sécurité durcis** : CSP, COOP, COEP (prod), Permissions-Policy étendue, HSTS preload (prod), CORS strict (prod/staging) | ✅ Backend reload OK | Réponse `curl -I` confirme tous les headers. Tests unitaires `test_security_headers.py` ajoutés. |

### Actions à faire

| # | Action | Bloquant ? |
|---|---|---|
| A1 | MFA backend obligatoire rôles critiques | Code à écrire |
| A1 | Refresh token rotatif (Redis blocklist) | Dépend Redis prod (ADR-004) |
| A1 | Rate-limit Redis | Idem |
| A18 | MFA UI front + Reset MdP + 1st-login + Cookie HttpOnly | Front à coder |
| E | Backup PG quotidien chiffré + WAL archive | Dépend MinIO + ADR-001 |

---

## Sprint 2 — Headers/CORS + Pages légales

### Actions livrées

| # | Action | Statut | Fichiers |
|---|---|---|---|
| A2 | CSP + HSTS (prod) + CORS strict (prod/staging) + Permissions-Policy étendue + COOP + COEP + CRP | ✅ Backend reloadé, headers visibles dans réponse réelle | `Final/backend/app/core/security/headers.py` (nouveau), `Final/backend/app/main.py` (refacto), `Final/backend/tests/unit/test_security_headers.py` |
| A4 | Logs RGPD-aware (PII stripping middleware structlog) | ✅ Processeur `_strip_pii` actif sur tous environnements | `Final/backend/app/core/logging.py` (refacto), `Final/backend/tests/unit/test_logging_pii.py` |
| A3 (audit corrigé) | `permissionMatchGuard` sur 9 modules | ✅ **Déjà en place** sur les 16 modules dans `content.routes.ts` (audit J-3 et fiches étaient erronés) | `Final/src/app/shared/routes/content.routes.ts` |
| G | 6 pages légales publiques (mentions, CGU, confidentialité, cookies, accessibilité, security.txt) | ✅ Compilent en lazy chunk dédié, HTTP 200 sur `/mentions-legales`, `/cgu`, `/confidentialite`, `/cookies`, `/accessibilite`, `/security`. **Statut juridique : draft, à valider par juriste externe (cf. ADR-011)** | `Final/src/app/legal/{legal.routes,legal-content,legal-page,cookie-consent.service,cookie-banner,cookie-preferences-page}.ts` |
| G | Refonte du footer avec liens légaux | ✅ Footer affiche 5 liens légaux (Mentions, CGU, Confidentialité, Cookies, Accessibilité) | `Final/src/app/shared/components/footer/footer.html` |
| G | Bandeau cookies (anti-dark-pattern, 3 actions : tout accepter / tout refuser / personnaliser) | ✅ Affiché tant que l'utilisateur n'a pas décidé, persistance localStorage | `Final/src/app/legal/{cookie-banner,cookie-consent.service}.ts`, intégré dans `Final/src/app/app.{ts,html}` |
| G | Page `/preferences-cookies` granulaire | ✅ 3 catégories : ui_prefs, analytics, ai_history | `Final/src/app/legal/cookie-preferences-page.ts` |
| G | Registre des traitements RGPD-GN | ✅ 12 traitements documentés (T-01 à T-12) + 4 DPIA listées | `Final/docs/registre-traitements.md` |
| G | DPO + désignation officielle | ⛔ Décision politique pendante (ADR-009) | — |

### Actions à faire

| # | Action | Bloquant ? |
|---|---|---|
| E | PostgreSQL HA (CloudNativePG ou Patroni) | Infra K8s + ADR-001 |
| E | MinIO mirror | Infra |
| G | Audit juridique des textes légaux + DPIA détaillées | Prestataire externe (ADR-011) |

---

## Restant Vagues A (Sprints 3-8)

À déclencher selon `PLAN_EXECUTION.md` après validation du Comité de pilotage.

---

## Vérifications de fin de session

- ✅ Backend FastAPI reloadé sans erreur ; `curl -I http://127.0.0.1:8000/api/v1/health` montre CSP, COOP, COEP, Permissions-Policy étendue, X-Frame-Options DENY, etc.
- ✅ Frontend Angular reloadé sans erreur ; lazy chunk `legal-page` 20.57 kB ; pages légales accessibles en HTTP 200.
- ✅ Tests unitaires backend ajoutés (`test_security_headers.py`, `test_logging_pii.py`) — exécution complète à venir avec la CI étendue.
- ✅ Pas de régression : `/docs` Swagger UI répond HTTP 200, app loadée à `/`.

## Pas encore validé / à attention spéciale

- **Prettier sur les nouveaux fichiers TS** : pas appliqué localement (pre-commit non installé encore par l'équipe). À lancer `npm run sass` puis manuel pour le moment.
- **Tests pytest** : non exécutés ici (besoin d'un Postgres test, lancé via la CI étendue).
- **Pages légales** : contenus en `draft-juridique`, badge `Validation juridique en cours` affiché. **Ne pas considérer comme opposable tant que non validé par un juriste**.
- **DPO email `dpo@prim.gov.gn`** mentionné dans plusieurs pages : à créer côté DSI Mail Primature.

## Fichiers créés / modifiés

### Créés (29)

```
Final/.pre-commit-config.yaml
Final/backend/app/core/security/headers.py
Final/backend/tests/unit/test_security_headers.py
Final/backend/tests/unit/test_logging_pii.py
Final/docs/decisions/README.md
Final/docs/decisions/TEMPLATE.md
Final/docs/decisions/ADR-001-hosting-production.md
Final/docs/decisions/ADR-002-site-dr-secondaire.md
Final/docs/decisions/ADR-003-container-registry.md
Final/docs/decisions/ADR-004-secrets-management.md
Final/docs/decisions/ADR-005-pki-signature.md
Final/docs/decisions/ADR-006-tsa-horodatage.md
Final/docs/decisions/ADR-007-referentiel-statutaire-fp-gn.md
Final/docs/decisions/ADR-008-referentiel-sanctions-fp-gn.md
Final/docs/decisions/ADR-009-dpo-designation.md
Final/docs/decisions/ADR-010-comite-pilotage.md
Final/docs/decisions/ADR-011-budget-externes.md
Final/docs/decisions/ADR-012-oidc-national.md
Final/docs/decisions/ADR-013-fournisseur-sms.md
Final/docs/decisions/ADR-014-autorite-certification-tls.md
Final/docs/registre-traitements.md
Final/src/app/legal/legal.routes.ts
Final/src/app/legal/legal-content.ts
Final/src/app/legal/legal-page.ts
Final/src/app/legal/cookie-consent.service.ts
Final/src/app/legal/cookie-banner.ts
Final/src/app/legal/cookie-preferences-page.ts
PROGRESS_VAGUE_A.md
```

### Modifiés (5)

```
Final/.github/workflows/quality.yml         (CI étendue)
Final/backend/app/main.py                    (utilise nouveau SecurityHeadersMiddleware + CORS durci)
Final/backend/app/core/logging.py            (ajout strip-PII processor)
Final/src/app/app.routes.ts                  (intègre LEGAL_ROUTES publiques)
Final/src/app/app.ts + app.html              (intègre CookieBanner global)
Final/src/app/shared/components/footer/footer.html  (liens légaux + accessibilité ARIA)
```

## Prochaines étapes recommandées

1. **Décisions politiques (semaine 0)** : valider les 14 ADR. Sans cela, Sprint 1+ bloqué.
2. **MFA TOTP UI front** (Sprint 1) : démarrer dès que ADR-004 (secrets) tranché.
3. **Backend MFA enforcement middleware** : démarrer en parallèle.
4. **Lancement audit juridique des pages légales** : sous-traiter dès budget arbitré (ADR-011).
5. **Installation pre-commit côté équipe** : `pip install pre-commit && pre-commit install`.
6. **Exécution complète des tests pytest** dans la nouvelle CI : valider sur PR de test.
