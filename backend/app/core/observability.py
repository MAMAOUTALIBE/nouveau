"""Configuration Sentry + OpenTelemetry — opt-in via env vars.

Sentry : capture des erreurs non handlées + traces APM légères.
OpenTelemetry : traces distribuées exportées vers un collector OTLP
(Grafana Tempo, Jaeger, etc.) sur `OTEL_EXPORTER_OTLP_ENDPOINT`.

Imports paresseux : si les libs ne sont pas installées, on log un
warning et on continue. Le boot ne casse jamais à cause de
l'observabilité.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.config import Settings
from app.core.logging import get_logger

if TYPE_CHECKING:
    from fastapi import FastAPI

_logger = get_logger(__name__)


def setup_sentry(settings: Settings) -> None:
    if settings.sentry_dsn is None:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.asyncio import AsyncioIntegration
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
    except ImportError:
        _logger.warning(
            "sentry_sdk_not_installed",
            hint="`uv add 'sentry-sdk[fastapi]'` requis pour activer Sentry.",
        )
        return

    sentry_sdk.init(
        dsn=settings.sentry_dsn.get_secret_value(),
        environment=settings.env.value,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            AsyncioIntegration(),
            SqlalchemyIntegration(),
        ],
        send_default_pii=False,  # PII off par défaut (gouvernemental)
    )
    _logger.info("sentry_initialized", env=settings.env.value)


def setup_opentelemetry(app: FastAPI, settings: Settings) -> None:
    if not settings.otel_enabled or settings.otel_exporter_otlp_endpoint is None:
        return
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
            OTLPSpanExporter,
        )
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError:
        _logger.warning(
            "opentelemetry_not_installed",
            hint=(
                "Pour OTel : `uv add opentelemetry-api opentelemetry-sdk "
                "opentelemetry-exporter-otlp-proto-grpc "
                "opentelemetry-instrumentation-fastapi "
                "opentelemetry-instrumentation-sqlalchemy`"
            ),
        )
        return

    resource = Resource.create({"service.name": settings.otel_service_name})
    provider = TracerProvider(resource=resource)
    exporter = OTLPSpanExporter(endpoint=settings.otel_exporter_otlp_endpoint)
    provider.add_span_processor(BatchSpanProcessor(exporter))
    trace.set_tracer_provider(provider)

    FastAPIInstrumentor.instrument_app(app)
    SQLAlchemyInstrumentor().instrument()
    _logger.info(
        "opentelemetry_initialized",
        service=settings.otel_service_name,
        endpoint=settings.otel_exporter_otlp_endpoint,
    )
