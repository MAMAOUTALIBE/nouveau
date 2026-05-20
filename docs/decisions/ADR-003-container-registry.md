# ADR-003 — Container registry

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI
* **Périmètre** : CI/CD, infrastructure

## Contexte

Les images Docker (backend Python, frontend nginx, workers) doivent être stockées
dans un registry pour le déploiement K8s. Docker Hub public est inadapté :
limites de pulls, gouvernance hors-GN, pas de scan intégré.

## Options envisagées

### Option A — Harbor auto-hébergé `registry.gov.gn`
- ✅ Souverain
- ✅ Scan vulnérabilités intégré (Trivy)
- ✅ Réplication entre registries possible (DR)
- 🟡 À installer et maintenir

### Option B — GitLab Container Registry (si GitLab self-hosted GN)
- ✅ Intégré au CI si GitLab utilisé
- 🟡 Couplage GitLab

### Option C — Cloud registry (AWS ECR, GitHub Packages)
- ❌ Sortie GN, dépendance étrangère

## Décision

(à compléter)

Recommandation : **Option A (Harbor)** — solution open source mature, pratique
GovTech standard.

## Conséquences

* **À mettre en place** :
  - Déploiement Harbor (Helm chart upstream)
  - Création projets `gpa-gouve/{backend,frontend,workers}`
  - Robot accounts CI/CD
  - Scan obligatoire à chaque push
  - Politique de rétention images (10 dernières + tags release)

## Validation

* À valider semaine 0 du Sprint 0.
