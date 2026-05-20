# ADR-001 — Hébergement de production

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : Cabinet PM × DSI × ANSUTEN
* **Décideurs** : SG Primature, DSI, DPO
* **Périmètre** : tous (infrastructure)

## Contexte

L'application GPA-GOUVE doit être hébergée pour servir les agents de l'État guinéen.
Les données traitées (dossiers d'agents, paie, discipline, recrutement) sont
**sensibles** et tombent sous la loi 037/AN/2016 sur la protection des données
personnelles.

L'application est **K8s-portable** (Helm chart `Final/backend/deploy/helm/`) et
peut être déployée sur n'importe quel cluster Kubernetes.

## Options envisagées

### Option A — Datacenter ANSUTEN (souverain GN)
- ✅ Souveraineté maximale, juridiction GN
- ✅ Aligné avec la doctrine d'État
- ⚪ Maturité opérationnelle ANSUTEN à confirmer (SLA, support 24/7, BCP)
- ⚪ Compétences K8s sur place ?
- ⚪ Coûts à chiffrer

### Option B — Cloud public souverain (OVH/Scaleway région Paris)
- ✅ Maturité opérationnelle élevée
- ✅ Juridiction UE (RGPD-friendly), HDS optionnel chez OVH
- 🟡 Sortie hors GN — DPO doit valider en l'absence d'accord d'adéquation GN-UE
- 🟡 Dépendance fournisseur étranger pour un SI d'État
- 🟡 Coûts mensuels (~500-2000 €/mois selon dimensionnement)

### Option C — Cluster K8s on-prem Primature
- ✅ Souveraineté totale
- ❌ Investissement initial matériel
- ❌ Compétences administration K8s requise

### Option D — Cloud public US (AWS/GCP/Azure)
- ❌ Juridiction US (Cloud Act) — non recommandé pour un SIRH d'État

## Décision

(à compléter par le sponsor)

Recommandation technique de l'équipe : **Option A (ANSUTEN)** si maturité
opérationnelle suffisante ; sinon **Option B (OVH région Paris)** comme repli
documenté avec engagement d'évolution vers Option A à 12-18 mois.

## Conséquences

* **Positives** : (selon option)
* **Négatives** : (selon option)
* **À mettre en place** :
  - Contrat d'hébergement signé
  - Procédure d'accès admin (jump host, mFA)
  - Première configuration cluster K8s + ingress
  - Couplage avec ADR-002 (DR) et ADR-014 (CA TLS)

## Validation

* À valider semaine 0 du Sprint 0.
