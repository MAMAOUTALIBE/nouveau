# ADR-013 — Fournisseur SMS

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI × Achats
* **Périmètre** : notifications SMS (cf. fiche 07 P13)

## Contexte

35 % des fonctionnaires (estimation) consultent rarement leur email pro.
Un canal SMS est indispensable pour :
- accusés de candidature (portail public),
- notifications congés / formations,
- alertes prescription discipline,
- codes MFA de secours,
- alertes d'astreinte (DSI).

## Options envisagées

### Option A — Orange Guinée (API SMS)
- ✅ Couverture nationale GN forte
- ✅ Fournisseur local
- 🟡 API à confirmer (existe-t-elle ouvertement ?)

### Option B — Africa's Talking (panafricain)
- ✅ Multi-opérateurs (Orange, MTN, Cellcom)
- ✅ Documentation API mature
- 🟡 Fournisseur étranger

### Option C — Twilio
- ✅ Robuste
- ❌ Sortie GN, pas d'optimisation locale

### Option D — Autres opérateurs GN (MTN/Cellcom directement)
- 🟡 Selon disponibilité d'API publique

## Décision

(à compléter)

Recommandation : **A en priorité**, **B en repli/multi-opérateur**. Adapter
`backend/app/adapters/sms/{orange_gn,africastalking,mock}.py` pluggable.

## Conséquences

* Coût par SMS, plafonds quotidiens à définir
* Conformité RGPD-GN sur stockage numéros mobile
* Tests d'envoi en mode staging avec faux numéros

## Validation

* À valider semaine 0.
