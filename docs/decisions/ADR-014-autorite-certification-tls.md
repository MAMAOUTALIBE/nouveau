# ADR-014 — Autorité de certification TLS

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI
* **Périmètre** : ingress, certificats `prim.gov.gn`

## Contexte

Le domaine `prim.gov.gn` (et sous-domaines `api.`, `registry.`, `help.`) doit
être servi en HTTPS avec un certificat valide. Le choix de l'autorité de
certification (CA) impacte la confiance technique et politique.

## Options envisagées

### Option A — ANSI nationale GN (si opérationnelle)
- ✅ Souverain, signal politique fort
- 🟡 Confirmer la disponibilité
- 🟡 Reconnaissance navigateurs ?

### Option B — Let's Encrypt (CA gratuite, automatisée)
- ✅ Gratuit, mature, reconnu globalement
- ✅ Renouvellement automatique (cert-manager K8s)
- 🟡 Dépendance externe (US-based)

### Option C — CA payante UE (Sectigo, GlobalSign, DigiCert)
- ✅ Reconnu, EV possible
- 🟡 Coût annuel

## Décision

(à compléter)

Recommandation : **A** pour production si reconnu navigateurs ; **B** pour
staging et **B ou C** pour prod en repli.

## Conséquences

* **À mettre en place** :
  - cert-manager K8s avec issuer choisi
  - Domaine + DNS validés
  - HSTS preload (cf. fiche 01 P2)

## Validation

* À valider semaine 0.
