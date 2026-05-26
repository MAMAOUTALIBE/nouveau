# Présentation gouvernementale RH-ADMIN V1.0

Ce dossier centralise la **chaîne de documentation de présentation** à
destination des autorités gouvernementales guinéennes (Cabinet du Premier
ministre, DRH Primature, DSI, partenaires bailleurs).

## Contenu

| Fichier                                  | Rôle                                                                |
|------------------------------------------|---------------------------------------------------------------------|
| `PRESENTATION.md`                        | Document source Markdown du dossier de présentation                 |
| `SCRIPT_VIDEO.md`                        | Script vidéo timé (~7 min) pour la démo enregistrée                 |
| `captures/`                              | 15 captures PNG (1920×1080) générées par Playwright                 |
| `RH-ADMIN_Presentation_V1.0.docx`        | Document Word final, généré par pandoc                              |
| `README.md`                              | Ce fichier                                                          |

## Pré-requis

- L'application **doit déjà tourner en local** :
  - Backend FastAPI : `http://127.0.0.1:8000` (`npm run start:api`).
  - Frontend Angular : `http://127.0.0.1:4200` (`npm run start`).
- **Playwright** est installé (`npx playwright --version` doit répondre).
- **pandoc** est installé (`pandoc --version` doit répondre — tester
  `brew install pandoc` sur macOS sinon).
- Le compte de seed `spruko@admin.com` / `sprukoadmin` est présent dans la
  base (créé par `backend/scripts/seed_initial.py`).

## 1. Générer les captures d'écran

À la racine du repo :

```bash
npm run capture:screenshots
```

Cette commande lance Playwright avec la configuration dédiée
`playwright.capture.config.ts` et exécute `scripts/capture_screenshots.ts`.
Le script :

1. Capture la page de connexion sans authentification (`01-login.png`).
2. Pose une session valide via `POST /api/v1/auth/login` + bootstrap
   localStorage (rôle `super_admin`).
3. Navigue sur 14 pages clés et capture chacune dans
   `docs/presentation/captures/`.

Toute capture qui rate (route inexistante, redirect `/acces-refuse`,
timeout) émet un **warning** sans interrompre la suite. L'objectif
minimal est **≥ 12 captures sur 15**.

**Variante visible** (utile pour debug et pour vérifier visuellement les
captures) :

```bash
npm run capture:screenshots:headed
```

## 2. Compiler le document Word

```bash
npm run docs:build
# ou directement :
bash scripts/build_presentation_docx.sh
```

Le script `scripts/build_presentation_docx.sh` :

1. Vérifie la présence de pandoc.
2. Compte les captures (échoue si < 12).
3. Génère `RH-ADMIN_Presentation_V1.0.docx` à partir de `PRESENTATION.md`
   avec :
   - table des matières automatique (profondeur 2),
   - numérotation des sections,
   - métadonnée `lang:fr` (correcteur orthographique français).

## 3. Ajouter une nouvelle page à la présentation

1. **Capturer** la nouvelle page :
   - éditer `scripts/capture_screenshots.ts` et ajouter un appel
     `captureRoute(page, '/ma-route', 'XX-mon-nom.png', { waitMs: 1500 })` ;
   - relancer `npm run capture:screenshots`.
2. **Inclure** la capture dans le document :
   - éditer `docs/presentation/PRESENTATION.md` ;
   - ajouter une section avec `![Légende](captures/XX-mon-nom.png)` puis
     2 à 4 paragraphes pédagogiques en français.
3. **Recompiler** : `npm run docs:build`.

## 4. Filmer la démo vidéo

Suivre `SCRIPT_VIDEO.md`. Voir la section *Conseils de réalisation* en
fin de fichier pour les paramètres techniques (résolution, codec, voix-off,
montage).

## Dépannage

| Symptôme                                                     | Cause probable / action                                                                   |
|--------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| `Auth bootstrap failed (401)`                                | Le seed n'a pas tourné. Exécuter `python -m backend.scripts.seed_initial`.                |
| Plusieurs captures `redirect inattendu vers /auth/login`     | Le backend ne tourne pas ou retourne 401 sur `/api/v1/auth/login`. Vérifier `:8000`.      |
| Captures vides ou écran blanc                                | Le frontend Angular n'a pas fini de se compiler. Attendre `ng serve` puis relancer.       |
| `pandoc: command not found`                                  | Installer pandoc : `brew install pandoc` (macOS), `apt install pandoc` (Debian/Ubuntu).   |
| `.docx` généré mais sans images                              | Vérifier l'argument `--resource-path` du script et la présence de `captures/*.png`.       |

## Contraintes

- Aucune **PII réelle** ne doit figurer dans les captures. Le compte
  `spruko@admin.com` accède aux données de *seed* uniquement.
- Le `.docx` final est destiné à être **distribué aux autorités** : aucune
  information interne (URL de prod réelle, identifiants, IP) ne doit y
  apparaître. Relire avant diffusion.
