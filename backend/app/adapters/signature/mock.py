"""Adapter signature Mock — SHA-256 + verification_code interne.

Utile pour démos hors-ligne et tests. **N'EST PAS** une vraie signature
légale (pas de PKI, pas de timestamp horodaté). Pour la prod, basculer
sur `endesive` (PAdES local) ou un prestataire eIDAS.
"""

from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
from secrets import token_urlsafe

from app.adapters.signature.port import SignaturePort, SignatureResult


class MockSignatureAdapter(SignaturePort):
    provider_name = "mock"

    def __init__(self) -> None:
        # Cache interne pour la vérification (process-local)
        self._registry: dict[str, SignatureResult] = {}

    async def sign_document(
        self,
        *,
        document_bytes: bytes,
        document_reference: str,
        signer_full_name: str,
        signer_email: str | None = None,
        reason: str | None = None,
    ) -> SignatureResult:
        signature_hash = sha256(document_bytes).hexdigest()
        verification_code = token_urlsafe(16)
        result = SignatureResult(
            provider_name=self.provider_name,
            external_envelope_id=None,
            envelope_status="SIGNED",
            signature_hash=signature_hash,
            verification_code=verification_code,
            signed_document_bytes=document_bytes,
            signed_at=datetime.now(tz=UTC),
            payload={
                "document_reference": document_reference,
                "signer_full_name": signer_full_name,
                "signer_email": signer_email,
                "reason": reason,
                "warning": "Mock signature — not a legally binding signature",
            },
        )
        self._registry[verification_code] = result
        return result

    async def verify_signature(self, *, verification_code: str) -> SignatureResult | None:
        return self._registry.get(verification_code)
