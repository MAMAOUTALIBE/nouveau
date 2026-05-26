#!/usr/bin/env bash
#
# Génère le document Word de présentation gouvernementale RH-ADMIN V1.0
# (cycle G2 — DRH Primature de Guinée) à partir du Markdown source et des
# captures Playwright.
#
# Usage :
#   bash scripts/build_presentation_docx.sh
#   # ou
#   npm run docs:build
#
# Prérequis :
#   - pandoc (testé sur 3.x)
#   - >= 12 captures PNG dans docs/presentation/captures/
#     (générées par `npm run capture:screenshots`)

set -euo pipefail

cd "$(dirname "$0")/.."

CAPTURES_DIR="docs/presentation/captures"
SOURCE_MD="docs/presentation/PRESENTATION.md"
OUTPUT_DOCX="docs/presentation/RH-ADMIN_Presentation_V1.0.docx"

# --- Vérif pandoc -----------------------------------------------------------
if ! command -v pandoc >/dev/null 2>&1; then
    echo "ERREUR : pandoc introuvable dans le PATH."
    echo "Installation : brew install pandoc   (macOS)"
    exit 2
fi

PANDOC_VERSION=$(pandoc --version | head -1 | awk '{print $2}')
echo "[docs:build] pandoc ${PANDOC_VERSION}"

# --- Vérif source -----------------------------------------------------------
if [ ! -f "$SOURCE_MD" ]; then
    echo "ERREUR : fichier source introuvable : $SOURCE_MD"
    exit 3
fi

# --- Vérif captures ---------------------------------------------------------
if [ ! -d "$CAPTURES_DIR" ]; then
    echo "ERREUR : répertoire captures introuvable : $CAPTURES_DIR"
    echo "Lance d'abord : npm run capture:screenshots"
    exit 4
fi

count=$(find "$CAPTURES_DIR" -name "*.png" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$count" -lt 12 ]; then
    echo "ERREUR : seulement $count captures trouvées dans $CAPTURES_DIR (minimum 12)."
    echo "Lance d'abord : npm run capture:screenshots"
    exit 5
fi
echo "[docs:build] ${count} captures détectées dans ${CAPTURES_DIR}"

# --- Génération .docx -------------------------------------------------------
echo "[docs:build] génération de ${OUTPUT_DOCX}..."

pandoc "$SOURCE_MD" \
    --from=markdown \
    --to=docx \
    --output="$OUTPUT_DOCX" \
    --resource-path="docs/presentation" \
    --table-of-contents \
    --toc-depth=2 \
    --number-sections \
    --metadata=lang:fr

# --- Résumé -----------------------------------------------------------------
if [ ! -f "$OUTPUT_DOCX" ]; then
    echo "ERREUR : le .docx n'a pas été créé."
    exit 6
fi

size=$(ls -lh "$OUTPUT_DOCX" | awk '{print $5}')
echo ""
echo "[docs:build] OK"
echo "  Fichier  : $OUTPUT_DOCX"
echo "  Taille   : $size"
echo "  Captures : $count incluses (référence relative captures/)"
