#!/usr/bin/env bash

# ==============================================================================
# STOP-CARBURANT — Script d'installation & configuration de l'environnement Dev
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${BLUE}🚀 Initialisation de l'environnement Stop-Carburant...${NC}"

# Permissions des scripts
echo -e "\n${BLUE}STEP 1: Permissions des scripts d'outillage...${NC}"
chmod +x start.sh scripts/status.sh setup.sh 2>/dev/null || true
echo -e "${GREEN}✅ start.sh, scripts/status.sh et setup.sh sont exécutables.${NC}"

# Vérification Node.js
echo -e "\n${BLUE}STEP 2: Vérification de Node.js...${NC}"
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js $(node -v) détecté.${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js n'est pas détecté en local.${NC}"
    echo "Vous pourrez néanmoins exécuter l'application entièrement dans Docker via ./start.sh"
fi

# Installation des dépendances locales
echo -e "\n${BLUE}STEP 3: Installation des dépendances npm...${NC}"
if command -v npm >/dev/null 2>&1; then
    npm install
    echo -e "${GREEN}✅ Dépendances installées avec succès.${NC}"
fi

# Vérification Docker
echo -e "\n${BLUE}STEP 4: Vérification de Docker...${NC}"
if command -v docker >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker CLI disponible : $(docker --version)${NC}"
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Démon Docker opérationnel.${NC}"
    else
        echo -e "${YELLOW}⚠️  Docker Daemon inactif. Il sera automatiquement lancé lors de l'exécution de ./start.sh.${NC}"
    fi
else
    echo -e "${RED}❌ Docker n'est pas installé. Veuillez installer Docker Desktop.${NC}"
fi

echo -e "\n${GREEN}${BOLD}✨ Environnement configuré !${NC}"
echo -e "Pour démarrer l'application dans Docker :"
echo -e "   ${BOLD}./start.sh${NC} (ou ${BOLD}npm run dev:docker${NC})"
echo -e "Pour vérifier l'état des services :"
echo -e "   ${BOLD}npm run status${NC}"
echo ""
