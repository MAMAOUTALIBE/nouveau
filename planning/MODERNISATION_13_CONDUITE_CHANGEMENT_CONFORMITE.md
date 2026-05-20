# Fiche de modernisation 13 — Conduite du changement, Internationalisation, Accessibilité globale & Conformité légale

> Audit code réel — 2026-05-10 — Périmètre : `Final/package.json` (i18n deps), `Final/angular.json`, `Final/docs/`, `Final/src/app/shared/components/footer/`, recherche transverse pages légales, RGPD, accessibilité

## 0. Résumé exécutif

C'est la **dimension la plus négligée du projet**, alors qu'elle est **déterminante pour le succès d'un déploiement national**. Les briques techniques sont prêtes côté français, mais : **aucune internationalisation effective** (pas de fichier `.xlf`, pas de config `angular.json`, l'app est à 100 % en français unilingue), **aucune documentation utilisateur** (manuel, tutoriels, vidéos), **aucune page de mentions légales / CGU / politique de confidentialité / cookies**, **aucun registre des traitements RGPD**, **aucune DPIA** (alors que le projet manipule scoring turnover, matching CV par LLM, évaluations 360°), **aucune référence à la loi guinéenne 037/AN/2016 ni à la CNPDP-GN**, **aucun plan de formation utilisateur**, **aucun guide de déploiement national** (pilote, séquencement, communication), **aucun SLA/contrat de service formel**. La doc technique (`Final/docs/`, 6 fichiers, 2 911 lignes) est de bonne qualité mais reste **interne au cercle technique**. Pour un SI qui prétend gérer la fonction publique d'un État, **toute la couche « publique » du dispositif manque**.

## 1. Périmètre inspecté

| Couche | Localisation |
|---|---|
| Dépendances i18n | `Final/package.json` → `@angular/localize@21.0.6` (présente, non utilisée) |
| Config i18n Angular | `Final/angular.json` (aucune section i18n) |
| Doc technique | `Final/docs/{cahier-charge-technique-rh-primature.md, plan-robustesse-priorise.md, proposition-modernisation-rh.md, strategie-base-donnees-rh.md, api-contrats-integration.md, api-contrat-documents-unifies.md}` (2 911 lignes) |
| Doc API auto | `/docs` (Swagger UI FastAPI) + `/api/v1/openapi.json` |
| Footer | `Final/src/app/shared/components/footer/footer.html` (14 lignes — copyright générique) |
| Pages légales (recherchées) | `/mentions-legales`, `/cgu`, `/confidentialite`, `/cookies`, `/accessibilite`, `/security` — **aucune** |
| Doc utilisateur | `docs/user/`, `docs/manuel/`, `docs/guide/` — **aucun** |
| Accessibilité | 470 attributs ARIA détectés dans HTML, 3 `alt=""` ; pas d'audit Lighthouse |
| Audit/registre RGPD | absents |

## 2. État réel (vérifié dans le code)

### Internationalisation

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| `@angular/localize` installé | ✅ | `package.json:112` v21.0.6 | Dépendance prête. |
| Config `i18n` dans `angular.json` | ❌ | grep | Aucune. |
| Fichiers de traduction `messages.xlf` / `xliff2` | ❌ | grep `*.xlf` | Aucun. |
| Routing par locale (`/fr/`, `/en/`) | ❌ | `app.routes.ts` | Aucun. |
| Backend i18n (FastAPI Babel ou messages externes) | ❌ | grep | Aucun. |
| Langues nationales (Pular, Soussou, Malinké) | ❌ | — | Hors périmètre actuel. |

### Documentation

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Doc technique (cahier des charges, archi BDD, plan robustesse, propositions, contrats API) | ✅ | 6 fichiers, 2 911 lignes | Bonne qualité. |
| Doc API auto FastAPI `/docs` | ✅ | OK | OK ; à exporter en statique pour version offline. |
| **Manuel utilisateur** (agent, manager, DRH, admin) | ❌ | — | Absent. |
| **Tutoriels vidéo** | ❌ | — | Absent. |
| **Aide contextuelle in-app** (tooltips, walkthroughs Shepherd.js) | ❌ | — | Absente. |
| **FAQ utilisateur** | ❌ | — | Absente. |
| **Centre d'aide en ligne** (`help.prim.gov.gn`) | ❌ | — | Absent. |

### Accessibilité

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Attributs ARIA présents | 🟡 | 470 occurrences | Bonne base mais inégale. |
| `alt=""` sur images | 🟡 | 3 occurrences | Faible — vérifier toutes les images informatives. |
| Audit Lighthouse documenté | ❌ | — | Aucun. |
| Page `/accessibilite` (déclaration de conformité RGAA) | ❌ | — | Absente — obligatoire en FR pour public. |
| Tests automatisés axe-core / pa11y | ❌ | — | Aucun (cf. fiche 11 P7). |
| Contrastes WCAG AA vérifiés | ❌ | — | Pas d'audit. |
| Navigation clavier complète | ❌ | — | Pas testée. |
| Lecteur d'écran (NVDA/JAWS/VoiceOver) | ❌ | — | Pas testé. |

### Pages légales / Conformité publique

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| `/mentions-legales` | ❌ | — | Obligation publique. |
| `/cgu` (Conditions Générales d'Utilisation) | ❌ | — | Absente. |
| `/confidentialite` (Politique de confidentialité) | ❌ | — | Absente — exigée par loi 037/AN/2016. |
| `/cookies` (gestion / consentement) | ❌ | — | Absente — `localStorage` utilisé sans bandeau. |
| `/accessibilite` (déclaration RGAA) | ❌ | — | Absente. |
| `/security` (`security.txt`, contact) | ❌ | — | Absente — bonne pratique RFC 9116. |
| Footer avec liens légaux | ❌ | `footer.html` 14 lignes copyright générique | Inutilisé fonctionnellement. |

### Conformité RGPD-GN

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Registre des traitements | ❌ | — | Aucun fichier `docs/registre-traitements.md`. |
| Désignation DPO | ❌ | — | Pas mentionnée. |
| Déclaration CNPDP-GN | ❌ | — | Aucune trace. |
| **DPIA scoring turnover** (modèle prédictif sur agents) | ❌ | — | Obligatoire (RGPD art. 35 / loi 037/AN/2016 équivalent). |
| **DPIA matching CV par LLM** | ❌ | — | Obligatoire. |
| **DPIA évaluation 360°** | ❌ | — | Recommandée. |
| Mécanismes droits agent (accès, rectification, opposition, portabilité, oubli) | ❌ | — | Pas implémentés (cf. fiche 02 P9). |
| Mécanismes consentement (cookies, analytics, comm) | ❌ | — | Pas de bandeau, pas de page préférences. |
| Conservation / purge documentée par catégorie | 🟡 | doctrine modélisée (cf. fiche 10) | Pas appliquée. |
| Politique de réponse aux demandes CNPDP / réclamations | ❌ | — | Absente. |

### Conduite du changement

| Élément | État | Preuve | Commentaire |
|---|---|---|---|
| Plan de formation utilisateur (DRH centrale, DRH déconcentrées, managers, agents) | ❌ | — | Absent. |
| Communication interne (annonces, newsletters, lancement) | ❌ | — | Absente. |
| Plan de déploiement national (pilote → généralisation) | ❌ | — | Absent. |
| Identification d'un site pilote (1 direction, 100 agents) | ❌ | — | Absente. |
| Comité de pilotage (gouvernance) | ❌ | — | Pas formalisé dans le repo. |
| Référents fonctionnels par direction | ❌ | — | Absents. |
| SLA / contrat de service (disponibilité, support, maintenance) | ❌ | — | Absent. |
| Charte d'utilisation (interdiction usage perso, etc.) | ❌ | — | Absente. |

### Communication politique

| Élément | État | Commentaire |
|---|---|---|
| Plan de presse / annonce officielle Cabinet | ❌ | À préparer. |
| Implication syndicats FP (présentation, consultation) | ❌ | À planifier. |
| Charte graphique cohérente avec identité État GN | 🟡 | Présence visuelle (logos) à vérifier. |

## 3. Comparaison aux standards GovTech

| Standard / Pratique | Position | Écart |
|---|---|---|
| **France — Référentiel d'Accessibilité (RGAA 4.1)** | Partiel sans audit | ❌ Page de déclaration RGAA obligatoire pour service public. |
| **France — Loi pour une République numérique 2016** : accessibilité, données ouvertes | Aucun | ⚪ (juridiction GN) |
| **Loi guinéenne 037/AN/2016** : registre, DPIA, déclaration CNPDP-GN | Aucun | ❌ |
| **CNIL FR — RGPD art. 30 (registre)**, art. 35 (AIPD/DPIA) | Aucun équivalent | ❌ |
| **CEPEJ — Charte éthique européenne IA dans la Justice** (transposable RH) | Pas d'évaluation IA | ❌ |
| **OCDE Recommandation IA dans le secteur public** | Pas de cadre éthique formel | ❌ |
| **DGNUM FR — Engagement numérique de l'État** | Aucun document équivalent | ❌ |
| **Estonia — Information Society Strategy** (citoyens informés, transparence) | Aucune doc publique | ❌ |
| **WCAG 2.1 AA** | Inégale | 🟡 |
| **Plan de formation type ANFH (FR public)** | Aucun | ❌ |
| **ITIL — SLA / catalog services** | Aucun | ❌ |

## 4. Risques en exploitation publique

| # | Risque | Sévérité | Délai |
|---|---|---|---|
| R1 | **Pas de DPIA + déclaration CNPDP-GN** → procédure judiciaire ou suspension du SI à la première plainte. | **Critique** | À première plainte |
| R2 | **Pas de pages légales** → contestation juridique de tout document généré (CGU absentes), inopposabilité aux agents. | **Critique** | Immédiat |
| R3 | **Pas de mécanismes droits agent** (accès, rectification, oubli) → contestation, mauvaise presse, sanction. | Élevée | À première demande |
| R4 | **Pas de manuel utilisateur** → adoption faible (5-15 % au lieu de 70 %+), recours au papier persiste, projet perçu comme un échec. | Élevée | Immédiat |
| R5 | **Pas de plan de formation** → DRH déconcentrées non formées → données incohérentes, frustration, contournement. | Élevée | Immédiat |
| R6 | **Pas de plan de déploiement national** → big bang risqué → cascade de bugs visibles publiquement. | Élevée | Au déploiement |
| R7 | **Inaccessibilité aux personnes handicapées** → contestation associative + sanction RGAA. | Moyenne | Au déploiement |
| R8 | **Pas de SLA** → confusion sur les engagements de la DSI → conflit interne. | Moyenne | Continu |
| R9 | **Mono-langue français** → exclusion partielle des agents non lettrés en français (réalité dans certaines préfectures). | Moyenne | Continu |
| R10 | **Pas de communication politique** → annoncé en off → buzz négatif syndical → blocage déploiement. | Moyenne | Au lancement |

## 5. Propositions de modernisation

### Conformité légale et RGPD

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P1** | **Pages légales complètes** : `/mentions-legales`, `/cgu`, `/confidentialite`, `/cookies`, `/accessibilite`, `/security`. Accessibles depuis footer (à refondre). Templates juridiques rédigés par un cabinet local + révisés par DPO. | Lève R2. Conformité publique. | **5-7 j** + budget juridique | **P0** | DPO, juriste |
| **P2** | **Désignation DPO + registre des traitements** : (a) désigner formellement un DPO Primature, (b) registre des traitements `docs/registre-traitements.md` selon modèle CNIL adapté GN (au moins 12 traitements à inscrire : RH agents, recrutement, formation, congés, performance, discipline, GPEC, audit, notifications, IA matching CV, IA turnover, IA assistant), (c) déclaration CNPDP-GN. | Lève R1. Légalité. | **5 j** + démarche admin | **P0** | DPO |
| **P3** | **DPIA pour 3 traitements à risque** : (a) scoring turnover (impact carrière), (b) matching CV par LLM (anti-discrimination), (c) évaluation 360° (impact RH). Modèle DPIA CNIL FR adapté. Conclusions publiées en interne. | Lève R1. Conformité art. 35 équivalent. | **8-10 j** | **P0** | DPO |
| **P4** | **Mécanismes droits agent self-service** (cf. fiche 02 P9 + fiche 09 P5) : page « Mes données » → accès complet + rectification (workflow validé) + opposition (pour profilage) + portabilité (export JSON/CSV) + oubli (workflow DRH+DPO). Documentation des délais (1 mois max). | Lève R3. | **5-7 j** | **P0** | Workflow, notifications |
| **P5** | **Bandeau cookies + page préférences** : bandeau RGPD-friendly (pas de dark patterns), `/preferences-cookies` avec choix granulaire (essentiels / mesure d'audience / IA assistance). Stockage consent. | Lève R2 sur cookies. | **2-3 j** | **P0** | — |
| **P6** | **Cadre éthique IA RH** : `docs/cadre-ethique-ia-rh.md` documentant les 3 algorithmes (turnover, matching CV, 360 anonymisation), les biais identifiés et atténués, le droit à l'intervention humaine, le recours. Validé par Cabinet + DPO. | Conformité OCDE/CEPEJ. Différenciation positive. | **5 j** | **P1** | P3 |

### Documentation utilisateur et formation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P7** | **Manuel utilisateur multi-rôles** : 4 manuels PDF imprimables A4 — Agent (10-15 p), Manager (15-20 p), DRH (30-40 p), Admin SI (20 p). Captures d'écran à jour. Maintenu au rythme des releases. Dépôt `docs/user/`. | Lève R4. Adoption. | **15-20 j** | **P0** | Captures, rédaction |
| **P8** | **Tutoriels vidéo** : 12 capsules (3-5 min) sur les flux les plus utilisés (login, MFA, demande congé, validation manager, dépôt document, recherche dossier, etc.). En français + sous-titres FR/EN. Hébergement YouTube non listé ou Peertube auto-hébergé. | Lève R4. UX modernes. | **10-15 j** + budget vidéo | **P1** | Caméra, voix-off |
| **P9** | **Aide contextuelle in-app** : tooltips informatifs + walkthroughs guidés (Shepherd.js ou Driver.js, libs gratuites) sur premier accès page. Bouton « ? » global ouvrant centre d'aide. | Réduction questions support. | **5-7 j** | **P1** | — |
| **P10** | **FAQ et centre d'aide en ligne** : `help.prim.gov.gn` (mini-site Hugo / Docusaurus / VitePress) avec articles par flux, recherche, feedback « cet article a-t-il été utile ». | Self-service support. | **5-7 j** | **P1** | Domaine, hébergement |
| **P11** | **Plan de formation utilisateur** : (a) formation DRH centrale (2 j), (b) formation DRH déconcentrées (1 j en présentiel ou visio), (c) formation managers (½ j en e-learning), (d) auto-formation agents via tutos vidéos. Calendrier sur 3 mois. Référents formés. | Lève R5. Adoption durable. | **10 j** + intervenants | **P0** | Salle, formateurs |
| **P12** | **Charte d'utilisation et politique d'usage acceptable** : `/charte-utilisation` consultée et acceptée à la première connexion (case à cocher). Précise interdictions (usage perso, consultation indue, partage compte). | Cadre juridique opposable. | **2 j** + juridique | **P1** | — |

### Internationalisation

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P13** | **Activation `@angular/localize`** : (a) baliser les chaînes avec `i18n="..."` ou `$localize`, (b) extraction `messages.xlf`, (c) configuration `angular.json` `i18n` avec FR par défaut + EN secondaire (CEDEAO). Build multi-locales. | Préparer EN pour pays voisins / partenaires. | **10-15 j** | **P1** | — |
| **P14** | **Backend i18n FastAPI Babel** : pour messages d'erreur, emails, PDF, notifications. Catalogue gettext ou JSON. Détection langue depuis `Accept-Language` ou préférence utilisateur. | Cohérence globale. | **5 j** | **P1** | P13 |
| **P15** | **Audio localisé pour Prim'Assistant** (langues nationales) : à étudier (Pular, Soussou, Malinké) — TTS éventuel. Hors scope V2. | Inclusion. | **8-15 j** | **P2** | TTS |

### Accessibilité globale

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P16** | **Audit RGAA 4.1 AA + plan correctifs** : audit externe (cabinet spécialisé) ou interne (formé) + grille RGAA + corrections. Page `/accessibilite` publiée avec niveau atteint. | Lève R7. Inclusion. | **8-12 j** + audit externe | **P0** | Cabinet a11y |
| **P17** | **Tests a11y dans CI (axe-core/pa11y)** | (cf. fiche 11 P7) | (cf. 11 P7) | **P1** | CI |

### Conduite du changement et gouvernance

| # | Proposition | Bénéfice | Effort | Priorité | Dépend |
|---|---|---|---|---|---|
| **P18** | **Plan de déploiement national en 4 phases** : (1) Pilote 100 agents 1 direction Cabinet PM, 6 sem ; (2) Extension Cabinet + Secrétariat Général, 6 sem ; (3) Directions Générales, 8 sem ; (4) Directions déconcentrées, 12 sem. Comité de pilotage hebdo. Indicateurs adoption. | Lève R6. Risque maîtrisé. | **5 j** plan + 8 mois exécution | **P0** | Décision politique |
| **P19** | **Comité de pilotage formel** : SG Primature (président), DRH, DSI, DAF, DPO, représentant syndical observateur. Réunion mensuelle. Décisions tracées. | Gouvernance. | **2 j** charte + récurrent | **P0** | Désignation |
| **P20** | **Communication politique du déploiement** : (a) annonce officielle Cabinet PM, (b) note d'info syndicats FP, (c) communiqué presse, (d) page publique « Le SIRH de la Primature » expliquant objectifs et garanties (anti-clientélisme, transparence, modernisation). | Lève R10. Confiance. | **5 j** + comm | **P1** | Cabinet |
| **P21** | **SLA et catalogue de services** : `docs/sla.md` avec engagements (disponibilité 99,5 %, support 8h-17h ouvré, MTTR critique < 4 h, changement majeur préavis 7 j). Catalogue des services SI offerts par module. | Lève R8. | **3 j** + validation | **P1** | DSI |
| **P22** | **Référents fonctionnels par direction (« super-utilisateurs »)** : 1-2 personnes par direction formées en avance, point de contact local, font remonter les besoins / bugs. Rémunération symbolique de l'engagement. | Adoption locale. | **3 j** identification + récurrent | **P1** | DRH déconcentrées |

## 6. Souveraineté & UX terrain

**Souveraineté.** Toutes les briques sont auto-hébergeables (centre d'aide Hugo/VitePress, Peertube pour vidéos, Mautic pour newsletters internes). Le seul point d'attention : si TTS langues nationales (P15) → modèles open source à ajuster ou data partenaires académiques (Université Conakry).

**UX terrain.**
- **Manuel papier** : la moitié des préfectures fonctionnera longtemps avec un manuel imprimé en PDF A4. Ne pas le négliger au profit du tout-numérique.
- **WhatsApp / Telegram support** : créer 1 groupe par direction (DRH local + 5 référents) animé par DSI Primature. Plus efficace qu'un ticketing pour les questions courantes.
- **SMS d'accompagnement** : pour annoncer les phases de déploiement (« À partir du JJ/MM, votre direction utilise GPA-GOUVE. Connectez-vous sur prim.gov.gn/login. Aide : 622 XX XX XX »).
- **Tutoriels vidéo** doivent être courts (< 5 min), avec voix-off claire en français standard, sans jargon. Pour la consommation hors-ligne en préfecture, possibilité de distribuer une clé USB par direction.
- **Accessibilité** : le déploiement national se fait dans des préfectures où des agents sont en situation de handicap (visuel, moteur). Sans P16, ces agents sont exclus du SIRH.

## 7. Décision recommandée

**P0 (4-6 semaines, ~50-65 j-h + budget juridique/audit)** :
- P1 (pages légales)
- P2 (DPO, registre, déclaration CNPDP-GN)
- P3 (DPIA scoring/LLM/360)
- P4 (droits agent self-service)
- P5 (cookies)
- P7 (manuel utilisateur)
- P11 (plan formation)
- P16 (audit RGAA)
- P18 (plan déploiement)
- P19 (comité pilotage)

Sans cette pile, le déploiement national est **politiquement et juridiquement risqué**.

**P1 (4-6 semaines, ~35-50 j-h)** : P6, P8, P9, P10, P12, P13, P14, P17, P20, P21, P22.

**P2** : P15 (langues nationales) — initiative à porter à terme.

**Note politique majeure.** Cette fiche n'est pas du « cosmétique ». Elle décrit ce qui transforme un **logiciel** en **service public numérique**. Sans pages légales, sans DPO, sans manuel, sans plan de déploiement, **le projet GPA-GOUVE n'est pas un service public**, c'est un outil interne. La différence est juridique, politique et opérationnelle.

**Implication budget.** Cette fiche introduit deux postes externes à anticiper : **rédaction juridique** (~5-10 K€), **audit accessibilité externe** (~5-8 K€), **production vidéos** (~5-10 K€). À budgéter et arbitrer dès le démarrage Vague A.
