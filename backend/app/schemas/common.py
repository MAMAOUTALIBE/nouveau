"""Schémas Pydantic transverses (pagination, filtres, etc.)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class PageParams(BaseModel):
    """Paramètres standard de pagination."""

    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=200)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class Page[T](BaseModel):
    """Réponse paginée générique (PEP 695, Python 3.12+)."""

    items: list[T]
    total: int
    page: int
    page_size: int
