# =====================================================================
# RH Primature — Frontend Angular 21
# Image multi-stage : build (Node) puis service statique (nginx).
# Contexte de build attendu : racine du dépôt (dossier Final/).
# =====================================================================

# -------- Stage 1 : build Angular --------
FROM node:20 AS build

WORKDIR /app

# Pas besoin des navigateurs Playwright pour construire l'application.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    CI=1

# Couche dépendances (cache Docker tant que le lock ne change pas)
COPY package.json package-lock.json ./
RUN npm ci

# Code applicatif + build de production
COPY . .
RUN npm run build

# -------- Stage 2 : service statique nginx --------
FROM nginx:alpine AS runtime

# Configuration nginx : SPA + reverse-proxy /api vers le backend
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Artefacts de build (outputPath angular.json : dist/nowa-angular-21)
COPY --from=build /app/dist/nowa-angular-21 /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD wget -q --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
