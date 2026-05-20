# Fiche de modernisation 10 — Données & Architecture SQL

> Audit code réel — 2026-05-10 — Périmètre : `Final/db/postgresql/*.sql` (4 migrations, 1 753 lignes), `Final/backend/alembic/versions/` (4 migrations), `Final/backend/app/models/` (22 modèles SQLAlchemy)

## 0. Résumé exécutif

Couche données **structurée et sérieuse** : 43 tables réparties dans le schéma `hr.`, 3 vues métier (documents agent, compliance, queue de traitement), 28 triggers `updated_at`, 39 contraintes CHECK, 18 UNIQUE, 63 index dont une migration dédiée à la performance (003), parité Alembic ↔ SQL via baseline reproductible. **Six manques structurels pour un volume d'État réel (50 000 agents × 10 ans)** : (1) **aucun index GIN sur les 45 champs JSONB** → recherches `metadata @>` lentes ; (2) **aucun partitionnement** sur `audit_logs`, `notifications`, `document_versions` qui vont peser des dizaines de millions de lignes ; (3) **aucune purge automatisée** des données soumises à rétention RGPD ; (4) **chiffrement at-rest colonne (pgcrypto)** absent sur `national_id_number`, `dependent_birthdate`, `salary` (lorsqu'il sera ajouté) ; (5) **aucun rôle PostgreSQL applicatif** (`hr_app_rw`, `hr_app_ro`) — la séparation se fait dans l'application, pas au niveau base ; (6) **codes ISO** absents (langues, pays, devises) — interopérabilité pénalisée. La doctrine de rétention est correctement modélisée (`document_retention_rules`, `document_retention_events`, `legal_hold`) mais **n'a pas de worker qui la consomme**.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Migrations SQL | `Final/db/postgresql/{001_init_rh_schema.sql, 002_unified_documents.sql, 003_performance_indexes.sql, 004_personnel_360_ai.sql}` (685 + 864 + 65 + 139 lignes) |
| Migrations Alembic | `Final/backend/alembic/versions/{0001_baseline_existing_schema.py, 0002_training_perf_discipline_gpec.py, 0003_user_employee_link.py, 0004_user_totp.py}` |
| Modèles SQLAlchemy | `Final/backend/app/models/*.py` (22 fichiers) |
| Mixins | `Final/backend/app/models/_mixins.py` (TimestampMixin, uuid_pk) |
| README BDD | `Final/db/postgresql/README.md`, `Final/docs/strategie-base-donnees-rh.md` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Schéma isolé `hr.` | ✅ | `001_init_rh_schema.sql` | Pas de pollution `public`. Bon. |
| Extensions PG (pgcrypto, citext) | ✅ | en tête 001 | UUID ✅, email case-insensitive ✅. |
| 43 tables totales (31 base + 7 docs unifiés + 5 personnel_360 + suppléments Alembic) | ✅ | 4 SQL + Alembic 0002 | Cohérent. |
| 3 vues métier | ✅ | `vw_employee_documents`, `vw_employee_document_compliance`, `vw_document_processing_queue` | Bons cas d'usage (recherche dossier, alertes expiration, queue OCR). |
| 28 triggers `updated_at` | ✅ | mixin `hr.set_updated_at()` | OK. |
| 39 CHECK constraints (statuts/enums) | ✅ | dispersés | OK (mais favoriser ENUM PG natif quand stable). |
| 18 UNIQUE constraints | ✅ | (organization_id, matricule), email, etc. | OK. |
| 63 index | ✅ | dont 17 dans 003_performance_indexes | hot paths agents/congés/recrutement/documents/audit. |
| Index GIN sur JSONB | ❌ | grep | **Aucun**. 45 champs JSONB (metadata, payload, factors, qr_payload, raw_payload) → recherches `@>` font scan séquentiel. |
| Index FK sur `audit_logs(user_id)` + `(occurred_at)` | 🟡 | `(user_id, occurred_at desc)` présent | OK pour ce composite ; manquent index dédiés sur `target_type`, `action`, `source_ip`. |
| Parité Alembic ↔ SQL (0001 baseline) | ✅ | `0001_baseline_existing_schema.py` | Joue les SQL d'une traite, idempotent (`IF NOT EXISTS`). |
| Downgrade Alembic 0001 | ❌ | `NotImplementedError` | Volontaire (refus de DROP SCHEMA hr) — défendable mais à documenter. |
| Downgrade Alembic 0002-0004 | ✅ | upgrade/downgrade complets | OK. |
| `TimestampMixin` (created_at, updated_at) sur tous les modèles | 🟡 | 8/22 modèles l'utilisent | Inégal — certains modèles ont leurs `created_at` à la main. À harmoniser. |
| 45 champs JSONB | 🟡 | grep models | Sans schéma JSON Schema validateur ; risque de divergence applicative. |
| Sensibilité documents (4 niveaux) | ✅ | `confidentiality_level` PUBLIC/INTERNAL/CONFIDENTIAL/STRICTLY_CONFIDENTIAL | OK. |
| Doctrine de rétention | ✅ | `document_retention_rules`, `document_retention_events`, `legal_hold`, `archived_at` | Très bonne base. |
| **Worker de purge / archivage consommant la doctrine** | ❌ | — | **Aucun job consommateur** (cf. fiche 02 P6 et fiche 07 P5). |
| Partitionnement (audit_logs, notifications, document_versions) | ❌ | — | Tables monolithiques. À 5-10 ans d'usage : 50M+ lignes audit, scan séquentiel. |
| Chiffrement at-rest colonne (pgcrypto) | ❌ | — | `national_id_number`, futurs `salary`, `dependent_birthdate`, `dependent_health_status` non chiffrés. |
| Rôles PG applicatifs (hr_app_rw, hr_app_ro) | ❌ | — | Une seule connexion DB applicative ; pas de séparation lecture/écriture/admin au niveau PG. |
| Codes ISO (639 langues, 3166 pays, 4217 devises) | ❌ | text libre | Pas de tables référentielles ISO. Pénalisant pour interopérabilité. |
| FK ON DELETE strict | 🟡 | 45 RESTRICT, 15 CASCADE | CASCADE sur `role_permissions`, `document_links`, `training_*` à auditer (risque suppressions orphelines en cas d'erreur). |
| Index couvrants (INCLUDE) | ❌ | — | Optimisation possible sur les requêtes liste agents (matricule, name + INCLUDE direction_id, status). |
| `EXPLAIN` benchmarks documentés | ❌ | — | Pas de plan d'exécution capturé dans la doc tech. |
| Backup logique (pg_dump) automatisé | ❌ | — | Cf. fiche 12. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — DGFiP socle décisionnel** : partition by year sur audit | Aucune | ❌ |
| **PostgreSQL Best Practices (15+)** — partition declarative, GIN JSONB, index covering | GIN/partition absents | 🟡 |
| **OWASP Top 10 — A02 Cryptographic Failures** : chiffrement données sensibles | At-rest disque MinIO ✅, colonne ❌ | 🟡 |
| **CIS PostgreSQL Benchmark** : rôles PG séparés, GRANT minimal | Pas de séparation | ❌ |
| **ISO 27001 A.12.4.2** intégrité journaux audit | Pas de scellement (cf. fiche 01 P4) | ❌ |
| **CNIL FR — délibération RH 2018-303** : durée de conservation par catégorie | Doctrine modélisée, pas appliquée | 🟡 |
| **GeoDataGouv FR / OGC** standards référentiels | ISO codes absents | 🟡 |
| **Loi Guinéenne 037/AN/2016** — registre & droits | Données présentes, pas de mécanisme exécutoire | ❌ |
| **Estonia X-Road data exchange** : UUID stables + signature | UUID ✅, signature ❌ | 🟡 |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **`audit_logs` non partitionné** → 50 K agents × 50 actions/an × 10 ans = 25M lignes minimum → recherches admin lentes (5-30 s) → audit inutilisable. | **Critique** | À J+24 mois |
| R2 | **Pas de chiffrement colonne** → backup PostgreSQL volé = `national_id_number` en clair → violation RGPD majeure. | **Critique** | À première compromission |
| R3 | **Pas de purge automatisée** → croissance illimitée + non-conformité loi 037/AN/2016 + coûts stockage. | Élevée | À J+12 mois |
| R4 | **Pas d'index GIN JSONB** → recherches `metadata @>` (audit search, recherche compétences, signatures) → scans séquentiels → timeouts. | Élevée | Dès volumétrie |
| R5 | **Une seule connexion DB applicative** → un endpoint vulnérable peut écrire dans tout le schéma → impossible d'isoler lecture seule (reporting, BI). | Moyenne | Continu |
| R6 | **Codes ISO absents** → interopérabilité X-Road / partage avec Trésor / paie compliquée. | Moyenne | À l'intégration |
| R7 | **CASCADE FK** → suppression d'un rôle système non protégé entraîne perte de permissions associées sans avertissement. | Moyenne | À chaque manip RBAC |
| R8 | **Downgrade Alembic 0001 impossible** → impossible de revenir en arrière en cas de problème de seed. | Moyenne | À l'install |
| R9 | **Pas d'EXPLAIN documenté** → régressions de performance non détectées avant mise en prod. | Faible | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Partitionner `audit_logs`, `notifications`, `document_versions` par année** (PostgreSQL native partitioning declarative). Migration Alembic 0005 : ALTER TABLE + détacher l'existant + attacher partitions. Job mensuel d'attachement de la prochaine partition. Index par partition. | Lève R1. Audit utilisable à 10 ans. | **5-7 j** | **P0** | — |
| **P2** | **Index GIN sur les JSONB chauds** : `audit_logs.before_data`, `audit_logs.after_data`, `audit_logs.audit_metadata`, `recruitment_applications.metadata`, `signature_envelopes.payload`, `employee_competencies.metadata`. Bench avant/après EXPLAIN. | Lève R4. Recherches subseconde. | **2-3 j** | **P0** | — |
| **P3** | **Chiffrement at-rest colonne pgcrypto** : `pgp_sym_encrypt(national_id_number, key)` ; clé par variable d'env, rotation prévue. Étendre à `salary` (à introduire), `dependent_birthdate`, `dependent_health_status`. Vues métier déchiffrant en lecture (RBAC PG). | Lève R2. Conformité RGPD-GN. | **5-7 j** | **P0** | Stratégie clé (KMS local ou Vault) |
| **P4** | **Worker de purge / archivage** : drainer `document_retention_rules` + autres tables (audit > 5 ans → archive WORM ; agents `TERMINATED + 10 ans` → anonymisation ; candidatures non retenues > 1 an → suppression). arq nocturne, audit `RETENTION_PURGE_EXECUTED`. | Lève R3. Implémente la doctrine déjà modélisée. | **6-8 j** | **P0** | (cf. fiche 02 P6, fiche 07 P5) |
| **P5** | **Rôles PostgreSQL applicatifs** : (a) `hr_app_rw` (CRUD applicatif), (b) `hr_app_ro` (BI, reporting), (c) `hr_app_audit_ro` (lecture audit only), (d) `hr_app_admin` (DDL, migrations seulement). Application utilise `hr_app_rw`. Connexions BI utilisent `hr_app_ro`. | Lève R5. Défense en profondeur. | **3-4 j** | **P1** | — |
| **P6** | **Tables référentielles ISO** : `iso_country` (ISO 3166-1 alpha-2/3, FR labels), `iso_language` (ISO 639), `iso_currency` (ISO 4217). Seed depuis publication officielle. Champs `country_code`, `language_code`, `currency_code` deviennent FK. | Lève R6. Interopérabilité. | **3 j** | **P1** | — |
| **P7** | **Audit FK CASCADE / RESTRICT** : revue systématique des 60 FK ; passer en RESTRICT sauf justification écrite. Scripts de test « dry-run delete » pour comprendre l'impact. | Lève R7. Pas d'effets de bord. | **2-3 j** | **P1** | — |
| **P8** | **JSON Schema sur JSONB chauds** : extension `pg_jsonschema` (PostgreSQL 16+) ; CHECK contraintes JSON Schema sur `audit_logs.audit_metadata`, `signature_envelopes.payload`, `competencies.metadata`. Sinon : validation applicative Pydantic stricte (recommandée si pg_jsonschema indisponible). | Cohérence applicative durable. | **3-4 j** | **P1** | — |
| **P9** | **Index couvrants (INCLUDE) sur top requêtes** : ex `CREATE INDEX ix_employees_search ON hr.employees (status, direction_id) INCLUDE (matricule, last_name, first_name)`. Identifier 8-10 requêtes les plus chaudes. | Performance. | **2-3 j** | **P2** | — |
| **P10** | **Plan d'exécution capturé** : `pg_stat_statements` activé, top 50 requêtes EXPLAIN analyzé, baseline Markdown versionnée dans `docs/`. Suivi des régressions par PR (CI alerte si plan dégrade). | Lève R9. Hygiène performance. | **3 j** | **P1** | pg_stat_statements |
| **P11** | **Stratégie partition + tablespace** : pour les très grandes tables, partitions sur tablespace SSD (chaud) vs HDD (froid > 2 ans). | Économie infra. | **3-4 j** | **P2** | P1 |
| **P12** | **Read replica PostgreSQL** : streaming replication vers un secondaire (lectures BI, reporting). Failover automatique (Patroni) à terme. | Performance + DR (cf. fiche 12). | **5-7 j** | **P1** | Infra |
| **P13** | **Soft delete cohérent (ou zéro)** : aujourd'hui mélange. Choisir : (a) soft delete avec `deleted_at` partout (vue filtrée par défaut), ou (b) hard delete + audit pour traçabilité. Décision documentée. | Cohérence. | **3-4 j** | **P1** | Décision archi |
| **P14** | **Documentation diagrammes ERD** : génération automatique (tbls, schemaspy) publié `/docs/erd/`, mise à jour CI. Diagramme par contexte (personnel, recrutement, formation, etc.). | Onboarding dev, communication. | **2-3 j** | **P2** | — |

## 6. Souveraineté & UX terrain (équipe technique)

**Souveraineté.** PostgreSQL est par essence souverain (open source). MinIO local stocke les fichiers chiffrés. La gestion des clés de chiffrement (P3) est l'étape critique : à minima `pgp_sym_encrypt` avec clé en variable d'env + rotation manuelle ; idéalement HashiCorp Vault auto-hébergé pour rotation automatique et audit d'accès aux clés.

**UX équipe technique.**
- Diagrammes ERD (P14) : indispensables, le projet a 43 tables → impossible à mémoriser.
- Doc des index et plans (P10) : outil de bord pour le DBA / SRE. Évite que chaque dev refasse les mêmes optimisations.
- Migration tooling : `alembic upgrade head` + `alembic downgrade -1` doivent être testés en CI à chaque PR (cf. fiche 11).

## 7. Décision recommandée

Phase **P0 (3 semaines)** : P1, P2, P3, P4 = **18 à 25 j-h**. Lève les 4 risques critiques R1, R2, R3, R4. Sans cela, l'application **ne peut pas tenir 24 mois** sous volumétrie réelle de l'État.

Phase **P1 (4 semaines)** : P5, P6, P7, P8, P10, P12, P13 = **23 à 31 j-h**. Lève les risques moyens et structure la plateforme.

Phase **P2** : P9, P11, P14 = optimisation et qualité de vie équipe.

**Note opérationnelle.** P1 (partition) doit être faite **avant que les tables grossissent**. Partitionner une table de 10M lignes en prod est techniquement faisable mais **délicat (verrous, downtime)**. Faite à 100K lignes, c'est trivial. **Ne pas reporter.**
