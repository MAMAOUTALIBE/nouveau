# Fiche de modernisation 02 — Gestion du Personnel & Dossiers Administratifs

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models,adapters}` (personnel, document, signature, ocr, pdf, turnover, personnel_360) et `Final/src/app/modules/personnel/`

## 0. Résumé exécutif

Module **fonctionnel à 65 %** : CRUD agents solide, RBAC scopé, turnover risk explicable, modèle 360 (compétences, ayants droit, badges, exports, snapshots) en place. **Trois manques structurants pour un SIRH d'État** : (1) le modèle **Employee n'a pas les champs statutaires de la fonction publique guinéenne** (corps, grade, échelon, indice, ancienneté de catégorie) ; (2) la **signature électronique reste un stub PAdES** non conforme eIDAS ni au droit administratif guinéen ; (3) **OCR synchrone** sans queue, dossiers PDF sans templates officiels et sans filigrane. Le module 360 (badges, dépendants) est sur-modélisé pour un projet qui n'a pas encore livré ses fondamentaux statutaires.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Modèle agent | `Final/backend/app/models/employee.py` |
| Modèle 360 | `Final/backend/app/models/personnel_360.py` (compétences, dépendants, badges, exports, snapshots turnover) |
| Modèle document & signature | `Final/backend/app/models/document.py`, `signature.py`, `document_extraction_queue.py` |
| API & service personnel | `Final/backend/app/api/v1/personnel.py`, `services/personnel_service.py` |
| Pipeline OCR | `Final/backend/app/services/ocr_pipeline.py`, `adapters/ocr/{mock,tesseract}.py` |
| Adapter signature | `Final/backend/app/adapters/signature/{endesive_local,mock}.py` |
| Renderer PDF | `Final/backend/app/adapters/pdf/renderer.py`, `services/dossier_pdf.py` |
| Turnover scoring | `Final/backend/app/services/turnover_service.py` |
| Pages frontend | `Final/src/app/modules/personnel/pages/{agent-list,agent-create,agent-detail,personnel-affectations,personnel-dossiers,personnel-turnover-risk}/` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| CRUD agents (list/create/detail/update) | ✅ | `personnel.py:39,72,162` ; `personnel_service.py:151-164` | RBAC `personnel:view/manage`. Détection duplicat matricule. |
| Filtre / scope (SELF/UNIT/DIRECTION/GLOBAL) | ✅ | `personnel_service.py:73-82` | Bon. |
| Modèle Employee — état civil | 🟡 | `employee.py` | `first_name/last_name/email/phone/matricule/employment_status` OK. **Pas de champ `date_naissance`, `lieu_naissance`, `nationalité`, `genre`, `situation_familiale`** au niveau Employee — fragmentation dans `EmployeeDependent` ou metadata JSONB. |
| Modèle Employee — statuts FP guinéenne | ❌ | `employee.py` | **Aucun champ structuré** : pas de `corps`, `cadre A/B/C/D`, `grade`, `échelon`, `indice de traitement`, `date_titularisation`, `ancienneté_corps`, `ancienneté_grade`. Tout passe par `metadata` JSONB libre = futurs bugs paie. |
| Détection duplicats (matricule) | ✅ | `personnel_service.py:151-164` | OK. Frontend ajoute email + identité (`agent-create.ts:620-648`). |
| Pages agent-list / create / detail | ✅ | `src/app/modules/personnel/pages/agent-create/agent-create.ts:1-850` | Formulaire complet, validations client, upload 10 Mo. |
| Pages personnel-affectations / dossiers | 🟡 | dossiers existent mais peu profonds | À enrichir dans la perspective d'un dossier officiel imprimable. |
| OCR pipeline (extraction + revue) | 🟡 | `ocr_pipeline.py:29-146` | **Synchrone** dans la requête (ligne 75-86) → bloque sur PDF lourd. Statut `REVIEW_REQUIRED` géré ✅. Champs `is_validated/validated_by_user_id` ✅. |
| OCR adapter Tesseract | 🟡 | `adapters/ocr/tesseract.py` (174 lignes) | Adapter présent ; à valider qu'il est fonctionnellement branché (a priori oui). Pas de modèle de langue FR + Pular/Soussou/Malinké. |
| File asynchrone OCR | ❌ | — | Pas d'arq/Celery ; modèle `DocumentExtractionQueue` ne semble pas drainé par worker. |
| Signature électronique PAdES | ❌ | `adapters/signature/endesive_local.py:31-87` | SHA-256 + verification_code générés (l. 58-59). **Vraie signature PAdES non câblée** (TODO l. 75-77). Pas de PKI Primature. |
| Conformité eIDAS / valeur probante | ❌ | `signature.py:36-38` | CheckConstraint mentionne Universign/Yousign mais aucun adapter cloud implémenté. |
| Audit trail signature | ✅ | `signature.py:114-145` (`SignatureAuditTrail`) | event_type, actor, source_ip, payload — bon design. |
| Génération PDF (Jinja2 + WeasyPrint) | 🟡 | `pdf/renderer.py:59-129`, `dossier_pdf.py:60-82` | Renderer + fallback minimal. **Pas de templates officiels DRH** (`dossiers_agent.html` non versionné). Pas de filigrane « CONFIDENTIEL » ni en-tête République de Guinée. |
| Turnover risk — modèle explicable | ✅ | `turnover_service.py:1-20,305-352` | Règles V1 pondérées, facteurs décomposés, snapshot persistable. |
| Turnover — RBAC restreint | ✅ | `personnel.py:176-182` | `hr_manager`/`super_admin` only. |
| Turnover — vue agrégée vs individuelle | 🟡 | endpoint renvoie liste individuelle | Anti-pattern roadmap : agréger par direction/cadre, ne montrer l'individuel que sur demande motivée + audit. |
| Turnover — snapshot batch nocturne | ❌ | calcul à la volée < 1000 agents | À industrialiser (worker + persistance). |
| Personnel 360 — compétences | ✅ | `personnel_360.py:31-79` | `EmployeeCompetency` avec niveau + source. |
| Personnel 360 — ayants droit | ✅ | `personnel_360.py:82-123` | OK ; **données très sensibles** (santé, scolarité enfants) → niveau de protection à durcir. |
| Personnel 360 — badges numériques | 🟡 | `personnel_360.py:125-168` | Modèle `qr_payload` + `verification_code` mais **pas de génération réelle ni endpoint vérif**. |
| Personnel 360 — exports dossier | ✅ | `personnel_360.py:170-216` | `EmployeeDossierExport` lié `file_id` — bonne traçabilité. |
| Conservation dossiers (rétention) | ❌ | `document.py:524-573` (rules existent) | **Aucun job d'archivage / purge** consommant les règles. Données stockées indéfiniment. |
| RGPD agent — droit d'accès / oubli | ❌ | — | Pas de portail self-service « mes données », pas de procédure de rectification/oubli. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position du projet | Écart |
|---|---|---|
| **Statut Général de la Fonction Publique de Guinée** (loi L/2001/028/AN) — corps, grades, échelons, indices | Modèle Employee plat | ❌ Le SIRH ne reflète pas le cadre statutaire → impossible de calculer ancienneté, avancement automatique, paie indiciaire. |
| **France — DGAFP / API « Annuaire de l'État »** schéma agent public | Pas de schéma comparable | ⚪ Pas bloquant V1 mais à anticiper pour interopérabilité (Trésor / Paie / Sécurité Sociale). |
| **eIDAS (UE 910/2014)** — niveau « Avancée »/« Qualifiée » | SHA-256 maison + code vérif | ❌ Non conforme. L'absence de prestataire qualifié (QTSP) = signature contestable en justice administrative. |
| **Loi guinéenne L/2016/037/AN** (protection données personnelles) — registre, droits, consentement | Aucun mécanisme | ❌ Risque sanction CNPDP-GN ; image publique. |
| **CNIL FR — délibération RH 2018-303** durées de conservation | Aucune purge | ❌ Pratique : 5 ans après départ (majorité données), 50 ans pour pension. |
| **OCR FR/AR/Pular/Malinké** | Tesseract en/fr supposé | 🟡 Pas de packs spécifiques langues nationales. À doter (Tesseract `fra` + entraînement custom pour scripts manuscrits courants). |
| **Estonie — X-Road / e-File** (dossier agent partagé entre administrations) | Aucune passerelle | ⚪ V2+, pertinent si paie/sécu sociale séparées. |
| **Sénégal — TER-RH / Maroc — IRSHAD** | Plus complets sur le statutaire | Lacune comparative sur grades/indices. |
| **OWASP ASVS L2** sur fichiers uploadés (anti-virus, type, taille, contenu) | Validation type + taille | 🟡 Pas d'antivirus (ClamAV) ni de scan de contenu (PDF actif, polyglotes). |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Données statutaires en JSONB libre** → impossible d'auditer une grille indiciaire, pas d'avancement automatique → mécontentement, contestation syndicale. | **Critique** | Dès paie connectée |
| R2 | **Signature non eIDAS** → tous les arrêtés signés via le SI sont juridiquement contestables. | **Critique** | À chaque arrêté signé |
| R3 | **OCR synchrone** → scan d'un dossier de 50 pages bloque l'API, timeouts → utilisateurs ressaisissent. | Élevée | Sur volumétrie |
| R4 | **Pas de scan AV / type strict** sur uploads → un PDF/JPEG malveillant uploadé par un agent pénètre le serveur. | Élevée | À chaque upload |
| R5 | **Données dépendants exposées** au même niveau RBAC que l'agent → fuite santé/scolarité enfants. | Élevée | Immédiat |
| R6 | **Aucune purge** → croissance non maîtrisée + non-conformité L/2016/037/AN. | Moyenne | À J+12 mois |
| R7 | **Turnover individuel exposé** → instrumentalisation managériale (« je sais que tu vas partir »). | Moyenne | Dès consultation |
| R8 | **PDF dossier sans entête officiel ni filigrane** → exporté et présenté en réunion comme un document non probant. | Moyenne | Immédiat |
| R9 | **Pas de droit d'accès agent à ses données** → contestation RGPD-GN. | Moyenne | À première demande |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Tables statutaires FP-GN** : `civil_service_corps` (cadre, code, libellé), `civil_service_grade` (FK corps, grade, indices min/max), `civil_service_echelon` (FK grade, n°, indice, durée_min). Champs `Employee.corps_id`, `current_grade_id`, `current_echelon_id`, `date_titularisation`, `anciennete_grade_jours` (calculé). Seed avec la grille indiciaire publiée par le Ministère FP. | Avancement automatique possible. Paie correcte. Aligne avec la loi L/2001/028/AN. | **8-12 j** | **P0** | Validation Ministère FP |
| **P2** | **Signature PAdES réelle** : (a) brancher `endesive` avec une PKI Primature (CA interne ou ANSUTEN + AC qualifiée Africa Trust Network) ; (b) en attendant, raccorder Universign **mais** documenter clairement le niveau (Avancée vs Qualifiée). Génération **horodatage RFC 3161** depuis serveur TSA. | Valeur probante des arrêtés. Inattaquable en contentieux. | **10-15 j** | **P0** | PKI / TSA |
| **P3** | **OCR asynchrone** : drainer `DocumentExtractionQueue` par worker arq ; `POST /document-analysis-runs` retourne 202 + ID, polling ou WebSocket pour résultat. Page frontend avec barre de progression + revue côte à côte (PDF original + champs extraits éditables). | Plus de timeouts. UX revue humaine fluide. | **6-8 j** | **P1** | Worker arq |
| **P4** | **Hardening upload** : (a) ClamAV en sidecar Docker, scan obligatoire avant validation ; (b) `python-magic` pour détection MIME réelle vs déclarée ; (c) re-encodage PDF (qpdf --linearize) pour neutraliser scripts ; (d) re-encodage images (Pillow strip metadata). | Bloque la chaîne d'attaque par fichier. | **3-4 j** | **P0** | ClamAV sidecar |
| **P5** | **RBAC fin sur ayants droit** : permission dédiée `personnel:view:dependents` séparée de `personnel:view`, accordée seulement à RH et au gestionnaire de paie. Données chiffrées au niveau colonne (pgcrypto) pour santé/scolarité. | Réduction surface fuite RGPD. | **3 j** | **P1** | — |
| **P6** | **Purge / archivage automatisé** : worker nocturne consommant `DocumentRetentionRule` + règle pension 50 ans / dossier RH 5 ans après cessation / candidatures non retenues 1 an. Export bzip2 signé vers MinIO WORM. | Conformité L/2016/037/AN + maîtrise volumétrie. | **5-7 j** | **P1** | Worker arq, MinIO WORM |
| **P7** | **Turnover agrégé par défaut** : endpoint `/turnover-risk/aggregate` (par direction, par cadre) ouvert hr_manager+ ; endpoint `/turnover-risk/individual` ouvert hr_director only + audit chaque consultation avec motif obligatoire. Snapshot batch nocturne. | Limite instrumentalisation, conformité éthique. | **3 j** | **P1** | — |
| **P8** | **Templates PDF officiels** versionnés en repo : (a) `dossier_agent_v1.html` avec en-tête République de Guinée + Primature + photo + QR vérification ; (b) filigrane diagonal « CONFIDENTIEL — REPRODUCTION INTERDITE » sur pages internes ; (c) numérotation et hash de page. | Documents reconnus en réunion / archive. | **3-4 j** | **P1** | WeasyPrint |
| **P9** | **Portail agent self-service données personnelles** : page « Mes données » → vue complète, demande de rectification (workflow validé RH), demande de droit à l'oubli (workflow validé DRH + DPO). | Conformité L/2016/037/AN, image publique. | **5-7 j** | **P1** | Workflow + notification |
| **P10** | **Génération réelle des badges QR** : endpoint `/employees/{id}/badges` génère QR (lib `qrcode` Python) signé Ed25519 → URL publique vérification `/public/badge/verify/{code}` retournant `{matricule, nom, fonction, valide_jusqu'au, photo}`. | Identification physique des agents en mission, contrôle d'accès. | **2-3 j** | **P2** | Signature Ed25519 |
| **P11** | **Modèle d'état civil structuré** : champs `birth_date`, `birth_place`, `nationality`, `gender`, `marital_status`, `national_id_number` (chiffré pgcrypto) au niveau Employee. Migration depuis JSONB existant. | Cohérence, requêtage, paie. | **3-4 j** | **P1** | — |
| **P12** | **Internationalisation OCR** : packs Tesseract `fra` + jeu de tests sur scripts administratifs guinéens (états civils manuscrits, anciens diplômes). | Précision OCR sur documents réels. | **2-3 j** | **P2** | — |

## 6. Souveraineté & UX terrain

**Souveraineté.** Tout l'empilement OCR + signature + stockage peut tourner **sans cloud étranger** : Tesseract local, endesive + PKI Primature, MinIO. Le seul morceau cloud-only proposé (Universign en P2) est un repli temporaire si la PKI nationale n'existe pas encore — il est documenté comme tel.

**UX terrain.**
- Agent-create : formulaire actuel à 850 lignes, pertinent pour gestionnaire RH expert ; **prévoir un wizard simplifié 3 étapes** pour les directions déconcentrées peu équipées (Identité → Affectation → Documents).
- Upload de pièces : actuellement bloque sur 10 Mo, **prévoir downscaling automatique des photos** (Pillow côté serveur, thumbor en option) pour 3G.
- Dossier agent : **export PDF allégé** (sans pièces en haute résolution) pour partage email, plus PDF complet pour archivage.
- Mobile : agent-list avec >1000 agents → virtualisation déjà via `gridjs-angular`, vérifier comportement Android entrée de gamme (mémoire).

## 7. Décision recommandée

Ce module ne peut pas être déclaré « v1 prête » sans **P1 (statutaire FP), P2 (signature eIDAS-grade), P4 (sécurité uploads)**. L'équipe a sur-investi le 360 (badges, dépendants) au détriment du socle statutaire — à rééquilibrer.

Phase **P0 (3 semaines)** : P1, P2, P4 = **21 à 31 j-h** — module devient juridiquement utilisable.
Phase **P1 (4 semaines)** : P3, P5, P6, P7, P8, P9, P11 = **28 à 38 j-h** — module devient excellent.
Phase **P2** : P10, P12 = bonus différenciants.
