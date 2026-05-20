"""Adapters externes — implémentation hexagonale (ports + adapters).

Chaque domaine externe (OCR, signature, email, storage, LLM) expose un
**port** (interface Protocol Python) implémenté par plusieurs **adapters**.
La sélection est faite par variable d'environnement via les `factory`.

Recommandations souveraineté pour la Primature de Guinée :
- OCR : `tesseract` (local, gratuit, contrôle total)
- Signature : `endesive` (PAdES local, si PKI gouvernementale disponible)
- Email : SMTP relay interne (pas SendGrid si éviter cloud étranger)
- Storage : `minio` on-prem
- LLM : `ollama` local sur GPU si disponible, sinon Anthropic en sandbox.
"""
