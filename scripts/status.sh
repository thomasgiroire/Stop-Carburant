#!/bin/bash

# Stop-Carburant Quick Status Inspector
# Inspects Docker, Stop-Carburant Container, Web App Port (3000), and Git status in < 1 second.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

PORT="${PORT:-3000}"

echo -e "${BOLD}${BLUE}⚡ Stop-Carburant Dev & Test Environment Status${NC} ($(date +'%T'))"
echo "--------------------------------------------------------"

# 1. Docker Status
DOCKER_AVAILABLE=false
if command -v docker >/dev/null 2>&1; then
    if docker info >/dev/null 2>&1; then
        echo -e "🐳 Docker Daemon       : ${GREEN}● En ligne${NC}"
        DOCKER_AVAILABLE=true
    else
        echo -e "🐳 Docker Daemon       : ${RED}● Inactif${NC} (Lancer Docker Desktop)"
    fi
else
    echo -e "🐳 Docker Daemon       : ${RED}● Non installé${NC}"
fi

# 2. Stop-Carburant Docker Containers
if [ "$DOCKER_AVAILABLE" = true ]; then
    WEB_STATUS=$(docker inspect --format '{{.State.Status}}' stop-carburant-web 2>/dev/null | tr -d '[:space:]')
    if [ "$WEB_STATUS" == "running" ]; then
        CONTAINER_PORT=$(docker port stop-carburant-web 3000/tcp 2>/dev/null | head -n1 | awk -F: '{print $NF}')
        echo -e "📦 Conteneur Web       : ${GREEN}● En cours d'exécution${NC} (Port Docker: ${CONTAINER_PORT:-3000})"
    elif [ -z "$WEB_STATUS" ] || [ "$WEB_STATUS" == "not_found" ]; then
        echo -e "📦 Conteneur Web       : ${YELLOW}○ Non créé${NC} (Lancer ./start.sh)"
    else
        echo -e "📦 Conteneur Web       : ${YELLOW}○ Arrêté ($WEB_STATUS)${NC} (Lancer ./start.sh)"
    fi
else
    echo -e "📦 Conteneur Web       : ${RED}○ Indisponible (Docker inactif)${NC}"
fi

# 3. Web Port (Port 3000)
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    PORT_PID=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $2}')
    PORT_CMD=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1}')
    echo -e "🌐 Port Web ($PORT)      : ${GREEN}● Actif${NC} (http://localhost:$PORT - $PORT_CMD [PID: $PORT_PID])"
else
    echo -e "🌐 Port Web ($PORT)      : ${YELLOW}○ Inoccupé${NC} (Lancer ./start.sh)"
fi

# 4. Git Status Overview
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "inconnu")
GIT_DIRTY=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$GIT_DIRTY" -eq 0 ]; then
    GIT_STATE="${GREEN}clean${NC}"
else
    GIT_STATE="${YELLOW}$GIT_DIRTY fichier(s) modifiés${NC}"
fi
echo -e "🌿 Branche Git         : ${CYAN}${GIT_BRANCH}${NC} ($GIT_STATE)"

echo "--------------------------------------------------------"
echo -e "💡 Commandes rapides :"
echo -e "   - Démarrer l'environnement : ${BOLD}./start.sh${NC} (ou ${BOLD}npm run dev:docker${NC})"
echo -e "   - Démarrer en arrière-plan : ${BOLD}./start.sh -d${NC}"
echo -e "   - Exécuter les tests       : ${BOLD}npm test${NC} (ou ${BOLD}./start.sh --test${NC})"
echo -e "   - Voir les logs Docker     : ${BOLD}./start.sh --logs${NC}"
echo -e "   - Arrêter le conteneur     : ${BOLD}./start.sh --stop${NC}"
echo -e "   - Forcer le redémarrage    : ${BOLD}./start.sh --force${NC}"
echo ""
