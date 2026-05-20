# Plan de Mise en Œuvre : Modernisation de l'Application RH de la Primature

Ce document transforme les fonctionnalités restantes en roadmap technique détaillée afin de piloter la finalisation de l'outil de gestion RH. Il sert de base de cadrage pour l'équipe produit, l'équipe technique, les métiers RH et les parties prenantes de validation.

---

## 1. Objectifs de la Roadmap

- Automatiser les processus RH à forte charge administrative.
- Améliorer la fiabilité des données agents, candidats, congés, formations et carrières.
- Renforcer la traçabilité des décisions RH et des circuits de validation.
- Déployer progressivement les briques d'intelligence artificielle avec contrôle humain.
- Sécuriser les données personnelles et les pièces administratives sensibles.

## 2. Principes Techniques Directeurs

- **Architecture modulaire :** chaque domaine RH doit rester isolé fonctionnellement, avec des API internes documentées.
- **Traçabilité :** toute action automatisée doit générer un journal d'audit exploitable.
- **Validation humaine :** les décisions proposées par l'IA doivent rester validables, modifiables ou rejetables par un agent habilité.
- **Interopérabilité :** privilégier des connecteurs standards pour les workflows, le stockage documentaire, la signature électronique et les notifications.
- **Sécurité :** chiffrage des documents sensibles, contrôle d'accès par rôle et conservation conforme aux règles administratives.

---

## 3. Roadmap Technique par Phase

### Phase 1 : Socle Technique & Données RH
**Priorité : Haute**  
**Objectif :** stabiliser les fondations nécessaires aux modules avancés.

#### Chantiers Techniques

- Mettre à jour le modèle de données RH pour couvrir les agents, candidats, postes, pièces jointes, formations, congés, évaluations et workflows.
- Créer un référentiel documentaire unique pour les diplômes, actes de naissance, certificats, contrats, attestations et dossiers administratifs.
- Ajouter une couche d'audit centralisée pour tracer les créations, modifications, validations, rejets et exports.
- Définir les rôles applicatifs : administrateur RH, gestionnaire RH, responsable hiérarchique, agent, recruteur, auditeur.
- Formaliser les API internes entre les modules RH et le moteur de workflow.

#### Livrables

- Schéma de base de données cible.
- Matrice des rôles et permissions.
- Journal d'audit opérationnel.
- Documentation des API internes.
- Plan de migration des données existantes.

#### Critères d'Acceptation

- Chaque donnée sensible est rattachée à un propriétaire, un niveau d'accès et une politique de conservation.
- Les opérations critiques sont historisées avec utilisateur, date, action et objet concerné.
- Les modules existants continuent de fonctionner après migration.

---

### Phase 2 : Gestion du Personnel & Dossiers Administratifs
**Priorité : Haute**  
**Objectif :** automatiser l'alimentation, la vérification et l'export des dossiers agents.

#### 2.1 OCR Intelligent

**Description :** intégrer un service d'extraction de données pour préremplir les fiches agents lors de l'upload de diplômes, actes de naissance et autres pièces administratives.

**Approche Technique :**

- Comparer Azure Form Recognizer et AWS Textract selon la précision, le coût, la localisation des données et la facilité d'intégration.
- Créer un service `DocumentExtractionService` chargé de recevoir les fichiers, appeler le fournisseur OCR et normaliser les résultats.
- Définir des modèles de mapping par type de document : acte de naissance, diplôme, pièce d'identité, attestation.
- Ajouter une interface de revue humaine avant validation des champs extraits.
- Stocker les résultats bruts OCR et les corrections humaines pour améliorer les règles de mapping.

**Livrables :**

- Connecteur OCR configurable.
- File d'attente de traitement documentaire.
- Ecran de comparaison entre données extraites et données validées.
- Journal d'erreurs et tableau de suivi des documents en échec.

**Critères d'Acceptation :**

- Un document uploadé déclenche automatiquement une extraction.
- Les champs extraits sont proposés sans écraser les données existantes.
- Un gestionnaire RH peut corriger et valider les informations avant enregistrement.

#### 2.2 Analyse Prédictive du Turn-over

**Description :** développer un scoring de risque de départ basé sur les patterns de congés, d'activité, d'ancienneté, de mobilité et d'évaluation.

**Approche Technique :**

- Construire un dataset anonymisé avec les historiques de congés, évaluations, changements de poste, formations et absences.
- Définir un score explicable plutôt qu'un modèle opaque en première version.
- Identifier les variables métier validées par la DRH : ancienneté, fréquence des absences, baisse d'activité, mobilité bloquée, absence de formation récente.
- Créer un service `TurnoverRiskScoringService` retournant un niveau de risque : faible, moyen, élevé.
- Ajouter un tableau de bord agrégé par service, sans exposer inutilement des informations individuelles sensibles.

**Livrables :**

- Modèle de scoring version 1.
- Tableau de bord RH des risques agrégés.
- Fiche explicative des facteurs contribuant au score.
- Tests de cohérence sur données historiques.

**Critères d'Acceptation :**

- Le score est explicable pour chaque agent évalué.
- Le système ne prend aucune décision automatique de sanction ou de mobilité.
- Les résultats sont visibles uniquement par les rôles habilités.

#### 2.3 Portabilité des Données

**Description :** finaliser la génération de dossiers administratifs complets au format PDF, avec signature électronique et pièces jointes vérifiables.

**Approche Technique :**

- Créer un générateur de dossier administratif basé sur des templates PDF versionnés.
- Assembler automatiquement les données agent, historiques RH, pièces validées et attestations.
- Intégrer un prestataire de signature électronique conforme aux exigences administratives.
- Ajouter un QR code ou un identifiant de vérification pour contrôler l'authenticité du dossier.
- Conserver une empreinte numérique du dossier généré.

**Livrables :**

- Service de génération PDF.
- Templates officiels validés par la DRH.
- Connecteur de signature électronique.
- Historique des exports et téléchargements.

**Critères d'Acceptation :**

- Un gestionnaire RH peut générer un dossier complet en moins de quelques minutes.
- Le PDF généré contient les pièces attendues et les métadonnées d'authenticité.
- Toute génération est historisée dans le journal d'audit.

---

### Phase 3 : Recrutement & Onboarding
**Priorité : Haute**  
**Objectif :** fluidifier le passage du candidat vers le statut d'agent.

#### 3.1 Matching de CV par IA

**Approche Technique :**

- Extraire le texte des CV et lettres de motivation.
- Normaliser les compétences, expériences, diplômes et langues.
- Comparer les profils candidats avec les fiches de poste via scoring sémantique.
- Afficher les correspondances, écarts et points à vérifier.

**Livrables :**

- Service d'analyse de CV.
- Moteur de comparaison candidat-poste.
- Interface de classement des candidatures.

**Critères d'Acceptation :**

- Le recruteur voit un score et les raisons associées.
- Le score peut être ignoré ou ajusté par décision humaine.
- Les données candidates sont supprimables selon la politique de conservation.

#### 3.2 Assistant d'Entretien IA

**Approche Technique :**

- Générer une grille d'entretien à partir de la fiche de poste et du CV.
- Proposer des questions par compétence, expérience et point faible identifié.
- Permettre au recruteur d'éditer la grille avant usage.

**Livrables :**

- Générateur de grille d'entretien.
- Bibliothèque de questions RH validées.
- Export PDF ou partage interne de la grille.

**Critères d'Acceptation :**

- La grille générée reste modifiable.
- Les questions sensibles ou discriminatoires sont filtrées.
- L'entretien final est rattaché au dossier de candidature.

#### 3.3 Préparation Automatisée du Dossier Agent

**Approche Technique :**

- Créer un workflow de conversion candidat vers agent.
- Transférer les pièces jointes validées vers le dossier administratif.
- Initialiser le matricule, l'affectation, le poste, les droits applicatifs et le parcours d'onboarding.

**Livrables :**

- Script ou service de conversion.
- Checklist d'onboarding.
- Notification automatique aux services concernés.

**Critères d'Acceptation :**

- Un candidat retenu peut être transformé en agent sans ressaisie complète.
- Les pièces non validées ne sont pas transférées automatiquement.
- Le processus conserve l'historique de recrutement.

---

### Phase 4 : Congés & Temps de Travail
**Priorité : Moyenne**  
**Objectif :** optimiser la continuité du service public et réduire les validations manuelles répétitives.

#### 4.1 Optimisation des Plannings

**Approche Technique :**

- Modéliser les règles de présence minimale par service.
- Identifier les périodes critiques : clôtures, missions, événements institutionnels.
- Proposer des créneaux de congés compatibles avec la continuité du service.
- Signaler les conflits avant soumission.

**Livrables :**

- Moteur de règles de disponibilité.
- Vue planning par service.
- Suggestions de périodes de congés.

**Critères d'Acceptation :**

- Une demande de congé affiche son impact prévisionnel sur le service.
- Les responsables disposent d'une vue consolidée des absences.
- Les règles peuvent être ajustées sans modification du code.

#### 4.2 Automatisation de l'Approbation

**Approche Technique :**

- Configurer des règles d'auto-approbation pour les absences courtes sans impact opérationnel.
- Exclure automatiquement les cas sensibles : chevauchement critique, quota insuffisant, service sous-effectif.
- Notifier le responsable en cas d'approbation automatique.

**Livrables :**

- Moteur de décision pour les demandes simples.
- Historique des approbations automatiques.
- Paramétrage métier des règles.

**Critères d'Acceptation :**

- Les absences de moins de deux jours peuvent être approuvées automatiquement si toutes les conditions sont remplies.
- Le responsable peut auditer les décisions automatiques.
- Les cas ambigus restent soumis à validation humaine.

---

### Phase 5 : Performance, Carrière & GPEC
**Priorité : Moyenne**  
**Objectif :** structurer l'évaluation, la mobilité et l'anticipation des besoins en compétences.

#### 5.1 Évaluation à 360 degrés

**Approche Technique :**

- Définir les campagnes d'évaluation par période, service et population cible.
- Permettre la collecte anonymisée des retours de collègues, responsables et subordonnés.
- Consolider les résultats avec des indicateurs lisibles et non stigmatisants.

**Livrables :**

- Module de campagne d'évaluation.
- Formulaires configurables.
- Tableau de synthèse par agent et par service.

**Critères d'Acceptation :**

- L'anonymat est respecté selon un seuil minimal de répondants.
- Les résultats sont accessibles uniquement aux rôles autorisés.
- Les campagnes clôturées restent consultables et non modifiables.

#### 5.2 GPEC

**Approche Technique :**

- Créer un référentiel des compétences, métiers, postes et niveaux attendus.
- Cartographier les compétences déclarées, validées et manquantes.
- Identifier les écarts critiques par direction, service et poste stratégique.

**Livrables :**

- Référentiel compétences-postes.
- Cartographie interactive des compétences.
- Rapport des écarts prioritaires.

**Critères d'Acceptation :**

- La DRH peut visualiser les manques critiques par périmètre.
- Les compétences sont reliées aux formations et aux mobilités possibles.
- Les données peuvent être exportées pour arbitrage stratégique.

---

### Phase 6 : Formation & Développement
**Priorité : Basse**  
**Objectif :** mesurer l'impact réel des formations et automatiser les preuves de réussite.

#### 6.1 Évaluation à Froid

**Approche Technique :**

- Déclencher une relance trois mois après la date de fin de formation.
- Envoyer une notification à l'agent et, si nécessaire, au responsable.
- Consolider les réponses pour mesurer l'usage réel des compétences acquises.

**Livrables :**

- Planificateur de relances.
- Formulaire d'évaluation à froid.
- Tableau de mesure d'impact formation.

**Critères d'Acceptation :**

- Les relances sont envoyées automatiquement à échéance.
- Les réponses sont rattachées à la formation suivie.
- Les résultats alimentent le reporting formation.

#### 6.2 Automatisation des Certifications

**Approche Technique :**

- Générer automatiquement les certificats à partir de modèles validés.
- Conditionner l'émission du certificat à la présence, au score ou à la validation du formateur.
- Envoyer le certificat à l'agent et l'archiver dans son dossier.

**Livrables :**

- Moteur de génération de certificats.
- Templates de certificats.
- Archivage automatique dans le dossier agent.

**Critères d'Acceptation :**

- Un certificat est généré uniquement si les conditions de réussite sont remplies.
- Le certificat est accessible depuis le dossier agent.
- Les générations sont traçables.

---

### Phase 7 : Innovations Transverses
**Priorité : Haute**  
**Objectif :** standardiser les workflows RH et enrichir l'assistance numérique.

#### 7.1 Intégration Workflow BPMN

**Approche Technique :**

- Évaluer Camunda ou un moteur BPMN équivalent.
- Cartographier les circuits de validation existants : congés, attestations, recrutement, mobilité, formation.
- Exposer des événements métier pour déclencher, suspendre ou clôturer les workflows.
- Ajouter une console de suivi des validations en cours.

**Livrables :**

- Moteur BPMN intégré.
- Modèles de workflows RH prioritaires.
- Tableau de bord des validations.
- Historique complet des étapes et décisions.

**Critères d'Acceptation :**

- Chaque demande suit un circuit de validation explicite.
- Les retards et blocages sont visibles.
- Les règles de validation peuvent évoluer sans redéploiement complet.

#### 7.2 Amélioration de Prim'Assistant

**Approche Technique :**

- Connecter le chatbot aux API RH existantes avec contrôle d'autorisation.
- Permettre la soumission de demandes simples : congés, attestations, suivi de dossier.
- Ajouter une confirmation explicite avant toute création de demande.
- Prévoir un transfert vers un gestionnaire RH lorsque la demande est ambiguë.

**Livrables :**

- Intentions conversationnelles RH.
- Connecteurs API sécurisés.
- Historique des interactions utiles au support.

**Critères d'Acceptation :**

- Un agent peut initier une demande de congé ou d'attestation depuis Prim'Assistant.
- Le chatbot vérifie l'identité et les droits avant toute action.
- Aucune demande n'est créée sans confirmation finale de l'utilisateur.

---

## 4. Jalons de Livraison

| Jalons | Contenu | Priorité | Résultat attendu |
| --- | --- | --- | --- |
| Jalon 1 | Socle données, audit, rôles et référentiel documentaire | Haute | Base technique prête pour les modules avancés |
| Jalon 2 | OCR, dossiers administratifs et signature électronique | Haute | Dossiers agents enrichis et exportables |
| Jalon 3 | Recrutement IA et conversion candidat-agent | Haute | Onboarding accéléré et moins de ressaisie |
| Jalon 4 | Congés, règles d'auto-approbation et planning | Moyenne | Décisions plus rapides et continuité de service maîtrisée |
| Jalon 5 | Évaluation 360, GPEC et cartographie compétences | Moyenne | Pilotage RH stratégique renforcé |
| Jalon 6 | Formation, évaluations à froid et certificats | Basse | Suivi de l'impact formation automatisé |
| Jalon 7 | BPMN et Prim'Assistant enrichi | Haute | Workflows standardisés et accès simplifié aux services RH |

---

## 5. Risques et Mesures de Mitigation

| Risque | Impact | Mitigation |
| --- | --- | --- |
| Qualité insuffisante des données historiques | Scores IA peu fiables | Nettoyage, règles de validation et phase pilote |
| Données personnelles mal exposées | Risque juridique et réputationnel | RBAC strict, audit, chiffrement et minimisation |
| Adoption métier faible | Sous-utilisation des modules | Ateliers DRH, pilotes par service et formation utilisateurs |
| Dépendance forte à un fournisseur OCR ou signature | Coût et verrouillage technique | Interface fournisseur abstraite et configuration interchangeable |
| Automatisation excessive des décisions RH | Perte de contrôle métier | Validation humaine obligatoire pour les décisions sensibles |

---

## 6. Indicateurs de Suivi

- Taux de dossiers agents complets.
- Temps moyen de création ou mise à jour d'un dossier administratif.
- Pourcentage de documents traités automatiquement par OCR.
- Taux de correction humaine après OCR.
- Temps moyen de traitement d'une demande de congé.
- Nombre de workflows bloqués ou en retard.
- Taux de conversion candidat-agent sans ressaisie complète.
- Taux de participation aux évaluations 360.
- Couverture des compétences critiques dans la cartographie GPEC.
- Taux de certificats générés automatiquement après formation.

---

## 7. Prochaines Actions Recommandées

1. Valider le périmètre fonctionnel prioritaire avec la DRH.
2. Arbitrer le choix des fournisseurs OCR et signature électronique.
3. Finaliser le modèle de données cible et la matrice des droits.
4. Lancer un pilote sur le module Gestion du Personnel & Dossiers Administratifs.
5. Définir les workflows RH prioritaires à modéliser en BPMN.
6. Préparer un plan de migration et de nettoyage des données existantes.

---

*Dernière mise à jour : 28 avril 2026 - Roadmap technique de modernisation RH.*
