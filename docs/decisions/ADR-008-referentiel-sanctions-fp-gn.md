# ADR-008 — Référentiel sanctions FP-GN

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : Ministère Fonction Publique
* **Périmètre** : module Discipline (cf. fiche 05 P1)

## Contexte

Aujourd'hui `DisciplineCase.proposed_sanction` est un champ texte libre. Les
sanctions disciplinaires de la FP doivent être **strictement encadrées** par le
statut général et le code disciplinaire (avertissement, blâme, suspension,
abaissement d'échelon, révocation, etc.) avec délais de prescription.

## Données à fournir

| Donnée | Format | Source |
|---|---|---|
| Échelle des sanctions par sévérité | code, libellé, statut juridique, durée_max_jours, retirable_oui/non | Code disciplinaire FP-GN |
| Délais de prescription | jours par niveau de sévérité | Code disciplinaire |
| Procédure de recours | étapes, délais | Statut général FP |

## Décision

(à compléter)

## Conséquences

* **À mettre en place** :
  - Table `discipline_sanction_catalog`
  - Table `discipline_appeal` (recours)
  - Migration Alembic
  - Champ `prescription_deadline` calculé sur `DisciplineCase`
  - Worker hebdo notification J-30/J-7 + auto-clôture

## Validation

* À valider semaine 0.
