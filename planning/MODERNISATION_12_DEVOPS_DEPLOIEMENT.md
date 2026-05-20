# Fiche de modernisation 12 — DevOps, Déploiement & Continuité d'activité

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/Dockerfile`, `Final/backend/docker-compose.yml`, `Final/backend/deploy/helm/`, `Final/railway.json`, `Final/CUTOVER.md`, `Final/.github/workflows/quality.yml`, `Final/mock-backend/server.cjs`

## 0. Résumé exécutif

Stack DevOps **plus mature que prévu** : Dockerfile multi-stage non-root, Docker Compose dev orchestré (PG + Redis + MinIO + backend), **Helm chart Kubernetes versionné** (deployment 2 replicas, ingress nginx + TLS, service ClusterIP, ConfigMap pour modèles BPMN, probes live/ready), Railway config pour staging, CUTOVER.md documenté avec migration mock Node → Python achevée. **Quatre lacunes opérationnelles critiques** pour un SI d'État : (1) **aucune procédure de backup/restauration** (PostgreSQL et MinIO), (2) **aucun PRA/DR** (Plan de Reprise d'Activité), aucun site secondaire défini, (3) **secrets en clair** (manuel via `kubectl create secret`, pas de Vault / sealed-secrets / SOPS), (4) **CI ne push pas l'image Docker** (build local seulement) ; pas de pipeline CD. À cela s'ajoute (5) **mock-backend Node.js de 16 720 lignes** encore présent : à archiver, mais procédure de retrait à graver. Sur la souveraineté, le projet est **K8s-portable** (déployable sur ANSUTEN, OVH Paris, Scaleway, ou cluster on-prem Primature) — c'est un atout majeur.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Dockerfile backend | `Final/backend/Dockerfile` (78 lignes, multi-stage uv builder + slim runtime, gunicorn 4 workers UID 1000) |
| Docker Compose dev | `Final/backend/docker-compose.yml` (PG 16 alpine, Redis 7, MinIO, backend) |
| Helm chart | `Final/backend/deploy/helm/{Chart.yaml v0.1.0, values.yaml, README.md, templates/{deployment,ingress,service}.yaml}` |
| Railway | `Final/railway.json` |
| CUTOVER | `Final/CUTOVER.md` |
| Mock legacy Node | `Final/mock-backend/server.cjs` (16 720 lignes), `mock-backend/persistence/`, `mock-backend/uploads/` |
| CI | `Final/.github/workflows/quality.yml` (33 lignes — typecheck + vitest + build) |
| Frontend dist | `Final/dist/` |
| Observabilité | `Final/backend/app/core/observability.py` |

## 2. État réel (vérifié dans le code)

### Conteneurisation

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Dockerfile multi-stage | ✅ | `Dockerfile` builder uv → runtime slim | Bonne hygiène. |
| User non-root (UID 1000) | ✅ | Dockerfile | OK. |
| Healthcheck conteneur | ✅ | HEALTHCHECK HTTP `/api/v1/health` | OK. |
| Image base Python 3.12 slim | ✅ | OK | Migrer vers 3.13 quand stable (CVE patches). |
| .dockerignore propre | ✅ | exclut venv, tests, .env, .git | OK. |
| docker-compose dev orchestré | ✅ | PG + Redis + MinIO + backend + healthchecks | Bon pour onboarding dev en 5 minutes. |
| Volumes persistants (PG/MinIO) | ✅ | `rh_postgres_data`, `rh_minio_data` | OK. |
| MailHog dev SMTP | ❌ | absent dans compose | À ajouter pour dev local notifications. |
| Ollama dev (LLM local) | ❌ | absent | À ajouter (cf. fiche 07 P7). |

### Kubernetes / Helm

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Chart versionné | ✅ | `Chart.yaml` v0.1.0 | OK. |
| Deployment 2 replicas | ✅ | `templates/deployment.yaml` | OK pour démarrer ; à doter d'HPA. |
| Resources requests/limits | ✅ | requests 250m/512Mi, limits 1000m/1Gi | Sizing initial raisonnable. |
| Service ClusterIP:80→8000 | ✅ | OK | OK. |
| Ingress nginx + TLS (rh.primature.gov.gn) | ✅ | OK | À adapter au DNS réel. |
| Probes live/ready (/api/v1/health) | ✅ | OK | OK. |
| ConfigMap pour modèles BPMN | ✅ | montés `/app/bpmn` read-only | Bonne pratique. |
| **HPA (Horizontal Pod Autoscaler)** | ❌ | — | Pas de scale auto. |
| **PDB (Pod Disruption Budget)** | ❌ | — | Risque : drain de nœud pendant un upgrade prend tous les pods. |
| **NetworkPolicy** | ❌ | — | Pods backend exposés à tout le cluster par défaut. |
| **Secrets : sealed-secrets / Vault / SOPS** | ❌ | manuels `kubectl create secret` | Risque : secrets en clair dans pipelines, manipulations manuelles. |
| **PostgreSQL en cluster** (Patroni / CloudNativePG / Crunchy) | ❌ | non couvert dans Helm | Doit être déployé séparément. |
| **MinIO cluster** (mode distributed) | ❌ | non couvert dans Helm | Idem. |
| Service mesh (Linkerd/Istio) | ❌ | — | V2+ pour mTLS interne. |

### CI / CD

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Workflow `quality.yml` | 🟡 | `.github/workflows/quality.yml` | typecheck + Vitest + build (frontend uniquement). |
| Pytest backend en CI | ❌ | — | Pas exécuté (cf. fiche 11 P2). |
| **Build Docker en CI** | ❌ | — | **Aucun build d'image dans le pipeline.** |
| **Push image vers registry** | ❌ | — | Aucun. |
| **Déploiement automatique (CD)** | ❌ | — | Aucun. |
| Versioning sémantique tags / image | ❌ | — | À mettre en place. |
| Release notes générées | ❌ | — | À mettre en place. |

### Cutover Mock Node → Python

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| CUTOVER.md documenté | ✅ | `CUTOVER.md` | Stratégie claire, validations Vagues 0-3 OK. |
| Bascule proxy.conf.json `:8080` → `:8000` | ✅ | OK | Effective. |
| Mock Node toujours présent (16 720 lignes) | 🟡 | `mock-backend/server.cjs` | À archiver/supprimer définitivement. |
| Plan de retrait formel | 🟡 | mentionné dans CUTOVER.md | « 2 semaines stabilité prod puis archivage » — à exécuter. |
| Smoke tests automatisés post-bascule | ❌ | — | Aucun (cf. fiche 11 P13). |

### Configuration & secrets

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| `.env.example` complet | ✅ | OK | Bon point de départ. |
| Pydantic Settings strict | ✅ | `core/config.py` (cf. fiche 01) | OK. |
| Vault / Secrets Manager / sealed-secrets | ❌ | — | À mettre en place. |
| Rotation secrets documentée | ❌ | — | Procédure absente. |

### Observabilité prod

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Logs JSON structlog | ✅ | OK | OK. |
| Sentry opt-in | ✅ | DSN env | OK. |
| OpenTelemetry opt-in | ✅ | endpoint OTLP env | OK. |
| Prometheus `/metrics` | ❌ | — | (cf. fiche 01 P7) |
| **Stack centralisée logs (Loki/ELK/Grafana)** | ❌ | non spécifié | Logs disparaissent à la mort du pod. |
| **Alerting opérationnel** (Alertmanager / PagerDuty / Opsgenie) | ❌ | — | Aucun. |

### Backup / DR

| Élément | État | Commentaire |
|---|---|---|
| Backup PostgreSQL automatisé | ❌ | **Aucune procédure documentée.** |
| Backup MinIO (snapshots, réplication) | ❌ | Aucun. |
| Test de restauration régulier | ❌ | Aucun. |
| RPO / RTO définis | ❌ | Aucun chiffre. |
| Site DR secondaire | ❌ | Aucun. |
| Documentation incident response | ❌ | Aucun runbook. |

### Frontend SPA

| Élément | État | Commentaire |
|---|---|---|
| Build `dist/` | ✅ | OK. |
| Servi par backend Python | 🟡 | Couplage frontend/backend. À envisager nginx sidecar ou CDN séparé. |
| Cache busting (hashes) | ✅ | Angular build par défaut | OK. |
| Compression brotli/gzip | 🟡 | dépend du proxy | À forcer côté nginx ingress. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **DGNUM FR — exigences hébergement SecNumCloud** | K8s portable, hébergement à valider | 🟡 |
| **ANSSI — Politique de Sécurité des SI de l'État (PSSIE)** : sauvegarde quotidienne + DR | Aucun backup | ❌ |
| **CIS Kubernetes Benchmark** | NetworkPolicy / PDB / RBAC partiels | 🟡 |
| **OWASP Container Top 10** | User non-root ✅, Trivy ❌ (cf. fiche 11 P6) | 🟡 |
| **CNCF — Cloud Native Trail Map** : observabilité, mesh, GitOps, policy | Observabilité partielle | 🟡 |
| **Estonia — KORALL** (gestion infrastructure publique) : PRA + RPO < 1 h | Aucun | ❌ |
| **France — circulaire Cloud au centre (2021)** | Pas applicable directement (autre juridiction) | ⚪ |
| **Sénégal — ADIE Datacenter National** | Modèle souhaitable | ⚪ |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Aucun backup** → perte BD ou MinIO = perte irrémédiable de 50 K dossiers agents. | **Catastrophique** | À première panne |
| R2 | **Aucun DR** → datacenter inondé / coupé / cyberattaque ransomware = arrêt total Primature. | **Catastrophique** | À première crise |
| R3 | **Secrets en clair** → un dump kubeconfig ou un audit AppArmor mal configuré = compromission BDD + JWT secret + accès Anthropic. | **Critique** | À première fuite |
| R4 | **Pas de CD** → déploiement manuel = humain qui copie-colle = bugs. | Élevée | À chaque release |
| R5 | **Pas de HPA / PDB** → upgrade Kubernetes = downtime SI Primature pendant la maintenance. | Élevée | À chaque maintenance |
| R6 | **Pas de NetworkPolicy** → un pod compromis (image tierce) peut requêter PG, MinIO, Anthropic. | Élevée | Continu |
| R7 | **Mock Node toujours présent** → faille connue (Node EOL, lib npm vulnérable) potentiellement servie en parallèle. | Moyenne | Continu |
| R8 | **Logs perdus à la mort du pod** → impossibilité d'analyse post-mortem incident. | Moyenne | À première panne |
| R9 | **Aucun runbook incident** → astreinte improvisée → MTTR énorme. | Moyenne | À première crise |
| R10 | **Frontend couplé backend** → upgrade frontend = redéploiement backend (et inversement). | Faible | Continu |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Backup PostgreSQL automatisé** : (a) `pg_basebackup` ou `pg_dump --format=custom` quotidien chiffré (gpg ou age), (b) WAL archivage continu (`archive_command` vers MinIO), (c) restauration testée mensuellement, (d) rétention 7j quotidiens + 4 hebdo + 12 mensuels + 7 annuels. CronJob Kubernetes. | Lève R1. RPO < 24 h, RTO < 4 h. | **5-7 j** | **P0** | MinIO dédié backups (bucket WORM) |
| **P2** | **Backup MinIO** : (a) replica MinIO sur cluster secondaire (mode mirror), (b) snapshots filesystem ZFS ou Btrfs si on-prem, (c) test restauration mensuel. | Lève R1 sur fichiers. | **3-5 j** | **P0** | Cluster MinIO secondaire |
| **P3** | **PRA / DR site secondaire** : Conakry (primaire) ↔ Kankan ou autre préfecture (secondaire). Réplication PG streaming async, MinIO mirror. RTO < 4 h, RPO < 1 h. Documentation de bascule. Test annuel obligatoire. | Lève R2. Conformité PSSIE-équivalent. | **15-25 j** + budget infra | **P0** | Datacenter secondaire ANSUTEN |
| **P4** | **Sealed-secrets ou SOPS** : chiffrer les secrets avec une clé gérée par DSI Primature (KMS local ou simple Age) ; commit chiffré dans le repo Helm ; déchiffrement à `helm install/upgrade`. Vault si croissance. | Lève R3. | **3-4 j** | **P0** | Décision outil |
| **P5** | **CD pipeline** : (a) push image Docker tagged (semver) vers registry privé Harbor (souverain) sur chaque tag git, (b) déploiement automatique staging à chaque main, (c) déploiement prod sur tag `release-*` avec validation manuelle, (d) rollback 1-clic. ArgoCD ou Flux. | Lève R4. Industrialise. | **5-7 j** | **P0** | Registry, ArgoCD |
| **P6** | **HPA + PDB + NetworkPolicy** : (a) HPA min 2 max 8 sur CPU > 70 %, (b) PDB `minAvailable: 1` pour assurer 1 pod toujours up pendant drains, (c) NetworkPolicy `default deny` + autoriser seulement PG, MinIO, Redis, SMTP. | Lève R5, R6. K8s prod-grade. | **3-5 j** | **P0** | — |
| **P7** | **Stack logs centralisée** : Loki + Promtail + Grafana (alternative légère à ELK), datasource Grafana unique, dashboards par module + dashboard sécurité (logins échoués, 401, 403). Rétention 30j en chaud, archivage MinIO 1 an. | Lève R8. Investigation rapide. | **5-7 j** | **P1** | Grafana stack |
| **P8** | **Alerting Alertmanager** : alertes p95 latency, taux 5xx, queue arq lag, login storm, PG replication lag. Routes vers email DSI + SMS d'astreinte (via adapter SMS GN cf. fiche 07 P13). | Détection précoce incidents. | **3 j** | **P1** | Prometheus, Alertmanager |
| **P9** | **Runbooks d'incident** : 10 runbooks types (PG down, MinIO full, Pod OOMKilled, brute-force login, OCR queue stuck, certificat TLS expirant, etc.) en Markdown dans `docs/runbooks/`. Lien depuis chaque alerte Alertmanager. | Lève R9. MTTR divisé par 3. | **5 j** | **P1** | — |
| **P10** | **Retrait définitif mock Node** : (a) confirmer 4 semaines stabilité prod Python, (b) archiver `mock-backend/` dans une branche tag `legacy-mock-archived-2026-XX`, (c) supprimer du tronc, (d) supprimer dépendances Node inutiles. Documentation finale CUTOVER.md. | Lève R7. Réduit surface code. | **2-3 j** | **P1** | — |
| **P11** | **Frontend séparé du backend** : (a) build Angular dans son propre image nginx (Caddy ou nginx-unprivileged), (b) Helm chart séparé, (c) déploiement indépendant. Backend ne sert plus de fichiers statiques. | Lève R10. Évolutivité. | **3-5 j** | **P1** | — |
| **P12** | **Datacenter / hosting souverain** : décision formelle ANSUTEN vs cloud public. Si cloud, OVH/Scaleway région UE (RGPD-friendly). Documenter le choix, exigences contractuelles, audit annuel hébergeur. | Souveraineté. | **5 j** + décision politique | **P0** | Décision Cabinet |
| **P13** | **MailHog + Ollama dans docker-compose dev** : pour développeurs locaux (notifications + LLM sans coût Anthropic). | UX dev. | **0,5 j** | **P2** | — |
| **P14** | **PostgreSQL HA** (Patroni + etcd ou CloudNativePG operator) : 1 primary + 1 standby + failover auto < 30 s. | Disponibilité. | **8-12 j** | **P1** | Cluster K8s, infra |
| **P15** | **Service mesh (Linkerd CE)** : mTLS auto entre tous les pods. Léger, gratuit, simple. | Sécurité interne. | **5-7 j** | **P2** | K8s mature |
| **P16** | **GitOps (ArgoCD)** : tout le cluster décrit en Git ; rollback git = rollback infra. Audit des changements = git log. | Conformité, auditabilité. | **5-7 j** | **P1** | P5 |

## 6. Souveraineté & UX terrain (équipe ops)

**Souveraineté.** Le projet est K8s-portable, ce qui est l'atout majeur. **Recommandation forte** :
- **Hébergement principal** : datacenter ANSUTEN ou équivalent gouvernemental guinéen (souveraineté maximale).
- **Hébergement de secours (DR)** : un second site GN éloigné géographiquement (Kankan, Labé), ou cloud UE (OVH/Scaleway Paris) si pas de second site GN disponible.
- **Registry images** : Harbor auto-hébergé sur l'infra Primature (`registry.gov.gn`) — bannir docker.io en production.
- **TLS** : autorité certification nationale ANSI (si elle existe) plutôt que Let's Encrypt en production critique. Let's Encrypt OK pour staging.
- **Secrets** : Vault auto-hébergé (à terme) ; sealed-secrets ou SOPS en attendant.

**UX équipe ops.**
- Runbooks (P9) sont l'outil de l'astreinte : Markdown court, étape par étape, captures d'écran, commandes copiables.
- Dashboards Grafana orientés rôle : « Vue DG » (uptime, incidents 24h), « Vue SRE » (latency, queue, PG), « Vue sécurité » (logins, 4xx/5xx, audit).
- Documentation onboarding ops : « comment je redémarre en sécurité », « comment je restaure un backup », « qui appeler si X ». Doit être lisible par un opérateur d'astreinte semi-tech.

## 7. Décision recommandée

**P0 absolus (3-4 semaines, ~30-40 j-h hors infra) :** P1 (backup PG), P2 (backup MinIO), P3 (PRA — la plus chère mais la plus critique), P4 (secrets), P5 (CD), P6 (HPA/PDB/NetworkPolicy), P12 (décision hosting).

**Sans P1 + P2 + P3, l'application ne doit pas accueillir des données réelles.** Une perte de dossiers d'agents de l'État est irrécupérable, politiquement et juridiquement.

**P1 (4-5 semaines)** : P7, P8, P9, P10, P11, P14, P16 = **30-43 j-h** (hors infra). Industrialise.

**P2** : P13, P15 = consolidation.

**Note politique cruciale.** Le PRA (P3) suppose un **second datacenter** ou au minimum un cloud secondaire. Cette décision dépasse la DSI : c'est un arbitrage Cabinet PM × Trésor × ANSUTEN. **Préparer le dossier dès maintenant**, ne pas attendre la fin Vague A.
