# ADR-004 — Secrets management Kubernetes

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI
* **Périmètre** : sécurité, CI/CD

## Contexte

Aujourd'hui les secrets (DATABASE_URL, JWT_SECRET_KEY, SMTP, S3, Anthropic, etc.)
sont créés manuellement via `kubectl create secret`. Risques : secrets en clair
dans pipelines, manipulations manuelles, pas d'audit, rotation difficile
(cf. `MODERNISATION_12_DEVOPS_DEPLOIEMENT.md` R3).

## Options envisagées

### Option A — sealed-secrets (Bitnami)
- ✅ Simple, léger, Git-friendly
- ✅ Chiffrement asymétrique par cluster
- 🟡 Rotation manuelle

### Option B — SOPS + age (Mozilla)
- ✅ Très simple, indépendant K8s
- ✅ Multi-cible (env files, K8s, Terraform)
- 🟡 Pas d'API, manipulation CLI

### Option C — HashiCorp Vault
- ✅ Riche (rotation auto, dynamic secrets, audit complet)
- ❌ Lourd à opérer

### Option D — External Secrets Operator + backend (Vault, AWS SM…)
- ✅ Découplage K8s ↔ source secrets
- 🟡 Combine avec Vault (Option C)

## Décision

(à compléter)

Recommandation : **Option A (sealed-secrets)** pour démarrer Vague A, avec
**migration Option C+D (Vault + ESO)** envisagée à 12 mois si volume secrets
grossit.

## Conséquences

* **À mettre en place** :
  - sealed-secrets controller installé
  - Chaque secret K8s commit en Git chiffré
  - Procédure rotation documentée
  - Onboarding dev (kubeseal CLI)

## Validation

* À valider semaine 0 du Sprint 0.
