#!/usr/bin/env bash

# ==============================================================================
# STOP-CARBURANT — Script de démarrage de l'environnement Dev & Test (Docker)
# Inspiré de l'infrastructure DX de LineUP avec détection automatique de Docker,
# gestion des conflits de ports, exécution de tests conteneurisés et hot-reload.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Couleurs ANSI
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

DEFAULT_PORT=3000
PORT="${PORT:-$DEFAULT_PORT}"
DETACH=false
FORCE=false
BUILD=false
ACTION="start"

print_banner() {
  echo -e "${GREEN}${BOLD}"
  echo "╔════════════════════════════════════════════════════════════════════════╗"
  echo "║                   STOP-CARBURANT.FR // DEV & TEST                      ║"
  echo "║            ENVIRONNEMENT DOCKER POUR APPLICATION WEB REACT             ║"
  echo "╚════════════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_help() {
  echo -e "${BOLD}Usage:${NC} ./start.sh [OPTIONS]"
  echo ""
  echo -e "${BOLD}Options de démarrage :${NC}"
  echo "  (aucune)           Démarre en mode interactif avec logs en direct (Ctrl+C pour arrêter)"
  echo "  -d, --detach       Démarre le conteneur en arrière-plan (mode détaché)"
  echo "  -p, --port <port>  Spécifie un port externe personnalisé (défaut : 3000)"
  echo "  -b, --build        Force la reconstruction de l'image Docker avant démarrage"
  echo "  --force            Arrête automatiquement le processus occupant déjà le port"
  echo ""
  echo -e "${BOLD}Options d'exécution & Contrôle :${NC}"
  echo "  --test             Exécute la suite de tests Vitest dans le conteneur Docker"
  echo "  --stop, down       Arrête le conteneur Stop-Carburant"
  echo "  --restart          Redémarre le conteneur"
  echo "  --logs             Affiche les logs en temps réel du conteneur"
  echo "  --status           Affiche l'état des services et des ports (alias scripts/status.sh)"
  echo "  -h, --help         Affiche cette aide"
  echo ""
}

print_dev_links() {
  local target_port="$1"
  echo -e "🔗 ${BOLD}[LIENS] Liens d'accès direct :${NC}"
  echo -e "   - [APP WEB]      http://localhost:${target_port} (Simulateur d'économies de carburant)"
  echo -e "   - [OPEN DATA]    https://data.economie.gouv.fr (Flux instantané prix carburants)"
  echo ""
  echo -e "💡 ${BOLD}[PARCOURS TESTÉ] :${NC}"
  echo "   1. Étape 1 : Choix du budget mensuel carburant (ex: 200€) et km/jour (ex: 45 km)"
  echo "   2. Étape 2 : Mode de charge (Maison prise / Borne publique / Copropriété)"
  echo "   3. Étape 3 : Révélation financière (Mensualité VE d'occasion vs Dépense carburant)"
  echo "   4. Modale   : Détail mathématique et formules avec tarifs réglementés EDF"
}

# 1. Vérification & lancement automatique de Docker
check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker n'est pas installé sur ce système.${NC}"
    echo "Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop"
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker Daemon n'est pas actif.${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
      echo -e "⏳ Tentative de lancement de Docker Desktop sur macOS..."
      open -a Docker
      echo -n "⏳ Attente de Docker (max 30s) "
      for i in {1..30}; do
        if docker info >/dev/null 2>&1; then
          echo -e "\n${GREEN}✅ Docker est prêt !${NC}"
          sleep 2
          return 0
        fi
        echo -n "."
        sleep 1
      done
      echo ""
    fi

    echo -e "${RED}🛑 Erreur : Docker n'a pas pu être démarré ou ne répond pas.${NC}"
    echo "Veuillez démarrer Docker Desktop manuellement et relancer ./start.sh"
    exit 1
  fi
}

# 2. Analyse des ports
is_port_in_use() {
  local p="$1"
  lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
}

get_port_owner() {
  local p="$1"
  local info
  info=$(lsof -nP -iTCP:"$p" -sTCP:LISTEN 2>/dev/null | awk 'NR==2 {print $1 " (PID: " $2 ")"}')
  echo "${info:-processus externe}"
}

# Parsing des arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -d|--detach)
      DETACH=true
      shift
      ;;
    -p|--port)
      PORT="$2"
      shift 2
      ;;
    -b|--build)
      BUILD=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --test)
      ACTION="test"
      shift
      ;;
    --stop|down)
      ACTION="stop"
      shift
      ;;
    --restart)
      ACTION="restart"
      shift
      ;;
    --logs)
      ACTION="logs"
      shift
      ;;
    --status)
      ACTION="status"
      shift
      ;;
    -h|--help)
      print_banner
      print_help
      exit 0
      ;;
    *)
      echo -e "${RED}Argument inconnu : $1${NC}"
      print_help
      exit 1
      ;;
  esac
done

print_banner
check_docker

# Exécution selon l'action demandée
case "$ACTION" in
  status)
    bash scripts/status.sh
    exit 0
    ;;

  logs)
    echo -e "${CYAN}📜 Affichage des logs en direct (Ctrl+C pour quitter)...${NC}"
    docker compose logs -f web
    exit 0
    ;;

  stop)
    echo -e "${YELLOW}🛑 Arrêt des conteneurs Stop-Carburant...${NC}"
    PORT="$PORT" docker compose down
    echo -e "${GREEN}✅ Conteneurs arrêtés avec succès.${NC}"
    exit 0
    ;;

  restart)
    echo -e "${YELLOW}🔄 Redémarrage des conteneurs Stop-Carburant...${NC}"
    PORT="$PORT" docker compose down
    PORT="$PORT" docker compose up -d web
    sleep 3
    echo -e "${GREEN}✅ Conteneur redémarré sur http://localhost:${PORT}${NC}"
    exit 0
    ;;

  test)
    echo -e "${CYAN}🧪 Exécution de la suite de tests dans l'environnement Docker...${NC}"
    if [ "$BUILD" = true ]; then
      PORT="$PORT" docker compose build test
    fi
    PORT="$PORT" docker compose run --rm test
    exit $?
    ;;

  start)
    # Vérification de l'état du conteneur existant
    CONTAINER_RUNNING=$(docker inspect --format '{{.State.Status}}' stop-carburant-web 2>/dev/null || true)
    CONTAINER_RUNNING="$(echo "$CONTAINER_RUNNING" | tr -d '[:space:]')"
    if [ "$CONTAINER_RUNNING" == "running" ]; then
      CURRENT_PORT=$(docker port stop-carburant-web 3000/tcp 2>/dev/null | head -n1 | awk -F: '{print $NF}')
      echo -e "${GREEN}✅ Le conteneur Stop-Carburant est DÉJÀ en cours d'exécution sur le port ${CURRENT_PORT:-$PORT}.${NC}"
      echo "--------------------------------------------------------"
      print_dev_links "${CURRENT_PORT:-$PORT}"
      echo "--------------------------------------------------------"
      echo -e "💡 Astuces :"
      echo -e "   - Consulter les logs  : ${BOLD}./start.sh --logs${NC}"
      echo -e "   - Redémarrer          : ${BOLD}./start.sh --restart${NC}"
      echo -e "   - Arrêter le conteneur: ${BOLD}./start.sh --stop${NC}"
      exit 0
    fi

    # Gestion de l'occupation du port cible
    if is_port_in_use "$PORT"; then
      OWNER=$(get_port_owner "$PORT")
      if [ "$FORCE" = true ]; then
        echo -e "${YELLOW}⚠️  Port $PORT occupé par $OWNER. Arrêt forcé (--force)...${NC}"
        PID=$(lsof -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n1)
        if [ -n "$PID" ]; then
          kill -9 "$PID" 2>/dev/null || true
          sleep 1
          echo -e "${GREEN}✅ Processus $PID arrêté.${NC}"
        fi
      else
        echo -e "${RED}❌ Le port $PORT est déjà utilisé par : ${YELLOW}$OWNER${NC}"
        echo -e "Options :"
        echo -e "  1. Forcer la libération du port : ${BOLD}./start.sh --force${NC}"
        echo -e "  2. Utiliser un autre port :       ${BOLD}./start.sh -p 3001${NC}"
        exit 1
      fi
    fi

    # Build si demandé
    COMPOSE_ARGS=""
    if [ "$BUILD" = true ]; then
      COMPOSE_ARGS="$COMPOSE_ARGS --build"
    fi

    echo -e "${CYAN}🚀 Démarrage du conteneur Web Stop-Carburant (Port: $PORT)...${NC}"

    if [ "$DETACH" = true ]; then
      PORT="$PORT" docker compose up -d $COMPOSE_ARGS web
      sleep 2
      echo ""
      echo -e "${GREEN}✅ L'application web est prête en arrière-plan !${NC}"
      echo "--------------------------------------------------------"
      print_dev_links "$PORT"
      echo "--------------------------------------------------------"
      echo -e "Commandes utiles :"
      echo -e "   - Voir les logs :   ${BOLD}./start.sh --logs${NC}"
      echo -e "   - Exécuter tests :  ${BOLD}./start.sh --test${NC}"
      echo -e "   - Arrêter :         ${BOLD}./start.sh --stop${NC}"
    else
      # Mode interactif
      cleanup() {
        echo ""
        echo -e "${YELLOW}🛑 Arrêt du conteneur en cours...${NC}"
        PORT="$PORT" docker compose stop web >/dev/null 2>&1 || true
        echo -e "${GREEN}✅ Conteneur arrêté.${NC}"
        exit 0
      }
      trap cleanup SIGINT SIGTERM

      echo "--------------------------------------------------------"
      print_dev_links "$PORT"
      echo "--------------------------------------------------------"
      echo -e "(Appuyez sur ${BOLD}Ctrl+C${NC} pour arrêter le conteneur)"
      echo ""

      PORT="$PORT" docker compose up $COMPOSE_ARGS web
    fi
    ;;
esac
