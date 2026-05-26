"""Configuration applicative — chargée et validée au démarrage.

Suit le principe 12-factor : toute la configuration provient de variables
d'environnement, validées par Pydantic. Le boot de l'application échoue
immédiatement si une variable critique est manquante ou invalide en
production, plutôt que de planter en cours d'exécution.
"""

from __future__ import annotations

import re
from enum import StrEnum
from functools import lru_cache
from typing import Annotated, Final, Literal

from pydantic import Field, SecretStr, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Format attendu pour PII_ENCRYPTION_KEYS : CSV de ``kv\d+:<base64-fernet>``.
# Une clé Fernet base64-urlsafe fait toujours 44 caractères (32 bytes encodés
# + padding ``=``).
_PII_KEYS_RE: Final[re.Pattern[str]] = re.compile(
    r"^(kv\d+:[A-Za-z0-9_\-=]{44})(,kv\d+:[A-Za-z0-9_\-=]{44})*$"
)


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

    # ---------------- Chiffrement PII (Vague 9) ----------------
    # Format : "kv1:<fernet-44>,kv2:<fernet-44>". Première = clé d'écriture,
    # les suivantes servent au déchiffrement durant la rotation.
    pii_encryption_keys: SecretStr = Field(default=SecretStr(""))
    # HMAC-SHA256 hex (≥ 32 bytes = 64 chars hex) pour les lookups
    # déterministes sur PII (ex. recherche par email).
    email_lookup_hmac_key: SecretStr = Field(default=SecretStr(""))

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

    # ---------------- Upload guard (P0 #6) ----------------
    upload_max_size_bytes: Annotated[int, Field(ge=1)] = 50 * 1024 * 1024  # 50 MB
    # CSV ou liste : types MIME autorisés pour les pièces téléversées. Le défaut
    # couvre PDF, images web et bureautique Word (.doc/.docx).
    upload_allowed_mime_types: str | list[str] = (
        "application/pdf,"
        "image/jpeg,"
        "image/png,"
        "image/webp,"
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document,"
        "application/msword"
    )

    # ---------------- Antivirus ClamAV (opt-in) ----------------
    clamav_enabled: bool = False
    clamav_unix_socket: str = "/var/run/clamav/clamd.ctl"
    clamav_tcp_host: str | None = None
    clamav_tcp_port: Annotated[int, Field(ge=1, le=65535)] = 3310
    clamav_timeout_seconds: Annotated[int, Field(ge=1, le=600)] = 30

    # Provider LLM : "mock" | "anthropic" | "openai" | "groq" | "ollama"
    llm_provider: Literal["mock", "anthropic", "openai", "groq", "ollama"] = "mock"
    llm_model: str = "claude-opus-4-7"
    anthropic_api_key: SecretStr | None = None
    openai_api_key: SecretStr | None = None
    openai_base_url: str = "https://api.openai.com/v1"
    groq_api_key: SecretStr | None = None
    groq_model: str = "llama-3.3-70b-versatile"
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

    @field_validator("pii_encryption_keys")
    @classmethod
    def _check_pii_keys_format(cls, v: SecretStr, info: ValidationInfo) -> SecretStr:
        raw = v.get_secret_value()
        env = info.data.get("env", Environment.DEV)
        if not raw:
            if env in {Environment.STAGING, Environment.PROD}:
                raise ValueError("PII_ENCRYPTION_KEYS est requis en staging/prod.")
            return v
        if not _PII_KEYS_RE.match(raw):
            raise ValueError(
                "PII_ENCRYPTION_KEYS doit matcher "
                "`kvN:<base64-fernet-44>[,kvN:<base64-fernet-44>]...`."
            )
        return v

    @field_validator("email_lookup_hmac_key")
    @classmethod
    def _check_hmac_key_strength(cls, v: SecretStr, info: ValidationInfo) -> SecretStr:
        raw = v.get_secret_value()
        env = info.data.get("env", Environment.DEV)
        if not raw:
            if env in {Environment.STAGING, Environment.PROD}:
                raise ValueError("EMAIL_LOOKUP_HMAC_KEY est requis en staging/prod.")
            return v
        if len(raw) < 64:
            raise ValueError(
                "EMAIL_LOOKUP_HMAC_KEY doit contenir au moins 64 caractères hex (32 bytes minimum)."
            )
        try:
            bytes.fromhex(raw)
        except ValueError as err:
            raise ValueError("EMAIL_LOOKUP_HMAC_KEY doit être une chaîne hexadécimale.") from err
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

    def upload_allowed_mime_types_list(self) -> list[str]:
        """Liste normalisée des types MIME autorisés pour les uploads.

        Accepte aussi bien une chaîne CSV venue de l'env qu'une liste injectée
        en test. Lowercased, dédupliqué, ordre préservé.
        """
        raw = self.upload_allowed_mime_types
        if isinstance(raw, str):
            items = [t.strip().lower() for t in raw.split(",") if t.strip()]
        else:
            items = [t.strip().lower() for t in raw if t and t.strip()]
        seen: dict[str, None] = {}
        for it in items:
            seen.setdefault(it, None)
        return list(seen.keys())

    @property
    def is_prod(self) -> bool:
        return self.env is Environment.PROD

    @property
    def is_test(self) -> bool:
        return self.env is Environment.TEST

    def is_pii_crypto_configured(self) -> bool:
        """True si les deux secrets PII (chiffrement + HMAC lookup) sont définis."""
        return bool(
            self.pii_encryption_keys.get_secret_value()
            and self.email_lookup_hmac_key.get_secret_value()
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Singleton settings — évite de relire le .env à chaque appel."""
    return Settings()
