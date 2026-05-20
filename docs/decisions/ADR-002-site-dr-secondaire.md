# ADR-002 — Site secondaire pour PRA / DR

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : Cabinet PM
* **Décideurs** : SG, DSI, ANSUTEN
* **Périmètre** : continuité d'activité

## Contexte

Une perte de l'infrastructure primaire (incendie, cyberattaque ransomware,
inondation, coupure prolongée) entraînerait l'arrêt total du SI Primature.
La fiche `MODERNISATION_12_DEVOPS_DEPLOIEMENT.md` (R2) classe ce risque
comme **catastrophique**. Cibles RTO < 4 h, RPO < 1 h.

## Options envisagées

### Option A — Second datacenter ANSUTEN (autre site Conakry)
- ✅ Souverain
- 🟡 Risque commun en cas de catastrophe régionale Conakry

### Option B — Datacenter régional GN (Kankan, Labé, N'Zérékoré)
- ✅ Souverain + isolement géographique
- 🟡 Maturité ?

### Option C — Cloud public UE en repli (OVH région secondaire)
- ✅ Disponibilité élevée
- 🟡 Sortie GN

### Option D — Pas de DR (accepter le risque)
- ❌ Inacceptable pour un SI d'État

## Décision

(à compléter par le sponsor)

Recommandation : **Option A + Option B** progressives — démarrer Option A pour
livraison Vague A, planifier Option B en Vague B/C.

## Conséquences

* **À mettre en place** :
  - Contrat infrastructure DR
  - Réplication PG streaming async (cf. fiche 12 P14)
  - Mirror MinIO
  - Test annuel de bascule (obligatoire)
  - Runbook de bascule (`docs/runbooks/dr-failover.md`)

## Validation

* À valider semaine 0 du Sprint 0.
