# ADR-011 — Budget externes Vague A

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DAF
* **Périmètre** : Vague A complète

## Contexte

La Vague A nécessite **plusieurs prestations externes** ponctuelles (cf.
`PLAN_EXECUTION.md` § 6).

## Postes budgétaires demandés

| Poste | Estimation | Justification | Sprint d'utilisation |
|---|---|---|---|
| Juriste (CGU, mentions légales, charte d'utilisation, doc RGPD) | 5-10 K€ | Validité juridique des textes | Sprint 0-2 |
| Cabinet a11y (audit RGAA + plan correctifs) | 5-8 K€ | Conformité service public, inclusion | Sprint 4-6 |
| Pen-tester (audit OWASP Top 10 + revue archi) | 8-15 K€ | Sécurité avant cutover prod | Sprint 4-6 |
| Vidéaste (12 tutoriels formation utilisateur) | 5-10 K€ | Adoption | Sprint 4-7 |
| Infrastructure DR site secondaire | variable | Continuité d'activité (cf. ADR-002) | Sprint 5+ |
| CA / PKI / TSA (cf. ADR-005, ADR-006) | variable | Signature électronique opposable | Sprint 0-4 |
| Connecteur SMS (Orange GN ou autre) | abonnement + crédits | Notifications mobiles | Sprint 3+ |

**Total estimé hors infra DR : 23-43 K€** (variable selon options retenues).

## Décision

(à compléter par DAF)

## Conséquences

* Sans arbitrage : retard sur les sprints concernés.
* Recommandation : arbitrer en bloc semaine 0, lancer les marchés ou contrats.

## Validation

* À valider semaine 0.
