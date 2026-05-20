# Fiche de modernisation 03 — Recrutement & Onboarding

> Audit code réel — 2026-05-10 — Périmètre : `Final/backend/app/{api,services,models,adapters/llm}` (recruitment, cv_matching, interview_grid, candidate_conversion) et `Final/src/app/modules/recruitment/`

## 0. Résumé exécutif

Module **largement implémenté côté backend** : cycle complet campagne → candidature → présélection → entretien → embauche, audit événementiel, conversion candidat→agent transactionnelle, **matching CV via LLM avec garde-fous anti-discrimination explicites** (regex + filtre post-LLM), **grille d'entretien adaptative** générée par LLM avec double filtre. C'est l'un des points forts du projet, conceptuellement supérieur à la plupart des SIRH publics francophones. **Mais trois trous bloquants pour un usage réel** : (1) le **portail candidat « externe » exige une authentification** — un Guinéen non-fonctionnaire ne peut pas postuler ; (2) les **commissions de recrutement vivent en localStorage** côté front, sans persistance — incompatible avec un dossier de concours auditable ; (3) l'**onboarding 30/60/90j est mock-only**, aucun modèle backend.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Modèle recrutement | `Final/backend/app/models/recruitment.py` (campaigns, applications, status_events, comments, attachments) |
| API & service | `Final/backend/app/api/v1/recruitment.py`, `services/recruitment_service.py` |
| Matching CV (LLM) | `Final/backend/app/services/cv_matching.py` |
| Grille d'entretien (LLM) | `Final/backend/app/services/interview_grid.py` |
| Conversion → agent | `Final/backend/app/services/candidate_conversion.py` |
| Adapters LLM | `Final/backend/app/adapters/llm/{anthropic,ollama,mock}.py` |
| Pages frontend | `Final/src/app/modules/recruitment/pages/{applications,campaigns,candidate-portal,commissions,onboarding}/` |

## 2. État réel (vérifié dans le code)

| Sous-module | État | Preuve | Commentaire |
|---|---|---|---|
| Modèle campagne (DRAFT/ACTIVE/PAUSED/CLOSED/CANCELLED) | ✅ | `models/recruitment.py:29-68` | OK. |
| CRUD campagnes + RBAC | ✅ | `api/v1/recruitment.py:33-74` | `recruitment:view/manage`. |
| Cycle candidature (NEW→PRESELECTED→INTERVIEW→OFFERED→HIRED→REJECTED) | ✅ | `recruitment_service.py:117-141` | Transitions tracées. |
| Audit événements | ✅ | `recruitment_service.py:274-280` + `RecruitmentStatusEvent` | OK. |
| Pièces jointes | ✅ | table `recruitment_attachments` | OK. |
| Détection duplicats (matricule, email, identité) | ✅ | front + back | OK. |
| Shortlists + validation humaine | ✅ | front | OK. |
| Reschedule entretiens | ✅ | front + service | OK. |
| Matching CV — LLM réel | ✅ | `cv_matching.py:82-204` | Pipeline structuré, prompt système avec **règles anti-discrimination explicites** (`cv_matching.py:45-79`), audit tokens/modèle/provider (l. 191-202). |
| Matching CV — anti-écrasement | ✅ | `cv_matching.py:207-269` | Score stocké en `metadata.cv_matching_run` ; **validation humaine obligatoire** avant écriture du score officiel. |
| Matching CV — modes (cloud/local/mock) | ✅ | `adapters/llm/factory.py` | Anthropic / Ollama / Mock. |
| Grille d'entretien adaptative | ✅ | `interview_grid.py:108-233` | Générée par LLM, température 0.3. |
| Filtre questions discriminatoires | ✅ | `interview_grid.py:41-53,170-202` | Regex 13 catégories + post-LLM rejection + audit des rejets (l. 204-207). |
| Conversion candidat → employé | ✅ | `candidate_conversion.py:50-123` | Statut HIRED requis, matricule auto PRM-NNNN, lien `source_application_id` + `campaign_id`, anti-double-conversion (`metadata.converted_employee_id` l. 75-80), audit `CANDIDATE_CONVERTED_TO_EMPLOYEE`. |
| Pages applications/campaigns | ✅ | `src/app/modules/recruitment/pages/` | Bound à l'API, RBAC. |
| Page candidate-portal | ❌ (pour candidat externe) | `candidate-portal.ts` utilise `permissionActivateGuard` | **Aucun endpoint public unauthentifié** pour postuler — un candidat externe est bloqué. |
| Page commissions | 🟡 | `commissions.ts:60,334-354` | Données en `localStorage` front. **Aucun modèle backend**. PV signature simulée. Pas de quorum. |
| Page onboarding 30/60/90j | 🟡 | `onboarding.ts:1-755` | UI riche (templates Analyste RH/Gestionnaire Paie/Assistant RH, checklist, feedback, alerte 75/60 %). **Aucun modèle backend** — tout en `metadata` candidature + `localStorage`. |
| CAPTCHA portail | ❌ | — | Aucun. Si on ouvre `/api/v1/public/candidates/apply`, exposition au flooding. |
| Embauche → workflow onboarding auto | ❌ | conversion crée Employee, pas de checklist | À chaîner. |
| Conformité décret recrutement FP | ❌ | — | Pas de modèle commission, PV, quorum, vote nominal. |
| Anonymisation CV pour matching (option) | ❌ | LLM voit nom, photo URL, ethnonymes | Risque biais malgré filtre prompt. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position du projet | Écart |
|---|---|---|
| **Décret guinéen sur les concours administratifs** (commissions, quorum, PV) | Frontend localStorage | ❌ Pas de dossier concours probant. |
| **Place de l'Emploi Public FR (PEP)** — dépôt CV citoyen sans compte | Portail derrière auth | ❌ Bloque candidats externes. |
| **Sénégal — DGFP / Concours en ligne** | Plus simple sur le portail public, faible côté IA | Inversion : projet GN fort en IA, faible en accessibilité publique. |
| **AlgorithmWatch / OECD AI in HR** principes : transparence, non-discrimination, validation humaine | Filtres explicites + validation humaine ✅ | ✅ Au-dessus de la moyenne. |
| **CNIL FR — délibération 2019-001** (recrutement par algorithme) | Audit + validation ✅ | 🟡 À documenter formellement (DPIA). |
| **eIDAS — signature électronique PV de commission** | Mock-only | ❌ |
| **WCAG 2.1 AA / RGAA 4.1** sur portail externe | Inconnu (portail derrière auth) | ❌ À auditer dès ouverture. |
| **Estonia e-Residency / Rwanda Irembo** — KYC candidat | Aucun | ⚪ V2+ (lien futur avec carte d'identité biométrique GN). |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Commission recrutement non persistée** → contestation, recours administratif → annulation du concours. | **Critique** | À première contestation |
| R2 | **Portail externe inaccessible** → candidatures par email → dossier hors-SI → corruption du processus. | **Critique** | Immédiat |
| R3 | **Pas de CAPTCHA** sur futur endpoint public → flooding, déni de service du processus. | Élevée | Dès ouverture |
| R4 | **CV envoyé à Anthropic (cloud US)** par défaut → données personnelles candidats hors juridiction. | Élevée | À l'activation |
| R5 | **PV de commission sans signature légale** → décision contestable. | Élevée | À la première décision |
| R6 | **Onboarding en localStorage** → données perdues au changement de poste / reset navigateur. | Moyenne | Continu |
| R7 | **Conversion automatique HIRED→Employee** sans validation finale RH explicite → erreurs irréversibles. | Moyenne | Dès volumétrie |
| R8 | **CV non anonymisé** côté LLM → biais malgré prompt (le LLM peut inférer ethnie/genre depuis le prénom). | Moyenne | À chaque scoring |

## 5. Propositions de modernisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Modèle backend `RecruitmentCommission`** : `id`, `campaign_id`, `members[]` (user_id + role : président, secrétaire, jury), `quorum_min`, `created_at`. **`CommissionSession`** : date, agenda, présents, votes (par candidat, secret ou nominal), décisions. **`CommissionPV`** : PDF généré + signé Universign/PKI Primature, hash chaîné. | Dossier de concours juridiquement opposable. | **8-12 j** | **P0** | Signature, PDF |
| **P2** | **Endpoint public candidature** : `POST /api/v1/public/recruitment/{campaign_ref}/apply` sans auth, avec : (a) reCAPTCHA v3 ou hCaptcha (Privacy-friendly), (b) rate-limit IP (5/h), (c) validation taille CV (max 5 Mo) + scan ClamAV, (d) double-opt-in email, (e) accusé de réception PDF signé renvoyé. Page front publique sans `permissionGuard`. | Ouverture des candidatures externes. Conforme service public. | **5-7 j** | **P0** | hCaptcha, ClamAV |
| **P3** | **Modèle backend onboarding** : `RecruitmentOnboarding` (employee_id, template_id, started_at), `OnboardingStep` (label, due_date, status, owner_user_id), `OnboardingFeedback` (kind: 30j/60j/90j, score, comment). Worker arq d'escalade (J+3 retard → manager, J+7 → DRH). | Suivi durable de l'intégration. Données auditables. | **6-8 j** | **P1** | Worker, notifications |
| **P4** | **Embauche déclenche onboarding automatique** : `candidate_conversion` crée l'Employee **et** instancie l'OnboardingTemplate adapté au poste (et son workflow BPMN si SpiffWorkflow activé). | Pas de trou entre embauche et intégration. | **2 j** | **P1** | P3 |
| **P5** | **Anonymisation CV pour matching IA** : (a) PII removal (regex prénom/nom/photo URL/age) avant envoi LLM ; (b) prompt système exige analyse compétence-pure ; (c) snapshot anonymisé conservé pour audit. | Réduit biais inférentiel. Conformité éthique. | **3-4 j** | **P1** | — |
| **P6** | **DPIA recrutement IA** (DPO + ministère FP) : document formel sur l'usage du LLM, base légale, durée conservation, droit candidat de demander revue humaine sans IA. Page candidat « ma candidature a-t-elle été évaluée par une IA ? Demander une revue humaine ». | Conformité L/2016/037/AN + image publique. | **3 j** (juridique) | **P1** | — |
| **P7** | **Bascule LLM Ollama par défaut pour recrutement** : `LLM_PROVIDER_RECRUITMENT=ollama` (var d'env spécifique au domaine). Modèle Mistral-7B-Instruct ou Phi-3-mini quantifié. Anthropic en fallback nommé pour tests. | Souveraineté des données candidats. | **2-3 j** | **P1** | Ollama prod |
| **P8** | **Signature PV de commission** : utiliser P2 de la fiche 02 (PAdES réelle). PV horodaté RFC 3161. Verification publique via QR. | Valeur probante. | **3-4 j** | **P1** | Signature eIDAS |
| **P9** | **Dashboard transparence concours** : page publique (sans auth) `/transparence/concours/{ref}` montrant : nb candidats, dates clés, critères pondérés (sans noms individuels), nb retenus, prochains entretiens. Format ouvert (CSV). Conforme « open data » service public. | Confiance citoyenne, anti-clientélisme. | **3-4 j** | **P2** | P2 |
| **P10** | **Accessibilité portail externe RGAA AA** : audit + corrections (contrastes, navigation clavier, lecteurs d'écran, ARIA). Test sur Android entrée de gamme + 3G simulé. | Inclusion (1,2 M de Guinéens en situation de handicap selon OMS). | **5-7 j** | **P1** | P2 |
| **P11** | **Système anti-fraude minimal** : détection candidatures dupliquées par hash de CV + fingerprint navigateur ; alerte si >5 candidatures même IP/24h. | Limite la fraude au concours. | **2 j** | **P2** | — |
| **P12** | **Validation finale RH avant conversion** : ajouter un statut `OFFER_ACCEPTED` entre `HIRED` et la création Employee, validation manuelle DRH explicite avec checklist documents reçus. | Évite création Employee prématurée. | **2 j** | **P2** | — |

## 6. Souveraineté & UX terrain

**Souveraineté.** L'adapter LLM pluggable est l'arme principale : passer Ollama en prod **règle 95 % des préoccupations RGPD candidats**. Pour les CV très volumineux (PDF scannés > 10 Mo), prévoir extraction texte côté serveur (pdfminer.six) avant envoi LLM : moins de tokens = moins cher = plus rapide en local.

**UX terrain pour candidat externe.**
- Smartphone Android entrée de gamme + 3G : portail doit fonctionner **sans framework lourd**. Soit on déploie une mini-app Angular standalone (lazy chunk dédié + service worker), soit **page HTML statique + endpoint API** (préférable). Cible : < 200 Ko initial, < 3 s sur 3G simulé.
- Téléversement CV : tolérer `.pdf`, `.docx`, `.jpg` (photo de CV manuscrit). Côté serveur : OCR + extraction texte automatique.
- SMS d'accusé réception (en plus de l'email) : 70 % des candidats consultent SMS avant email en GN.
- Suivi candidature : URL + code court (style « PRM-25-A1B2 ») + page de suivi sans login.

**UX interne (RH).**
- Vue « pipeline candidat » Kanban (par statut) ✅ probablement déjà existant.
- Vue commission : tableau de notation collaboratif temps réel (WebSocket) ; signatures individuelles avant clôture.

## 7. Décision recommandée

Module **conceptuellement le plus avancé** du projet (matching CV + grille IA avec garde-fous), **mais inutilisable légalement** sans P1 (commissions persistées) et P2 (portail externe). Investir P0 d'abord, puis enchaîner P1 (DPIA, onboarding backend, anonymisation, RGAA, signature PV) qui fait passer le module de « bon » à « référence francophone ».

Phase **P0 (3 semaines)** : P1 + P2 = **13 à 19 j-h**.
Phase **P1 (5 semaines)** : P3, P4, P5, P6, P7, P8, P10 = **24 à 33 j-h**.
Phase **P2** : P9, P11, P12 = différenciation publique + ergonomie.
