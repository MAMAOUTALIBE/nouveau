"""Exceptions applicatives + handlers FastAPI."""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)


class ApiError(Exception):
    """Erreur applicative typée — convertie en JSON propre.

    Convention de format de réponse harmonisée avec le mock-backend
    Node.js existant : `{ error: { code, message, details? } }`.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = "INTERNAL_ERROR"

    def __init__(
        self,
        message: str,
        *,
        status_code: int | None = None,
        code: str | None = None,
        details: Any = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.details = details


class ValidationError(ApiError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "VALIDATION"


class AuthenticationError(ApiError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "UNAUTHORIZED"


class ForbiddenError(ApiError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "FORBIDDEN"


class NotFoundError(ApiError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "NOT_FOUND"


class ConflictError(ApiError):
    status_code = status.HTTP_409_CONFLICT
    code = "CONFLICT"


class RateLimitError(ApiError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "RATE_LIMITED"

    def __init__(
        self,
        message: str = "Trop de tentatives. Réessayez plus tard.",
        retry_after_seconds: int | None = None,
    ) -> None:
        super().__init__(message)
        self.retry_after_seconds = retry_after_seconds


def _error_payload(code: str, message: str, details: Any = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        payload["details"] = details
    return {"error": payload}


def register_exception_handlers(app: FastAPI) -> None:
    """Enregistre les handlers d'exception sur l'application FastAPI."""

    @app.exception_handler(ApiError)
    async def _api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
        logger.warning(
            "api_error",
            code=exc.code,
            status=exc.status_code,
            message=exc.message,
        )
        headers: dict[str, str] = {}
        if isinstance(exc, RateLimitError) and exc.retry_after_seconds:
            headers["Retry-After"] = str(exc.retry_after_seconds)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.code, exc.message, exc.details),
            headers=headers,
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http_handler(_request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload("HTTP_ERROR", str(exc.detail)),
        )

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=_error_payload(
                "VALIDATION",
                "Requête invalide.",
                exc.errors(),
            ),
        )

    @app.exception_handler(SQLAlchemyError)
    async def _sa_handler(_request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.error("database_error", error=str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_payload(
                "DATABASE_ERROR",
                "Erreur de base de données. L'incident a été tracé.",
            ),
        )

    @app.exception_handler(Exception)
    async def _generic_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled_exception", error=str(exc))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_payload(
                "INTERNAL_ERROR",
                "Une erreur interne est survenue.",
            ),
        )
