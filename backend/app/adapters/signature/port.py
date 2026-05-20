"""Port (interface) pour la signature électronique."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal, Protocol

SignatureStatus = Literal["DRAFT", "SENT", "SIGNED", "REJECTED", "EXPIRED", "CANCELLED"]


@dataclass(frozen=True, slots=True)
class SignatureResult:
    """Résultat d'une opération de signature.

    `signature_hash` (SHA-256 du document signé) + `verification_code`
    sont **toujours** persistés, indépendamment du provider, pour
    permettre la vérification publique via QR code.
    """

    provider_name: str
    external_envelope_id: str | None
    envelope_status: SignatureStatus
    signature_hash: str
    verification_code: str
    signed_document_bytes: bytes | None = None
    signed_at: datetime | None = None
    payload: dict[str, Any] = field(default_factory=dict)


class SignaturePort(Protocol):
    """Interface qu'un adapter de signature doit implémenter."""

    provider_name: str

    async def sign_document(
        self,
        *,
        document_bytes: bytes,
        document_reference: str,
        signer_full_name: str,
        signer_email: str | None = None,
        reason: str | None = None,
    ) -> SignatureResult: ...

    async def verify_signature(self, *, verification_code: str) -> SignatureResult | None: ...
