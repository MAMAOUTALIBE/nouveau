# Registre des traitements de données personnelles — GPA-GOUVE

> **Responsable de traitement** : Primature de la République de Guinée
> **DPO** : à désigner formellement (cf. ADR-009)
> **Cadre juridique** : loi 037/AN/2016 du 24 octobre 2016 relative à la
> cybersécurité et à la protection des données à caractère personnel
> **Version** : 1.0 — initiale (à actualiser à chaque évolution majeure)
> **Dernière mise à jour** : 2026-05-11

## Préambule

Le présent registre liste les traitements de données personnelles mis en
œuvre par l'application GPA-GOUVE. Il vise à satisfaire l'obligation de
documentation prévue par la loi 037/AN/2016 et à fournir au DPO un outil
de pilotage opérationnel.

Pour chaque traitement, sont précisés :

- l'identifiant interne (T-NN),
- la finalité,
- la base légale,
- les catégories de personnes concernées,
- les catégories de données,
- les destinataires,
- la durée de conservation,
- les mesures de sécurité,
- les transferts hors GN éventuels,
- le responsable opérationnel,
- la DPIA associée le cas échéant.

---

## T-01 — Gestion administrative des dossiers d'agents

| Item | Détail |
|---|---|
| Finalité | Constitution, mise à jour et consultation du dossier individuel de chaque agent |
| Base légale | Statut général de la fonction publique (obligation légale) |
| Personnes concernées | Agents titulaires et contractuels de la Primature |
| Catégories de données | État civil, coordonnées, situation familiale, photo, pièce d'identité, diplômes, position statutaire (corps, grade, échelon, indice), affectations |
| Destinataires | DRH, hiérarchie de l'agent, service paie (Trésor), DPO sur demande |
| Conservation | 5 ans après cessation d'activité ; 50 ans pour données utiles à la pension |
| Sécurité | RBAC, chiffrement at-rest, audit transactionnel des accès |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DRH |
| DPIA | Non requis |

## T-02 — Gestion des congés et absences

| Item | Détail |
|---|---|
| Finalité | Demande, validation, suivi des congés et absences des agents |
| Base légale | Statut général de la fonction publique |
| Personnes concernées | Agents |
| Catégories de données | Type de congé (incl. médical, maternité, Hadj), dates, motifs, soldes |
| Destinataires | Agent concerné, manager hiérarchique, DRH, paie |
| Conservation | 3 ans pour les demandes / 5 ans pour les soldes annuels |
| Sécurité | RBAC scopé (manager voit son équipe ; DRH voit tout) |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DRH |
| DPIA | Non requis (catégorie « santé » via congé maladie : conservation séparée et accès restreint) |

## T-03 — Recrutement (candidatures et concours)

| Item | Détail |
|---|---|
| Finalité | Réception, traitement et sélection des candidatures aux postes ouverts |
| Base légale | Mission de service public + consentement (candidat externe) |
| Personnes concernées | Candidats internes et externes |
| Catégories de données | Identité, coordonnées, parcours, CV, diplômes, scoring algorithmique (cf. T-08), évaluations entretien |
| Destinataires | Cellule recrutement, commissions, DRH |
| Conservation | Candidatures non retenues : 1 an. Candidatures retenues : intégrées au dossier agent (T-01). |
| Sécurité | RBAC, anonymisation pour scoring (cf. T-08), commissions persistées + PV signés |
| Transferts hors GN | Selon ADR-005 : si LLM `LLM_PROVIDER=anthropic`, transfert Anthropic (US) — par défaut Ollama local (aucun transfert) |
| Responsable opérationnel | Cellule recrutement |
| DPIA | **DPIA-02 (matching CV par LLM)** — voir T-08 |

## T-04 — Évaluation 360° de la performance

| Item | Détail |
|---|---|
| Finalité | Évaluation périodique de la performance par auto-évaluation, hiérarchie, pairs et subordonnés |
| Base légale | Statut général + obligation managériale |
| Personnes concernées | Agents évalués + évaluateurs |
| Catégories de données | Notes, commentaires, plan de développement |
| Destinataires | Agent évalué (résultats consolidés), manager, DRH |
| Conservation | 5 ans (historique de carrière) |
| Sécurité | **Anonymat structurel** : aucun lien base de données entre une réponse et son évaluateur ; seuil minimal de N=3 répondants pour la divulgation par catégorie |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DRH |
| DPIA | **DPIA-03 (évaluation 360°)** |

## T-05 — Formation professionnelle

| Item | Détail |
|---|---|
| Finalité | Catalogue, demandes, sessions, présence, évaluations à chaud et à froid, certificats |
| Base légale | Statut + plan annuel de formation |
| Personnes concernées | Agents demandeurs, formateurs, organisations partenaires |
| Catégories de données | Demandes, présence, scores d'évaluation, certificats |
| Destinataires | DRH, manager, formateur, agent |
| Conservation | 5 ans (historique formation = élément carrière) |
| Sécurité | RBAC, certificats signés numériquement |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DRH |
| DPIA | Non requis |

## T-06 — Procédures disciplinaires

| Item | Détail |
|---|---|
| Finalité | Ouverture, instruction, sanction et recours dans le cadre du code disciplinaire FP-GN |
| Base légale | Statut + code disciplinaire |
| Personnes concernées | Agents mis en cause, témoins, conseil de discipline |
| Catégories de données | Faits reprochés, pièces du dossier, décisions, recours |
| Destinataires | DRH, conseil de discipline, hiérarchie habilitée, agent concerné, juridiction administrative en cas de recours |
| Conservation | Délai de prescription par sévérité + 5 ans après extinction du dossier |
| Sécurité | RBAC très restrictif, audit immutable |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DRH + Inspection des services |
| DPIA | Recommandée (sévérité élevée) — à programmer Vague B |

## T-07 — Scoring de risque de turnover (algorithmique)

| Item | Détail |
|---|---|
| Finalité | Identification des agents présentant un risque accru de départ pour appui RH |
| Base légale | Intérêt légitime de l'employeur public |
| Personnes concernées | Tous les agents |
| Catégories de données | Données dérivées du dossier (ancienneté, congés ouverts, perf, discipline, documents expirés) → score 0-100 décomposé par facteur |
| Destinataires | DRH (vue agrégée) ; vue individuelle réservée à hr_director avec motif obligatoire et audit |
| Conservation | Snapshots historiques 24 mois |
| Sécurité | Modèle **explicable** par règles pondérées (pas de boîte noire), RBAC restrictif, audit |
| Transferts hors GN | Aucun (calcul local) |
| Responsable opérationnel | DRH |
| DPIA | **DPIA-01 (scoring turnover)** |

## T-08 — Matching de CV par grand modèle de langage (LLM)

| Item | Détail |
|---|---|
| Finalité | Aide à la présélection des candidatures par scoring sémantique CV ↔ poste |
| Base légale | Mission de service public + consentement candidat |
| Personnes concernées | Candidats |
| Catégories de données | CV, fiche de poste ; en sortie : score, justification, indicateurs de confiance |
| Destinataires | Cellule recrutement (validation humaine **obligatoire**) |
| Conservation | Snapshot du score conservé pour audit pendant 1 an, puis purgé avec la candidature |
| Sécurité | Anonymisation du CV avant envoi LLM (PII removal), prompt système anti-discrimination explicite, validation humaine non écrasable |
| Transferts hors GN | Selon `LLM_PROVIDER` : Ollama local (zéro transfert, recommandé prod) ou Anthropic (US, opt-in nominatif documenté DPO) |
| Responsable opérationnel | Cellule recrutement |
| DPIA | **DPIA-02 (matching CV par LLM)** |

## T-09 — Assistant conversationnel (Prim'Assistant)

| Item | Détail |
|---|---|
| Finalité | Aider l'agent à effectuer ses démarches RH (consulter solde, demander congé, obtenir attestation) |
| Base légale | Intérêt légitime + consentement (catégorie cookie « ai_history ») |
| Personnes concernées | Agents |
| Catégories de données | Messages échangés, contexte agent (rôle, scope), historique local optionnel |
| Destinataires | Service IA (LLM) + utilisateur uniquement |
| Conservation | Historique local navigateur (effaçable par l'agent) |
| Sécurité | Contrôle d'autorisation par intent, confirmation utilisateur explicite avant action |
| Transferts hors GN | Selon `LLM_PROVIDER` (cf. T-08) |
| Responsable opérationnel | DSI + DRH |
| DPIA | **DPIA-04 (Prim'Assistant)** — recommandée Vague B |

## T-10 — Audit applicatif et journalisation

| Item | Détail |
|---|---|
| Finalité | Traçabilité des actions sensibles (création/modif/suppression, consultations sensibles, login) à des fins de sécurité, audit interne et contentieux |
| Base légale | Obligation légale + intérêt légitime (sécurité du SI) |
| Personnes concernées | Tous les utilisateurs |
| Catégories de données | Identifiant utilisateur, action, ressource cible, before/after JSONB, IP, user-agent, JTI |
| Destinataires | Administrateurs SI, auditeurs, DPO, Inspection des services |
| Conservation | 5 ans en chaud + archivage WORM 5 ans |
| Sécurité | Strip-PII des champs sensibles (cf. `app/core/logging.py`), scellement par hash chaîné prévu (Vague B), vue admin filtrée |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DSI |
| DPIA | Non requis |

## T-11 — Notifications (email + SMS + inbox)

| Item | Détail |
|---|---|
| Finalité | Informer les utilisateurs des évènements RH les concernant |
| Base légale | Exécution du contrat / mission de service public |
| Personnes concernées | Agents, candidats |
| Catégories de données | Adresse email, numéro mobile, contenu du message |
| Destinataires | Destinataire de la notification uniquement, opérateur SMS/SMTP |
| Conservation | Statut de livraison 90 jours ; contenu purgé selon catégorie |
| Sécurité | Templates Jinja2 versionnés, suppression PII non nécessaire, opt-out par catégorie |
| Transferts hors GN | Selon `SMS_PROVIDER` (Orange GN local recommandé) et `EMAIL_PROVIDER` (SMTP local) |
| Responsable opérationnel | DSI |
| DPIA | Non requis |

## T-12 — Authentification et MFA

| Item | Détail |
|---|---|
| Finalité | Vérifier l'identité de l'utilisateur, protéger l'accès |
| Base légale | Sécurité du SI |
| Personnes concernées | Tous les utilisateurs |
| Catégories de données | Identifiant, mot de passe haché bcrypt, secret TOTP chiffré Fernet, codes de récupération hachés, journal des connexions |
| Destinataires | DSI, DPO sur demande motivée |
| Conservation | Données auth conservées tant que le compte est actif ; logs de connexion 1 an |
| Sécurité | Bcrypt cost ≥ 12, MFA obligatoire pour rôles sensibles, rate-limit, refresh rotatif |
| Transferts hors GN | Aucun |
| Responsable opérationnel | DSI |
| DPIA | Non requis |

---

## DPIA — Liste des analyses d'impact

| ID | Traitement | Statut | Document |
|---|---|---|---|
| DPIA-01 | T-07 — Scoring turnover | À rédiger Sprint 3 | `docs/dpia/dpia-turnover.md` |
| DPIA-02 | T-08 — Matching CV LLM | À rédiger Sprint 3 | `docs/dpia/dpia-llm-matching-cv.md` |
| DPIA-03 | T-04 — Évaluation 360° | À rédiger Sprint 3 | `docs/dpia/dpia-evaluation-360.md` |
| DPIA-04 | T-09 — Prim'Assistant | Vague B | `docs/dpia/dpia-prim-assistant.md` |

---

## Procédure de mise à jour

Ce registre est mis à jour :

- à chaque ajout / modification / suppression d'un traitement,
- à chaque évolution réglementaire (loi 037/AN/2016 ou textes subséquents),
- au minimum **annuellement** par revue formelle conduite par le DPO.

Les modifications font l'objet d'un commit Git versionné (audit trail).

## Saisine externe

Toute personne concernée peut écrire à <code>dpo@prim.gov.gn</code> pour
obtenir copie du présent registre, exercer ses droits ou poser une question.

En cas de désaccord persistant, saisine possible de la **CNPDP-GN**
(coordonnées à insérer après désignation officielle).
