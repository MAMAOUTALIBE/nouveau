# ADR-006 — TSA horodatage RFC 3161

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI
* **Périmètre** : signature électronique (couplé ADR-005)

## Contexte

Une signature électronique sans horodatage opposable peut être contestée sur
la date. Le standard TSA (Time Stamping Authority, RFC 3161) fournit un jeton
de temps horodaté par une autorité tierce.

## Options envisagées

### Option A — TSA gouvernementale GN
- ✅ Souverain, opposable
- 🟡 Existe-t-elle ?

### Option B — TSA UE qualifiée (Universign, certinomis, etc.)
- ✅ Niveau eIDAS qualifié
- 🟡 Coût par horodatage

### Option C — TSA gratuite (FreeTSA, DigiCert public)
- ✅ Gratuit
- 🟡 Pour staging uniquement, pas pour production opposable

### Option D — Pas de TSA (signature non horodatée)
- ❌ Inacceptable

## Décision

(à compléter)

Recommandation : **A** si existe, sinon **B** pour production, **C** pour
environnements staging/dev.

## Conséquences

* **À mettre en place** :
  - URL TSA configurée dans `backend/app/core/config.py` (var env `TSA_URL`)
  - Implémentation appel TSA dans signature service
  - Conservation du jeton TSA dans `signature_envelopes.tsa_token`

## Validation

* À valider semaine 0.
