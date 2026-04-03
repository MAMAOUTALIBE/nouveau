# PostgreSQL RH Schema

## Fichier initial

- [001_init_rh_schema.sql](/Volumes/Verbatim/GPA-GOUVE/Final/db/postgresql/001_init_rh_schema.sql)

## Execution locale

```bash
psql "$DATABASE_URL" -f db/postgresql/001_init_rh_schema.sql
```

## Convention de migration

- `001_*` : schema initial
- `002_*` : evolution compatible
- `003_*` : optimisation/indexation

Chaque nouvelle migration doit:
- etre idempotente si possible
- contenir les contraintes SQL (pas uniquement applicatives)
- inclure les index metier necessaires

