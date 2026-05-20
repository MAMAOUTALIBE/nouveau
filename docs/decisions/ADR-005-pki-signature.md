# ADR-005 — PKI signature électronique

* **Statut** : proposed
* **Date** : 2026-05-11
* **Sponsor** : DSI × DPO × juriste
* **Périmètre** : signature électronique des arrêtés et documents administratifs

## Contexte

L'application doit produire des documents administratifs signés (arrêtés,
attestations, procès-verbaux de commissions) ayant **valeur juridique
opposable**. Aujourd'hui, la signature est un stub SHA-256 maison, sans
valeur probante (cf. fiche `MODERNISATION_02_PERSONNEL_DOSSIERS.md` P2).

Le code embarque déjà un adapter `endesive_local` (PAdES) à compléter et un
mode mock.

## Options envisagées

### Option A — PKI Primature (CA interne souveraine)
- ✅ Souveraineté maximale
- ✅ Contrôle total certificats (émission, révocation)
- 🟡 Investissement initial ; doctrine PKI à formaliser
- 🟡 Reconnaissance par parties externes (justice, partenaires) à valider juridiquement

### Option B — Africa Trust Network (QTSP régional)
- ✅ Niveau eIDAS « Avancée » à « Qualifiée »
- ✅ Reconnaissance régionale CEDEAO
- 🟡 Coût par signature

### Option C — Universign / Yousign / DocuSign (QTSP UE)
- ✅ Niveau eIDAS « Qualifiée » disponible
- ❌ Sortie GN, dépendance étrangère
- 🟡 Coût par signature (~0.50–2 €/sig)

### Option D — Double signature (SHA-256 maison + tampon visuel)
- ❌ Sans valeur probante — non recommandé

## Décision

(à compléter)

Recommandation : **Option A (PKI Primature)** comme cible long terme,
**Option B (Africa Trust Network) ou C (Universign) en repli** pour Vague A
si délai d'établissement PKI > 4 semaines.

## Conséquences

* **À mettre en place** :
  - Choix CA + émission certificats serveur de signature
  - TSA RFC 3161 (cf. ADR-006)
  - Implémentation `backend/app/adapters/signature/endesive_local.py`
  - Endpoint vérification publique `/public/signature/verify/{code}`
  - Documentation valeur probante pour tribunaux administratifs

## Validation

* À valider semaine 0 du Sprint 0.
