# Contrat API - Documents Unifies

Date: 20 avril 2026

## Objectif

Ce contrat decrit la cible API pour stocker, analyser et traiter tous les documents RH a partir d'une source unique.

Il s'appuie sur la migration SQL:
- [002_unified_documents.sql](/Volumes/Sans titre 2/GPA-GOUVE/Final/db/postgresql/002_unified_documents.sql)

Le principe cible est simple:
- `documents` devient la source documentaire unique.
- `personnel.documents[]` devient une projection de compatibilite.
- les fichiers binaires restent hors PostgreSQL via `file_objects`.
- la conformite, l'analyse OCR et la retention sont des sous-domaines du meme modele.

## Regles de transition

- Les endpoints existants `GET /documents/library`, `POST /documents/library`, `POST /documents/library/:reference/sign`, `POST /documents/library/:reference/assign` restent supportes.
- `GET /personnel/agents` et `GET /personnel/agents/:id` peuvent continuer a exposer `documents[]`, mais ce tableau doit etre calcule depuis `vw_employee_documents`.
- Pendant la phase de migration, `POST/PUT /personnel/agents` peut encore accepter `documents[]`; le backend doit materialiser les ecritures dans `documents`, `document_versions` et `document_links`.
- Une fois la transition terminee, `documents[]` cote `personnel` devient strictement en lecture.

## Ressources cibles

### DocumentType

```json
{
  "id": "uuid",
  "code": "CONTRAT_TRAVAIL",
  "label": "Contrat",
  "moduleScope": "PERSONNEL",
  "ownerEntityType": "EMPLOYEE",
  "requiresExpiry": true,
  "requiresSignature": true,
  "requiresDispatch": false,
  "isSensitive": true,
  "defaultValidityDays": 1095,
  "retentionDays": 3650,
  "allowedMimeTypes": ["application/pdf"],
  "isActive": true
}
```

### Document

```json
{
  "reference": "DOC-2026-00045",
  "title": "Contrat de travail de Aminata Diallo",
  "documentTypeId": "uuid",
  "documentTypeCode": "CONTRAT_TRAVAIL",
  "documentStatus": "VALIDATED",
  "sourceModule": "PERSONNEL",
  "sourceRecordId": "employee-uuid",
  "confidentialityLevel": "CONFIDENTIAL",
  "employeeId": "employee-uuid",
  "employeeName": "Aminata Diallo",
  "issuedOn": "2026-01-15",
  "expiresOn": "2029-01-14",
  "requiresAcknowledgement": false,
  "analysisStatus": "COMPLETED",
  "lastAnalysisAt": "2026-04-20T08:45:00Z",
  "links": [
    {
      "entityType": "EMPLOYEE",
      "entityId": "employee-uuid",
      "linkRole": "PRIMARY"
    }
  ],
  "currentVersion": {
    "versionNo": 2,
    "fileId": "uuid",
    "originalFilename": "contrat-diallo-v2.pdf",
    "mimeType": "application/pdf",
    "byteSize": 284552,
    "signedAt": "2026-01-15T10:21:00Z",
    "signedBy": "Directeur RH",
    "verificationCode": "VERIF-3P92KD"
  }
}
```

### DocumentAnalysisRun

```json
{
  "id": "uuid",
  "documentId": "uuid",
  "documentVersionId": "uuid",
  "pipelineStage": "FULL",
  "analysisStatus": "REVIEW_REQUIRED",
  "providerName": "aws-textract",
  "modelName": "textract-analyze-expense-v1",
  "classifiedDocumentType": "CONTRAT_TRAVAIL",
  "confidenceScore": 92.4,
  "summaryText": "Contrat de travail detecte, date de fin extraite.",
  "errorCode": "",
  "errorMessage": "",
  "startedAt": "2026-04-20T08:44:00Z",
  "completedAt": "2026-04-20T08:45:00Z"
}
```

### ExtractedField

```json
{
  "fieldName": "expires_on",
  "fieldLabel": "Date d'expiration",
  "fieldType": "DATE",
  "fieldValueDate": "2029-01-14",
  "normalizedValue": "2029-01-14",
  "confidenceScore": 88.1,
  "sourcePage": 1,
  "isValidated": false
}
```

### EmployeeDocumentComplianceItem

```json
{
  "employeeId": "uuid",
  "matricule": "PRM-0001",
  "fullName": "Aminata Diallo",
  "documentTypeCode": "CONTRAT_TRAVAIL",
  "documentTypeLabel": "Contrat",
  "requirementScope": "CONTRACT_TYPE",
  "complianceStatus": "COMPLIANT",
  "documentReference": "DOC-2026-00045",
  "expiresOn": "2029-01-14",
  "dueOn": "2029-01-14"
}
```

## Endpoints cibles

### Referentiel documentaire

- `GET /documents/types`
  - Query: `moduleScope`, `ownerEntityType`, `active`
  - Reponse: `DocumentType[]`

- `GET /documents/requirements`
  - Query: `scope`, `documentTypeCode`, `directionId`, `unitId`, `contractType`, `active`
  - Reponse: liste des regles de conformite documentaire

### Bibliotheque documentaire unifiee

- `GET /documents/library`
  - Query:
    - commune: `q`, `page`, `limit`, `sortBy`, `sortOrder`
    - documentaire: `status`, `type`, `typeCode`, `sourceModule`, `analysisStatus`, `confidentialityLevel`
    - lien: `linkEntityType`, `linkEntityId`
  - Reponse: `Document[]`

- `GET /documents/library/:reference`
  - Reponse: `Document`

- `POST /documents/library`
  - Body:

```json
{
  "reference": "DOC-2026-00045",
  "title": "Contrat de travail de Aminata Diallo",
  "documentTypeCode": "CONTRAT_TRAVAIL",
  "documentStatus": "DRAFT",
  "sourceModule": "PERSONNEL",
  "sourceRecordId": "employee-uuid",
  "confidentialityLevel": "CONFIDENTIAL",
  "employeeId": "employee-uuid",
  "employeeName": "Aminata Diallo",
  "issuedOn": "2026-01-15",
  "expiresOn": "2029-01-14",
  "requiresAcknowledgement": false,
  "links": [
    { "entityType": "EMPLOYEE", "entityId": "employee-uuid", "linkRole": "PRIMARY" }
  ]
}
```

- `PATCH /documents/library/:reference`
  - Usage: mise a jour metadonnees, type documentaire, dates, niveau de confidentialite, liens fonctionnels.

### Versions et stockage physique

- `POST /documents/uploads/presign`
  - But: obtenir une URL signee pour stockage objet.
  - Body: `{ originalFilename, mimeType, byteSize, sha256 }`
  - Reponse: `{ uploadUrl, storageProvider, bucketName, objectKey, expiresAt }`

- `POST /documents/library/:reference/versions`
  - Body:

```json
{
  "objectKey": "documents/2026/04/contrat-diallo-v2.pdf",
  "originalFilename": "contrat-diallo-v2.pdf",
  "mimeType": "application/pdf",
  "byteSize": 284552,
  "sha256": "hex",
  "makeCurrent": true
}
```

  - Effet:
    - cree `file_objects`
    - cree `document_versions`
    - met a jour `documents.current_version_no`

### Liens documentaires polyvalents

- `GET /documents/library/:reference/links`
  - Reponse: liste des rattachements `document_links`

- `PUT /documents/library/:reference/links`
  - Body:

```json
{
  "replace": true,
  "links": [
    { "entityType": "EMPLOYEE", "entityId": "employee-uuid", "linkRole": "PRIMARY" },
    { "entityType": "ASSIGNMENT", "entityId": "assignment-uuid", "linkRole": "OUTPUT" }
  ]
}
```

### Analyse OCR / classification / extraction

- `POST /documents/library/:reference/analyze`
  - Body:

```json
{
  "pipelineStage": "FULL",
  "providerName": "aws-textract",
  "modelName": "textract-v1",
  "force": false
}
```

  - Effet:
    - cree un `document_analysis_run`
    - passe `documents.analysisStatus` a `PENDING` puis `RUNNING`

- `GET /documents/library/:reference/analysis`
  - Reponse:

```json
{
  "runs": [
    {
      "id": "uuid",
      "analysisStatus": "REVIEW_REQUIRED",
      "confidenceScore": 92.4,
      "classifiedDocumentType": "CONTRAT_TRAVAIL",
      "fields": [
        {
          "fieldName": "expires_on",
          "fieldType": "DATE",
          "fieldValueDate": "2029-01-14",
          "confidenceScore": 88.1,
          "isValidated": false
        }
      ]
    }
  ]
}
```

- `PATCH /documents/library/:reference/analysis/:runId/fields/:fieldName`
  - Body:

```json
{
  "fieldValueText": null,
  "fieldValueDate": "2029-01-14",
  "normalizedValue": "2029-01-14",
  "isValidated": true
}
```

### Traitement et pilotage

- `GET /documents/processing-queue`
  - Source conseillee: `vw_document_processing_queue`
  - Query: `nextAction`, `status`, `analysisStatus`, `sourceModule`, `page`, `limit`

- `GET /documents/analytics`
  - Reutilise l'endpoint existant mais doit s'appuyer sur `documents`, `document_analysis_runs`, `document_dispatches`, `document_retention_events`

- `POST /documents/archive-run`
  - Doit appliquer les `document_retention_rules`

- `POST /documents/purge-archives`
  - Doit refuser si `documents.legal_hold = true`

### Projection personnel

- `GET /personnel/agents/:id/document-compliance`
  - Source conseillee: `vw_employee_document_compliance`
  - Reponse:

```json
{
  "employeeId": "uuid",
  "summary": {
    "requiredCount": 4,
    "compliantCount": 3,
    "missingCount": 0,
    "expiredCount": 1,
    "expiringSoonCount": 0
  },
  "items": [
    {
      "documentTypeCode": "CONTRAT_TRAVAIL",
      "documentTypeLabel": "Contrat",
      "complianceStatus": "EXPIRED",
      "documentReference": "DOC-2024-0081",
      "expiresOn": "2026-03-31",
      "dueOn": "2026-03-31"
    }
  ]
}
```

- `GET /personnel/agents`
  - Compatibilite attendue:
    - `documents[]` continue a etre expose si le front courant en depend.
    - le contenu doit etre derive de `vw_employee_documents`, pas stocke en doublon dans l'agent.

## Mapping de compatibilite avec le front actuel

Projection legacy recommandee pour `AgentDocument[]`:

```json
{
  "type": "Contrat",
  "reference": "DOC-2026-00045",
  "status": "Valide",
  "expiresAt": "2029-01-14",
  "fileName": "contrat-diallo-v2.pdf",
  "fileDataUrl": ""
}
```

Regles de mapping:
- `type` <= `documentTypeLabel`
- `reference` <= `documents.reference`
- `status` <= mapping lisible de `documents.document_status`
- `expiresAt` <= `documents.expires_on`
- `fileName` <= `file_objects.original_filename`
- `fileDataUrl` doit disparaitre en production; garder vide si on ne veut plus transporter le binaire

## Notes d'implementation backend

- toute ecriture documentaire doit journaliser `audit_logs`
- `document_links` est la couche de rattachement unique; ne pas recreer une relation ad hoc par module
- la recherche transverse doit lire `documents + document_types + document_links`
- les jobs d'archivage/purge doivent produire des lignes dans `document_retention_events`
- la conformite personnel ne doit plus deduire les obligations a partir d'un tableau embarque dans l'agent
