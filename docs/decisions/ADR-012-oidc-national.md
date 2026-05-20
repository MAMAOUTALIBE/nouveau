# ADR-012 — OIDC national Pro Connect Agent GN

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI
* **Périmètre** : authentification (cf. fiche 09 P15)

## Contexte

Idéalement, le SI Primature utiliserait un **fournisseur d'identité national**
(équivalent Pro Connect Agent FR) pour authentifier les agents, ce qui
permettrait :
- MFA centralisé,
- off-boarding instantané,
- une seule procédure mot de passe oublié pour tous les SI publics.

## Question à trancher

**Existe-t-il aujourd'hui un IdP gouvernemental guinéen utilisable
(Keycloak central, OIDC, SAML) ?**

## Options envisagées

### Option A — Brancher OIDC sur IdP national (si existe)
- ✅ Standard GovTech
- 🟡 Dépendance disponibilité IdP

### Option B — Rester sur auth locale + MFA TOTP (cf. fiche 01 P1)
- ✅ Indépendance
- 🟡 Dette si IdP national se met en place plus tard

### Option C — Préparer adaptateur OIDC (interface) sans implémenter
- ✅ Future-proof
- ✅ Vague C facile

## Décision

(à compléter)

Recommandation : **B** pour Vague A + **C** (préparer interface) ; basculer
en **A** dès qu'un IdP national est opérationnel (probablement Vague C ou
au-delà).

## Conséquences

* **À mettre en place (Vague A)** :
  - Auth locale + MFA durci (déjà prévu)
  - Interface `OidcProvider` côté backend (point d'extension)

## Validation

* À valider semaine 0.
