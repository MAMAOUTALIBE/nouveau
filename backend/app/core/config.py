"""Configuration applicative — chargée et validée au démarrage.

Suit le principe 12-factor : toute la configuration provient de variables
d'environnement, validées par Pydantic. Le boot de l'application échoue
immédiatement si une variable critique est manquante ou invalide en
production, plutôt que de planter en cours d'exécution.
"""

from __future__ import annotations

from enum import StrEnum
from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(StrEnum):
    """Environnements de déploiement supportés."""

    DEV = "dev"
    STAGING = "staging"
    PROD = "prod"
    TEST = "test"


class Settings(BaseSettings):
    """Paramètres applicatifs validés au boot via variables d'env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ---------------- Environnement / serveur ----------------
    env: Environment = Environment.DEV
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    app_host: str = "127.0.0.1"
    app_port: Annotated[int, Field(ge=1, le=65535)] = 8000

    # ---------------- Sécurité ----------------
    jwt_secret_key: SecretStr
    jwt_access_ttl_seconds: Annotated[int, Field(ge=60)] = 1800  # 30 min
    jwt_refresh_ttl_seconds: Annotated[int, Field(ge=300)] = 86400  # 24 h
    jwt_algorithm: Literal["HS256", "HS384", "HS512"] = "HS256"
    # Min 4 autorisé pour tests rapides ; le défaut prod (12) reste sûr.
    bcrypt_rounds: Annotated[int, Field(ge=4, le=15)] = 12

    rate_limit_login_max: Annotated[int, Field(ge=1)] = 5
    rate_limit_login_window_seconds: Annotated[int, Field(ge=10)] = 60
    rate_limit_login_lock_seconds: Annotated[int, Field(ge=60)] = 900

    allowed_origins: str = "http://127.0.0.1:4200,http://localhost:4200"

    # ---------------- Base de données ----------------
    database_url: str
    db_pool_size: Annotated[int, Field(ge=1, le=50)] = 10
    db_max_overflow: Annotated[int, Field(ge=0, le=50)] = 10
    db_echo: bool = False

    run_migrations_on_startup: bool = False
    schema_name: str = "hr"

    # ---------------- Audit ----------------
    audit_log_request_body: bool = False  # JAMAIS true en prod (PII)

    # ---------------- Observabilité (Vague 8) ----------------
    sentry_dsn: SecretStr | None = None
    sentry_traces_sample_rate: float = 0.05
    otel_enabled: bool = False
    otel_service_name: str = "rh-primature-backend"
    otel_exporter_otlp_endpoint: str | None = None

    # ---------------- 2FA TOTP (Vague 8) ----------------
    totp_issuer: str = "DRH"
    totp_required_for_roles: str = "super_admin,hr_manager"  # CSV

    # ---------------- Adapters externes ----------------
    # Provider OCR : "mock" | "tesseract" | "azure" | "aws"
    ocr_provider: Literal["mock", "tesseract", "azure", "aws"] = "mock"
    azure_form_recognizer_endpoint: str | None = None
    azure_form_recognizer_key: SecretStr | None = None
    aws_textract_region: str = "eu-west-1"
    tesseract_lang: str = "fra+eng"

    # Provider signature : "mock" | "endesive" | "universign" | "yousign" | "docusign"
    signature_provider: Literal["mock", "endesive", "universign", "yousign", "docusign"] = "mock"
    universign_api_url: str | None = None
    universign_api_key: SecretStr | None = None
    yousign_api_url: str | None = None
    yousign_api_key: SecretStr | None = None
    endesive_p12_path: str | None = None
    endesive_p12_password: SecretStr | None = None

    # Provider email : "mock" | "smtp" | "sendgrid"
    email_provider: Literal["mock", "smtp", "sendgrid"] = "mock"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_use_tls: bool = True
    mail_from: str = "no-reply@primature.gov.gn"
    sendgrid_api_key: SecretStr | None = None

    # Provider storage : "local" | "minio" | "s3"
    storage_provider: Literal["local", "minio", "s3"] = "local"
    storage_local_dir: str = "./uploads"
    s3_endpoint_url: str | None = None  # endpoint MinIO custom si applicable
    s3_bucket: str = "rh-primature"
    s3_region: str = "eu-west-1"
    s3_access_key: str | None = None
    s3_secret_key: SecretStr | None = None

    # Provider BPMN : "internal" (moteur maison) | "spiff" (SpiffWorkflow)
    bpmn_provider: Literal["internal", "spiff"] = "internal"
    bpmn_models_dir: str = "../bpmn"

    # Provider LLM : "mock" | "anthropic" | "openai" | "ollama"
    llm_provider: Literal["mock", "anthropic", "openai", "ollama"] = "mock"
    llm_model: str = "claude-opus-4-7"
    anthropic_api_key: SecretStr | None = None
    openai_api_key: SecretStr | None = None
    ollama_base_url: str = "http://127.0.0.1:11434"
    llm_max_tokens: int = 4096
    llm_temperature: float = 0.2

    # ---------------- Validators ----------------
    @field_validator("jwt_secret_key")
    @classmethod
    def _check_jwt_secret_strength(cls, v: SecretStr) -> SecretStr:
        secret = v.get_secret_value()
        if len(secret) < 32:
            raise ValueError(
                "JWT_SECRET_KEY doit contenir au moins 32 caractères "
                "(actuellement %d)." % len(secret)
            )
        return v

    @field_validator("database_url")
    @classmethod
    def _check_database_url_async_driver(cls, v: str) -> str:
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL doit utiliser le driver async asyncpg "
                "(format: postgresql+asyncpg://user:pass@host:port/dbname)"
            )
        return v

    def model_post_init(self, _: object) -> None:
        """Garde-fous runtime — refuser des configurations risquées en prod."""
        if self.is_prod:
            if self.bcrypt_rounds < 10:
                raise ValueError(
                    "BCRYPT_ROUNDS doit être ≥ 10 en production "
                    f"(actuellement {self.bcrypt_rounds})."
                )
            secret = self.jwt_secret_key.get_secret_value()
            if "dev-only" in secret or "change" in secret.lower():
                raise ValueError(
                    "JWT_SECRET_KEY ressemble à une valeur de développement. "
                    "Générer un secret aléatoire via `openssl rand -hex 32`."
                )

    # ---------------- Helpers ----------------
    def cors_origins(self) -> list[str]:
        """Liste des origines CORS autorisées (parsée depuis CSV)."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_prod(self) -> bool:
        return self.env is Environment.PROD

    @property
    def is_test(self) -> bool:
        return self.env is Environment.TEST


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton settings — évite de relire le .env à chaque appel."""
    return Settings()
