# Plan Priorise - Application RH Puissante et Robuste

Date: 23 mars 2026

## P0 - Fondations critiques (0 a 2 semaines)

1. Stabiliser la connectivite API
- Statut: Fait
- Livrable: base URL proxy (`/api/v1`) + timeout global configurable.

2. Normaliser les erreurs backend
- Statut: Fait
- Livrable: normalisation unique des erreurs (`NETWORK_UNREACHABLE`, `TIMEOUT`, `VALIDATION`, etc.) pour des messages coherents.

3. Durcir l'authentification
- Statut: Fait
- Livrable: `AuthService` aligne la gestion des erreurs sur la normalisation centrale.

4. Baseline de tests executable en local et CI
- Statut: En cours
- Livrable: setup Vitest ajoute, mais execution locale bloquee par contrainte de version Node.
- Action requise: Node >= 20.19 pour execution complete des tests Angular 21.

5. Mettre un quality gate CI
- Statut: Fait
- Livrable: workflow `.github/workflows/quality.yml` avec `npm ci`, `typecheck`, `test:unit`.

## P1 - Capacites metier robustes (2 a 6 semaines)

6. Transformer les pages read-only en flux metier complets
- Statut: A faire
- Priorite: Personnel (dossier, affectation, historique), Absences, Workflows.

7. Ajouter validation stricte formulaire + contraintes metier
- Statut: A faire
- Livrable cible: validations front + erreurs backend detaillees par champ.

8. Introduire pagination/filtrage/tri cote serveur
- Statut: A faire
- Livrable cible: performance stable sur grands volumes.

9. Renforcer securite applicative
- Statut: A faire
- Livrable cible: RBAC fin, protections route/API, audit trail structuré.

10. Observabilite applicative
- Statut: A faire
- Livrable cible: correlation ID, journalisation structuree, tableau de bord erreurs.

## P2 - Echelle et excellence operationnelle (6+ semaines)

11. Contrats API versionnes et verifies
- Statut: A faire
- Livrable cible: contrat OpenAPI versionne + tests de contrat automatiques.

12. Tests E2E parcours critiques
- Statut: A faire
- Livrable cible: login, creation agent, workflow validation, generation rapport.

13. Resilience avancee
- Statut: A faire
- Livrable cible: retry intelligent, circuit breaker, strategie degradee explicite.

14. Gouvernance de release
- Statut: A faire
- Livrable cible: versioning semantique, changelog automatique, rollback procedure.

## Execution pas-a-pas immediate

1. Monter Node sur version supportee (>=20.19) pour unifier `ng test`/`vitest`.
2. Activer quality gate CI (`typecheck` + tests).
3. Livrer CRUD complet du domaine Personnel (priorite fonctionnelle #1).
4. Ajouter E2E sur les 3 parcours critiques (auth, agent, workflow).
5. Generaliser la meme approche sur les autres domaines metier.
