# ADR-009 — Désignation du DPO

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : Cabinet PM
* **Périmètre** : conformité loi 037/AN/2016, RGPD

## Contexte

L'application traite des données personnelles d'agents de l'État (santé via
ayants droit, état civil, salaires futurs, sanctions disciplinaires, scoring
algorithmique de turnover, matching CV par LLM). La loi guinéenne 037/AN/2016
exige un **Délégué à la Protection des Données** (DPO) ou rôle équivalent.

## Options envisagées

### Option A — DPO interne Primature (à temps partiel)
- ✅ Connaissance fine du contexte
- 🟡 Disponibilité, formation requise

### Option B — DPO mutualisé inter-ministériel
- ✅ Mutualisation, montée en compétence collective
- 🟡 Lenteur procédurale potentielle

### Option C — DPO externalisé (cabinet juridique GN)
- ✅ Expertise immédiate
- 🟡 Coût récurrent

## Décision

(à compléter par Cabinet PM)

Recommandation : **A ou B** ; **C** acceptable comme transition (6-12 mois)
avec montée en compétence d'un agent interne.

## Conséquences

* **À mettre en place** :
  - Lettre de mission DPO
  - Adresse email dédiée `dpo@prim.gov.gn`
  - Inscription dans pages légales (cf. fiche 13 P1)
  - Élaboration du registre des traitements (cf. fiche 13 P2 et `docs/registre-traitements.md`)
  - Lancement des 3 DPIA (turnover, LLM matching CV, 360°)

## Validation

* À valider semaine 0.
