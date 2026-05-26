# Script vidéo de présentation RH-ADMIN V1.0 (~7 min)

**Audience** : Autorités gouvernementales — Cabinet du Premier ministre,
DRH Primature, DSI Primature, Cour des comptes, partenaires bailleurs.

**Format cible** : 1920×1080, 30 fps, MP4 H.264. Durée totale visée
**6:30 à 7:30**.

**Compte démo utilisé pour la prise** :
`spruko@admin.com` / `sprukoadmin` (compte de seed *développement*,
rôle `super_admin`).

---

## 0:00 – 0:30 — Introduction

**Plan visuel** : logo de la Primature de la République de Guinée en
ouverture (3 s), puis fondu vers la page de connexion de RH-ADMIN.

**Voix-off** :

> Bienvenue dans la présentation de **RH-ADMIN**, l'application de gestion
> des ressources humaines de la Primature de la République de Guinée.
>
> Conçue selon les **standards de sécurité gouvernementale** et conforme
> à la **loi 037/AN/2016** relative à la cybersécurité et à la protection
> des données à caractère personnel, RH-ADMIN couvre l'intégralité du
> cycle de vie des agents publics, du recrutement à la sortie.
>
> Cette démonstration en sept minutes parcourt les fonctionnalités
> principales et lève le voile sur les mécanismes de sécurité qui
> protègent les données sensibles.

---

## 0:30 – 1:30 — Connexion sécurisée et tableau de bord

**Plan visuel** : écran de connexion (capture 01). Curseur sur le champ
e-mail.

**Action 1** : saisir `spruko@admin.com` et `sprukoadmin`, cliquer sur
*Se connecter*.

**Voix-off pendant la saisie** :

> L'authentification utilise un **cookie chiffré `httpOnly`**, **invisible
> aux scripts** malveillants. Aucun jeton JWT n'est stocké dans le
> navigateur, ce qui neutralise les attaques de type XSS.

**Action 2** : Ouvrir les DevTools (F12), aller sur **Application →
Cookies → 127.0.0.1**, montrer le cookie `rh_access` avec les attributs
`HttpOnly ✓`, `SameSite=Lax`, `Secure` (en HTTPS prod).

**Action 3** : Aller sur **Application → Local Storage**, montrer
l'**absence** de clé `rh_token`.

**Voix-off** :

> Vous voyez ici, à droite, **aucun jeton d'accès** stocké côté
> JavaScript. Le navigateur transmet le cookie automatiquement, mais
> aucun script ne peut le lire.

**Plan visuel** : fermer les DevTools, basculer sur le tableau de bord
(capture 02). Pointer les KPIs.

**Voix-off** :

> Le **tableau de bord** offre une vue d'ensemble immédiate : effectif,
> alertes, échéances. Chaque widget est cliquable et conduit vers la
> liste filtrée correspondante.

---

## 1:30 – 3:30 — Module Personnel (cœur de la démo)

**Action 1** : Cliquer dans le menu sur **Personnel → Agents** (capture 03).

**Voix-off** :

> Le **module Personnel** est le pivot fonctionnel. Il centralise les
> dossiers administratifs des agents publics : identité, affectation,
> statut, historique complet.

**Action 2** : Saisir une partie de nom dans la barre de recherche,
montrer l'autocomplétion. Puis ouvrir un filtre avancé.

**Voix-off** :

> La recherche multi-critères et les filtres avancés permettent de
> retrouver instantanément un agent parmi plusieurs dizaines de
> milliers de dossiers.

**Action 3** : Cliquer sur le premier agent de la liste → ouvre la fiche
détaillée (capture 04). Parcourir les onglets.

**Voix-off** :

> La **fiche agent** présente toutes les informations en clair à
> l'écran : email, téléphone, numéro d'identification, date de
> naissance. Mais ces données sont **chiffrées au repos** dans la base.

**Action 4** : Revenir au menu, cliquer **Personnel → Nouvel agent**
(capture 05). Commencer à remplir un faux dossier avec un nom et une
date de naissance d'un agent existant.

**Voix-off** :

> Lors de la création d'un nouvel agent, le système détecte en temps
> réel les **doublons potentiels** grâce à un hash HMAC déterministe
> calculé sur les identifiants. L'opérateur est invité à confirmer ou à
> fusionner. Toute décision est tracée dans le journal d'audit.

---

## 3:30 – 4:30 — Documents et Congés

**Action 1** : Cliquer **Documents** (capture 07). Montrer la
bibliothèque.

**Voix-off** :

> Le **module Documents** centralise la bibliothèque RH : contrats,
> attestations, modèles. Chaque dépôt est filtré par type MIME, limité
> à 50 mégaoctets, et passé au scanner antivirus **ClamAV** avant
> stockage.

**Action 2** : (Optionnel) glisser-déposer un PDF pour démontrer la
validation. Montrer le toast de confirmation.

**Action 3** : Aller dans **Absences → Demandes** (capture 10).

**Voix-off** :

> Le **module Absences** gère les demandes de congé avec un workflow
> d'approbation à plusieurs niveaux. Le calendrier partagé permet
> d'anticiper les sous-effectifs par direction.

---

## 4:30 – 5:30 — La sécurité en coulisses (démonstration technique)

**Plan visuel** : revenir sur la fiche agent. Ouvrir DevTools → onglet
**Network**. Recharger la fiche.

**Action 1** : Cliquer sur la requête API qui renvoie le dossier agent,
onglet **Response**.

**Voix-off** :

> À l'écran, dans l'interface, l'email arrive en clair. C'est normal :
> l'utilisateur authentifié et habilité a le droit de voir cette
> donnée. Mais ce n'est pas ce qui est stocké dans la base.

**Action 2** : Basculer sur un terminal ouvert avec une connexion `psql`
préparée. Exécuter :

```sql
SELECT id, email_ciphertext FROM hr.employees LIMIT 3;
```

**Voix-off** :

> Voici la même donnée **côté base** : un **ciphertext Fernet** illisible,
> préfixé par la version de clé `kv1:`. Même un administrateur de la base
> de données ne peut pas lire l'email sans la clé de chiffrement, qui
> est stockée séparément.

**Action 3** : Exécuter :

```sql
SELECT before_data->>'email' AS email_avant
FROM hr.audit_logs
WHERE action = 'UPDATE' AND target_table = 'hr.employees'
ORDER BY created_at DESC LIMIT 3;
```

**Voix-off** :

> Et dans le **journal d'audit**, vous voyez ici la valeur rédigée
> automatiquement : `j***@gov.gn`. Cette rédaction est **transparente** :
> elle est appliquée par le type SQLAlchemy `RedactedJSONB`, sans que les
> développeurs aient à y penser.

---

## 5:30 – 6:30 — Backup, accessibilité, roadmap

**Plan visuel** : terminal.

**Action 1** : Exécuter :

```bash
bash scripts/test-backup-restore.sh
```

**Voix-off** :

> La **continuité d'activité** est validée chaque semaine par un script
> automatique : il prend un backup, le restaure dans une base temporaire,
> et vérifie l'intégrité. **Objectif RPO** : 1 jour ; **RTO** : 4 heures
> sur site de secours.

**Plan visuel** : revenir sur la liste des agents. Appuyer sur **Tab**
en haut de page pour faire apparaître le skip-link "Aller au contenu
principal".

**Voix-off** :

> Côté **accessibilité**, RH-ADMIN respecte les critères **WCAG 2.1 niveau
> AA** : navigation entièrement clavier, contraste vérifié en intégration
> continue, skip-links sur chaque page.

**Plan visuel** : afficher une slide texte courte avec la roadmap V1.1+.

**Voix-off** :

> La **version 1.0 livrée aujourd'hui est complète** sur son périmètre.
> Le backlog V1.1 prévoit l'authentification à deux facteurs TOTP,
> l'intégration au futur identifiant unique étatique OIDC national, et
> l'horodatage qualifié pour les actes administratifs sensibles.

---

## 6:30 – 7:00 — Conclusion

**Plan visuel** : retour sur le tableau de bord, puis fondu vers le logo
de la Primature.

**Voix-off** :

> **RH-ADMIN version 1.0** : une application moderne, sécurisée, et
> conforme aux exigences du cadre légal guinéen. Prête à servir la
> Fonction publique de la République de Guinée.
>
> Merci de votre attention.

---

## Conseils de réalisation

### Captation d'écran (macOS)

- **Enregistreur** : `Cmd + Shift + 5` (intégré macOS) ou OBS Studio
  pour un meilleur contrôle.
- **Résolution** : 1920×1080 (Full HD). Vérifier le `deviceScaleFactor`
  à 1 dans le navigateur.
- **Curseur** : activer "Show mouse clicks" dans QuickTime/OBS pour
  rendre les clics visibles.

### Voix-off

- **Enregistrement à part** (audio uniquement) puis montage en
  post-production. Cela permet plusieurs prises sans recommencer la
  démo écran.
- Voix calme, débit modéré (~150 mots/minute). Pauses entre les sections.
- Microphone cardioïde, traitement post : noise gate + égalisation
  douce + compression légère.

### Montage

- Logiciels suggérés : DaVinci Resolve (gratuit), Final Cut Pro,
  Adobe Premiere.
- Transitions sobres (fondu enchaîné court, jamais d'effet gratuit).
- Sous-titres FR encodés en dur ou en .srt pour l'accessibilité.

### Export final

- Format : **MP4 H.264**, débit ~10 Mbps.
- Résolution : 1920×1080, 30 fps.
- Audio : AAC 192 kbps stéréo.
- Cible : entre 6:30 et 7:30 (idéalement 7:00 pile).

### Données affichées

- Utiliser uniquement le **compte de seed dev** (`spruko@admin.com`).
- Ne **jamais** afficher de données d'un agent réel à l'écran.
- Avant la prise, **réinitialiser le seed** pour avoir un jeu de données
  cohérent (`python -m backend.scripts.seed_initial`).
