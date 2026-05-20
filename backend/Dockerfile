# =====================================================================
# RH Primature — Backend Python/FastAPI
# Image multi-stage : build (uv) puis runtime slim.
# =====================================================================

# -------- Stage 1 : build --------
FROM python:3.12-slim AS builder

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

# Dépendances système nécessaires : asyncpg / passlib / weasyprint plus tard
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        curl \
    && rm -rf /var/lib/apt/lists/*

# uv (pin à minor pour reproductibilité)
COPY --from=ghcr.io/astral-sh/uv:0.11 /uv /usr/local/bin/uv

WORKDIR /app

# Couche dépendances (cache Docker layer)
COPY pyproject.toml uv.lock* ./
RUN uv sync --frozen --no-install-project --no-dev || \
    uv sync --no-install-project --no-dev

# Code applicatif
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY scripts ./scripts

# Installation finale du projet
RUN uv sync --frozen --no-dev || uv sync --no-dev


# -------- Stage 2 : runtime --------
FROM python:3.12-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/app/.venv/bin:$PATH"

# Utilisateur non-root
RUN groupadd --system --gid 1000 app \
    && useradd --system --uid 1000 --gid app --create-home --home-dir /home/app app

WORKDIR /app

# Copie du venv + sources depuis le builder
COPY --from=builder --chown=app:app /app/.venv /app/.venv
COPY --from=builder --chown=app:app /app/app /app/app
COPY --from=builder --chown=app:app /app/alembic /app/alembic
COPY --from=builder --chown=app:app /app/alembic.ini /app/alembic.ini
COPY --from=builder --chown=app:app /app/scripts /app/scripts

USER app

EXPOSE 8000

# Healthcheck Docker basique
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=10s \
    CMD python -c "import urllib.request,sys; \
        sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health',timeout=2).status==200 else 1)"

# Production : gunicorn + workers uvicorn (4 workers par défaut)
CMD ["gunicorn", "app.main:app", \
     "--bind", "0.0.0.0:8000", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
