# ADR-007 — Référentiel statutaire FP-GN

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DRH × Ministère Fonction Publique
* **Périmètre** : modèle de données Personnel + Carrière + Discipline (cf. fiches 02 P1, 05 P3-P4)

## Contexte

Le modèle `Employee` actuel n'a pas de champ statutaire structuré (corps,
grade, échelon, indice). Sans cette couche, paie, avancement et discipline
sont **contestables**.

Source : Statut Général de la Fonction Publique de Guinée (loi L/2001/028/AN
ou texte en vigueur), grille indiciaire publiée par le Ministère FP.

## Données à fournir

| Donnée | Format souhaité | Source |
|---|---|---|
| Corps de la FP-GN | Code + libellé + cadre (A/B/C/D) | DGFP |
| Grades par corps | Code + libellé + indice min/max | DGFP grille indiciaire |
| Échelons par grade | Numéro + indice + durée_min (jours) | DGFP grille indiciaire |
| Mappage corps → cadre hiérarchique | A1, A2, B1, B2, C, D | DGFP |
| Calcul indemnitaire (optionnel V1) | Formule + variables | DAF |

## Décision

(à compléter — la décision technique dépend de la disponibilité des données
auprès de la DGFP)

Format de livraison souhaité : **CSV ou XLSX structuré** + texte officiel
de référence (loi/décret).

## Conséquences

* **À mettre en place** :
  - Tables `civil_service_corps`, `civil_service_grade`, `civil_service_echelon`
  - Migration Alembic `0005_civil_service_statut`
  - Seed `backend/scripts/seed_civil_service_grades.py`
  - Mise à jour modèle `Employee` (FK)
  - Documentation `docs/civil-service-statute.md`

## Validation

* À valider semaine 0.
* Workshop avec DGFP pour récupération données.
