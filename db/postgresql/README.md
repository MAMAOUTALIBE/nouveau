# PostgreSQL RH Schema

## Fichier initial

- [001_init_rh_schema.sql](/Volumes/Verbatim/GPA-GOUVE/Final/db/postgresql/001_init_rh_schema.sql)
- [002_unified_documents.sql](/Volumes/Sans titre 2/GPA-GOUVE/Final/db/postgresql/002_unified_documents.sql)
- [003_performance_indexes.sql](/Volumes/Sans titre 2/GPA-GOUVE/Final/db/postgresql/003_performance_indexes.sql)
- [004_personnel_360_ai.sql](/Volumes/Sans titre 2/GPA-GOUVE/Final/db/postgresql/004_personnel_360_ai.sql)

## Execution locale

```bash
psql "$DATABASE_URL" -f db/postgresql/001_init_rh_schema.sql
psql "$DATABASE_URL" -f db/postgresql/002_unified_documents.sql
psql "$DATABASE_URL" -f db/postgresql/003_performance_indexes.sql
psql "$DATABASE_URL" -f db/postgresql/004_personnel_360_ai.sql
```

Si `DB_BOOTSTRAP_SCHEMA=true`, le `mock-backend` applique automatiquement toutes les migrations SQL presentes dans `db/postgresql/` par ordre croissant (`001`, `002`, `003`, ...).

## Convention de migration

- `001_*` : schema initial
- `002_*` : evolution compatible
- `003_*` : optimisation/indexation
- `004_*` : personnel 360, IA RH et automatisation

Chaque nouvelle migration doit:
- etre idempotente si possible
- contenir les contraintes SQL (pas uniquement applicatives)
- inclure les index metier necessaires
