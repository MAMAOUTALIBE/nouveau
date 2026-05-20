# Helm chart — backend RH Primature

Déploiement Kubernetes du backend Python sur cluster managé (OVH, Scaleway,
Outscale) ou DC souverain Primature.

## Pré-requis

- Cluster K8s ≥ 1.28.
- Postgres déployé séparément (chart bitnami/postgresql ou DB managée).
- MinIO déployé séparément (chart bitnami/minio).
- Ingress controller (nginx ou traefik).
- cert-manager pour la TLS automatique (`Let's Encrypt`).

## Installation

```bash
# 1. Créer les secrets sensibles
kubectl create namespace rh-primature
kubectl -n rh-primature create secret generic rh-primature-secrets \
  --from-literal=DATABASE_URL='postgresql+asyncpg://rh_user:***@postgresql:5432/rh_primature' \
  --from-literal=JWT_SECRET_KEY='<openssl rand -hex 32>' \
  --from-literal=SMTP_PASSWORD='***' \
  --from-literal=S3_ACCESS_KEY='***' \
  --from-literal=S3_SECRET_KEY='***' \
  --from-literal=ENDESIVE_P12_PASSWORD='***' \
  --from-literal=SENTRY_DSN='https://***@sentry.io/***' \
  --from-literal=ANTHROPIC_API_KEY='sk-ant-***'

# 2. Push de l'image Docker
docker build -t rh-primature-backend:0.1.0 ../..  # depuis Final/backend/
docker tag rh-primature-backend:0.1.0 registry.gov.gn/rh-primature-backend:0.1.0
docker push registry.gov.gn/rh-primature-backend:0.1.0

# 3. Configmap des modèles BPMN
kubectl -n rh-primature create configmap rh-primature-backend-bpmn-models \
  --from-file=../../bpmn/

# 4. Helm install
helm -n rh-primature install backend . \
  --set image.repository=registry.gov.gn/rh-primature-backend \
  -f values-prod.yaml
```

## Probes Kubernetes

- `/api/v1/health` est utilisé pour `livenessProbe` et `readinessProbe`.
  Le endpoint répond toujours 200 (champ `status: ok|degraded`) — Kubernetes
  considère le pod "alive" tant qu'il répond.

## Mises à jour

```bash
helm -n rh-primature upgrade backend . --set image.tag=0.2.0
```

Les migrations Alembic sont appliquées au boot via
`RUN_MIGRATIONS_ON_STARTUP=true` (cf. `values.yaml`).

## Rollback

```bash
helm -n rh-primature rollback backend
```

## Recommandations souveraineté

- Utiliser un registry container privé (Harbor, GitLab Container Registry)
  hébergé en Guinée plutôt que docker.io.
- Le secret `JWT_SECRET_KEY` doit être généré aléatoirement par le DC, pas
  partagé avec un cloud étranger.
- Les certificats TLS peuvent être émis par l'autorité guinéenne (ANSI)
  plutôt que Let's Encrypt si compliance impose un PKI national.
