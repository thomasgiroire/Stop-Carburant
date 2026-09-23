#!/bin/bash
set -e

# Stop-Carburant • Script unifié de Scraping et Ingestion du marché VE
# Usage:
#   npm run data:refresh
#   npm run data:refresh:mock
#   bash scripts/refresh_market_data.sh [--mock] [--source renew|spoticar|aramis] [--headful]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}⚡ STOP-CARBURANT • PIPELINE DE MISE À JOUR DU MARCHÉ${NC}"
echo "--------------------------------------------------------"

# 1. Sélection de l'interpréteur Python
PYTHON_BIN="python3"
if [ -d "scripts/scraper/venv" ] && [ -f "scripts/scraper/venv/bin/python" ]; then
    PYTHON_BIN="scripts/scraper/venv/bin/python"
    echo -e "🐍 Environnement Python : ${GREEN}venv dédié actif${NC} (scripts/scraper/venv)"
else
    echo -e "🐍 Environnement Python : ${YELLOW}Python système${NC} ($(which python3))"
fi

# 2. Gestion des arguments
SCRAPER_ARGS=()
for arg in "$@"; do
    case "$arg" in
        --mock|--mock-sample)
            SCRAPER_ARGS+=("--mock-sample")
            ;;
        *)
            SCRAPER_ARGS+=("$arg")
            ;;
    esac
done

# 3. Étape 1 : Collecte & Scraping des Prix Marché
echo -e "\n${BOLD}[1/4] Collecte des annonces professionnelles (prix marché)...${NC}"
$PYTHON_BIN scripts/scraper/scrape_market.py "${SCRAPER_ARGS[@]}"

# 4. Étape 2 : Collecte des Mesures Réelles La Chaîne EV
echo -e "\n${BOLD}[2/4] Collecte des mesures réelles IRL (La Chaîne EV)...${NC}"
$PYTHON_BIN scripts/scraper/scrape_lachaineev.py "${SCRAPER_ARGS[@]}"

# 5. Étape 3 : Ingestion des prix et découverte de nouveaux modèles
echo -e "\n${BOLD}[3/4] Ingestion des prix et vérification des garde-fous...${NC}"
node scripts/ingest_market_prices.js

# 6. Étape 4 : Compilation de la Base de Connaissances & Décotes IRL
echo -e "\n${BOLD}[4/4] Compilation des benchmarks et calcul des coefficients IRL...${NC}"
node scripts/compile_consumption_benchmarks.js

echo -e "\n${BOLD}${GREEN}🎉 Pipeline terminé avec succès ! Prix marché et consommations réelles Stop-Carburant sont à jour.${NC}\n"
