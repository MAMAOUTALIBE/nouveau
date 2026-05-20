# Architecture Decision Records (ADR)

Ce dossier contient les décisions structurantes du projet GPA-GOUVE, format **MADR**
(Markdown Architectural Decision Records, https://adr.github.io/madr/).

## Convention

- Un fichier par décision : `ADR-NNN-titre-court.md`.
- Statuts : `proposed`, `accepted`, `rejected`, `deprecated`, `superseded by ADR-XXX`.
- Aucune décision ne doit être implémentée tant qu'elle est en `proposed`.
- Une décision acceptée engage l'équipe et la maîtrise d'ouvrage.

## Index

### Sprint 0 — Décisions amont Vague A (à valider semaine 0)

| # | Titre | Statut | Sponsor |
|---|---|---|---|
| ADR-001 | [Hébergement de production](ADR-001-hosting-production.md) | proposed | Cabinet PM × DSI × ANSUTEN |
| ADR-002 | [Site secondaire pour PRA / DR](ADR-002-site-dr-secondaire.md) | proposed | Cabinet PM |
| ADR-003 | [Container registry](ADR-003-container-registry.md) | proposed | DSI |
| ADR-004 | [Secrets management Kubernetes](ADR-004-secrets-management.md) | proposed | DSI |
| ADR-005 | [PKI signature électronique](ADR-005-pki-signature.md) | proposed | DSI × DPO × juriste |
| ADR-006 | [TSA horodatage RFC 3161](ADR-006-tsa-horodatage.md) | proposed | DSI |
| ADR-007 | [Référentiel statutaire FP-GN](ADR-007-referentiel-statutaire-fp-gn.md) | proposed | DRH × Min. FP |
| ADR-008 | [Référentiel sanctions FP-GN](ADR-008-referentiel-sanctions-fp-gn.md) | proposed | Min. FP |
| ADR-009 | [Désignation du DPO](ADR-009-dpo-designation.md) | proposed | Cabinet PM |
| ADR-010 | [Comité de pilotage](ADR-010-comite-pilotage.md) | proposed | Cabinet PM |
| ADR-011 | [Budget externes Vague A](ADR-011-budget-externes.md) | proposed | DAF |
| ADR-012 | [OIDC national Pro Connect Agent GN](ADR-012-oidc-national.md) | proposed | DSI |
| ADR-013 | [Fournisseur SMS](ADR-013-fournisseur-sms.md) | proposed | DSI × Achats |
| ADR-014 | [Autorité de certification TLS](ADR-014-autorite-certification-tls.md) | proposed | DSI |

## Modèle vide

Voir [TEMPLATE.md](TEMPLATE.md) pour démarrer une nouvelle décision.
