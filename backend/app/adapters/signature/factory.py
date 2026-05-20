"""Factory de sélection de l'adapter signature."""

from __future__ import annotations

from functools import lru_cache

from app.adapters.signature.endesive_local import EndesiveLocalSignatureAdapter
from app.adapters.signature.mock import MockSignatureAdapter
from app.adapters.signature.port import SignaturePort
from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_signature_adapter() -> SignaturePort:
    settings = get_settings()
    provider = settings.signature_provider

    if (
        provider == "endesive"
        and settings.endesive_p12_path
        and settings.endesive_p12_password is not None
    ):
        return EndesiveLocalSignatureAdapter(
            p12_path=settings.endesive_p12_path,
            p12_password=settings.endesive_p12_password.get_secret_value(),
        )

    if provider in ("universign", "yousign", "docusign"):
        # Stubs — adapters cloud à brancher quand prestataire choisi.
        # On tombe sur Mock pour ne pas bloquer le boot.
        return MockSignatureAdapter()

    return MockSignatureAdapter()
