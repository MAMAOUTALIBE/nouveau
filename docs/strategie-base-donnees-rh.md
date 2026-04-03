# Strategie Base De Donnees RH (V1)

Date: 3 avril 2026

## 1) Contexte et objectif

L'application RH doit couvrir la Primature et plusieurs directions, avec un volume initial autour de 500 employes, leurs documents, leurs mouvements de carriere et des workflows de validation.

Le volume n'est pas "big data", mais le niveau d'exigence est eleve sur:
- securite
- tracabilite
- conformite
- qualite des donnees

## 2) Cible technique proposee

- Base relationnelle: PostgreSQL (transactionnel, fiable, audit-friendly).
- Stockage des fichiers: objet (S3 compatible), pas de blobs lourds dans PostgreSQL.
- Backend: conserver l'API actuelle et remplacer progressivement les tableaux en memoire de `mock-backend/server.cjs` par des acces SQL.

Resultat:
- PostgreSQL stocke les metadonnees, les droits, les historiques, les liens vers fichiers.
- S3 stocke les PDF/images/documents.

## 3) Domaines de donnees (schema v1)

Le schema SQL v1 couvre:
- organisation: `organizations`, `directions`, `units`, `positions`
- securite: `users`, `roles`, `permissions`, `user_roles`, `user_scopes`
- personnel: `employees`, `employee_assignments`, `employee_movements`
- absences: `leave_types`, `leave_balances`, `leave_requests`
- recrutement: `recruitment_campaigns`, `recruitment_applications`, `recruitment_status_events`, `recruitment_comments`
- GED/documentaire: `file_objects`, `documents`, `document_versions`, `document_dispatches`
- workflow: `workflow_definitions`, `workflow_steps`, `workflow_instances`, `workflow_instance_events`
- audit transverse: `audit_logs`, `notifications`

Le script est fourni ici:
- [001_init_rh_schema.sql](/Volumes/Verbatim/GPA-GOUVE/Final/db/postgresql/001_init_rh_schema.sql)

## 4) Regles de conception retenues

- UUID partout (cle primaire robuste pour integrations futures).
- Contraintes SQL fortes (unicite matricule/reference, checks de statuts).
- Historisation explicite (mouvements, transitions, events, dispatch, audit).
- Index metier sur statuts, dates, direction, unite, references.
- Colonnes `created_at` / `updated_at` standardisees.
- `metadata jsonb` pour extensions fonctionnelles sans casser le modele.

## 5) Securite et gouvernance

- Mot de passe: hash uniquement (`password_hash`), jamais de mot de passe en clair.
- Scope d'acces natif (`SELF`, `TEAM`, `UNIT`, `DIRECTION`, `GLOBAL`) via `user_scopes`.
- Audit obligatoire des actions critiques via `audit_logs`:
  - qui
  - quoi
  - quand
  - avant/apres
- Chiffrement:
  - TLS en transit
  - chiffrement at-rest sur le stockage managé.
- Sauvegarde:
  - snapshots automatiques
  - restoration testee periodiquement.

## 6) Plan de migration depuis le mock actuel

### Phase 0 (immediate)
- Creer la base PostgreSQL + appliquer le script v1.
- Ajouter variables d'environnement DB (`DATABASE_URL`) sur Railway.

### Phase 1 (coexistence)
- Garder les endpoints actuels.
- Lire/ecrire d'abord dans PostgreSQL pour:
  - users/roles
  - employees
  - documents
  - workflows
- Conserver fallback mock temporaire uniquement en dev.

### Phase 2 (bascule)
- Retirer l'ecriture en memoire.
- Migrer les uploads vers stockage objet.
- Ajouter scripts d'import initial des donnees mock.

### Phase 3 (durcissement)
- Ajouter migrations versionnees (001, 002, 003...).
- Ajouter tests d'integrite SQL + tests de non-regression API.
- Activer supervision DB (temps de reponse, erreurs, saturation).

## 7) Capacite et evolutivite

Pour ~500 employes, PostgreSQL sera tres largement suffisant.

La marge de croissance est confortable pour:
- plusieurs milliers d'employes
- historiques documentaires et workflows longs
- augmentation progressive des directions/unites

## 8) Decisions validees (03/04/2026)

1. SGBD final
- PostgreSQL confirme.

2. Stockage objet documents
- Production: AWS S3 (ou stockage S3-compatible managé).
- Developpement/local: MinIO compatible API S3.

3. Retention cible
- Audit logs: 5 ans en base active + export archive.
- Versions documentaires RH: 10 ans minimum apres date de sortie agent (pas de purge sur agent actif).
- Notifications applicatives: 12 mois.

4. Archivage et purge legale
- Purge logique d'abord (etat archive), jamais suppression physique immediate.
- Suppression physique uniquement via tache planifiee et journalisee, apres delais legaux.
- Blocage purge si litige/controle en cours (`legal_hold`).

## 9) Etapes suivantes (phase implementation)

- Ajouter la couche d'acces PostgreSQL dans le backend.
- Migrer en priorite les modules `users/roles`, `employees`, `documents`, `workflows`.
- Basculer les uploads de `mock-backend/uploads` vers stockage S3.
